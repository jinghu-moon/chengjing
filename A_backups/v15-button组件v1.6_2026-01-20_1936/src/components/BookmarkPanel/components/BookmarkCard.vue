<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconExternalLink } from '@tabler/icons-vue'
import type { BookmarkStore } from '../types'
import { getGoogleFaviconUrl, getLetterAvatar } from '../composables/useFavicon'

const props = defineProps<{
  store: BookmarkStore
  index: number
  compact?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', index: number): void
  (e: 'open', index: number): void
  (e: 'context-menu', index: number, event: MouseEvent): void
}>()

// Direct SoA Access
const title = computed(() => props.store.titles[props.index] || '')
const url = computed(() => props.store.urls[props.index] || '')

const faviconUrl = computed(() => getGoogleFaviconUrl(url.value, 64))
const avatar = computed(() => getLetterAvatar(title.value))
const faviconError = ref(false)

const handleClick = () => {
  emit('click', props.index)
}

const handleOpen = (e: Event) => {
  e.stopPropagation()
  window.open(url.value, '_blank')
  emit('open', props.index)
}

const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  // 传递 index，由父组件决定是否需要构建完整对象
  emit('context-menu', props.index, e)
}

const handleFaviconError = () => {
  faviconError.value = true
}

// Extract domain for display
const domain = computed(() => {
  try {
    return new URL(url.value).hostname.replace('www.', '')
  } catch {
    return url.value
  }
})
</script>

<template>
  <div
    class="bookmark-card"
    :class="{ compact }"
    @click="handleClick"
    @contextmenu="handleContextMenu"
  >
    <!-- Favicon / Avatar -->
    <div class="card-icon">
      <img
        v-if="!faviconError"
        :src="faviconUrl"
        :alt="title"
        class="favicon"
        @error="handleFaviconError"
      />
      <div v-else class="avatar" :style="{ background: avatar.color }">
        {{ avatar.letter }}
      </div>
    </div>

    <!-- Content -->
    <div class="card-content">
      <div class="card-title">{{ title }}</div>
      <div class="card-domain">{{ domain }}</div>
    </div>

    <!-- Actions -->
    <div class="card-actions">
      <button class="action-btn open-btn" title="在新标签页打开" @click="handleOpen">
        <IconExternalLink :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.bookmark-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-panel-card);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  width: 100%;
  min-width: 0;
  /* Allow flex children to shrink below content size */
  box-sizing: border-box;
}

.bookmark-card:hover {
  background: var(--bg-hover-card);
  border-color: var(--color-primary-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bookmark-card.compact {
  padding: 8px 10px;
  gap: 10px;
  height: 56px;
  /* Fixed height for grid alignment */
  box-sizing: border-box;
}

.card-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
}

.compact .card-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
}

.favicon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4px;
}

.avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  font-weight: 600;
}

.compact .avatar {
  font-size: 12px;
}

.card-content {
  flex: 1;
  min-width: 0;
  /* Critical: allows text-overflow to work in flex child */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.card-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact .card-title {
  font-size: 12px;
}

.card-domain {
  font-size: 11px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.bookmark-card:hover .card-actions {
  opacity: 1;
}

.action-btn {
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
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--bg-active);
  color: var(--color-primary);
}
</style>
