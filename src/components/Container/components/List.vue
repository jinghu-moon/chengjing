<template>
  <div
    class="cj-list"
    :class="listClasses"
    @click="handleClick"
  >
    <!-- 左侧：选择指示器 -->
    <div v-if="shouldShowIndicator" class="cj-list__indicator">
      <div
        class="indicator-circle"
        :class="{ 'is-checked': isChecked, 'is-square': isMultiple }"
      >
        <div class="indicator-inner"></div>
      </div>
    </div>

    <!-- 左侧：图标 -->
    <div v-if="icon || $slots.icon" class="cj-list__icon">
      <slot name="icon">
        <component :is="icon" v-if="icon" />
      </slot>
    </div>

    <!-- 中间：标题 + 副标题 -->
    <div class="cj-list__content">
      <div v-if="title" class="cj-list__title">
        {{ title }}
        <span v-if="badge !== undefined" class="cj-header__badge" :class="`cj-header__badge--${badgeType}`">{{ badge }}</span>
      </div>
      <div v-if="hasSubtitle" class="cj-list__subtitle">
        {{ subtitle }}
        <slot name="subtitle" />
      </div>
      <slot />
    </div>

    <!-- 右侧：extra / actions -->
    <div v-if="$slots.extra" class="cj-list__extra">
      <slot name="extra" />
    </div>
    <div v-if="$slots.actions" class="cj-list__extra" @click.stop>
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots, toRef, type Component } from 'vue'
import type { BadgeType, ContainerSize, ContainerVariant } from '../shared/types'
import { useSelection } from '../composables/useSelection'

const props = withDefaults(defineProps<{
  title?: string
  icon?: Component
  badge?: string | number
  badgeType?: BadgeType
  size?: ContainerSize
  variant?: ContainerVariant
  bordered?: boolean
  hoverable?: boolean
  clickable?: boolean
  subtitle?: string
  selectable?: boolean
  checked?: boolean
  value?: any
}>(), {
  title: undefined,
  icon: undefined,
  badge: undefined,
  badgeType: 'primary',
  size: 'sm',
  variant: 'default',
  bordered: true,
  hoverable: false,
  clickable: false,
  subtitle: undefined,
  selectable: false,
  checked: undefined,
  value: undefined,
})

const emit = defineEmits<{
  'update:checked': [value: boolean]
  'click': [event: MouseEvent]
}>()

const slots = useSlots()
const hasSubtitle = computed(() => !!props.subtitle || !!slots.subtitle)

const { isChecked, isMultiple, shouldShowIndicator, handleSelect, isInGroup } = useSelection({
  selectable: toRef(props, 'selectable'),
  checked: toRef(props, 'checked'),
  value: toRef(props, 'value'),
})

const handleClick = (e: MouseEvent) => {
  if (isInGroup.value) {
    handleSelect()
  } else if (props.selectable && props.checked !== undefined) {
    emit('update:checked', !props.checked)
  }
  emit('click', e)
}

const listClasses = computed(() => [
  `cj-list--${props.size}`,
  {
    'cj-list--bordered': props.bordered,
    'cj-list--hoverable': props.hoverable || props.clickable || isInGroup.value,
    'cj-list--clickable': props.clickable,
    [`cj-list--${props.variant}`]: props.variant !== 'default',
    'is-selected': isChecked.value,
  },
])
</script>

<style scoped>
/* =========================================
   基础 List 样式
   ========================================= */
.cj-list {
  background-color: var(--bg-panel);
  backdrop-filter: var(--glass-sm);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: center;
  transition: var(--transition-base);
  border: 1px solid transparent;
  gap: var(--space-4);
  padding: 10px 12px;
  min-height: 56px;
}

.cj-list--bordered {
  border: var(--border-glass);
  box-shadow: var(--shadow-xs);
}

.cj-list--hoverable:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--color-border-hover);
  cursor: pointer;
}

.cj-list--clickable {
  cursor: pointer;
}
.cj-list--clickable:active {
  transform: scale(0.98);
}

/* 选中状态 */
.cj-list.is-selected {
  border-color: var(--color-primary);
  background-color: var(--bg-primary-subtle, rgba(var(--rgb-primary), 0.05));
  box-shadow: var(--shadow-sm);
}
.cj-list.is-selected:hover {
  border-color: var(--color-primary);
}

/* =========================================
   选择指示器
   ========================================= */
.cj-list__indicator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.indicator-circle {
  width: 20px;
  height: 20px;
  border: 2px solid var(--text-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
  flex-shrink: 0;
}

.indicator-circle.is-square {
  border-radius: 4px;
}

.indicator-circle.is-checked {
  border-color: var(--color-primary);
}

.indicator-inner {
  width: 10px;
  height: 10px;
  background-color: var(--color-primary);
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.5);
  transition: transform 0.4s var(--ease-elastic), opacity 0.2s ease;
}

.indicator-circle.is-square .indicator-inner {
  border-radius: 1px;
}

.indicator-circle.is-checked .indicator-inner {
  opacity: 1;
  transform: scale(1);
}

/* =========================================
   图标区域
   ========================================= */
.cj-list__icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-secondary);
}

.cj-list__icon :deep(svg) {
  width: 18px;
  height: 18px;
}

/* =========================================
   内容区域
   ========================================= */
.cj-list__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-width: 0;
}

.cj-list__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: var(--weight-bold);
  font-size: var(--text-md);
  color: var(--text-primary);
}

.cj-list__subtitle {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: 1.4;
}

.cj-list__extra {
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* =========================================
   Size Variants
   ========================================= */
.cj-list--xs {
  padding: var(--space-2) var(--space-3);
  min-height: 36px;
  gap: var(--space-2);
}
.cj-list--xs .cj-list__title {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
}
.cj-list--xs .cj-list__subtitle {
  font-size: 10px;
}
.cj-list--xs .cj-list__icon {
  width: 24px;
  height: 24px;
}

.cj-list--sm .cj-list__title {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}
.cj-list--sm .cj-list__subtitle {
  font-size: var(--text-xs);
}

.cj-list--md {
  padding: var(--comp-padding-xl);
}
.cj-list--md .cj-list__title {
  font-size: var(--text-md);
}

.cj-list--lg {
  padding: var(--space-5) var(--space-6);
  min-height: 72px;
}
.cj-list--lg .cj-list__title {
  font-size: var(--text-lg);
}
.cj-list--lg .cj-list__icon {
  width: 40px;
  height: 40px;
}
</style>
