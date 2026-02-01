<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import {
  IconCheck,
  IconTrash,
  IconPlus,
  IconChevronDown,
  IconEdit,
  IconCalendar,
  IconTrophy,
} from '@tabler/icons-vue'
import { useSettings } from '../composables/useSettings'
import DatePicker from './DatePicker/index.vue'
// [核心修改] 引入公共数据 Hook 和类型定义
import { useTodos, type TodoItem } from '../composables/useTodos'

const { settings } = useSettings()

// [核心修改] 使用公共状态
const { todos, initTodos } = useTodos()

// [核心修改] 下面的 TodoItem 接口定义已删除，直接使用导入的类型

// 保持原有的 UI 状态
const newTodoText = ref('')
const newTodoDescription = ref('')
const newTodoPriority = ref<'low' | 'medium' | 'high' | undefined>(undefined)
const newTodoTag = ref('')
const newTodoDueDate = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const isCollapsed = ref(settings.todoDefaultCollapsed)
const showAddOptions = ref(false)

const editingId = ref<number | null>(null)
const editText = ref('')
const editDescription = ref('')
const editPriority = ref<'low' | 'medium' | 'high' | undefined>(undefined)
const editTag = ref('')
const editDueDate = ref('')

const availableTags = ['工作', '学习', '生活', '购物', '健康', '其他']
const tagColors: Record<string, string> = {
  工作: '#3b82f6',
  学习: '#8b5cf6',
  生活: '#10b981',
  购物: '#f59e0b',
  健康: '#ef4444',
  其他: '#6b7280',
}

const wrapperStyle = computed(() => ({
  width: `${settings.todoWidth}px`,
}))

const contentStyle = computed(() => ({
  maxHeight: `${settings.todoListMaxHeight}px`,
}))

const completionRate = computed(() => {
  if (todos.value.length === 0) return 0
  const completed = todos.value.filter(t => t.done).length
  return Math.round((completed / todos.value.length) * 100)
})

const completedCount = computed(() => todos.value.filter(t => t.done).length)
const totalCount = computed(() => todos.value.length)

// 折叠动画逻辑
const onEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = 'auto'
  const height = element.scrollHeight
  element.style.height = '0'
  getComputedStyle(element).height
  requestAnimationFrame(() => {
    element.style.height = height + 'px'
  })
}

const onAfterEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = 'auto'
}

const onLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = element.scrollHeight + 'px'
  getComputedStyle(element).height
  requestAnimationFrame(() => {
    element.style.height = '0'
  })
}

onMounted(() => {
  // [核心修改] 初始化公共数据，不再手动读取 localStorage
  initTodos()
})

// [核心修改] 删除了 watch(todos) ... 逻辑，因为移到了 useTodos 中

const focusInput = async () => {
  await nextTick()
  inputRef.value?.focus()
}

const addTodo = async () => {
  const text = newTodoText.value.trim()
  if (!text) return
  todos.value.unshift({
    id: Date.now(),
    text,
    done: false,
    description: newTodoDescription.value.trim() || undefined,
    priority: newTodoPriority.value,
    tag: newTodoTag.value || undefined,
    dueDate: newTodoDueDate.value || undefined,
  })
  newTodoText.value = ''
  newTodoDescription.value = ''
  newTodoPriority.value = undefined
  newTodoTag.value = ''
  newTodoDueDate.value = ''
  showAddOptions.value = false
  await focusInput()
}

const removeTodo = (id: number) => {
  const item = todos.value.find(t => t.id === id)
  if (item) {
    item.deleting = true
    setTimeout(() => {
      todos.value = todos.value.filter(t => t.id !== id)
    }, 300)
  }
}

const toggleDone = (item: TodoItem) => {
  if (editingId.value === item.id) return
  const wasDone = item.done
  item.done = !item.done
  if (item.done && !wasDone) {
    item.justCompleted = true
    setTimeout(() => {
      item.justCompleted = false
    }, 600)
  }
}

const startEdit = (item: TodoItem) => {
  editingId.value = item.id
  editText.value = item.text
  editDescription.value = item.description || ''
  editPriority.value = item.priority
  editTag.value = item.tag || ''
  editDueDate.value = item.dueDate || ''
}

const saveEdit = () => {
  if (!editingId.value) return
  const item = todos.value.find(t => t.id === editingId.value)
  if (item && editText.value.trim()) {
    item.text = editText.value.trim()
    item.description = editDescription.value.trim() || undefined
    item.priority = editPriority.value
    item.tag = editTag.value || undefined
    item.dueDate = editDueDate.value || undefined
  }
  cancelEdit()
}

const cancelEdit = () => {
  editingId.value = null
  editText.value = ''
  editDescription.value = ''
  editPriority.value = undefined
  editTag.value = ''
  editDueDate.value = ''
}

const getDueDateStatus = (dueDate?: string) => {
  if (!dueDate) return null
  const dueTime = new Date(dueDate).getTime()
  const nowTime = Date.now()

  if (dueTime < nowTime) return 'overdue'

  const diffHours = (dueTime - nowTime) / (1000 * 60 * 60)
  if (diffHours > 0 && diffHours <= 72) return 'urgent'

  return 'normal'
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const h = date.getHours().toString().padStart(2, '0')
  const min = date.getMinutes().toString().padStart(2, '0')
  const timeStr = `${h}:${min}`

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(date)
  targetDate.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return `今天 ${timeStr}`
  if (diffDays === 1) return `明天 ${timeStr}`
  if (diffDays === -1) return `昨天 ${timeStr}`
  if (diffDays < -1) return `${Math.abs(diffDays)}天前 ${timeStr}`

  return `${date.getMonth() + 1}/${date.getDate()} ${timeStr}`
}

const getPriorityColor = (p?: string) => {
  if (p === 'high') return '#ef4444'
  if (p === 'medium') return '#f59e0b'
  if (p === 'low') return '#10b981'
  return 'transparent'
}

const getPriorityLabel = (p?: string) => {
  if (p === 'high') return '高'
  if (p === 'medium') return '中'
  if (p === 'low') return '低'
  return ''
}
</script>

<template>
  <div
    v-if="settings.todoShow"
    class="todo-wrapper"
    :class="{ 'collapsed-bg': isCollapsed }"
    :style="wrapperStyle"
  >
    <transition name="accordion" @enter="onEnter" @after-enter="onAfterEnter" @leave="onLeave">
      <div v-show="!isCollapsed" class="todo-content-wrapper">
        <div class="todo-content-inner" :style="contentStyle">
          <div class="add-section">
            <div v-if="totalCount > 0" class="progress-section">
              <div class="progress-header">
                <div class="progress-stats">
                  <IconTrophy :size="14" class="trophy-icon" />
                  <span class="progress-text">{{ completedCount }}/{{ totalCount }}</span>
                  <span class="progress-percent">{{ completionRate }}%</span>
                </div>
              </div>
              <div class="progress-bar-wrapper">
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" :style="{ width: completionRate + '%' }"></div>
                </div>
              </div>
            </div>

            <div class="add-row">
              <input
                ref="inputRef"
                v-model="newTodoText"
                type="text"
                placeholder="添加新任务..."
                @keydown.enter="addTodo"
                @focus="showAddOptions = true"
              />
              <button class="add-btn" :disabled="!newTodoText.trim()" @click="addTodo">
                <IconPlus :size="16" />
              </button>
            </div>

            <transition name="slide-fade">
              <div v-if="showAddOptions" class="add-options">
                <textarea
                  v-model="newTodoDescription"
                  placeholder="添加描述(可选)"
                  rows="2"
                ></textarea>

                <div class="options-row">
                  <select v-model="newTodoPriority" class="select-priority">
                    <option :value="undefined">优先级</option>
                    <option value="high">高优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="low">低优先级</option>
                  </select>

                  <select v-model="newTodoTag" class="select-tag">
                    <option value="">选择标签</option>
                    <option v-for="tag in availableTags" :key="tag" :value="tag">{{ tag }}</option>
                  </select>

                  <DatePicker v-model="newTodoDueDate" placeholder="截止时间" />
                </div>
              </div>
            </transition>
          </div>

          <div class="todo-list">
            <transition-group name="todo-list">
              <div
                v-for="item in todos"
                :key="item.id"
                class="todo-item"
                :class="{
                  done: item.done,
                  editing: editingId === item.id,
                  'has-priority': item.priority,
                  deleting: item.deleting,
                  'just-completed': item.justCompleted,
                }"
              >
                <div
                  v-if="item.priority"
                  class="priority-indicator"
                  :style="{ background: getPriorityColor(item.priority) }"
                ></div>

                <template v-if="editingId !== item.id">
                  <div class="checkbox" @click="toggleDone(item)">
                    <IconCheck v-if="item.done" :size="14" stroke-width="3" />
                  </div>
                  <div class="todo-main" @dblclick="startEdit(item)">
                    <div class="todo-header-line">
                      <span class="text">{{ item.text }}</span>
                      <div class="todo-badges">
                        <span
                          v-if="item.priority"
                          class="badge priority"
                          :style="{ background: getPriorityColor(item.priority) }"
                          >{{ getPriorityLabel(item.priority) }}</span
                        >
                        <span
                          v-if="item.tag"
                          class="badge tag"
                          :style="{ background: tagColors[item.tag] }"
                          >{{ item.tag }}</span
                        >
                        <span
                          v-if="item.dueDate"
                          class="badge due-date"
                          :class="getDueDateStatus(item.dueDate)"
                        >
                          <IconCalendar :size="11" /> {{ formatDate(item.dueDate) }}
                        </span>
                      </div>
                    </div>
                    <div v-if="item.description" class="description">{{ item.description }}</div>
                  </div>
                  <div class="action-buttons">
                    <button class="icon-btn edit-btn" @click.stop="startEdit(item)">
                      <IconEdit :size="14" />
                    </button>
                    <button class="icon-btn delete-btn" @click.stop="removeTodo(item.id)">
                      <IconTrash :size="14" />
                    </button>
                  </div>
                </template>

                <template v-else>
                  <div class="edit-form">
                    <input
                      v-model="editText"
                      type="text"
                      class="edit-input"
                      @keydown.enter="saveEdit"
                      @keydown.esc="cancelEdit"
                    />
                    <textarea
                      v-model="editDescription"
                      placeholder="描述"
                      rows="2"
                      class="edit-textarea"
                    ></textarea>
                    <div class="edit-options">
                      <select v-model="editPriority" class="select-priority">
                        <option :value="undefined">优先级</option>
                        <option value="high">高</option>
                        <option value="medium">中</option>
                        <option value="low">低</option>
                      </select>
                      <select v-model="editTag" class="select-tag">
                        <option value="">标签</option>
                        <option v-for="tag in availableTags" :key="tag" :value="tag">
                          {{ tag }}
                        </option>
                      </select>
                      <DatePicker v-model="editDueDate" placeholder="截止时间" />
                    </div>
                    <div class="edit-actions">
                      <button class="save-btn" @click="saveEdit">保存</button>
                      <button class="cancel-btn" @click="cancelEdit">取消</button>
                    </div>
                  </div>
                </template>
              </div>
            </transition-group>
            <div v-if="todos.length === 0" class="empty-tip">暂无待办</div>
          </div>
        </div>
        <div style="height: 8px; flex-shrink: 0"></div>
      </div>
    </transition>

    <div class="todo-header" @click="isCollapsed = !isCollapsed">
      <div class="header-left">
        <span class="title">待办事项</span>
        <div v-if="todos.length > 0" class="count">{{ todos.filter(t => !t.done).length }}</div>
      </div>
      <IconChevronDown :size="18" class="toggle-icon" :class="{ rotated: isCollapsed }" />
    </div>
  </div>
</template>

<style scoped src="../styles/TodoList.css"></style>
