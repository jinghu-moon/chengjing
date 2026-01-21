<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { IconChevronRight, IconCheck } from '@tabler/icons-vue'
import { useSubmenuPosition } from '../composables/useSubmenuPosition'
import { isSelectOption, type OptionItem, type SelectOption, type DividerOption } from '../types'
// [修复1] 显式导入自身，确保递归引用万无一失
import SubmenuPanel from './SubmenuPanel.vue'

// ==================== Props ====================
const props = defineProps<{
  options: OptionItem[]
  modelValue: string
  parentRect: DOMRect
  triggerItemRect: DOMRect
  level: number
}>()

const emit = defineEmits<{
  select: [option: SelectOption] // 传递完整选项对象
  close: []
  mouseenter: []
  mouseleave: []
}>()

// ==================== State ====================
const submenuRef = ref<HTMLElement | null>(null)
const activeSubmenuIndex = ref<number>(-1)
const focusedIndex = ref<number>(-1)
const isNestedSubmenuHovered = ref(false)

// 延迟定时器
let closeTimer: ReturnType<typeof setTimeout> | undefined
let openTimer: ReturnType<typeof setTimeout> | undefined

// X 轴趋势检测
let lastMouseX = 0
let mouseMovingRight = false
const X_THRESHOLD = 5

// 延迟配置
const DELAY_FAST = 50
const DELAY_SLOW = 200
const CLOSE_DELAY = 100

// ==================== Composables ====================
const { submenuStyle, updateSubmenuPosition, currentPlacement } = useSubmenuPosition()

// ==================== 清理定时器 ====================
const clearTimers = () => {
  if (closeTimer) clearTimeout(closeTimer)
  if (openTimer) clearTimeout(openTimer)
  closeTimer = undefined
  openTimer = undefined
}

onUnmounted(clearTimers)

// ==================== X 轴趋势检测 ====================
const handleSubmenuMouseMove = (e: MouseEvent) => {
  const deltaX = e.clientX - lastMouseX
  mouseMovingRight = deltaX > X_THRESHOLD
  lastMouseX = e.clientX
}

// ==================== 子菜单尺寸估算 ====================
const estimateSubmenuSize = () => {
  const itemHeight = 32
  const padding = 12
  const height = Math.min(props.options.length * itemHeight + padding * 2, 300)
  const width = 180
  return { width, height }
}

// ==================== 位置更新 ====================
const updatePosition = async () => {
  await nextTick()
  if (!submenuRef.value) return

  const actualRect = submenuRef.value.getBoundingClientRect()
  const viewport = { width: window.innerWidth, height: window.innerHeight }

  await updateSubmenuPosition({
    parentRect: props.parentRect,
    triggerItemRect: props.triggerItemRect,
    submenuSize: {
      width: actualRect.width || estimateSubmenuSize().width,
      height: actualRect.height || estimateSubmenuSize().height,
    },
    viewport,
    level: props.level,
  })
}

// ==================== 交互处理 ====================
const handleItemClick = (opt: OptionItem) => {
  if (!isSelectOption(opt) || opt.disabled) return

  if (opt.children && opt.children.length > 0) {
    return
  }

  emit('select', opt)
}

const handleItemMouseEnter = (index: number) => {
  clearTimers()

  const opt = props.options[index]
  focusedIndex.value = index

  if (!isSelectOption(opt)) return

  if (opt.children && opt.children.length > 0) {
    const delay = activeSubmenuIndex.value >= 0 ? 0 : DELAY_FAST
    openTimer = setTimeout(() => {
      activeSubmenuIndex.value = index
    }, delay)
  } else {
    if (mouseMovingRight && activeSubmenuIndex.value >= 0) {
      closeTimer = setTimeout(() => {
        if (!isNestedSubmenuHovered.value) {
          activeSubmenuIndex.value = -1
        }
      }, DELAY_SLOW)
    } else if (activeSubmenuIndex.value >= 0 && !isNestedSubmenuHovered.value) {
      closeTimer = setTimeout(() => {
        if (!isNestedSubmenuHovered.value) {
          activeSubmenuIndex.value = -1
        }
      }, DELAY_FAST)
    }
  }
}

const handleItemMouseLeave = () => {
  clearTimers()

  closeTimer = setTimeout(() => {
    if (!isNestedSubmenuHovered.value) {
      activeSubmenuIndex.value = -1
    }
  }, CLOSE_DELAY)
}

const handleSubmenuMouseEnter = () => {
  clearTimers()
  emit('mouseenter')
}

const handleSubmenuMouseLeave = () => {
  emit('mouseleave')
}

const handleNestedSubmenuEnter = () => {
  clearTimers()
  isNestedSubmenuHovered.value = true
  emit('mouseenter')
}

const handleNestedSubmenuLeave = () => {
  isNestedSubmenuHovered.value = false
  clearTimers()
  emit('mouseleave')

  closeTimer = setTimeout(() => {
    activeSubmenuIndex.value = -1
  }, CLOSE_DELAY)
}

const handleNestedSelect = (option: SelectOption) => {
  clearTimers()
  emit('select', option)
}

const handleNestedClose = () => {
  activeSubmenuIndex.value = -1
}

// 获取触发项的矩形
const getTriggerItemRect = (index: number): DOMRect | null => {
  if (!submenuRef.value) return null
  const item = submenuRef.value.querySelector(`[data-index="${index}"]`) as HTMLElement
  return item?.getBoundingClientRect() ?? null
}

// 获取当前子菜单的矩形
const getSubmenuRect = (): DOMRect | null => {
  return submenuRef.value?.getBoundingClientRect() ?? null
}

// ==================== 生命周期 ====================
onMounted(() => {
  updatePosition()
})

watch(
  () => [props.parentRect, props.triggerItemRect],
  () => {
    updatePosition()
  },
  { deep: true }
)
</script>

<template>
  <div
    ref="submenuRef"
    class="submenu-panel"
    :style="submenuStyle"
    @mouseenter="handleSubmenuMouseEnter"
    @mouseleave="handleSubmenuMouseLeave"
  >
    <div class="submenu-scroll" @mousemove="handleSubmenuMouseMove">
      <template v-for="(opt, idx) in options" :key="idx">
        <div
          v-if="opt.value === 'divider' && (opt as DividerOption).label"
          class="submenu-group-label"
        >
          <span>{{ (opt as DividerOption).label }}</span>
        </div>

        <div v-else-if="opt.value === 'divider'" class="submenu-divider" />

        <div
          v-else
          class="submenu-item"
          :class="{
            selected: modelValue === opt.value,
            focused: focusedIndex === idx,
            disabled: (opt as SelectOption).disabled,
            'has-children': (opt as SelectOption).children?.length,
          }"
          :data-index="idx"
          @mouseenter="handleItemMouseEnter(idx)"
          @mouseleave="handleItemMouseLeave()"
          @click="handleItemClick(opt)"
        >
          <div class="item-content">
            <component
              :is="(opt as SelectOption).prefixIcon"
              v-if="(opt as SelectOption).prefixIcon"
              :size="14"
              class="item-icon"
            />
            <span class="item-label">{{ (opt as SelectOption).label }}</span>
          </div>

          <div class="item-suffix">
            <span v-if="(opt as SelectOption).shortcut" class="item-shortcut">
              {{ (opt as SelectOption).shortcut }}
            </span>
            <IconCheck
              v-if="modelValue === opt.value && !(opt as SelectOption).children?.length"
              :size="14"
              class="check-icon"
            />
            <IconChevronRight
              v-if="(opt as SelectOption).children?.length"
              :size="14"
              class="arrow-icon"
            />
          </div>
        </div>

        <Teleport to="body">
          <Transition
            :name="currentPlacement === 'right' ? 'submenu-slide-right' : 'submenu-slide-left'"
          >
            <SubmenuPanel
              v-if="
                isSelectOption(opt) &&
                opt.children?.length &&
                activeSubmenuIndex === idx &&
                getSubmenuRect() &&
                getTriggerItemRect(idx)
              "
              :options="opt.children"
              :model-value="modelValue"
              :parent-rect="getSubmenuRect()!"
              :trigger-item-rect="getTriggerItemRect(idx)!"
              :level="level + 1"
              @mouseenter="handleNestedSubmenuEnter"
              @mouseleave="handleNestedSubmenuLeave"
              @select="handleNestedSelect"
              @close="handleNestedClose"
            />
          </Transition>
        </Teleport>
      </template>
    </div>
  </div>
</template>

<style scoped>
.submenu-panel {
  background: var(--bg-panel-dark);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: var(--border-glass);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  min-width: 150px;
  max-width: 280px;
  overflow: visible;
}

.submenu-scroll {
  padding: 4px;
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
}

.submenu-scroll::-webkit-scrollbar {
  width: 4px;
}

.submenu-scroll::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 2px;
}

.submenu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.12s ease;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  gap: 8px;
}

.submenu-item:hover:not(.disabled),
.submenu-item.focused:not(.disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.submenu-item.selected:not(.has-children) {
  background: var(--color-primary-alpha);
  color: var(--color-primary);
}

.submenu-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.item-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-suffix {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.item-icon {
  flex-shrink: 0;
  color: var(--text-tertiary);
}

.submenu-item.selected .item-icon {
  color: var(--color-primary);
}

.item-shortcut {
  font-size: 10px;
  color: var(--text-tertiary);
  font-family: var(--font-family-mono, monospace);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  padding: 1px 4px;
}

.check-icon {
  color: var(--color-primary);
}

.arrow-icon {
  color: var(--text-tertiary);
}

.submenu-item.focused .arrow-icon {
  color: var(--text-primary);
}

.submenu-group-label {
  display: flex;
  align-items: center;
  padding: 6px 8px 4px;
  margin-top: 4px;
  gap: 8px;
}

.submenu-group-label:first-child {
  margin-top: 0;
}

.submenu-group-label span {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.submenu-group-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-divider);
}

.submenu-divider {
  height: 1px;
  background: var(--border-divider);
  margin: 4px 0;
}

/* ==================== 动画样式 (修复核心) ==================== */

/* 1. 子菜单在右侧 (submenu-slide-right) */
.submenu-slide-right-enter-active,
.submenu-slide-right-leave-active {
  transition:
    opacity 0.2s cubic-bezier(0.2, 0, 0.2, 1),
    transform 0.2s cubic-bezier(0.2, 0, 0.2, 1);
  pointer-events: none;
}

/* 使用 !important 确保 transform 不被内联样式覆盖 */
.submenu-slide-right-enter-from,
.submenu-slide-right-leave-to {
  opacity: 0 !important;
  transform: translateX(-12px) scale(0.96) !important;
}

/* 2. 子菜单在左侧 (submenu-slide-left) */
.submenu-slide-left-enter-active,
.submenu-slide-left-leave-active {
  transition:
    opacity 0.2s cubic-bezier(0.2, 0, 0.2, 1),
    transform 0.2s cubic-bezier(0.2, 0, 0.2, 1);
  pointer-events: none;
}

.submenu-slide-left-enter-from,
.submenu-slide-left-leave-to {
  opacity: 0 !important;
  transform: translateX(12px) scale(0.96) !important;
}
</style>
