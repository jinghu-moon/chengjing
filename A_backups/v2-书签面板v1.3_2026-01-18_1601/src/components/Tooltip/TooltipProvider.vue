<script setup lang="ts">
import { watch, ref, computed, nextTick, onUnmounted } from 'vue'
import { useTooltipSingleton } from './composables/useTooltipSingleton'
import { useTooltipPosition } from './composables/useTooltipPosition'

// 获取单例状态
const { isOpen, triggerElement, config } = useTooltipSingleton()

// 本地 refs
const tooltipRef = ref<HTMLElement | null>(null)

// Tooltip ID (A11y)
const tooltipId = 'tooltip-singleton'

// 使用定位 composable
const {
  actualPlacement,
  tooltipStyle,
  arrowStyle,
  updatePosition,
  throttledUpdatePosition,
  getBaseDirection,
} = useTooltipPosition({
  isOpen,
  triggerRef: triggerElement,
  tooltipRef,
  placement: computed(() => config.value.placement ?? 'auto'),
  offset: computed(() => 8),
})

// 基础方向（用于箭头样式）
const baseDirection = computed(() => getBaseDirection(actualPlacement.value))

// 合并样式
const computedTooltipStyle = computed(() => {
  const mw =
    typeof config.value.maxWidth === 'number'
      ? `${config.value.maxWidth}px`
      : (config.value.maxWidth ?? '280px')
  return {
    ...tooltipStyle.value,
    maxWidth: mw,
  }
})

// 监听显示状态，更新位置
watch(isOpen, async open => {
  if (open) {
    await nextTick()
    updatePosition()
  }
})

// 监听触发器元素变化，更新位置
watch(triggerElement, async () => {
  if (isOpen.value) {
    await nextTick()
    updatePosition()
  }
})

// 滚动和 resize 监听
watch(isOpen, open => {
  if (open) {
    window.addEventListener('scroll', throttledUpdatePosition, true)
    window.addEventListener('resize', throttledUpdatePosition)
  } else {
    window.removeEventListener('scroll', throttledUpdatePosition, true)
    window.removeEventListener('resize', throttledUpdatePosition)
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', throttledUpdatePosition, true)
  window.removeEventListener('resize', throttledUpdatePosition)
})
</script>

<template>
  <!-- 全局单例 Tooltip Provider -->
  <Teleport to="body">
    <transition name="tooltip-fade">
      <div
        v-if="isOpen && config.content"
        :id="tooltipId"
        ref="tooltipRef"
        role="tooltip"
        class="tooltip-content"
        :class="[`placement-${actualPlacement}`]"
        :style="computedTooltipStyle"
      >
        <!-- 小三角 -->
        <div
          v-if="config.showArrow"
          class="tooltip-arrow"
          :class="[`arrow-${baseDirection}`]"
          :style="arrowStyle"
        />

        <!-- 内容 -->
        <span v-html="config.content"></span>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
/* ==================== Tooltip 容器 ==================== */
.tooltip-content {
  padding: 8px 12px;
  font-size: var(--text-xs, 12px);
  line-height: 1.5;
  color: var(--text-primary, #fff);
  background: var(--bg-panel-dark, rgba(30, 34, 44, 0.95));
  backdrop-filter: blur(var(--blur-md, 12px));
  -webkit-backdrop-filter: blur(var(--blur-md, 12px));
  border: var(--border-glass, 1px solid rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.2));
  pointer-events: none;
  word-wrap: break-word;
  overflow-wrap: break-word;
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

/* 左侧 Tooltip：箭头在右侧 */
.arrow-left {
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
}

.arrow-left::before {
  transform: rotate(135deg);
  border-bottom-color: transparent !important;
  border-right-color: transparent !important;
}

/* 右侧 Tooltip：箭头在左侧 */
.arrow-right {
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
}

.arrow-right::before {
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
