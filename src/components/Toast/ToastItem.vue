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

// 计算进度条动画时长（秒）
const progressDuration = computed(() => {
  return props.toast.duration > 0 ? `${props.toast.duration}ms` : '0ms'
})

// 是否显示进度条（duration > 0 才显示）
const showProgress = computed(() => props.toast.duration > 0)

// 关闭按钮位置 class
const closeButtonClass = computed(() => {
  return `close-${props.toast.closeButtonPosition}`
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
  <div class="toast-item" :class="toast.type" :style="{ '--progress-duration': progressDuration }">
    <!-- 进度条 -->
    <div v-if="showProgress" class="toast-progress"></div>

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

    <button
      v-if="toast.closable"
      class="toast-close"
      :class="closeButtonClass"
      @click.stop="emit('close')"
    >
      <IconX :size="16" />
    </button>
  </div>
</template>

<style scoped>
/* =================================================================
   核心容器样式
   ================================================================= */
.toast-item {
  /* 使用专用不透明背景色，避免下层元素透过 */
  background: var(--bg-toast);

  /* 增强边框视觉层次 */
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);

  /* 增强阴影，突出层次感 */
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.15),
    0 10px 30px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.05);

  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 360px;
  max-width: 480px;
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
   进度条样式
   ================================================================= */
.toast-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: currentColor;
  opacity: 0.6;
  transform-origin: left;
  animation: toast-progress-shrink var(--progress-duration) linear forwards;
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

/* 进度条动画：从 100% 缩小到 0% */
@keyframes toast-progress-shrink {
  from {
    transform: scaleX(1);
  }

  to {
    transform: scaleX(0);
  }
}

/* Hover 时暂停进度条 */
.toast-item:hover .toast-progress {
  animation-play-state: paused;
}

/* =================================================================
   类型配色 (Nord 主题)
   ================================================================= */
.toast-item.success::before {
  background: var(--color-success);
}

.toast-item.success {
  color: var(--color-success);
}

.toast-item.error::before {
  background: var(--color-danger);
}

.toast-item.error {
  color: var(--color-danger);
}

.toast-item.warning::before {
  background: var(--color-warning);
}

.toast-item.warning {
  color: var(--color-warning);
}

.toast-item.info::before {
  background: var(--color-relax);
}

.toast-item.info {
  color: var(--color-relax);
}

.toast-item.success .toast-icon {
  color: var(--color-success);
}

.toast-item.error .toast-icon {
  color: var(--color-danger);
}

.toast-item.warning .toast-icon {
  color: var(--color-warning);
}

.toast-item.info .toast-icon {
  color: var(--color-relax);
}

/* =================================================================
   子元素样式
   ================================================================= */
.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.toast-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  /* 防止长文本撑开 */
}

.toast-title {
  font-weight: 600;
  font-size: 15px;
  color: var(--text-primary, #2e3440);
  line-height: 1;
  padding: 2px 0;
}

.toast-message {
  font-size: 14px;
  color: var(--text-secondary, #4c566a);
  line-height: 1;
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
  border: 1px solid var(--text-secondary);
  background: transparent;
  color: var(--color-primary);
  align-self: center;
}

.toast-action:hover {
  background: var(--bg-active);
  color: var(--color-primary-hover);
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
  color: var(--text-secondary);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 右中：使用 flex 布局，自然居中 */
.toast-close.close-center-right {
  align-self: center;
}

/* 右上：绝对定位，独立于 flex 布局 */
.toast-close.close-top-right {
  position: absolute;
  top: 10px;
  right: 10px;
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
    color: var(--text-heading);
  }

  .toast-message {
    color: var(--text-secondary);
  }

  .toast-action {
    border-color: var(--color-info-hover);
    color: var(--color-relax);
  }

  .toast-action:hover {
    background: var(--bg-panel-dark);
  }

  .toast-close {
    color: var(--text-tertiary);
  }

  .toast-close:hover {
    color: var(--text-heading);
    background: var(--color-info-hover);
  }
}
</style>
