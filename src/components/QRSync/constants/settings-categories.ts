/**
 * 配置项分类定义
 * 用于选择性导出功能
 */

export interface CategoryConfig {
  label: string
  keys: string[]
}

/** Settings 分类 */
export const SETTINGS_CATEGORIES: Record<string, CategoryConfig> = {
  general: {
    label: '通用',
    keys: ['generalOpenInNewTab']
  },
  clock: {
    label: '时钟',
    keys: ['clockShow']
  },
  layout: {
    label: '布局',
    keys: [
      'layoutPreset',
      'layoutGridRows',
      'layoutGridCols',
      'layoutGridGapX',
      'layoutGridGapY',
      'layoutPaddingTop',
      'layoutGap'
    ]
  },
  wallpaper: {
    label: '壁纸',
    keys: ['wallpaperDailyEnabled', 'wallpaperBlur', 'wallpaperMask']
  },
  searchBar: {
    label: '搜索栏',
    keys: [
      'searchBarShow',
      'searchBarShowIcon',
      'searchBarWidth',
      'searchBarHeight',
      'searchBarRadius',
      'searchBarOpacity'
    ]
  },
  shortcuts: {
    label: '快捷方式',
    keys: ['shortcutsShow']
  },
  todo: {
    label: '待办',
    keys: ['todoShow', 'todoDefaultCollapsed', 'todoWidth', 'todoListMaxHeight']
  },
  notePad: {
    label: '便签',
    keys: [
      'notePadShow',
      'notePadWidth',
      'notePadHeight',
      'notePadEditorMode',
      'notePadImageCompress',
      'notePadImageMaxSizeMB',
      'notePadImageMaxWidth'
    ]
  },
  folder: {
    label: '文件夹',
    keys: [
      'folderAutoCleanEmpty',
      'folderPreviewMode',
      'folderInnerSpacing',
      'folderCompressLarge',
      'folderDefaultMode',
      'folderSmartSuggestion'
    ]
  },
  weather: {
    label: '天气',
    keys: ['weatherAutoLocation', 'weatherCity']
  },
  pomodoro: {
    label: '番茄钟',
    keys: [
      'pomodoroWorkMinutes',
      'pomodoroBreakMinutes',
      'pomodoroAutoBreak',
      'pomodoroAutoWork',
      'pomodoroIntent'
    ]
  },
  calculator: {
    label: '计算器',
    keys: ['calculatorShow']
  },
  poem: {
    label: '每日诗词',
    keys: ['poemShow', 'poemFetchOnline']
  }
}

/** IconConfig 分类 */
export const ICON_CATEGORY: CategoryConfig = {
  label: '图标配置',
  keys: ['hideLabel', 'boxSize', 'iconScale', 'radius', 'opacity', 'showShadow']
}

/** 获取所有 Settings 键 */
export function getAllSettingsKeys(): string[] {
  return Object.values(SETTINGS_CATEGORIES).flatMap(c => c.keys)
}

/** 获取所有 IconConfig 键 */
export function getAllIconKeys(): string[] {
  return ICON_CATEGORY.keys
}
