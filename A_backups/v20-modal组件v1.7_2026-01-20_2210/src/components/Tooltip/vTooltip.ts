import { type ObjectDirective } from 'vue'
import { tooltipSingleton } from './composables/useTooltipSingleton'
import type { TooltipPlacement } from './composables/useTooltipPosition'

// ==================== 类型定义 ====================
interface TooltipDirectiveValue {
  content: string
  placement?: TooltipPlacement
  showDelay?: number
  hideDelay?: number
  maxWidth?: number | string
  showArrow?: boolean
  disabled?: boolean
}

type DirectiveValue = string | TooltipDirectiveValue

// ==================== 辅助函数 ====================
const parseValue = (value: DirectiveValue): TooltipDirectiveValue => {
  if (typeof value === 'string') {
    return { content: value }
  }
  return value
}

// ==================== 指令定义 ====================
export const vTooltip: ObjectDirective<HTMLElement, DirectiveValue> = {
  mounted(el, binding) {
    if (!binding.value) return

    const config = parseValue(binding.value)
    if (config.disabled) return

    const show = () => {
      if (config.disabled) return
      tooltipSingleton.show(el, {
        content: config.content,
        placement: config.placement,
        showDelay: config.showDelay,
        hideDelay: config.hideDelay,
        maxWidth: config.maxWidth,
        showArrow: config.showArrow,
      })
    }

    const hide = () => {
      tooltipSingleton.hide()
    }

    // 绑定事件
    el.addEventListener('mouseenter', show)
    el.addEventListener('mouseleave', hide)
    el.addEventListener('focus', show)
    el.addEventListener('blur', hide)

    // 存储清理函数
    ;(el as any).__vTooltip = {
      show,
      hide,
      destroy: () => {
        el.removeEventListener('mouseenter', show)
        el.removeEventListener('mouseleave', hide)
        el.removeEventListener('focus', show)
        el.removeEventListener('blur', hide)
      },
    }
  },

  updated(el, binding) {
    // 更新时重新绑定
    const instance = (el as any).__vTooltip
    if (instance) {
      instance.destroy()
      delete (el as any).__vTooltip
      vTooltip.mounted?.(el, binding, null as any, null as any)
    }
  },

  unmounted(el) {
    const instance = (el as any).__vTooltip
    if (instance) {
      instance.destroy()
      delete (el as any).__vTooltip
    }
  },
}

export default vTooltip
