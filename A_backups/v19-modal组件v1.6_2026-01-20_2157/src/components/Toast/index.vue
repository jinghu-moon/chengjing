<script setup lang="ts">
import { computed, ref, watch, nextTick, type CSSProperties } from 'vue'
import { useToast } from './composables/useToast'
import ToastItem from './ToastItem.vue'

const { toasts, remove, position } = useToast()
const isHovering = ref(false)

// --- 视觉配置 ---
const TOAST_OFFSET = 14 // 堆叠时，每张卡片露出的垂直距离 (px)
const TOAST_SCALE = 0.05 // 每层卡片缩小的比例 (1, 0.95, 0.9...)
const VISIBLE_COUNT = 3 // 视觉上最多显示几层 (超过的隐藏)
const HOVER_GAP = 10 // Hover 时 Toast 之间的间距 (px)

// --- 动态高度计算 ---
const toastHeight = ref(80) // 默认高度 80px
const toastRefs = ref<HTMLElement[]>([])

// 只在第一个 Toast 出现时计算一次高度
watch(
  () => toasts.value.length,
  async (newLen, oldLen) => {
    if (newLen > 0 && oldLen === 0) {
      await nextTick()
      if (toastRefs.value[0]) {
        toastHeight.value = toastRefs.value[0].offsetHeight
      }
    }
    // 清理过期的 refs
    if (newLen === 0) {
      toastRefs.value = []
    }
  }
)

// --- 数据处理 ---
// 我们希望最新的 Toast (数组末尾) 显示在最前面 (Index 0)
// 这样计算 z-index 和 transform 时逻辑最自然
const sortedToasts = computed(() => {
  return [...toasts.value].reverse()
})

// --- 样式计算核心 ---
const getToastStyle = (index: number): CSSProperties => {
  const isBottom = position.value.includes('bottom')
  const isHidden = !isHovering.value && index >= VISIBLE_COUNT

  // 1. 缩放计算: Hover 时恢复正常大小，否则越往后越小
  const scale = isHovering.value ? 1 : 1 - index * TOAST_SCALE

  // 2. 垂直偏移计算
  const baseOffset = index * TOAST_OFFSET
  // Hover 展开：Toast 之间间距为 HOVER_GAP
  const hoverOffset = index * (toastHeight.value + HOVER_GAP)
  let y = isHovering.value ? hoverOffset : baseOffset

  // 如果是底部布局，偏移方向取反 (向上移动)
  if (isBottom) {
    y = -y
  }

  const pointerEvents: 'none' | 'auto' = isHidden ? 'none' : 'auto'

  return {
    zIndex: 100 - index,
    opacity: isHidden ? 0 : 1,
    pointerEvents,
    transform: `translateY(${y}px) scale(${scale})`,
    transformOrigin: isBottom ? 'center bottom' : 'center top',
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      class="toast-provider"
      :class="position"
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false"
    >
      <TransitionGroup name="toast-stack" tag="div" class="toast-list-wrapper">
        <div
          v-for="(toast, index) in sortedToasts"
          :key="toast.id"
          :ref="
            el => {
              if (el) toastRefs[index] = el as HTMLElement
            }
          "
          class="toast-wrapper"
          :style="getToastStyle(index)"
        >
          <ToastItem :toast="toast" @close="remove(toast.id)" />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-provider {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  /* 关键：让鼠标穿透容器空白区 */

  /* 给一个足够宽高的交互感应区域，方便 Hover 展开 */
  width: 400px;
  height: auto;
  min-height: 200px;

  display: flex;
  flex-direction: column;
  padding: 24px;
  /* 距离屏幕边缘的间距 */
}

/* --- 容器定位 --- */
.top-left {
  top: 0;
  left: 0;
  align-items: flex-start;
}

.top-center {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
}

.top-right {
  top: 0;
  right: 0;
  align-items: flex-end;
}

.bottom-left {
  bottom: 0;
  left: 0;
  align-items: flex-start;
  justify-content: flex-end;
}

.bottom-center {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  align-items: center;
  justify-content: flex-end;
}

.bottom-right {
  bottom: 0;
  right: 0;
  align-items: flex-end;
  justify-content: flex-end;
}

.left-center {
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  align-items: flex-start;
}

.right-center {
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  align-items: flex-end;
}

/* 列表容器 */
.toast-list-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 单个 Toast 的包装层 (绝对定位核心)
  所有的 Toast 实际上都重叠在同一个位置(top:0 或 bottom:0)，
  通过 inline-style 的 translateY 拉开距离
*/
.toast-wrapper {
  position: absolute;
  /* 动画过渡：所有属性变化都平滑过渡 */
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
}

/* --- 锚点控制 --- */
/* 顶部布局：锚点在顶部 */
.top-left .toast-wrapper,
.top-right .toast-wrapper {
  top: 0;
}

/* 底部布局：锚点在底部 */
.bottom-left .toast-wrapper,
.bottom-right .toast-wrapper {
  bottom: 0;
}

/* 左右对齐：通过 align-items 控制了，这里只需确保不撑满 */
.top-left .toast-wrapper,
.bottom-left .toast-wrapper {
  left: 0;
}

.top-right .toast-wrapper,
.bottom-right .toast-wrapper {
  right: 0;
}

/* --- 进出动画 (Sonner 风格) --- */

/* 进入前状态 */
.toast-stack-enter-from {
  opacity: 0 !important;
  /* 默认从下方浮出 */
  transform: translateY(100%) scale(0.9) !important;
}

/* 顶部布局特殊处理：从上方掉下 */
.top-left .toast-stack-enter-from,
.top-right .toast-stack-enter-from {
  transform: translateY(-100%) scale(0.9) !important;
}

/* 离开后状态 */
.toast-stack-leave-to {
  opacity: 0 !important;
  pointer-events: none;
  /* 消失时稍微缩小 */
  transform: scale(0.85) !important;
}

/* 离开动画激活态 */
.toast-stack-leave-active {
  transition: all 0.2s ease-out;
  /* 离开时必须绝对定位 (本来就是)，且层级沉底 */
  position: absolute;
  z-index: -1;
}
</style>
