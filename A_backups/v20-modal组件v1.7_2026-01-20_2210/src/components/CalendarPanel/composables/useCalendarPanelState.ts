import { ref, computed, inject, provide, type InjectionKey, type Ref } from 'vue'
import dayjs from 'dayjs'
import { useCalendar } from '@/components/DatePicker'
import { useTodos } from '@/composables/useTodos' // Global hook
import type { ViewType, TodoItem } from '../types'

// ==================== Interfaces ====================

export interface CalendarPanelState {
  // State
  currentView: Ref<ViewType>
  selectedDate: Ref<Date | null>
  isYearMonthOpen: Ref<boolean>
  yearScrollDirection: Ref<'up' | 'down'>

  // Calendar Logic (from useCalendar)
  calendar: ReturnType<typeof useCalendar>

  // Derived State
  currentYear: Ref<number>
  currentMonth: Ref<number>

  // Methods
  switchView: (view: ViewType) => void
  selectDate: (date: Date) => void
  toggleYearMonth: () => void
  handleYearNav: (dir: 'up' | 'down') => void
  goToToday: () => void

  // Data Access (Proxied from global hooks for convenience)
  todos: Ref<TodoItem[]>
  getTodosByDate: (dateStr: string) => TodoItem[]
}

// ==================== Injection Key ====================

export const CalendarStateKey: InjectionKey<CalendarPanelState> = Symbol('CalendarState')

// ==================== Composable ====================

export function useCalendarPanelState() {
  // 1. Core State
  const currentView = ref<ViewType>('year')
  const selectedDate = ref<Date | null>(new Date())
  const isYearMonthOpen = ref(false)
  const yearScrollDirection = ref<'up' | 'down'>('down')

  // 2. Integration
  const calendar = useCalendar(selectedDate, { weekStartsOnSunday: true })
  const { todos, getTodosByDate } = useTodos() // Global singleton
  // access to CalendarData metadata is usually direct, but we can expose if needed.
  // For now components use useCalendarData() directly.

  // 3. Computed Helpers
  const currentYear = computed(() => calendar.viewDate.value.year())
  const currentMonth = computed(() => calendar.viewDate.value.month())

  // 4. Actions
  const switchView = (view: ViewType) => {
    currentView.value = view
  }

  const selectDate = (date: Date) => {
    selectedDate.value = date

    // Auto-switch view month if needed
    if (dayjs(date).month() !== calendar.viewDate.value.month()) {
      calendar.setViewDate(date)
    }
  }

  const toggleYearMonth = () => {
    isYearMonthOpen.value = !isYearMonthOpen.value
  }

  const handleYearNav = (dir: 'up' | 'down') => {
    yearScrollDirection.value = dir
    const delta = dir === 'down' ? 1 : -1
    calendar.viewDate.value = calendar.viewDate.value.add(delta, 'year')
  }

  const goToToday = () => {
    const today = new Date()
    if (currentView.value === 'year') {
      calendar.viewDate.value = dayjs(today)
    } else {
      selectedDate.value = today
      calendar.goToToday()
    }
  }

  const state: CalendarPanelState = {
    currentView,
    selectedDate,
    isYearMonthOpen,
    yearScrollDirection,
    calendar,
    currentYear,
    currentMonth,
    switchView,
    selectDate,
    toggleYearMonth,
    handleYearNav,
    goToToday,
    todos,
    getTodosByDate,
  }

  // Provide to children
  provide(CalendarStateKey, state)

  return state
}

// ==================== Injector Helper ====================

export function useCalendarState() {
  const state = inject(CalendarStateKey)
  if (!state) {
    throw new Error('useCalendarState must be used within a component using useCalendarPanelState')
  }
  return state
}
