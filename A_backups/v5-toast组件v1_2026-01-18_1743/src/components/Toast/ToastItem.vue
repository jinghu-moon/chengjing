<script setup lang="ts">
import type { ToastInstance, ToastType } from './types'
import type { Component } from 'vue'
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-vue'
import { computed } from 'vue'

const props = defineProps<{
  toast: ToastInstance
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// 图标映射 - 添加明确的类型定义
const iconMap: Record<ToastType, Component> = {
  success: IconCheck,
  error: IconX,
  warning: IconAlertTriangle,
  info: IconInfoCircle,
}

const iconComponent = computed(() => {
  return props.toast.icon || iconMap[props.toast.type]
})

// 处理操作按钮点击
const handleAction = () => {
  if (props.toast.action) {
    props.toast.action.onClick()
    emit('close')
  }
}
</script>

<template>
  <div class="toast-item" :class="toast.type">
    <div class="toast-icon">
      <component :is="iconComponent" :size="20" stroke-width="2" />
    </div>

    <div class="toast-content">
      <div v-if="toast.title" class="toast-title">{{ toast.title }}</div>

      <div class="toast-message">{{ toast.message }}</div>
    </div>

    <button
      v-if="toast.action"
      class="toast-action"
      :class="toast.action.variant || 'ghost'"
      @click.stop="handleAction"
    >
      {{ toast.action.label }}
    </button>

    <button v-if="toast.closable" class="toast-close" @click.stop="emit('close')">
      <IconX :size="16" />
    </button>
  </div>
</template>

<style scoped>
/* =================================================================
   核心容器样式
   ================================================================= */
.toast-item {
  background: var(--bg-toast);
  backdrop-filter: var(--blur-md);

  border: var(--border-glass);
  border-radius: var(--radius-md);

  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 15px -3px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(0, 0, 0, 0.02);

  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 320px;
  max-width: 420px;
  position: relative;
  overflow: hidden;
  pointer-events: auto;
  user-select: none;
  z-index: 100;
}

/* 左侧彩色装饰条 */
.toast-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

/* =================================================================
   类型配色 (Nord 主题)
   ================================================================= */
.toast-item.success::before {
  background: var(--nord14, #a3be8c);
}

.toast-item.error::before {
  background: var(--nord11, #bf616a);
}

.toast-item.warning::before {
  background: var(--nord13, #ebcb8b);
}

.toast-item.info::before {
  background: var(--nord8, #88c0d0);
}

.toast-item.success .toast-icon {
  color: var(--nord14, #a3be8c);
}

.toast-item.error .toast-icon {
  color: var(--nord11, #bf616a);
}

.toast-item.warning .toast-icon {
  color: var(--nord13, #ebcb8b);
}

.toast-item.info .toast-icon {
  color: var(--nord8, #88c0d0);
}

/* =================================================================
   子元素样式
   ================================================================= */
.toast-icon {
  display: flex;
  align-items: center;
  margin-top: 2px;
  /* 视觉微调对齐 */
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  /* 防止长文本撑开 */
}

.toast-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary, #2e3440);
  line-height: 1.4;
}

.toast-message {
  font-size: 13px;
  color: var(--text-secondary, #4c566a);
  line-height: 1.5;
  word-break: break-word;
}

/* 操作按钮 */
.toast-action {
  flex-shrink: 0;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  border: 1px solid var(--nord4, #d8dee9);
  background: transparent;
  color: var(--nord10, #5e81ac);
  align-self: center;
}

.toast-action:hover {
  background: var(--nord6, #eceff4);
  color: var(--nord9, #81a1c1);
}

.toast-action.primary {
  background: var(--color-primary, #5e81ac);
  color: white;
  border: none;
}

/* 关闭按钮 */
.toast-close {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: var(--nord4, #d8dee9);
  transition: all 0.2s;
  margin-top: -2px;
  margin-right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  color: var(--text-secondary, #4c566a);
  background: rgba(0, 0, 0, 0.05);
}

/* =================================================================
   🌑 暗色模式适配 (Dark Mode)
   ================================================================= */
@media (prefers-color-scheme: dark) {
  .toast-item {
    /* Nord0 背景 + 高不透明度 */
    background: rgba(46, 52, 64, 0.96);
    border-color: rgba(255, 255, 255, 0.1);
    /* 暗色模式下加重阴影 */
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  }

  .toast-title {
    color: var(--nord6, #eceff4);
  }

  .toast-message {
    color: var(--nord4, #d8dee9);
  }

  .toast-action {
    border-color: var(--nord2, #434c5e);
    color: var(--nord8, #88c0d0);
  }

  .toast-action:hover {
    background: var(--nord1, #3b4252);
  }

  .toast-close {
    color: var(--nord3, #4c566a);
  }

  .toast-close:hover {
    color: var(--nord6, #eceff4);
    background: var(--nord2, #434c5e);
  }
}
</style>
