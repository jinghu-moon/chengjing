<!--
  SearchInput.vue - 通用搜索/输入框组件
  
  特性:
  - 圆角外壳 + 半透明背景
  - 聚焦时边框高亮 + 外发光
  - 左侧图标/下拉选择器 (可选)
  - 右侧功能按钮组 (可选)
  - 快捷键标签 (可选)
  - 清除按钮 (自动显示)
-->
<script setup lang="ts">
import { ref, computed, useSlots } from 'vue'
import { IconSearch, IconX } from '@tabler/icons-vue'

interface Props {
  modelValue?: string
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  showClear?: boolean
  showSearchIcon?: boolean
  shortcut?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '搜索...',
  size: 'md',
  showClear: true,
  showSearchIcon: true,
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
  (e: 'clear'): void
  (e: 'submit', value: string): void
}>()

const slots = useSlots()

const inputRef = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)

const inputValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const hasValue = computed(() => inputValue.value.length > 0)

const hasPrefix = computed(() => !!slots.prefix || props.showSearchIcon)
const hasSuffix = computed(() => !!slots.suffix || hasValue.value || props.shortcut)

const sizeClasses = computed(() => ({
  'size-sm': props.size === 'sm',
  'size-md': props.size === 'md',
  'size-lg': props.size === 'lg'
}))

const handleClear = () => {
  inputValue.value = ''
  emit('clear')
  inputRef.value?.focus()
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    emit('submit', inputValue.value)
  }
  if (e.key === 'Escape') {
    handleClear()
  }
}

const focus = () => {
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

// 暴露方法
defineExpose({ focus, blur, inputRef })
</script>

<template>
  <div 
    class="search-input-wrapper"
    :class="[sizeClasses, { focused: isFocused, disabled: disabled }]"
  >
    <!-- 左侧前缀区域 -->
    <div v-if="hasPrefix" class="input-prefix">
      <slot name="prefix">
        <IconSearch v-if="showSearchIcon" class="prefix-icon" />
      </slot>
    </div>

    <!-- 分割线 -->
    <div v-if="hasPrefix && $slots.prefix" class="input-divider"></div>

    <!-- 输入框 -->
    <input
      ref="inputRef"
      v-model="inputValue"
      type="text"
      class="search-input"
      :placeholder="placeholder"
      :disabled="disabled"
      @focus="isFocused = true; emit('focus')"
      @blur="isFocused = false; emit('blur')"
      @keydown="handleKeydown"
    />

    <!-- 右侧后缀区域 -->
    <div v-if="hasSuffix" class="input-suffix">
      <!-- 清除按钮 -->
      <button 
        v-if="showClear && hasValue" 
        class="clear-btn"
        type="button"
        tabindex="-1"
        @click="handleClear"
      >
        <IconX :size="14" />
      </button>

      <!-- 自定义后缀 -->
      <slot name="suffix"></slot>

      <!-- 快捷键标签 -->
      <div v-if="shortcut && !hasValue" class="kbd-shortcut">
        {{ shortcut }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background-color: var(--bg-input);
  border: var(--border-glass);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

/* 尺寸变体（与 Button 组件对齐） */
.size-sm {
  height: 24px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
}

.size-md {
  height: 32px;
  padding: 0 var(--space-3);
}

.size-lg {
  height: 40px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-lg);
}

/* 聚焦状态 */
.search-input-wrapper.focused {
  border-color: var(--color-primary);
  background-color: var(--bg-panel-dark);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

/* 禁用状态 */
.search-input-wrapper.disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* 前缀区域 */
.input-prefix {
  display: flex;
  align-items: center;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.prefix-icon {
  width: 18px;
  height: 18px;
  opacity: 0.6;
}

.size-lg .prefix-icon {
  width: 20px;
  height: 20px;
}

/* 分割线 */
.input-divider {
  width: 1px;
  height: 20px;
  background-color: var(--color-border-glass);
  margin: 0 var(--space-3);
  flex-shrink: 0;
}

/* 输入框 */
.search-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 14px;
  margin: 0 var(--space-3);
}

.size-sm .search-input {
  font-size: 13px;
  margin: 0 var(--space-2);
}

.size-lg .search-input {
  font-size: 16px;
  margin: 0 var(--space-4);
}

.search-input::placeholder {
  color: var(--text-placeholder);
}

/* 后缀区域 */
.input-suffix {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}

/* 清除按钮 */
.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-secondary);
}

/* 快捷键标签 */
.kbd-shortcut {
  display: flex;
  align-items: center;
  height: 22px;
  padding: 0 var(--space-3);
  background: var(--bg-input);
  border: var(--border-light);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 600;
  user-select: none;
  white-space: nowrap;
}
</style>
