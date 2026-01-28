import { ref, watch, onUnmounted, computed, type ShallowRef } from 'vue'
import { type LocalPoem } from '../types'
import SearchWorker from '../workers/search.worker?worker'

export function usePoemSearch(store: ShallowRef<LocalPoem[]>) {
  const query = ref('')
  const resultIds = ref<string[]>([])
  const isSearching = ref(false)

  // Worker instance
  const worker = new SearchWorker()
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let isReady = false
  let pendingQuery = ''
  let searchId = 0

  // 1. 同步数据到 Worker
  watch(
    store,
    (poems) => {
      if (poems && poems.length > 0) {
        // 转换为 SoA 结构
        const ids = poems.map(p => p.id)
        const contents = poems.map(p => p.content)
        const authors = poems.map(p => p.author)
        const titles = poems.map(p => p.title || '')
        const dynasties = poems.map(p => p.dynasty || '')

        worker.postMessage({
          type: 'INIT',
          payload: {
            ids,
            contents,
            authors,
            titles,
            dynasties
          },
        })
      }
    },
    { immediate: true }
  )

  // 2. 处理 Worker 消息
  worker.onmessage = (e) => {
    const { type, results, id } = e.data

    if (type === 'READY') {
      isReady = true
      if (pendingQuery) {
        search(pendingQuery)
        pendingQuery = ''
      }
    }

    if (type === 'RESULT') {
      if (id !== searchId) return

      resultIds.value = results
      isSearching.value = false
    }
  }

  worker.onerror = (err) => {
    console.error('[PoemSearchWorker] Error:', err)
    isSearching.value = false
  }

  // 3. 搜索函数
  const search = (input: string) => {
    query.value = input

    if (debounceTimer) clearTimeout(debounceTimer)

    if (!input.trim()) {
      resultIds.value = []
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

  onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    worker.terminate()
  })

  // 计算属性：返回过滤后的诗词对象列表
  // 注意：这里我们根据 worker 返回的 ID 从 store 中查找对象
  // 为了保持 worker 返回的排序（打分顺序），我们需要按 ID 顺序映射
  const filteredPoems = computed(() => {
    if (!query.value.trim()) {
      return store.value
    }
    
    // 建立 ID -> Poem 映射 (优化查找性能)
    const poemMap = new Map(store.value.map(p => [p.id, p]))
    
    return resultIds.value
      .map(id => poemMap.get(id))
      .filter((p): p is LocalPoem => !!p)
  })

  return {
    query,
    isSearching,
    filteredPoems,
    search,
  }
}
