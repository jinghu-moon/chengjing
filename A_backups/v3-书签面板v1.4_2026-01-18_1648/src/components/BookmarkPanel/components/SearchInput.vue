<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { IconSearch, IconX, IconCommand } from '@tabler/icons-vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'focus'): void
  (e: 'blur'): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)

const handleInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}

// Wrapper click focuses input
const handleWrapperClick = () => {
  inputRef.value?.focus()
}

const clearInput = (e: Event) => {
  e.stopPropagation() // Prevent wrapper click
  emit('update:modelValue', '')
  inputRef.value?.focus()
}

const handleFocus = () => {
  isFocused.value = true
  emit('focus')
}

const handleBlur = () => {
  isFocused.value = false
  emit('blur')
}

// Ctrl+K shortcut
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    inputRef.value?.focus()
  }
  // Escape to blur
  if (e.key === 'Escape' && isFocused.value) {
    inputRef.value?.blur()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Expose focus method
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
})
</script>

<template>
  <div class="search-input-wrapper" :class="{ focused: isFocused }" @click="handleWrapperClick">
    <div class="icon-wrapper">
      <IconSearch class="search-icon" :size="18" />
    </div>

    <input
      ref="inputRef"
      type="text"
      class="search-input"
      :value="modelValue"
      :placeholder="placeholder || '搜索书签...'"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
    />

    <div class="search-actions">
      <button v-if="modelValue" class="clear-btn" tabindex="-1" @click="clearInput">
        <IconX :size="16" />
      </button>

      <kbd v-else class="shortcut-hint">
        <IconCommand :size="12" />
        <span>K</span>
      </kbd>
    </div>
  </div>
</template>

<style scoped>
.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  transition: all 0.2s;
  cursor: text;
  position: relative; /* 确保自身建立定位上下文 */
}

.search-input-wrapper:hover {
  background: var(--bg-hover);
}

.search-input-wrapper.focused {
  background: var(--bg-panel);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(136, 192, 208, 0.15);
}

/* 新增：图标包裹层样式 */
.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0; /* 防止图标被压缩 */
  line-height: 0;
}

.search-icon {
  color: var(--text-tertiary);
  /* 关键修改：强制重置定位，防止全局 CSS (如 .sidebar svg { absolute... }) 干扰 */
  position: static !important;
  transform: none !important;
  margin: 0 !important;
}

.search-input-wrapper.focused .search-icon {
  color: var(--color-primary);
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--text-primary);
  padding: 0;
}

.search-input::placeholder {
  color: var(--text-placeholder);
}

.search-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: var(--bg-active);
  border-radius: 50%;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.clear-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.shortcut-hint {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  background: var(--bg-active);
  border: 1px solid var(--border-glass);
  border-radius: 4px;
  font-size: 11px;
  font-family: inherit;
  color: var(--text-tertiary);
}

.shortcut-hint span {
  font-weight: 600;
}
</style>
