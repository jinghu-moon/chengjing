<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'
import { IconCheck, IconDatabaseOff, IconChevronRight } from '@tabler/icons-vue'
import type { CSSProperties } from 'vue'
import SubmenuPanel from './SubmenuPanel.vue'
import {
  isSelectOption,
  GRID_COLUMNS,
  type OptionItem,
  type SelectOption,
  type DividerOption,
} from '../types'

// 暴露 DOM 引用给父组件
const dropdownEl = ref<HTMLElement | null>(null)
const scrollEl = ref<HTMLElement | null>(null)

defineExpose({
  dropdownEl,
  scrollEl,
})

const props = defineProps<{
  dropdownId: string
  dropdownStyle: CSSProperties
  arrowStyle: { left: string; top: string; bottom: string }
  arrowPlacementClass: string
  showArrow: boolean
  layout: 'list' | 'grid'
  options: OptionItem[]
  modelValue: string
  focusedIndex: number
  emptyText?: string
  dropdownMaxHeight?: string | number
  // [新增] 接收搜索词
  searchQuery?: string
}>()

const emit = defineEmits<{
  mouseenter: []
  mouseleave: []
  'update:focusedIndex': [index: number]
  select: [option: SelectOption] // 传递完整选项对象
}>()

// ==================== 子菜单状态 ====================
const activeSubmenuIndex = ref<number>(-1)
const itemRefs = ref<Map<number, HTMLElement>>(new Map())
const isSubmenuHovered = ref(false)

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

// ==================== 高亮处理逻辑 ====================
const highlightLabel = (label: string | undefined) => {
  if (!label) return ''
  // 如果没有搜索词，直接返回原文本
  if (!props.searchQuery) return label

  // 转义正则特殊字符，防止报错
  const escapedQuery = props.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedQuery})`, 'gi')

  // 将匹配部分包裹在高亮标签中
  return label.replace(regex, '<span class="text-highlight">$1</span>')
}

// ==================== 计算属性 ====================
const scrollStyle = computed(() => {
  const style: CSSProperties = {}
  if (props.layout === 'grid') {
    style.gridTemplateColumns = `repeat(${GRID_COLUMNS}, 1fr)`
  }

  if (props.dropdownMaxHeight) {
    const heightVal =
      typeof props.dropdownMaxHeight === 'number'
        ? `${props.dropdownMaxHeight}px`
        : props.dropdownMaxHeight
    style.maxHeight = heightVal
  }

  return style
})

// 检测选项列表中是否有任何 prefixIcon（用于图标占位对齐）
const hasAnyPrefixIcon = computed(() => {
  return props.options.some(opt => isSelectOption(opt) && opt.prefixIcon)
})

// ==================== 清理定时器 ====================
const clearTimers = () => {
  if (closeTimer) clearTimeout(closeTimer)
  if (openTimer) clearTimeout(openTimer)
  closeTimer = undefined
  openTimer = undefined
}

onUnmounted(clearTimers)

// ==================== X 轴趋势检测 ====================
const handleDropdownMouseMove = (e: MouseEvent) => {
  const deltaX = e.clientX - lastMouseX
  mouseMovingRight = deltaX > X_THRESHOLD
  lastMouseX = e.clientX
}

// ==================== 事件处理 ====================
const handleItemClick = (opt: OptionItem) => {
  if (!isSelectOption(opt) || opt.disabled) return

  if (opt.children && opt.children.length > 0) {
    return
  }

  emit('select', opt)
}

// [新增] 分组全选逻辑
const handleGroupClick = (index: number) => {
  const groupItems: SelectOption[] = []

  // 1. 收集该分组下的所有可用 Checkbox
  for (let i = index + 1; i < props.options.length; i++) {
    const opt = props.options[i]
    // 遇到下一个分割线停止
    if (opt.value === 'divider') break

    // 只收集未禁用的 Checkbox
    if (isSelectOption(opt) && opt.type === 'checkbox' && !opt.disabled) {
      groupItems.push(opt)
    }
  }

  if (groupItems.length === 0) return

  // 2. 判定目标状态：如果全部已选，则取消全选；否则全选
  const allChecked = groupItems.every(item => item.checked)
  const targetState = !allChecked

  // 3. 触发变更
  groupItems.forEach(item => {
    // 只有状态不一致时才触发切换
    if (item.checked !== targetState) {
      emit('select', item)
    }
  })
}

const handleItemMouseEnter = (index: number) => {
  clearTimers()

  const opt = props.options[index]
  emit('update:focusedIndex', index)

  if (!isSelectOption(opt)) return

  if (opt.children && opt.children.length > 0) {
    const delay = activeSubmenuIndex.value >= 0 ? 0 : DELAY_FAST
    openTimer = setTimeout(() => {
      activeSubmenuIndex.value = index
    }, delay)
  } else {
    if (mouseMovingRight && activeSubmenuIndex.value >= 0) {
      closeTimer = setTimeout(() => {
        if (!isSubmenuHovered.value) {
          activeSubmenuIndex.value = -1
        }
      }, DELAY_SLOW)
    } else if (activeSubmenuIndex.value >= 0 && !isSubmenuHovered.value) {
      closeTimer = setTimeout(() => {
        if (!isSubmenuHovered.value) {
          activeSubmenuIndex.value = -1
        }
      }, DELAY_FAST)
    }
  }
}

const handleItemMouseLeave = () => {
  clearTimers()

  closeTimer = setTimeout(() => {
    if (!isSubmenuHovered.value) {
      activeSubmenuIndex.value = -1
    }
  }, CLOSE_DELAY)
}

// 子菜单 hover 事件
const handleSubmenuEnter = () => {
  clearTimers()
  isSubmenuHovered.value = true
  emit('mouseenter')
}

const handleSubmenuLeave = () => {
  isSubmenuHovered.value = false
  clearTimers()
  emit('mouseleave')

  closeTimer = setTimeout(() => {
    activeSubmenuIndex.value = -1
  }, CLOSE_DELAY)
}

const handleSubmenuSelect = (option: SelectOption) => {
  clearTimers()
  emit('select', option)
  activeSubmenuIndex.value = -1
}

// 获取菜单项元素的引用
const setItemRef = (index: number, el: HTMLElement | null) => {
  if (el) {
    itemRefs.value.set(index, el)
  } else {
    itemRefs.value.delete(index)
  }
}

// 获取触发项的矩形
const getTriggerItemRect = (index: number): DOMRect | null => {
  const el = itemRefs.value.get(index)
  return el?.getBoundingClientRect() ?? null
}

// 获取下拉框的矩形
const getDropdownRect = (): DOMRect | null => {
  return dropdownEl.value?.getBoundingClientRect() ?? null
}

// 判断选项是否有子菜单
const hasChildren = (opt: OptionItem): boolean => {
  return isSelectOption(opt) && !!opt.children && opt.children.length > 0
}

// ==================== 辅助函数 ====================
const getMergeClass = (opt: OptionItem, index: number) => {
  if (!isSelectOption(opt) || !opt.checked) return {}

  const prev = props.options[index - 1]
  const next = props.options[index + 1]

  // 检查前一个和后一个是否也是选中的选项
  const isPrevChecked = prev && isSelectOption(prev) && prev.checked
  const isNextChecked = next && isSelectOption(next) && next.checked

  if (isPrevChecked && isNextChecked) return { 'is-middle': true }
  if (isNextChecked) return { 'is-first': true }
  if (isPrevChecked) return { 'is-last': true }
  return { 'is-solo': true }
}

// ==================== 动画方向判断 ====================
const getTransitionName = (parentRect: DOMRect | null) => {
  if (!parentRect) return 'submenu-slide-right'
  const spaceRight = window.innerWidth - parentRect.right
  const ESTIMATED_SUBMENU_WIDTH = 180
  return spaceRight > ESTIMATED_SUBMENU_WIDTH ? 'submenu-slide-right' : 'submenu-slide-left'
}
</script>

<template>
  <div
    :id="dropdownId"
    ref="dropdownEl"
    class="select-dropdown"
    :style="dropdownStyle"
    role="listbox"
    @mouseenter="$emit('mouseenter')"
    @mouseleave="$emit('mouseleave')"
  >
    <div v-if="showArrow" class="dropdown-arrow" :class="arrowPlacementClass" :style="arrowStyle" />

    <div v-if="$slots.header" class="dropdown-header">
      <slot name="header" />
    </div>

    <div class="scroll-wrapper">
      <div
        ref="scrollEl"
        class="dropdown-scroll"
        :class="[layout]"
        :style="scrollStyle"
        @mousemove="handleDropdownMouseMove"
      >
        <div v-if="options.length === 0" class="dropdown-empty">
          <IconDatabaseOff :size="20" />
          <span>{{ emptyText || '暂无数据' }}</span>
        </div>

        <template v-for="(opt, idx) in options" v-else :key="idx">
          <div
            v-if="opt.value === 'divider' && (opt as DividerOption).label"
            class="dropdown-group-label"
            :class="{ 'is-grid': layout === 'grid' }"
            title="点击全选/取消全选该组"
            @click="handleGroupClick(idx)"
          >
            <span>{{ (opt as DividerOption).label }}</span>
          </div>

          <div
            v-else-if="opt.value === 'divider'"
            class="dropdown-divider-simple"
            :class="{ 'is-grid': layout === 'grid' }"
          />

          <div
            v-else
            :id="`${dropdownId}-option-${idx}`"
            :ref="el => setItemRef(idx, el as HTMLElement | null)"
            class="dropdown-item"
            :class="{
              selected: modelValue === opt.value,
              focused: focusedIndex === idx,
              disabled: (opt as SelectOption).disabled,
              'is-grid': layout === 'grid',
              'has-children': hasChildren(opt),
              'is-danger': (opt as SelectOption).danger,
              'is-checkbox': (opt as SelectOption).type === 'checkbox',
              'is-radio': (opt as SelectOption).type === 'radio',
              'is-checked': (opt as SelectOption).checked,
              ...getMergeClass(opt, idx),
            }"
            :role="
              (opt as SelectOption).type === 'checkbox'
                ? 'menuitemcheckbox'
                : (opt as SelectOption).type === 'radio'
                  ? 'menuitemradio'
                  : 'option'
            "
            :aria-selected="modelValue === opt.value"
            :aria-checked="
              (opt as SelectOption).type === 'checkbox' || (opt as SelectOption).type === 'radio'
                ? (opt as SelectOption).checked
                : undefined
            "
            :aria-haspopup="hasChildren(opt) ? 'menu' : undefined"
            @mouseenter="handleItemMouseEnter(idx)"
            @mouseleave="handleItemMouseLeave()"
            @click.stop="handleItemClick(opt)"
          >
            <slot name="option" :option="opt" :selected="modelValue === opt.value">
              <div v-if="layout === 'grid'" class="grid-content">
                <component
                  :is="(opt as SelectOption).prefixIcon"
                  v-if="(opt as SelectOption).prefixIcon"
                  :size="24"
                  class="grid-icon"
                />
                <span v-else class="grid-initial">
                  {{ (opt as SelectOption).label?.slice(0, 1) || '?' }}
                </span>
              </div>

              <template v-else>
                <div class="item-left">
                  <!-- Checkbox 图标 -->
                  <div
                    v-if="(opt as SelectOption).type === 'checkbox'"
                    class="type-icon checkbox-icon"
                    :class="{ checked: (opt as SelectOption).checked }"
                  >
                    <svg
                      v-if="(opt as SelectOption).checked"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.5 4.5L6 12L2.5 8.5"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <!-- Radio 图标 -->
                  <div
                    v-else-if="(opt as SelectOption).type === 'radio'"
                    class="type-icon radio-icon"
                    :class="{ checked: (opt as SelectOption).checked }"
                  >
                    <div v-if="(opt as SelectOption).checked" class="radio-dot" />
                  </div>
                  <!-- 有图标：渲染图标 -->
                  <component
                    :is="(opt as SelectOption).prefixIcon"
                    v-else-if="(opt as SelectOption).prefixIcon"
                    :size="16"
                    class="item-icon prefix"
                  />
                  <!-- 无图标但列表中有其他图标：渲染占位 -->
                  <div v-else-if="hasAnyPrefixIcon" class="item-icon-placeholder" />

                  <div class="item-text-content">
                    <span
                      v-if="(opt as SelectOption).label"
                      class="item-label-text"
                      v-html="highlightLabel((opt as SelectOption).label)"
                    >
                    </span>
                    <span v-if="(opt as SelectOption).description" class="item-description">
                      {{ (opt as SelectOption).description }}
                    </span>
                  </div>
                </div>

                <div class="item-right">
                  <!-- 恢复快捷键渲染，使用 dropdown-shortcut 样式 -->
                  <span
                    v-if="(opt as SelectOption).shortcut"
                    class="dropdown-shortcut"
                    style="margin-left: 0"
                  >
                    {{ (opt as SelectOption).shortcut }}
                  </span>
                  <component
                    :is="(opt as SelectOption).suffixIcon"
                    v-if="(opt as SelectOption).suffixIcon"
                    :size="14"
                    class="item-icon suffix"
                  />
                  <IconChevronRight
                    v-if="hasChildren(opt)"
                    :size="14"
                    class="submenu-arrow"
                    :class="{ active: activeSubmenuIndex === idx }"
                  />
                  <!-- 仅对 default 类型显示勾选图标 -->
                  <IconCheck
                    v-else-if="!(opt as SelectOption).type && modelValue === opt.value"
                    :size="16"
                    color="var(--color-primary)"
                    class="check-icon"
                  />
                </div>
              </template>
            </slot>

            <Teleport to="body">
              <Transition :name="getTransitionName(getDropdownRect())">
                <SubmenuPanel
                  v-if="
                    hasChildren(opt) &&
                    activeSubmenuIndex === idx &&
                    getDropdownRect() &&
                    getTriggerItemRect(idx)
                  "
                  :options="(opt as SelectOption).children!"
                  :model-value="modelValue"
                  :parent-rect="getDropdownRect()!"
                  :trigger-item-rect="getTriggerItemRect(idx)!"
                  :level="1"
                  @mouseenter="handleSubmenuEnter"
                  @mouseleave="handleSubmenuLeave"
                  @select="handleSubmenuSelect"
                  @close="activeSubmenuIndex = -1"
                />
              </Transition>
            </Teleport>
          </div>
        </template>
      </div>
    </div>

    <div v-if="$slots.footer" class="dropdown-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.select-dropdown {
  width: max-content;
  background: var(--bg-panel-dark);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: var(--border-glass);
  border-radius: var(--radius-ml);
  box-shadow: var(--shadow-md);
  overflow: visible;
  will-change: transform, opacity;
  display: flex;
  flex-direction: column;
  /* 性能隔离：告诉浏览器此元素的布局完全独立 */
  /* [注意] 这里移除了 paint，修复箭头被裁切的问题 */
  contain: layout style;
}

/* ==================== 动画样式 (修复核心) ==================== */
/* 使用 !important 强制覆盖内联样式 */

/* 1. 子菜单在右侧 (submenu-slide-right) */
.submenu-slide-right-enter-active,
.submenu-slide-right-leave-active {
  transition:
    opacity 0.2s cubic-bezier(0.2, 0, 0.2, 1),
    transform 0.2s cubic-bezier(0.2, 0, 0.2, 1);
  pointer-events: none;
  /* 动画过程中禁止点击 */
}

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

/* ==================== 箭头样式 ==================== */
.dropdown-arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  z-index: 1;
  pointer-events: none;
  transform: translateX(-50%);
}

.dropdown-arrow::before {
  content: ' ';
  position: absolute;
  width: 10px;
  height: 10px;
  z-index: -1;
  box-sizing: border-box;
  transform: rotate(45deg);
  border: var(--border-glass);
  border-top-left-radius: 2px;
}

.dropdown-arrow::after {
  content: '';
  position: absolute;
  width: 11.41px;
  height: 1px;
  left: 50%;
  transform: translateX(-50%);
  background: #2d333f;
  z-index: -1;
}

.arrow-top::before {
  background: linear-gradient(135deg, var(--bg-panel-dark) 50%, transparent 50%);
  border-bottom-color: transparent !important;
  border-right-color: transparent !important;
  background-origin: border-box;
}

.arrow-top::after {
  bottom: 5px;
  clip-path: polygon(0% 100%, 1px 0%, calc(100% - 1px) 0%, 100% 100%);
}

.arrow-bottom::before {
  background: linear-gradient(135deg, transparent 50%, var(--bg-panel-dark) 50%);
  border-top-color: transparent !important;
  border-left-color: transparent !important;
  border-bottom-right-radius: 2px;
  background-origin: border-box;
}

.arrow-bottom::after {
  top: 5px;
  clip-path: polygon(0% 0%, 1px 100%, calc(100% - 1px) 100%, 100% 0%);
}

/* ==================== 滚动区域包装（裁剪超出圆角的内容） ==================== */
.scroll-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: var(--radius-ml);
}

/* ==================== 滚动区域 ==================== */
.dropdown-scroll {
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px;
  height: 100%;
}

.dropdown-scroll.grid {
  display: grid;
  gap: 8px;
  padding: 12px;
  grid-auto-rows: max-content;
  align-content: start;
  overflow-y: auto;
}

.dropdown-scroll::-webkit-scrollbar {
  width: 6px;
}

.dropdown-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-scroll::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: var(--radius-xs);
  transition: background 0.2s;
}

.dropdown-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* ==================== 空状态 ==================== */
.dropdown-empty {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--text-tertiary);
  font-size: var(--text-xs);
  user-select: none;
}

/* ==================== 选项项样式 ==================== */
.dropdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  min-height: 36px;
  /* 确保单行选项不会过扁 */
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  color: var(--text-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s var(--ease-smooth);
  white-space: nowrap;
  user-select: none;
}

.dropdown-item.is-grid {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 8px;
  aspect-ratio: 1;
  height: auto;
  min-width: 44px;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
}

.grid-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.grid-icon {
  color: var(--text-primary);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.grid-initial {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.dropdown-item.is-grid:hover .grid-icon {
  transform: scale(1.15);
  color: var(--color-primary);
}

.dropdown-item.is-grid.selected {
  background: var(--bg-active);
  box-shadow: inset 0 0 0 1px var(--color-primary-alpha);
}

.dropdown-item.is-grid.selected .grid-icon {
  color: var(--color-primary);
}

/* ==================== Header/Footer ==================== */
.dropdown-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-divider);
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dropdown-footer {
  border-top: 1px solid var(--border-divider);
  padding: 4px;
  background: rgba(0, 0, 0, 0.1);
}

/* ==================== 列表布局项内容 ==================== */
.item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* [新增] 文本内容区域 - 支持主文本 + 描述两行布局 */
.item-text-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
  /* 允许内容收缩 */
  overflow: hidden;
}

.item-label-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 描述文本样式 */
.item-description {
  font-size: 11px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

/* [新增] 高亮文本样式 */
/* 使用 :deep 穿透 v-html 渲染的内容 */
:deep(.text-highlight) {
  color: var(--color-primary);
  font-weight: 600;
  background: rgba(var(--color-primary-rgb, 136, 192, 208), 0.15);
  border-radius: 2px;
  padding: 0 1px;
}

/* 键盘快捷键提示 */
.dropdown-shortcut {
  /* margin-left: auto;  <-- 移除，因为在 flex 容器 item-right 内 */
  margin-right: 8px;
  /* 与右侧图标/边缘保持间距 */
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: var(--font-family-mono);
  /* 等宽字体增强按键感 */
  letter-spacing: 0.5px;
}

.item-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-tertiary);
}

.item-icon {
  flex-shrink: 0;
  display: flex;
}

.item-icon.prefix {
  color: var(--text-secondary);
}

/* 图标占位：保持与图标相同宽度，确保文本对齐 */
.item-icon-placeholder {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.item-icon.suffix {
  color: var(--text-tertiary);
}

.item-shortcut {
  font-size: 10px;
  color: var(--text-tertiary);
  font-family: var(--font-family-mono, monospace);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 1px 5px;
  min-width: 18px;
  text-align: center;
  line-height: 1.4;
  margin-right: 4px;
}

.check-icon {
  flex-shrink: 0;
}

/* ==================== 子菜单相关样式 ==================== */
.submenu-arrow {
  flex-shrink: 0;
  color: var(--text-tertiary);
  transition: all 0.15s ease;
}

.submenu-arrow.active {
  color: var(--text-primary);
  transform: translateX(2px);
}

.dropdown-item.has-children:hover .submenu-arrow,
.dropdown-item.has-children.focused .submenu-arrow {
  color: var(--text-primary);
}

/* ==================== 选中/悬停状态 ==================== */
.dropdown-item:not(.is-grid).selected {
  background: var(--color-primary-alpha);
  color: var(--color-primary);
  font-weight: var(--weight-medium);
}

.dropdown-item:not(.is-grid).selected .item-icon.prefix {
  color: var(--color-primary);
}

.dropdown-item:not(.is-grid).selected .item-shortcut {
  color: var(--color-primary);
  background: var(--color-primary-alpha);
  border-color: rgba(var(--color-primary), 0.2);
}

.dropdown-item:hover:not(.disabled),
.dropdown-item.focused:not(.disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.dropdown-item:active:not(.disabled) {
  background: var(--bg-active);
  transform: scale(0.98);
}

.dropdown-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

/* ==================== 危险操作样式 ==================== */
.dropdown-item.is-danger {
  color: var(--color-danger, #ef4444);
}

.dropdown-item.is-danger .item-icon.prefix {
  color: var(--color-danger, #ef4444);
}

.dropdown-item.is-danger:hover:not(.disabled),
.dropdown-item.is-danger.focused:not(.disabled) {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger, #ef4444);
}

.dropdown-item.is-danger .item-description {
  color: rgba(239, 68, 68, 0.6);
}

/* ==================== Checkbox/Radio 类型图标样式 ==================== */
.type-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.15s ease;
}

/* Checkbox 样式 */
.checkbox-icon {
  border: 1.5px solid var(--text-tertiary);
  background: transparent;
}

.checkbox-icon.checked {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.checkbox-icon svg {
  width: 12px;
  height: 12px;
}

/* Radio 样式 */
.radio-icon {
  border: 1.5px solid var(--text-tertiary);
  border-radius: 50%;
  background: transparent;
}

.radio-icon.checked {
  border-color: var(--color-primary);
}

.radio-icon .radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
}

/* Checkbox/Radio 选中时的背景高亮 */
.dropdown-item.is-checkbox.is-checked:not(.disabled),
.dropdown-item.is-radio.is-checked:not(.disabled) {
  background: var(--color-primary-alpha, rgba(136, 192, 208, 0.1));
}

/* 悬停时的图标颜色变化 */
.dropdown-item:hover:not(.disabled) .checkbox-icon:not(.checked),
.dropdown-item.focused:not(.disabled) .checkbox-icon:not(.checked) {
  border-color: var(--text-secondary);
}

.dropdown-item:hover:not(.disabled) .radio-icon:not(.checked),
.dropdown-item.focused:not(.disabled) .radio-icon:not(.checked) {
  border-color: var(--text-secondary);
}

/* ==================== 相邻选中项合并样式 ==================== */
/* ==================== 相邻选中项合并样式 ==================== */
/* 1. 中间项：无圆角 */
.dropdown-item.is-middle {
  border-radius: 0;
  margin-top: 0;
  margin-bottom: 0;
  position: relative;
}

/* 2. 第一项：无下圆角 */
.dropdown-item.is-first {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  margin-bottom: 0;
  position: relative;
}

/* 3. 最后一项：无上圆角 */
.dropdown-item.is-last {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  margin-top: 0;
}

/* 4. 单独项：保持默认圆角 (无需额外样式) */

/* 内部分隔线：仅在 is-first 和 is-middle 底部显示 */
.dropdown-item.is-first::after,
.dropdown-item.is-middle::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 36px;
  /* 从文字处开始，避开图标 */
  right: 12px;
  height: 1px;
  background: var(--color-primary-alpha);
  /* 极淡的蓝色线 */
  z-index: 1;
}

/* ==================== 分组/分隔线 ==================== */
.dropdown-group-label {
  display: flex;
  align-items: center;
  padding: 8px 0 4px 0;
  margin-top: 4px;
  user-select: none;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.dropdown-group-label:hover span {
  color: var(--color-primary);
  /* 悬停高亮 */
}

.dropdown-group-label.is-grid {
  grid-column: 1 / -1;
  margin-top: 8px;
  margin-bottom: 4px;
  padding-left: 4px;
}

.dropdown-group-label.is-grid:first-child {
  margin-top: 0;
}

.dropdown-group-label span {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  line-height: 1;
}

.dropdown-group-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: var(--color-divider, rgba(236, 239, 244, 0.1));
}

.dropdown-divider-simple {
  height: 1px;
  background-color: var(--color-divider, rgba(236, 239, 244, 0.1));
  margin: 6px 0;
  opacity: 1;
}

.dropdown-divider-simple.is-grid {
  grid-column: 1 / -1;
  margin: 4px 0;
}
</style>
