import { computed, type Ref, type ComputedRef } from 'vue'
import type { SuggestionItem } from '../types'

/** Bang 提示项 */
export interface BangHint {
  bang: string
  name: string
  icon: string
}

/** 面板数据合成配置 */
export interface UsePanelDataOptions {
  searchQuery: Ref<string>
  isActive: Ref<boolean>
  history: ComputedRef<string[]>
  apiSuggestions: Ref<string[]>
  filteredHistory: (keyword: string) => string[]
  getEntryCount: (query: string) => number
  /** Bang 提示列表（由 useBangParser 提供） */
  bangHints: ComputedRef<BangHint[]>
  /** 剪贴板历史（由 useClipboard 提供） */
  clipboardHistory: Ref<{ text: string; isUrl: boolean }[]>
}

/**
 * 建议面板数据合成 Composable
 * 职责：合并历史 + API 建议、Bang 提示、去重、面板显示状态
 */
export function usePanelData(options: UsePanelDataOptions) {
  const {
    searchQuery, isActive, history,
    apiSuggestions, filteredHistory, getEntryCount,
    bangHints, clipboardHistory,
  } = options

  /** 合并历史 + API 建议，去重，历史优先 */
  const mergedSuggestions = computed<SuggestionItem[]>(() => {
    const keyword = searchQuery.value.trim()
    const result: SuggestionItem[] = []
    const seen = new Set<string>()

    // 第一层：匹配的历史记录（最多 3 条）
    const historyMatches = filteredHistory(keyword).slice(0, 3)
    for (const h of historyMatches) {
      seen.add(h.toLowerCase())
      result.push({ text: h, source: 'history', count: getEntryCount(h) })
    }

    // 第二层：API 建议（去重，最多 5 条）
    for (const s of apiSuggestions.value) {
      if (!seen.has(s.toLowerCase())) {
        seen.add(s.toLowerCase())
        result.push({ text: s, source: 'suggestion' })
      }
      if (result.length >= 8) break
    }

    return result
  })

  /** 无关键词时展示完整历史 */
  const historyOnlySuggestions = computed<SuggestionItem[]>(() =>
    history.value.map(h => ({ text: h, source: 'history' as const, count: getEntryCount(h) }))
  )

  /** Bang 提示转为 SuggestionItem */
  const bangSuggestions = computed<SuggestionItem[]>(() =>
    bangHints.value.map(h => ({
      text: h.name,
      source: 'bang' as const,
      icon: h.icon,
      bang: h.bang,
    }))
  )

  /** 剪贴板提示条目（多条） */
  const clipboardSuggestions = computed<SuggestionItem[]>(() => {
    return clipboardHistory.value
      .filter(item => item.text !== searchQuery.value.trim()) // 过滤掉与当前搜索词相同的
      .map(item => {
        const displayText = item.isUrl
          ? item.text
          : (item.text.length > 50 ? item.text.slice(0, 50) + '...' : item.text)
        return {
          text: displayText,
          source: 'clipboard' as const,
          // 借用 bang 字段存储完整文本
          bang: item.text,
        }
      })
  })

  /** 最终传给面板的列表：剪贴板 > Bang 提示 > 常规建议 */
  const panelSuggestions = computed<SuggestionItem[]>(() => {
    const items: SuggestionItem[] = []

    // 剪贴板提示始终置顶（多条）
    if (clipboardSuggestions.value.length > 0) items.push(...clipboardSuggestions.value)

    // 输入 ! 时优先显示 Bang 提示
    if (bangSuggestions.value.length > 0) {
      items.push(...bangSuggestions.value)
      return items
    }

    // 常规建议
    const regularItems = searchQuery.value.trim().length > 0
      ? mergedSuggestions.value
      : historyOnlySuggestions.value
    items.push(...regularItems)

    return items
  })

  /** 可导航项总数 */
  const navigableCount = computed(() => panelSuggestions.value.length)

  /** 面板是否可见（有剩贴板内容时也显示） */
  const showPanel = computed(() =>
    isActive.value && (history.value.length > 0 || searchQuery.value.trim().length > 0 || clipboardHistory.value.length > 0)
  )

  return {
    panelSuggestions,
    navigableCount,
    showPanel,
  }
}
