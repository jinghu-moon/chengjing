/**
 * SoA 扁平化工具函数
 * 将 Chrome 书签树转换为 Structure of Arrays 格式
 */
import type { BookmarkStore, BookmarkView, Bookmark, BookmarkFolder } from '../types'

// ============================================
// 类型定义
// ============================================

/**
 * 纯数据结构 (用于 Worker 传输)
 * 只包含可序列化/可转移的数据，不包含 Map
 */
export interface RawSoAData {
  ids: string[]
  titles: string[]
  urls: string[]
  parentIds: string[]
  dates: Float64Array
  indices: Uint16Array
  isFolder: Uint8Array
  count: number
}

// ============================================
// Chrome API 转 SoA - 阶段一：纯计算（Worker 可用）
// ============================================

/**
 * 阶段一：仅生成扁平数组 (CPU 密集型，可移入 Worker)
 * 不构建 Map，只生成可传输的数组数据
 */
export function createFlatArrays(tree: chrome.bookmarks.BookmarkTreeNode[]): RawSoAData {
  // 1. 计算节点总数
  function countNodes(node: chrome.bookmarks.BookmarkTreeNode): number {
    if (node.id === '0') {
      return node.children?.reduce((sum, child) => sum + countNodes(child), 0) || 0
    }
    return 1 + (node.children?.reduce((sum, child) => sum + countNodes(child), 0) || 0)
  }

  const capacity = tree.length > 0 ? countNodes(tree[0]) : 0

  // 2. 预分配数组
  const ids = new Array<string>(capacity)
  const parentIds = new Array<string>(capacity)
  const titles = new Array<string>(capacity)
  const urls = new Array<string>(capacity)

  // 使用 TypedArray 以支持 Worker 零拷贝传输
  const indicesBuffer = new Uint16Array(capacity)
  const datesBuffer = new Float64Array(capacity)
  const isFolderBuffer = new Uint8Array(capacity)

  let currentIndex = 0

  // 3. 深度优先遍历填充
  function traverse(node: chrome.bookmarks.BookmarkTreeNode) {
    if (node.id === '0') {
      if (node.children) node.children.forEach(traverse)
      return
    }

    const idx = currentIndex++
    const hasUrl = !!node.url

    ids[idx] = node.id
    parentIds[idx] = node.parentId || '0'
    titles[idx] = node.title || 'Untitled'
    urls[idx] = node.url || ''

    indicesBuffer[idx] = node.index ?? 0
    datesBuffer[idx] = node.dateAdded || Date.now()
    isFolderBuffer[idx] = hasUrl ? 0 : 1

    if (node.children) {
      for (const child of node.children) {
        traverse(child)
      }
    }
  }

  if (tree.length > 0) {
    traverse(tree[0])
  }

  return {
    ids,
    parentIds,
    titles,
    urls,
    indices: indicesBuffer,
    dates: datesBuffer,
    isFolder: isFolderBuffer,
    count: currentIndex,
  }
}

// ============================================
// Chrome API 转 SoA - 阶段二：索引构建（主线程）
// ============================================

/**
 * 阶段二：构建索引 Map (主线程运行，O(N) 但非常快)
 * Map 无法跨线程传输，必须在主线程原地构建
 */
export function createLookupMaps(
  ids: readonly string[],
  parentIds: readonly string[],
  count: number
) {
  const idToIndex = new Map<string, number>()
  const childrenMap = new Map<string, number[]>()

  for (let i = 0; i < count; i++) {
    idToIndex.set(ids[i], i)

    const pid = parentIds[i]
    if (!childrenMap.has(pid)) {
      childrenMap.set(pid, [])
    }
    childrenMap.get(pid)!.push(i)
  }

  // 冻结 Map 内容
  const frozenChildrenMap = new Map<string, readonly number[]>()
  for (const [key, children] of childrenMap) {
    frozenChildrenMap.set(key, Object.freeze(children))
  }

  return {
    idToIndex: Object.freeze(idToIndex),
    childrenMap: Object.freeze(frozenChildrenMap),
  }
}

// ============================================
// Chrome API 转 SoA - 完整流程（兼容旧代码）
// ============================================

/**
 * 将 Chrome 书签树扁平化为 SoA 结构（同步版本）
 * 保持向后兼容，内部调用 createFlatArrays + createLookupMaps
 */
export function flattenBookmarksToSoA(tree: chrome.bookmarks.BookmarkTreeNode[]): BookmarkStore {
  const raw = createFlatArrays(tree)
  const maps = createLookupMaps(raw.ids, raw.parentIds, raw.count)

  // 冻结字符串数组
  Object.freeze(raw.ids)
  Object.freeze(raw.parentIds)
  Object.freeze(raw.titles)
  Object.freeze(raw.urls)

  return {
    ...raw,
    ...maps,
  }
}

// ============================================
// Mock 数据转 SoA (开发环境)
// ============================================

/**
 * Mock 数据转 SoA（开发环境）
 * 按树形结构正确排序
 */
export function mockToSoA(bookmarks: Bookmark[], folders: BookmarkFolder[]): BookmarkStore {
  const bookmarksByFolder = new Map<string | null, Bookmark[]>()

  for (const b of bookmarks) {
    const pid = b.folderId
    if (!bookmarksByFolder.has(pid)) {
      bookmarksByFolder.set(pid, [])
    }
    bookmarksByFolder.get(pid)!.push(b)
  }

  const ids: string[] = []
  const parentIds: string[] = []
  const indices: number[] = []
  const titles: string[] = []
  const urls: string[] = []
  const dates: number[] = []
  const isFolder: number[] = []

  function processFolder(folderId: string | null) {
    const subFolders = folders.filter(f => f.parentId === folderId)
    const subBookmarks = bookmarksByFolder.get(folderId) || []

    subFolders.forEach((folder, i) => {
      ids.push(folder.id)
      parentIds.push(folderId || '0')
      indices.push(i)
      titles.push(folder.title)
      urls.push('')
      dates.push(Date.now())
      isFolder.push(1)
    })

    subBookmarks.forEach((bookmark, i) => {
      ids.push(bookmark.id)
      parentIds.push(folderId || '0')
      indices.push(subFolders.length + i)
      titles.push(bookmark.title)
      urls.push(bookmark.url)
      dates.push(bookmark.dateAdded || Date.now())
      isFolder.push(0)
    })

    subFolders.forEach(folder => {
      processFolder(folder.id)
    })
  }

  processFolder(null)

  const count = ids.length

  const idToIndex = new Map<string, number>()
  const childrenMap = new Map<string, number[]>()

  for (let i = 0; i < count; i++) {
    idToIndex.set(ids[i], i)

    const pid = parentIds[i]
    if (!childrenMap.has(pid)) {
      childrenMap.set(pid, [])
    }
    childrenMap.get(pid)!.push(i)
  }

  Object.freeze(ids)
  Object.freeze(parentIds)
  Object.freeze(titles)
  Object.freeze(urls)

  const frozenChildrenMap = new Map<string, readonly number[]>()
  for (const [key, children] of childrenMap) {
    frozenChildrenMap.set(key, Object.freeze(children))
  }

  return {
    ids,
    parentIds,
    indices: new Uint16Array(indices),
    titles,
    urls,
    dates: new Float64Array(dates),
    isFolder: new Uint8Array(isFolder),
    count,
    idToIndex: Object.freeze(idToIndex),
    childrenMap: Object.freeze(frozenChildrenMap),
  }
}

// ============================================
// SoA 访问辅助函数
// ============================================

/**
 * 根据索引获取书签的完整信息
 */
export function getBookmarkAt(store: BookmarkStore, index: number): BookmarkView | null {
  if (index < 0 || index >= store.count) {
    return null
  }

  return {
    index,
    id: store.ids[index],
    title: store.titles[index],
    url: store.urls[index],
    isFolder: store.isFolder[index] === 1,
    parentId: store.parentIds[index],
  }
}

/**
 * O(1) 查找书签索引
 */
export function findIndexById(store: BookmarkStore, id: string): number {
  return store.idToIndex.get(id) ?? -1
}

/**
 * O(k) 获取文件夹下的书签索引（k = 子项数量）
 * @param recursive - 如果为 true，则递归获取所有子文件夹中的书签
 */
export function getBookmarksInFolder(
  store: BookmarkStore,
  folderId: string | null,
  recursive: boolean = false
): number[] {
  const targetPid = folderId || '0'

  if (!recursive) {
    // 优化：直接查表
    const children = store.childrenMap.get(targetPid)
    if (!children) return []
    // 过滤出书签 (isFolder === 0)
    // 注意：children 数组里包含了文件夹和书签
    return children.filter(i => store.isFolder[i] === 0)
  }

  // 递归逻辑：收集所有后代书签
  // 使用 Map 优化后，只需要遍历有效的文件夹结构
  const result: number[] = []
  const folderQueue: string[] = [targetPid]
  const visited = new Set<string>()

  while (folderQueue.length > 0) {
    const currentFolderId = folderQueue.shift()!
    if (visited.has(currentFolderId)) continue
    visited.add(currentFolderId)

    const children = store.childrenMap.get(currentFolderId)
    if (!children) continue

    for (const i of children) {
      if (store.isFolder[i] === 1) {
        // 子文件夹，加入队列继续遍历
        folderQueue.push(store.ids[i])
      } else {
        // 书签，加入结果
        result.push(i)
      }
    }
  }

  return result
}

/**
 * O(k) 获取文件夹下的子文件夹索引
 */
export function getSubFolders(store: BookmarkStore, folderId: string | null): number[] {
  const children = store.childrenMap.get(folderId || '0')
  if (!children) return []
  return children.filter(i => store.isFolder[i] === 1)
}

/**
 * O(depth) 获取文件夹路径（面包屑）
 */
export function getFolderPath(
  store: BookmarkStore,
  folderId: string | null
): Array<{ id: string; title: string }> {
  const path: Array<{ id: string; title: string }> = []
  let currentId = folderId

  while (currentId && currentId !== '0') {
    const index = store.idToIndex.get(currentId)
    if (index === undefined) break

    path.unshift({
      id: currentId,
      title: store.titles[index],
    })

    currentId = store.parentIds[index]
  }

  return path
}

/**
 * 将 SoA 索引数组转换为 BookmarkView 数组 (用于渲染)
 */
export function indicesToViews(store: BookmarkStore, indices: number[]): BookmarkView[] {
  return indices.map(i => ({
    index: i,
    id: store.ids[i],
    title: store.titles[i],
    url: store.urls[i],
    isFolder: store.isFolder[i] === 1,
    parentId: store.parentIds[i],
  }))
}

// ============================================
// 性能工具
// ============================================

/**
 * 估算内存占用
 */
export function estimateMemory(store: BookmarkStore): {
  total: number
  perItem: number
  formatted: string
  breakdown: Record<string, string>
} {
  let bytes = 0
  const breakdown: Record<string, number> = {}

  const stringArrays = [
    ['ids', store.ids],
    ['parentIds', store.parentIds],
    ['titles', store.titles],
    ['urls', store.urls],
  ] as const

  for (const [name, arr] of stringArrays) {
    let size = 8 * arr.length
    size += arr.reduce((sum, s) => sum + s.length * 1.5 + 24, 0)
    breakdown[name] = size
    bytes += size
  }

  breakdown.indices = store.indices.byteLength
  breakdown.dates = store.dates.byteLength
  breakdown.isFolder = store.isFolder.byteLength
  breakdown.idToIndex = store.count * 32
  breakdown.childrenMap = store.childrenMap.size * 64

  bytes +=
    breakdown.indices +
    breakdown.dates +
    breakdown.isFolder +
    breakdown.idToIndex +
    breakdown.childrenMap

  const mb = bytes / 1024 / 1024

  return {
    total: bytes,
    perItem: store.count > 0 ? bytes / store.count : 0,
    formatted: `${mb.toFixed(2)} MB`,
    breakdown: Object.fromEntries(
      Object.entries(breakdown).map(([k, v]) => [k, `${(v / 1024).toFixed(1)} KB`])
    ),
  }
}
