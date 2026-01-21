<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import {
  IconFolder,
  IconExternalLink,
  IconEdit,
  IconTrash,
  IconCopy,
  IconWindow,
} from '@tabler/icons-vue'
import type { BookmarkStore, FolderGroup } from '../types'
import BookmarkCard from './BookmarkCard.vue'
import ContextMenu from '@/components/SelectMenu/components/ContextMenu.vue'
import type { OptionItem } from '@/components/SelectMenu/types'
import { useBookmarkDrag, type DropEvent } from '../composables/useBookmarkDrag'
import '../styles/drag.css'

const props = defineProps<{
  store: BookmarkStore
  groups: FolderGroup[] // 分组数据
  rowHeight?: number
  overscan?: number
  columns?: number
}>()

const emit = defineEmits<{
  (e: 'select', index: number): void
  (e: 'open', index: number): void
  (e: 'move', event: DropEvent): void
  (e: 'edit-title', index: number, newTitle: string): void
  (e: 'edit-url', index: number, newUrl: string): void
  (e: 'delete', index: number): void
  (e: 'copy-link', index: number): void
}>()

const parentRef = ref<HTMLElement | null>(null)
const ROW_HEIGHT = props.rowHeight ?? 72
const HEADER_HEIGHT = 32 // 分组标题行高度
const OVERSCAN = props.overscan ?? 5
const COLUMNS = props.columns ?? 2

// Drag & Drop
const { onDragStart, draggedIndex, dropTargetIndex, dropPosition } = useBookmarkDrag(props.store, {
  onDrop: event => emit('move', event),
})

// 将分组数据扁平化为"行"结构
interface RowItem {
  type: 'header' | 'bookmark-row'
  groupIndex: number
  folderPath?: string
  indices?: number[] // 该行的书签索引
}

const flatRows = computed<RowItem[]>(() => {
  const rows: RowItem[] = []

  for (let gi = 0; gi < props.groups.length; gi++) {
    const group = props.groups[gi]

    // 分组标题行
    rows.push({
      type: 'header',
      groupIndex: gi,
      folderPath: group.folderPath,
    })

    // 书签行
    const bookmarkRows = Math.ceil(group.indices.length / COLUMNS)
    for (let ri = 0; ri < bookmarkRows; ri++) {
      const start = ri * COLUMNS
      const rowIndices: number[] = []
      for (let c = 0; c < COLUMNS; c++) {
        if (start + c < group.indices.length) {
          rowIndices.push(group.indices[start + c])
        }
      }
      rows.push({
        type: 'bookmark-row',
        groupIndex: gi,
        indices: rowIndices,
      })
    }
  }

  return rows
})

// 计算每行高度
const getRowHeight = (index: number) => {
  return flatRows.value[index]?.type === 'header' ? HEADER_HEIGHT : ROW_HEIGHT
}

// Virtualizer
const virtualizer = useVirtualizer({
  get count() {
    return flatRows.value.length
  },
  getScrollElement: () => parentRef.value,
  estimateSize: index => getRowHeight(index),
  overscan: OVERSCAN,
})

const virtualItems = computed(() => virtualizer.value.getVirtualItems())
const totalSize = computed(() => virtualizer.value.getTotalSize())

// 粘性标题：当前可见的第一个分组
const currentStickyGroup = ref<FolderGroup | null>(null)
const showStickyHeader = ref(false)

/**
 * 优化后的粘性标题逻辑 (O(1) 复杂度)
 * 不再遍历 flatRows，而是直接从 virtualizer 获取可视项
 */
const updateStickyHeader = () => {
  if (!parentRef.value || flatRows.value.length === 0) {
    currentStickyGroup.value = null
    showStickyHeader.value = false
    return
  }

  // 1. 获取虚拟列表当前渲染的项 (仅包含视口可见 + overscan 区域的项)
  const virtualItems = virtualizer.value.getVirtualItems()
  if (virtualItems.length === 0) return

  // 2. 获取当前滚动位置
  const scrollTop = parentRef.value.scrollTop

  // 3. 找到第一个“真正进入视口”的元素
  // getVirtualItems 返回的列表包含 overscan (上方预渲染的)，可能会导致过早切换分组
  // 我们需要找到第一个底部超过 scrollTop 的项 (item.end > scrollTop)
  const firstVisibleItem = virtualItems.find(item => item.end > scrollTop)

  if (!firstVisibleItem) return

  // 4. 获取该行对应的源数据
  const row = flatRows.value[firstVisibleItem.index]
  if (!row) return

  // 5. 设置当前分组
  // 无论这行是标题还是书签，它都属于 groupIndex 指向的分组
  const group = props.groups[row.groupIndex]
  currentStickyGroup.value = group || null

  // 6. 判断是否显示粘性标题
  if (row.type === 'bookmark-row') {
    // 情况 A：当前视口顶部是“书签行”
    // 说明该组的标题已经被滚上去了，必须显示粘性标题
    showStickyHeader.value = true
  } else {
    // 情况 B：当前视口顶部是“分组标题行”本身
    // 只有当这个标题行已经往上滚了一段距离 (例如滚出一半或完全滚出) 时才显示粘性标题
    // 避免出现“粘性标题”遮挡“原始标题”的双重标题视觉 bug
    // item.start 是该行距离列表顶部的绝对像素位置
    // 判断条件：scrollTop 超过了 标题行顶部 + 标题高度 (即标题完全滚出视口)
    showStickyHeader.value = scrollTop > firstVisibleItem.start + HEADER_HEIGHT
  }
}

// 监听滚动
const onScroll = () => {
  updateStickyHeader()
}

// Reset scroll on data change
watch(
  () => props.groups.length,
  () => {
    virtualizer.value.scrollToIndex(0)
    updateStickyHeader()
  }
)

onMounted(() => {
  if (parentRef.value) {
    parentRef.value.addEventListener('scroll', onScroll, { passive: true })
  }
  updateStickyHeader()
})

onUnmounted(() => {
  if (parentRef.value) {
    parentRef.value.removeEventListener('scroll', onScroll)
  }
})

const handleSelect = (index: number) => {
  emit('select', index)
}

const handleOpen = (index: number) => {
  emit('open', index)
}

// ==================== 右键菜单 ====================
const contextMenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)

// 根据书签类型生成菜单选项
const getMenuOptions = (index: number): OptionItem[] => {
  const isFolder = props.store.isFolder[index] === 1

  if (isFolder) {
    // 文件夹菜单
    return [
      { value: 'open-all', label: '打开所有书签', prefixIcon: IconWindow },
      { value: 'divider' },
      { value: 'edit-title', label: '重命名', prefixIcon: IconEdit },
      { value: 'divider' },
      { value: 'delete', label: '删除文件夹', danger: true, prefixIcon: IconTrash },
    ]
  }

  // 书签菜单
  return [
    { value: 'open', label: '打开', shortcut: 'Enter', prefixIcon: IconExternalLink },
    { value: 'open-new-tab', label: '新标签页打开', shortcut: '⌘+Click' },
    { value: 'open-background', label: '后台打开' },
    { value: 'divider' },
    { value: 'edit-title', label: '编辑标题', prefixIcon: IconEdit },
    { value: 'edit-url', label: '编辑 URL' },
    { value: 'divider' },
    { value: 'copy-link', label: '复制链接', shortcut: '⌘+C', prefixIcon: IconCopy },
    { value: 'delete', label: '删除', danger: true, shortcut: 'Delete', prefixIcon: IconTrash },
  ]
}

// 处理右键菜单
const handleContextMenu = async (index: number, event: MouseEvent) => {
  if (!contextMenuRef.value) return

  const options = getMenuOptions(index)
  const result = await contextMenuRef.value.open(event, options)

  if (!result) return // 用户取消

  // 根据选择执行操作
  switch (result) {
    case 'open':
      window.location.href = props.store.urls[index]
      break

    case 'open-new-tab':
      window.open(props.store.urls[index], '_blank')
      break

    case 'open-background':
      if (chrome?.tabs) {
        chrome.tabs.create({
          url: props.store.urls[index],
          active: false,
        })
      } else {
        window.open(props.store.urls[index], '_blank')
      }
      break

    case 'edit-title':
      const currentTitle = props.store.titles[index]
      const newTitle = prompt('编辑标题', currentTitle)
      if (newTitle && newTitle !== currentTitle) {
        emit('edit-title', index, newTitle)
      }
      break

    case 'edit-url':
      const currentUrl = props.store.urls[index]
      const newUrl = prompt('编辑 URL', currentUrl)
      if (newUrl && newUrl !== currentUrl) {
        emit('edit-url', index, newUrl)
      }
      break

    case 'copy-link':
      emit('copy-link', index)
      break

    case 'delete':
      const itemName = props.store.titles[index]
      const isFolder = props.store.isFolder[index] === 1
      const confirmMsg = isFolder
        ? `确定删除文件夹"${itemName}"及其所有内容？`
        : `确定删除"${itemName}"？`

      if (confirm(confirmMsg)) {
        emit('delete', index)
      }
      break
  }
}
</script>

<template>
  <div class="bookmark-grid-container">
    <!-- Empty state -->
    <div v-if="groups.length === 0" class="empty-state">
      <span>此文件夹暂无书签</span>
    </div>

    <template v-else>
      <!-- Sticky Header (only when inline header is out of view) -->
      <div v-if="showStickyHeader && currentStickyGroup && groups.length > 1" class="sticky-header">
        <IconFolder :size="14" class="sticky-icon" />
        <span class="sticky-title">{{ currentStickyGroup.folderPath }}</span>
      </div>

      <!-- Virtualized grid -->
      <div ref="parentRef" class="scroll-container">
        <div class="virtual-list" :style="{ height: `${totalSize}px` }">
          <div
            v-for="virtualItem in virtualItems"
            :key="String(virtualItem.key)"
            class="virtual-row"
            :class="{ 'is-header': flatRows[virtualItem.index]?.type === 'header' }"
            :style="{
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }"
          >
            <!-- Group Header -->
            <div v-if="flatRows[virtualItem.index]?.type === 'header'" class="group-header">
              <IconFolder :size="14" class="group-icon" />
              <span class="group-title">{{ flatRows[virtualItem.index]?.folderPath }}</span>
            </div>

            <!-- Bookmark Row -->
            <div v-else class="row-grid">
              <BookmarkCard
                v-for="soaIndex in flatRows[virtualItem.index]?.indices || []"
                :key="soaIndex"
                :store="store"
                :index="soaIndex"
                :class="{
                  'is-dragging-source': draggedIndex === soaIndex,
                  'drag-over-before': dropTargetIndex === soaIndex && dropPosition === 'before',
                  'drag-over-after': dropTargetIndex === soaIndex && dropPosition === 'after',
                  'drag-over-inside': dropTargetIndex === soaIndex && dropPosition === 'inside',
                }"
                :data-index="soaIndex"
                compact
                @click="handleSelect"
                @open="handleOpen"
                @context-menu="handleContextMenu"
                @mousedown="onDragStart($event, soaIndex)"
              />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 全局右键菜单 -->
    <ContextMenu ref="contextMenuRef" />
  </div>
</template>

<style scoped>
.bookmark-grid-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: 13px;
}

/* Sticky Header */
.sticky-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-glass);
  z-index: 10;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  backdrop-filter: blur(8px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  /* Added shadow */
}

.sticky-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.sticky-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scroll-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  contain: strict;
}

.virtual-list {
  width: 100%;
  position: relative;
}

.virtual-row {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 4px 0;
  box-sizing: border-box;
}

.virtual-row.is-header {
  padding: 0;
}

/* Group Header (inline in list) */
.group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 100%;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-tertiary);
  background: var(--bg-hover);
  border-radius: 4px;
  margin: 0 4px;
}

.group-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.group-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 0 4px;
  height: 100%;
  align-items: stretch;
}
</style>
