import { ref, type Ref } from 'vue'

export type TimeUnit = 'hour' | 'minute' | 'second'

const TIME_LIMITS: Record<TimeUnit, number> = {
  hour: 23,
  minute: 59,
  second: 59,
}

export function useTimeLogic() {
  const hour = ref(0)
  const minute = ref(0)
  const second = ref(0)

  const values: Record<TimeUnit, Ref<number>> = {
    hour,
    minute,
    second,
  }

  // 调整时间值（上下滚动）
  const adjustTime = (unit: TimeUnit, direction: 'up' | 'down') => {
    const delta = direction === 'up' ? 1 : -1
    const max = TIME_LIMITS[unit]
    const current = values[unit].value
    values[unit].value = (current + delta + max + 1) % (max + 1)
  }

  // 处理输入
  const handleTimeInput = (unit: TimeUnit, value: string) => {
    const num = parseInt(value) || 0
    const max = TIME_LIMITS[unit]
    values[unit].value = Math.min(max, Math.max(0, num))
  }

  // 处理滚轮
  const handleWheel = (event: WheelEvent, unit: TimeUnit) => {
    event.preventDefault()
    adjustTime(unit, event.deltaY < 0 ? 'up' : 'down')
  }

  // Tab 键导航
  const inputOrder: TimeUnit[] = ['hour', 'minute', 'second']
  const inputRefs = ref<Record<TimeUnit, HTMLInputElement | null>>({
    hour: null,
    minute: null,
    second: null,
  })

  const focusInput = (unit: TimeUnit) => {
    const el = inputRefs.value[unit]
    el?.focus()
    el?.select()
  }

  const handleKeydown = (event: KeyboardEvent, unit: TimeUnit) => {
    if (event.key !== 'Tab') return

    event.preventDefault()
    const index = inputOrder.indexOf(unit)
    const nextIndex = index + (event.shiftKey ? -1 : 1)

    if (nextIndex >= 0 && nextIndex < inputOrder.length) {
      focusInput(inputOrder[nextIndex])
    }
  }

  // 设置时间（从外部同步）
  const setTime = (h: number, m: number, s: number) => {
    hour.value = h
    minute.value = m
    second.value = s
  }

  // 设置为当前时间
  const setNow = () => {
    const now = new Date()
    hour.value = now.getHours()
    minute.value = now.getMinutes()
    second.value = now.getSeconds()
  }

  return {
    hour,
    minute,
    second,
    inputRefs,
    adjustTime,
    handleTimeInput,
    handleWheel,
    handleKeydown,
    focusInput,
    setTime,
    setNow,
  }
}
