// 任意 RxC 布局类型（如 "1x1", "2x2", "3x3" 等）
export type FolderLayoutMode = `${number}x${number}`

export type DesktopPreset = 'compact' | 'standard' | 'spacious' | 'custom'

export interface Settings {
  openNewTab: boolean
  showClock: boolean
  showShortcuts: boolean
  showTodo: boolean
  dailyWallpaper: boolean
  todoDefaultCollapsed: boolean
  todoWidth: number
  todoListMaxHeight: number
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
  desktopPreset: DesktopPreset
  defaultFolderMode: FolderLayoutMode
  enableSmartFolderSuggestion: boolean
  layoutPaddingTop: number
  layoutGap: number
  showSearchBar: boolean
  showSearchIcon: boolean
  searchBarWidth: number
  searchBarHeight: number
  searchBarRadius: number
  searchBarOpacity: number
  weatherAutoLocation: boolean
  weatherCity: string
  pomodoroWorkMinutes: number
  pomodoroBreakMinutes: number
  pomodoroAutoBreak: boolean
  pomodoroAutoWork: boolean
  pomodoroIntent: string
}

export interface IconConfig {
  hideLabel: boolean
  boxSize: number
  iconScale: number
  radius: number
  opacity: number
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
}
