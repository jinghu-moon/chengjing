import { reactive, ref, watch } from 'vue'
import type { Settings, IconConfig, DesktopPreset, FolderLayoutMode } from '../types'

// 桌面预设
export const DESKTOP_PRESETS = {
  compact: { gridRows: 1, gridCols: 8, gridGapX: 24, gridGapY: 32, boxSize: 72, label: '极简 1×8' },
  standard: { gridRows: 2, gridCols: 6, gridGapX: 32, gridGapY: 40, boxSize: 84, label: '标准 2×6' },
  spacious: { gridRows: 3, gridCols: 8, gridGapX: 40, gridGapY: 48, boxSize: 80, label: '宽敞 3×8' },
} as const

// 默认设置 (使用新命名规范)
const defaultSettings: Settings = {
  // General
  generalOpenInNewTab: false,

  // Clock
  clockShow: true,

  // Shortcuts
  shortcutsShow: true,

  // Todo
  todoShow: true,
  todoDefaultCollapsed: false,
  todoWidth: 320,
  todoListMaxHeight: 320,

  // Wallpaper
  wallpaperDailyEnabled: false,
  wallpaperBlur: 0,
  wallpaperMask: 20,

  // NotePad
  notePadShow: true,
  notePadWidth: 320,
  notePadHeight: 280,
  notePadEditorMode: 'rich',
  notePadImageCompress: true,
  notePadImageMaxSizeMB: 1,
  notePadImageMaxWidth: 1200,

  // Folder
  folderAutoCleanEmpty: true,
  folderPreviewMode: '2x2',
  folderInnerSpacing: 8,
  folderCompressLarge: true,
  folderDefaultMode: '2x2',
  folderSmartSuggestion: true,

  // Layout
  layoutPreset: 'standard',
  layoutGridRows: 2,
  layoutGridCols: 6,
  layoutGridGapX: 32,
  layoutGridGapY: 40,
  layoutPaddingTop: 22,
  layoutGap: 48,

  // SearchBar
  searchBarShow: true,
  searchBarShowIcon: true,
  searchBarWidth: 40,
  searchBarHeight: 64,
  searchBarRadius: 32,
  searchBarOpacity: 15,

  // Weather
  weatherAutoLocation: true,
  weatherCity: '',

  // Pomodoro
  pomodoroWorkMinutes: 25,
  pomodoroBreakMinutes: 5,
  pomodoroAutoBreak: false,
  pomodoroAutoWork: false,
  pomodoroIntent: '',

  // Calculator
  calculatorShow: true,

  // Poem
  poemShow: true,
  poemFetchOnline: false,
}

// 迁移映射表：旧键 -> 新键
export const SETTINGS_MIGRATION_MAP: Record<string, string> = {
  // General
  openNewTab: 'generalOpenInNewTab',
  // Clock
  showClock: 'clockShow',
  // Wallpaper
  dailyWallpaper: 'wallpaperDailyEnabled',
  // Layout
  desktopPreset: 'layoutPreset',
  gridRows: 'layoutGridRows',
  gridCols: 'layoutGridCols',
  gridGapX: 'layoutGridGapX',
  gridGapY: 'layoutGridGapY',
  // SearchBar
  showSearchBar: 'searchBarShow',
  showSearchIcon: 'searchBarShowIcon',
  // Shortcuts
  showShortcuts: 'shortcutsShow',
  // Folder
  deleteEmptyFolder: 'folderAutoCleanEmpty',
  compressLargeFolders: 'folderCompressLarge',
  defaultFolderMode: 'folderDefaultMode',
  enableSmartFolderSuggestion: 'folderSmartSuggestion',
  // Todo
  showTodo: 'todoShow',
  // NotePad
  showNotePad: 'notePadShow',
  compressImages: 'notePadImageCompress',
  maxImageSizeMB: 'notePadImageMaxSizeMB',
  maxImageWidth: 'notePadImageMaxWidth',
  // Calculator
  showCalculator: 'calculatorShow',
  // Poem
  showDailyPoem: 'poemShow',
  dailyPoemOnline: 'poemFetchOnline',
}

const defaultIconConfig: IconConfig = {
  hideLabel: false,
  boxSize: 84,
  iconScale: 70,
  radius: 30,
  opacity: 40,
  showShadow: false,
}

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

      // 执行迁移逻辑
      let migrated = false
      Object.keys(parsed).forEach(key => {
        const newKey = SETTINGS_MIGRATION_MAP[key]
        if (newKey && parsed[key] !== undefined) {
           parsed[newKey] = parsed[key]
           // 删除旧键，避免污染 settings 对象
           delete parsed[key]
           migrated = true
        }
      })

      if (migrated) {
        console.log('[Settings] Migrated old settings to new format.')
      }

      // 只保留 defaultSettings 中定义的键，过滤掉未知字段
      const validKeys = Object.keys(defaultSettings)
      const filteredParsed = Object.fromEntries(
        Object.entries(parsed).filter(([key]) => validKeys.includes(key))
      )

      Object.assign(settings, { ...defaultSettings, ...filteredParsed })
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
