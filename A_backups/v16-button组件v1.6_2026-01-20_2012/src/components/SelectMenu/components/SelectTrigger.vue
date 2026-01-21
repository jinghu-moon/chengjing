<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { IconChevronDown, IconX } from '@tabler/icons-vue'
import type { SelectOption } from '../types'

const props = defineProps<{
  isOpen: boolean
  currentOption?: SelectOption
  placeholder: string
  showArrow: boolean
  disabled: boolean
  dropdownId: string
  focusedIndex: number

  // 功能属性
  clearable?: boolean
  filterable?: boolean
  searchQuery?: string
  searchPlaceholder?: string

  // 多选标签回显
  multiple?: boolean
  selectedOptions?: SelectOption[]

  // [新增] 级联路径显示
  showPath?: boolean
  selectedPath?: SelectOption[]
}>()

const emit = defineEmits<{
  toggle: []
  keydown: [e: KeyboardEvent]
  clear: []
  'update:searchQuery': [value: string]
  focus: []
  blur: []
  'remove-tag': [option: SelectOption]
}>()

// ==================== 状态管理 ====================
const isHovered = ref(false)
const isEditMode = ref(false) // 核心状态：是否处于编辑态
const inputRef = ref<HTMLInputElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
let blurTimer: ReturnType<typeof setTimeout> | undefined

// ==================== 计算属性 ====================
// 是否显示清除按钮
const showClear = computed(() => {
  // 逻辑：开启清除 && (有选中项 或 有搜索词) && 悬停 && 未禁用
  return (
    props.clearable &&
    (props.currentOption || props.searchQuery) &&
    isHovered.value &&
    !props.disabled
  )
})

// 输入框占位符：编辑态显示搜索提示，否则显示默认提示
const inputPlaceholder = computed(() => {
  if (isEditMode.value) {
    return props.searchPlaceholder || '输入关键词...'
  }
  return props.placeholder
})

// [新增] 路径文本生成
const pathText = computed(() => {
  if (!props.selectedPath || props.selectedPath.length === 0) return ''
  return props.selectedPath.map(opt => opt.label).join(' / ')
})

// ==================== 状态切换逻辑 ====================

// 进入编辑态
const enterEditMode = () => {
  if (props.disabled || !props.filterable) return

  isEditMode.value = true

  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus()
      // [体验优化] 如果有当前选中项，将其填入并全选，方便用户修改或重输
      if (props.currentOption?.label && !props.searchQuery) {
        emit('update:searchQuery', props.currentOption.label)
        nextTick(() => inputRef.value?.select())
      }
    }
  })
}

// 退出编辑态
const exitEditMode = () => {
  isEditMode.value = false
  // [体验优化] 退出时清空搜索词，确保下次展示态纯净
  emit('update:searchQuery', '')
  emit('blur')
}

// ==================== 交互处理 ====================

const handleClick = () => {
  if (props.disabled) return

  if (props.filterable && !isEditMode.value) {
    // 搜索模式：点击进入编辑态，并打开菜单
    enterEditMode()
    if (!props.isOpen) emit('toggle')
  } else if (!props.filterable) {
    // 普通模式：直接切换菜单
    emit('toggle')
  }
}

const handleInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  emit('update:searchQuery', val)
}

const handleInputFocus = () => {
  if (props.disabled) return
  emit('focus')
}

// [关键优化] 失焦缓冲
const handleInputBlur = () => {
  // 延迟退出，给用户点击"清除按钮"或"滚动条"留出时间
  blurTimer = setTimeout(() => {
    // 只有当菜单关闭时才退出编辑态，否则保持编辑态以便继续搜索
    if (!props.isOpen) {
      exitEditMode()
    }
  }, 200)
}

const handleKeydown = (e: KeyboardEvent) => {
  // [关键优化] 阻止 Input 原生上下键移动光标，改为控制菜单导航
  if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault()
  }

  // Escape: 优雅降级，退出编辑并恢复焦点到容器
  if (e.key === 'Escape') {
    e.stopPropagation()
    if (isEditMode.value) {
      exitEditMode()
      containerRef.value?.focus()
    } else {
      emit('toggle') // 关闭菜单
    }
    return
  }

  emit('keydown', e)
}

const handleClear = (e: MouseEvent) => {
  e.stopPropagation()
  // [关键优化] 取消即将发生的失焦逻辑
  clearTimeout(blurTimer)

  emit('clear')
  emit('update:searchQuery', '')

  // 清除后如果处于编辑态，保持焦点
  if (isEditMode.value) {
    inputRef.value?.focus()
  }
}

// 监听菜单关闭，自动退出编辑态
watch(
  () => props.isOpen,
  val => {
    if (!val && isEditMode.value) {
      exitEditMode()
    }
  }
)

defineExpose({
  focus: () => (props.filterable ? enterEditMode() : containerRef.value?.focus()),
})
</script>

<template>
  <div
    ref="containerRef"
    class="select-trigger"
    :class="{
      active: isOpen,
      'is-disabled': disabled,
      'is-filterable': filterable,
      'is-edit-mode': isEditMode,
    }"
    :tabindex="disabled ? -1 : 0"
    role="combobox"
    :aria-expanded="isOpen"
    @click="handleClick"
    @keydown="handleKeydown"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div v-show="!isEditMode" class="trigger-display">
      <div class="trigger-content-wrapper">
        <!-- 多选标签模式 -->
        <div
          v-if="multiple && selectedOptions && selectedOptions.length > 0"
          class="select-tags-wrapper"
        >
          <span v-for="opt in selectedOptions" :key="opt.value" class="select-tag" @click.stop>
            <span class="tag-text">{{ opt.label }}</span>
            <span class="tag-close" @click.stop="emit('remove-tag', opt)">
              <IconX :size="12" />
            </span>
          </span>
        </div>

        <slot v-else name="default" :option="currentOption">
          <template v-if="currentOption">
            <!-- 级联路径显示 -->
            <template v-if="showPath && selectedPath && selectedPath.length > 0">
              <span class="trigger-text path-text" :title="pathText">{{ pathText }}</span>
            </template>
            <!-- 普通单选显示 -->
            <template v-else>
              <component
                :is="currentOption.prefixIcon"
                v-if="currentOption.prefixIcon"
                :size="16"
                class="item-icon prefix"
              />
              <span class="trigger-text">{{ currentOption.label }}</span>
            </template>
          </template>
          <span v-else class="trigger-text placeholder">{{ placeholder }}</span>
        </slot>
      </div>
    </div>

    <div v-show="isEditMode" class="trigger-editor">
      <input
        ref="inputRef"
        type="text"
        class="trigger-input"
        :value="searchQuery"
        :placeholder="inputPlaceholder"
        :disabled="disabled"
        autocomplete="off"
        @input="handleInput"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
        @keydown="handleKeydown"
        @click.stop
      />
    </div>

    <div class="icon-wrapper" @mousedown.prevent>
      <IconX v-if="showClear" :size="14" class="trigger-icon clear-btn" @click="handleClear" />
      <IconChevronDown
        v-else-if="showArrow"
        :size="16"
        class="trigger-icon arrow"
        :class="{ rotate: isOpen }"
      />
    </div>
  </div>
</template>

<style scoped>
.select-trigger {
  /* 定义高度常量，确保切换时不抖动 */
  --trigger-height: var(--height-sm);
  --text-size: var(--text-sm);

  position: relative;
  display: flex;
  align-items: center;
  background: var(--mask-dark);
  border: var(--border-glass);
  border-radius: var(--radius-md);
  padding: 0 8px 0 12px;
  height: var(--trigger-height);
  transition: all 0.2s var(--ease-smooth);
  cursor: pointer;
  outline: none;
}

.select-trigger:hover {
  background: var(--bg-hover);
  border-color: var(--text-tertiary);
}

.select-trigger.active,
.select-trigger.is-edit-mode {
  background: var(--bg-hover);
  border-color: var(--text-secondary);
}

.select-trigger.is-filterable {
  cursor: text;
}

.select-trigger:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha);
}

.select-trigger.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* ==================== 核心：布局一致性 ==================== */
/* 确保展示层和编辑层占据完全相同的空间 */

.trigger-display,
.trigger-editor {
  flex: 1;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.trigger-content-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  line-height: normal;
  /* 重置行高 */
}

/* 统一文字样式，防止跳变 */
.trigger-text,
.trigger-input {
  font-size: var(--text-size);
  color: var(--text-primary);
  font-family: inherit;
  line-height: 1.5;
}

.trigger-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trigger-text.placeholder {
  color: var(--text-tertiary);
}

.trigger-input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  margin: 0;
}

.trigger-input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.5;
}

.item-icon.prefix {
  color: var(--text-secondary);
  flex-shrink: 0;
}

/* ==================== 图标样式 ==================== */
.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 8px;
  flex-shrink: 0;
  z-index: 2;
}

.trigger-icon {
  color: var(--text-tertiary);
  transition:
    transform 0.3s var(--ease-smooth),
    color 0.2s;
}

.trigger-icon.rotate {
  transform: rotate(180deg);
}

/* ==================== 多选标签样式 ==================== */
.select-tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  width: 100%;
}

.select-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 4px 4px 8px;
  background: var(--nord);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  user-select: none;
  max-width: 100%;
}

.tag-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-close {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-tertiary);
  border-radius: 50%;
  transition: all 0.2s;
  width: 14px;
  height: 14px;
}

.tag-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.trigger-icon.clear-btn:hover {
  color: var(--color-danger);
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}
</style>
