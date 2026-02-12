<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { IconBookmarks } from '@tabler/icons-vue'
import { Drawer } from '@/components/Container'
import { useBookmarks } from './composables/useBookmarks'
import { useBookmarkSearch } from './composables/useBookmarkSearch'
import BaseSearchInput from '../BaseSearchInput.vue'
import SearchResults from './components/SearchResults.vue'
import FolderTree from './components/FolderTree.vue'
import Breadcrumb from './components/Breadcrumb.vue'
import BookmarkGrid from './components/BookmarkGrid.vue'
import type { SearchResult } from './types'

const isOpen = defineModel<boolean>('open', { default: false })

// Data & State

// Import DropEvent
import type { DropEvent } from './composables/useBookmarkDrag'

// Destructure moveBookmark
const {
  store,
  folderTreeRoots,
  currentFolderId,
  currentBookmarkIndices,
  groupedBookmarkIndices,
  getFolderPath,
  navigateToFolder,
  getBookmarkAt,
  moveBookmark,
  moveBookmarkToFolder,
  moveFolder,
  getFolderPathObjects,
  findIndexById,
  // CRUD 操作
  editBookmarkTitle,
  editBookmarkUrl,
  deleteBookmark,
  copyBookmarkUrl,
} = useBookmarks()

// ... existing code ...

// Duplicate removed

const handleMove = (event: DropEvent) => {
  if (event.dropTargetFolderId !== undefined && event.dropTargetFolderId !== null) {
    moveBookmarkToFolder(event.draggedIndex, event.dropTargetFolderId)
  } else if (event.dropTargetIndex !== undefined) {
    moveBookmark(event.draggedIndex, event.dropTargetIndex, event.position)
  }
}

const handleFolderMove = (
  dragId: string,
  dropId: string,
  position: 'before' | 'after' | 'inside'
) => {
  moveFolder(dragId, dropId, position)
}

const { query, results, isSearching, hasQuery, search, clearSearch } = useBookmarkSearch(store)

// Refs
const searchInputRef = ref<InstanceType<typeof BaseSearchInput> | null>(null)
const searchResultsRef = ref<InstanceType<typeof SearchResults> | null>(null)

// 面包屑路径
const breadcrumbPath = computed(() => {
  if (currentFolderId.value === null) return []
  return getFolderPathObjects(currentFolderId.value)
})

// Computed - 搜索结果转换为 SoA 索引 (用于 BookmarkGrid)
const searchResultIndices = computed(() => {
  if (!hasQuery.value || !store.value) return []
  // SoASearchResult already has 'index' (number)
  return results.value.map(r => r.index)
})

// 兼容旧版 SearchResults 组件的结果格式
const searchResultsCompat = computed<SearchResult[]>(() => {
  if (!hasQuery.value || !store.value) return []

  return results.value
    .map(r => {
      const view = getBookmarkAt(r.index)
      if (!view) return null

      return {
        bookmark: {
          id: view.id,
          title: view.title,
          url: view.url,
          folderId: view.parentId || null,
        },
        path: getFolderPath(view.parentId || null),
        score: r.score || 0,
      } as SearchResult
    })
    .filter((r): r is SearchResult => r !== null)
})

const displayBookmarkIndices = computed<number[]>(() => {
  if (!store.value) return []

  if (hasQuery.value) {
    return searchResultIndices.value
  }
  // 根目录显示所有书签，子文件夹显示当前文件夹书签
  // useBookmarks already exposes `currentBookmarkIndices` (checks logic internally)
  if (currentFolderId.value === null) {
    // 根目录逻辑：所有非文件夹项（假设 allBookmarkViews 对应的逻辑）
    // 为了性能，我们应该在 useBookmarks 中直接暴露 allBookmarkIndices
    // 这里暂时手动过滤
    const indices: number[] = []
    for (let i = 0; i < store.value.count; i++) {
      if (store.value.isFolder[i] === 0) indices.push(i)
    }
    return indices
  }

  return currentBookmarkIndices.value
})

const currentFolderName = computed(() => {
  if (currentFolderId.value === null) return '全部书签'
  if (!store.value) return 'Loading...'

  const idx = findIndexById(currentFolderId.value)
  if (idx !== -1) {
    return store.value.titles[idx]
  }
  return '未知文件夹'
})

// 多级 ESC 退出：搜索 → 文件夹 → 关闭（由 Drawer 的 onBeforeClose 驱动）
const handleBeforeClose = (): boolean | void => {
  if (hasQuery.value) {
    clearSearch()
    return false // 阻止关闭
  }
  if (currentFolderId.value !== null) {
    navigateToFolder(null)
    return false // 阻止关闭
  }
  // 返回 undefined，允许 Drawer 正常关闭
}

const handleSearchInput = (value: string) => {
  search(value)
}

const handleSearchResult = (result: SearchResult) => {
  window.open(result.bookmark.url, '_blank')
}

const handleBookmarkSelect = (index: number) => {
  if (!store.value) return
  const url = store.value.urls[index]
  if (url) window.open(url, '_blank')
}

const handleFolderSelect = (folderId: string | null) => {
  navigateToFolder(folderId)
  clearSearch()
}

const handleBreadcrumbNavigate = (folderId: string | null) => {
  navigateToFolder(folderId)
  clearSearch()
}

// Keyboard handler for search results navigation
const handleSearchKeydown = (e: KeyboardEvent) => {
  if (hasQuery.value && searchResultsRef.value) {
    searchResultsRef.value.handleKeydown(e)
  }
}

// Ctrl+K 聚焦搜索（仅在 Drawer 打开时生效）
const onCtrlK = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}

// Focus search on open + 清理状态 on close
watch(isOpen, (val) => {
  if (val) {
    setTimeout(() => searchInputRef.value?.focus(), 100)
    window.addEventListener('keydown', onCtrlK)
  } else {
    clearSearch()
    navigateToFolder(null)
    window.removeEventListener('keydown', onCtrlK)
  }
})
</script>

<template>
  <Drawer
    v-model:open="isOpen"
    title="书签"
    :icon="IconBookmarks"
    width="700px"
    :on-before-close="handleBeforeClose"
    :body-style="{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }"
  >
    <!-- Search -->
    <div class="search-section">
      <BaseSearchInput
        ref="searchInputRef"
        :model-value="query"
        placeholder="搜索书签..."
        shortcut="Ctrl+K"
        @update:model-value="handleSearchInput"
        @keydown="handleSearchKeydown"
      />
    </div>

    <!-- Content (Split View) -->
    <div class="drawer-content-row">
      <!-- Sidebar: Folder Tree -->
      <aside class="sidebar">
        <FolderTree
          :roots="folderTreeRoots"
          :current-folder-id="currentFolderId"
          @select="handleFolderSelect"
          @folder-move="handleFolderMove"
        />
      </aside>

      <!-- Main: Grid or Results -->
      <main class="main-content">
        <!-- Search Results (if searching) -->
        <template v-if="hasQuery">
          <SearchResults
            ref="searchResultsRef"
            :results="searchResultsCompat"
            :query="query"
            :is-loading="isSearching"
            @select="handleSearchResult"
          />
        </template>

        <!-- Normal View (Vertical Layout) -->
        <template v-else>
          <!-- Bookmark Count Header -->
          <div class="area-header">
            <Breadcrumb
              v-if="currentFolderId !== null"
              :path="breadcrumbPath"
              @navigate="handleBreadcrumbNavigate"
            />
            <span v-else class="folder-name">{{ currentFolderName }}</span>

            <span class="bookmark-count">{{ displayBookmarkIndices.length }} 个书签</span>
          </div>

          <!-- Bookmark Grid -->
          <div class="grid-container">
            <BookmarkGrid
              v-if="store"
              :store="store"
              :groups="groupedBookmarkIndices"
              @select="handleBookmarkSelect"
              @open="handleBookmarkSelect"
              @move="handleMove"
              @edit-title="editBookmarkTitle"
              @edit-url="editBookmarkUrl"
              @delete="deleteBookmark"
              @copy-link="copyBookmarkUrl"
            />
          </div>
        </template>
      </main>
    </div>
  </Drawer>
</template>

<style scoped>
/* Search */
.search-section {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-glass);
  flex-shrink: 0;
}

/* Split View Layout */
.drawer-content-row {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  min-width: 200px;
  border-right: 1px solid var(--border-glass);
  background: rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  /* Prevent flex overflow */
}

/* Area Header */
.area-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 8px;
  /* More top padding */
  flex-shrink: 0;
}

.folder-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.bookmark-count {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* Grid Container */
.grid-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0 16px 16px;
  /* Better padding */
}
</style>
