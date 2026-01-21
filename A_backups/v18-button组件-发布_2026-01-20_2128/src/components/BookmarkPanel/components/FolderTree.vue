<script setup lang="ts">
import { ref } from 'vue'
import { IconBookmarks } from '@tabler/icons-vue'
import type { FolderNode } from '@/components/BookmarkPanel/types'
import FolderTreeItem from './FolderTreeItem.vue'

defineProps<{
  roots: FolderNode[]
  currentFolderId: string | null
}>()

const emit = defineEmits<{
  (e: 'select', id: string | null): void
  (e: 'folder-move', dragId: string, dropId: string, position: 'before' | 'after' | 'inside'): void
}>()

const draggedFolderId = ref<string | null>(null)

const handleSelect = (id: string | null) => {
  emit('select', id)
}

const handleDragStart = (folderId: string) => {
  draggedFolderId.value = folderId
}

const handleDragEnd = () => {
  draggedFolderId.value = null
}

const handleFolderMove = (
  dragId: string,
  dropId: string,
  position: 'before' | 'after' | 'inside'
) => {
  emit('folder-move', dragId, dropId, position)
  draggedFolderId.value = null
}
</script>

<template>
  <div class="folder-tree">
    <!-- Static Root: All Bookmarks -->
    <div
      class="tree-root-item"
      :class="{ 'is-selected': currentFolderId === null }"
      data-is-folder-node="true"
      data-folder-id="root"
      @click="handleSelect(null)"
    >
      <div class="icon-wrapper">
        <IconBookmarks :size="18" />
      </div>
      <span class="title">全部书签</span>
    </div>

    <!-- Recursive Tree -->
    <div class="tree-container">
      <FolderTreeItem
        v-for="node in roots"
        :key="node.id"
        :node="node"
        :level="0"
        :current-folder-id="currentFolderId"
        :dragged-folder-id="draggedFolderId"
        @select="id => handleSelect(id)"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
        @folder-move="handleFolderMove"
      />
    </div>
  </div>
</template>

<style scoped>
.folder-tree {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 8px;
  box-sizing: border-box;
}

.tree-root-item {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 12px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  transition: all 0.15s;
}

.tree-root-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tree-root-item.is-selected {
  background: var(--bg-active);
  color: var(--color-primary);
}

/* Styled for drag feedback */
.tree-root-item.drag-over-folder {
  background: var(--color-primary-alpha);
  outline: 2px dashed var(--color-primary);
  outline-offset: -2px;
}

.icon-wrapper {
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.tree-container {
  display: flex;
  flex-direction: column;
}
</style>
