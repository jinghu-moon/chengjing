<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
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
  folderDragStart: [evt: any]
  folderDragEnd: [evt: any]
  folderMove: []
  folderUpdate: [] // 通知父组件内部顺序已变化
  previewUpdate: [children: Shortcut[] | null] // 🔑 新增：拖动过程中的实时预览
}>()

const showDialog = ref(false)
const folderContentRef = ref<HTMLElement | null>(null)
// 本地数据引用（与 props.folder 是同一对象引用）
const folderData = ref<Shortcut | null>(null)

defineExpose({
  folderContentRef,
})

// Watch prop to sync local data and control dialog visibility
watch(
  () => props.folder,
  (newVal) => {
    folderData.value = newVal // 同步引用
    showDialog.value = !!newVal
  },
  { immediate: true }
)

const handleClose = () => {
  emit('close')
  showDialog.value = false
}

// Esc key to close
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showDialog.value) {
    handleClose()
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

const handleFolderDragStart = (evt: any) => {
  emit('folderDragStart', evt)
}

const handleFolderDragEnd = (evt: any) => {
  // 🔑 拖拽结束，清除预览，恢复使用真实数据
  emit('previewUpdate', null)
  emit('folderDragEnd', evt)
}

// 拖拽排序变化时通知父组件（鼠标松开时触发）
const handleFolderUpdate = () => {
  emit('folderUpdate')
}

// @change 事件在拖动过程中位置变化时触发
const handleFolderChange = (evt: any) => {
  // 此时 folderData.children 还没被 VueDraggable 更新
  // 需要根据 oldIndex 和 newIndex 手动计算预览顺序
  if (folderData.value?.children && evt.oldIndex !== undefined && evt.newIndex !== undefined) {
    const previewList = [...folderData.value.children]
    const [movedItem] = previewList.splice(evt.oldIndex, 1)
    previewList.splice(evt.newIndex, 0, movedItem)
    emit('previewUpdate', previewList)
  }
}

// 拖动过程中控制排序行为
const handleFolderMove = () => {
  emit('folderMove')
  if (props.isDraggingOut) return false
  return true
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="folder-fade">
      <div
        v-if="showDialog"
        class="folder-overlay"
        :class="{ 'dragging-out': isDraggingOut }"
        @click.self="handleClose"
        @wheel.stop
      >
        <div
          class="folder-container"
          ref="folderContentRef"
          :class="{ 'dragging-out': isDraggingOut }"
        >
          <div class="folder-header-wrapper" v-if="folderData">
            <input
              v-model="folderData.name"
              class="folder-title-input"
              placeholder="文件夹名称"
              @keydown.stop
            />
          </div>

          <div v-if="folderData" class="folder-content-wrapper">
            <!-- 🔑 VueDraggable 会直接修改 folderData.children 数组顺序 -->
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
              :move="handleFolderMove"
              @start="handleFolderDragStart"
              @end="handleFolderDragEnd"
              @update="handleFolderUpdate"
              @change="handleFolderChange"
            >
              <div
                v-for="subItem in folderData.children"
                :key="subItem.id"
                class="shortcut-item inner-item"
                @click.stop="handleOpenShortcut(subItem.url)"
              >
                <div
                  class="icon-box"
                  :class="{ filled: subItem.filled, inverted: subItem.inverted }"
                >
                  <img
                    :src="getIconSrc(subItem)"
                    class="shortcut-icon"
                    @error="handleImageError"
                  />
                  <div class="shortcut-fallback">
                    {{ subItem.name.charAt(0).toUpperCase() }}
                  </div>
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
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped src="../styles/index.css"></style>

<style scoped>
.folder-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.folder-container {
  width: 520px;
  max-width: 90vw;
  background: var(--bg-panel);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center center;
}

.folder-header-wrapper {
  width: 100%;
}

.folder-title-input {
  width: 100%;
  background: transparent;
  border: none;
  font-size: 18px;
  color: #fff;
  text-align: center;
  outline: none;
  padding: 4px 0;
}

.folder-title-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

/* 核心：拖拽出界时的视觉状态 */
.folder-overlay.dragging-out {
  background-color: transparent;
  backdrop-filter: blur(0);
  pointer-events: none;
}

.folder-container.dragging-out {
  opacity: 0;
  transform: scale(0.9);
  pointer-events: none;
}

/* 进场/离场动画 */
.folder-fade-enter-from,
.folder-fade-leave-to {
  opacity: 0;
}

.folder-fade-enter-from .folder-container,
.folder-fade-leave-to .folder-container {
  transform: scale(0.9);
  opacity: 0;
}
</style>