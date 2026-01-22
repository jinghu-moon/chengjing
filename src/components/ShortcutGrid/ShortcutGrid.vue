<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconFolderPlus,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useSettings } from '../../composables/useSettings'
import { useShortcutDrag } from '../../composables/useShortcutDrag'
import { useShortcutData } from './composables/useShortcutData'
import { useShortcutLayout } from './composables/useShortcutLayout'
import { useFolderIconSize } from './composables/useFolderIconSize'
import ShortcutItem from './components/ShortcutItem.vue'
import EditForm from './components/EditForm.vue'
import FolderModal from './components/FolderModal.vue'
import ContextMenu from '../SelectMenu/components/ContextMenu.vue'
import type { OptionItem } from '../SelectMenu/types'
import { useDialog } from '../Dialog'
import { getRandomColor } from './config'
import type { Shortcut } from '../../types'

const { settings, iconConfig } = useSettings()
const { shortcuts, loadData, saveData, resetToDemo, createFolder } = useShortcutData()
const { pagedShortcuts, reflowShortcuts, syncFromPages } = useShortcutLayout(
  shortcuts,
  settings,
  saveData
)
const { folderSizeVars } = useFolderIconSize(settings, iconConfig)
const dialog = useDialog()

const currentPage = ref(0)
const pagesContainerRef = ref<HTMLElement | null>(null)

const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement
  const width = target.clientWidth
  const newPage = Math.round(target.scrollLeft / width)
  if (newPage !== currentPage.value) currentPage.value = newPage
}

const scrollToPage = (index: number) => {
  if (pagesContainerRef.value) {
    pagesContainerRef.value.scrollTo({
      left: index * pagesContainerRef.value.clientWidth,
      behavior: 'smooth',
    })
  }
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

const {
  dragTargetFolderId,
  isDraggingOut,
  draggableGroup,
  onStart,
  onMoveCallback,
  onDragEnd,
  onFolderDragStart,
  onFolderDragEnd,
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

const handlePageDragEnd = () => {
  syncFromPages()
  nextTick(() => onDragEnd())
}

const openFolder = (item: Shortcut) => {
  openedFolderId.value = item.id
  isDraggingOut.value = false
}

const folderCapacity = computed(() => {
  const [c, r] = settings.folderPreviewMode.split('x').map(Number)
  return c * r
})

const folderGridClass = computed(() => `mode-${settings.folderPreviewMode}`)

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
  const cols = settings.gridCols
  const boxSize = iconConfig.boxSize
  const gapX = settings.gridGapX
  const contentPadding = 40
  const totalWidth = cols * boxSize + (cols - 1) * gapX + contentPadding
  return { '--dynamic-container-width': `${totalWidth}px` }
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

// 模态框相关
const openAddModal = async () => {
  const editingItem: Shortcut = {
    id: 0,
    type: 'app',
    name: '',
    url: '',
    iconBase64: '',
    filled: false,
    inverted: false,
  }

  let savedData: Shortcut | null = null

  await dialog.open({
    title: '添加应用',
    component: EditForm,
    componentProps: {
      isFolderMode: false,
      editingItem,
      onSave: (data: Shortcut) => {
        savedData = data
      },
    },
    width: 420,
    showCancelBtn: true,
    onOk: async () => {
      if (savedData) {
        const name = savedData.name.trim()
        let url = savedData.url?.trim() || ''
        if (!name || !url) return
        if (!url.startsWith('http')) url = 'https://' + url

        const itemData: Shortcut = {
          ...savedData,
          id: Date.now(),
          type: 'app',
          name,
          url,
          color: savedData.iconBase64 ? '#fff' : getRandomColor(),
        }

        shortcuts.value.push(itemData)
        saveData()
        reflowShortcuts()
      }
    },
  })
}

const openEditModal = async (item: Shortcut) => {
  const isFolderMode = item.type === 'folder'
  const editingItem = JSON.parse(JSON.stringify(item))
  let savedData: Shortcut | null = null

  await dialog.open({
    title: isFolderMode ? '编辑文件夹' : '编辑应用',
    component: EditForm,
    componentProps: {
      isFolderMode,
      editingItem,
      onSave: (data: Shortcut) => {
        savedData = data
      },
    },
    width: 420,
    showCancelBtn: true,
    onOk: async () => {
      if (savedData) {
        if (isFolderMode) {
          const target = shortcuts.value.find(i => i.id === item.id)
          if (target) target.name = savedData.name
          saveData()
          return
        }

        const name = savedData.name.trim()
        let url = savedData.url?.trim() || ''
        if (!name || !url) return
        if (!url.startsWith('http')) url = 'https://' + url

        const itemData: Shortcut = {
          ...savedData,
          id: item.id,
          type: 'app',
          name,
          url,
          color: item.color || (savedData.iconBase64 ? '#fff' : getRandomColor()),
        }

        const idx = shortcuts.value.findIndex(i => i.id === item.id)
        if (idx > -1) shortcuts.value[idx] = itemData

        saveData()
        reflowShortcuts()
      }
    },
  })
}

// 右键菜单
const contextMenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)

const showContextMenu = async (e: MouseEvent, item: Shortcut) => {
  const menuOptions: OptionItem[] = [
    { value: 'edit', label: '编辑/重命名', prefixIcon: IconEdit },
    { value: 'delete', label: '删除', danger: true, prefixIcon: IconTrash },
  ]

  const result = await contextMenuRef.value?.open(e, menuOptions)

  if (result === 'edit') {
    openEditModal(item)
  } else if (result === 'delete') {
    if (confirm('删除?')) {
      const idx = shortcuts.value.findIndex(i => i.id === item.id)
      if (idx > -1) shortcuts.value.splice(idx, 1)
      saveData()
      reflowShortcuts()
    }
  }
}

const handleResetToDemo = () => {
  if (resetToDemo()) {
    reflowShortcuts()
  }
}

const handleCreateFolder = () => {
  createFolder()
  reflowShortcuts()
}

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
  }
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
      @scroll="handleScroll"
    >
      <div v-for="(pageData, pageIndex) in pagedShortcuts" :key="pageIndex" class="grid-page">
        <VueDraggable
          v-model="pagedShortcuts[pageIndex]"
          :group="draggableGroup"
          :animation="300"
          :force-fallback="true"
          :fallback-tolerance="3"
          ghost-class="shortcut-ghost"
          chosen-class="shortcut-chosen"
          drag-class="shortcut-drag"
          :move="onMoveCallback"
          class="page-inner-grid"
          item-key="id"
          @start="onStart"
          @end="handlePageDragEnd"
        >
          <ShortcutItem
            v-for="item in pageData"
            :key="item.id"
            :item="item"
            :is-drag-target="String(dragTargetFolderId) === String(item.id)"
            :folder-grid-class="folderGridClass"
            :folder-capacity="folderCapacity"
            @click="item.type === 'app' ? openShortcut(item.url) : openFolder(item)"
            @contextmenu="showContextMenu($event, item)"
            @open-shortcut="openShortcut"
          />
          <div
            v-if="pageIndex === pagedShortcuts.length - 1"
            class="shortcut-item add-btn-group"
            @click="openAddModal"
          >
            <div class="icon-box dashed">
              <IconPlus :size="28" stroke-width="1.5" />
            </div>
            <span class="shortcut-name">添加</span>
          </div>
        </VueDraggable>
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
      :folder="currentOpenedFolder || null"
      :is-dragging-out="isDraggingOut"
      :draggable-group="draggableGroup"
      @close="openedFolderId = null"
      @open-shortcut="openShortcut"
      @folder-drag-start="onFolderDragStart"
      @folder-drag-end="onFolderDragEnd"
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
