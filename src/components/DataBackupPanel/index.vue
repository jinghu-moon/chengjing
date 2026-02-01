<script setup lang="ts">
/**
 * 数据备份面板
 * 独立的侧边抽屉面板，包含预设管理、历史回溯和文件备份功能
 */
import { IconX, IconDatabase } from '@tabler/icons-vue'
import DataBackup from '@/components/DataBackup/index.vue'

defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['update:isOpen'])

const close = () => {
  emit('update:isOpen', false)
}
</script>

<template>
  <Transition name="panel-slide">
    <div v-if="isOpen" class="panel-overlay" @click.self="close">
      <div class="panel-container">
        <button class="close-btn" @click="close">
          <IconX size="24" />
        </button>

        <!-- Header -->
        <div class="panel-header">
          <IconDatabase :size="24" />
          <h2>数据管理</h2>
        </div>

        <!-- Content -->
        <div class="panel-content">
          <DataBackup />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.panel-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.panel-container {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 420px;
  max-width: 100vw;
  background: var(--bg-panel);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: var(--glass-bg-light);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.close-btn:hover {
  background: var(--glass-bg-hover);
  color: var(--text-primary);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 24px 16px;
  color: var(--text-primary);
}

.panel-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 24px 24px;
}

/* Transition */
.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: opacity 0.3s ease;
}

.panel-slide-enter-active .panel-container,
.panel-slide-leave-active .panel-container {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
}

.panel-slide-enter-from .panel-container,
.panel-slide-leave-to .panel-container {
  transform: translateX(100%);
}
</style>
