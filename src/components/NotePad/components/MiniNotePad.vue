<script setup lang="ts">
/**
 * MiniNotePad.vue
 * 迷你便签模式
 */
import { defineAsyncComponent, computed } from 'vue'
import { IconX, IconArrowsMaximize, IconMarkdown, IconFileText } from '@tabler/icons-vue'
// [自动导入] useSettings, useDraggableCard

const TipTapEditor = defineAsyncComponent(() => import('./TipTapEditor.vue'))

const props = defineProps<{
  visible: boolean
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'expand'): void
  (e: 'close'): void
}>()

const { settings } = useSettings()

// 拖拽逻辑
const { position, onDragStart } = useDraggableCard({
  storageKey: 'lime_note_position',
  initialPosition: (() => {
    const btnLeft = 32 + settings.todoWidth + 12
    return {
      x: btnLeft + 42 + 12,
      y: window.innerHeight - 39 - settings.notePadHeight,
    }
  })(),
})

const toggleEditorMode = () => {
  settings.notePadEditorMode = settings.notePadEditorMode === 'rich' ? 'plain' : 'rich'
}

// 双向绑定内容
const content = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})
</script>

<template>
  <Transition name="slide-fade">
    <div
      v-if="visible"
      class="mini-notepad"
      :style="{
        left: position.x + 'px',
        top: position.y + 'px',
        width: settings.notePadWidth + 'px',
        height: settings.notePadHeight + 'px',
      }"
    >
      <div class="mini-header" @mousedown="onDragStart" @dblclick="$emit('expand')">
        <span class="mini-title">便签</span>
        <div class="mini-actions">
          <button
            class="mini-btn"
            :title="settings.notePadEditorMode === 'rich' ? '切换到轻量模式' : '切换到富文本模式'"
            @click="toggleEditorMode"
          >
            <IconMarkdown v-if="settings.notePadEditorMode === 'rich'" size="14" />
            <IconFileText v-else size="14" />
          </button>
          <button class="mini-btn" title="展开" @click="$emit('expand')">
            <IconArrowsMaximize size="14" />
          </button>
          <button class="mini-btn close" title="收起" @click="$emit('close')">
            <IconX size="14" />
          </button>
        </div>
      </div>
      <div class="mini-editor-wrapper">
        <Suspense>
          <template #default>
            <TipTapEditor v-model="content" :show-toolbar="false" />
          </template>
          <template #fallback>
            <div class="editor-loading">加载编辑器...</div>
          </template>
        </Suspense>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.mini-notepad {
  position: fixed;
  z-index: var(--z-panel);
  background: var(--bg-panel);
  border: var(--border-glass);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  backdrop-filter: var(--glass-md);
}

.mini-header {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: var(--color-divider);
  cursor: grab;
  user-select: none;
}

.mini-header:active {
  cursor: grabbing;
}

.mini-title {
  flex: 1;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.mini-actions {
  display: flex;
  gap: 4px;
}

.mini-btn {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
  display: flex;
  transition: all 0.2s;
}

.mini-btn:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.mini-btn.close:hover {
  color: var(--color-danger);
}

.mini-editor-wrapper {
  width: 100%;
  height: calc(100% - 38px);
  background: transparent;
  overflow: hidden;
}

.editor-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
  font-size: var(--text-xs);
}

/* 滑入动画 */
.slide-fade-enter-active {
  transition: all 0.3s var(--ease-elastic);
}

.slide-fade-leave-active {
  transition: all 0.2s ease-out;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(-20px) scale(0.95);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
