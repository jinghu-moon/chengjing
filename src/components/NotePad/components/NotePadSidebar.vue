<script setup lang="ts">
/**
 * NotePadSidebar.vue
 * 展开模式侧边栏
 */
import { ref, computed } from 'vue'
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconUpload,
  IconPin,
  IconPinFilled,
  IconSortDescending,
  IconClock,
  IconCalendar,
  IconLetterCase,
} from '@tabler/icons-vue'
// [自动导入] Select 组件无需显式导入
// [类型导入] Select 组件类型定义
import type { OptionItem } from '@/components/SelectMenu'
import dayjs from 'dayjs'

interface Note {
  id: string
  title: string
  content: string
  isPinned?: boolean
  updatedAt: number
  createdAt: number
}

const props = defineProps<{
  notes: Note[]
  activeNoteId: string | null
  sortMode: 'updated' | 'created' | 'title'
}>()

const emit = defineEmits<{
  (e: 'update:activeNoteId', id: string): void
  (e: 'update:sortMode', mode: 'updated' | 'created' | 'title'): void
  (e: 'create'): void
  (e: 'delete', id: string): void
  (e: 'togglePin', id: string): void
  (e: 'import'): void
}>()

// 搜索
const searchQuery = ref('')

const filteredNotes = computed(() => {
  if (!searchQuery.value) return props.notes
  const q = searchQuery.value.toLowerCase()
  return props.notes.filter(
    n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
  )
})

const sortOptions = computed<OptionItem[]>(() => [
  {
    label: '更新时间',
    value: 'updated',
    prefixIcon: IconClock,
    type: 'default',
    checked: props.sortMode === 'updated',
  },
  {
    label: '创建时间',
    value: 'created',
    prefixIcon: IconCalendar,
    type: 'default',
    checked: props.sortMode === 'created',
  },
  {
    label: '标题名称',
    value: 'title',
    prefixIcon: IconLetterCase,
    type: 'default',
    checked: props.sortMode === 'title',
  },
])

const sortLabel = computed(() => {
  switch (props.sortMode) {
    case 'created':
      return '创建时间'
    case 'title':
      return '标题名称'
    default:
      return '更新时间'
  }
})

const formatDate = (ts: number) => dayjs(ts).format('MM/DD HH:mm')

const handleDelete = (id: string) => {
  if (confirm('确定删除这条笔记吗？')) {
    emit('delete', id)
  }
}
</script>

<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="search-bar">
        <IconSearch size="14" class="search-icon" />
        <input v-model="searchQuery" placeholder="搜索笔记..." />
      </div>

      <div style="position: relative">
        <SelectMenu
          class="ghost no-padding"
          :options="sortOptions"
          :model-value="sortMode"
          placement="bottomCenter"
          :show-arrow="false"
          dropdown-min-width="140px"
          trigger-width="auto"
          @update:model-value="(val: string) => $emit('update:sortMode', val as any)"
        >
          <template #trigger>
            <button class="icon-btn" :title="'排序: ' + sortLabel">
              <IconSortDescending size="18" />
            </button>
          </template>
        </SelectMenu>
      </div>

      <button class="icon-btn" title="导入文件" @click="$emit('import')">
        <IconUpload size="18" />
      </button>
      <button class="icon-btn add-btn" title="新建笔记" @click="$emit('create')">
        <IconPlus size="18" />
      </button>
    </div>

    <div class="note-list">
      <div
        v-for="note in filteredNotes"
        :key="note.id"
        class="note-item"
        :class="{ active: activeNoteId === note.id, pinned: note.isPinned }"
        @click="$emit('update:activeNoteId', note.id)"
      >
        <div class="note-item-header">
          <div class="note-item-title">{{ note.title || '无标题' }}</div>
          <button
            class="pin-btn"
            :title="note.isPinned ? '取消置顶' : '置顶'"
            @click.stop="$emit('togglePin', note.id)"
          >
            <component :is="note.isPinned ? IconPinFilled : IconPin" size="14" />
          </button>
        </div>
        <div class="note-item-meta">
          <span>{{ formatDate(note.updatedAt) }}</span>
        </div>
        <button class="delete-btn" @click.stop="handleDelete(note.id)">
          <IconTrash size="14" />
        </button>
      </div>
      <div v-if="filteredNotes.length === 0" class="empty-list">暂无笔记</div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: 220px;
  background: var(--bg-hover);
  border-right: 1px solid var(--border-glass);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 12px;
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--border-glass);
}

.search-bar {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 8px;
  color: var(--text-tertiary);
}

.search-bar input {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid transparent;
  padding: 6px 8px 6px 28px;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--text-xs);
  transition: all 0.2s;
}

.search-bar input:focus {
  background: var(--bg-active);
  border-color: var(--color-primary-alpha);
  outline: none;
}

.icon-btn {
  background: var(--bg-input);
  border: none;
  color: var(--text-secondary);
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.add-btn {
  background: var(--color-primary-alpha);
  color: var(--color-primary);
}

.add-btn:hover {
  background: var(--color-primary);
  color: var(--btn-text-color);
}

.note-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.note-item {
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-bottom: 4px;
  position: relative;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.note-item:hover {
  background: var(--bg-hover);
}

.note-item.active {
  background: var(--bg-active);
  border-color: var(--border-glass);
}

.note-item.pinned {
  border-left: 2px solid var(--color-primary);
  background: var(--bg-panel-card);
}

.note-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.pin-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  opacity: 0;
  transition: all 0.2s;
}

.note-item:hover .pin-btn,
.note-item.pinned .pin-btn {
  opacity: 1;
}

.pin-btn:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.note-item-title {
  font-size: var(--text-xs);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 4px;
}

.note-item-meta {
  font-size: 10px;
  color: var(--text-tertiary);
}

.delete-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-placeholder);
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;
  padding: 4px;
  border-radius: 4px;
}

.delete-btn:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.note-item:hover .delete-btn {
  opacity: 1;
}

.empty-list {
  text-align: center;
  padding: 20px;
  color: var(--text-tertiary);
  font-size: var(--text-xs);
}

.custom-select.no-padding :deep(.select-trigger) {
  padding: 0;
  height: auto;
  border: none;
}

.custom-select.no-padding :deep(.icon-wrapper) {
  display: none;
}
</style>
