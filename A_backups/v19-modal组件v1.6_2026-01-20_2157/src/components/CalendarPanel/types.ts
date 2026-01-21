export type ViewType = 'year' | 'month' | 'week'

export interface CalendarEvent {
  name: string
  date: string
  daysLeft: number
  type: 'term' | 'festival'
}

export interface TimeCapsuleItem {
  label: string
  passed: number
  total: number
  unit: string
  percent: string
  left: number
}

export interface TodayDetail {
  date: string
  weekDay: string
  lunarStr: string
  special: string
}

// Re-export specific types if needed, or define local variants
export type { TodoItem } from '@/composables/useTodos'
