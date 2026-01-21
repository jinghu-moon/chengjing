<script setup lang="ts">
import { computed } from 'vue'
import { IconChevronLeft, IconChevronRight, IconListCheck } from '@tabler/icons-vue'
import dayjs from 'dayjs'
import { useCalendarState } from '../composables/useCalendarPanelState'
import { useCalendarData } from '@/composables/useCalendarData'
import type { TodoItem } from '@/composables/useTodos'
import TodoItemComponent from '../components/TodoItem.vue'

// [Auto-Imported Global Hooks]
// useSimpleDrag, YearMonthWheel, Tooltip (for other usages if any)

const {
  currentYear,
  currentMonth,
  calendar,
  selectedDate,
  isYearMonthOpen,
  toggleYearMonth,
  selectDate,
} = useCalendarState()

const { viewDate, calendarDays, slideDirection, isAnimating, prevMonth, nextMonth } = calendar

const { getDayMetadata } = useCalendarData()
const { startDrag, dropTargetDate } = useSimpleDrag()

// Helper Computed
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const monthDays = computed(() => {
  return calendarDays.value.map(day => {
    const meta = getDayMetadata(day.fullDate)
    return {
      date: day.fullDate,
      isCurrentMonth: day.isCurrentMonth,
      meta,
    }
  })
})

const { getTodosByDate, todos } = useCalendarState()

const selectedDateTodos = computed(() => {
  if (!selectedDate.value) return []
  const dateStr = dayjs(selectedDate.value).format('YYYY-MM-DD')
  return getTodosByDate(dateStr).sort((a: TodoItem, b: TodoItem) => {
    if (a.done === b.done) return 0
    return a.done ? 1 : -1
  })
})

const upcomingTodos = computed(() => {
  if (selectedDateTodos.value.length > 0) return []
  if (!selectedDate.value) return []
  const targetDate = dayjs(selectedDate.value).startOf('day')
  return todos.value
    .filter(t => !t.done && t.dueDate && dayjs(t.dueDate).isAfter(targetDate))
    .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf())
    .slice(0, 2)
})

// Helpers
const isSameDate = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

const formatDate = (date: Date) => dayjs(date).format('YYYY-MM-DD')

const formatSmartTime = (dateStr?: string) => {
  if (!dateStr) return ''
  const d = dayjs(dateStr)
  const today = dayjs().startOf('day')
  const diff = d.startOf('day').diff(today, 'day')
  const timePart = d.format('HH:mm')
  if (diff === 0) return `今天 ${timePart}`
  if (diff === 1) return `明天 ${timePart}`
  if (diff === -1) return `昨天 ${timePart}`
  return `${d.format('MM/DD')} ${timePart}`
}

const getTodosForDate = (date: Date) => {
  return getTodosByDate(formatDate(date)).sort((a: TodoItem, b: TodoItem) => {
    if (a.done === b.done) return 0
    return a.done ? 1 : -1
  })
}

const handleSelectYear = (year: number) => {
  viewDate.value = viewDate.value.year(year)
}

const handleSelectMonth = (month: number) => {
  viewDate.value = viewDate.value.month(month - 1)
  isYearMonthOpen.value = false
}

const onTodoDragStart = (e: MouseEvent, todoId: number, fromDate: string) => {
  startDrag(e, todoId, fromDate)
}

const changeMonth = (step: number) => {
  if (step < 0) prevMonth()
  else nextMonth()
}
</script>

<template>
  <div class="view-container month-view-wrapper">
    <!-- Month Navigation -->
    <div class="month-nav">
      <button class="nav-arrow-btn" :disabled="isAnimating" @click="changeMonth(-1)">
        <IconChevronLeft size="20" />
      </button>
      <h2 class="month-title-clickable" @click="toggleYearMonth">
        {{ currentYear }}年{{ String(currentMonth + 1).padStart(2, '0') }}月
      </h2>
      <button class="nav-arrow-btn" :disabled="isAnimating" @click="changeMonth(1)">
        <IconChevronRight size="20" />
      </button>
      <transition name="slide-down">
        <div v-if="isYearMonthOpen" class="year-month-picker-panel">
          <YearMonthWheel
            :view-date="viewDate.toDate()"
            size="large"
            @select-year="handleSelectYear"
            @select-month="handleSelectMonth"
          />
        </div>
      </transition>
    </div>

    <!-- Grid Header -->
    <div class="month-grid-header">
      <div
        v-for="(day, index) in weekDays"
        :key="day"
        :class="['weekday-label', { weekend: index === 0 || index === 6 }]"
      >
        {{ day }}
      </div>
    </div>

    <!-- Grid Body -->
    <div class="month-grid-wrapper">
      <transition :name="slideDirection === 'left' ? 'slide-left' : 'slide-right'">
        <div :key="`${currentYear}-${currentMonth}`" class="month-grid-body">
          <div
            v-for="(item, index) in monthDays"
            :key="index"
            :class="[
              'day-cell',
              {
                'other-month': !item.isCurrentMonth,
                'is-today': item.meta.isToday,
                selected: selectedDate && isSameDate(item.date, selectedDate),
                'is-festival': item.meta.type === 'festival',
                'is-holiday': item.meta.tagType === 'holiday' || item.meta.tagType === 'lieu',
                'drop-target-active': dropTargetDate === formatDate(item.date),
              },
            ]"
            :data-date="formatDate(item.date)"
            @click="selectDate(item.date)"
          >
            <div class="day-header">
              <span class="day-num">{{ item.date.getDate() }}</span>
              <span v-if="item.meta.tagLabel" :class="['day-tag', `tag-${item.meta.tagType}`]">{{
                item.meta.tagLabel
              }}</span>
            </div>
            <span class="day-lunar">{{ item.meta.lunarText }}</span>

            <div class="task-dots">
              <span
                v-for="t in getTodosForDate(item.date)
                  .filter((t: TodoItem) => !t.done)
                  .slice(0, 4)"
                :key="t.id"
                class="dot"
                :class="t.priority || 'medium'"
              ></span>
              <span
                v-if="getTodosForDate(item.date).filter((t: TodoItem) => !t.done).length > 4"
                class="dot more"
              ></span>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Footer Info -->
    <div v-if="selectedDate" class="month-footer-info">
      <div class="info-header">
        <div class="header-left">
          <span class="header-date">{{ selectedDate.getDate() }}日</span>
          <span class="header-text">待办事项</span>
          <span v-if="selectedDateTodos.length > 0" class="header-count">{{
            selectedDateTodos.length
          }}</span>
        </div>
      </div>

      <div class="info-body">
        <div v-if="selectedDate && selectedDateTodos.length > 0" class="todo-list-scroll">
          <TodoItemComponent
            v-for="todo in selectedDateTodos"
            :key="todo.id"
            :todo="todo"
            @drag-start="e => onTodoDragStart(e, todo.id, formatDate(selectedDate!))"
          />
        </div>

        <div v-else class="empty-state-smart">
          <div class="empty-main">
            <IconListCheck size="24" class="empty-icon" />
            <span>今日暂无安排</span>
          </div>

          <div v-if="upcomingTodos.length > 0" class="upcoming-preview">
            <div class="preview-label">即将到来:</div>
            <div v-for="todo in upcomingTodos" :key="todo.id" class="preview-item">
              <span class="preview-dot" :class="todo.priority || 'medium'"></span>
              <span class="preview-text">{{ todo.text }}</span>
              <span class="preview-time">{{ formatSmartTime(todo.dueDate).split(' ')[0] }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('../styles/common.css');

.month-view-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Nav */
.month-nav {
  position: relative;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.month-nav h2 {
  font-size: 28px;
  font-weight: 700;
  width: 180px;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  white-space: nowrap;
}

.month-title-clickable {
  cursor: pointer;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.month-title-clickable:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.year-month-picker-panel {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: var(--space-2);
  z-index: 10;
  background: var(--bg-panel-overlay);
  border: var(--border-glass);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(var(--blur-md));
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Header */
.month-grid-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding-bottom: 20px;
}

.weekday-label {
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
}

.weekday-label.weekend {
  color: var(--color-danger);
}

/* Body */
.month-grid-wrapper {
  position: relative;
  overflow: hidden;
  width: 100%;
  flex: 1;
}

.month-grid-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 4px;
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
}

/* Cells */
.day-cell {
  background: var(--bg-panel);
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  border-radius: var(--radius-sm);
}

.day-cell:hover {
  background: var(--bg-hover-card);
  z-index: 2;
}

.day-cell.other-month {
  background: rgba(0, 0, 0, 0.2);
}

.day-cell.other-month .day-num {
  color: var(--text-placeholder);
}

.day-cell.other-month .day-lunar {
  color: var(--text-placeholder);
  opacity: 0.5;
}

.day-num {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.day-lunar {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 2px;
}

.day-cell.selected {
  background: var(--color-primary-alpha);
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
  z-index: 3;
}

.day-cell.is-today .day-num {
  background: var(--color-primary);
  color: #eceff4;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.day-cell.is-festival .day-lunar {
  color: var(--color-danger);
  font-weight: 600;
}

.day-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 4px;
}

.day-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  line-height: 1;
}

.tag-holiday {
  background: rgb(from var(--nord15) r g b / 0.2);
  color: var(--nord15);
}

.tag-lieu {
  background: rgb(from var(--nord12) r g b / 0.2);
  color: var(--nord12);
}

.tag-work {
  background: rgb(from var(--nord11) r g b / 0.15);
  color: var(--nord11);
}

.day-cell.is-holiday {
  background: rgb(from var(--nord8) r g b / 0.1);
}

/* Dots */
.task-dots {
  display: flex;
  gap: 3px;
  margin-top: auto;
  padding-bottom: 2px;
  width: 100%;
  flex-wrap: wrap;
  min-height: 24px;
  border-radius: 4px;
  transition: background-color 0.2s;
  align-items: center;
}

.task-dots::after {
  content: '';
  /* Expanded drag area */
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--text-tertiary);
  flex-shrink: 0;
}

.dot.high {
  background-color: #ef4444;
  box-shadow: 0 0 2px rgba(239, 68, 68, 0.5);
}

.dot.medium {
  background-color: #f59e0b;
}

.dot.low {
  background-color: #10b981;
}

.dot.more {
  background-color: var(--text-secondary);
  border-radius: 1px;
  opacity: 0.6;
}

/* Slide Transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-active,
.slide-right-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

/* Footer Info Area */
.month-footer-info {
  margin-top: 12px;
  height: 180px;
  background: var(--bg-panel-card);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-glass);
  flex-shrink: 0;
  animation: fade-in-up 0.3s ease-out;
}

.info-header {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-glass);
  background: rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.header-date {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.header-text {
  font-size: 12px;
  color: var(--text-secondary);
}

.header-count {
  background: var(--bg-active);
  color: var(--text-primary);
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 700;
  margin-left: 6px;
}

.info-body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.todo-list-scroll {
  height: 100%;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  grid-auto-rows: max-content;
  gap: 10px;
  align-content: start;
}

/* Empty State */
.empty-state-smart {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.empty-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.empty-icon {
  opacity: 0.3;
}

.upcoming-preview {
  border-top: 1px solid var(--border-glass);
  padding-top: 12px;
}

.preview-label {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-bottom: 6px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 0;
}

.preview-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-tertiary);
}

.preview-dot.medium {
  background: #f59e0b;
}

.preview-time {
  margin-left: auto;
  font-family: monospace;
  color: var(--text-tertiary);
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
