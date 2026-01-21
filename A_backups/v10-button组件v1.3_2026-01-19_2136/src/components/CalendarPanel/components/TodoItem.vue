<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { IconCheck } from '@tabler/icons-vue'
import type { TodoItem } from '@/composables/useTodos'

const props = defineProps<{
  todo: TodoItem
  compact?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:todo', todo: TodoItem): void
  (e: 'drag-start', event: MouseEvent): void
  (e: 'delete'): void // Optional: for future use
}>()

// Tooltip State
const tooltipVisible = ref(false)
const tempTimeValue = ref('')

// Helper: 格式化时间显示
const formattedTime = computed(() => {
  if (!props.todo.dueDate) return ''
  return dayjs(props.todo.dueDate).format('HH:mm')
})

const smartTimeDisplay = computed(() => {
  if (!props.todo.dueDate) return ''
  const d = dayjs(props.todo.dueDate)
  const today = dayjs().startOf('day')
  const diff = d.startOf('day').diff(today, 'day')
  const timePart = d.format('HH:mm')
  if (diff === 0) return `今天 ${timePart}`
  if (diff === 1) return `明天 ${timePart}`
  if (diff === -1) return `昨天 ${timePart}`

  if (props.compact) {
    return timePart
  }
  return `${d.format('MM/DD')} ${timePart}`
})

const dueStatus = computed(() => {
  if (!props.todo.dueDate) return 'normal'
  const due = dayjs(props.todo.dueDate)
  const now = dayjs()
  if (due.isBefore(now)) return 'overdue'
  if (due.diff(now, 'hour') <= 72) return 'urgent'
  return 'normal'
})

// Handlers
const toggleDone = () => {
  // Modify simple object ref if parent relies on reactivity,
  // but strictly we should emit update.
  // Given standard Vue usage with objects, direct mutation of nested prop is anti-pattern but common.
  // Best practice: Mutate the object if it's reactive from a store (useTodos).
  props.todo.done = !props.todo.done
}

const handleDragStart = (event: MouseEvent) => {
  emit('drag-start', event)
}

// Time Picker Logic
const onTimeClick = () => {
  tempTimeValue.value = formattedTime.value || '12:00'
  tooltipVisible.value = true
}

const onTimeChange = (val: string) => {
  tempTimeValue.value = val
  if (props.todo.dueDate) {
    const [hour, minute] = val.split(':').map(Number)
    props.todo.dueDate = dayjs(props.todo.dueDate)
      .hour(hour || 0)
      .minute(minute || 0)
      .format('YYYY-MM-DD HH:mm')
  }
}
</script>

<template>
  <div class="footer-todo-item draggable-item" :class="{ compact }" @mousedown="handleDragStart">
    <div
      class="todo-checkbox"
      :class="{ done: todo.done }"
      @click.stop="toggleDone"
      @mousedown.stop
    >
      <IconCheck v-if="todo.done" :size="compact ? 12 : 12" color="white" :stroke-width="4" />
    </div>

    <div class="todo-content" :class="{ done: todo.done }">
      {{ todo.text }}
    </div>

    <!-- Time Display / Picker -->
    <Tooltip
      v-if="todo.dueDate"
      v-model:visible="tooltipVisible"
      trigger="click"
      placement="bottom"
      @click.stop
      @mousedown.stop
    >
      <!-- Trigger -->
      <div
        v-if="!compact"
        class="todo-time-badge clickable"
        :class="dueStatus"
        @click="onTimeClick"
      >
        {{ smartTimeDisplay }}
      </div>
      <span v-else class="tiny-time clickable" @click="onTimeClick">
        {{ smartTimeDisplay }}
      </span>

      <!-- Content -->
      <template #content>
        <TimePicker :model-value="tempTimeValue" @update:model-value="onTimeChange" />
      </template>
    </Tooltip>
  </div>
</template>

<style scoped>
.footer-todo-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: var(--bg-panel);
  border-radius: 8px;
  font-size: 13px;
  gap: 8px;
  transition: all 0.2s;
  border: 1px solid transparent;
  width: 100%;
  min-width: 0;
}

.footer-todo-item:hover {
  background: var(--bg-hover);
  border-color: var(--border-glass);
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.footer-todo-item.compact {
  padding: 6px 10px;
  background: rgb(from var(--color-primary) r g b / 0.08);
  border: 1px solid rgb(from var(--color-primary) r g b / 0.15);
  border-radius: 8px;
}

.todo-checkbox {
  width: 18px;
  height: 18px;
  border: 2px solid var(--text-tertiary);
  border-radius: 5px;
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.todo-checkbox:hover {
  border-color: var(--color-primary);
}

.todo-checkbox.done {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.todo-content {
  flex: 1;
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.todo-content.done {
  text-decoration: line-through;
  color: var(--text-tertiary);
  opacity: 0.8;
}

/* Time Badge (Full) */
.todo-time-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  flex-shrink: 0;
  background: var(--bg-input);
  color: var(--text-secondary);
}

.todo-time-badge.urgent {
  background: #fcd34d;
  color: #78350f;
}

.todo-time-badge.overdue {
  background: #fca5a5;
  color: #7f1d1d;
}

.todo-time-badge.normal {
  background: rgb(from var(--color-primary) r g b / 0.15);
  color: var(--color-primary);
}

/* Tiny Time (Compact) */
.tiny-time {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-left: auto;
}

.clickable {
  cursor: pointer;
  transition: all 0.15s;
}

.clickable:hover {
  opacity: 0.8;
  transform: scale(1.05);
}
</style>
