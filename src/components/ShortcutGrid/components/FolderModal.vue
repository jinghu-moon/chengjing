<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import Dialog from '@/components/Dialog/Dialog.vue'
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

const showDialog = ref(false)
const folderData = ref<Shortcut | null>(props.folder)

// Watch prop to sync state and data cache
watch(
  () => props.folder,
  (newVal) => {
    if (newVal) {
      folderData.value = newVal
      showDialog.value = true
    } else {
      showDialog.value = false
    }
  },
  { immediate: true }
)

const handleDialogUpdate = (val: boolean) => {
  if (!val) {
    emit('close')
    showDialog.value = false
  }
}

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
  <Dialog
    :model-value="showDialog"
    width="520px"
    :show-confirm-btn="false"
    :show-cancel-btn="false"
    :mask-closable="true"
    :show-icon="false"
    :root-class="isDraggingOut ? 'dragging-out' : ''"
    @update:model-value="handleDialogUpdate"
    dialog-class="folder-modal-dialog"
  >
    <template #header>
      <div class="folder-header-wrapper" v-if="folderData">
        <input v-model="folderData.name" class="folder-title-input" placeholder="文件夹名称" />
      </div>
    </template>

    <div v-if="folderData" class="folder-content-wrapper">
      <VueDraggable
        v-if="folderData.children"
        v-model="folderData.children"
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
          v-for="subItem in folderData.children"
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
        v-if="!folderData.children || folderData.children.length === 0"
        class="empty-tip"
      >
        拖拽外部图标进来，或从这里拖拽出去
      </div>
    </div>
  </Dialog>
</template>

<style scoped src="../styles/index.css"></style>

<style scoped>
.folder-header-wrapper {
  width: 100%;
}

/* Ensure dragging-out hides the dialog but keeps transition if needed */
:deep(.dialog-root.dragging-out) {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
}

/* Override Dialog default styling */
:deep(.folder-modal-dialog) {
  background: var(--bg-panel);
  backdrop-filter: blur(20px); /* Explicit blur as requested */
}
</style>
