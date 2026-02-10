<script setup lang="ts">
import { ref } from 'vue'
import { IconPlus, IconEdit, IconTrash, IconPin, IconPinFilled } from '@tabler/icons-vue'
import { useUserEvents, getDaysRemaining, formatEventText } from '../composables/useUserEvents'
import type { UserEvent } from '../types'

const { items, addItem, updateItem, removeItem } = useUserEvents()

const showForm = ref(false)
const editingItem = ref<UserEvent | null>(null)

// 表单字段
const formTitle = ref('')
const formDate = ref('')
const formRepeat = ref<'none' | 'yearly'>('none')

const handleAdd = () => {
  editingItem.value = null
  formTitle.value = ''
  formDate.value = ''
  formRepeat.value = 'none'
  showForm.value = true
}

const handleEdit = (item: UserEvent) => {
  editingItem.value = item
  formTitle.value = item.title
  formDate.value = item.targetDate
  formRepeat.value = item.repeat || 'none'
  showForm.value = true
}

const handleSubmit = () => {
  if (!formTitle.value.trim() || !formDate.value) return

  const data = {
    title: formTitle.value.trim(),
    targetDate: formDate.value,
    repeat: formRepeat.value,
    pinned: editingItem.value?.pinned ?? false,
  }

  if (editingItem.value) {
    updateItem(editingItem.value.id, data)
  } else {
    addItem(data)
  }

  showForm.value = false
  editingItem.value = null
}

const handleCancel = () => {
  showForm.value = false
  editingItem.value = null
}

const togglePin = (item: UserEvent) => {
  updateItem(item.id, { pinned: !item.pinned })
}
</script>

<template>
  <div class="user-event-panel">
    <!-- 事件列表（固定高度滚动） -->
    <div class="event-list">
      <div
        v-for="item in items"
        :key="item.id"
        class="event-item"
        :class="{ expired: item.repeat !== 'yearly' && getDaysRemaining(item.targetDate) < 0 }"
      >
        <span class="event-title">{{ item.title }}</span>
        <span
          class="event-days"
          :class="{ today: getDaysRemaining(item.targetDate) === 0 }"
        >
          {{ formatEventText(item) }}
        </span>

        <div class="event-actions">
          <button class="act-btn" :title="item.pinned ? '取消置顶' : '置顶'" @click.stop="togglePin(item)">
            <IconPinFilled v-if="item.pinned" :size="11" />
            <IconPin v-else :size="11" />
          </button>
          <button class="act-btn" title="编辑" @click.stop="handleEdit(item)">
            <IconEdit :size="11" />
          </button>
          <button class="act-btn danger" title="删除" @click.stop="removeItem(item.id)">
            <IconTrash :size="11" />
          </button>
        </div>
      </div>

      <div v-if="items.length === 0" class="event-empty">暂无自定义事件</div>
    </div>

    <!-- 内联表单 -->
    <div v-if="showForm" class="event-form">
      <div class="form-input-row">
        <input
          v-model="formTitle"
          class="form-input"
          type="text"
          placeholder="事件名称"
          maxlength="20"
          @keydown.enter="handleSubmit"
        />
        <input
          v-model="formDate"
          class="form-input date-input"
          type="date"
        />
      </div>

      <div class="form-bottom-row">
        <label class="repeat-toggle">
          <input v-model="formRepeat" type="checkbox" true-value="yearly" false-value="none" />
          <span>每年重复（纪念日）</span>
        </label>
        <div class="form-actions">
          <button class="form-btn" @click="handleCancel">取消</button>
          <button
            class="form-btn confirm"
            :disabled="!formTitle.trim() || !formDate"
            @click="handleSubmit"
          >
            {{ editingItem ? '保存' : '添加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 添加按钮 -->
    <button v-else class="add-btn" @click="handleAdd">
      <IconPlus :size="12" />
      <span>添加事件</span>
    </button>
  </div>
</template>

<style scoped>
.user-event-panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ========== 事件列表 ========== */
.event-list {
  display: flex;
  flex-direction: column;
  max-height: 140px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-divider) transparent;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 4px;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.event-item:hover {
  background: var(--bg-hover);
}

.event-item.expired {
  opacity: 0.5;
}

.event-title {
  flex: 1;
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-days {
  font-size: 11px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
}

.event-days.today {
  color: var(--color-primary);
  font-weight: 600;
}

/* ========== 操作按钮 ========== */
.event-actions {
  display: flex;
  gap: 1px;
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-smooth);
  flex-shrink: 0;
}

.event-item:hover .event-actions {
  opacity: 1;
}

.act-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.act-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.act-btn.danger:hover {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

.event-empty {
  font-size: 11px;
  color: var(--text-placeholder);
  text-align: center;
  padding: 12px 0;
}

/* ========== 内联表单 ========== */
.event-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--color-divider);
}

.form-input-row {
  display: flex;
  gap: 4px;
}

.form-input {
  flex: 1;
  height: 28px;
  padding: 0 6px;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 11px;
  font-family: var(--font-family-base);
  outline: none;
  transition: var(--transition-fast);
}

.form-input:focus {
  border-color: var(--color-primary);
}

:global(html.light) .date-input {
  color-scheme: light;
}

:global(html:not(.light)) .date-input {
  color-scheme: dark;
}

.form-bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.repeat-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--text-tertiary);
  cursor: pointer;
}

.repeat-toggle input {
  width: 12px;
  height: 12px;
  accent-color: var(--color-primary);
}

.form-actions {
  display: flex;
  gap: 4px;
}

.form-btn {
  padding: 3px 8px;
  border: 1px solid var(--color-divider);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 10px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.form-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.form-btn.confirm {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.form-btn.confirm:hover {
  background: var(--color-primary-hover);
}

.form-btn.confirm:disabled {
  opacity: var(--disabled-opacity);
  cursor: not-allowed;
}

/* ========== 添加按钮 ========== */
.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 6px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 11px;
  cursor: pointer;
  transition: var(--transition-fast);
  border-top: 1px solid var(--color-divider);
}

.add-btn:hover {
  color: var(--color-primary);
  background: var(--bg-hover);
}
</style>
