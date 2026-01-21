<template>
  <component
    :is="tagName"
    ref="buttonRef"
    :type="isButton ? props.type : undefined"
    :form="props.form"
    :href="props.href"
    :autofocus="isButton ? props.autofocus : undefined"
    :class="classes"
    :disabled="isDisabled"
    @click="handleClick"
  >
    <!-- Loading Spinner -->
    <span v-if="loading" class="btn-loading">
      <svg class="spinner" viewBox="0 0 1024 1024" width="1em" height="1em">
        <path
          fill="currentColor"
          d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 0 0-94.3-139.9 437.71 437.71 0 0 0-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"
        ></path>
      </svg>
    </span>

    <!-- Icon Slide 专用包裹层 -->
    <span v-if="props.effect === 'icon-slide'" class="btn-inner">
      <span v-if="props.icon && !loading && props.iconPlacement === 'left'" class="btn-icon">
        <component :is="props.icon" :size="iconSize" />
      </span>
      <span v-if="$slots.default || props.content" class="btn-content">
        <slot>{{ props.content }}</slot>
      </span>
      <span v-if="props.icon && !loading && props.iconPlacement === 'right'" class="btn-icon">
        <component :is="props.icon" :size="iconSize" />
      </span>
      <span v-if="props.suffix" class="btn-suffix">
        <component :is="props.suffix" :size="iconSize" />
      </span>
    </span>

    <!-- 其他效果使用原有结构 -->
    <template v-else>
      <span v-if="props.icon && !loading && props.iconPlacement === 'left'" class="btn-icon">
        <component :is="props.icon" :size="iconSize" />
      </span>
      <span v-if="$slots.default || props.content" class="btn-content">
        <slot>{{ props.content }}</slot>
      </span>
      <span v-if="props.icon && !loading && props.iconPlacement === 'right'" class="btn-icon">
        <component :is="props.icon" :size="iconSize" />
      </span>
      <span v-if="props.suffix" class="btn-suffix">
        <component :is="props.suffix" :size="iconSize" />
      </span>
    </template>
  </component>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, onBeforeUnmount } from 'vue'
import type {
  ButtonProps,
  ButtonEmits,
  ButtonTheme,
  ButtonVariant,
  ButtonSize,
  ButtonShape,
} from './types'
import type { ComputedRef } from 'vue'
import { buttonConfig } from './config'

const props = withDefaults(defineProps<ButtonProps>(), {
  block: false,
  disabled: false,
  ghost: false,
  effect: buttonConfig.defaultEffect,
  iconPlacement: 'left',
  loading: false,
  tag: 'button',
  type: 'button',
})

const emit = defineEmits<ButtonEmits>()

const buttonRef = ref<HTMLElement | null>(null)

const buttonGroup = inject<{
  theme: ComputedRef<ButtonTheme>
  variant: ComputedRef<ButtonVariant>
  size: ComputedRef<ButtonSize>
  shape: ComputedRef<ButtonShape>
} | null>('buttonGroup', null)

const mergedTheme = computed(() => props.theme ?? buttonGroup?.theme.value ?? 'default')
const mergedVariant = computed(() => props.variant ?? buttonGroup?.variant.value ?? 'base')
const mergedSize = computed(() => props.size ?? buttonGroup?.size.value ?? 'medium')
const mergedShape = computed(() => props.shape ?? buttonGroup?.shape.value ?? 'rectangle')

const isButton = computed(() => props.tag === 'button' && !props.href)
const tagName = computed(() => {
  if (props.href) return 'a'
  return props.tag
})

const isDisabled = computed(() => props.disabled || props.loading)

const classes = computed(() => [
  'lime-btn',
  `lime-btn--theme-${mergedTheme.value}`,
  `lime-btn--variant-${mergedVariant.value}`,
  `lime-btn--size-${mergedSize.value}`,
  `lime-btn--shape-${mergedShape.value}`,
  {
    'lime-btn--block': props.block,
    'lime-btn--disabled': isDisabled.value,
    'lime-btn--loading': props.loading,
    'lime-btn--ghost': props.ghost,
    [`lime-btn--effect-${props.effect}`]: props.effect,
  },
])

const iconSize = computed(() => {
  const sizeMap = { small: '1em', medium: '1.2em', large: '1.4em' }
  return sizeMap[mergedSize.value]
})

const handleClick = (e: MouseEvent) => {
  if (isDisabled.value) {
    e.preventDefault()
    e.stopPropagation()
    return
  }

  const btn = e.currentTarget as HTMLElement

  // 1. Ripple Effect
  if (props.effect === 'ripple') {
    const circle = document.createElement('span')
    const diameter = Math.max(btn.clientWidth, btn.clientHeight)
    const radius = diameter / 2
    const rect = btn.getBoundingClientRect()
    circle.style.width = circle.style.height = `${diameter}px`
    circle.style.left = `${e.clientX - rect.left - radius}px`
    circle.style.top = `${e.clientY - rect.top - radius}px`
    circle.classList.add('t-ripple-wave')
    btn.appendChild(circle)
    setTimeout(() => circle.remove(), 600)
  }

  // 2. Sweep Effect
  if (props.effect === 'sweep') {
    btn.classList.remove('is-sweeping')
    void btn.offsetWidth
    btn.classList.add('is-sweeping')
    setTimeout(() => btn.classList.remove('is-sweeping'), 400)
  }

  emit('click', e)
}

// Icon Slide 动态布局逻辑
const initIconSlideLayout = () => {
  if (props.effect !== 'icon-slide' || !buttonRef.value) return

  const btn = buttonRef.value
  const inner = btn.querySelector('.btn-inner') as HTMLElement
  const suffix = btn.querySelector('.btn-suffix') as HTMLElement

  if (!inner || !suffix) return

  // 重置宽度，让浏览器自然撑开以获取测量值
  btn.style.width = 'auto'
  btn.style.minWidth = '0'

  // 测量参数
  const style = window.getComputedStyle(btn)
  const gapCSS = parseFloat(style.getPropertyValue('--gap'))
  const gap = isNaN(gapCSS) ? 6 : gapCSS
  const suffixWidth = suffix.getBoundingClientRect().width
  const fullWidth = btn.getBoundingClientRect().width

  // 计算偏移量: (图标宽 + 间距) / 2
  const offset = (suffixWidth + gap) / 2

  // 锁定宽度 & 设置 CSS 变量
  btn.style.width = `${fullWidth + 1}px`
  btn.style.setProperty('--slide-offset', `${offset}px`)
  btn.style.setProperty('--gap', `${gap}px`)
}

onMounted(() => {
  if (props.effect === 'icon-slide' && buttonRef.value) {
    initIconSlideLayout()
    window.addEventListener('resize', initIconSlideLayout)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', initIconSlideLayout)
})

</script>

<style scoped>
@import './theme.css';

.lime-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  transition: background-color 0.3s cubic-bezier(0.645, 0.045, 0.355, 1),
              border-color 0.3s cubic-bezier(0.645, 0.045, 0.355, 1),
              color 0.3s cubic-bezier(0.645, 0.045, 0.355, 1),
              box-shadow 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  outline: none;
  text-decoration: none;
  background-image: none;
  border: 1px solid transparent;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  gap: 6px;
  /* overflow: hidden;  <-- REMOVED to allow Pulse effect to extend outside */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  /* Define Animation Curves locally */
  --ease-out: cubic-bezier(0.38, 0, 0.24, 1);
  --ease-elastic: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.lime-btn--variant-text,
.lime-btn--disabled {
  box-shadow: none;
}

.lime-btn > * {
  position: relative;
  z-index: 1;
}

/* === Sizes === */
.lime-btn--size-small {
  height: 24px;
  padding: 0 10px;
  font-size: 12px;
  border-radius: 3px;
}

.lime-btn--size-medium {
  height: 32px;
  padding: 0 15px;
  font-size: 14px;
  border-radius: 4px;
}

.lime-btn--size-large {
  height: 40px;
  padding: 0 20px;
  font-size: 16px;
  border-radius: 6px;
}

/* === Shapes === */
.lime-btn--shape-square {
  padding: 0;
  width: 32px;
  /* fallback for medium */
}

.lime-btn--size-small.lime-btn--shape-square {
  width: 24px;
}

.lime-btn--size-large.lime-btn--shape-square {
  width: 40px;
}

.lime-btn--shape-circle {
  border-radius: 50%;
  padding: 0;
  width: 32px;
}

.lime-btn--size-small.lime-btn--shape-circle {
  width: 24px;
}

.lime-btn--size-large.lime-btn--shape-circle {
  width: 40px;
}

.lime-btn--shape-round {
  border-radius: 9999px;
}

/* === Block === */
.lime-btn--block {
  display: flex;
  width: 100%;
}

/* === Themes & Variants === */

/* Default Theme Variants */
.lime-btn--theme-default.lime-btn--variant-base {
  background-color: var(--btn-bg);
  border-color: var(--btn-border);
  color: var(--btn-color);
}

.lime-btn--theme-default.lime-btn--variant-base:hover:not(.lime-btn--disabled) {
  background-color: var(--btn-bg-hover);
  border-color: var(--btn-border-hover);
}

.lime-btn--theme-default.lime-btn--variant-base:active:not(.lime-btn--disabled):not(
    .lime-btn--loading
  ) {
  background-color: var(--btn-bg-active);
}

.lime-btn--theme-default.lime-btn--variant-outline {
  background-color: transparent;
  border-color: var(--btn-border);
  color: var(--btn-color);
}

.lime-btn--theme-default.lime-btn--variant-dashed {
  background-color: transparent;
  border-color: var(--btn-border);
  border-style: dashed;
  color: var(--btn-color);
}

.lime-btn--theme-default.lime-btn--variant-text {
  background-color: transparent;
  border-color: transparent;
  color: var(--btn-color);
}

.lime-btn--theme-default.lime-btn--variant-text:hover:not(.lime-btn--disabled) {
  background-color: var(--bg-hover);
}

/* Other Themes - Base Variant */
.lime-btn:not(.lime-btn--theme-default).lime-btn--variant-base {
  background-color: var(--btn-bg);
  border-color: var(--btn-border);
  color: var(--btn-color);
}

.lime-btn:not(.lime-btn--theme-default).lime-btn--variant-base:hover:not(.lime-btn--disabled) {
  background-color: var(--btn-bg-hover);
  border-color: var(--btn-border-hover);
}

.lime-btn:not(.lime-btn--theme-default).lime-btn--variant-base:active:not(.lime-btn--disabled):not(
    .lime-btn--loading
  ) {
  background-color: var(--btn-bg-active);
}

/* Other Themes - Outline/Dashed Variant */
.lime-btn:not(.lime-btn--theme-default).lime-btn--variant-outline,
.lime-btn:not(.lime-btn--theme-default).lime-btn--variant-dashed {
  background-color: transparent;
  border-color: var(--btn-border);
  color: var(--btn-bg);
}

.lime-btn:not(.lime-btn--theme-default).lime-btn--variant-dashed {
  border-style: dashed;
}

.lime-btn:not(.lime-btn--theme-default).lime-btn--variant-outline:hover:not(.lime-btn--disabled),
.lime-btn:not(.lime-btn--theme-default).lime-btn--variant-dashed:hover:not(.lime-btn--disabled) {
  background-color: var(--btn-bg);
  border-color: var(--btn-border);
  color: var(--btn-color);
}

.lime-btn:not(.lime-btn--theme-default).lime-btn--variant-outline:active:not(
    .lime-btn--disabled
  ):not(.lime-btn--loading),
.lime-btn:not(.lime-btn--theme-default).lime-btn--variant-dashed:active:not(
    .lime-btn--disabled
  ):not(.lime-btn--loading) {
  background-color: var(--btn-bg-active);
}

/* Other Themes - Text Variant */
.lime-btn:not(.lime-btn--theme-default).lime-btn--variant-text {
  background-color: transparent;
  border-color: transparent;
  color: var(--btn-bg);
}

.lime-btn:not(.lime-btn--theme-default).lime-btn--variant-text:hover:not(.lime-btn--disabled) {
  background-color: var(--bg-hover);
  color: var(--btn-bg-hover);
}

/* Default Theme - Text Variant */
.lime-btn--theme-default.lime-btn--variant-text:hover:not(.lime-btn--disabled) {
  background-color: var(--bg-hover);
  color: var(--btn-color);
}

/* === Ghost === */
.lime-btn--ghost.lime-btn--variant-base,
.lime-btn--ghost.lime-btn--variant-outline,
.lime-btn--ghost.lime-btn--variant-dashed {
  background-color: transparent;
}

.lime-btn--ghost.lime-btn--variant-base:hover:not(.lime-btn--disabled),
.lime-btn--ghost.lime-btn--variant-outline:hover:not(.lime-btn--disabled),
.lime-btn--ghost.lime-btn--variant-dashed:hover:not(.lime-btn--disabled) {
  background-color: rgba(255, 255, 255, 0.1);
}

/* === Focus & Active States === */
.lime-btn:focus-visible {
  outline: 2px solid var(--btn-focus-color);
  outline-offset: 2px;
}

/* === Disabled & Loading === */
.lime-btn--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.lime-btn--loading {
  position: relative;
  cursor: default;
  pointer-events: none;
}

.lime-btn--loading:before {
  display: block;
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  bottom: -1px;
  left: -1px;
  z-index: 1;
  background-color: rgba(255, 255, 255, 0.35);
  border-radius: inherit;
  transition: opacity 0.2s;
  pointer-events: none;
}

/* Loading Spinner Animation */
.spinner {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.btn-icon,
.btn-content,
.btn-loading,
.btn-suffix {
  display: inline-flex;
  align-items: center;
}

/* =========================================
   按钮交互效果 (完全复刻 button-style.html)
   ========================================= */

/* 动画曲线定义 */
.lime-btn {
  --td-ease-out: cubic-bezier(0.38, 0, 0.24, 1);
  --td-ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);
  --td-ease-elastic: cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 文字层级 */
.btn-content,
.btn-icon,
.btn-suffix {
  position: relative;
  z-index: 2;
  pointer-events: none;
}

/* =========================================
   HOVER 效果
   ========================================= */

/* Icon Slide (图标滑入) */
.lime-btn--effect-icon-slide {
  --slide-offset: 0px;
  --gap: 6px;
  /* 允许修改宽度 */
  transition: width 0s,
              background-color 0.3s cubic-bezier(0.645, 0.045, 0.355, 1),
              border-color 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.lime-btn--effect-icon-slide .btn-inner {
  display: flex;
  align-items: center;
  gap: var(--gap);
  /* 核心逻辑：初始向右偏移，抵消图标占位，让文本居中 */
  transform: translateX(var(--slide-offset));
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  will-change: transform;
}

/* Hover 状态：偏移归零，整体左移 */
.lime-btn--effect-icon-slide:hover:not(.lime-btn--disabled):not(.lime-btn--loading) .btn-inner {
  transform: translateX(0);
}

.lime-btn--effect-icon-slide .btn-suffix {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: auto; /* 重置可能的高度限制 */
  
  /* 初始状态：透明、缩小、略微左移 */
  opacity: 0;
  transform: translateX(-10px) scale(0.8);
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* Hover 状态：图标显现 */
.lime-btn--effect-icon-slide:hover:not(.lime-btn--disabled):not(.lime-btn--loading) .btn-suffix {
  opacity: 1;
  transform: translateX(0) scale(1);
}

/* 确保内部内容不被默认的 relative 覆盖 */
.lime-btn--effect-icon-slide .btn-content {
  transition: none; /* 交给 btn-inner 统一移动 */
}

/* =========================================
   ACTIVE 效果
   ========================================= */

/* Active: Scale (拟物按压) */
.lime-btn--effect-scale {
  transition: transform 0.1s var(--td-ease-out),
              background-color 0.3s cubic-bezier(0.645, 0.045, 0.355, 1),
              border-color 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.lime-btn--effect-scale:active:not(.lime-btn--disabled):not(.lime-btn--loading) {
  transform: scale(0.95);
}

/* =========================================
   CLICK 效果
   ========================================= */

/* Ripple (水波纹) */
.lime-btn--effect-ripple {
  overflow: hidden;
}

:deep(.t-ripple-wave) {
  position: absolute;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.35);
  transform: scale(0);
  animation: ripple-anim 0.6s var(--td-ease-out);
  pointer-events: none;
  overflow: hidden;
}

@keyframes ripple-anim {
  to {
    transform: scale(2.5);
    opacity: 0;
  }
}

/* Sweep (斜向填充) */
.lime-btn--effect-sweep {
  overflow: hidden;
}

.lime-btn--effect-sweep::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 150%;
  left: -160%;
  transform: skewX(-20deg);
  background-color: var(--btn-bg);
  z-index: 0;
  opacity: 0;
  pointer-events: none;
}

.lime-btn--effect-sweep.is-sweeping::after {
  opacity: 1;
  animation: sweep-anim 0.4s var(--td-ease-out) forwards;
}

@keyframes sweep-anim {
  0% {
    left: -160%;
  }
  100% {
    left: -10%;
  }
}
</style>
