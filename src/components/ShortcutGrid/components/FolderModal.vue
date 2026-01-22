<script setup lang="ts">
import { IconX } from '@tabler/icons-vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { Shortcut } from '../../../types'

interface Props {
  folder: Shortcut | null
  isDraggingOut: boolean
  draggableGroup: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  openShortcut: [url?: string]
  folderDragStart: []
  folderDragEnd: []
}>()

const getIconSrc = (item: Shortcut) => {
  if (item.iconBase64) return item.iconBase64
  if (!item.url) return ''
  try {
    return `https://icons.bitwarden.net/${new URL(item.url).hostname}/icon.png`
  } catch {
    return ''
  }
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.opacity = '0'
  const fb = img.nextElementSibling as HTMLElement
  if (fb) fb.style.opacity = '1'
}

const handleClose = () => {
  emit('close')
}

const handleOpenShortcut = (url?: string) => {
  emit('openShortcut', url)
}

const handleFolderDragStart = () => {
  emit('folderDragStart')
}

const handleFolderDragEnd = () => {
  emit('folderDragEnd')
}
</script>

<template>
  <transition name="folder-expand">
    <div
      v-if="folder"
      class="folder-overlay"
      :class="{ 'dragging-out': isDraggingOut }"
      @click.self="handleClose"
    >
      <div class="folder-content-glass">
        <div class="folder-header">
          <input v-model="folder.name" class="folder-title-input" placeholder="文件夹名称" />
          <div class="close-icon" @click="handleClose">
            <IconX :size="20" />
          </div>
        </div>
        <VueDraggable
          v-if="folder.children"
          v-model="folder.children"
          :group="draggableGroup"
          :animation="300"
          :force-fallback="true"
          :fallback-on-body="true"
          ghost-class="shortcut-ghost"
          class="folder-inner-grid"
          item-key="id"
          @start="handleFolderDragStart"
          @end="handleFolderDragEnd"
        >
          <div
            v-for="subItem in folder.children"
            :key="subItem.id"
            class="shortcut-item inner-item"
            @click.stop="handleOpenShortcut(subItem.url)"
          >
            <div class="icon-box" :class="{ filled: subItem.filled, inverted: subItem.inverted }">
              <img :src="getIconSrc(subItem)" class="shortcut-icon" @error="handleImageError" />
              <div class="shortcut-fallback">{{ subItem.name.charAt(0).toUpperCase() }}</div>
            </div>
            <span class="shortcut-name">{{ subItem.name }}</span>
          </div>
        </VueDraggable>
        <div
          v-if="!folder.children || folder.children.length === 0"
          class="empty-tip"
        >
          拖拽外部图标进来，或从这里拖拽出去
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped src="../styles/index.css"></style>
