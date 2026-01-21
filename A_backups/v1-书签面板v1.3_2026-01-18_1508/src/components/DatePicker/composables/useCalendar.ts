import { ref, computed, type Ref } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'

export interface CalendarDay {
  date: number
  fullDate: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
}

export type SlideDirection = 'left' | 'right' | null

const ANIMATION_DURATION = 300

export interface UseCalendarOptions {
  weekStartsOnSunday?: boolean // 默认 false（周一起始）
}

export function useCalendar(selectedDate: Ref<Date | null>, options: UseCalendarOptions = {}) {
  const { weekStartsOnSunday = false } = options

  const viewDate = ref<Dayjs>(dayjs())
  const slideDirection = ref<SlideDirection>(null)
  const isAnimating = ref(false)

  // 42 天矩阵：6行 x 7列
  const calendarDays = computed<CalendarDay[]>(() => {
    const current = viewDate.value
    const month = current.month()

    // 获取本月第一天
    const firstDayOfMonth = current.startOf('month')
    // 计算偏移量
    // weekStartsOnSunday: day() 直接使用（0=周日）
    // weekStartsOnMonday: (day() || 7) - 1（将周日转为 7，再减 1）
    const startOffset = weekStartsOnSunday
      ? firstDayOfMonth.day()
      : (firstDayOfMonth.day() || 7) - 1

    const today = dayjs().startOf('day').valueOf()
    const selectedTime = selectedDate.value
      ? dayjs(selectedDate.value).startOf('day').valueOf()
      : null

    return Array.from({ length: 42 }, (_, i) => {
      const d = firstDayOfMonth.add(i - startOffset, 'day')
      const time = d.startOf('day').valueOf()

      return {
        date: d.date(),
        fullDate: d.toDate(),
        isCurrentMonth: d.month() === month,
        isToday: time === today,
        isSelected: time === selectedTime,
      }
    })
  })

  // 当前月份年份显示文本
  const currentMonthYear = computed(() => {
    return `${viewDate.value.year()}年${viewDate.value.month() + 1}月`
  })

  // 月份年份 key（用于动画）
  const monthYearKey = computed(() => {
    return `${viewDate.value.year()}-${viewDate.value.month()}`
  })

  // 导航函数
  const navigate = (yearDelta: number, monthDelta: number, dir: SlideDirection) => {
    if (isAnimating.value) return

    slideDirection.value = dir
    isAnimating.value = true

    viewDate.value = viewDate.value.add(yearDelta, 'year').add(monthDelta, 'month').startOf('month')

    setTimeout(() => {
      slideDirection.value = null
      isAnimating.value = false
    }, ANIMATION_DURATION)
  }

  const prevMonth = () => navigate(0, -1, 'right')
  const nextMonth = () => navigate(0, 1, 'left')
  const prevYear = () => navigate(-1, 0, 'right')
  const nextYear = () => navigate(1, 0, 'left')

  // 跳转到今天
  const goToToday = () => {
    viewDate.value = dayjs()
  }

  // 设置视图日期（从外部同步）
  const setViewDate = (date: Date) => {
    viewDate.value = dayjs(date)
  }

  return {
    viewDate,
    calendarDays,
    currentMonthYear,
    monthYearKey,
    slideDirection,
    isAnimating,
    prevMonth,
    nextMonth,
    prevYear,
    nextYear,
    goToToday,
    setViewDate,
  }
}
