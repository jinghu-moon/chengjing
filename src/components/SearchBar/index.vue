<script setup lang="ts">
/**
 * SearchBar - 搜索栏编排器
 * 职责：组合子组件和 composables，管理搜索状态和数据流
 */
import { ref, computed } from 'vue'
import { useSettings } from '../../composables/useSettings'
import EngineSelector from './components/EngineSelector.vue'
import SearchInput from './components/SearchInput.vue'
import SuggestionPanel from './components/SuggestionPanel.vue'
import { useSearchHistory } from './composables/useSearchHistory'
import { useEngines } from './composables/useEngines'
import { useSuggestions } from './composables/useSuggestions'
import { useBangParser } from './composables/useBangParser'
import { useSearchLogic } from './composables/useSearchLogic'
import { useKeyboardNav } from './composables/useKeyboardNav'
import { usePanelData } from './composables/usePanelData'
import { useClipboard } from './composables/useClipboard'

const { settings } = useSettings()

// ==================== 搜索引擎 ====================
const {
  engines,
  currentEngine,
  selectEngine,
  findEngineByBang,
  selectNextEngine,
  checkedEngineIds,
} = useEngines()

// ==================== 搜索状态 ====================
const searchQuery = ref('')
const searchInputRef = ref<InstanceType<typeof SearchInput> | null>(null)
const widgetRef = ref<HTMLElement | null>(null)
const isActive = ref(false)
const selectedIndex = ref(-1)

/** 获取内部原生 input 元素（用于 focus/blur） */
const inputRef = computed(() => searchInputRef.value?.inputEl ?? null)

// ==================== 搜索历史 ====================
const {
  history, addHistory, removeHistory, clearHistory,
  filteredHistory, getEntryCount,
} = useSearchHistory()

// ==================== 搜索建议 ====================
const {
  suggestions: apiSuggestions,
  isLoading: isSuggestLoading,
  clearSuggestions,
} = useSuggestions(searchQuery)

// ==================== Bang 解析 ====================
const { parseBang, parseMultiBang, activeBang, bangHints } = useBangParser(searchQuery, findEngineByBang, engines)

// ==================== 剪贴板感知 ====================
const { clipboardHistory, readClipboard } = useClipboard(searchQuery)

// ==================== 面板数据 ====================
const { panelSuggestions, navigableCount, showPanel } = usePanelData({
  searchQuery, isActive, history,
  apiSuggestions, filteredHistory, getEntryCount,
  bangHints,
  clipboardHistory,
})

// ==================== 样式计算 ====================
const widgetStyle = computed(() => ({
  width: `${settings.searchBarWidth}%`,
}))

const barStyle = computed(() => ({
  height: `${settings.searchBarHeight}px`,
  '--search-radius': `${settings.searchBarRadius}px`,
  '--search-opacity': settings.searchBarOpacity / 100,
}))

const triggerStyle = computed(() => {
  const size = Math.min(48, settings.searchBarHeight - 8)
  return { height: `${size}px`, width: `${size}px`, borderRadius: `${settings.searchBarRadius}px` }
})

// ==================== 搜索逻辑 + 面板 + 键盘 ====================
let closePanelFn: () => void = () => {}

const { performSearch, isAnimating, handleSearchClick } = useSearchLogic({
  searchQuery,
  engines,
  currentEngine,
  checkedEngineIds,
  selectEngine,
  addHistory,
  parseBang,
  parseMultiBang,
  closePanel: () => closePanelFn(),
})

const {
  closePanel, handleInputFocus, handleKeydown,
  handleSuggestionSelect, handleSuggestionRemove,
  handleSuggestionClear, handleClearSearch,
} = useKeyboardNav({
  searchQuery, isActive, selectedIndex, showPanel,
  panelSuggestions, navigableCount, inputRef, widgetRef,
  selectNextEngine, performSearch, removeHistory, clearHistory, clearSuggestions,
})

// 包装 wrapper 函数处理剪贴板逻辑
const handleFocus = () => {
  handleInputFocus()
  readClipboard()
}

const handleClear = () => {
  handleInputFocus()
  readClipboard()
}



closePanelFn = closePanel
</script>

<template>
  <div ref="widgetRef" class="search-widget" :class="{ 'is-active': showPanel }" :style="widgetStyle">
    <!-- 搜索栏 -->
    <div class="search-bar" :style="barStyle">
      <!-- 引擎选择器 -->
      <EngineSelector :trigger-style="triggerStyle" />

      <!-- 搜索输入 -->
      <SearchInput
        ref="searchInputRef"
        v-model="searchQuery"
        :active-bang="activeBang"
        :is-animating="isAnimating"
        @focus="handleFocus"
        @keydown="handleKeydown"
        @search="handleSearchClick"
        @clear="handleClear"
      />
    </div>

    <!-- 建议面板 -->
    <Transition name="panel">
      <SuggestionPanel
        v-if="showPanel"
        :suggestions="panelSuggestions"
        :active-index="selectedIndex"
        :has-keyword="searchQuery.trim().length > 0"
        :history-count="history.length"
        :is-loading="isSuggestLoading"
        :keyword="searchQuery.trim()"
        @select="handleSuggestionSelect"
        @remove="handleSuggestionRemove"
        @clear="handleSuggestionClear"
        @clear-search="handleClearSearch"
      />
    </Transition>
  </div>
</template>

<style scoped>
/* ==================== 搜索组件容器 ==================== */
.search-widget {
  width: 100%;
  position: relative;
  z-index: var(--z-widget);
  display: flex;
  justify-content: center;
}

/* ==================== 搜索栏 ==================== */
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-panel);
  border: var(--border-glass);
  border-radius: var(--search-radius, 32px);
  backdrop-filter: var(--glass-md);
  -webkit-backdrop-filter: var(--glass-md);
  box-shadow: var(--shadow-sm);
  padding: 0 var(--space-5);
  z-index: calc(var(--z-dropdown) + 1);
  transition: background-color var(--duration-normal) var(--ease-smooth),
              border-color var(--duration-normal) var(--ease-smooth),
              border-radius var(--duration-normal) var(--ease-smooth),
              box-shadow var(--duration-normal) var(--ease-smooth),
              transform var(--duration-normal) var(--ease-smooth);
  width: 100%;
  min-width: 200px;
}

.search-bar:hover {
  background-color: var(--bg-hover-card);
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* 激活态：顶部圆角，底部直角，与面板无缝连接 */
.search-widget.is-active .search-bar {
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  background: var(--bg-panel-card);
  border-color: var(--color-border-strong);
  border-bottom-color: transparent;
  box-shadow: var(--shadow-md);
  transform: none;
}

/* ==================== 面板过渡动画 ==================== */
.panel-enter-active {
  transition: all 0.25s var(--ease-smooth);
}

.panel-leave-active {
  transition: all 0.15s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: scale(0.99);
}
</style>
