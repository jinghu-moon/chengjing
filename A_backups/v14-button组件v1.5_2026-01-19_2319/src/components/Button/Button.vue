<template>
  <component
    :is="tagName"
    :type="isButton ? props.type : undefined"
    :form="props.form"
    :href="props.href"
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

    <!-- Icon -->
    <span v-if="props.icon && !loading" class="btn-icon">
      <component :is="props.icon" :size="iconSize" />
    </span>

    <!-- Content -->
    <span v-if="$slots.default || props.content" class="btn-content">
      <slot>{{ props.content }}</slot>
    </span>

    <!-- Suffix -->
    <span v-if="props.suffix" class="btn-suffix">
      <component :is="props.suffix" :size="iconSize" />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type {
  ButtonProps,
  ButtonEmits,
  ButtonTheme,
  ButtonVariant,
  ButtonSize,
  ButtonShape,
} from './types'
import type { ComputedRef } from 'vue'

const props = withDefaults(defineProps<ButtonProps>(), {
  block: false,
  disabled: false,
  ghost: false,
  effect: 'ripple',
  loading: false,
  tag: 'button',
  type: 'button',
})

const emit = defineEmits<ButtonEmits>()

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
  }

  // 3. Pulse Effect
  if (props.effect === 'pulse') {
    btn.classList.remove('is-pulsing')
    void btn.offsetWidth
    btn.classList.add('is-pulsing')
    setTimeout(() => btn.classList.remove('is-pulsing'), 400)
  }

  // 4. Shake Effect
  if (props.effect === 'shake') {
    if (btn.classList.contains('is-shaking')) return
    btn.classList.add('is-shaking')
    setTimeout(() => btn.classList.remove('is-shaking'), 500)
  }

  // 5. Slide Feedback Effect
  if (props.effect === 'slide-feedback') {
    if (btn.classList.contains('is-sliding')) return
    btn.classList.add('is-sliding')
    setTimeout(() => btn.classList.remove('is-sliding'), 2000)
  }

  // 6. Progress Effect
  if (props.effect === 'progress') {
    if (btn.classList.contains('is-loading')) return
    btn.classList.add('is-loading')
    setTimeout(() => {
      btn.classList.remove('is-loading')
      btn.classList.add('is-success')
      setTimeout(() => btn.classList.remove('is-success'), 1500)
    }, 2000)
  }

  emit('click', e)
}
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
  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
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
  --ease-shake: cubic-bezier(0.36, 0.07, 0.19, 0.97);
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
  --td-ease-shake: cubic-bezier(0.36, 0.07, 0.19, 0.97);
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

/* Hover 1: Sheen (流光) */
.lime-btn--effect-sheen {
  overflow: hidden;
}

.lime-btn--effect-sheen::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: skewX(-20deg) translateX(-150%);
  transition: transform 0.5s;
  pointer-events: none;
  z-index: 1;
}

.lime-btn--effect-sheen:hover:not(.lime-btn--disabled):not(.lime-btn--loading)::after {
  transform: skewX(-20deg) translateX(150%);
}

/* Hover 2: Icon Slide (图标滑入) */
.lime-btn--effect-icon-slide .btn-content {
  transition: transform 0.3s var(--td-ease-out);
}

.lime-btn--effect-icon-slide .btn-suffix {
  position: absolute;
  right: 14px;
  opacity: 0;
  transform: translateX(-5px);
  transition: all 0.3s var(--td-ease-out);
}

.lime-btn--effect-icon-slide:hover:not(.lime-btn--disabled):not(.lime-btn--loading) .btn-content {
  transform: translateX(-10px);
}

.lime-btn--effect-icon-slide:hover:not(.lime-btn--disabled):not(.lime-btn--loading) .btn-suffix {
  opacity: 1;
  transform: translateX(0);
}

/* Hover 3: Lift (悬浮升起) */
.lime-btn--effect-lift {
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.lime-btn--effect-lift:hover:not(.lime-btn--disabled):not(.lime-btn--loading) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

/* =========================================
   ACTIVE 效果
   ========================================= */

/* Active: Scale (拟物按压) */
.lime-btn--effect-scale {
  transition: transform 0.1s var(--td-ease-out), background-color 0.2s linear;
}

.lime-btn--effect-scale:active:not(.lime-btn--disabled):not(.lime-btn--loading) {
  transform: scale(0.95);
}

/* =========================================
   CLICK 效果
   ========================================= */

/* Click 1: Pulse (外部光环) */
.lime-btn--effect-pulse::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  border: 0px solid var(--btn-bg);
  box-shadow: 0 0 0 0 var(--btn-bg);
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}

.lime-btn--effect-pulse.is-pulsing::after {
  animation: ant-wave-effect 0.4s var(--td-ease-out);
}

@keyframes ant-wave-effect {
  0% {
    box-shadow: 0 0 0 0 var(--btn-bg);
    opacity: 1;
  }
  100% {
    box-shadow: 0 0 0 8px var(--btn-bg);
    opacity: 0;
  }
}

/* Click 2: Ripple (水波纹) */
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

/* Click 3: Sweep (斜向填充) */
.lime-btn--effect-sweep {
  overflow: hidden;
}

.lime-btn--effect-sweep::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 150%;
  left: -160%;
  transform: skewX(-20deg);
  background-color: rgba(0, 0, 0, 0.1);
  z-index: 1;
  opacity: 0;
  pointer-events: none;
}

.lime-btn--effect-sweep.is-sweeping::before {
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

/* Click 4: Shake (错误抖动) */
.lime-btn--effect-shake {
  will-change: transform;
}

.lime-btn--effect-shake.is-shaking {
  animation: shake-anim 0.5s var(--td-ease-shake) both;
}

@keyframes shake-anim {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}

/* Click 5: Slide Feedback (滑轨反馈) - 需要特殊模板结构 */
.lime-btn--effect-slide-feedback .btn-content {
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  justify-items: center;
  width: 100%;
}

/* Click 6: Progress (边框进度) */
.lime-btn--effect-progress {
  overflow: hidden;
}

.lime-btn--effect-progress::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 0%;
  background-color: var(--btn-bg);
  transition: width 0s;
  z-index: 3;
}

.lime-btn--effect-progress.is-loading::after {
  width: 100%;
  transition: width 2s linear;
}

.lime-btn--effect-progress.is-loading {
  color: #999;
  pointer-events: none;
}

.lime-btn--effect-progress.is-success {
  border-color: var(--td-success-color, #2ba471);
  color: var(--td-success-color, #2ba471);
  transition: all 0.3s;
}

.lime-btn--effect-progress.is-success::after {
  width: 100%;
  background-color: var(--td-success-color, #2ba471);
  height: 100%;
  opacity: 0.1;
  transition: height 0.3s, opacity 0.3s, background-color 0.3s;
}
</style>
