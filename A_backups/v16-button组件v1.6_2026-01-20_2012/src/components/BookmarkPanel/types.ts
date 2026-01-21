// Bookmark types

// ============================================
// Legacy Types (保留用于兼容)
// ============================================

export interface Bookmark {
  id: string
  title: string
  url: string
  folderId: string | null // null = root level
  dateAdded?: number
  faviconUrl?: string // cached favicon URL
}

export interface BookmarkFolder {
  id: string
  title: string
  parentId: string | null // null = root folder
  children: (BookmarkFolder | Bookmark)[]
  isExpanded?: boolean
}

export interface BookmarkTreeNode {
  id: string
  title: string
  url?: string // folder nodes don't have url
  parentId: string | null
  children?: BookmarkTreeNode[]
  dateAdded?: number
}

// Search result with path info
export interface SearchResult {
  bookmark: Bookmark
  path: string[] // folder names from root to bookmark
  score: number // Fuse.js score
}

// State
export interface BookmarkPanelState {
  isOpen: boolean
  searchQuery: string
  currentFolderId: string | null
  viewMode: 'grid' | 'list'
}

// ============================================
// SoA (Structure of Arrays) Types - 高性能数据结构
// ============================================

/**
 * SoA 书签存储 - 所有字段按列存储
 * 优点：
 * 1. 内存连续，CPU 缓存命中率高
 * 2. 无键名开销，内存占用减少 25%
 * 3. TypedArray 支持，零拷贝传输给 Worker
 */
/**
 * SoA 书签存储 - 所有字段按列存储
 * 优点：
 * 1. 内存连续，CPU 缓存命中率高
 * 2. 无键名开销，内存占用减少 25%
 * 3. TypedArray 支持，零拷贝传输给 Worker
 */
export interface BookmarkStore {
  /** 书签 ID 数组 */
  readonly ids: readonly string[]
  /** 父文件夹 ID 数组 */
  readonly parentIds: readonly string[]
  /** 排序索引数组 (0-65535) */
  readonly indices: Uint16Array
  /** 标题数组 */
  readonly titles: readonly string[]
  /** URL 数组 (文件夹为空字符串) */
  readonly urls: readonly string[]
  /** 创建时间戳数组 */
  readonly dates: Float64Array
  /** 文件夹标记数组 (1=文件夹, 0=书签) */
  readonly isFolder: Uint8Array
  /** 总数量 */
  readonly count: number

  /**
   * 🚀 优化：ID 到索引的 O(1) 映射
   * 解决 findIndexById 的 O(n) 性能问题
   */
  readonly idToIndex: ReadonlyMap<string, number>

  /**
   * 🚀 优化：父ID 到子节点索引的 O(1) 映射
   * 解决 getBookmarksInFolder 的全量遍历问题
   */
  readonly childrenMap: ReadonlyMap<string, readonly number[]>
}

/**
 * 视图层 DTO - 用于 Vue 组件渲染
 * 从 SoA 按需提取，避免全量转换
 */
export interface BookmarkView {
  /** 在 BookmarkStore 中的索引 */
  index: number
  /** 书签 ID */
  id: string
  /** 标题 */
  title: string
  /** URL (文件夹为空字符串) */
  url: string
  /** 是否为文件夹 */
  isFolder: boolean
  /** 父文件夹 ID */
  parentId: string
}

/**
 * SoA 搜索结果
 */
export interface SoASearchResult {
  /** 在 BookmarkStore 中的索引 */
  index: number
  /** 匹配分数 (可选) */
  score?: number
}

// ============================================
// Worker 消息类型
// ============================================

export type WorkerInMessage =
  | {
      type: 'INIT'
      payload: {
        ids: string[]
        titles: string[]
        urls: string[]
        dates: Float64Array
      }
    }
  | {
      type: 'SEARCH'
      payload: { query: string; id: number }
    }

export type WorkerOutMessage =
  | { type: 'READY'; count: number }
  | { type: 'RESULT'; indices: number[]; id: number }

// Tree View Node
export interface FolderNode {
  id: string
  title: string
  children: FolderNode[]
  level: number
  bookmarkCount: number // 包含子文件夹的书签总数
}

// Grouped Bookmarks for Sticky Headers
export interface FolderGroup {
  folderId: string
  folderTitle: string
  folderPath: string // 完整路径如 "资源类 > 字库"
  indices: number[] // SoA 索引
}
