<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import {
  IconPlus,
  IconTrash,
  IconPhoto,
  IconEdit,
  IconFolderPlus,
  IconRefresh,
  IconX,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-vue'
import { VueDraggable } from 'vue-draggable-plus'
import { useSettings } from '../composables/useSettings'
import { useShortcutDrag } from '../composables/useShortcutDrag'
import type { Shortcut } from '../types'

const { settings, iconConfig } = useSettings()

const defaultShortcuts: Shortcut[] = [
  { id: 1, type: 'app', name: 'Bilibili', url: 'https://www.bilibili.com', color: '#FB7299' },
  {
    id: 2,
    type: 'app',
    name: 'GitHub',
    url: 'https://github.com',
    color: '#181717',
    inverted: true,
  },
  {
    id: 3,
    type: 'folder',
    name: '社交媒体',
    color: 'rgba(255,255,255,0.15)',
    children: [
      { id: 31, type: 'app', name: 'YouTube', url: 'https://www.youtube.com', color: '#FF0000' },
      { id: 32, type: 'app', name: '知乎', url: 'https://www.zhihu.com', color: '#0084FF' },
      { id: 33, type: 'app', name: 'ChatGPT', url: 'https://chat.openai.com', color: '#74AA9C' },
      { id: 34, type: 'app', name: 'Vue', url: 'https://vuejs.org', color: '#42B883' },
    ],
  },
  { id: 4, type: 'app', name: 'Google', url: 'https://google.com', color: '#4285F4' },
  { id: 5, type: 'app', name: 'Gmail', url: 'https://mail.google.com', color: '#EA4335' },
]

const shortcuts = ref<Shortcut[]>([])
const pagedShortcuts = ref<Shortcut[][]>([])
const currentPage = ref(0)
const pagesContainerRef = ref<HTMLElement | null>(null)

const pageCapacity = computed(() => settings.gridRows * settings.gridCols)

// 智能计算槽位
const getItemSlots = (item: Shortcut) => {
  if (item.type === 'app') return 1
  const [fc, fr] = settings.folderPreviewMode.split('x').map(Number)

  if (settings.compressLargeFolders) {
    const actualCols = Math.min(fc, settings.gridCols)
    const actualRows = Math.min(fr, settings.gridRows)
    return actualCols * actualRows
  } else {
    return fc * fr
  }
}

const reflowShortcuts = () => {
  const flat = shortcuts.value
  const maxSlots = pageCapacity.value
  const newPages: Shortcut[][] = []

  let currentPageItems: Shortcut[] = []
  let currentSlotsUsed = 0

  flat.forEach(item => {
    const itemCost = getItemSlots(item)
    if (currentSlotsUsed + itemCost > maxSlots) {
      newPages.push(currentPageItems)
      currentPageItems = []
      currentSlotsUsed = 0
    }
    currentPageItems.push(item)
    currentSlotsUsed += itemCost
  })

  if (currentPageItems.length > 0) newPages.push(currentPageItems)
  if (newPages.length === 0 || currentSlotsUsed + 1 > maxSlots) newPages.push([])

  pagedShortcuts.value = newPages
}

const syncFromPages = () => {
  const flat = pagedShortcuts.value.flat()
  if (JSON.stringify(flat) !== JSON.stringify(shortcuts.value)) {
    shortcuts.value = flat
    saveData()
  }
}

watch(
  [
    () => settings.gridRows,
    () => settings.gridCols,
    () => settings.folderPreviewMode,
    () => settings.compressLargeFolders,
  ],
  () => {
    reflowShortcuts()
    currentPage.value = 0
    if (pagesContainerRef.value) pagesContainerRef.value.scrollTo({ left: 0 })
  }
)

watch(shortcuts, () => saveData(), { deep: true })

const loadData = () => {
  const saved = localStorage.getItem('shortcuts')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      shortcuts.value = parsed.map((item: any) => ({
        ...item,
        id: item.id || Date.now() + Math.random(),
        type: item.type || 'app',
        children: item.children || [],
      }))
    } catch (e) {
      shortcuts.value = [...defaultShortcuts]
    }
  } else {
    shortcuts.value = [...defaultShortcuts]
  }
  reflowShortcuts()
}

const saveData = () => {
  try {
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts.value))
  } catch (e) {
    console.error(e)
  }
}

const resetToDemo = () => {
  if (confirm('重置布局？')) {
    shortcuts.value = JSON.parse(JSON.stringify(defaultShortcuts))
    reflowShortcuts()
    saveData()
  }
}

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

// [核心修改] 循环翻页逻辑
const prevPage = () => {
  const totalPages = pagedShortcuts.value.length
  if (totalPages <= 1) return

  // 如果当前是第0页，跳到最后一页；否则减1
  const target = currentPage.value > 0 ? currentPage.value - 1 : totalPages - 1
  scrollToPage(target)
}

const nextPage = () => {
  const totalPages = pagedShortcuts.value.length
  if (totalPages <= 1) return

  // 如果当前是最后一页，跳到第0页；否则加1
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
}))

// 动态计算容器宽度
const containerWidthStyle = computed(() => {
  const cols = settings.gridCols
  const boxSize = iconConfig.boxSize
  const gapX = settings.gridGapX
  const contentPadding = 40 // grid-page 自带的 padding (左右各20)

  const totalWidth = cols * boxSize + (cols - 1) * gapX + contentPadding

  return {
    '--dynamic-container-width': `${totalWidth}px`,
  }
})

// 动态容器类名
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
const getIconSrc = (item: Shortcut) => {
  if (item.iconBase64) return item.iconBase64
  if (!item.url) return ''
  try {
    return `https://icons.bitwarden.net/${new URL(item.url).hostname}/icon.png`
  } catch {
    return ''
  }
}
const handleImageLoad = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.opacity = '1'
  const fb = img.nextElementSibling as HTMLElement
  if (fb) fb.style.opacity = '0'
}
const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.opacity = '0'
  const fb = img.nextElementSibling as HTMLElement
  if (fb) fb.style.opacity = '1'
}

const isModalOpen = ref(false)
const isFolderMode = ref(false)
const newForm = ref<Shortcut>({
  id: 0,
  type: 'app',
  name: '',
  url: '',
  iconBase64: '',
  filled: false,
  inverted: false,
})
const editingIndex = ref(-1)
const fileInputRef = ref<HTMLInputElement | null>(null)
const modalTitle = computed(() =>
  isFolderMode.value
    ? editingIndex.value === -1
      ? '新建文件夹'
      : '编辑文件夹'
    : editingIndex.value === -1
      ? '添加应用'
      : '编辑应用'
)
const previewIcon = computed(() => {
  if (newForm.value.iconBase64) return newForm.value.iconBase64
  if (newForm.value.url) {
    try {
      return `https://icons.bitwarden.net/${new URL(newForm.value.url).hostname}/icon.png`
    } catch {
      return ''
    }
  }
  return ''
})
const previewChar = computed(() =>
  newForm.value.name ? newForm.value.name.charAt(0).toUpperCase() : '?'
)
const openAddModal = () => {
  editingIndex.value = -1
  isFolderMode.value = false
  newForm.value = {
    id: Date.now(),
    type: 'app',
    name: '',
    url: '',
    iconBase64: '',
    filled: false,
    inverted: false,
  }
  isModalOpen.value = true
}
const createFolder = () => {
  shortcuts.value.push({
    id: Date.now(),
    type: 'folder',
    name: '新文件夹',
    children: [],
    color: 'rgba(255,255,255,0.15)',
  })
  saveData()
  reflowShortcuts()
}
const openEditModal = (item: Shortcut) => {
  editingIndex.value = item.id as number
  isFolderMode.value = item.type === 'folder'
  newForm.value = JSON.parse(JSON.stringify(item))
  isModalOpen.value = true
}
const closeModal = () => {
  isModalOpen.value = false
}
const triggerFileUpload = () => {
  fileInputRef.value?.click()
}
const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    newForm.value.iconBase64 = ev.target?.result as string
  }
  reader.readAsDataURL(file)
}
const handleSave = () => {
  if (isFolderMode.value) {
    const target = shortcuts.value.find(i => i.id === editingIndex.value)
    if (target) target.name = newForm.value.name
    saveData()
    closeModal()
    return
  }
  const name = newForm.value.name.trim()
  let url = newForm.value.url?.trim() || ''
  if (!name || !url) return
  if (!url.startsWith('http')) url = 'https://' + url
  let originalColor = undefined
  if (editingIndex.value !== -1) {
    const original = shortcuts.value.find(i => i.id === editingIndex.value)
    if (original) originalColor = original.color
  }
  const itemData: Shortcut = {
    ...newForm.value,
    id: newForm.value.id || Date.now(),
    type: 'app',
    name,
    url,
    color: originalColor || (newForm.value.iconBase64 ? '#fff' : getRandomColor()),
  }
  if (editingIndex.value !== -1) {
    const idx = shortcuts.value.findIndex(i => i.id === editingIndex.value)
    if (idx > -1) shortcuts.value[idx] = itemData
  } else {
    shortcuts.value.push(itemData)
  }
  saveData()
  reflowShortcuts()
  closeModal()
}
const getRandomColor = () =>
  ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'].sort(() => Math.random() - 0.5)[0]
const contextMenu = ref({ visible: false, x: 0, y: 0, itemId: -1 })
const showContextMenu = (e: MouseEvent, item: Shortcut) => {
  e.preventDefault()
  contextMenu.value = { visible: true, x: e.clientX, y: e.clientY, itemId: item.id as number }
}
const clickEdit = () => {
  if (contextMenu.value.itemId > -1) {
    const item = shortcuts.value.find(i => i.id === contextMenu.value.itemId)
    if (item) openEditModal(item)
  }
  contextMenu.value.visible = false
}
const clickDelete = () => {
  if (contextMenu.value.itemId > -1 && confirm('删除?')) {
    const idx = shortcuts.value.findIndex(i => i.id === contextMenu.value.itemId)
    if (idx > -1) shortcuts.value.splice(idx, 1)
    saveData()
    reflowShortcuts()
  }
  contextMenu.value.visible = false
}
onMounted(() => {
  loadData()
  document.addEventListener('click', () => (contextMenu.value.visible = false))
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
          <div
            v-for="item in pageData"
            :key="item.id"
            class="shortcut-item"
            :class="[
              { 'is-folder': item.type === 'folder' },
              item.type === 'folder' ? folderGridClass : '',
            ]"
            :style="{ '--brand-color': item.color || '#888' }"
            :data-id="item.id"
            :data-type="item.type"
            @contextmenu.stop="showContextMenu($event, item)"
            @click="item.type === 'app' ? openShortcut(item.url) : openFolder(item)"
          >
            <div
              v-if="item.type === 'app'"
              class="icon-box"
              :class="{ filled: item.filled, inverted: item.inverted }"
            >
              <img
                :src="getIconSrc(item)"
                class="shortcut-icon"
                alt=""
                @load="handleImageLoad"
                @error="handleImageError"
              />
              <div class="shortcut-fallback">{{ item.name.charAt(0).toUpperCase() }}</div>
            </div>
            <div
              v-else-if="item.type === 'folder'"
              class="folder-box"
              :class="{ 'is-drag-target': String(dragTargetFolderId) === String(item.id) }"
            >
              <div
                v-if="item.children && item.children.length > 0"
                class="folder-grid"
                :class="folderGridClass"
              >
                <div
                  v-for="subItem in item.children.slice(0, folderCapacity)"
                  :key="subItem.id"
                  class="mini-app"
                  @click.stop="openShortcut(subItem.url)"
                >
                  <div
                    class="mini-icon-wrapper"
                    :style="{ backgroundColor: subItem.color || '#ddd' }"
                  >
                    <img
                      :src="getIconSrc(subItem)"
                      class="mini-icon-img"
                      @error="e => ((e.target as HTMLElement).style.display = 'none')"
                    />
                  </div>
                </div>
              </div>
              <div v-else class="empty-folder-grid" :class="folderGridClass">
                <span v-for="n in folderCapacity" :key="n" class="dot"></span>
              </div>
              <transition name="fade">
                <div
                  v-if="String(dragTargetFolderId) === String(item.id)"
                  class="folder-hover-overlay"
                >
                  <IconPlus :size="32" color="#fff" stroke-width="3" />
                </div>
              </transition>
            </div>
            <span class="shortcut-name">{{ item.name }}</span>
          </div>
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
    <transition name="folder-expand">
      <div
        v-if="currentOpenedFolder"
        class="folder-overlay"
        :class="{ 'dragging-out': isDraggingOut }"
        @click.self="openedFolderId = null"
      >
        <div ref="folderContainerRef" class="folder-content-glass">
          <div class="folder-header">
            <input
              v-model="currentOpenedFolder.name"
              class="folder-title-input"
              placeholder="文件夹名称"
            />
            <div class="close-icon" @click="openedFolderId = null">
              <IconX :size="20" />
            </div>
          </div>
          <VueDraggable
            v-if="currentOpenedFolder.children"
            v-model="currentOpenedFolder.children"
            :group="draggableGroup"
            :animation="300"
            :force-fallback="true"
            :fallback-on-body="true"
            ghost-class="shortcut-ghost"
            class="folder-inner-grid"
            item-key="id"
            @start="onFolderDragStart"
            @end="onFolderDragEnd"
          >
            <div
              v-for="subItem in currentOpenedFolder.children"
              :key="subItem.id"
              class="shortcut-item inner-item"
              @click.stop="openShortcut(subItem.url)"
            >
              <div class="icon-box" :class="{ filled: subItem.filled, inverted: subItem.inverted }">
                <img :src="getIconSrc(subItem)" class="shortcut-icon" @error="handleImageError" />
                <div class="shortcut-fallback">{{ subItem.name.charAt(0).toUpperCase() }}</div>
              </div>
              <span class="shortcut-name">{{ subItem.name }}</span>
            </div>
          </VueDraggable>
          <div
            v-if="!currentOpenedFolder.children || currentOpenedFolder.children.length === 0"
            class="empty-tip"
          >
            拖拽外部图标进来，或从这里拖拽出去
          </div>
        </div>
      </div>
    </transition>
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    >
      <div class="ctx-item" @click="clickEdit"><IconEdit :size="16" /> 编辑/重命名</div>
      <div class="ctx-item danger" @click="clickDelete"><IconTrash :size="16" /> 删除</div>
    </div>
    <div class="debug-actions">
      <div class="debug-btn" title="新建文件夹" @click="createFolder">
        <IconFolderPlus :size="20" />
      </div>
      <div class="debug-btn" title="重置布局" @click="resetToDemo">
        <IconRefresh :size="20" />
      </div>
    </div>
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box glass-panel">
        <div class="modal-header">
          <span class="modal-title">{{ modalTitle }}</span>
        </div>
        <div class="modal-body">
          <div v-if="isFolderMode" class="form-section">
            <div class="input-group">
              <input
                v-model="newForm.name"
                type="text"
                class="modern-input"
                placeholder="文件夹名称"
                @keyup.enter="handleSave"
              />
            </div>
          </div>
          <template v-else>
            <div class="upload-section" @click="triggerFileUpload">
              <div
                class="preview-box"
                :class="{ filled: newForm.filled, inverted: newForm.inverted }"
              >
                <img
                  v-if="previewIcon"
                  :src="previewIcon"
                  class="preview-img"
                  @error="e => ((e.target as HTMLElement).style.display = 'none')"
                /><span v-else class="preview-char">{{ previewChar }}</span>
                <div class="upload-hint">
                  <IconPhoto :size="20" />
                </div>
              </div>
              <span class="upload-text">更换图标</span
              ><input
                ref="fileInputRef"
                type="file"
                style="display: none"
                accept="image/*"
                @change="handleFileChange"
              />
            </div>
            <div class="form-section">
              <div class="input-group">
                <input v-model="newForm.name" type="text" class="modern-input" placeholder="名称" />
              </div>
              <div class="input-group">
                <input v-model="newForm.url" type="text" class="modern-input" placeholder="URL" />
              </div>
              <div class="options-row">
                <label class="checkbox-btn" :class="{ active: newForm.filled }"
                  ><input v-model="newForm.filled" type="checkbox" /><span>填充</span></label
                ><label class="checkbox-btn" :class="{ active: newForm.inverted }"
                  ><input v-model="newForm.inverted" type="checkbox" /><span>反色</span></label
                >
              </div>
            </div>
          </template>
        </div>
        <div class="modal-footer">
          <button class="text-btn" @click="closeModal">取消</button
          ><button class="primary-btn" @click="handleSave">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="../styles/ShortcutGrid.css"></style>

<style scoped>
/* 覆盖 pages-container 的最大宽度逻辑 */
:deep(.pages-container) {
  /* calc(100vw - 160px) 确保了左右两侧永远保留 80px 的安全距离给按钮。
    按钮宽度 48px + margin 24px = 72px，所以 80px 是安全的。
  */
  max-width: min(var(--dynamic-container-width), calc(100vw - 160px));
  margin: 0 auto;
  position: relative;
  z-index: 10;
}

/* 导航按钮样式：改为 fixed 定位，使其脱离文档流，永远固定在窗口边缘 */
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
  /* 确保层级极高 */
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
  /* 距离左边缘 24px */
}

.nav-btn.next {
  right: 24px;
  /* 距离右边缘 24px */
}

/* 简单的淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 移动端隐藏箭头 */
@media (max-width: 768px) {
  .nav-btn {
    display: none;
  }
}
</style>
