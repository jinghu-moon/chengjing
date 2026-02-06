<template>
  <div
    class="cj-collapse"
    :class="collapseClasses"
    :data-panel-id="panelId"
    :data-layout="layout"
  >
    <!-- Header -->
    <ContainerHeader
      :title="title"
      :title-position="titlePosition"
      :icon="icon"
      :badge="badge"
      :badge-type="badgeType"
      :trigger-area="triggerArea"
      @header-click="handleHeaderClick"
      @title-click="handleTitleClick"
    >
      <!-- 折叠箭头（通过 #prefix 注入） -->
      <template v-if="showCollapseIcon" #prefix>
        <span
          class="cj-collapse__arrow"
          :class="{ 'is-expanded': isExpanded }"
          @click.stop="handleArrowClick"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </template>

      <template v-if="$slots.icon" #icon><slot name="icon" /></template>
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>

      <!-- Collapse 专属：switch 开关 -->
      <template #suffix>
        <div
          v-if="showSwitch"
          class="cj-collapse__switch"
          :class="{ active: isExpanded }"
          role="switch"
          :aria-checked="isExpanded"
          tabindex="0"
          @click.stop="handleSwitchClick"
          @keydown.enter.prevent="handleSwitchClick"
          @keydown.space.prevent="handleSwitchClick"
        ></div>
      </template>
    </ContainerHeader>

    <!-- 折叠内容 -->
    <div
      class="cj-collapse__wrapper"
      role="region"
      :aria-hidden="!isExpanded"
    >
      <div class="cj-collapse__body">
        <div class="cj-collapse__content">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, toRef, type Component } from 'vue'
import type {
  BadgeType, ContainerSize, ContainerVariant,
  CollapseAnimation, CollapseLayout, CollapseTriggerArea,
} from '../shared/types'
import ContainerHeader from '../shared/ContainerHeader.vue'
import { useCollapse } from '../composables/useCollapse'

const props = withDefaults(defineProps<{
  title?: string
  titlePosition?: 'left' | 'center' | 'right'
  icon?: Component
  badge?: string | number
  badgeType?: BadgeType
  size?: ContainerSize
  variant?: ContainerVariant
  bordered?: boolean
  expanded?: boolean
  defaultExpanded?: boolean
  showSwitch?: boolean
  collapseAnimation?: CollapseAnimation
  panelId?: string
  showCollapseIcon?: boolean
  triggerArea?: CollapseTriggerArea
  layout?: CollapseLayout
}>(), {
  title: undefined,
  titlePosition: 'left',
  icon: undefined,
  badge: undefined,
  badgeType: 'primary',
  size: 'md',
  variant: 'default',
  bordered: true,
  expanded: undefined,
  defaultExpanded: false,
  showSwitch: true,
  collapseAnimation: 'smooth',
  panelId: () => `panel-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  showCollapseIcon: true,
  triggerArea: 'header',
  layout: 'default',
})

const emit = defineEmits<{
  'update:expanded': [value: boolean]
  'change': [value: boolean]
  'expand': []
  'collapse': []
}>()

const { isExpanded, toggle, expand, collapse } = useCollapse({
  expanded: toRef(props, 'expanded'),
  defaultExpanded: toRef(props, 'defaultExpanded'),
  panelId: props.panelId,
  onUpdateExpanded: (val) => emit('update:expanded', val),
})

watch(isExpanded, (val, oldVal) => {
  if (val === oldVal) return
  emit('change', val)
  if (val) emit('expand')
  else emit('collapse')
})

/* triggerArea 路由：根据触发区域决定是否响应 */
const handleHeaderClick = () => {
  if (props.triggerArea === 'header') toggle()
}

const handleTitleClick = (e: MouseEvent) => {
  if (props.triggerArea === 'title') {
    e.stopPropagation()
    toggle()
  }
}

const handleArrowClick = () => {
  if (props.triggerArea === 'icon' || props.triggerArea === 'header') toggle()
}

const handleSwitchClick = () => {
  toggle()
}

const collapseClasses = computed(() => [
  `cj-collapse--${props.size}`,
  `cj-collapse--animation-${props.collapseAnimation}`,
  `cj-collapse--trigger-${props.triggerArea}`,
  {
    'is-expanded': isExpanded.value,
    'cj-collapse--bordered': props.bordered,
    [`cj-collapse--${props.variant}`]: props.variant !== 'default',
  },
])

defineExpose({ toggle, expand, collapse, isExpanded: () => isExpanded.value })
</script>

<style scoped>
/* =========================================
   基础折叠面板
   ========================================= */
.cj-collapse {
  background-color: var(--bg-panel);
  backdrop-filter: var(--glass-sm);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  box-shadow: var(--shadow-xs);
  transition: var(--transition-base);
  overflow: clip;
  display: flex;
  flex-direction: column;
  transform: translateZ(0);
  will-change: box-shadow, border-color;
}

.cj-collapse--bordered {
  border: var(--border-glass);
}

.cj-collapse:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--color-border-glass);
}

.cj-collapse.is-expanded {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}

/* Header 可点击 */
.cj-collapse .cj-header {
  cursor: pointer;
  user-select: none;
  transition: var(--transition-color);
}

.cj-collapse .cj-header:hover {
  background-color: var(--bg-hover);
}

/* =========================================
   折叠箭头
   ========================================= */
.cj-collapse__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--text-tertiary);
  flex-shrink: 0;
  transition: transform var(--duration-normal) var(--ease-smooth),
              color var(--duration-fast) ease;
  cursor: pointer;
  border-radius: var(--radius-xs);
}

.cj-collapse__arrow:hover {
  color: var(--text-primary);
}

.cj-collapse__arrow.is-expanded {
  transform: rotate(180deg);
  color: var(--color-primary);
}

/* 箭头动画：跟随面板动画变量 */
.cj-collapse__arrow {
  transition: transform var(--collapse-duration) var(--collapse-easing),
              color var(--duration-fast) ease;
}

/* =========================================
   Toggle Switch 开关
   ========================================= */
.cj-collapse__switch {
  position: relative;
  width: 48px;
  height: 28px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background-color 0.3s var(--ease-smooth);
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  order: 999;
}

.cj-collapse__switch::before {
  content: '';
  position: absolute;
  width: 22px;
  height: 22px;
  background-color: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: transform 0.3s var(--ease-smooth);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  will-change: transform;
}

.cj-collapse__switch.active {
  background-color: var(--color-primary);
}

.cj-collapse__switch.active::before {
  transform: translateX(20px);
}

.cj-collapse__switch:hover {
  opacity: 0.9;
}

.cj-collapse__switch:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

/* =========================================
   折叠动画 - CSS Grid
   ========================================= */

/* 动画变量：由变体类覆盖 */
.cj-collapse {
  --collapse-duration: var(--duration-normal);
  --collapse-easing: var(--ease-out);
  --collapse-opacity-easing: var(--ease-out);
}

.cj-collapse__wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--collapse-duration) var(--collapse-easing);
  overflow: hidden;
  margin: 0;
  padding: 0;
  min-height: 0;
}

.cj-collapse__body {
  display: grid;
  grid-template-rows: subgrid;
  overflow: hidden;
  margin: 0;
  padding: 0;
  min-height: 0;
}

.cj-collapse__content {
  padding: 0;
  font-size: var(--text-base);
  line-height: var(--line-normal);
  color: var(--text-secondary);
  min-height: 0;
  opacity: 0;
  visibility: hidden;
  transition: padding var(--collapse-duration) var(--collapse-easing),
              opacity var(--collapse-duration) var(--collapse-opacity-easing),
              visibility 0s var(--collapse-duration);
}

/* 展开状态 - 直接子选择器隔离嵌套 */
.cj-collapse.is-expanded > .cj-collapse__wrapper {
  grid-template-rows: 1fr;
}

.cj-collapse.is-expanded > .cj-collapse__wrapper > .cj-collapse__body > .cj-collapse__content {
  padding: var(--comp-padding-square-xl);
  opacity: 1;
  visibility: visible;
  transition: padding var(--collapse-duration) var(--collapse-easing),
              opacity var(--collapse-duration) var(--collapse-opacity-easing),
              visibility 0s 0s;
}

/* =========================================
   Size Variants
   ========================================= */
/* Extra Small */
.cj-collapse--xs .cj-header { padding: var(--comp-padding-square-xs); }
.cj-collapse--xs .cj-header .cj-header__title { font-size: var(--text-xs); }

/* Small */
.cj-collapse--sm .cj-header { padding: var(--comp-padding-md); }
.cj-collapse--sm .cj-header .cj-header__title { font-size: var(--text-sm); }
.cj-collapse--sm > .cj-collapse__wrapper > .cj-collapse__body > .cj-collapse__content {
  font-size: var(--text-sm);
}
.cj-collapse--sm.is-expanded > .cj-collapse__wrapper > .cj-collapse__body > .cj-collapse__content {
  padding: var(--space-4);
}

/* Medium (默认) */
.cj-collapse--md .cj-header { padding: var(--comp-padding-xl); }
.cj-collapse--md .cj-header .cj-header__title { font-size: var(--text-md); }

/* Large */
.cj-collapse--lg .cj-header { padding: var(--space-5) var(--space-8); }
.cj-collapse--lg .cj-header .cj-header__title { font-size: var(--text-lg); }
.cj-collapse--lg > .cj-collapse__wrapper > .cj-collapse__body > .cj-collapse__content {
  font-size: var(--text-md);
}
.cj-collapse--lg.is-expanded > .cj-collapse__wrapper > .cj-collapse__body > .cj-collapse__content {
  padding: var(--space-8);
}

/* =========================================
   Animation Variants
   ========================================= */
/* Smooth (默认) */
.cj-collapse--animation-smooth {
  --collapse-duration: var(--duration-normal);
  --collapse-easing: var(--ease-smooth);
  --collapse-opacity-easing: var(--ease-smooth);
}

/* Bounce */
.cj-collapse--animation-bounce {
  --collapse-duration: 0.5s;
  --collapse-easing: var(--ease-bounce);
  --collapse-opacity-easing: ease;
}

/* Elastic */
.cj-collapse--animation-elastic {
  --collapse-duration: 0.6s;
  --collapse-easing: var(--ease-elastic);
  --collapse-opacity-easing: ease;
}

/* =========================================
   Layout 布局预设（通过 data-layout 属性控制 order）
   ========================================= */

/* icon-right: 标题 | 操作(右) | 图标(右) | 开关 */
.cj-collapse[data-layout="icon-right"] :deep(.cj-header__icon) {
  order: 10;
}

/* compact: 图标(左) | 标题 | 开关（隐藏操作区） */
.cj-collapse[data-layout="compact"] :deep(.cj-header__actions) {
  display: none;
}

/* actions-left: 图标(左) | 操作 | 标题 | 开关 */
.cj-collapse[data-layout="actions-left"] :deep(.cj-header__actions) {
  order: -1;
  margin-left: 0;
  margin-right: 0;
}
.cj-collapse[data-layout="actions-left"] :deep(.cj-header__title-wrapper) {
  order: 5;
}

/* minimal: 标题 | 开关（无图标无操作） */
.cj-collapse[data-layout="minimal"] :deep(.cj-header__icon) {
  display: none;
}
.cj-collapse[data-layout="minimal"] :deep(.cj-header__actions) {
  display: none;
}
.cj-collapse[data-layout="minimal"] .cj-collapse__arrow {
  display: none;
}

/* =========================================
   triggerArea cursor 控制
   ========================================= */

/* title 模式：仅标题可点击 */
.cj-collapse--trigger-title .cj-header {
  cursor: default;
}
.cj-collapse--trigger-title :deep(.cj-header__title-wrapper) {
  cursor: pointer;
}

/* icon 模式：仅箭头可点击 */
.cj-collapse--trigger-icon .cj-header {
  cursor: default;
}
.cj-collapse--trigger-icon .cj-collapse__arrow {
  cursor: pointer;
}

/* switch 模式：仅 switch 可点击 */
.cj-collapse--trigger-switch .cj-header {
  cursor: default;
}

/* =========================================
   Header sticky 吸顶
   ========================================= */
.cj-collapse.is-expanded > :deep(.cj-header) {
  position: sticky;
  top: 0;
  z-index: 3;
  background-color: var(--bg-panel);
}

/* =========================================
   嵌套面板样式
   ========================================= */
.cj-collapse .cj-collapse {
  background-color: var(--bg-hover-card);
  border-color: var(--color-border-glass);
  box-shadow: none;
  border-radius: var(--radius-sm);
}

.cj-collapse .cj-collapse .cj-header {
  background-color: transparent;
  padding: var(--space-3) var(--space-4);
}

.cj-collapse .cj-collapse .cj-header .cj-header__title {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
}

/* 嵌套面板 hover 高亮 */
.cj-collapse .cj-collapse:hover {
  background-color: var(--bg-hover);
}

/* 嵌套面板间距 */
.cj-collapse .cj-collapse + .cj-collapse {
  margin-top: var(--space-1);
}

/* 嵌套面板折叠箭头缩小 */
.cj-collapse .cj-collapse .cj-collapse__arrow {
  width: 16px;
  height: 16px;
}
.cj-collapse .cj-collapse .cj-collapse__arrow svg {
  width: 14px;
  height: 14px;
}

/* =========================================
   prefers-reduced-motion
   ========================================= */
@media (prefers-reduced-motion: reduce) {
  .cj-collapse,
  .cj-collapse .cj-header,
  .cj-collapse__wrapper,
  .cj-collapse__content,
  .cj-collapse__switch,
  .cj-collapse__switch::before,
  .cj-collapse__arrow {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
