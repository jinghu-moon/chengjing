<script setup lang="ts">
import { computed } from 'vue'
import { IconHistory, IconX, IconSearch, IconArrowUpRight, IconTerminal2, IconClipboard } from '@tabler/icons-vue'
import type { SuggestionItem } from '../types'

const props = defineProps<{
  suggestions: SuggestionItem[]
  activeIndex: number
  hasKeyword: boolean
  historyCount: number
  isLoading: boolean
  /** 当前搜索关键词，用于高亮匹配文本 */
  keyword?: string
}>()

const emit = defineEmits<{
  select: [query: string]
  remove: [query: string]
  clear: []
  clearSearch: []
}>()

/** 按来源拆分：历史在上、建议在下、Bang 提示独立 */
const historyItems = computed(() => props.suggestions.filter(s => s.source === 'history'))
const suggestionItems = computed(() => props.suggestions.filter(s => s.source === 'suggestion'))
const bangItems = computed(() => props.suggestions.filter(s => s.source === 'bang'))
const clipboardItems = computed(() => props.suggestions.filter(s => s.source === 'clipboard'))

const hasItems = computed(() => props.suggestions.length > 0)
const noResults = computed(() => !hasItems.value && !props.isLoading && props.hasKeyword)

/** 高亮匹配关键词 */
function highlightText(text: string): string {
  const kw = props.keyword?.trim()
  if (!kw) return text
  const escaped = kw.replace(/[.*+?^$()|[\]\\]/g, '\\$&')
  return text.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark class="history-highlight">$1</mark>',
  )
}

/** 计算全局索引（历史 + 建议连续编号，Bang 提示直接用原始索引） */
/** 计算全局索引（剪贴板 -> Bang -> 历史 -> 建议） */
function globalIndex(source: 'history' | 'suggestion' | 'bang' | 'clipboard', localIdx: number): number {
  if (source === 'clipboard') return localIdx
  
  const clipboardOffset = clipboardItems.value.length
  
  if (source === 'bang') return clipboardOffset + localIdx
  
  // Bang 提示和普通建议/历史互斥：有 Bang 时不显示历史/建议
  if (bangItems.value.length > 0) return clipboardOffset + bangItems.value.length // should be unreachable for history/suggestion if bang exists, but for safety
  
  // 没有 Bang 时：历史 -> 建议
  return source === 'history'
    ? clipboardOffset + localIdx
    : clipboardOffset + historyItems.value.length + localIdx
}
</script>

<template>
  <div class="history-panel">
    <div class="suggestion-scroll">
      <!-- 剪贴板提示 (多条) -->
      <template v-if="clipboardItems.length > 0">
        <div
          v-for="(item, idx) in clipboardItems"
          :key="`clip-${item.text}`"
          class="clipboard-item"
          :class="{ 'is-selected': globalIndex('clipboard', idx) === activeIndex }"
          @mousedown.prevent="emit('select', item.bang || item.text)"
        >
          <span class="nav-indicator">→</span>
          <IconClipboard :size="14" :stroke-width="1.5" class="item-icon clipboard-icon" />
          <span class="clipboard-label">{{ item.text?.startsWith('http') ? '粘贴访问' : '粘贴搜索' }}</span>
          <span class="item-text clipboard-text">{{ item.text }}</span>
        </div>
        <div class="panel-divider" />
      </template>

      <!-- 剪贴板与下方内容的分隔线 -->
      <div v-if="clipboardItems.length > 0 && (historyItems.length > 0 || suggestionItems.length > 0 || bangItems.length > 0)" class="panel-divider" />

      <!-- 历史记录 -->
      <ul v-if="historyItems.length > 0" class="history-list">
        <li
          v-for="(item, idx) in historyItems"
          :key="`h-${item.text}`"
          class="history-item"
          :class="{ 'is-selected': globalIndex('history', idx) === activeIndex }"
          @mousedown.prevent="emit('select', item.text)"
        >
          <span class="nav-indicator">→</span>
          <IconHistory :size="14" :stroke-width="1.5" class="item-icon" />
          <span class="item-text" v-html="highlightText(item.text)" />
          <span v-if="item.count && item.count > 1" class="count-badge">{{ item.count }}</span>
          <span class="delete-icon" @mousedown.prevent.stop="emit('remove', item.text)">
            <IconX :size="12" :stroke-width="2" />
          </span>
        </li>
      </ul>

      <!-- 分隔线 -->
      <div v-if="historyItems.length > 0 && suggestionItems.length > 0" class="panel-divider" />

      <!-- Bang 提示 -->
      <ul v-if="bangItems.length > 0" class="history-list">
        <li
          v-for="(item, idx) in bangItems"
          :key="`b-${item.bang}`"
          class="history-item"
          :class="{ 'is-selected': globalIndex('bang', idx) === activeIndex }"
          @mousedown.prevent="emit('select', item.bang + ' ')"
        >
          <span class="nav-indicator">→</span>
          <IconTerminal2 :size="14" :stroke-width="1.5" class="item-icon suggestion-icon" />
          <span class="bang-command">{{ item.bang }}</span>
          <span class="item-text">{{ item.text }}</span>
        </li>
      </ul>

      <!-- 搜索建议 -->
      <ul v-if="suggestionItems.length > 0" class="history-list">
        <li
          v-for="(item, idx) in suggestionItems"
          :key="`s-${item.text}`"
          class="history-item"
          :class="{ 'is-selected': globalIndex('suggestion', idx) === activeIndex }"
          @mousedown.prevent="emit('select', item.text)"
        >
          <span class="nav-indicator">→</span>
          <IconArrowUpRight :size="14" :stroke-width="1.5" class="item-icon suggestion-icon" />
          <span class="item-text" v-html="highlightText(item.text)" />
        </li>
      </ul>

      <!-- Loading 指示器 -->
      <div v-if="isLoading && !hasItems" class="suggestion-loading">
        <span class="loading-dot" /><span class="loading-dot" /><span class="loading-dot" />
      </div>

      <!-- 无结果 -->
      <div v-if="noResults" class="no-results">
        <IconSearch :size="28" :stroke-width="1.5" />
        <p>未找到相关结果</p>
        <span class="clear-search-btn" @mousedown.prevent="emit('clearSearch')">清除搜索</span>
      </div>

      <!-- 底部清除 -->
      <div v-if="historyCount > 0 && !hasKeyword" class="panel-footer">
        <span class="clear-all-btn" @mousedown.prevent="emit('clear')">清除全部历史</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==================== 面板容器 ==================== */
.history-panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: -1px;
  background: var(--bg-panel);
  backdrop-filter: var(--glass-md);
  -webkit-backdrop-filter: var(--glass-md);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  border: 1px solid var(--color-border-strong);
  border-top: none;
  box-shadow: var(--shadow-lg);
  z-index: var(--z-dropdown);
  max-height: 400px;
  display: flex;
  flex-direction: column;
  transform-origin: top center;
}

.suggestion-scroll {
  overflow-y: auto;
  padding: var(--space-3);
}

.suggestion-scroll::-webkit-scrollbar { width: 4px; }
.suggestion-scroll::-webkit-scrollbar-track { background: transparent; }
.suggestion-scroll::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb);
  border-radius: var(--radius-full);
}
.suggestion-scroll::-webkit-scrollbar-thumb:hover {
  background-color: var(--scrollbar-thumb-hover);
}

/* ==================== 历史条目 ==================== */
.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--comp-padding-sm);
  margin: 0 var(--space-1);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-smooth),
              transform var(--duration-fast) var(--ease-smooth);
  font-size: var(--text-base);
}

.history-item:hover {
  background-color: var(--mask-light);
}

.history-item.is-selected {
  background-color: var(--color-primary-alpha);
}

.item-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
  transition: color var(--duration-fast) var(--ease-smooth);
}

/* ==================== 导航箭头 ==================== */
.nav-indicator {
  width: 1.5rem;
  text-align: center;
  color: var(--color-primary);
  font-weight: bold;
  opacity: 0;
  transform: translateX(-8px);
  transition: opacity var(--duration-fast) var(--ease-smooth),
              transform var(--duration-fast) var(--ease-smooth);
  flex-shrink: 0;
}

.history-item.is-selected .nav-indicator {
  opacity: 1;
  transform: translateX(0);
}

.history-item:hover .item-icon,
.history-item.is-selected .item-icon {
  color: var(--color-primary);
}

.item-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: var(--weight-medium);
  letter-spacing: var(--letter-spacing-normal);
}

/* ==================== 搜索次数徽章 ==================== */
.count-badge {
  font-size: 11px;
  line-height: 1;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  background: var(--color-primary-alpha, rgba(136, 192, 208, 0.15));
  color: var(--color-primary);
  font-weight: 600;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.delete-icon {
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--height-xs);
  height: var(--height-xs);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: opacity var(--duration-fast) var(--ease-smooth),
              background-color var(--duration-fast) var(--ease-smooth),
              color var(--duration-fast) var(--ease-smooth);
  flex-shrink: 0;
}

.history-item:hover .delete-icon,
.history-item.is-selected .delete-icon {
  opacity: 1;
}

.delete-icon:hover {
  background-color: var(--color-danger-light);
  color: var(--color-danger);
}

/* ==================== 无结果 ==================== */
.no-results {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

.no-results svg {
  margin-bottom: var(--space-2);
  opacity: 0.3;
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.clear-search-btn {
  display: inline-block;
  margin-top: var(--space-2);
  color: var(--color-primary);
  cursor: pointer;
  font-size: var(--text-xs);
  padding: var(--comp-padding-xs);
  border-radius: var(--radius-sm);
  transition: background-color var(--duration-fast) var(--ease-smooth);
}

.clear-search-btn:hover {
  background-color: var(--color-primary-light);
}

/* ==================== 底部清除 ==================== */
.panel-footer {
  padding: var(--space-2) var(--space-4);
  display: flex;
  justify-content: flex-end;
}

.clear-all-btn {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color var(--duration-fast) var(--ease-smooth),
              background-color var(--duration-fast) var(--ease-smooth);
  padding: var(--comp-padding-xs);
  border-radius: var(--radius-sm);
}

.clear-all-btn:hover {
  color: var(--color-danger);
  background-color: var(--color-danger-light);
}

/* ==================== 关键词高亮 ==================== */
:deep(.history-highlight) {
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb, 136, 192, 208), 0.15);
  border-radius: 2px;
  padding: 0 1px;
  font-weight: 600;
}

/* ==================== 分隔线 ==================== */
.panel-divider {
  height: 1px;
  background: var(--color-divider);
  margin: var(--space-2) var(--space-3);
}

/* ==================== 建议图标 ==================== */
.suggestion-icon {
  color: var(--text-quaternary, var(--text-tertiary));
  opacity: 0.6;
}

/* ==================== Bang 命令标签 ==================== */
.bang-command {
  font-family: var(--font-family-mono);
  font-size: var(--text-sm);
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb, 136, 192, 208), 0.1);
  padding: 1px 6px;
  border-radius: var(--radius-xs);
  font-weight: 600;
  flex-shrink: 0;
}

/* ==================== 剪贴板提示 ==================== */
.clipboard-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background-color 0.15s;
  font-size: var(--text-sm);
}

.clipboard-item:hover,
.clipboard-item.is-selected {
  background: var(--bg-hover);
}

.clipboard-item.is-selected .nav-indicator {
  opacity: 1;
}

.clipboard-icon {
  color: var(--color-accent, #b48ead);
  flex-shrink: 0;
}

.clipboard-label {
  color: var(--color-accent, #b48ead);
  font-weight: 600;
  font-size: var(--text-xs);
  flex-shrink: 0;
  white-space: nowrap;
}

.clipboard-text {
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

/* ==================== Loading 指示器 ==================== */
.suggestion-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: var(--space-4) 0;
}

.loading-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--text-tertiary);
  animation: dot-pulse 1.2s ease-in-out infinite;
}

.loading-dot:nth-child(2) { animation-delay: 0.15s; }
.loading-dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes dot-pulse {
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
</style>
