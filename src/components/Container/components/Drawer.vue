<template>
  <Teleport :to="teleportTo" :disabled="teleportDisabled">
    <Transition name="cj-drawer-overlay">
      <div
        v-if="overlay && open"
        class="cj-drawer-overlay"
        :style="{ zIndex }"
        @click="handleOverlayClick"
      />
    </Transition>

    <Transition :name="transitionName">
      <div
        v-if="open"
        class="cj-drawer"
        :class="drawerClasses"
        :style="drawerStyle"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div class="cj-drawer__header">
          <div class="cj-drawer__title-area">
            <component :is="icon" v-if="icon" class="cj-drawer__icon" />
            <span v-if="title" class="cj-drawer__title">{{ title }}</span>
          </div>
          <div class="cj-drawer__header-actions">
            <slot name="header-actions" />
            <button class="cj-drawer__close" @click="close" aria-label="关闭">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="cj-drawer__body" :class="bodyClass" :style="bodyStyle">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, type Component } from 'vue'
import type { DrawerPlacement } from '../shared/types'

const props = withDefaults(defineProps<{
  open: boolean
  title?: string
  icon?: Component
  /** 面板宽度（left/right 方向） */
  width?: string | number
  /** 面板高度（top/bottom 方向） */
  height?: string | number
  placement?: DrawerPlacement
  overlay?: boolean
  overlayClosable?: boolean
  teleport?: string | boolean
  zIndex?: number
  bordered?: boolean
  /** 按 ESC 键关闭，默认 true */
  escClosable?: boolean
  /** 锁定页面滚动，默认 true */
  lockScroll?: boolean
  /** body 区域自定义 class */
  bodyClass?: string | string[] | Record<string, boolean>
  /** body 区域自定义 style */
  bodyStyle?: string | Record<string, string>
  /** 关闭前回调，返回 false 阻止关闭 */
  onBeforeClose?: () => boolean | void
}>(), {
  title: undefined,
  icon: undefined,
  width: '400px',
  height: '400px',
  placement: 'right',
  overlay: true,
  overlayClosable: true,
  teleport: 'body',
  zIndex: 100,
  bordered: true,
  escClosable: true,
  lockScroll: true,
  bodyClass: undefined,
  bodyStyle: undefined,
  onBeforeClose: undefined,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const close = () => {
  if (props.onBeforeClose && props.onBeforeClose() === false) return
  emit('update:open', false)
}

const handleOverlayClick = () => {
  if (props.overlayClosable) close()
}

// ESC 键关闭
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.escClosable) close()
}

watch(() => props.open, (val) => {
  if (val) {
    document.addEventListener('keydown', onKeydown)
    if (props.lockScroll) document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', onKeydown)
    if (props.lockScroll) document.body.style.overflow = ''
  }
}, { immediate: true })

// Teleport 目标：拆分为 to + disabled，避免返回 false 导致 TS 类型不兼容
const teleportTo = computed(() => {
  if (typeof props.teleport === 'string') return props.teleport
  return 'body'
})

const teleportDisabled = computed(() => props.teleport === false)

// 过渡名称
const transitionName = computed(() =>
  `cj-drawer-slide-${props.placement}`
)

// 是否为水平方向（left/right）
const isHorizontal = computed(() =>
  props.placement === 'left' || props.placement === 'right'
)

// 尺寸标准化
const normalize = (v: string | number) => typeof v === 'number' ? `${v}px` : v

// 面板样式：水平方向设 width，垂直方向设 height
const drawerStyle = computed(() => ({
  ...(isHorizontal.value
    ? { width: normalize(props.width!) }
    : { height: normalize(props.height!) }),
  zIndex: props.zIndex + 1,
}))

// 面板类名
const drawerClasses = computed(() => [
  `cj-drawer--${props.placement}`,
  { 'cj-drawer--bordered': props.bordered },
])
</script>

<style scoped>
/* =========================================
   Overlay 遮罩
   ========================================= */
.cj-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: var(--glass-xs);
}

.cj-drawer-overlay-enter-active,
.cj-drawer-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.cj-drawer-overlay-enter-from,
.cj-drawer-overlay-leave-to {
  opacity: 0;
}

/* =========================================
   Drawer 面板
   ========================================= */
.cj-drawer {
  position: fixed;
  display: flex;
  flex-direction: column;
  background: var(--bg-panel);
  backdrop-filter: var(--glass-md);
  -webkit-backdrop-filter: var(--glass-md);
  border: var(--border-glass);
  box-shadow: var(--shadow-lg);
  color: var(--text-primary);
}

/* --- 水平方向 (left / right)：纵向撑满 --- */
.cj-drawer--left,
.cj-drawer--right {
  top: 0;
  bottom: 0;
  max-width: 100vw;
}

.cj-drawer--right { right: 0; }
.cj-drawer--left  { left: 0; }

/* --- 垂直方向 (top / bottom)：横向撑满 --- */
.cj-drawer--top,
.cj-drawer--bottom {
  left: 0;
  right: 0;
  max-height: 100vh;
}

.cj-drawer--top    { top: 0; }
.cj-drawer--bottom { bottom: 0; }

/* --- bordered 模式：圆角 + 间距 --- */
.cj-drawer--bordered {
  border-radius: var(--radius-xl);
}

.cj-drawer--bordered.cj-drawer--right {
  top: var(--space-4);
  bottom: var(--space-4);
  right: var(--space-4);
}

.cj-drawer--bordered.cj-drawer--left {
  top: var(--space-4);
  bottom: var(--space-4);
  left: var(--space-4);
}

.cj-drawer--bordered.cj-drawer--top {
  top: var(--space-4);
  left: var(--space-4);
  right: var(--space-4);
}

.cj-drawer--bordered.cj-drawer--bottom {
  bottom: var(--space-4);
  left: var(--space-4);
  right: var(--space-4);
}

/* 非 bordered：贴边无圆角 */
.cj-drawer:not(.cj-drawer--bordered) {
  border-radius: 0;
}

/* =========================================
   Header
   ========================================= */
.cj-drawer__header {
  padding: var(--space-6) var(--space-6) var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.cj-drawer__title-area {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.cj-drawer__icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.cj-drawer__title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--text-primary);
}

.cj-drawer__header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.cj-drawer__close {
  width: var(--height-sm);
  height: var(--height-sm);
  border-radius: var(--radius-full);
  background: var(--bg-input);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  border: none;
}

.cj-drawer__close:hover {
  background: var(--bg-active);
  transform: rotate(90deg);
}

/* =========================================
   Body
   ========================================= */
.cj-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--space-4) var(--space-6);
}

.cj-drawer__body::-webkit-scrollbar {
  width: 4px;
}

.cj-drawer__body::-webkit-scrollbar-thumb {
  background: var(--mask-light);
  border-radius: var(--radius-xs);
}

/* =========================================
   Slide 动画 - Right
   ========================================= */
.cj-drawer-slide-right-enter-active,
.cj-drawer-slide-right-leave-active {
  transition: transform 0.4s var(--ease-smooth);
}

.cj-drawer-slide-right-enter-from,
.cj-drawer-slide-right-leave-to {
  transform: translateX(120%);
}

/* =========================================
   Slide 动画 - Left
   ========================================= */
.cj-drawer-slide-left-enter-active,
.cj-drawer-slide-left-leave-active {
  transition: transform 0.4s var(--ease-smooth);
}

.cj-drawer-slide-left-enter-from,
.cj-drawer-slide-left-leave-to {
  transform: translateX(-120%);
}

/* =========================================
   Slide 动画 - Top
   ========================================= */
.cj-drawer-slide-top-enter-active,
.cj-drawer-slide-top-leave-active {
  transition: transform 0.4s var(--ease-smooth);
}

.cj-drawer-slide-top-enter-from,
.cj-drawer-slide-top-leave-to {
  transform: translateY(-120%);
}

/* =========================================
   Slide 动画 - Bottom
   ========================================= */
.cj-drawer-slide-bottom-enter-active,
.cj-drawer-slide-bottom-leave-active {
  transition: transform 0.4s var(--ease-smooth);
}

.cj-drawer-slide-bottom-enter-from,
.cj-drawer-slide-bottom-leave-to {
  transform: translateY(120%);
}

/* =========================================
   prefers-reduced-motion
   ========================================= */
@media (prefers-reduced-motion: reduce) {
  .cj-drawer,
  .cj-drawer-overlay {
    transition-duration: 0.01ms !important;
  }
}
</style>
