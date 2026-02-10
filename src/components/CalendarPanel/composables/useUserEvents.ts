import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import { useCalendarData } from '@/composables/useCalendarData'
import type { UserEvent } from '../types'

const STORAGE_KEY = 'lime-user-events'

/** 倒数日预设白名单 */
const COUNTDOWN_FESTIVALS = new Set([
  '春节', '除夕', '清明节', '劳动节', '端午节',
  '中秋节', '国庆节', '元旦', '元宵节',
])

// ========== 动态节假日生成 ==========

/**
 * 扫描未来 400 天，通过 useCalendarData 动态获取节假日预设
 * 与 DashboardCards 共享同一数据源（chinese-days）
 */
function generateHolidayPresets(
  getDayMetadata: ReturnType<typeof useCalendarData>['getDayMetadata'],
): UserEvent[] {
  const today = dayjs().startOf('day')
  const items: UserEvent[] = []
  const seen = new Set<string>()

  for (let i = 0; i <= 400; i++) {
    const d = today.add(i, 'day')
    const meta = getDayMetadata(d.toDate())

    if (meta.festival && COUNTDOWN_FESTIVALS.has(meta.festival)) {
      if (seen.has(meta.festival)) continue
      seen.add(meta.festival)

      items.push({
        id: `preset-${meta.dateStr}`,
        title: meta.festival,
        targetDate: meta.dateStr,
        pinned: false,
        repeat: 'none',
      })
    }
  }

  return items
}

// ========== 计算工具函数 ==========

/** 计算目标日期距今天的天数差（正数=未来，负数=已过） */
export function getDaysRemaining(targetDate: string): number {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(targetDate + 'T00:00:00')
  const diff = target.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/** 格式化事件显示文案 */
export function formatEventText(event: UserEvent): string {
  const days = getDaysRemaining(event.targetDate)

  if (event.repeat === 'yearly') {
    // 纪念日模式：计算已过天数 / 周年
    const totalDays = Math.abs(days)
    if (days > 0) return `还有 ${days} 天`
    if (days === 0) return '就是今天'
    const years = Math.floor(totalDays / 365)
    if (years > 0) return `第 ${years + 1} 年`
    return `第 ${totalDays} 天`
  }

  // 普通倒数日
  if (days > 0) return `${days} 天`
  if (days === 0) return '就是今天'
  return `已过 ${Math.abs(days)} 天`
}

// ========== 模块级单例状态 ==========

const items = ref<UserEvent[]>([])
let isLoaded = false
let watcherInitialized = false

function loadItems(
  getDayMetadata: ReturnType<typeof useCalendarData>['getDayMetadata'],
) {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      items.value = JSON.parse(raw)
    } catch {
      items.value = generateHolidayPresets(getDayMetadata)
    }
  } else {
    items.value = generateHolidayPresets(getDayMetadata)
  }
}

function initWatcher() {
  if (watcherInitialized) return
  watch(
    items,
    (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)),
    { deep: true },
  )
  watcherInitialized = true
}

// ========== 导出 Composable ==========

export function useUserEvents() {
  const { getDayMetadata } = useCalendarData()

  if (!isLoaded) {
    loadItems(getDayMetadata)
    isLoaded = true
    setTimeout(() => initWatcher(), 0)
  }

  /** 按 pinned 优先 → 剩余天数升序 */
  const sortedItems = computed(() => {
    return [...items.value].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return getDaysRemaining(a.targetDate) - getDaysRemaining(b.targetDate)
    })
  })

  /** 最近的一条（优先未过期） */
  const nearest = computed(() => {
    const future = sortedItems.value.filter(i => getDaysRemaining(i.targetDate) >= 0)
    return future[0] || sortedItems.value[0] || null
  })

  const addItem = (item: Omit<UserEvent, 'id'>) => {
    items.value.push({ ...item, id: String(Date.now()) })
  }

  const updateItem = (id: string, patch: Partial<Omit<UserEvent, 'id'>>) => {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx !== -1) {
      items.value[idx] = { ...items.value[idx], ...patch }
    }
  }

  const removeItem = (id: string) => {
    items.value = items.value.filter(i => i.id !== id)
  }

  return {
    items: sortedItems,
    nearest,
    addItem,
    updateItem,
    removeItem,
    getDaysRemaining,
    formatEventText,
  }
}
