import { reactive, ref, watch } from 'vue'

// 任意 RxC 布局类型
export type FolderLayoutMode = `${number}x${number}`

// 桌面预设
export const DESKTOP_PRESETS = {
  compact: { gridRows: 1, gridCols: 8, gridGapX: 24, gridGapY: 32, boxSize: 72, label: '极简 1×8' },
  standard: { gridRows: 2, gridCols: 6, gridGapX: 32, gridGapY: 40, boxSize: 84, label: '标准 2×6' },
  spacious: { gridRows: 3, gridCols: 8, gridGapX: 40, gridGapY: 48, boxSize: 80, label: '宽敞 3×8' },
} as const

export type DesktopPreset = keyof typeof DESKTOP_PRESETS | 'custom'

interface Settings {
  openNewTab: boolean
  showClock: boolean
  showShortcuts: boolean
  showTodo: boolean
  dailyWallpaper: boolean
  todoDefaultCollapsed: boolean
  // [新增] 待办面板尺寸配置
  todoWidth: number
  todoListMaxHeight: number

  // [新增] 便签设置
  showNotePad: boolean
  notePadWidth: number
  notePadHeight: number
  notePadEditorMode: 'rich' | 'plain'
  compressImages: boolean
  maxImageSizeMB: number
  maxImageWidth: number

  deleteEmptyFolder: boolean
  folderPreviewMode: FolderLayoutMode
  folderInnerSpacing: number
  wallpaperBlur: number
  wallpaperMask: number
  gridRows: number
  gridCols: number
  gridGapX: number
  gridGapY: number
  compressLargeFolders: boolean

  // 桌面预设
  desktopPreset: DesktopPreset
  defaultFolderMode: FolderLayoutMode
  enableSmartFolderSuggestion: boolean

  // 布局
  layoutPaddingTop: number
  layoutGap: number

  // 搜索框
  showSearchBar: boolean
  showSearchIcon: boolean
  searchBarWidth: number
  searchBarHeight: number
  searchBarRadius: number
  searchBarOpacity: number

  // 天气
  weatherAutoLocation: boolean
  weatherCity: string

  // 番茄钟
  pomodoroWorkMinutes: number
  pomodoroBreakMinutes: number
  pomodoroAutoBreak: boolean
  pomodoroAutoWork: boolean
  pomodoroIntent: string
}

interface IconConfig {
  hideLabel: boolean
  boxSize: number
  iconScale: number
  radius: number
  opacity: number
  showShadow: boolean
}

const defaultSettings: Settings = {
  openNewTab: false,
  showClock: true,
  showShortcuts: true,
  showTodo: true,
  dailyWallpaper: false,
  todoDefaultCollapsed: false,
  // [新增] 默认值
  todoWidth: 320,
  todoListMaxHeight: 320,

  // [新增] 便签默认值
  showNotePad: true,
  notePadWidth: 320,
  notePadHeight: 280,
  notePadEditorMode: 'rich',
  compressImages: true,
  maxImageSizeMB: 1,
  maxImageWidth: 1200,

  deleteEmptyFolder: true,
  folderPreviewMode: '2x2',
  folderInnerSpacing: 8,
  wallpaperBlur: 0,
  wallpaperMask: 20,
  gridRows: 2,
  gridCols: 6,
  gridGapX: 32,
  gridGapY: 40,
  compressLargeFolders: true,

  // 桌面预设
  desktopPreset: 'standard',
  defaultFolderMode: '2x2',
  enableSmartFolderSuggestion: true,

  // 布局
  layoutPaddingTop: 22,
  layoutGap: 48,

  showSearchBar: true,
  showSearchIcon: true,
  searchBarWidth: 40,
  searchBarHeight: 64,
  searchBarRadius: 32,
  searchBarOpacity: 15,

  weatherAutoLocation: true,
  weatherCity: '',

  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  pomodoroAutoBreak: false,
  pomodoroAutoWork: false,
  pomodoroIntent: '',
}

const defaultIconConfig: IconConfig = {
  hideLabel: false,
  boxSize: 84,
  iconScale: 70,
  radius: 30,
  opacity: 40,
  showShadow: false,
}

// ... (以下代码保持不变)
const settings = reactive<Settings>({ ...defaultSettings })
const iconConfig = reactive<IconConfig>({ ...defaultIconConfig })

let isLoaded = false
const wallpaperTrigger = ref(0)

const loadSettings = () => {
  const s = localStorage.getItem('lime-settings')
  const i = localStorage.getItem('lime-icon-config')

  if (s) {
    try {
      const parsed = JSON.parse(s)
      Object.assign(settings, { ...defaultSettings, ...parsed })
    } catch (e) {
      console.error(e)
    }
  }

  if (i) {
    try {
      const parsed = JSON.parse(i)
      Object.assign(iconConfig, { ...defaultIconConfig, ...parsed })
    } catch (e) {
      console.error(e)
    }
  }
}

watch(settings, () => localStorage.setItem('lime-settings', JSON.stringify(settings)), {
  deep: true,
})
watch(iconConfig, () => localStorage.setItem('lime-icon-config', JSON.stringify(iconConfig)), {
  deep: true,
})

export function useSettings() {
  if (!isLoaded) {
    loadSettings()
    isLoaded = true
    localStorage.removeItem('loaded')
  }

  const resetSettings = () => {
    Object.assign(settings, defaultSettings)
    Object.assign(iconConfig, defaultIconConfig)
    wallpaperTrigger.value++
  }

  const forceWallpaperUpdate = () => {
    wallpaperTrigger.value++
  }

  return {
    settings,
    iconConfig,
    resetSettings,
    forceWallpaperUpdate,
    wallpaperTrigger,
  }
}
