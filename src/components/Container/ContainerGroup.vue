<template>
  <div class="cj-container-group" :style="groupStyle">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, provide, toRef, reactive, onBeforeUnmount } from 'vue'
import { CONTAINER_GROUP_KEY } from './shared/types'
import type { ContainerGroupContext } from './shared/types'

const props = withDefaults(defineProps<{
  modelValue?: any
  multiple?: boolean
  columns?: number
  minWidth?: number | string
  gap?: string | number
  accordion?: boolean
}>(), {
  modelValue: undefined,
  multiple: false,
  columns: 1,
  minWidth: undefined,
  gap: 'var(--space-4)',
  accordion: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'change': [value: any]
}>()

// 布局样式：单列用 flex column，多列用 CSS Grid
const groupStyle = computed(() => {
  const gapValue = typeof props.gap === 'number' ? `${props.gap}px` : props.gap

  // 单列模式：flex column 语义更清晰，避免 Grid 隐式等高拉伸
  if (!props.minWidth && props.columns === 1) {
    return {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: gapValue,
    }
  }

  // 多列模式：CSS Grid
  let gridTemplateColumns: string
  if (props.minWidth) {
    const minW = typeof props.minWidth === 'number' ? `${props.minWidth}px` : props.minWidth
    gridTemplateColumns = `repeat(auto-fill, minmax(${minW}, 1fr))`
  } else {
    gridTemplateColumns = `repeat(${props.columns}, 1fr)`
  }

  return {
    display: 'grid',
    gridTemplateColumns,
    gap: gapValue,
  }
})

// ========== 选择管理（List 用） ==========
const handleItemClick = (value: any) => {
  if (value === undefined || value === null) return

  let newValue: any
  if (props.multiple) {
    const list = Array.isArray(props.modelValue) ? [...props.modelValue] : []
    const index = list.indexOf(value)
    if (index > -1) list.splice(index, 1)
    else list.push(value)
    newValue = list
  } else {
    newValue = value
  }

  emit('update:modelValue', newValue)
  emit('change', newValue)
}

// ========== 手风琴管理（Collapse 用） ==========
interface PanelMethods { collapse: () => void }
const panels = reactive(new Map<string, PanelMethods>())

const registerPanel = (panelId: string, methods: PanelMethods) => {
  panels.set(panelId, methods)
}

const unregisterPanel = (panelId: string) => {
  panels.delete(panelId)
}

const handlePanelToggle = (activePanelId: string) => {
  if (!props.accordion) return
  panels.forEach((methods, id) => {
    if (id !== activePanelId) methods.collapse()
  })
}

onBeforeUnmount(() => panels.clear())

// ========== Provide 统一上下文 ==========
provide<ContainerGroupContext>(CONTAINER_GROUP_KEY, {
  modelValue: toRef(props, 'modelValue'),
  multiple: toRef(props, 'multiple'),
  handleItemClick,
  registerPanel,
  unregisterPanel,
  handlePanelToggle,
  accordion: toRef(props, 'accordion'),
})
</script>

<style scoped>
.cj-container-group {
  width: 100%;
}
</style>
