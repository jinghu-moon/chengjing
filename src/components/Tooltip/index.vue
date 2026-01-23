<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, toRef, useSlots } from 'vue'
import { useTooltipPosition, type TooltipPlacement } from './composables/useTooltipPosition'

// ==================== Props ====================
const props = withDefaults(
  defineProps<{
    content?: string
    placement?: TooltipPlacement
    trigger?: 'hover' | 'click' | 'focus' | 'manual'
    showArrow?: boolean
    disabled?: boolean
    showDelay?: number
    hideDelay?: number
    offset?: number
    maxWidth?: number | string
    visible?: boolean // 支持 v-model:visible
  }>(),
  {
    content: '',
    placement: 'top',
    trigger: 'hover',
    showArrow: true,
    disabled: false,
    showDelay: 200,
    hideDelay: 100,
    offset: 8,
    maxWidth: 280,
    visible: undefined,
  }
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const slots = useSlots()

// ==================== State ====================
// 如果传入了 visible prop，则使用它初始化，否则默认为 false
const isOpen = ref(props.visible ?? false)
const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)

// 监听 prop 变化
watch(
  () => props.visible,
  val => {
    if (val !== undefined) {
      clearTimers() // 清除可能存在的延时
      isOpen.value = val
    }
  }
)

let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined

// 唯一 ID (用于 A11y)
const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`

// ==================== Composables ====================
const { actualPlacement, tooltipStyle, arrowStyle, throttledUpdatePosition, getBaseDirection } =
  useTooltipPosition({
    isOpen,
    triggerRef,
    tooltipRef,
    placement: toRef(props, 'placement'),
    offset: toRef(props, 'offset'),
  })

// 基础方向（用于箭头样式类名）
const baseDirection = computed(() => getBaseDirection(actualPlacement.value))

// 合并样式：定位 + maxWidth
const computedTooltipStyle = computed(() => {
  const mw = typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth
  return {
    ...tooltipStyle.value,
    maxWidth: mw,
  }
})

// ==================== 检查是否有内容可显示 ====================
const hasContent = computed(() => {
  return props.content || slots.content
})

// ==================== 定时器管理 ====================
const clearTimers = () => {
  if (showTimer) clearTimeout(showTimer)
  if (hideTimer) clearTimeout(hideTimer)
  showTimer = undefined
  hideTimer = undefined
}

const show = () => {
  if (props.disabled || !hasContent.value) return
  clearTimers()
  showTimer = setTimeout(() => {
    isOpen.value = true
    emit('update:visible', true)
  }, props.showDelay)
}

const hide = () => {
  clearTimers()
  hideTimer = setTimeout(() => {
    isOpen.value = false
    emit('update:visible', false)
  }, props.hideDelay)
}

const toggle = () => {
  if (isOpen.value) {
    hide()
  } else {
    show()
  }
}

// ==================== 事件处理 ====================
const handleMouseEnter = () => {
  if (props.trigger === 'hover') show()
}

const handleMouseLeave = () => {
  if (props.trigger === 'hover') hide()
}

const handleClick = () => {
  if (props.trigger === 'click') toggle()
}

const handleFocus = () => {
  if (props.trigger === 'focus') show()
}

const handleBlur = () => {
  if (props.trigger === 'focus') hide()
}

// Tooltip 悬停时保持显示（解决"断层"问题）
const handleTooltipEnter = () => {
  if (props.trigger === 'hover') {
    clearTimers()
  }
}

const handleTooltipLeave = () => {
  if (props.trigger === 'hover') {
    hide()
  }
}

// 点击外部关闭 (仅 click 模式)
const handleClickOutside = (event: MouseEvent) => {
  if (props.trigger !== 'click' || !isOpen.value) return

  const target = event.target as Node
  const isTrigger = triggerRef.value?.contains(target)
  const isTooltip = tooltipRef.value?.contains(target)

  if (!isTrigger && !isTooltip) {
    isOpen.value = false
    emit('update:visible', false)
  }
}

// ==================== 监听器 ====================
watch(isOpen, val => {
  if (val) {
    throttledUpdatePosition()
    window.addEventListener('scroll', throttledUpdatePosition, true)
    window.addEventListener('resize', throttledUpdatePosition)
  } else {
    window.removeEventListener('scroll', throttledUpdatePosition, true)
    window.removeEventListener('resize', throttledUpdatePosition)
  }
})

// 暴露给父组件/指令的方法
defineExpose({
  show: () => {
    if (props.disabled || !hasContent.value) return
    isOpen.value = true
    emit('update:visible', true)
  },
  hide: () => {
    isOpen.value = false
    emit('update:visible', false)
  },
  toggle,
  // 指令模式：允许动态设置触发器元素
  setTriggerElement: (el: HTMLElement) => {
    triggerRef.value = el
  },
})

// ==================== 生命周期 ====================
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', throttledUpdatePosition, true)
  window.removeEventListener('resize', throttledUpdatePosition)
  throttledUpdatePosition.cancel?.()
  clearTimers()
})
</script>

<template>
  <div
    class="tooltip-wrapper"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
    @focus="handleFocus"
    @blur="handleBlur"
  >
    <!-- 触发器（使用默认插槽） -->
    <div
      ref="triggerRef"
      class="tooltip-trigger"
      :aria-describedby="isOpen ? tooltipId : undefined"
    >
      <slot />
    </div>

    <!-- Tooltip 内容 -->
    <Teleport to="body">
      <transition name="tooltip-fade">
        <div
          v-if="isOpen && hasContent"
          :id="tooltipId"
          ref="tooltipRef"
          role="tooltip"
          class="tooltip-content"
          :class="[`placement-${actualPlacement}`]"
          :style="computedTooltipStyle"
          @mouseenter="handleTooltipEnter"
          @mouseleave="handleTooltipLeave"
        >
          <!-- 小三角：使用基础方向类名 -->
          <div
            v-if="showArrow"
            class="tooltip-arrow"
            :class="[`arrow-${baseDirection}`]"
            :style="arrowStyle"
          />

          <!-- 内容：优先使用 slot，否则使用 content prop -->
          <slot name="content">
            {{ content }}
          </slot>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.tooltip-wrapper {
  display: inline-block;
}

.tooltip-trigger {
  display: inline-block;
}

/* ==================== Tooltip 容器 ==================== */
.tooltip-content {
  padding: 8px 12px;
  font-size: var(--text-xs, 12px);
  line-height: 1.5;
  color: var(--text-primary, #fff);
  background: var(--bg-panel-dark, rgba(30, 34, 44, 0.95));
  backdrop-filter: var(--glass-md);
  -webkit-backdrop-filter: var(--glass-md);
  border: var(--border-glass, 1px solid rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.2));
  pointer-events: auto;
  word-wrap: break-word;
  overflow-wrap: break-word;
  z-index: 9999;
}

/* ==================== 小三角样式 ==================== */
.tooltip-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  pointer-events: none;
  transform: translateX(-50%);
}

.tooltip-arrow::before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--bg-panel-dark, rgba(30, 34, 44, 0.95));
  border: var(--border-glass, 1px solid rgba(255, 255, 255, 0.08));
  transform: rotate(45deg);
  box-sizing: border-box;
  border-radius: 2px;
}

/* 顶部 Tooltip：箭头在下方 */
.arrow-top {
  bottom: -4px;
  left: 50%;
}

.arrow-top::before {
  border-top-color: transparent !important;
  border-left-color: transparent !important;
}

/* 底部 Tooltip：箭头在上方 */
.arrow-bottom {
  top: -4px;
  left: 50%;
}

.arrow-bottom::before {
  border-bottom-color: transparent !important;
  border-right-color: transparent !important;
}

/* 左侧 Tooltip：箭头在右侧，指向左边的按钮 */
.arrow-left {
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
}

.arrow-left::before {
  /* 旋转 135deg 使箭头指向右边 */
  transform: rotate(135deg);
  border-bottom-color: transparent !important;
  border-right-color: transparent !important;
}

/* 右侧 Tooltip：箭头在左侧，指向右边的按钮 */
.arrow-right {
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
}

.arrow-right::before {
  /* 旋转 -45deg 使箭头指向左边 */
  transform: rotate(135deg);
  border-top-color: transparent !important;
  border-left-color: transparent !important;
}

/* ==================== 过渡动画 ==================== */
.tooltip-fade-enter-active {
  /* 弹性进入：稍微过冲再回弹 */
  transition:
    opacity 0.2s ease,
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tooltip-fade-leave-active {
  transition:
    opacity 0.1s ease,
    transform 0.1s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}

/* 根据方向设置动画起点/终点 */
.placement-top.tooltip-fade-enter-from,
.placement-top-start.tooltip-fade-enter-from,
.placement-top-end.tooltip-fade-enter-from,
.placement-top.tooltip-fade-leave-to,
.placement-top-start.tooltip-fade-leave-to,
.placement-top-end.tooltip-fade-leave-to {
  transform: translateY(6px);
}

.placement-bottom.tooltip-fade-enter-from,
.placement-bottom-start.tooltip-fade-enter-from,
.placement-bottom-end.tooltip-fade-enter-from,
.placement-bottom.tooltip-fade-leave-to,
.placement-bottom-start.tooltip-fade-leave-to,
.placement-bottom-end.tooltip-fade-leave-to {
  transform: translateY(-6px);
}

.placement-left.tooltip-fade-enter-from,
.placement-left-start.tooltip-fade-enter-from,
.placement-left-end.tooltip-fade-enter-from,
.placement-left.tooltip-fade-leave-to,
.placement-left-start.tooltip-fade-leave-to,
.placement-left-end.tooltip-fade-leave-to {
  transform: translateX(6px);
}

.placement-right.tooltip-fade-enter-from,
.placement-right-start.tooltip-fade-enter-from,
.placement-right-end.tooltip-fade-enter-from,
.placement-right.tooltip-fade-leave-to,
.placement-right-start.tooltip-fade-leave-to,
.placement-right-end.tooltip-fade-leave-to {
  transform: translateX(-6px);
}
</style>
