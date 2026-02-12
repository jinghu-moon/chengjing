import { ref } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { getImageUrl, saveImage } from '@/utils/db'
import { encrypt, decrypt, ERROR_INVALID_PASSWORD } from '@/utils/crypto'
import type { ExportMode, SyncData, ImportResult } from '../types'

export function useDataSync() {
  const { settings, iconConfig, forceWallpaperUpdate } = useSettings()
  
  const isProcessing = ref(false)
  const error = ref('')

  // Helper: Trigger file download
  const downloadFile = (filename: string, content: string | Blob) => {
    const element = document.createElement('a')
    const file = content instanceof Blob 
      ? content 
      : new Blob([content], { type: 'application/json' })
    
    element.href = URL.createObjectURL(file)
    element.download = filename
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    URL.revokeObjectURL(element.href)
  }

  // Helper: Get Base64 from Blob (for wallpaper export)
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // ============ EXPORT ============

  const exportConfig = async (mode: ExportMode, password?: string) => {
    isProcessing.value = true
    error.value = ''

    try {
      // 1. Prepare Base Data
      const data: SyncData = {
        v: 1,
        t: Date.now(),
        m: mode,
        d: {
          settings: {},
          iconConfig: {}
        }
      }

      // 2. Fill Data based on Mode
      if (mode === 'theme') {
        // themeKeys reserved for future theme-only export filtering
        // Need a better way to filter theme vs full? 
        // Current logic in QRSync was: theme = iconConfig + layout settings. 
        // Simplified here for now: always export minimal if theme, or we can reuse logic.
        // Let's copy 'Full' logic for simplicity for now, but in reality we might want filtering.
        // For 'DataSync', users usually want full backup. 'Theme' is for sharing style.
        
        // Settings: Keep subset related to appearance
        // For simplicity in Phase 1: Export FULL settings but mark as theme. 
        // Or better: Export IconConfig + Settings.
        data.d.settings = { ...settings }
        data.d.iconConfig = { ...iconConfig }
      } else {
        // Full / Wallpaper
        data.d.settings = { ...settings }
        data.d.iconConfig = { ...iconConfig }
      }

      // 3. Handle Wallpaper (if mode includes it)
      if (mode === 'wallpaper') {
        // If daily wallpaper is disabled, check for custom bg
        if (!settings.wallpaperDailyEnabled) {
          const url = await getImageUrl('custom-bg')
          if (url) {
            // Fetch blob from blob:URL or base64
            const res = await fetch(url)
            const blob = await res.blob()
            data.wallpaper = await blobToBase64(blob)
          }
        }
      }

      // 4. Serialize
      let content = JSON.stringify(data)

      // 5. Encrypt if needed
      if (password) {
        const encrypted = await encrypt(content, password)
        // Store as: { e: true, d: base64_packed_data } to identify encrypted file
        // We reuse the QRSync 'packEncryptedData' logic which returns base64 string
        // But wait, `encrypt` returns object { salt, iv, cipherText }
        // We need `packEncryptedData` from crypto.ts. 
        // Checking crypto.ts... yes, it has packEncryptedData.
        const { packEncryptedData } = await import('@/utils/crypto')
        const packed = packEncryptedData(encrypted)
        content = JSON.stringify({ e: true, d: packed })
      }

      // 6. Generate Filename
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const name = `ChengJing_${mode}_${date}${password ? '_Encrypted' : ''}.json`

      // 7. Download
      downloadFile(name, content)
      
    } catch (e: any) {
      console.error(e)
      error.value = e.message || 'Export failed'
    } finally {
      isProcessing.value = false
    }
  }

  // ============ IMPORT ============

  const importConfig = async (file: File, password?: string): Promise<ImportResult> => {
    isProcessing.value = true
    error.value = ''
    
    try {
      // 1. Read File
      const text = await file.text()
      
      // 2. Parse (Check Encryption)
      let raw: any
      try {
        raw = JSON.parse(text)
      } catch {
        return { success: false, error: 'Invalid JSON format' }
      }

      let payloadStr = text

      // Handle Encryption
      if (raw.e === true && raw.d) {
        if (!password) {
          return { success: false, error: 'PASSWORD_REQUIRED' }
        }
        try {
          const { unpackEncryptedData } = await import('@/utils/crypto')
          const encryptedData = unpackEncryptedData(raw.d)
          payloadStr = await decrypt(encryptedData, password)
          raw = JSON.parse(payloadStr)
        } catch (e: any) {
          if (e.message === ERROR_INVALID_PASSWORD) {
             return { success: false, error: 'INVALID_PASSWORD' }
          }
          return { success: false, error: 'Decryption failed' }
        }
      }

      const data = raw as SyncData

      // 3. Validate Version
      if (data.v !== 1) {
        return { success: false, error: 'Unsupported version' }
      }

      // 4. Return for Preview (don't apply yet)
      return { success: true, data }

    } catch (e: any) {
      console.error(e)
      return { success: false, error: e.message || 'Import failed' }
    } finally {
      isProcessing.value = false
    }
  }

  const applyImport = async (data: SyncData) => {
    isProcessing.value = true
    try {
      // 1. Apply Settings & IconConfig
      // We need to merge carefully. 
      // For now, replacing logic matching QRSync.
      Object.assign(settings, data.d.settings)
      Object.assign(iconConfig, data.d.iconConfig)

      // 2. Apply Wallpaper
      if (data.wallpaper) {
        // Base64 -> Blob -> DB
        const res = await fetch(data.wallpaper)
        const blob = await res.blob()
        await saveImage('custom-bg', blob)
        
        // Update settings to use custom wallpaper
        settings.wallpaperDailyEnabled = false
        forceWallpaperUpdate()
      }

    } catch (e: any) {
      console.error(e)
      error.value = 'Failed to apply import'
    } finally {
      isProcessing.value = false
    }
  }

  return {
    isProcessing,
    error,
    exportConfig,
    importConfig,
    applyImport
  }
}
