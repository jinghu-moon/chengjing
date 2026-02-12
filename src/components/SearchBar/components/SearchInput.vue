<script setup lang="ts">
/**
 * SearchInput - 搜索输入框
 * 职责：文本输入 + Bang 高亮镜像层 + 快捷键徽章 + 搜索按钮
 */
import { ref } from 'vue'
import { IconSearch, IconX } from '@tabler/icons-vue'
import { useSettings } from '../../../composables/useSettings'
import type { ActiveBang } from '../composables/useBangParser'

defineProps<{
  /** 输入框的值（v-model） */
  modelValue: string
  /** 当前 Bang 检测状态 */
  activeBang: ActiveBang | null
  /** 搜索按钮动画状态 */
  isAnimating: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  focus: []
  keydown: [event: KeyboardEvent]
  search: []
  clear: []
}>()

/** 清除输入内容 */
function handleClear() {
  emit('update:modelValue', '')
  emit('clear')
  inputEl.value?.focus()
}

const { settings } = useSettings()

/** 内部 input 元素引用，通过 defineExpose 暴露给父组件 */
const inputEl = ref<HTMLInputElement | null>(null)

defineExpose({ inputEl })
</script>

<template>
  <!-- 搜索输入框 -->
  <div class="input-wrapper">
    <input
      ref="inputEl"
      :value="modelValue"
      type="text"
      class="search-input"
      :class="{ 'has-bang': activeBang }"
      placeholder="搜索..."
      autocomplete="off"
      spellcheck="false"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @focus="emit('focus')"
      @keydown="emit('keydown', $event)"
    />
    <!-- Bang 高亮镜像层 -->
    <div v-if="activeBang" class="input-mirror" aria-hidden="true">
      <span class="bang-tag">{{ activeBang.bang }}</span>
      <span class="mirror-rest">{{ activeBang.rest }}</span>
    </div>
  </div>

  <!-- 清除按钮 -->
  <button
    v-if="modelValue.length > 0"
    class="clear-btn"
    aria-label="清除"
    @click="handleClear"
  >
    <IconX :size="14" :stroke-width="2" />
  </button>

  <!-- 快捷键徽章 -->
  <div v-show="modelValue.length === 0" class="shortcut-badge">Ctrl K</div>

  <!-- 搜索按钮 -->
  <button
    v-if="settings.searchBarShowIcon"
    class="right-icon-btn"
    aria-label="搜索"
    @click="emit('search')"
  >
    <IconSearch :size="20" :stroke-width="1.5" :class="{ 'search-icon-active': isAnimating }" />
  </button>
</template>

<style scoped>
/* ==================== 搜索输入框 ==================== */
.input-wrapper {
  flex: 1;
  position: relative;
  height: 100%;
  min-width: 0;
}

.search-input {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: var(--text-md);
  font-family: inherit;
  color: var(--text-primary);
  padding: 0 var(--space-2);
}

.search-input.has-bang {
  color: transparent;
  caret-color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-placeholder);
}

/* ==================== Bang 高亮镜像层 ==================== */
.input-mirror {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 0 var(--space-2);
  font-size: var(--text-md);
  font-family: inherit;
  pointer-events: none;
  white-space: nowrap;
  overflow: hidden;
}

.bang-tag {
  color: var(--color-primary, #88c0d0);
  background: rgba(var(--color-primary-rgb, 136, 192, 208), 0.15);
  border-radius: 4px;
  padding: 1px 4px;
  font-weight: 600;
  flex-shrink: 0;
}

.mirror-rest {
  color: var(--text-primary);
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ==================== 快捷键徽章 ==================== */
.shortcut-badge {
  font-family: var(--font-family-mono);
  font-size: 10px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-active);
  color: var(--text-tertiary);
  border: 1px solid var(--color-divider);
  margin-left: auto;
  margin-right: var(--space-2);
  pointer-events: none;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ==================== 清除按钮 ==================== */
.clear-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
  margin-right: var(--space-1);
}

.clear-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* ==================== 搜索按钮 ==================== */
.right-icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--space-2);
  margin-right: calc(-1 * var(--space-2));
  border-radius: 50%;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.right-icon-btn:hover {
  background-color: var(--bg-hover);
  color: var(--color-primary);
}

/* ==================== 搜索按钮动画 ==================== */
@keyframes elegant-rotate-scale {
  0% { transform: scale(1) rotate(0deg); }
  30% { transform: scale(1.15) rotate(15deg); }
  60% { transform: scale(1.15) rotate(-5deg); }
  100% { transform: scale(1) rotate(0deg); }
}

.search-icon-active {
  transform-origin: center;
  animation: elegant-rotate-scale 0.4s ease-in-out forwards;
  color: var(--text-primary);
  filter: drop-shadow(0 0 2px rgb(from var(--text-primary) r g b / 0.5));
}
</style>
