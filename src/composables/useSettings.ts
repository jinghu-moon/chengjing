import { reactive, ref, watch } from 'vue'
import type { Settings, IconConfig } from '../types'

// 桌面预设
export const DESKTOP_PRESETS = {
  compact: { gridRows: 1, gridCols: 8, gridGapX: 24, gridGapY: 32, boxSize: 72, label: '极简 1×8' },
  standard: { gridRows: 2, gridCols: 6, gridGapX: 32, gridGapY: 40, boxSize: 84, label: '标准 2×6' },
  spacious: { gridRows: 3, gridCols: 8, gridGapX: 40, gridGapY: 48, boxSize: 80, label: '宽敞 3×8' },
} as const



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

// 延迟启动 watch，避免初始化时触发循环
let watchersInitialized = false

const initWatchers = () => {
  if (watchersInitialized) return

  watch(settings, () => localStorage.setItem('lime-settings', JSON.stringify(settings)), {
    deep: true,
  })
  watch(iconConfig, () => localStorage.setItem('lime-icon-config', JSON.stringify(iconConfig)), {
    deep: true,
  })

  watchersInitialized = true
}

export function useSettings() {
  if (!isLoaded) {
    loadSettings()
    isLoaded = true
    // 数据加载完成后，启动 watchers
    setTimeout(() => initWatchers(), 0)
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
