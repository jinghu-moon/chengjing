import { ref, shallowRef, type Ref } from 'vue'
import type { TooltipPlacement } from './useTooltipPosition'

// ==================== 类型定义 ====================
export interface TooltipConfig {
  content: string
  placement?: TooltipPlacement
  showDelay?: number
  hideDelay?: number
  maxWidth?: number | string
  showArrow?: boolean
}

export interface TooltipSingleton {
  show: (el: HTMLElement, config: TooltipConfig) => void
  hide: () => void
  // 状态
  isOpen: Ref<boolean>
  triggerElement: Ref<HTMLElement | null>
  config: Ref<TooltipConfig>
}

// ==================== 单例状态 ====================
const isOpen = ref(false)
const triggerElement = shallowRef<HTMLElement | null>(null)
const config = ref<TooltipConfig>({
  content: '',
  placement: 'auto',
  showDelay: 200,
  hideDelay: 100,
  maxWidth: 280,
  showArrow: true,
})

let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined

const clearTimers = () => {
  if (showTimer) clearTimeout(showTimer)
  if (hideTimer) clearTimeout(hideTimer)
  showTimer = undefined
  hideTimer = undefined
}

// ==================== 单例方法 ====================
const show = (el: HTMLElement, newConfig: TooltipConfig) => {
  clearTimers()

  const delay = newConfig.showDelay ?? 200

  showTimer = setTimeout(() => {
    // 更新配置
    config.value = {
      content: newConfig.content,
      placement: newConfig.placement ?? 'auto',
      showDelay: newConfig.showDelay ?? 200,
      hideDelay: newConfig.hideDelay ?? 100,
      maxWidth: newConfig.maxWidth ?? 280,
      showArrow: newConfig.showArrow !== false,
    }

    // 设置触发器元素
    triggerElement.value = el

    // 显示
    isOpen.value = true
  }, delay)
}

const hide = () => {
  clearTimers()

  const delay = config.value.hideDelay ?? 100

  hideTimer = setTimeout(() => {
    isOpen.value = false
  }, delay)
}

// ==================== 导出单例 ====================
export const tooltipSingleton: TooltipSingleton = {
  show,
  hide,
  isOpen,
  triggerElement,
  config,
}

// ==================== Composable Hook ====================
export function useTooltipSingleton() {
  return tooltipSingleton
}
