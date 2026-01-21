/**
 * SoA 版本的书签数据管理
 * 使用 Structure of Arrays 架构，优化内存和性能
 * 🚀 优化：使用 Web Worker 处理 CPU 密集型的扁平化计算
 */
import { ref, shallowRef, computed, onMounted, onUnmounted } from 'vue'
import type {
  Bookmark,
  BookmarkFolder,
  BookmarkStore,
  BookmarkView,
  FolderNode,
  FolderGroup,
} from '../types'
import { isExtensionEnvironment, getBookmarkTree } from '@/utils/bookmarksApi'
import {
  createLookupMaps,
  mockToSoA,
  getBookmarkAt,
  findIndexById,
  getBookmarksInFolder,
  getSubFolders,
  getFolderPath,
  indicesToViews,
  estimateMemory,
} from '../utils/flatten'

// 引入 Worker 和类型
import DataWorker from '../workers/data.worker?worker'
import type { DataWorkerOutMessage } from '../workers/data.worker'

// ============================================
// Mock Data (保持与旧版兼容)
// ============================================

const MOCK_FOLDERS: BookmarkFolder[] = [
  // Root folders
  { id: 'dev', title: '开发工具', parentId: null, children: [], isExpanded: true },
  { id: 'entertainment', title: '娱乐', parentId: null, children: [], isExpanded: false },
  { id: 'learning', title: '学习', parentId: null, children: [], isExpanded: false },
  { id: 'work', title: '工作', parentId: null, children: [], isExpanded: false },
  { id: 'social', title: '社交', parentId: null, children: [], isExpanded: false },

  // 开发工具 > 子文件夹
  { id: 'dev-frontend', title: '前端', parentId: 'dev', children: [], isExpanded: false },
  { id: 'dev-backend', title: '后端', parentId: 'dev', children: [], isExpanded: false },
  { id: 'dev-tools', title: '工具', parentId: 'dev', children: [], isExpanded: false },

  // 开发工具 > 前端 > 子文件夹
  {
    id: 'dev-frontend-vue',
    title: 'Vue',
    parentId: 'dev-frontend',
    children: [],
    isExpanded: false,
  },
  {
    id: 'dev-frontend-react',
    title: 'React',
    parentId: 'dev-frontend',
    children: [],
    isExpanded: false,
  },

  // 娱乐 > 子文件夹
  {
    id: 'entertainment-video',
    title: '视频',
    parentId: 'entertainment',
    children: [],
    isExpanded: false,
  },
  {
    id: 'entertainment-music',
    title: '音乐',
    parentId: 'entertainment',
    children: [],
    isExpanded: false,
  },
  {
    id: 'entertainment-game',
    title: '游戏',
    parentId: 'entertainment',
    children: [],
    isExpanded: false,
  },

  // 学习 > 子文件夹
  {
    id: 'learning-programming',
    title: '编程教程',
    parentId: 'learning',
    children: [],
    isExpanded: false,
  },
  {
    id: 'learning-language',
    title: '语言学习',
    parentId: 'learning',
    children: [],
    isExpanded: false,
  },
]

const MOCK_BOOKMARKS: Bookmark[] = [
  // 开发工具 (root) - 10
  { id: '1', title: 'GitHub', url: 'https://github.com', folderId: 'dev' },
  { id: '2', title: 'GitLab', url: 'https://gitlab.com', folderId: 'dev' },
  { id: '3', title: 'Stack Overflow', url: 'https://stackoverflow.com', folderId: 'dev' },
  { id: '4', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', folderId: 'dev' },
  { id: '5', title: 'Can I Use', url: 'https://caniuse.com', folderId: 'dev' },
  // 前端 - 10
  { id: '11', title: 'Vue.js 官网', url: 'https://vuejs.org', folderId: 'dev-frontend' },
  { id: '12', title: 'React 官网', url: 'https://react.dev', folderId: 'dev-frontend' },
  { id: '13', title: 'Vite', url: 'https://vitejs.dev', folderId: 'dev-frontend' },
  {
    id: '14',
    title: 'TypeScript',
    url: 'https://www.typescriptlang.org',
    folderId: 'dev-frontend',
  },
  { id: '15', title: 'TailwindCSS', url: 'https://tailwindcss.com', folderId: 'dev-frontend' },
  // Vue
  { id: '21', title: 'Pinia', url: 'https://pinia.vuejs.org', folderId: 'dev-frontend-vue' },
  { id: '22', title: 'Vue Router', url: 'https://router.vuejs.org', folderId: 'dev-frontend-vue' },
  { id: '23', title: 'Nuxt', url: 'https://nuxt.com', folderId: 'dev-frontend-vue' },
  // React
  { id: '31', title: 'Next.js', url: 'https://nextjs.org', folderId: 'dev-frontend-react' },
  { id: '32', title: 'Redux', url: 'https://redux.js.org', folderId: 'dev-frontend-react' },
  // 后端
  { id: '41', title: 'Node.js', url: 'https://nodejs.org', folderId: 'dev-backend' },
  { id: '42', title: 'Express', url: 'https://expressjs.com', folderId: 'dev-backend' },
  { id: '43', title: 'Prisma', url: 'https://www.prisma.io', folderId: 'dev-backend' },
  // 工具
  { id: '51', title: 'VS Code', url: 'https://code.visualstudio.com', folderId: 'dev-tools' },
  { id: '52', title: 'Figma', url: 'https://figma.com', folderId: 'dev-tools' },
  // 娱乐
  { id: '61', title: 'YouTube', url: 'https://youtube.com', folderId: 'entertainment-video' },
  { id: '62', title: 'Bilibili', url: 'https://www.bilibili.com', folderId: 'entertainment-video' },
  { id: '63', title: 'Spotify', url: 'https://spotify.com', folderId: 'entertainment-music' },
  {
    id: '64',
    title: 'Steam',
    url: 'https://store.steampowered.com',
    folderId: 'entertainment-game',
  },
  // 学习
  { id: '71', title: 'Coursera', url: 'https://coursera.org', folderId: 'learning-programming' },
  { id: '72', title: 'LeetCode', url: 'https://leetcode.com', folderId: 'learning-programming' },
  { id: '73', title: 'Duolingo', url: 'https://duolingo.com', folderId: 'learning-language' },
  // 工作
  { id: '81', title: 'Notion', url: 'https://notion.so', folderId: 'work' },
  { id: '82', title: 'Slack', url: 'https://slack.com', folderId: 'work' },
  // 社交
  { id: '91', title: 'Twitter', url: 'https://twitter.com', folderId: 'social' },
  { id: '92', title: 'Discord', url: 'https://discord.com', folderId: 'social' },
]

// ============================================
// useBookmarks Composable (SoA 版本)
// ============================================

export function useBookmarks() {
  // SoA 核心数据
  const store = shallowRef<BookmarkStore | null>(null)

  // 导航状态
  const currentFolderId = ref<string | null>(null)
  const isLoading = ref(false)
  const isExtension = ref(false)

  // 实例化 Worker
  const dataWorker = new DataWorker()

  // 处理 Worker 返回的数据
  dataWorker.onmessage = (e: MessageEvent<DataWorkerOutMessage>) => {
    if (e.data.type === 'FLATTEN_DONE') {
      const raw = e.data.payload
      const startTime = performance.now()

      // 1. 在主线程极速构建 Map (耗时极短，通常 <5ms)
      const maps = createLookupMaps(raw.ids, raw.parentIds, raw.count)

      // 2. 冻结字符串数组 (提升 Vue 响应式性能)
      Object.freeze(raw.ids)
      Object.freeze(raw.parentIds)
      Object.freeze(raw.titles)
      Object.freeze(raw.urls)

      // 3. 原子化更新 Store
      store.value = {
        ids: raw.ids,
        parentIds: raw.parentIds,
        titles: raw.titles,
        urls: raw.urls,
        indices: raw.indices,
        dates: raw.dates,
        isFolder: raw.isFolder,
        count: raw.count,
        idToIndex: maps.idToIndex,
        childrenMap: maps.childrenMap,
      }

      const elapsed = performance.now() - startTime
      const memory = estimateMemory(store.value)

      console.log(`[useBookmarks] Worker 数据接收完成，主线程处理耗时 ${elapsed.toFixed(2)}ms`, {
        count: raw.count,
        memory: memory.formatted,
        isExtension: isExtension.value,
      })

      isLoading.value = false
    }
  }

  /**
   * 加载书签数据（异步 Worker 模式）
   */
  async function loadBookmarks() {
    isLoading.value = true

    try {
      if (isExtensionEnvironment()) {
        isExtension.value = true
        const tree = await getBookmarkTree()

        console.log('[useBookmarks] 发送数据到 Worker 进行扁平化...')
        // 发送给 Worker，不阻塞主线程
        dataWorker.postMessage({ type: 'FLATTEN', tree: tree })
        // 注意：这里不再 await store 更新，因为是基于事件回调的
      } else {
        // 开发环境 Mock 数据直接同步加载（数据量小，无需 Worker）
        store.value = mockToSoA(MOCK_BOOKMARKS, MOCK_FOLDERS)
        isLoading.value = false

        console.log('[useBookmarks] Mock 数据加载完成', {
          count: store.value.count,
          memory: estimateMemory(store.value).formatted,
        })
      }
    } catch (error) {
      console.error('[useBookmarks] Load error:', error)
      isLoading.value = false
    }
  }

  // 组件卸载时销毁 Worker
  onUnmounted(() => {
    console.log('[useBookmarks] 销毁 Worker')
    dataWorker.terminate()
  })

  /**
   * 获取当前文件夹的书签索引 (number[])
   * 🚀 递归聚合：包含所有子文件夹中的书签
   */
  const currentBookmarkIndices = computed<number[]>(() => {
    if (!store.value) return []
    // 启用递归模式，聚合所有后代书签
    return getBookmarksInFolder(store.value, currentFolderId.value, true)
  })

  /**
   * 按文件夹分组的书签索引 (粘性标题使用)
   */
  const groupedBookmarkIndices = computed<FolderGroup[]>(() => {
    if (!store.value) return []

    const indices = currentBookmarkIndices.value
    if (indices.length === 0) return []

    const storeLocal = store.value
    const groups: FolderGroup[] = []
    const groupMap = new Map<string, FolderGroup>()

    for (const idx of indices) {
      const parentId = storeLocal.parentIds[idx]

      if (!groupMap.has(parentId)) {
        // 获取文件夹路径
        const pathItems = getFolderPath(storeLocal, parentId)
        const folderPath = pathItems.map(p => p.title).join(' > ') || '根目录'
        const folderTitle = pathItems.length > 0 ? pathItems[pathItems.length - 1].title : '根目录'

        const group: FolderGroup = {
          folderId: parentId,
          folderTitle,
          folderPath,
          indices: [],
        }
        groupMap.set(parentId, group)
        groups.push(group)
      }

      groupMap.get(parentId)!.indices.push(idx)
    }

    return groups
  })

  /**
   * 获取当前文件夹的书签列表 (BookmarkView[])
   * @deprecated 仅用于兼容旧版组件，新组件请使用 currentBookmarkIndices
   */
  const currentBookmarks = computed<BookmarkView[]>(() => {
    if (!store.value) return []
    return indicesToViews(store.value, currentBookmarkIndices.value)
  })

  /**
   * 获取当前层级的子文件夹 (BookmarkView[])
   */
  const currentFolders = computed<BookmarkView[]>(() => {
    if (!store.value) return []

    const indices = getSubFolders(store.value, currentFolderId.value)
    return indicesToViews(store.value, indices)
  })

  /**
   * 获取所有书签 (用于根目录显示)
   */
  const allBookmarkViews = computed<BookmarkView[]>(() => {
    if (!store.value) return []

    const result: number[] = []
    for (let i = 0; i < store.value.count; i++) {
      if (store.value.isFolder[i] === 0) {
        result.push(i)
      }
    }
    return indicesToViews(store.value, result)
  })

  /**
   * 获取所有文件夹 (兼容旧版 API)
   * @deprecated 尽量避免使用，直接从 store 获取，或使用 getFolderTitle
   */
  const folders = computed<BookmarkFolder[]>(() => {
    if (!store.value) return []
    // 兼容旧 API 返回空或简单处理，因为不再核心使用
    return []
  })

  /**
   * 文件夹树形结构 (Sidebar 使用)
   * 🚀 优化：使用 childrenMap 递归构建，O(N)
   */
  const folderTreeRoots = computed<FolderNode[]>(() => {
    if (!store.value) return []
    const s = store.value

    function buildNode(id: string, level: number): FolderNode | null {
      const idx = s.idToIndex.get(id)
      if (idx === undefined) return null

      const title = s.titles[idx]
      const childrenIds = s.childrenMap.get(id) || []
      const childrenNodes: FolderNode[] = []
      let totalBookmarks = 0

      for (const childIdx of childrenIds) {
        if (s.isFolder[childIdx] === 1) {
          // 是文件夹：递归
          const childId = s.ids[childIdx]
          const node = buildNode(childId, level + 1)
          if (node) {
            childrenNodes.push(node)
            totalBookmarks += node.bookmarkCount
          }
        } else {
          // 是书签
          totalBookmarks++
        }
      }

      return {
        id,
        title,
        children: childrenNodes,
        level,
        bookmarkCount: totalBookmarks,
      }
    }

    // 根目录的子项
    const rootIndices = s.childrenMap.get('0') || []
    const roots: FolderNode[] = []

    for (const idx of rootIndices) {
      if (s.isFolder[idx] === 1) {
        const id = s.ids[idx]
        const node = buildNode(id, 0)
        if (node) roots.push(node)
      }
    }

    return roots
  })

  /**
   * 移动书签到指定文件夹
   */
  async function moveBookmarkToFolder(draggedIndex: number, targetFolderId: string | null) {
    if (!store.value) return

    const dragId = store.value.ids[draggedIndex]
    const destinationId = targetFolderId ?? '0'

    console.log(`Moving ${dragId} into folder ${destinationId}`)

    try {
      if (isExtension.value) {
        await chrome.bookmarks.move(dragId, { parentId: destinationId })
      } else {
        console.log('[Mock] Moved to folder', destinationId)
      }
      await loadBookmarks()
    } catch (e) {
      console.error('Failed to move to folder', e)
    }
  }

  /**
   * 移动文件夹（侧边栏拖拽）
   */
  async function moveFolder(
    dragId: string,
    dropId: string,
    position: 'before' | 'after' | 'inside'
  ) {
    if (!isExtension.value) {
      console.log('[Mock] Move folder', dragId, position, dropId)
      console.log(
        '[Mock] Folder moves only work in Chrome extension environment. This is a visual demo only.'
      )
      // 在 Mock 模式下，重新加载数据以刷新 UI（但不会真正移动）
      await loadBookmarks()
      return
    }

    try {
      const [dragNode] = await chrome.bookmarks.get(dragId)
      const [dropNode] = await chrome.bookmarks.get(dropId)

      if (!dragNode || !dropNode) {
        console.error('Folder not found', dragId, dropId)
        return
      }

      if (position === 'inside') {
        // 移入目标文件夹
        console.log(`[Folder] Moving ${dragNode.title} into ${dropNode.title}`)
        await chrome.bookmarks.move(dragId, { parentId: dropId })
      } else {
        // before/after: 同层级排序或跨层级移动
        const targetParentId = dropNode.parentId
        let newIndex = dropNode.index ?? 0

        if (position === 'after') {
          newIndex++
        }

        // 如果是同一个父文件夹内移动，需要调整索引
        if (dragNode.parentId === targetParentId && (dragNode.index ?? 0) < (dropNode.index ?? 0)) {
          newIndex--
        }

        console.log(
          `[Folder] Moving ${dragNode.title} ${position} ${dropNode.title}, index: ${newIndex}`
        )
        await chrome.bookmarks.move(dragId, { parentId: targetParentId, index: newIndex })
      }

      await loadBookmarks()
    } catch (e) {
      console.error('Failed to move folder:', e)
    }
  }

  /**
   * 导航到文件夹
   */
  function navigateToFolder(folderId: string | null) {
    currentFolderId.value = folderId
  }

  /**
   * 获取文件夹路径 (面包屑导航)
   */
  function getFolderPathCompat(folderId: string | null): string[] {
    if (!store.value) return []
    return getFolderPath(store.value, folderId).map(f => f.title)
  }

  function getFolderPathObjects(folderId: string | null) {
    if (!store.value) return []
    return getFolderPath(store.value, folderId)
  }

  // 自动加载
  onMounted(() => {
    loadBookmarks()
  })

  /**
   * 移动书签
   */
  async function moveBookmark(
    draggedIndex: number,
    dropTargetIndex: number,
    position: 'before' | 'after' | 'inside'
  ) {
    if (!store.value) return

    const dragId = store.value.ids[draggedIndex]
    const dropId = store.value.ids[dropTargetIndex]

    try {
      if (position === 'inside') {
        // 移入文件夹
        if (isExtension.value) {
          await chrome.bookmarks.move(dragId, { parentId: dropId })
        } else {
          console.log('[Mock] Moved', dragId, 'into', dropId)
        }
      } else {
        if (isExtension.value) {
          // 获取源和目标的详细信息以正确计算索引
          const [dragNode] = await chrome.bookmarks.get(dragId)
          const [dropNode] = await chrome.bookmarks.get(dropId)

          if (!dragNode || !dropNode) {
            console.error('Node not found', dragId, dropId)
            return
          }

          const dropParentId = dropNode.parentId
          const dragParentId = dragNode.parentId

          // 跨文件夹拖拽处理
          if (dragParentId !== dropParentId) {
            // 移动到目标的父文件夹中，位置为目标的前/后
            let newIndex = dropNode.index ?? 0
            if (position === 'after') {
              newIndex++
            }
            console.log(
              `[Cross-folder] Moving ${dragId} to folder ${dropParentId}, index: ${newIndex}`
            )
            await chrome.bookmarks.move(dragId, { parentId: dropParentId, index: newIndex })
          } else {
            // 同文件夹内排序
            let newIndex = dropNode.index ?? 0
            if (position === 'after') {
              newIndex++
            }
            // 调整索引：如果拖拽项在目标之前，移动后目标索引会减1
            if ((dragNode.index ?? 0) < (dropNode.index ?? 0)) {
              newIndex--
            }
            console.log(`[Same-folder] Moving ${dragId} to index: ${newIndex}`)
            await chrome.bookmarks.move(dragId, { parentId: dropParentId, index: newIndex })
          }
        } else {
          console.log('[Mock] Moved', dragId, position, dropId)
        }
      }

      // Reload to reflect changes
      await loadBookmarks()
    } catch (e) {
      console.error('Failed to move bookmark:', e)
    }
  }

  return {
    // 数据
    store: computed(() => store.value),
    currentFolderId,
    isLoading,
    isExtension,

    // 计算属性
    currentBookmarkIndices,
    groupedBookmarkIndices,
    currentBookmarks,
    currentFolders,
    allBookmarkViews,

    // 兼容旧版 API
    folders,

    // 方法
    loadBookmarks,
    navigateToFolder,
    getFolderPath: getFolderPathCompat,
    getFolderPathObjects,

    // SoA 工具函数
    getBookmarkAt: (index: number) => (store.value ? getBookmarkAt(store.value, index) : null),
    findIndexById: (id: string) => (store.value ? findIndexById(store.value, id) : -1),
    moveBookmark,
    moveBookmarkToFolder,
    moveFolder,
    folderTreeRoots,
  }
}
