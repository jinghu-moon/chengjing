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

  // 触发 Pulse/Shake 效果
  if (props.effect === 'pulse' || props.effect === 'shake') {
    const btn = e.currentTarget as HTMLElement
    const className = props.effect === 'pulse' ? 'is-pulsing' : 'is-shaking'
    btn.classList.remove(className)
    void btn.offsetWidth // 强制重排
    btn.classList.add(className)
    setTimeout(() => btn.classList.remove(className), 500)
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
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.lime-btn--variant-text,
.lime-btn--disabled {
  box-shadow: none;
}

/* === Sweep Effect (Active State) === */
.lime-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 100%;
  background-color: var(--btn-bg-hover);
  transition: width 0.3s ease;
  pointer-events: none;
  z-index: 0;
}

.lime-btn:active:not(.lime-btn--disabled):not(.lime-btn--loading)::before {
  width: 100%;
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

/* === Enhanced Effects === */

/* Lift: 悬浮升起 (Hover) */
.lime-btn--effect-lift:hover:not(.lime-btn--disabled):not(.lime-btn--loading) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
}

/* Sheen: 流光扫过 (Hover) */
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
    rgba(255, 255, 255, 0.3) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: skewX(-20deg) translateX(-150%);
  transition: transform 0.5s;
  pointer-events: none;
  z-index: 2;
}

.lime-btn--effect-sheen:hover:not(.lime-btn--disabled):not(.lime-btn--loading)::after {
  transform: skewX(-20deg) translateX(150%);
}

/* Scale: 缩放按压 (Active) */
.lime-btn--effect-scale:active:not(.lime-btn--disabled):not(.lime-btn--loading) {
  transform: scale(0.96);
  transition-duration: 0.1s;
}

/* Pulse: 光环扩散 (Click - 需要 JS 触发 .is-pulsing) */
.lime-btn--effect-pulse::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  box-shadow: 0 0 0 0 var(--btn-bg);
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}

.lime-btn--effect-pulse.is-pulsing::after {
  animation: pulse-effect 0.5s cubic-bezier(0.38, 0, 0.24, 1);
}

@keyframes pulse-effect {
  0% {
    box-shadow: 0 0 0 0 var(--btn-bg);
    opacity: 0.6;
  }
  100% {
    box-shadow: 0 0 0 10px var(--btn-bg);
    opacity: 0;
  }
}

/* Shake: 错误抖动 (Click - 需要 JS 触发 .is-shaking) */
.lime-btn--effect-shake.is-shaking {
  animation: shake-effect 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97);
}

@keyframes shake-effect {
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

/* Icon Slide: 图标滑入 (Hover - 需配合 suffix 使用) */
.lime-btn--effect-icon-slide .btn-content {
  transition: transform 0.3s cubic-bezier(0.38, 0, 0.24, 1);
}

.lime-btn--effect-icon-slide .btn-suffix {
  opacity: 0;
  transform: translateX(-8px);
  transition: all 0.3s cubic-bezier(0.38, 0, 0.24, 1);
}

.lime-btn--effect-icon-slide:hover:not(.lime-btn--disabled):not(.lime-btn--loading) .btn-content {
  transform: translateX(-6px);
}

.lime-btn--effect-icon-slide:hover:not(.lime-btn--disabled):not(.lime-btn--loading) .btn-suffix {
  opacity: 1;
  transform: translateX(0);
}
</style>
