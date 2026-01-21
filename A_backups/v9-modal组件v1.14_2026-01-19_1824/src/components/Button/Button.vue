<template>
  <component
    :is="tagName"
    ref="buttonRef"
    :type="isButton ? props.type : undefined"
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
    <span v-if="$slots.default" class="btn-content">
      <slot></slot>
    </span>

    <!-- Suffix -->
    <span v-if="props.suffix" class="btn-suffix">
      <component :is="props.suffix" :size="iconSize" />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
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

const createRipple = (e: MouseEvent) => {
  if (!buttonRef.value) return

  const button = buttonRef.value
  const ripple = document.createElement('span')
  const rect = button.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = e.clientX - rect.left - size / 2
  const y = e.clientY - rect.top - size / 2

  ripple.style.width = ripple.style.height = `${size}px`
  ripple.style.left = `${x}px`
  ripple.style.top = `${y}px`
  ripple.classList.add('ripple')

  button.appendChild(ripple)

  ripple.addEventListener('animationend', () => {
    ripple.remove()
  })
}

const handleClick = (e: MouseEvent) => {
  if (isDisabled.value) {
    e.preventDefault()
    e.stopPropagation()
    return
  }

  if (props.effect === 'ripple') {
    createRipple(e)
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
}

/* === Shadow Effect === */
.lime-btn:not(.lime-btn--variant-text):not(.lime-btn--disabled) {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* === Sweep Effect === */
.lime-btn--effect-sweep {
  position: relative;
  overflow: hidden;
}

.lime-btn--effect-sweep::after {
  content: '';
  position: absolute;
  top: 0;
  left: -50%;
  width: 150%;
  height: 100%;
  background: linear-gradient(
    120deg,
    transparent 0%,
    transparent 40%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 60%,
    transparent 100%
  );
  transform: skewX(-20deg) translateX(-150%);
  transition: transform 0.5s;
  pointer-events: none;
}

.lime-btn--effect-sweep:hover::after {
  transform: skewX(-20deg) translateX(150%);
  transition: transform 0.6s;
}

/* Eliminate hover lift/shadow if previously perceived as move-up */
.lime-btn:hover {
  transform: none !important;
}

/* We also remove the default shadow expansion on hover that created a 'lift' effect */
.lime-btn:not(.lime-btn--variant-text):not(.lime-btn--disabled):hover {
  /* Keep shadow same as normal state, or just don't increase it */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* === Ripple Effect === */
.lime-btn :deep(.ripple) {
  position: absolute;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.6);
  pointer-events: none;
  transform: scale(0);
  animation: ripple-animation 0.6s ease-out;
}

@keyframes ripple-animation {
  to {
    transform: scale(2);
    opacity: 0;
  }
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
  background-color: rgba(0, 0, 0, 0.05);
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
  background-color: rgba(0, 0, 0, 0.05);
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

.lime-btn:active:not(.lime-btn--disabled):not(.lime-btn--loading) {
  transform: scale(0.98);
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
</style>
