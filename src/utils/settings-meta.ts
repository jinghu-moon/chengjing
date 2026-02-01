/**
 * 设置项元数据注册表
 * 用于 V1.2 细粒度配置对比与导入
 */

// 设置分类
export type SettingCategory =
  | 'general'      // 通用
  | 'clock'        // 时钟
  | 'wallpaper'    // 壁纸
  | 'layout'       // 布局参数
  | 'searchBar'    // 搜索栏
  | 'shortcuts'    // 快捷方式
  | 'folder'       // 文件夹
  | 'todo'         // 待办
  | 'notePad'      // 便签
  | 'pomodoro'     // 番茄钟
  | 'weather'      // 天气
  | 'calculator'   // 计算器
  | 'poem'         // 每日一言
  | 'icon'         // 图标样式

// 分类中文映射
export const CATEGORY_LABELS: Record<SettingCategory, string> = {
  general: '通用',
  clock: '时钟',
  wallpaper: '壁纸',
  layout: '布局参数',
  searchBar: '搜索栏',
  shortcuts: '快捷方式',
  folder: '文件夹',
  todo: '待办事项',
  notePad: '便签',
  pomodoro: '番茄钟',
  weather: '天气',
  calculator: '计算器',
  poem: '每日一言',
  icon: '图标样式'
}

// 单个设置项元数据
export interface SettingMetaItem {
  label: string
  category: SettingCategory
  type: 'boolean' | 'number' | 'string' | 'select'
  unit?: string                    // 单位 (px, %, 分钟)
  options?: { value: any; label: string }[]  // select 类型选项
  formatter?: (value: any) => string         // 自定义格式化
}

/**
 * Settings 元数据注册表
 */
export const SETTINGS_META: Record<string, SettingMetaItem> = {
  // ========== 通用 ==========
  generalOpenInNewTab: {
    label: '新标签页打开链接',
    category: 'general',
    type: 'boolean'
  },

  // ========== 时钟 ==========
  clockShow: {
    label: '显示时钟',
    category: 'clock',
    type: 'boolean'
  },

  // ========== 快捷方式 ==========
  shortcutsShow: {
    label: '显示快捷方式',
    category: 'shortcuts',
    type: 'boolean'
  },

  // ========== 待办 ==========
  todoShow: {
    label: '显示待办',
    category: 'todo',
    type: 'boolean'
  },
  todoDefaultCollapsed: {
    label: '默认折叠待办',
    category: 'todo',
    type: 'boolean'
  },
  todoWidth: {
    label: '待办宽度',
    category: 'todo',
    type: 'number',
    unit: 'px'
  },
  todoListMaxHeight: {
    label: '待办列表最大高度',
    category: 'todo',
    type: 'number',
    unit: 'px'
  },

  // ========== 便签 ==========
  notePadShow: {
    label: '显示便签',
    category: 'notePad',
    type: 'boolean'
  },
  notePadWidth: {
    label: '便签宽度',
    category: 'notePad',
    type: 'number',
    unit: 'px'
  },
  notePadHeight: {
    label: '便签高度',
    category: 'notePad',
    type: 'number',
    unit: 'px'
  },
  notePadEditorMode: {
    label: '编辑器模式',
    category: 'notePad',
    type: 'select',
    options: [
      { value: 'rich', label: '富文本' },
      { value: 'plain', label: '纯文本' }
    ]
  },
  notePadImageCompress: {
    label: '压缩图片',
    category: 'notePad',
    type: 'boolean'
  },
  notePadImageMaxSizeMB: {
    label: '图片大小限制',
    category: 'notePad',
    type: 'number',
    unit: 'MB'
  },
  notePadImageMaxWidth: {
    label: '图片宽度限制',
    category: 'notePad',
    type: 'number',
    unit: 'px'
  },

  // ========== 壁纸 ==========
  wallpaperDailyEnabled: {
    label: '每日壁纸',
    category: 'wallpaper',
    type: 'boolean'
  },
  wallpaperBlur: {
    label: '壁纸模糊度',
    category: 'wallpaper',
    type: 'number',
    unit: 'px'
  },
  wallpaperMask: {
    label: '壁纸遮罩',
    category: 'wallpaper',
    type: 'number',
    unit: '%'
  },

  // ========== 文件夹 ==========
  folderAutoCleanEmpty: {
    label: '自动删除空文件夹',
    category: 'folder',
    type: 'boolean'
  },
  folderPreviewMode: {
    label: '文件夹预览模式',
    category: 'folder',
    type: 'select',
    options: [
      { value: '2x2', label: '2×2 网格' },
      { value: '3x3', label: '3×3 网格' },
      { value: 'list', label: '列表' }
    ]
  },
  folderInnerSpacing: {
    label: '文件夹内间距',
    category: 'folder',
    type: 'number',
    unit: 'px'
  },
  folderCompressLarge: {
    label: '压缩大文件夹',
    category: 'folder',
    type: 'boolean'
  },
  folderDefaultMode: {
    label: '默认文件夹模式',
    category: 'folder',
    type: 'select',
    options: [
      { value: '2x2', label: '2×2 网格' },
      { value: '3x3', label: '3×3 网格' }
    ]
  },
  folderSmartSuggestion: {
    label: '智能文件夹建议',
    category: 'folder',
    type: 'boolean'
  },

  // ========== 布局参数 ==========
  layoutPreset: {
    label: '桌面预设',
    category: 'layout',
    type: 'select',
    options: [
      { value: 'compact', label: '极简 1×8' },
      { value: 'standard', label: '标准 2×6' },
      { value: 'spacious', label: '宽敞 3×8' }
    ]
  },
  layoutGridRows: {
    label: '网格行数',
    category: 'layout',
    type: 'number',
    unit: '行'
  },
  layoutGridCols: {
    label: '网格列数',
    category: 'layout',
    type: 'number',
    unit: '列'
  },
  layoutGridGapX: {
    label: '水平间距',
    category: 'layout',
    type: 'number',
    unit: 'px'
  },
  layoutGridGapY: {
    label: '垂直间距',
    category: 'layout',
    type: 'number',
    unit: 'px'
  },
  layoutPaddingTop: {
    label: '顶部边距',
    category: 'layout',
    type: 'number',
    unit: 'px'
  },
  layoutGap: {
    label: '模块间距',
    category: 'layout',
    type: 'number',
    unit: 'px'
  },

  // ========== 搜索栏 ==========
  searchBarShow: {
    label: '显示搜索栏',
    category: 'searchBar',
    type: 'boolean'
  },
  searchBarShowIcon: {
    label: '显示搜索图标',
    category: 'searchBar',
    type: 'boolean'
  },
  searchBarWidth: {
    label: '搜索栏宽度',
    category: 'searchBar',
    type: 'number',
    unit: '%'
  },
  searchBarHeight: {
    label: '搜索栏高度',
    category: 'searchBar',
    type: 'number',
    unit: 'px'
  },
  searchBarRadius: {
    label: '搜索栏圆角',
    category: 'searchBar',
    type: 'number',
    unit: 'px'
  },
  searchBarOpacity: {
    label: '搜索栏透明度',
    category: 'searchBar',
    type: 'number',
    unit: '%'
  },

  // ========== 番茄钟 ==========
  pomodoroWorkMinutes: {
    label: '工作时长',
    category: 'pomodoro',
    type: 'number',
    unit: '分钟'
  },
  pomodoroBreakMinutes: {
    label: '休息时长',
    category: 'pomodoro',
    type: 'number',
    unit: '分钟'
  },
  pomodoroAutoBreak: {
    label: '自动开始休息',
    category: 'pomodoro',
    type: 'boolean'
  },
  pomodoroAutoWork: {
    label: '自动开始工作',
    category: 'pomodoro',
    type: 'boolean'
  },
  pomodoroIntent: {
    label: '专注意图',
    category: 'pomodoro',
    type: 'string'
  },

  // ========== 天气 ==========
  weatherAutoLocation: {
    label: '自动定位',
    category: 'weather',
    type: 'boolean'
  },
  weatherCity: {
    label: '城市',
    category: 'weather',
    type: 'string'
  },

  // ========== 计算器 ==========
  calculatorShow: {
    label: '显示计算器',
    category: 'calculator',
    type: 'boolean'
  },

  // ========== 每日诗词 ==========
  poemShow: {
    label: '显示每日诗词',
    category: 'poem',
    type: 'boolean'
  },
  poemFetchOnline: {
    label: '在线诗词模式',
    category: 'poem',
    type: 'boolean'
  }
}

/**
 * IconConfig 元数据注册表
 */
export const ICON_CONFIG_META: Record<string, SettingMetaItem> = {
  hideLabel: {
    label: '隐藏标签',
    category: 'icon',
    type: 'boolean'
  },
  boxSize: {
    label: '图标盒大小',
    category: 'icon',
    type: 'number',
    unit: 'px'
  },
  iconScale: {
    label: '图标缩放',
    category: 'icon',
    type: 'number',
    unit: '%'
  },
  radius: {
    label: '圆角',
    category: 'icon',
    type: 'number',
    unit: 'px'
  },
  opacity: {
    label: '背景透明度',
    category: 'icon',
    type: 'number',
    unit: '%'
  },
  showShadow: {
    label: '显示阴影',
    category: 'icon',
    type: 'boolean'
  }
}

/**
 * 格式化配置值为可读字符串
 */
export function formatSettingValue(key: string, value: any): string {
  const meta = SETTINGS_META[key] || ICON_CONFIG_META[key]

  if (!meta) return String(value)

  // 布尔值
  if (meta.type === 'boolean') {
    return value ? '开启' : '关闭'
  }

  // 选择项
  if (meta.type === 'select' && meta.options) {
    const option = meta.options.find(o => o.value === value)
    return option?.label || String(value)
  }

  // 自定义格式化
  if (meta.formatter) {
    return meta.formatter(value)
  }

  // 带单位的数字
  if (meta.type === 'number' && meta.unit) {
    return `${value} ${meta.unit}`
  }

  // 空字符串
  if (value === '' || value === null || value === undefined) {
    return '(空)'
  }

  return String(value)
}

/**
 * 获取设置项标签
 */
export function getSettingLabel(key: string): string {
  const meta = SETTINGS_META[key] || ICON_CONFIG_META[key]
  return meta?.label || key
}

/**
 * 获取设置项分类
 */
export function getSettingCategory(key: string): SettingCategory | null {
  const meta = SETTINGS_META[key] || ICON_CONFIG_META[key]
  return meta?.category || null
}

/**
 * 按分类分组设置项
 */
export function groupSettingsByCategory<T extends { key: string }>(
  items: T[]
): Record<SettingCategory, T[]> {
  const groups = {} as Record<SettingCategory, T[]>

  // 初始化所有分类
  Object.keys(CATEGORY_LABELS).forEach(cat => {
    groups[cat as SettingCategory] = []
  })

  // 分组
  items.forEach(item => {
    const category = getSettingCategory(item.key)
    if (category) {
      groups[category].push(item)
    }
  })

  return groups
}
