<template>
  <div class="lime-btn-group" :class="classes" :style="groupStyle">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import type { ButtonTheme, ButtonVariant, ButtonSize, ButtonShape } from './types'

interface ButtonGroupProps {
  theme?: ButtonTheme
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: ButtonShape
  vertical?: boolean
  gap?: string
}

const props = withDefaults(defineProps<ButtonGroupProps>(), {
  theme: 'default',
  variant: 'base',
  size: 'medium',
  shape: 'rectangle',
  vertical: false,
  gap: '0',
})

const classes = computed(() => [
  `lime-btn-group--theme-${props.theme}`,
  `lime-btn-group--variant-${props.variant}`,
  `lime-btn-group--size-${props.size}`,
  `lime-btn-group--shape-${props.shape}`,
  {
    'lime-btn-group--vertical': props.vertical,
    'lime-btn-group--has-gap': props.gap !== '0',
  },
])

const groupStyle = computed(() => ({
  gap: props.gap,
}))

provide('buttonGroup', {
  theme: computed(() => props.theme),
  variant: computed(() => props.variant),
  size: computed(() => props.size),
  shape: computed(() => props.shape),
})
</script>

<style scoped>
.lime-btn-group {
  display: inline-flex;
  vertical-align: middle;
}

/* Vertical Layout */
.lime-btn-group--vertical {
  flex-direction: column;
}

/* Ensure buttons inside display properly */
.lime-btn-group :deep(.lime-btn) {
  position: relative;
  flex: 0 1 auto;
}

/* Horizontal Layout - Border Overlap */
.lime-btn-group:not(.lime-btn-group--vertical):not(.lime-btn-group--has-gap)
  :deep(.lime-btn:not(:first-child)) {
  margin-left: -1px;
}

/* Vertical Layout - Border Overlap */
.lime-btn-group--vertical:not(.lime-btn-group--has-gap) :deep(.lime-btn:not(:first-child)) {
  margin-top: -1px;
}

/* Horizontal Layout - Corners */
.lime-btn-group:not(.lime-btn-group--vertical):not(.lime-btn-group--has-gap)
  :deep(.lime-btn:not(:first-child):not(:last-child)) {
  border-radius: 0;
}

.lime-btn-group:not(.lime-btn-group--vertical):not(.lime-btn-group--has-gap)
  :deep(.lime-btn:first-child:not(:last-child)) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.lime-btn-group:not(.lime-btn-group--vertical):not(.lime-btn-group--has-gap)
  :deep(.lime-btn:last-child:not(:first-child)) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

/* Vertical Layout - Corners */
.lime-btn-group--vertical:not(.lime-btn-group--has-gap)
  :deep(.lime-btn:not(:first-child):not(:last-child)) {
  border-radius: 0;
}

.lime-btn-group--vertical:not(.lime-btn-group--has-gap)
  :deep(.lime-btn:first-child:not(:last-child)) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.lime-btn-group--vertical:not(.lime-btn-group--has-gap)
  :deep(.lime-btn:last-child:not(:first-child)) {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

/* Hover z-index */
.lime-btn-group :deep(.lime-btn:hover),
.lime-btn-group :deep(.lime-btn:focus),
.lime-btn-group :deep(.lime-btn:active),
.lime-btn-group :deep(.lime-btn.lime-btn--loading) {
  z-index: 1;
}
</style>
