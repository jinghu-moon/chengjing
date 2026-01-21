<script setup lang="ts">
import { ref, computed } from 'vue'
import { IconFolder, IconFolderOpen, IconChevronRight } from '@tabler/icons-vue'
import type { FolderNode } from '@/components/BookmarkPanel/types'

const props = defineProps<{
  node: FolderNode
  level: number
  currentFolderId: string | null
  isLast?: boolean
  draggedFolderId?: string | null // 当前正在拖拽的文件夹ID
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'folder-move', dragId: string, dropId: string, position: 'before' | 'after' | 'inside'): void
  (e: 'drag-start', folderId: string): void
  (e: 'drag-end'): void
}>()

const isOpen = ref(false)
const dropPosition = ref<'before' | 'after' | 'inside' | null>(null)

const isSelected = computed(() => props.currentFolderId === props.node.id)
const hasChildren = computed(() => props.node.children.length > 0)

// 检查是否是自己或自己的后代（递归）
const isDescendantOf = (ancestorId: string, node: FolderNode): boolean => {
  if (node.id === ancestorId) return true
  for (const child of node.children) {
    if (isDescendantOf(ancestorId, child)) return true
  }
  return false
}

// 是否可以放置（不能放到自己或自己的后代中）
const canDrop = computed(() => {
  // 如果还没有draggedFolderId，允许dragOver（稍后在drop时验证）
  if (!props.draggedFolderId) return true
  if (props.draggedFolderId === props.node.id) return false
  // 检查当前节点是否是拖拽节点的后代
  return !isDescendantOf(props.draggedFolderId, props.node)
})

const toggle = (e: MouseEvent) => {
  e.stopPropagation()
  if (hasChildren.value) {
    isOpen.value = !isOpen.value
  }
}

const handleSelect = () => {
  emit('select', props.node.id)
}

// --- Folder Drag & Drop ---
const onDragStart = (e: DragEvent) => {
  e.stopPropagation()
  console.log('[Folder Drag] Start:', props.node.title, props.node.id)
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', props.node.id)
  }
  emit('drag-start', props.node.id)
}

const onDragOver = (e: DragEvent) => {
  if (!canDrop.value) return
  e.preventDefault()
  e.stopPropagation()

  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const y = e.clientY - rect.top
  const height = rect.height

  // 逻辑：展开状态只有 before/after；折叠状态有 before/inside/after
  if (isOpen.value && hasChildren.value) {
    // 展开状态：50/50
    dropPosition.value = y < height * 0.5 ? 'before' : 'after'
  } else {
    // 折叠状态或无子节点：25/50/25
    if (y < height * 0.25) {
      dropPosition.value = 'before'
    } else if (y > height * 0.75) {
      dropPosition.value = 'after'
    } else {
      dropPosition.value = 'inside'
    }
  }
}

const onDragLeave = (e: DragEvent) => {
  e.stopPropagation()
  dropPosition.value = null
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  e.stopPropagation()

  const dragId = e.dataTransfer?.getData('text/plain')
  console.log(
    '[Folder Drag] Drop:',
    dragId,
    'onto',
    props.node.title,
    'position:',
    dropPosition.value
  )

  // 验证：不能拖到自己或后代
  if (!dragId || !dropPosition.value) {
    dropPosition.value = null
    return
  }
  if (dragId === props.node.id) {
    console.log('[Folder Drag] Cannot drop onto self')
    dropPosition.value = null
    return
  }

  emit('folder-move', dragId, props.node.id, dropPosition.value)
  dropPosition.value = null
}

const onDragEnd = () => {
  dropPosition.value = null
  emit('drag-end')
}

// --- Transition Hooks for Height Animation ---
const onBeforeEnter = (el: Element) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.height = '0'
  htmlEl.style.opacity = '0'
}

const onEnter = (el: Element, done: () => void) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.transition = 'height 0.2s ease-out, opacity 0.2s ease-out'
  htmlEl.style.height = htmlEl.scrollHeight + 'px'
  htmlEl.style.opacity = '1'

  htmlEl.addEventListener(
    'transitionend',
    () => {
      htmlEl.style.height = 'auto'
      done()
    },
    { once: true }
  )
}

const onBeforeLeave = (el: Element) => {
  const htmlEl = el as HTMLElement
  htmlEl.style.height = htmlEl.scrollHeight + 'px'
}

const onLeave = (el: Element, done: () => void) => {
  const htmlEl = el as HTMLElement
  void htmlEl.offsetHeight
  htmlEl.style.transition = 'height 0.2s ease-out, opacity 0.2s ease-out'
  htmlEl.style.height = '0'
  htmlEl.style.opacity = '0'

  htmlEl.addEventListener('transitionend', done, { once: true })
}
</script>

<template>
  <div class="folder-tree-node" :class="{ 'is-last': isLast }">
    <div
      class="node-content"
      :class="{
        'is-selected': isSelected,
        'drop-before': dropPosition === 'before',
        'drop-after': dropPosition === 'after',
        'drop-inside': dropPosition === 'inside',
      }"
      :style="{ paddingLeft: `${level * 16 + 8}px` }"
      data-is-folder-node="true"
      :data-folder-id="node.id"
      draggable="true"
      @click="handleSelect"
      @dragstart="onDragStart"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @dragend="onDragEnd"
    >
      <!-- Toggler -->
      <div class="toggler" @click.stop="toggle">
        <IconChevronRight
          v-if="hasChildren"
          :size="14"
          class="chevron"
          :class="{ 'is-open': isOpen }"
        />
        <div v-else class="spacer"></div>
      </div>

      <!-- Icon -->
      <div class="icon-wrapper">
        <IconFolderOpen v-if="isOpen" :size="18" class="icon-folder open" />
        <IconFolder v-else :size="18" class="icon-folder" />
      </div>

      <!-- Title -->
      <span class="node-title">{{ node.title }}</span>

      <!-- Count Badge -->
      <span v-if="node.bookmarkCount > 0" class="count-badge">{{ node.bookmarkCount }}</span>
    </div>

    <!-- Children with animation -->
    <Transition
      :css="false"
      @before-enter="onBeforeEnter"
      @enter="onEnter"
      @before-leave="onBeforeLeave"
      @leave="onLeave"
    >
      <div v-if="isOpen && hasChildren" class="node-children">
        <FolderTreeItem
          v-for="(child, idx) in node.children"
          :key="child.id"
          :node="child"
          :level="level + 1"
          :is-last="idx === node.children.length - 1"
          :current-folder-id="currentFolderId"
          :dragged-folder-id="draggedFolderId"
          @select="id => emit('select', id)"
          @drag-start="id => emit('drag-start', id)"
          @drag-end="() => emit('drag-end')"
          @folder-move="(dragId, dropId, pos) => emit('folder-move', dragId, dropId, pos)"
        />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.folder-tree-node {
  width: 100%;
  position: relative;
}

.node-content {
  display: flex;
  align-items: center;
  height: 32px;
  padding-right: 8px;
  cursor: grab;
  border-radius: 4px;
  color: var(--text-secondary);
  transition: all 0.1s;
  user-select: none;
  -webkit-user-drag: element;
  font-size: 13px;
  margin-bottom: 1px;
  position: relative;
}

.node-content:active {
  cursor: grabbing;
}

.node-content:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.node-content.is-selected {
  background: var(--bg-active);
  color: var(--color-primary);
  font-weight: 500;
}

/* Controlled by global drag script via class addition */
.node-content.drag-over-folder {
  background: var(--color-primary-alpha);
  outline: 2px dashed var(--color-primary);
  outline-offset: -2px;
}

.toggler {
  width: 20px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  z-index: 1;
}

.toggler:hover {
  color: var(--text-primary);
}

.chevron {
  transition: transform 0.2s;
}

.chevron.is-open {
  transform: rotate(90deg);
}

.spacer {
  width: 14px;
}

.icon-wrapper {
  margin-right: 6px;
  display: flex;
  align-items: center;
}

.icon-folder {
  color: var(--text-tertiary);
}

.is-selected .icon-folder {
  color: var(--color-primary);
}

.node-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

/* Count Badge */
.count-badge {
  margin-left: auto;
  padding: 0 6px;
  min-width: 20px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary);
  background: var(--bg-hover);
  border-radius: 9px;
  flex-shrink: 0;
}

.is-selected .count-badge {
  background: var(--color-primary-alpha);
  color: var(--color-primary);
}

.node-content:hover .count-badge {
  background: var(--bg-active);
}

/* node-children needs overflow:hidden for height animation */
.node-children {
  overflow: hidden;
}

/* Folder Drag & Drop */
.node-content[draggable='true'] {
  cursor: grab;
  transition:
    transform 0.15s ease,
    margin 0.15s ease,
    box-shadow 0.15s ease;
}

.node-content[draggable='true']:active {
  cursor: grabbing;
}

/* Drop Target: BEFORE - 上方插入 */
.drop-before {
  position: relative;
  transform: translateY(6px);
  /* 向下移动留出空间 */
  margin-top: 8px;
  /* 与上方元素分开 */
}

.drop-before::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 8px;
  right: 8px;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary) 70%, transparent);
  border-radius: 2px;
  box-shadow: 0 0 10px var(--color-primary-alpha);
  z-index: 10;
  pointer-events: none;
}

/* 箭头指示器 - before */
.drop-before::after {
  content: '▶';
  position: absolute;
  top: -14px;
  left: 0;
  font-size: 10px;
  color: var(--color-primary);
  z-index: 11;
  pointer-events: none;
  animation: arrow-bounce-down 0.6s ease infinite;
}

/* Drop Target: AFTER - 下方插入 */
.drop-after {
  position: relative;
  transform: translateY(-6px);
  /* 向上移动留出空间 */
  margin-bottom: 8px;
  /* 与下方元素分开 */
}

.drop-after::before {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 8px;
  right: 8px;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary) 70%, transparent);
  border-radius: 2px;
  box-shadow: 0 0 10px var(--color-primary-alpha);
  z-index: 10;
  pointer-events: none;
}

/* 箭头指示器 - after */
.drop-after::after {
  content: '▶';
  position: absolute;
  bottom: -14px;
  left: 0;
  font-size: 10px;
  color: var(--color-primary);
  z-index: 11;
  pointer-events: none;
  animation: arrow-bounce-up 0.6s ease infinite;
}

/* Drop Target: INSIDE - 移入文件夹 */
.drop-inside {
  background: var(--color-primary-alpha) !important;
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
  transform: scale(1.02);
  box-shadow: 0 0 12px var(--color-primary-alpha);
}

/* 箭头动画 */
@keyframes arrow-bounce-down {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(3px);
  }
}

@keyframes arrow-bounce-up {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }
}
</style>
