<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, provide } from 'vue'
import {
  IconFolderPlus,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { useSettings } from '../../composables/useSettings'
import { useShortcutDrag } from './composables/useShortcutDrag'
import { useShortcutData } from './composables/useShortcutData'
import { useShortcutLayout } from './composables/useShortcutLayout'
import { useFolderIconSize } from './composables/useFolderIconSize'
import { useGridActions } from './composables/useGridActions'
import GridPage from './components/GridPage.vue'
import FolderModal from './components/FolderModal.vue'
import ContextMenu from '../SelectMenu/components/ContextMenu.vue'
import type { Shortcut } from '../../types'
import { GridStateKey } from './keys'

const { settings, iconConfig } = useSettings()
const { shortcuts, loadData, saveData, resetToDemo, createFolder } = useShortcutData()
const { pagedShortcuts, reflowShortcuts, syncFromPages } = useShortcutLayout(
  shortcuts,
  settings,
  saveData
)
const { folderSizeVars } = useFolderIconSize(settings, iconConfig)

// 🌟 使用新的 Action Composable
const { openAddModal, showContextMenu, contextMenuRef } = useGridActions(shortcuts, saveData, reflowShortcuts)
// 显式引用 contextMenuRef 防止 eslint/ts 报错
void contextMenuRef

const currentPage = ref(0)
const pagesContainerRef = ref<HTMLElement | null>(null)

// ==========================================
// 🌟 核心改动：初始化虚拟滚动
// ==========================================
const virtualizer = useVirtualizer<HTMLElement, Element>(
  computed(() => ({
    count: pagedShortcuts.value.length,
    getScrollElement: () => pagesContainerRef.value,
    // 修改点 1: 给定准确的估算宽度（容器宽度），防止测量循环
    estimateSize: () => pagesContainerRef.value?.clientWidth || window.innerWidth,
    horizontal: true,
    overscan: 1,
    onChange: (instance) => {
      // @ts-ignore
      if (!instance.isScrolling) {
        const width = pagesContainerRef.value?.clientWidth || 1
        const offset = instance.scrollOffset ?? 0
        const index = Math.round(offset / width)
        if (currentPage.value !== index) {
          currentPage.value = index
        }
      }
    },
  }))
)

const virtualItems = computed(() => virtualizer.value.getVirtualItems())
const totalSize = computed(() => virtualizer.value.getTotalSize())

const handleScroll = (_e: Event) => {
  // 虚拟器接管了大部分逻辑
}

const scrollToPage = (index: number) => {
  virtualizer.value.scrollToIndex(index, { align: 'start', behavior: 'smooth' })
  currentPage.value = index
}

const prevPage = () => {
  const totalPages = pagedShortcuts.value.length
  if (totalPages <= 1) return
  const target = currentPage.value > 0 ? currentPage.value - 1 : totalPages - 1
  scrollToPage(target)
}

const nextPage = () => {
  const totalPages = pagedShortcuts.value.length
  if (totalPages <= 1) return
  const target = currentPage.value < totalPages - 1 ? currentPage.value + 1 : 0
  scrollToPage(target)
}

const openedFolderId = ref<string | number | null>(null)
const currentOpenedFolder = computed(() =>
  shortcuts.value.find(i => String(i.id) === String(openedFolderId.value))
)
const folderModalRef = ref<InstanceType<typeof FolderModal> | null>(null)

// 🔑 新增：拖动过程中的实时预览数据
const previewFolderId = ref<string | number | null>(null)
const previewChildren = ref<Shortcut[] | null>(null)

const {
  dragTargetFolderId,
  mergeTargetId,
  isDraggingOut,
  draggableGroup,
  onStart,
  onMoveCallback,
  onDragEnd,
  onFolderDragStart,
  onFolderDragEnd,
  onFolderMove, // [新增]
  folderContainerRef,
} = useShortcutDrag(
  shortcuts,
  settings,
  () => {
    saveData()
    reflowShortcuts()
  },
  {
    closeFolder: () => {
      openedFolderId.value = null
    },
    openedFolderId,
  }
)

// 当文件夹打开时，设置 folderContainerRef
watch(
  () => folderModalRef.value?.folderContentRef,
  (containerElement) => {
    if (containerElement) {
      folderContainerRef.value = containerElement as HTMLElement
    }
  },
  { immediate: true }
)

const handlePageDragEnd = () => {
  syncFromPages()
  nextTick(() => onDragEnd())
}

// 🔑 文件夹内部拖拽排序变化时，强制刷新 shortcuts 数组以触发桌面预览更新
const handleFolderUpdate = () => {
  // 清除预览数据
  previewChildren.value = null
  previewFolderId.value = null
  
  const folderIndex = shortcuts.value.findIndex(s => String(s.id) === String(openedFolderId.value))
  if (folderIndex > -1) {
    const folder = shortcuts.value[folderIndex]
    // 创建 folder 对象的浅拷贝，强制让 Vue 认为这是一个新对象
    shortcuts.value[folderIndex] = { ...folder }
    // 强制替换数组引用
    shortcuts.value = [...shortcuts.value]
  }
}

// 拖动过程中的实时预览更新
const handlePreviewUpdate = (children: Shortcut[] | null) => {
  if (children) {
    previewFolderId.value = openedFolderId.value
    previewChildren.value = children
  } else {
    previewFolderId.value = null
    previewChildren.value = null
  }
}

const openFolder = (item: Shortcut) => {
  // 只在打开不同的文件夹时才重置 isDraggingOut
  if (openedFolderId.value !== item.id) {
    openedFolderId.value = item.id
    isDraggingOut.value = false
  }
}

const gridStyle = computed(() => ({
  '--item-size': `${iconConfig.boxSize}px`,
  '--item-radius': `${iconConfig.radius}%`,
  '--icon-scale': `${iconConfig.iconScale}%`,
  '--bg-opacity': iconConfig.opacity / 100,
  '--shadow-display': iconConfig.showShadow ? 'block' : 'none',
  '--label-display': iconConfig.hideLabel ? 'none' : 'block',
  '--grid-cols': settings.gridCols,
  '--grid-rows': settings.gridRows,
  '--grid-gap-x': `${settings.gridGapX}px`,
  '--grid-gap-y': `${settings.gridGapY}px`,
  ...folderSizeVars.value,
}))

const containerWidthStyle = computed(() => {
  // 虚拟滚动不需要手动计算总宽度，由 totalSize 决定
  // 但为了保留原有的 --dynamic-container-width 变量给 CSS 使用 (如居中)，我们仍保留它用于单页宽度参考
  const cols = settings.gridCols
  const boxSize = iconConfig.boxSize
  const gapX = settings.gridGapX
  const contentPadding = 40
  const totalWidth = cols * boxSize + (cols - 1) * gapX + contentPadding
  return { '--dynamic-container-width': `${totalWidth}px` }
})

const containerHeightStyle = computed(() => {
  const rows = settings.gridRows
  const boxSize = iconConfig.boxSize
  const gapY = settings.gridGapY
  // 加上一些缓冲空间防止边缘被裁剪
  const paddingY = 20 
  const totalHeight = rows * boxSize + (rows - 1) * gapY + paddingY
  return { height: `${totalHeight}px` }
})

const containerClasses = computed(() => ({
  'shortcuts-wrapper': true,
  'compress-mode': settings.compressLargeFolders,
  'overflow-mode': !settings.compressLargeFolders,
}))

const openShortcut = (url?: string) => {
  if (!url) return
  if (settings.openNewTab) window.open(url, '_blank')
  else window.location.href = url
}

// 🌟 Provide 注入状态
provide(GridStateKey, {
  settings,
  iconConfig,
  dragTargetFolderId,
  mergeTargetId,
  previewFolderId,
  previewChildren,
  openShortcut,
  openFolder,
  showContextMenu
})

const handleResetToDemo = () => {
  if (resetToDemo()) {
    reflowShortcuts()
  }
}

const handleCreateFolder = () => {
  createFolder()
  reflowShortcuts()
}

// 监听尺寸变化重建虚拟器
watch(
  [
    () => settings.gridRows,
    () => settings.gridCols,
    () => settings.folderPreviewMode,
    () => settings.compressLargeFolders,
  ],
  () => {
    currentPage.value = 0
    if (pagesContainerRef.value) pagesContainerRef.value.scrollTo({ left: 0 })
    nextTick(() => {
      virtualizer.value?.measure()
    })
  },
  {
    flush: 'post'
  }
)

// 监听分页数量变化
watch(
  () => pagedShortcuts.value, 
  () => {
    nextTick(() => {
      virtualizer.value.measure()
    })
  },
  { deep: true, flush: 'post' }
)

onMounted(() => {
  loadData()
  reflowShortcuts()
})
</script>

<template>
  <div :class="containerClasses" :style="[gridStyle, containerWidthStyle]">
    <transition name="fade">
      <div v-if="pagedShortcuts.length > 1" class="nav-btn prev" @click="prevPage">
        <IconChevronLeft :size="32" />
      </div>
    </transition>

    <div
      v-if="settings.showShortcuts"
      ref="pagesContainerRef"
      class="pages-container"
      :style="containerHeightStyle"
      @scroll="handleScroll"
    >
      <div
        :style="{
          width: `${totalSize}px`,
          height: '100%',
          position: 'relative',
        }"
      >
        <GridPage
          v-for="virtualItem in virtualItems"
          :key="String(virtualItem.key)"
          :data-index="virtualItem.index"

          v-model="pagedShortcuts[virtualItem.index]"
          :page-index="virtualItem.index"
          :is-last-page="virtualItem.index === pagedShortcuts.length - 1"
          
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%', 
            height: '100%',
            transform: `translateX(${virtualItem.start}px)`, 
          }"

          :draggable-group="draggableGroup"
          :on-move-callback="onMoveCallback"
          :on-start="onStart"
          :on-end="handlePageDragEnd"
          :on-add-click="openAddModal"
        />
      </div>
    </div>

    <transition name="fade">
      <div v-if="pagedShortcuts.length > 1" class="nav-btn next" @click="nextPage">
        <IconChevronRight :size="32" />
      </div>
    </transition>

    <div v-if="pagedShortcuts.length > 1" class="pagination-dots">
      <span
        v-for="(_p, i) in pagedShortcuts"
        :key="i"
        class="dot"
        :class="{ active: i === currentPage }"
        @click="scrollToPage(i)"
      ></span>
    </div>

    <FolderModal
      ref="folderModalRef"
      :folder="currentOpenedFolder || null"
      :is-dragging-out="isDraggingOut"
      :draggable-group="draggableGroup"
      @close="openedFolderId = null"
      @open-shortcut="openShortcut"
      @folder-drag-start="onFolderDragStart"
      @folder-drag-end="onFolderDragEnd"
      @folder-move="onFolderMove"
      @folder-update="handleFolderUpdate"
      @preview-update="handlePreviewUpdate"
      @contextmenu="showContextMenu"
    />

    <ContextMenu ref="contextMenuRef" />

    <div class="debug-actions">
      <div class="debug-btn" title="新建文件夹" @click="handleCreateFolder">
        <IconFolderPlus :size="20" />
      </div>
      <div class="debug-btn" title="重置布局" @click="handleResetToDemo">
        <IconRefresh :size="20" />
      </div>
    </div>
  </div>
</template>

<style scoped src="./styles/index.css"></style>

<style scoped>
.nav-btn {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  transform: translateY(-50%) scale(1.1);
  border-color: rgba(255, 255, 255, 0.4);
}

.nav-btn:active {
  transform: translateY(-50%) scale(0.95);
}

.nav-btn.prev {
  left: 24px;
}

.nav-btn.next {
  right: 24px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .nav-btn {
    display: none;
  }
}

:deep(.pages-container) {
  max-width: min(var(--dynamic-container-width), calc(100vw - 160px));
  margin: 0 auto;
  position: relative;
  z-index: 10;
}
</style>