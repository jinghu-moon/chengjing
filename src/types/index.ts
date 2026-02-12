// 任意 RxC 布局类型（如 "1x1", "2x2", "3x3" 等）
export type FolderLayoutMode = `${number}x${number}`

export type DesktopPreset = 'compact' | 'standard' | 'spacious' | 'custom'

export interface Settings {
  // ===== General =====
  /** 新标签页打开链接 */
  generalOpenInNewTab: boolean

  // ===== Clock =====
  /** 显示时钟 */
  clockShow: boolean

  // ===== Shortcuts =====
  /** 显示快捷方式 */
  shortcutsShow: boolean

  // ===== Todo =====
  /** 显示待办事项 */
  todoShow: boolean
  /** 默认折叠待办 */
  todoDefaultCollapsed: boolean
  /** 待办宽度 */
  todoWidth: number
  /** 待办列表最大高度 */
  todoListMaxHeight: number

  // ===== Wallpaper =====
  /** 每日壁纸 */
  wallpaperDailyEnabled: boolean
  /** 壁纸模糊度 */
  wallpaperBlur: number
  /** 壁纸遮罩 */
  wallpaperMask: number

  // ===== NotePad =====
  /** 显示便签 */
  notePadShow: boolean
  /** 便签宽度 */
  notePadWidth: number
  /** 便签高度 */
  notePadHeight: number
  /** 编辑器模式 */
  notePadEditorMode: 'rich' | 'plain'
  /** 图片压缩 */
  notePadImageCompress: boolean
  /** 图片最大体积(MB) */
  notePadImageMaxSizeMB: number
  /** 图片最大宽度 */
  notePadImageMaxWidth: number

  // ===== Folder =====
  /** 自动清理空文件夹 */
  folderAutoCleanEmpty: boolean
  /** 文件夹预览模式 */
  folderPreviewMode: FolderLayoutMode
  /** 文件夹内部间距 */
  folderInnerSpacing: number
  /** 压缩大文件夹 */
  folderCompressLarge: boolean
  /** 默认文件夹模式 */
  folderDefaultMode: FolderLayoutMode
  /** 智能文件夹建议 */
  folderSmartSuggestion: boolean

  // ===== Layout =====
  /** 布局预设 */
  layoutPreset: DesktopPreset
  /** 网格行数 */
  layoutGridRows: number
  /** 网格列数 */
  layoutGridCols: number
  /** 列间距 */
  layoutGridGapX: number
  /** 行间距 */
  layoutGridGapY: number
  /** 顶部边距 */
  layoutPaddingTop: number
  /** 布局间距 */
  layoutGap: number

  // ===== SearchBar =====
  /** 显示搜索栏 */
  searchBarShow: boolean
  /** 显示搜索图标 */
  searchBarShowIcon: boolean
  /** 搜索栏宽度 */
  searchBarWidth: number
  /** 搜索栏高度 */
  searchBarHeight: number
  /** 搜索栏圆角 */
  searchBarRadius: number
  /** 搜索栏透明度 */
  searchBarOpacity: number
  /** 搜索建议数据源（'google' | 'baidu' | 'bing' | 'off'） */
  searchSuggestionProvider: string
  /** 是否在菜单中显示引擎标题 */
  searchBarShowEngineTitle: boolean
  /** Bang 指令前缀（默认 '!'） */
  searchBangPrefix: string
  /** 标点符号中英文等价（如 '！' 等同于 '!'） */
  searchBangSymbolEquiv: boolean
  /** 剪贴板感知（聚焦时检测剪贴板内容） */
  searchClipboardAware: boolean
  /** 剪贴板历史记录数量（0 为不限制，推荐 3-5） */
  searchClipboardHistoryCount: number

  // ===== Weather =====
  /** 自动定位 */
  weatherAutoLocation: boolean
  /** 城市 */
  weatherCity: string

  // ===== Pomodoro =====
  /** 工作时长(分钟) */
  pomodoroWorkMinutes: number
  /** 休息时长(分钟) */
  pomodoroBreakMinutes: number
  /** 自动开始休息 */
  pomodoroAutoBreak: boolean
  /** 自动开始工作 */
  pomodoroAutoWork: boolean
  /** 专注意图 */
  pomodoroIntent: string

  // ===== Calculator =====
  /** 显示计算器 */
  calculatorShow: boolean

  // ===== Poem =====
  /** 显示每日诗词 */
  poemShow: boolean
  /** 在线获取诗词 */
  poemFetchOnline: boolean
}

export interface IconConfig {
  /** 隐藏标签 */
  hideLabel: boolean
  /** 图标尺寸 */
  boxSize: number
  /** 图标缩放 */
  iconScale: number
  /** 圆角 */
  radius: number
  /** 透明度 */
  opacity: number
  /** 显示阴影 */
  showShadow: boolean
}

export interface Shortcut {
  id: number | string
  type: 'app' | 'folder'
  name: string
  url?: string
  children?: Shortcut[]
  iconBase64?: string
  color?: string
  filled?: boolean
  inverted?: boolean
  folderMode?: FolderLayoutMode // 每个文件夹独立布局声明
  position?: {
    page: number
    row: number
    col: number
  }
}
