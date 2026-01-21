<script setup lang="ts">
import { computed, ref } from 'vue'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-vue'
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import { useCalendarState } from '../composables/useCalendarPanelState'
import { useCalendarData } from '@/composables/useCalendarData'
import TodoItemComponent from '../components/TodoItem.vue'

// Init Dayjs plugin
dayjs.extend(weekOfYear)

// [Auto-Imported Hooks]
// useSimpleDrag, Tooltip

const { selectedDate, calendar, selectDate } = useCalendarState()

const { viewDate } = calendar
const { getDayMetadata } = useCalendarData()
const { startDrag, dropTargetDate } = useSimpleDrag()

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// Computed
const currentWeekNum = computed(() => dayjs(selectedDate.value).week())
const weekStartStr = computed(() => dayjs(selectedDate.value).startOf('week').format('YYYY-MM-DD'))

// Animation (vertical like YearView)
const scrollDirection = ref<'up' | 'down'>('down')

const { getTodosByDate } = useCalendarState()

const weekDaysList = computed(() => {
  if (!selectedDate.value) return []
  const startOfWeek = dayjs(selectedDate.value).startOf('week')

  return Array.from({ length: 7 }, (_, i) => {
    const d = startOfWeek.add(i, 'day')
    const dateStr = d.format('YYYY-MM-DD')
    const meta = getDayMetadata(d.toDate())

    return {
      dateObj: d.toDate(),
      dayNum: d.date(),
      weekDayStr: weekDays[d.day()],
      lunar: meta.lunarText,
      isToday: meta.isToday,
      isSelected: d.isSame(selectedDate.value, 'day'),
      todos: getTodosByDate(dateStr).sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1)),
    }
  })
})

// Implementation
const changeWeek = (step: number) => {
  if (!selectedDate.value) return

  scrollDirection.value = step > 0 ? 'down' : 'up'

  const newDate = dayjs(selectedDate.value).add(step, 'week')
  // Sync selectedDate and calendar viewDate
  selectDate(newDate.toDate())
  viewDate.value = newDate
}

const formatDate = (date: Date) => dayjs(date).format('YYYY-MM-DD')

const onTodoDragStart = (e: MouseEvent, todoId: number, fromDate: string) => {
  startDrag(e, todoId, fromDate)
}

const handleSelectDate = (date: Date) => {
  selectDate(date)
}
</script>

<template>
  <div class="view-container week-view-wrapper">
    <div class="month-nav">
      <button class="nav-arrow-btn" @click="changeWeek(-1)">
        <IconChevronLeft size="20" />
      </button>
      <h2 class="month-title-clickable">
        <span>{{ dayjs(selectedDate).format('YYYY') }}年</span>
        <span class="week-badge">第{{ String(currentWeekNum).padStart(2, '0') }}周</span>
      </h2>
      <button class="nav-arrow-btn" @click="changeWeek(1)">
        <IconChevronRight size="20" />
      </button>
    </div>

    <div class="week-list-scroll-mask">
      <Transition :name="scrollDirection === 'down' ? 'week-scroll-up' : 'week-scroll-down'">
        <div :key="weekStartStr" class="week-list-scroll">
          <!-- Week Rows -->
          <div
            v-for="day in weekDaysList"
            :key="day.dateObj.toString()"
            class="week-row"
            :class="{
              'is-today': day.isToday,
              'is-selected': day.isSelected,
              'drop-target-active': dropTargetDate === formatDate(day.dateObj),
            }"
            :data-date="formatDate(day.dateObj)"
            @click="handleSelectDate(day.dateObj)"
          >
            <div class="week-row-sidebar">
              <div class="week-name-big">周{{ day.weekDayStr }}</div>

              <div class="week-date-group">
                <span class="week-date-num">{{ day.dayNum }}日</span>
                <span class="week-lunar">{{ day.lunar }}</span>
              </div>

              <div v-if="day.isToday" class="week-today-line"></div>
            </div>

            <div class="week-row-content">
              <!-- Todo Grid -->
              <div class="week-todo-grid" :class="{ 'is-empty': day.todos.length === 0 }">
                <TodoItemComponent
                  v-for="todo in day.todos"
                  :key="todo.id"
                  :todo="todo"
                  :compact="true"
                  @drag-start="e => onTodoDragStart(e, todo.id, formatDate(day.dateObj))"
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
@import url('../styles/common.css');

.week-view-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

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

.week-badge {
  font-size: 0.9em;
  margin-left: 8px;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 6px;
  color: var(--text-secondary);
  font-weight: 600;
}

/* Mask for animation overflow */
.week-list-scroll-mask {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}

/* The sliding page - use Grid like YearView for smooth animation */
.week-list-scroll {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding-right: 4px;
  padding-bottom: 20px;
  position: absolute;
  top: 0;
  left: 0;

  /* Grid layout for consistent row heights during animation */
  display: grid;
  grid-template-rows: repeat(7, 1fr);
  gap: 12px;
  align-content: stretch;
  will-change: transform, opacity;
}

.week-row {
  display: flex;
  background: var(--bg-panel);
  border-radius: 12px;
  min-height: 0;
  /* Allow grid to control height */
  border: 1px solid transparent;
  transition:
    background 0.2s,
    border-color 0.2s,
    box-shadow 0.2s;
  overflow: hidden;
  position: relative;
  gap: 12px;
}

.week-row:hover {
  background: var(--bg-hover);
  border-color: var(--border-glass);
}

.week-row.is-today {
  background: rgb(from var(--color-primary) r g b / 0.05);
}

.week-row.is-selected {
  border: 1px solid var(--color-primary-light);
}

.week-row-sidebar {
  width: 100px;
  background: rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--border-glass);
  padding: 0 12px;
  flex-shrink: 0;
  position: relative;
  gap: 4px;
}

.week-name-big {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

.week-row.is-today .week-name-big {
  color: var(--color-primary);
}

.week-date-group {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.week-date-num {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.week-lunar {
  font-size: 11px;
  color: var(--text-tertiary);
}

.week-today-line {
  position: absolute;
  left: 0;
  top: 10%;
  bottom: 10%;
  width: 3px;
  background: var(--color-primary);
  border-radius: 0 4px 4px 0;
}

.week-row-content {
  flex: 1;
  padding: 12px 24px;
  display: grid;
  align-items: center;
  min-width: 0;
  overflow-y: auto;
}

.week-todo-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.week-todo-grid.is-empty {
  height: 100%;
  min-height: 40px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
}

.week-todo-grid.is-empty:has(.drop-preview-placeholder) {
  opacity: 1;
}

.week-row:hover .week-todo-grid.is-empty {
  opacity: 1;
}

.week-todo-grid.is-empty::after {
  content: '+';
  font-size: 18px;
  color: var(--text-placeholder);
  font-weight: 300;
  transition: all 0.2s;
}

.week-row:hover .week-todo-grid.is-empty::after {
  color: var(--color-primary);
  transform: scale(1.2);
}

/* Vertical Scroll Animations (optimized for 7 rows) */
.week-scroll-up-enter-active,
.week-scroll-up-leave-active {
  transition:
    transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.week-scroll-down-enter-active,
.week-scroll-down-leave-active {
  transition:
    transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Next week: old exits upward, new enters from below */
.week-scroll-up-leave-to {
  transform: translateY(-30%);
  opacity: 0;
}

.week-scroll-up-enter-from {
  transform: translateY(30%);
  opacity: 0;
}

/* Prev week: old exits downward, new enters from above */
.week-scroll-down-leave-to {
  transform: translateY(30%);
  opacity: 0;
}

.week-scroll-down-enter-from {
  transform: translateY(-30%);
  opacity: 0;
}
</style>
