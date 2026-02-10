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

/** 用户自定义事件（倒数日 / 纪念日） */
export interface UserEvent {
  id: string
  /** 事件名称 */
  title: string
  /** 目标日期 'YYYY-MM-DD' */
  targetDate: string
  /** 是否置顶 */
  pinned?: boolean
  /** 重复模式：none=普通倒数日，yearly=纪念日（每年重复） */
  repeat?: 'none' | 'yearly'
}

// Re-export specific types if needed, or define local variants
export type { TodoItem } from '@/composables/useTodos'
