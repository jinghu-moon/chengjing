import { ref, type Ref } from 'vue'
import { useThrottleFn } from '@vueuse/core'
import { useSettings } from '../../../composables/useSettings'
import type { Engine } from '../types'
import { isLikelyUrl, normalizeUrl } from './useBangParser'
import type { BangResult, MultiBangResult } from './useBangParser'

/** 搜索逻辑配置 */
export interface UseSearchLogicOptions {
  searchQuery: Ref<string>
  engines: Ref<Engine[]>
  currentEngine: Ref<Engine>
  checkedEngineIds: Ref<Set<string>>
  selectEngine: (id: string) => void
  addHistory: (query: string, engineId?: string) => void
  parseBang: (input: string) => BangResult | null
  parseMultiBang: (input: string) => MultiBangResult | null
  closePanel: () => void
}

/** 构建引擎搜索 URL */
export function buildSearchUrl(engine: Engine, query: string): string {
  const encoded = encodeURIComponent(query)
  return engine.url.includes('%s')
    ? engine.url.replace('%s', encoded)
    : engine.url + encoded
}

/**
 * 搜索执行逻辑 Composable
 * 职责：URL 直达、Bang 解析、多引擎搜索、常规搜索，5 级优先级调度
 */
export function useSearchLogic(options: UseSearchLogicOptions) {
  const {
    searchQuery, engines, currentEngine, checkedEngineIds,
    selectEngine, addHistory, parseBang, parseMultiBang, closePanel,
  } = options

  const { settings } = useSettings()

  /** 导航到 URL */
  const navigateTo = (url: string) => {
    if (settings.generalOpenInNewTab) {
      window.open(url, '_blank')
    } else {
      window.location.href = url
    }
  }

  /** 在多个引擎中打开搜索（使用 chrome.tabs.create 避免弹窗拦截） */
  function openMultiSearch(targetEngines: Engine[], query: string) {
    for (const engine of targetEngines) {
      const url = buildSearchUrl(engine, query)
      if (chrome?.tabs) {
        chrome.tabs.create({ url, active: false })
      } else {
        window.open(url, '_blank')
      }
    }
  }

  /**
   * 执行搜索（5 级优先级）
   * 1. URL 直达
   * 2. Multi-Bang（如 !g+!bd vue3）
   * 3. 单 Bang 快捷切换（如 !b vue3）
   * 4. Ctrl+Enter 多引擎搜索
   * 5. 常规搜索
   */
  const performSearch = (query?: string, options?: { multi?: boolean }) => {
    const q = (query ?? searchQuery.value).trim()
    if (!q) return

    // 1. URL 直达
    if (isLikelyUrl(q)) {
      addHistory(q, currentEngine.value.id)
      navigateTo(normalizeUrl(q))
      closePanel()
      return
    }

    // 2. Multi-Bang（如 !g+!bd vue3）
    const multiBangResult = parseMultiBang(q)
    if (multiBangResult) {
      addHistory(multiBangResult.query, multiBangResult.engines[0].id)
      searchQuery.value = multiBangResult.query
      openMultiSearch(multiBangResult.engines, multiBangResult.query)
      closePanel()
      return
    }

    // 3. 单 Bang 快捷切换（如 !b vue3）
    const bangResult = parseBang(q)
    if (bangResult) {
      selectEngine(bangResult.engine.id)
      addHistory(bangResult.query, bangResult.engine.id)
      searchQuery.value = bangResult.query
      navigateTo(buildSearchUrl(bangResult.engine, bangResult.query))
      closePanel()
      return
    }

    // 4. Ctrl+Enter 多引擎搜索
    if (options?.multi) {
      if (checkedEngineIds.value.size > 0) {
        const targetEngines = engines.value.filter(e => checkedEngineIds.value.has(e.id))
        addHistory(q, currentEngine.value.id)
        searchQuery.value = q
        openMultiSearch(targetEngines, q)
        closePanel()
        return
      }
      // Fallback: 如果没有勾选，则视为普通 Enter
    }

    // 5. 常规搜索
    addHistory(q, currentEngine.value.id)
    searchQuery.value = q
    navigateTo(buildSearchUrl(currentEngine.value, q))
    closePanel()
  }

  // 搜索按钮点击动画状态
  const isAnimating = ref(false)
  const handleSearchClick = useThrottleFn(() => {
    isAnimating.value = true
    performSearch()
    setTimeout(() => { isAnimating.value = false }, 400)
  }, 400)

  return {
    performSearch,
    isAnimating,
    handleSearchClick,
    buildSearchUrl,
    navigateTo,
  }
}
