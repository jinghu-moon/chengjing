<template>
  <div
    class="cj-card"
    :class="cardClasses"
    :style="gridStyle"
    @click="$emit('click', $event)"
  >
    <!-- Header -->
    <ContainerHeader
      v-if="title || $slots.header || $slots.icon"
      :title="title"
      :title-position="titlePosition"
      :icon="icon"
      :badge="badge"
      :badge-type="badgeType"
    >
      <template v-if="$slots.icon" #icon><slot name="icon" /></template>
      <template v-if="$slots.header" #header><slot name="header" /></template>
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>
    </ContainerHeader>

    <!-- Tabs -->
    <div v-if="tabs && tabs.length > 0" ref="tabsContainerRef" class="cj-card__tabs">
      <div
        v-for="tab in tabs"
        :key="tab.value"
        :ref="(el) => setTabRef(el, tab.value)"
        class="cj-card__tab-item"
        :class="{
          'is-active': activeTab === tab.value,
          'is-disabled': tab.disabled,
        }"
        @click="handleTabClick(tab)"
      >
        {{ tab.label }}
      </div>
      <div class="cj-card__active-line" :style="activeLineStyle"></div>

      <!-- Tabs 栏右侧 actions（无 header 时） -->
      <div
        v-if="!title && !$slots.header && $slots.actions && !loading"
        class="cj-header__actions"
        style="margin-left: auto; padding-right: 0"
      >
        <slot name="actions" />
      </div>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="loading" class="cj-card__body cj-card__skeleton">
      <div class="skeleton-row" style="width: 60%"></div>
      <div class="skeleton-row" style="width: 90%"></div>
      <div class="skeleton-row" style="width: 50%"></div>
    </div>

    <!-- Body -->
    <div v-else class="cj-card__body">
      <!-- Tabs 内容 -->
      <div v-if="tabs && tabs.length > 0" class="cj-card__tabs-content">
        <div
          v-for="(tab, index) in tabs"
          :key="tab.value"
          class="cj-card__tab-pane"
          :class="getTabPaneClass(tab, index)"
        >
          <slot :name="tab.value" />
        </div>
      </div>
      <slot v-else />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="cj-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount, type Component } from 'vue'
import type { CardTab, BadgeType, ContainerSize, ContainerVariant } from '../shared/types'
import ContainerHeader from '../shared/ContainerHeader.vue'

const props = withDefaults(defineProps<{
  title?: string
  titlePosition?: 'left' | 'center' | 'right'
  icon?: Component
  badge?: string | number
  badgeType?: BadgeType
  size?: ContainerSize
  variant?: ContainerVariant
  bordered?: boolean
  hoverable?: boolean
  clickable?: boolean
  dashed?: boolean
  loading?: boolean
  layout?: 'column' | 'row' | 'grid'
  gridColumns?: number
  tabs?: CardTab[]
  activeTab?: string | number
}>(), {
  title: undefined,
  titlePosition: 'left',
  icon: undefined,
  badge: undefined,
  badgeType: 'primary',
  size: 'md',
  variant: 'default',
  bordered: true,
  hoverable: false,
  clickable: false,
  dashed: false,
  loading: false,
  layout: 'column',
  gridColumns: 2,
  tabs: () => [],
  activeTab: undefined,
})

const emit = defineEmits<{
  'update:activeTab': [value: string | number]
  'tab-change': [value: string | number]
  'click': [event: MouseEvent]
}>()

// ========== 样式计算 ==========
const cardClasses = computed(() => [
  `cj-card--${props.size}`,
  `cj-card--${props.layout}`,
  {
    'cj-card--bordered': props.bordered && !props.dashed,
    'cj-card--dashed': props.dashed,
    'cj-card--hoverable': props.hoverable || props.clickable,
    'cj-card--clickable': props.clickable,
    [`cj-card--${props.variant}`]: props.variant !== 'default',
    'is-loading': props.loading,
  },
])

const gridStyle = computed(() => {
  if (props.layout !== 'grid') return {}
  return { '--grid-columns': props.gridColumns }
})

// ========== Tabs 逻辑 ==========
const tabsContainerRef = ref<HTMLElement>()
const tabRefs = ref<Map<string | number, HTMLElement>>(new Map())
const setTabRef = (el: any, value: string | number) => {
  if (el) tabRefs.value.set(value, el as HTMLElement)
}

const activeLineStyle = ref({ width: '0px', transform: 'translateX(0)', opacity: 0 })

const updateActiveLine = async () => {
  if (!props.activeTab || props.tabs.length === 0) return
  await nextTick()
  const activeEl = tabRefs.value.get(props.activeTab)
  if (activeEl) {
    activeLineStyle.value = {
      width: `${activeEl.offsetWidth}px`,
      transform: `translateX(${activeEl.offsetLeft}px)`,
      opacity: 1,
    }
  } else {
    activeLineStyle.value = { ...activeLineStyle.value, opacity: 0 }
  }
}

watch(() => props.activeTab, updateActiveLine)

// ResizeObserver 精准监听 tabs 容器尺寸变化，替代全局 window.resize
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateActiveLine()
  if (tabsContainerRef.value) {
    resizeObserver = new ResizeObserver(updateActiveLine)
    resizeObserver.observe(tabsContainerRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})

const handleTabClick = (tab: CardTab) => {
  if (tab.disabled) return
  if (props.activeTab !== tab.value) {
    emit('update:activeTab', tab.value)
    emit('tab-change', tab.value)
  }
}

const activeTabIndex = computed(() =>
  props.tabs.findIndex((tab) => tab.value === props.activeTab)
)

const getTabPaneClass = (tab: CardTab, index: number) => {
  const isActive = props.activeTab === tab.value
  let positionClass = ''
  if (index < activeTabIndex.value) positionClass = 'is-left'
  else if (index > activeTabIndex.value) positionClass = 'is-right'
  return { 'is-active': isActive, [positionClass]: !!positionClass }
}
</script>

<style scoped>
/* =========================================
   基础卡片样式
   ========================================= */
.cj-card {
  background-color: var(--bg-panel);
  backdrop-filter: var(--glass-sm);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: var(--transition-base);
  border: 1px solid transparent;
}

/* =========================================
   Layout Variants
   ========================================= */
.cj-card--column { flex-direction: column; }

.cj-card--row {
  flex-direction: row;
  align-items: center;
}
.cj-card--row .cj-header {
  border-bottom: none;
  border-right: 1px solid var(--color-divider);
  flex-shrink: 0;
  padding: var(--space-3);
}
.cj-card--row .cj-card__body {
  flex: 1;
  padding: var(--space-3);
}

.cj-card--grid .cj-card__body {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns, 2), 1fr);
  gap: var(--space-4);
}

/* =========================================
   Border / Hover / Click
   ========================================= */
.cj-card--bordered {
  border: var(--border-glass);
  box-shadow: var(--shadow-xs);
}

.cj-card--hoverable:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--color-border-hover);
  cursor: pointer;
}

.cj-card--clickable {
  cursor: pointer;
  transition: transform 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out), border-color 0.2s;
}
.cj-card--clickable:active {
  transform: scale(0.98);
}

.cj-card--dashed {
  border: 2px dashed var(--color-divider);
  background-color: transparent !important;
  cursor: pointer;
  transition: var(--transition-base);
}
.cj-card--dashed:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background-color: var(--bg-hover) !important;
}
.cj-card--dashed .cj-card__body {
  justify-content: center;
  align-items: center;
}

/* =========================================
   Body
   ========================================= */
.cj-card__body {
  padding: var(--comp-padding-square-xl);
  font-size: var(--text-base);
  line-height: var(--line-normal);
  color: var(--text-secondary);
  background: transparent;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* =========================================
   Footer
   ========================================= */
.cj-card__footer {
  padding: var(--comp-padding-xl);
  border-top: 1px solid var(--color-divider);
}

/* =========================================
   Tabs
   ========================================= */
.cj-card__tabs {
  display: flex;
  align-items: center;
  padding: 0;
  border-bottom: 1px solid var(--color-divider);
  background-color: var(--bg-panel);
  z-index: 1;
  position: relative;
}

.cj-header + .cj-card__tabs {
  margin-top: -1px;
}

.cj-card__tab-item {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-1);
  font-size: var(--text-base);
  color: var(--text-secondary);
  cursor: pointer;
  transition: color var(--transition-base);
  font-weight: var(--weight-medium);
  text-align: center;
  min-width: 0;
}
.cj-card__tab-item:hover:not(.is-disabled) { color: var(--text-primary); }
.cj-card__tab-item.is-active { color: var(--color-primary); }
.cj-card__tab-item.is-disabled { opacity: 0.5; cursor: not-allowed; }

.cj-card__active-line {
  position: absolute;
  bottom: -1px;
  left: 0;
  height: 2px;
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.2s;
  pointer-events: none;
}

/* Tab Pane 切换动画 */
.cj-card__tabs-content {
  display: grid;
  grid-template-areas: "content";
  width: 100%;
  position: relative;
  overflow: hidden;
}
.cj-card__tab-pane {
  grid-area: content;
  width: 100%;
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.5, 1),
              opacity 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
  opacity: 0;
  pointer-events: none;
}
.cj-card__tab-pane.is-active {
  opacity: 1;
  pointer-events: auto;
  z-index: 1;
}
.cj-card__tab-pane.is-left { transform: translateX(-15%); }
.cj-card__tab-pane.is-right { transform: translateX(15%); }

/* =========================================
   Skeleton Loading
   ========================================= */
.cj-card__skeleton {
  padding: var(--comp-padding-xl);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.skeleton-row {
  height: 16px;
  background: var(--bg-hover);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}
.skeleton-row::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.08) 50%, transparent 75%);
  animation: skeleton-loading 1.5s infinite;
}
@keyframes skeleton-loading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* =========================================
   Size Variants
   ========================================= */
.cj-card--xs { font-size: var(--text-xs); }
.cj-card--xs .cj-header { padding: var(--comp-padding-square-xs); min-height: var(--height-xs); }
.cj-card--xs .cj-card__body { padding: var(--comp-padding-square-xs); }

.cj-card--sm { font-size: var(--text-sm); }
.cj-card--sm .cj-header { padding: var(--comp-padding-square-sm); }
.cj-card--sm .cj-card__body { padding: var(--comp-padding-square-sm); }

.cj-card--md { font-size: var(--text-base); }
.cj-card--md .cj-header { padding: var(--comp-padding-square-md); }
.cj-card--md .cj-card__body { padding: var(--comp-padding-square-md); }

.cj-card--lg { font-size: var(--text-md); }
.cj-card--lg .cj-header { padding: var(--comp-padding-square-lg); min-height: var(--height-lg); }
.cj-card--lg .cj-card__body { padding: var(--comp-padding-square-lg); }
</style>
