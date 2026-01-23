<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'

export interface CapsuleTabItem {
  value: string | number
  label: string
  icon?: any // Component or string
}

const props = withDefaults(defineProps<{
  modelValue: string | number
  items: CapsuleTabItem[]
  equalWidth?: boolean
}>(), {
  equalWidth: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const tabsRef = ref<HTMLElement | null>(null)
const tabRefs = ref<HTMLElement[]>([])
const indicatorStyle = ref({
  width: '0px',
  transform: 'translateX(0px)',
  opacity: 0
})

const activeIndex = computed(() => {
  return props.items.findIndex(item => item.value === props.modelValue)
})

// Max width calculation for equal width mode
const maxTabWidth = ref(0)
const updateMaxTabWidth = () => {
  let max = 0
  tabRefs.value.forEach(tab => {
    if (tab) {
      // Temporarily remove width style to measure natural width
      const originalWidth = tab.style.width
      tab.style.width = ''
      const w = tab.getBoundingClientRect().width
      if (w > max) max = w
      tab.style.width = originalWidth
    }
  })
  maxTabWidth.value = max
}

const updateIndicator = () => {
  const container = tabsRef.value
  if (!container || activeIndex.value === -1) return

  const activeTab = tabRefs.value[activeIndex.value]
  if (!activeTab) return

  // 使用 offsetLeft/offsetWidth 获取相对布局坐标
  // 这种方式不受父容器 transform 动画影响，只要 DOM 布局稳定，数值就是准确的
  // 从而解决了面板滑入动画导致的计算抖动问题
  indicatorStyle.value = {
    width: `${activeTab.offsetWidth}px`,
    transform: `translateX(${activeTab.offsetLeft}px)`,
    opacity: 1
  }

  // Scroll into view logic handled by parent scroll container if needed
  // In `test.html`, there is a wrapper. We might need logic to scroll the active tab into view if the container is scrollable.
  // The provided CSS for .capsule-tabs doesn't imply it scrolls itself, but a wrapper might.
}

const handleTabClick = (value: string | number) => {
  emit('update:modelValue', value)
}

// Keyboard Navigation
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
  e.preventDefault()

  const len = props.items.length
  if (len === 0) return

  let newIndex = activeIndex.value
  if (e.key === 'ArrowRight') {
    newIndex = (newIndex + 1) % len
  } else {
    newIndex = (newIndex - 1 + len) % len
  }

  emit('update:modelValue', props.items[newIndex].value)
  // Focus logic is a bit tricky with Vue reactivity, but we can try to focus the new tab?
  // Actually, standard ARIA tabs usually focus the active tab.
}

// Watchers and Lifecycle
watch(
  () => props.modelValue,
  async () => {
    await nextTick()
    updateIndicator()
  }
)

watch(
  () => props.equalWidth,
  async () => {
    await nextTick()
    updateMaxTabWidth()
    updateIndicator()
  }
)

let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  await nextTick()
  updateMaxTabWidth()
  updateIndicator()

  // ResizeObserver is still useful for responsive layout changes
  if (tabsRef.value) {
    resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to avoid "ResizeObserver loop limit exceeded"
      requestAnimationFrame(() => {
        updateMaxTabWidth()
        updateIndicator()
      })
    })
    resizeObserver.observe(tabsRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

</script>

<template>
  <div class="capsule-tabs-wrapper">
    <div 
      class="capsule-tabs" 
      ref="tabsRef" 
      role="tablist" 
      tabindex="0"
      @keydown="handleKeyDown"
    >
      <div 
        class="capsule-indicator"
        :style="indicatorStyle"
      ></div>

      <div
        v-for="item in items"
        :key="item.value"
        ref="tabRefs"
        class="capsule-tab"
        :class="{ active: modelValue === item.value }"
        role="tab"
        :aria-selected="modelValue === item.value"
        :tabindex="modelValue === item.value ? 0 : -1"
        :style="equalWidth ? { width: `${maxTabWidth}px` } : {}"
        @click="handleTabClick(item.value)"
      >
        <!-- Stack Logic for Ghost Element -->
        <div class="tab-content">
          <component 
            v-if="item.icon" 
            :is="item.icon" 
            class="icon" 
          />
          <span>{{ item.label }}</span>
        </div>
        <!-- Ghost element to reserve space for bold font weight -->
        <div class="tab-ghost" aria-hidden="true">
          <component 
            v-if="item.icon" 
            :is="item.icon" 
            class="icon" 
          />
          <span>{{ item.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.capsule-tabs-wrapper {
  max-width: 100%;
  overflow-x: auto;
  /* padding: var(--space-2);  Use locally or inherit? */
  padding: 4px;
  scrollbar-width: none;
}
.capsule-tabs-wrapper::-webkit-scrollbar {
  display: none;
}

.capsule-tabs {
  position: relative;
  display: inline-flex;
  padding: 4px;
  background: rgba(0, 0, 0, 0.2); /* var(--bg-panel-dark) fallback */
  border-radius: 12px; /* var(--radius-ml) fallback */
  border: 1px solid rgba(255, 255, 255, 0.05); /* var(--border-divider) fallback */
  z-index: 1;
  outline: none;
}

.capsule-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 0;
  background: var(--bg-active, rgba(255, 255, 255, 0.1));
  border-radius: 8px; /* var(--radius-md) fallback */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  z-index: 0;
  pointer-events: none;
  transition: transform 0.3s cubic-bezier(0.34, 1.25, 0.64, 1),
              width 0.3s cubic-bezier(0.34, 1.25, 0.64, 1),
              opacity 0.2s ease;
}

.capsule-tab {
  position: relative;
  z-index: 1;
  padding: 6px 16px; /* var(--space-2) var(--space-6) */
  min-width: 40px; /* var(--height-xl) */
  cursor: pointer;
  user-select: none;
  display: inline-grid;
  grid-template-areas: "stack";
  place-items: center;
  color: rgba(255, 255, 255, 0.6); /* var(--text-secondary) */
  font-size: 14px; /* var(--text-base) */
  outline: none;
  transition: color 0.2s ease,
              width 0.3s cubic-bezier(0.34, 1.25, 0.64, 1),
              transform 0.1s ease;
  border-radius: 8px;
}

.capsule-tab:focus-visible {
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 0 2px var(--color-primary, #007bff);
}

.capsule-tab:active {
  transform: scale(0.96);
}

.capsule-tab.active {
  color: var(--color-primary-hover, #fff);
  font-weight: 600; /* var(--weight-semibold) */
  text-shadow: 0 0 0.5px currentColor;
}

.tab-content {
  grid-area: stack;
  display: flex;
  align-items: center;
  gap: 6px; /* var(--space-2) */
  white-space: nowrap;
}

.tab-ghost {
  grid-area: stack;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600; /* var(--weight-semibold) */
  visibility: hidden;
  pointer-events: none;
  opacity: 0;
}

.icon {
  width: 18px; /* var(--icon-md) */
  height: 18px;
  fill: currentColor;
}
</style>
