import { ref, watch, onUnmounted, computed, type ShallowRef } from 'vue'
import type { BookmarkStore, SoASearchResult } from '../types'
import SearchWorker from '../workers/search.worker?worker'

/**
 * SoA 优化版搜索
 * 直接接收 BookmarkStore，避免 Bookmark[] 对象创建
 */
export function useBookmarkSearch(store: ShallowRef<BookmarkStore | null>) {
  const query = ref('')
  const results = ref<SoASearchResult[]>([])
  const isSearching = ref(false)

  // Worker instance
  const worker = new SearchWorker()
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let isReady = false
  let pendingQuery = ''
  let searchId = 0

  // 1. 直接从 SoA 同步到 Worker（零对象创建）
  watch(
    store,
    val => {
      if (val && val.count > 0) {
        // ✅ 直接传递 SoA 数组，无需遍历创建新数组
        worker.postMessage({
          type: 'INIT',
          payload: {
            ids: Array.from(val.ids),
            titles: Array.from(val.titles),
            urls: Array.from(val.urls),
            dates: val.dates, // Float64Array 可直接传输
          },
        })
      }
    },
    { immediate: true }
  )

  // 2. Handle Worker messages
  worker.onmessage = e => {
    const { type, results: resultIds, id } = e.data

    if (type === 'READY') {
      isReady = true
      if (pendingQuery) {
        search(pendingQuery)
        pendingQuery = ''
      }
    }

    if (type === 'RESULT') {
      // Race condition fix
      if (id !== searchId) {
        return
      }

      // ✅ 直接返回索引，不创建对象
      // 后续组件通过 store.ids[index] 等访问
      const searchResults: SoASearchResult[] = []
      const currentStore = store.value

      if (currentStore) {
        for (const bookmarkId of resultIds) {
          // 找到 ID 对应的索引
          const index = currentStore.ids.indexOf(bookmarkId)
          if (index !== -1) {
            searchResults.push({
              index,
              score: 0,
            })
          }
        }
      }

      results.value = searchResults
      isSearching.value = false
    }
  }

  // 3. Error handling
  worker.onerror = err => {
    console.error('[SearchWorker] Error:', err)
    isSearching.value = false
  }

  // 4. Search function
  const search = (input: string) => {
    query.value = input

    if (debounceTimer) clearTimeout(debounceTimer)

    if (!input.trim()) {
      results.value = []
      isSearching.value = false
      pendingQuery = ''
      return
    }

    isSearching.value = true

    if (!isReady) {
      pendingQuery = input
      return
    }

    const currentSearchId = ++searchId

    debounceTimer = setTimeout(() => {
      worker.postMessage({ type: 'SEARCH', payload: { query: input, id: currentSearchId } })
    }, 50)
  }

  const clearSearch = () => {
    query.value = ''
    results.value = []
    isSearching.value = false
    pendingQuery = ''
    searchId++
  }

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    worker.terminate()
  })

  return {
    query,
    results,
    isSearching,
    hasQuery: computed(() => query.value.trim().length > 0),
    search,
    clearSearch,
  }
}
