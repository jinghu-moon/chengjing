// 任意 RxC 布局类型（如 "1x1", "2x2", "3x3" 等）
export type FolderLayoutMode = `${number}x${number}`

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
