import { ref, watch, onUnmounted, type Ref } from 'vue'
import { debounce } from '@/utils/debounce'
import { useSettings } from '@/composables/useSettings'
import type { SuggestionProvider, SuggestionProviderId } from '../types'
import { googleProvider, baiduProvider, bingProvider } from '../providers'

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2

// ==================== 建议缓存 ====================
const CACHE_TTL = 5 * 60_000 // 5 分钟过期
const CACHE_MAX = 50

interface CacheEntry {
  data: string[]
  ts: number
}

/** 模块级缓存，所有实例共享 */
const cache = new Map<string, CacheEntry>()

function getCached(key: string): string[] | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCache(key: string, data: string[]) {
  // 超出容量，淘汰最旧的
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value!
    cache.delete(oldest)
  }
  cache.set(key, { data, ts: Date.now() })
}

/** Provider 注册表 */
const providerMap: Record<string, SuggestionProvider> = {
  google: googleProvider,
  baidu: baiduProvider,
  bing: bingProvider,
}

/** 供设置面板等外部消费的选项列表（单一数据源） */
export const SUGGESTION_PROVIDER_OPTIONS = Object.values(providerMap).map(p => ({
  value: p.id,
  label: p.name,
}))

/**
 * 搜索建议 Composable
 * 职责：debounce 请求、AbortController 竞态控制、provider 调度
 */
export function useSuggestions(query: Ref<string>) {
  const { settings } = useSettings()
  const suggestions = ref<string[]>([])
  const isLoading = ref(false)
  let abortController: AbortController | null = null

  function getProvider(): SuggestionProvider | undefined {
    const id = settings.searchSuggestionProvider as SuggestionProviderId
    if (id === 'off') return undefined
    return providerMap[id]
  }

  const debouncedFetch = debounce(async (q: string) => {
    // 取消上一次未完成的请求
    abortController?.abort()
    abortController = new AbortController()

    const provider = getProvider()
    if (!provider) {
      suggestions.value = []
      isLoading.value = false
      return
    }

    // 命中缓存，直接返回
    const cacheKey = `${provider.id}:${q}`
    const cached = getCached(cacheKey)
    if (cached) {
      suggestions.value = cached
      isLoading.value = false
      return
    }

    isLoading.value = true
    try {
      const result = await provider.fetch(q, abortController.signal)
      suggestions.value = result
      setCache(cacheKey, result)
    } catch (e) {
      // AbortError 是正常取消，不清空（新请求会覆盖）
      if ((e as Error).name !== 'AbortError') {
        suggestions.value = []
      }
    } finally {
      isLoading.value = false
    }
  }, DEBOUNCE_MS)

  watch(query, (q) => {
    const trimmed = q.trim()

    // 关闭状态或输入过短，直接清空
    if (settings.searchSuggestionProvider === 'off' || trimmed.length < MIN_QUERY_LENGTH) {
      suggestions.value = []
      isLoading.value = false
      debouncedFetch.cancel()
      return
    }

    // 同步缓存快路径：命中则跳过 debounce，零延迟返回
    const providerId = settings.searchSuggestionProvider
    if (providerId !== 'off') {
      const cached = getCached(`${providerId}:${trimmed}`)
      if (cached) {
        suggestions.value = cached
        isLoading.value = false
        debouncedFetch.cancel()
        return
      }
    }

    debouncedFetch(trimmed)
  })

  // 组件卸载时清理
  onUnmounted(() => {
    debouncedFetch.cancel()
    abortController?.abort()
  })

  /** 手动清空建议 */
  function clearSuggestions() {
    suggestions.value = []
    debouncedFetch.cancel()
    abortController?.abort()
  }

  return {
    suggestions,
    isLoading,
    clearSuggestions,
  }
}
