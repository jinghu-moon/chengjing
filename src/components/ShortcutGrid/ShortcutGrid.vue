<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick, provide, defineAsyncComponent } from 'vue'
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
import type { LayoutSnapshot } from './composables/useSnapshot'

const props = defineProps<{
  previewSnapshot?: LayoutSnapshot | null
}>()

// 判断是否为预览模式
const isPreview = computed(() => !!props.previewSnapshot)

// 数据源选择
const { settings: globalSettings, iconConfig: globalIconConfig } = isPreview.value ? { settings: {} as any, iconConfig: {} as any } : useSettings()
const { shortcuts: globalShortcuts, loadData, saveData, resetToDemo, createFolder } = isPreview.value 
  ? { shortcuts: ref([]), loadData: () => {}, saveData: () => {}, resetToDemo: () => false, createFolder: () => {} }
  : useShortcutData()

// 构造最终使用的响应式数据
// 统一封装为 ComputedRef，确保后续使用方式一致 (.value 访问)
const settings = computed(() => isPreview.value 
  ? props.previewSnapshot!.data.settings
  : globalSettings
)

const iconConfig = computed(() => isPreview.value
  ? props.previewSnapshot!.data.settings.iconConfig
  : globalIconConfig
)

const shortcuts = isPreview.value
  ? computed({
    get: () => props.previewSnapshot!.data.shortcuts,
    set: () => {} // 预览模式不可修改
  })
  : globalShortcuts

// 布局计算
// 注意：传入 .value 以获取响应式对象 (Main) 或 普通对象 (Preview)
const { pagedShortcuts, reflowShortcuts, syncFromPages } = useShortcutLayout(
  shortcuts,
  settings.value, 
  isPreview.value ? () => {} : saveData
)

const { folderSizeVars } = useFolderIconSize(settings.value, iconConfig.value)


// 动作 & 拖拽 (预览模式下禁用或 Mock)
const gridActions = isPreview.value
  ? { openAddModal: () => {}, showContextMenu: () => {}, contextMenuRef: ref(null) }
  : useGridActions(shortcuts, saveData, reflowShortcuts)
const { openAddModal, showContextMenu, contextMenuRef } = gridActions

// 显式引用
void contextMenuRef

const currentPage = ref(0)
const pagesContainerRef = ref<HTMLElement | null>(null)

// 虚拟滚动 (通用)
const virtualizer = useVirtualizer<HTMLElement, Element>(
  computed(() => ({
    count: pagedShortcuts.value.length,
    getScrollElement: () => pagesContainerRef.value,
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

const handleScroll = (_e: Event) => {}

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

// 预览模式相关 Mock
const previewFolderId = ref<string | number | null>(null)
const previewChildren = ref<Shortcut[] | null>(null)

// 拖拽逻辑 (预览模式使用空实现)
const dragResult = isPreview.value
  ? {
      dragTargetFolderId: ref(null),
      mergeTargetId: ref(null),
      isDraggingOut: ref(false),
      draggableGroup: 'preview-group',
      onStart: () => {},
      onMoveCallback: () => false,
      onDragEnd: () => {},
      onFolderDragStart: () => {},
      onFolderDragEnd: () => {},
      onFolderMove: () => {},
      folderContainerRef: ref(null)
    }
  : useShortcutDrag(
      shortcuts,
      settings.value,
      () => {
        saveData()
        reflowShortcuts()
      },
      {
        closeFolder: () => { openedFolderId.value = null },
        openedFolderId,
      }
    )

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
  onFolderMove,
  folderContainerRef,
} = dragResult

// Watcher needed only for real mode
if (!isPreview.value) {
  watch(
    () => folderModalRef.value?.folderContentRef,
    (containerElement) => {
      if (containerElement && folderContainerRef) {
        folderContainerRef.value = containerElement as HTMLElement
      }
    },
    { immediate: true }
  )
}

const handlePageDragEnd = () => {
  if (isPreview.value) return
  syncFromPages()
  nextTick(() => onDragEnd())
}

const handleFolderUpdate = () => {
  if (isPreview.value) return
  previewChildren.value = null
  previewFolderId.value = null
  
  const folderIndex = shortcuts.value.findIndex(s => String(s.id) === String(openedFolderId.value))
  if (folderIndex > -1) {
    const folder = shortcuts.value[folderIndex]
    // @ts-ignore: read-only error in preview mode handled by isPreview check
    shortcuts.value[folderIndex] = { ...folder }
    // @ts-ignore
    shortcuts.value = [...shortcuts.value]
  }
}

const handlePreviewUpdate = (children: Shortcut[] | null) => {
  if (isPreview.value) return
  if (children) {
    previewFolderId.value = openedFolderId.value
    previewChildren.value = children
  } else {
    previewFolderId.value = null
    previewChildren.value = null
  }
}

const openFolder = (item: Shortcut) => {
  if (isPreview.value) return
  if (openedFolderId.value !== item.id) {
    openedFolderId.value = item.id
    isDraggingOut.value = false
  }
}

const gridStyle = computed(() => ({
  '--item-size': `${iconConfig.value.boxSize}px`,
  '--item-radius': `${iconConfig.value.radius}%`,
  '--icon-scale': `${iconConfig.value.iconScale}%`,
  '--bg-opacity': iconConfig.value.opacity / 100,
  '--shadow-display': iconConfig.value.showShadow ? 'block' : 'none',
  '--label-display': iconConfig.value.hideLabel ? 'none' : 'block',
  '--grid-cols': settings.value.gridCols,
  '--grid-rows': settings.value.gridRows,
  '--grid-gap-x': `${settings.value.gridGapX}px`,
  '--grid-gap-y': `${settings.value.gridGapY}px`,
  ...folderSizeVars.value,
}))

const containerWidthStyle = computed(() => {
  const cols = settings.value.gridCols
  const boxSize = iconConfig.value.boxSize
  const gapX = settings.value.gridGapX
  const contentPadding = 40
  const totalWidth = cols * boxSize + (cols - 1) * gapX + contentPadding
  return { '--dynamic-container-width': `${totalWidth}px` }
})

const containerHeightStyle = computed(() => {
  const rows = settings.value.gridRows
  const boxSize = iconConfig.value.boxSize
  const gapY = settings.value.gridGapY
  const paddingY = 20 
  const totalHeight = rows * boxSize + (rows - 1) * gapY + paddingY
  return { height: `${totalHeight}px` }
})

const containerClasses = computed(() => ({
  'shortcuts-wrapper': true,
  'compress-mode': settings.value.compressLargeFolders,
  'overflow-mode': !settings.value.compressLargeFolders,
  'is-preview': isPreview.value
}))

const openShortcut = (url?: string) => {
  if (isPreview.value || !url) return
  if (settings.value.openNewTab) window.open(url, '_blank')
  else window.location.href = url
}

// 🌟 Provide 注入状态
provide(GridStateKey, {
  settings: settings.value,
  iconConfig: iconConfig.value,
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

// 🌟 Phase 4: 快照系统集成
import { useSnapshot } from './composables/useSnapshot'
import { useDialog } from '@/components/Dialog'
import { useToast } from '@/components/Toast/composables/useToast'
import { IconHistory, IconDeviceFloppy } from '@tabler/icons-vue'

// 异步导入 SnapshotManager 避免循环依赖
const SnapshotManager = defineAsyncComponent(() => 
  import('./components/SnapshotManager/SnapshotManager.vue')
)

const { 
  snapshots, 
  createSnapshot, 
  restoreSnapshot, 
  removeSnapshot, 
  renameSnapshot, 
  exportSnapshot,
  importSnapshot,
  getStorageSize
} = useSnapshot()

const dialog = useDialog()
const toast = useToast()

const handleOpenSnapshotManager = () => {
  if (isPreview.value) return 

  dialog.open({
    title: '', 
    dialogClass: 'snapshot-dialog-reset',
    component: SnapshotManager,
    width: 'auto', 
    showConfirmBtn: false,
    showCancelBtn: false,
    componentProps: {
      snapshots: snapshots,
      maxSnapshots: 20,
      storageSize: getStorageSize(),
      onRestore: (id: string) => {
        dialog.open({
          title: '确认恢复',
          content: '当前布局将被覆盖，确定要恢复此快照吗？',
          type: 'warning',
          showCancelBtn: true,
          onOk: () => {
             const { shortcuts: newShortcuts, settings: newSettings } = restoreSnapshot(id)
             shortcuts.value = newShortcuts
             Object.assign(settings.value, newSettings) // 注意：settings在非预览模式下是Proxy，可以直接assign
             reflowShortcuts()
             toast.success('布局已恢复')
             dialog.close(currentDialogId) 
          }
        })
      },
      onDelete: (id: string) => {
          removeSnapshot(id)
          toast.success('快照已删除')
      },
      onRename: (id: string, newName: string) => {
          try {
            renameSnapshot(id, newName)
            toast.success('重命名成功')
          } catch(e: any) {
            toast.error(e.message)
          }
      },
      onExport: (id: string) => {
          exportSnapshot(id)
          toast.success('导出开始')
      },
      onImport: async (file: File) => {
          try {
              await importSnapshot(file)
              toast.success('导入成功')
          } catch (e: any) {
              toast.error(e.message || '导入失败')
          }
      },
      onClose: () => {
          dialog.close(currentDialogId)
      }
    }
  })

  const dialogsRef = dialog.dialogs
  const currentDialogId = dialogsRef.value[dialogsRef.value.length - 1]?.id || ''
}

const handleSaveLayout = () => {
    if (isPreview.value) return
    const defaultName = `布局 ${new Date().toLocaleDateString()}`
    /* eslint-disable-next-line no-alert */
    const name = window.prompt('请输入快照名称', defaultName)
    
    if (name) {
        try {
            const snapshotSettings = {
                gridRows: settings.value.gridRows,
                gridCols: settings.value.gridCols,
                gridGapX: settings.value.gridGapX,
                gridGapY: settings.value.gridGapY,
                folderPreviewMode: settings.value.folderPreviewMode,
                iconConfig: { ...iconConfig.value }
            }
            createSnapshot(name, shortcuts.value, snapshotSettings)
            toast.success('布局已保存')
        } catch(e: any) {
            toast.error(e.message)
        }
    }
}

watch(
  [
    () => settings.value.gridRows,
    () => settings.value.gridCols,
    () => settings.value.folderPreviewMode,
    () => settings.value.compressLargeFolders,
  ],
  () => {
    currentPage.value = 0
    if (pagesContainerRef.value) pagesContainerRef.value.scrollTo({ left: 0 })
    nextTick(() => {
      virtualizer.value?.measure()
    })
  },
  { flush: 'post' }
)

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
  if (!isPreview.value) {
    loadData()
  }
  reflowShortcuts()
})
</script>

<template>
  <div :class="containerClasses" :style="[gridStyle, containerWidthStyle]">
    <!-- 导航按钮：预览模式隐藏 -->
    <transition name="fade">
      <div v-if="!isPreview && pagedShortcuts.length > 1" class="nav-btn prev" @click="prevPage">
        <IconChevronLeft :size="32" />
      </div>
    </transition>

    <div
      v-if="isPreview || settings.showShortcuts"
      ref="pagesContainerRef"
      class="pages-container"
      :class="{ 'preview-container': isPreview }"
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
      <div v-if="!isPreview && pagedShortcuts.length > 1" class="nav-btn next" @click="nextPage">
        <IconChevronRight :size="32" />
      </div>
    </transition>

    <div v-if="pagedShortcuts.length > 1" class="pagination-dots" :class="{ 'preview-dots': isPreview }">
      <span
        v-for="(_p, i) in pagedShortcuts"
        :key="i"
        class="dot"
        :class="{ active: i === currentPage }"
        @click="scrollToPage(i)"
      ></span>
    </div>

    <!-- 弹窗组件：预览模式不渲染 -->
    <template v-if="!isPreview">
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
        <div class="debug-btn" title="保存布局" @click="handleSaveLayout">
          <IconDeviceFloppy :size="20" />
        </div>
        <div class="debug-btn" title="布局历史" @click="handleOpenSnapshotManager">
          <IconHistory :size="20" />
        </div>
        <div class="debug-btn" title="新建文件夹" @click="handleCreateFolder">
          <IconFolderPlus :size="20" />
        </div>
        <div class="debug-btn" title="重置布局" @click="handleResetToDemo">
          <IconRefresh :size="20" />
        </div>
      </div>
    </template>
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

/* 预览模式适配 */
.shortcuts-wrapper.is-preview {
  width: 100% !important;
  height: 100% !important;
  min-height: 0 !important;
  overflow: hidden;
  background: transparent;
  display: flex;
  align-items: flex-start; /* 保持顶部对齐，缩放由父容器控制 */
  justify-content: center;
  pointer-events: none; /* 禁用所有交互 */
  user-select: none;
}

.shortcuts-wrapper.is-preview :deep(.pages-container) {
  overflow: visible; /* 允许超出以供缩放 */
  margin: 0;
  max-width: none;
  /* 强制重置样式以适应预览容器 */
  width: var(--dynamic-container-width) !important;
}

.shortcuts-wrapper.is-preview .pagination-dots {
  display: none; /* 预览模式隐藏圆点 */
}

/* 预览模式隐藏添加按钮 */
.shortcuts-wrapper.is-preview :deep(.add-btn-group) {
  display: none !important;
}
</style>

<style>
/* 全局样式覆盖 */
.snapshot-dialog-reset {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  width: auto !important;
  max-width: none !important;
}

.snapshot-dialog-reset .dialog-header {
  display: none !important;
}

.snapshot-dialog-reset .dialog-body {
  padding: 0 !important;
}

.snapshot-dialog-reset .dialog-footer {
  display: none !important;
}
</style>