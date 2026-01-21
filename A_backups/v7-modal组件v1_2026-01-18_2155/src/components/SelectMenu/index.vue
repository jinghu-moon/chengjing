<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, toRef, nextTick } from 'vue'
import SelectTrigger from './components/SelectTrigger.vue'
import SelectDropdown from './components/SelectDropdown.vue'
import { usePosition } from './composables/usePosition'
import { useKeyboardNav } from './composables/useKeyboardNav'
import {
  isSelectOption,
  isValidOption,
  POSITION_CONFIG,
  type CustomSelectProps,
  type SelectOption,
  type OptionItem,
  type TriggerMode,
  type PlacementPosition,
  type DividerOption,
} from './types'

// ==================== Props ====================
const props = withDefaults(defineProps<CustomSelectProps>(), {
  triggerWidth: '160px',
  placeholder: '请选择',
  trigger: 'click',
  hoverDelay: 200,
  placement: 'auto',
  showArrow: true,
  disabled: false,
  layout: 'list',
  clearable: false,
  emptyText: '暂无数据',
  dropdownMaxHeight: 300,
  dropdownMinWidth: undefined,
  filterable: false,
  searchPlaceholder: '输入关键词搜索...',
  multiple: false,
  showPath: false,
  customTrigger: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  clear: []
  check: [value: string, checked: boolean] // Checkbox 状态变化
  'radio-change': [group: string, value: string] // Radio 选中变化
}>()

// 定义 Slots 类型 (Vue 3.3+)
defineSlots<{
  trigger?: (props: {
    isOpen: boolean
    currentOption: SelectOption | undefined
    open: () => void
    close: () => void
    toggle: () => void
  }) => unknown
  header?: () => unknown
  option?: (props: { option: SelectOption }) => unknown
  footer?: () => unknown
}>()

// ==================== State ====================
const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)
const focusedIndex = ref(-1)
// 搜索关键词
const searchQuery = ref('')

// 子组件引用
const dropdownComponentRef = ref<InstanceType<typeof SelectDropdown> | null>(null)
// 真正的 DOM 引用（从子组件同步）
const dropdownRef = computed(() => dropdownComponentRef.value?.dropdownEl ?? null)
const dropdownScrollRef = computed(() => dropdownComponentRef.value?.scrollEl ?? null)

let hoverTimer: ReturnType<typeof setTimeout> | undefined
let leaveTimer: ReturnType<typeof setTimeout> | undefined

// ==================== 搜索过滤逻辑 (递归) ====================

// 默认过滤算法：匹配 Label 或 Value (不区分大小写)
const defaultFilter = (query: string, option: SelectOption) => {
  const q = query.toLowerCase()
  const label = option.label?.toLowerCase() || ''
  const val = option.value.toLowerCase()
  return label.includes(q) || val.includes(q)
}

// 递归过滤函数
const filterOptionsRecursive = (opts: OptionItem[], query: string): OptionItem[] => {
  if (!query) return opts

  return opts.reduce((acc, opt) => {
    // 始终保留分隔线 (根据需求可调整)
    if (opt.value === 'divider') {
      acc.push(opt)
      return acc
    }

    if (!isSelectOption(opt)) return acc

    // 递归处理子菜单
    let childrenMatch = false
    let filteredChildren: OptionItem[] = []
    if (opt.children && opt.children.length > 0) {
      filteredChildren = filterOptionsRecursive(opt.children, query)
      childrenMatch = filteredChildren.length > 0
    }

    // 判断当前节点是否匹配
    const selfMatch = defaultFilter(query, opt)

    // 如果自身匹配 OR 子节点有匹配，则保留
    if (selfMatch || childrenMatch) {
      acc.push({
        ...opt,
        // 如果子节点有匹配，只显示匹配的子节点；否则保留原子节点(如果是父节点匹配)
        children: childrenMatch ? filteredChildren : selfMatch ? opt.children : undefined,
      })
    }

    return acc
  }, [] as OptionItem[])
}

// [计算属性] 最终展示的选项
// 如果开启搜索且有关键词，则返回过滤后的结果，否则返回原始选项
const filteredOptions = computed(() => {
  if (!props.filterable || !searchQuery.value) return props.options
  return filterOptionsRecursive(props.options, searchQuery.value)
})

// ==================== 路径查找逻辑 ====================

// 递归查找选项及其路径
const findOptionPath = (
  opts: OptionItem[],
  value: string,
  path: SelectOption[] = []
): SelectOption[] | null => {
  for (const opt of opts) {
    if (!isSelectOption(opt)) continue

    // 找到目标
    if (opt.value === value) {
      return [...path, opt]
    }

    // 递归查找子项
    if (opt.children && opt.children.length > 0) {
      const result = findOptionPath(opt.children, value, [...path, opt])
      if (result) return result
    }
  }
  return null
}

// [计算属性] 选中项的完整路径
const selectedPath = computed(() => {
  if (!props.modelValue) return []
  return findOptionPath(props.options, props.modelValue) || []
})

// ==================== Computed ====================
const currentOption = computed(() => {
  // 如果有路径，取最后一个作为当前选项
  if (selectedPath.value.length > 0) {
    return selectedPath.value[selectedPath.value.length - 1]
  }
  return undefined
})

// [计算属性] 所有选中的 Checkbox 选项 (用于 Tag 回显)
const checkedOptions = computed(() => {
  if (!props.multiple) return []

  const results: SelectOption[] = []

  const traverse = (opts: OptionItem[]) => {
    opts.forEach(opt => {
      if (!isSelectOption(opt)) return

      // 如果是 checkbox 且已选中，加入结果
      if (opt.type === 'checkbox' && opt.checked) {
        results.push(opt)
      }

      // 递归查找子菜单
      if (opt.children && opt.children.length > 0) {
        traverse(opt.children)
      }
    })
  }

  traverse(props.options)
  return results
})

// 处理 Tag 移除
const handleTagRemove = (option: SelectOption) => {
  if (props.disabled) return
  // 触发 check 事件，将 checked 置为 false
  emit('check', option.value, false)
}

const dropdownId = computed(() => `dropdown-${Math.random().toString(36).substr(2, 9)}`)

// ==================== Composables ====================
const {
  dropdownStyle,
  arrowStyle,
  arrowPlacementClass,
  currentPlacement, // [新增] 获取当前定位方向
  throttledUpdatePosition,
  resetCache,
} = usePosition({
  isOpen,
  selectRef,
  dropdownRef,
  showArrow: computed(() => props.showArrow),
  dropdownMinWidth: computed(() => props.dropdownMinWidth),
  placement: computed(() => props.placement),
})

// 集成 disableTypeAhead
const { handleKeydown, initFocusedIndex } = useKeyboardNav({
  // 注意：键盘导航必须基于 filteredOptions (过滤后的列表)
  options: filteredOptions,
  layout: toRef(props, 'layout'),
  isOpen,
  focusedIndex,
  disabled: toRef(props, 'disabled'),
  modelValue: toRef(props, 'modelValue'),
  dropdownScrollRef,
  // 键盘选择时通过 value 查找完整选项对象
  onSelect: (value: string) => {
    const option = filteredOptions.value.find(opt => isSelectOption(opt) && opt.value === value) as
      | SelectOption
      | undefined
    if (option) handleSelect(option)
  },
  // 当 filterable 为 true (开启搜索) 时，禁用 Type-ahead
  disableTypeAhead: toRef(props, 'filterable'),
})

// ==================== 交互逻辑 ====================

// 处理搜索输入更新
const handleSearchUpdate = (val: string) => {
  searchQuery.value = val
  // 如果输入了内容，自动打开菜单
  if (val && !isOpen.value) {
    isOpen.value = true
  }
  // 输入时重置高亮，并尝试高亮第一个匹配结果
  nextTick(() => {
    if (val && filteredOptions.value.length > 0) {
      const firstValid = filteredOptions.value.findIndex((_, i) =>
        isValidOption(filteredOptions.value, i)
      )
      if (firstValid !== -1) focusedIndex.value = firstValid
    }
  })
}

// 处理选项选择（分流处理）
function handleSelect(option: SelectOption) {
  if (props.disabled || option.disabled) return

  const { value, type, checked, group } = option

  switch (type) {
    case 'checkbox':
      // 触发 check 事件，由父组件更新 options 中该项的 checked 状态
      emit('check', value, !checked)
      // 保持菜单开启
      break

    case 'radio':
      // 已选中则忽略
      if (checked) return
      emit('radio-change', group || 'default', value)
      // 保持菜单开启
      break

    default:
      // 默认类型：触发选中事件并关闭菜单
      emit('update:modelValue', value)
      emit('change', value)
      // [重要] 选中后清空搜索词，恢复展示态 (Label 显示)
      searchQuery.value = ''
      isOpen.value = false
      break
  }
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('change', '')
  emit('clear')
  // 同时清空搜索词
  searchQuery.value = ''
}

// 控制函数 - 供 customTrigger slot 使用
const openDropdown = () => {
  if (props.disabled) return
  isOpen.value = true
}

const closeDropdown = () => {
  isOpen.value = false
}

const toggleDropdown = () => {
  if (props.disabled) return
  // 在 customTrigger 模式或 click 模式下允许切换
  if (props.customTrigger || props.trigger === 'click') {
    isOpen.value = !isOpen.value
  }
}

// ... 定时器清理 ...
const clearAllTimers = () => {
  if (hoverTimer) clearTimeout(hoverTimer)
  if (leaveTimer) clearTimeout(leaveTimer)
  hoverTimer = undefined
  leaveTimer = undefined
}

// ... 鼠标事件 ...
const handleMouseEnter = () => {
  if (props.disabled || props.trigger !== 'hover') return
  clearTimeout(leaveTimer)
  hoverTimer = setTimeout(() => (isOpen.value = true), props.hoverDelay)
}

const handleMouseLeave = () => {
  if (props.trigger !== 'hover') return
  clearTimeout(hoverTimer)
  leaveTimer = setTimeout(() => (isOpen.value = false), POSITION_CONFIG.HOVER_LEAVE_DELAY)
}

const handleDropdownEnter = () => {
  if (props.trigger === 'hover') clearTimeout(leaveTimer)
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Node
  const isTrigger = selectRef.value && selectRef.value.contains(target)
  const isDropdown = dropdownRef.value && dropdownRef.value.contains(target)
  if (!isTrigger && !isDropdown) isOpen.value = false
}

// ==================== 监听器 ====================
watch(isOpen, val => {
  if (val) {
    throttledUpdatePosition()
    window.addEventListener('scroll', throttledUpdatePosition, true)
    window.addEventListener('resize', throttledUpdatePosition)
    // 打开时，如果不在搜索中，初始化高亮选中项
    if (!searchQuery.value) initFocusedIndex()
  } else {
    window.removeEventListener('scroll', throttledUpdatePosition, true)
    window.removeEventListener('resize', throttledUpdatePosition)
    resetCache()
    focusedIndex.value = -1
    // 关闭时清空搜索词，保持状态纯净
    if (props.filterable) searchQuery.value = ''
  }
})

watch(
  () => props.options,
  () => {
    resetCache()
    if (isOpen.value) throttledUpdatePosition()
  },
  { deep: true }
)

watch(
  () => props.modelValue,
  () => {
    if (isOpen.value && !searchQuery.value) {
      initFocusedIndex()
    }
  }
)

// ==================== 生命周期 ====================

// 动态管理 click 外部监听器
const setupClickListener = () => {
  document.addEventListener('click', handleClickOutside)
}

const removeClickListener = () => {
  document.removeEventListener('click', handleClickOutside)
}

// 监听 trigger 变化，动态切换事件监听
watch(
  () => props.trigger,
  (newTrigger, oldTrigger) => {
    if (oldTrigger === 'click' && newTrigger !== 'click') {
      // 从 click 切换到 hover：移除 click 监听
      removeClickListener()
    } else if (oldTrigger !== 'click' && newTrigger === 'click') {
      // 从 hover 切换到 click：添加 click 监听
      setupClickListener()
    }
  }
)

onMounted(() => {
  if (props.trigger === 'click') setupClickListener()
})

onUnmounted(() => {
  removeClickListener() // 总是移除，避免内存泄漏
  window.removeEventListener('scroll', throttledUpdatePosition, true)
  window.removeEventListener('resize', throttledUpdatePosition)
  throttledUpdatePosition.cancel()
  clearAllTimers()
})

// ==================== 类型导出 ====================
export type { SelectOption, DividerOption, OptionItem, TriggerMode, PlacementPosition }
</script>

<template>
  <div
    ref="selectRef"
    class="custom-select"
    :class="{ 'is-disabled': disabled, 'custom-trigger-mode': customTrigger }"
    :style="{ width: customTrigger ? 'auto' : triggerWidth }"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 自定义触发器模式 -->
    <div v-if="customTrigger" class="custom-trigger-wrapper">
      <slot
        name="trigger"
        :is-open="isOpen"
        :current-option="currentOption"
        :open="openDropdown"
        :close="closeDropdown"
        :toggle="toggleDropdown"
      />
    </div>

    <!-- 默认触发器 -->
    <SelectTrigger
      v-else
      :is-open="isOpen"
      :current-option="currentOption"
      :placeholder="placeholder"
      :show-arrow="showArrow"
      :disabled="disabled"
      :dropdown-id="dropdownId"
      :focused-index="focusedIndex"
      :clearable="clearable"
      :filterable="filterable"
      :search-query="searchQuery"
      :search-placeholder="searchPlaceholder"
      :multiple="multiple"
      :selected-options="checkedOptions"
      :show-path="showPath"
      :selected-path="selectedPath"
      @update:search-query="handleSearchUpdate"
      @clear="handleClear"
      @toggle="toggleDropdown"
      @keydown="handleKeydown"
      @remove-tag="handleTagRemove"
    >
      <template #default="slotProps">
        <slot
          name="trigger"
          :is-open="isOpen"
          :current-option="currentOption"
          :open="openDropdown"
          :close="closeDropdown"
          :toggle="toggleDropdown"
          v-bind="slotProps"
        />
      </template>
    </SelectTrigger>

    <Teleport to="body">
      <transition name="dropdown">
        <SelectDropdown
          v-if="isOpen"
          ref="dropdownComponentRef"
          :dropdown-id="dropdownId"
          :class="[`placement-${currentPlacement}`]"
          :dropdown-style="dropdownStyle"
          :arrow-style="arrowStyle"
          :arrow-placement-class="arrowPlacementClass"
          :show-arrow="showArrow"
          :layout="layout"
          :options="filteredOptions"
          :model-value="modelValue"
          :focused-index="focusedIndex"
          :empty-text="emptyText"
          :dropdown-max-height="dropdownMaxHeight"
          :search-query="searchQuery"
          @mouseenter="handleDropdownEnter"
          @mouseleave="handleMouseLeave"
          @update:focused-index="focusedIndex = $event"
          @select="handleSelect"
        >
          <template v-if="$slots.header" #header>
            <slot name="header" />
          </template>
          <template v-if="$slots.option" #option="slotProps">
            <slot name="option" v-bind="slotProps" />
          </template>
          <template v-if="$slots.footer" #footer>
            <slot name="footer" />
          </template>
        </SelectDropdown>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.custom-select {
  position: relative;
  font-family: var(--font-family-base);
}

.custom-select.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* ==================== 过渡动画 ==================== */
.dropdown-enter-active {
  /* 弹性进入：稍微过冲再回弹 */
  transition:
    opacity 0.2s ease,
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dropdown-leave-active {
  transition:
    opacity 0.1s ease,
    transform 0.1s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
}

/* 根据方向设置动画起点 */
/* 底部弹出：从上方滑入 */
.placement-bottomLeft.dropdown-enter-from,
.placement-bottomCenter.dropdown-enter-from,
.placement-bottomRight.dropdown-enter-from,
.placement-bottomLeft.dropdown-leave-to,
.placement-bottomCenter.dropdown-leave-to,
.placement-bottomRight.dropdown-leave-to {
  transform: translateY(-8px) scaleY(0.96);
}

/* 顶部弹出：从下方滑入 */
.placement-topLeft.dropdown-enter-from,
.placement-topCenter.dropdown-enter-from,
.placement-topRight.dropdown-enter-from,
.placement-topLeft.dropdown-leave-to,
.placement-topCenter.dropdown-leave-to,
.placement-topRight.dropdown-leave-to {
  transform: translateY(8px) scaleY(0.96);
}

/* ==================== 样式变体支持 ==================== */
.custom-select.sm :deep(.select-trigger) {
  height: var(--height-xs);
  padding: var(--space-1) var(--space-2);
  font-size: var(--text-xs);
  --trigger-height: var(--height-xs);
  --text-size: var(--text-xs);
}

.custom-select.lg :deep(.select-trigger) {
  height: var(--height-lg);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  --trigger-height: var(--height-lg);
  --text-size: var(--text-base);
}

.custom-select.ghost :deep(.select-trigger) {
  background: transparent;
  border: 1px solid transparent;
}

.custom-select.ghost :deep(.select-trigger):hover {
  background: var(--bg-hover);
  border-color: var(--border-glass);
}

.custom-select.primary :deep(.select-trigger) {
  background: var(--color-primary-alpha);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.custom-select.error :deep(.select-trigger) {
  border-color: var(--color-danger);
}

.custom-select.success :deep(.select-trigger) {
  border-color: var(--color-success);
}

.custom-select:focus-within :deep(.select-trigger) {
  outline: none;
}
</style>
