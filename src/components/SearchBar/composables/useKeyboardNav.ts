import { watch, type Ref, type ComputedRef } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import type { SuggestionItem } from '../types'
import { useSettings } from '../../../composables/useSettings'

/** 键盘导航配置 */
export interface UseKeyboardNavOptions {
  searchQuery: Ref<string>
  isActive: Ref<boolean>
  selectedIndex: Ref<number>
  showPanel: ComputedRef<boolean>
  panelSuggestions: ComputedRef<SuggestionItem[]>
  navigableCount: ComputedRef<number>
  inputRef: Ref<HTMLInputElement | null>
  widgetRef: Ref<HTMLElement | null>
  selectNextEngine: () => void
  performSearch: (query?: string, options?: { multi?: boolean }) => void
  removeHistory: (query: string) => void
  clearHistory: () => void
  clearSuggestions: () => void
}

/**
 * 键盘导航和面板交互 Composable
 * 职责：面板开关、键盘快捷键、建议列表导航、点击外部关闭
 */
export function useKeyboardNav(options: UseKeyboardNavOptions) {
  const {
    searchQuery, isActive, selectedIndex, showPanel,
    panelSuggestions, navigableCount, inputRef, widgetRef,
    selectNextEngine, performSearch, removeHistory, clearHistory, clearSuggestions,
  } = options

  // ==================== 面板交互 ====================

  const openPanel = () => {
    isActive.value = true
    inputRef.value?.focus()
  }

  const closePanel = () => {
    isActive.value = false
    selectedIndex.value = -1
    clearSuggestions()
    inputRef.value?.blur()
  }

  const handleInputFocus = () => { isActive.value = true }

  // 点击外部关闭面板（VueUse 自动清理）
  onClickOutside(widgetRef, () => closePanel())

  // ==================== 键盘导航 ====================

  const handleKeydown = (e: KeyboardEvent) => {
    // Tab 切换引擎（无论面板是否打开都生效）
    if (e.key === 'Tab') {
      e.preventDefault()
      selectNextEngine()
      return
    }

    if (!showPanel.value) {
      if (e.key === 'Enter') {
        const multiMode = e.ctrlKey || e.metaKey
        performSearch(undefined, { multi: multiMode })
      }
      return
    }

    const total = navigableCount.value

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!isActive.value) { openPanel(); return }
        selectedIndex.value = selectedIndex.value < total - 1 ? selectedIndex.value + 1 : 0
        break

      case 'ArrowUp':
        e.preventDefault()
        selectedIndex.value = selectedIndex.value > 0 ? selectedIndex.value - 1 : total - 1
        break

      case 'Enter':
        e.preventDefault()
        {
          const multiMode = e.ctrlKey || e.metaKey
          if (selectedIndex.value >= 0 && selectedIndex.value < panelSuggestions.value.length) {
            const item = panelSuggestions.value[selectedIndex.value]
            // Bang 提示：填入搜索框而非执行搜索
            if (item.source === 'bang' && item.bang) {
              searchQuery.value = item.bang + ' '
              selectedIndex.value = -1
            // 剪贴板提示：填入搜索框（使用 bang 字段存储的完整文本）
            } else if (item.source === 'clipboard') {
              searchQuery.value = item.bang || item.text
              selectedIndex.value = -1
            } else {
              performSearch(item.text, { multi: multiMode })
            }
          } else {
            performSearch(undefined, { multi: multiMode })
          }
        }
        break

      case 'Escape':
        e.preventDefault()
        closePanel()
        break

      case 'Delete':
      case 'Backspace':
        if (selectedIndex.value >= 0 && selectedIndex.value < panelSuggestions.value.length) {
          const item = panelSuggestions.value[selectedIndex.value]
          // 只有历史记录才能删除
          if (item.source === 'history') {
            e.preventDefault()
            removeHistory(item.text)
            if (selectedIndex.value >= navigableCount.value) {
              selectedIndex.value = Math.max(0, navigableCount.value - 1)
            }
          }
        }
        break
    }
  }

  // Ctrl+K 全局快捷键（VueUse 自动清理）
  onKeyStroke('k', (e) => {
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault()
      openPanel()
    }
  }, { target: document })

  // 事件处理函数
  const { settings: navSettings } = useSettings()
  const handleSuggestionSelect = (query: string) => {
    // Bang 提示的 query 已经是 '!g ' 格式（由 SuggestionPanel emit），填入搜索框
    const prefix = navSettings.searchBangPrefix || '!'
    if (query.startsWith(prefix) && query.endsWith(' ') && !query.trim().includes(' ')) {
      searchQuery.value = query
      selectedIndex.value = -1
      inputRef.value?.focus()
    } else {
      // 剪贴板和普通建议：填入搜索框（剪贴板条目由 SuggestionPanel emit 完整文本）
      searchQuery.value = query
      performSearch(query)
    }
  }
  const handleSuggestionRemove = (query: string) => removeHistory(query)
  const handleSuggestionClear = () => clearHistory()
  const handleClearSearch = () => {
    searchQuery.value = ''
    inputRef.value?.focus()
  }

  // 输入变化时重置选中索引
  watch(searchQuery, () => { selectedIndex.value = -1 })

  return {
    openPanel,
    closePanel,
    handleInputFocus,
    handleKeydown,
    handleSuggestionSelect,
    handleSuggestionRemove,
    handleSuggestionClear,
    handleClearSearch,
  }
}
