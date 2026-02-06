export type ExportMode = 'theme' | 'full' | 'wallpaper'

export interface SyncData {
  v: 1
  t: number
  m: ExportMode
  d: {
    settings: Record<string, any>
    iconConfig: Record<string, any>
  }
  wallpaper?: string // Base64
}

export interface ImportResult {
  success: boolean
  data?: SyncData
  error?: string
}
