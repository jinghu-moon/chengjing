<script setup lang="ts">
import { ref } from 'vue'
import { IconFolder, IconChevronRight, IconExternalLink } from '@tabler/icons-vue'
import type { SearchResult } from '../types'
import { getGoogleFaviconUrl, getLetterAvatar } from '../composables/useFavicon'

const props = defineProps<{
  results: SearchResult[]
  query: string
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', result: SearchResult): void
}>()

// Keyboard navigation
const selectedIndex = ref(-1)

const handleKeydown = (e: KeyboardEvent) => {
  if (props.results.length === 0) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, props.results.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter' && selectedIndex.value >= 0) {
    e.preventDefault()
    emit('select', props.results[selectedIndex.value])
  }
}

// Highlight matching text
const highlightMatch = (text: string, query: string): string => {
  if (!query.trim()) return text
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Favicon handling
const getFavicon = (url: string) => getGoogleFaviconUrl(url, 32)
const getAvatar = (title: string) => getLetterAvatar(title)

const handleSelect = (result: SearchResult) => {
  emit('select', result)
}

const openBookmark = (url: string) => {
  window.open(url, '_blank')
}

// Reset selection when results change
const resetSelection = () => {
  selectedIndex.value = -1
}

defineExpose({
  handleKeydown,
  resetSelection,
})
</script>

<template>
  <div class="search-results">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>搜索中...</span>
    </div>

    <!-- Empty state -->
    <div v-else-if="query && results.length === 0" class="empty-state">
      <span>未找到 "{{ query }}" 相关书签</span>
    </div>

    <!-- Results list -->
    <div v-else class="results-list">
      <div
        v-for="(result, index) in results"
        :key="result.bookmark.id"
        class="result-item"
        :class="{ selected: index === selectedIndex }"
        @click="handleSelect(result)"
        @mouseenter="selectedIndex = index"
      >
        <!-- Favicon -->
        <div class="result-icon">
          <img
            :src="getFavicon(result.bookmark.url)"
            :alt="result.bookmark.title"
            class="favicon"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
          <div
            class="avatar-fallback"
            :style="{ background: getAvatar(result.bookmark.title).color }"
          >
            {{ getAvatar(result.bookmark.title).letter }}
          </div>
        </div>

        <!-- Content -->
        <div class="result-content">
          <!-- Breadcrumb path -->
          <div v-if="result.path.length > 0" class="result-path">
            <template v-for="(folder, i) in result.path" :key="i">
              <IconFolder :size="12" class="folder-icon" />
              <span class="path-segment">{{ folder }}</span>
              <IconChevronRight v-if="i < result.path.length - 1" :size="12" class="path-sep" />
            </template>
          </div>

          <!-- Title with highlight -->
          <div class="result-title" v-html="highlightMatch(result.bookmark.title, query)"></div>

          <!-- URL preview -->
          <div class="result-url">{{ result.bookmark.url }}</div>
        </div>

        <!-- Actions -->
        <button
          class="open-btn"
          title="在新标签页打开"
          @click.stop="openBookmark(result.bookmark.url)"
        >
          <IconExternalLink :size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-results {
  display: flex;
  flex-direction: column;
  flex: 1;
  /* Fill available space */
  min-height: 0;
  /* Enable scrolling in nested flex */
  overflow-y: auto;
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-glass);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.results-list {
  display: flex;
  flex-direction: column;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;
  border-radius: var(--radius-sm);
}

.result-item:hover,
.result-item.selected {
  background: var(--bg-hover);
}

.result-item.selected {
  background: var(--bg-active);
}

.result-icon {
  position: relative;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.favicon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 6px;
  position: relative;
  z-index: 1;
}

.avatar-fallback {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.result-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-path {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.folder-icon {
  opacity: 0.6;
}

.path-segment {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.path-sep {
  opacity: 0.4;
}

.result-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-title :deep(mark) {
  background: rgba(136, 192, 208, 0.3);
  color: inherit;
  padding: 0 2px;
  border-radius: 2px;
}

.result-url {
  font-size: 11px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.open-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s;
}

.result-item:hover .open-btn {
  opacity: 1;
}

.open-btn:hover {
  background: var(--bg-active);
  color: var(--color-primary);
}
</style>
