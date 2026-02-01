/**
 * QR 二维码同步 Composable
 * 提供配置的二维码生成、扫描、导入功能
 *
 * 使用 Web Worker 进行编解码，保持 UI 流畅
 */

import { ref, computed, watch, shallowRef } from 'vue'
import { useSettings } from '@/composables/useSettings'
import { useQRWorker } from './useQRWorker'
import {
  encode,
  type ExportMode,
  type QRSyncPayload,
  type EncodeResult,
  MAX_QR_CHARS
} from '../utils/qr-codec'

// ============ 类型定义 ============

/** 扫描状态 */
export type ScanStatus = 'idle' | 'scanning' | 'success' | 'error'

/** 导入预览数据 */
export interface ImportPreview {
  payload: QRSyncPayload
  timestamp: Date
  mode: ExportMode
  settingsCount: number
  iconConfigCount: number
}

/** 扫描结果 */
export interface ScanResult {
  success: boolean
  preview?: ImportPreview
  error?: string
}

// ============ 二维码扫描器 ============

/**
 * 扫描图片中的二维码
 * 优先使用原生 BarcodeDetector，不支持时动态加载 qr-scanner
 */
async function scanImageForQR(imageSource: ImageBitmapSource): Promise<string> {
  console.log('[QR Scan] Starting scan...', imageSource)

  // 优先使用原生 BarcodeDetector API
  if ('BarcodeDetector' in window) {
    console.log('[QR Scan] Using native BarcodeDetector')
    try {
      const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
      const results = await detector.detect(imageSource)
      console.log('[QR Scan] Native results:', results)
      
      if (results.length > 0) {
        return results[0].rawValue
      }
      console.warn('[QR Scan] Native detector found no QR code')
    } catch (e) {
      console.error('[QR Scan] Native detector failed:', e)
    }
  } else {
      console.log('[QR Scan] BarcodeDetector not supported in this browser')
  }

  // 降级：动态加载 qr-scanner
  console.log('[QR Scan] Fallback to qr-scanner')
  try {
    const { default: QrScanner } = await import('qr-scanner')
    
    // 转换源以便调试
    console.log('[QR Scan] Image source type:', Object.prototype.toString.call(imageSource))

    // 将 ImageBitmapSource 转换为适合 qr-scanner 的格式
    if (imageSource instanceof Blob) {
        return await QrScanner.scanImage(imageSource) as string
    }

    // 如果是 HTMLImageElement，直接传给 qr-scanner
    if (imageSource instanceof HTMLImageElement) {
        // 确保图片已加载
        if (!imageSource.complete || imageSource.naturalWidth === 0) {
           await new Promise((resolve) => {
              imageSource.onload = resolve
              setTimeout(resolve, 500) // 超时保护
           })
        }

        // @ts-ignore
        const result = await QrScanner.scanImage(imageSource, { returnDetailedScanResult: false, alsoTryWithoutScanRegion: true, inversionAttempts: 'attemptBoth' })
        
        // 处理可能返回对象的情况
        if (typeof result === 'object' && result !== null && 'data' in result) {
            return (result as any).data
        }
        return result as string
    }

    // 其他情况（如 Canvas）
    // @ts-ignore
    const result = await QrScanner.scanImage(imageSource, { returnDetailedScanResult: false, alsoTryWithoutScanRegion: true, inversionAttempts: 'attemptBoth' })
    if (typeof result === 'object' && result !== null && 'data' in result) {
        return (result as any).data
    }
    return result as string
  } catch (e) {
      console.error('[QR Scan] qr-scanner failed:', e)
      throw e
  }
}

// ============ State (Singleton) ============
const exportMode = ref<ExportMode>('full')
const scanStatus = ref<ScanStatus>('idle')
const scanError = ref<string>('')
const importPreview = ref<ImportPreview | null>(null)

// Worker 编码结果缓存（初始为空，由 Worker 填充）
const encodeResultCache = shallowRef<EncodeResult>({
  payload: '',
  size: 0,
  isOverLimit: false
})
const isEncoding = ref(false)
const isInitialized = ref(false)
const encryptionPassword = ref('')

// 跨组件共享的防抖 timer（Module Scope 单例）
let encodeTimer: ReturnType<typeof setTimeout> | null = null
let watcherRegistered = false

export function useQRSync() {
  const { settings, iconConfig } = useSettings()
  const { encodeAsync, decodeAsync } = useQRWorker()

  // ============ 编码相关 ============

  /**
   * 编码结果（完全依赖 Worker 异步计算）
   * 通过 watch 触发更新，主线程零负载
   */
  const encodeResult = computed<EncodeResult>(() => encodeResultCache.value)

  // 初始化：首次同步编码（避免空白状态）
  if (!isInitialized.value) {
    encodeResultCache.value = encode(
      { ...settings },
      { ...iconConfig },
      exportMode.value
    )
    isInitialized.value = true
  }

  // 注册 watcher（仅首次调用时注册，避免重复）
  if (!watcherRegistered) {
    watcherRegistered = true

    // 监听变化，Worker 异步更新（防抖 50ms）
    watch(
      [() => JSON.stringify(settings), () => JSON.stringify(iconConfig), exportMode, encryptionPassword],
      async () => {
        if (encodeTimer) clearTimeout(encodeTimer)
        encodeTimer = setTimeout(async () => {
          isEncoding.value = true
          try {
            const result = await encodeAsync(
              { ...settings },
              { ...iconConfig },
              exportMode.value,
              encryptionPassword.value
            )
            encodeResultCache.value = result
          } catch (e) {
            console.error('[QR Worker] 编码失败，降级到同步:', e)
            // 降级：Worker 失败时使用同步编码 (注意：同步编码不支持加密)
            if (encryptionPassword.value) {
               console.warn('[QR Worker] 同步编码不支持加密')
            }
            encodeResultCache.value = encode(
              { ...settings },
              { ...iconConfig },
              exportMode.value
            )
          } finally {
            isEncoding.value = false
          }
        }, 50)
      },
      { immediate: false }
    )
  }

  /** 是否超出二维码容量 */
  const isOverLimit = computed(() => encodeResult.value.isOverLimit)

  /** 预估大小（字符数） */
  const payloadSize = computed(() => encodeResult.value.size)

  /** 预估大小（KB） */
  const payloadSizeKB = computed(() => (payloadSize.value / 1024).toFixed(2))

  // ============ 生成相关 ============

  /** 获取编码后的 payload 字符串 */
  function getPayload(): string {
    return encodeResult.value.payload
  }

  /** 生成智能文件名 */
  function generateFileName(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const modeLabel = exportMode.value === 'theme' ? 'Theme' : 'Full'
    return `ChengJing_${modeLabel}_${date}.png`
  }

  // ============ 扫描相关 ============

  /** 从文件扫描二维码 */
  async function scanFromFile(file: File, password?: string): Promise<ScanResult> {
    console.group('[QR Import] 从文件扫描')
    console.log('文件名:', file.name)
    console.log('文件大小:', (file.size / 1024).toFixed(2), 'KB')
    console.log('文件类型:', file.type)

    scanStatus.value = 'scanning'
    scanError.value = ''
    importPreview.value = null

    try {
      // 创建图片对象
      console.log('步骤1: 创建图片对象...')
      const img = await createImageFromFile(file)
      console.log('图片尺寸:', img.naturalWidth, 'x', img.naturalHeight)

      // 扫描二维码
      console.log('步骤2: 扫描二维码...')
      const qrContent = await scanImageForQR(img)
      console.log('扫描结果长度:', qrContent.length)
      console.log('扫描结果前100字符:', qrContent.substring(0, 100))

      // 解码内容
      console.log('步骤3: 解码内容 (Worker)...')
      const decodeRes = await decodeAsync(qrContent, password)

      if (!decodeRes.success || !decodeRes.data) {
        throw new Error(decodeRes.error || '解码失败')
      }

      // 构建预览数据
      console.log('步骤4: 构建预览数据...')
      const preview = buildPreview(decodeRes.data)
      importPreview.value = preview
      scanStatus.value = 'success'

      console.log('扫描成功!')
      console.groupEnd()
      return { success: true, preview }
    } catch (e: any) {
      console.error('扫描失败:', e.message || e)
      console.groupEnd()
      scanStatus.value = 'error'
      // 传递具体的错误信息 (如 REQUIRED_PASSWORD)
      scanError.value = e.message || '扫描失败'
      return { success: false, error: scanError.value }
    }
  }

  /** 从剪贴板图片扫描 */
  async function scanFromClipboard(blob: Blob, password?: string): Promise<ScanResult> {
    console.log('[QR Import] 从剪贴板扫描, 大小:', (blob.size / 1024).toFixed(2), 'KB')
    // 复用文件扫描逻辑
    const file = new File([blob], 'clipboard.png', { type: blob.type })
    return scanFromFile(file, password)
  }

  /** 从文本解析 (异步 Worker) */
  async function parseFromText(text: string, password?: string): Promise<ScanResult> {
    console.group('[QR Import] 从文本解析 (Worker)')
    console.log('输入文本长度:', text.length)

    scanStatus.value = 'scanning'
    scanError.value = ''
    importPreview.value = null

    try {
      const decodeRes = await decodeAsync(text.trim(), password)

      if (!decodeRes.success || !decodeRes.data) {
        throw new Error(decodeRes.error || '解码失败')
      }

      const preview = buildPreview(decodeRes.data)
      importPreview.value = preview
      scanStatus.value = 'success'

      console.log('解析成功!')
      console.groupEnd()
      return { success: true, preview }
    } catch (e: any) {
      console.error('解析失败:', e.message || e)
      console.groupEnd()
      scanStatus.value = 'error'
      scanError.value = e.message || '解析失败'
      return { success: false, error: scanError.value }
    }
  }

  // ============ 导入相关 ============

  /** 应用导入的配置 */
  function applyImport(): boolean {
    console.group('[QR Import] 应用配置')

    if (!importPreview.value) {
      console.warn('无预览数据，取消应用')
      console.groupEnd()
      return false
    }

    try {
      const { payload } = importPreview.value
      const { settings: newSettings, iconConfig: newIconConfig } = payload.d as {
        settings: Record<string, any>
        iconConfig: Record<string, any>
      }

      console.log('待应用 settings 字段数:', newSettings ? Object.keys(newSettings).length : 0)
      console.log('待应用 iconConfig 字段数:', newIconConfig ? Object.keys(newIconConfig).length : 0)

      // 合并设置
      if (newSettings) {
        console.log('合并 settings:', newSettings)
        Object.assign(settings, newSettings)
      }

      // 合并图标配置
      if (newIconConfig) {
        console.log('合并 iconConfig:', newIconConfig)
        Object.assign(iconConfig, newIconConfig)
      }

      // 清理状态
      resetScanState()
      console.log('应用成功!')
      console.groupEnd()
      return true
    } catch (e) {
      console.error('应用配置失败:', e)
      console.groupEnd()
      return false
    }
  }

  /** 取消导入 */
  function cancelImport(): void {
    resetScanState()
  }

  // ============ 辅助函数 ============

  /** 从文件创建图片对象 */
  function createImageFromFile(file: File): Promise<HTMLImageElement> {
    console.log('[QR Import] 创建图片对象, 文件:', file.name)
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        console.log('[QR Import] 图片加载成功, 尺寸:', img.naturalWidth, 'x', img.naturalHeight)
        URL.revokeObjectURL(img.src)
        resolve(img)
      }
      img.onerror = (e) => {
        console.error('[QR Import] 图片加载失败:', e)
        URL.revokeObjectURL(img.src)
        reject(new Error('图片加载失败'))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  /** 构建预览数据 */
  function buildPreview(payload: QRSyncPayload): ImportPreview {
    console.log('[QR Import] 构建预览数据')
    const { settings: s, iconConfig: i } = payload.d as {
      settings?: Record<string, any>
      iconConfig?: Record<string, any>
    }

    const preview = {
      payload,
      timestamp: new Date(payload.t),
      mode: payload.m,
      settingsCount: s ? Object.keys(s).length : 0,
      iconConfigCount: i ? Object.keys(i).length : 0
    }

    console.log('预览数据:', {
      mode: preview.mode,
      timestamp: preview.timestamp.toLocaleString(),
      settingsCount: preview.settingsCount,
      iconConfigCount: preview.iconConfigCount
    })

    return preview
  }

  /** 重置扫描状态 */
  function resetScanState(): void {
    scanStatus.value = 'idle'
    scanError.value = ''
    importPreview.value = null
  }

  return {
    // 状态
    exportMode,
    encryptionPassword,
    scanStatus,
    scanError,
    importPreview,
    isEncoding,

    // 计算属性
    encodeResult,
    isOverLimit,
    payloadSize,
    payloadSizeKB,

    // 常量
    MAX_QR_CHARS,

    // 方法
    getPayload,
    generateFileName,
    scanFromFile,
    scanFromClipboard,
    parseFromText,
    applyImport,
    cancelImport,
    resetScanState
  }
}
