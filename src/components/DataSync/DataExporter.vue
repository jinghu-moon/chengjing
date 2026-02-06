<template>
  <div class="exporter">
    <!-- Mode Selection (Tag Grid) -->
    <div class="mode-grid">
      <div
        v-for="mode in modes"
        :key="mode.value"
        class="mode-card"
        :class="{ active: currentMode === mode.value }"
        @click="currentMode = mode.value"
      >
        <div class="mode-info">
          <span class="mode-name">{{ mode.label }}</span>
          <span class="mode-desc">{{ mode.desc }}</span>
        </div>
      </div>
    </div>

    <!-- Options -->
    <div class="options">
      <label class="option-item">
        <div class="checkbox-wrapper">
          <input type="checkbox" v-model="useEncryption">
        </div>
        <span class="label">加密保护</span>
      </label>
      
      <transition name="slide-fade">
        <div v-if="useEncryption" class="password-input">
          <input 
            type="password" 
            v-model="password" 
            placeholder="设置密码"
            class="input"
          >
        </div>
      </transition>
    </div>

    <!-- Action -->
    <div class="actions">
      <button 
        class="btn-export" 
        :disabled="isProcessing || (useEncryption && !password)"
        @click="handleExport"
      >
        <span v-if="isProcessing">导出中...</span>
        <span v-else>下载 .json 文件</span>
      </button>
      
      <div class="file-hint">
        预估大小: {{ estimatedSize }}
      </div>
      <div v-if="error" class="error-msg">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataSync } from './composables/useDataSync'
import type { ExportMode } from './types'

const { exportConfig, isProcessing, error } = useDataSync()

const currentMode = ref<ExportMode>('full')
const useEncryption = ref(false)
const password = ref('')

const modes = [
  {
    value: 'theme' as ExportMode,
    label: '主题风格',
    desc: '外观配色、图标样式'
  },
  {
    value: 'full' as ExportMode,
    label: '完整配置',
    desc: '布局、组件、所有设置'
  },
  {
    value: 'wallpaper' as ExportMode,
    label: '含壁纸',
    desc: '完整配置 + 自定义壁纸'
  }
]

const estimatedSize = computed(() => {
  if (currentMode.value === 'theme') return '< 5 KB'
  if (currentMode.value === 'full') return '~ 20 KB'
  return '> 100 KB'
})

const handleExport = async () => {
  await exportConfig(currentMode.value, useEncryption.value ? password.value : undefined)
}
</script>

<style scoped>
.exporter {
  padding: var(--spacing-md);
}

/* Mode Grid - Tag Style */
.mode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: var(--spacing-lg);
}

.mode-card {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--bg-input);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.mode-card:hover {
  background: var(--bg-hover-card);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--color-border-hover);
}

.mode-card.active {
  border-color: var(--color-primary);
  background: var(--color-primary-alpha);
}

.mode-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  flex: 1;
}

.mode-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mode-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.options {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--bg-panel-card);
  border-radius: var(--radius-md);
}

.option-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

.checkbox-wrapper input {
  cursor: pointer;
}

.password-input {
  margin-top: var(--spacing-sm);
}

.input {
  width: 100%;
  padding: var(--comp-padding-sm);
  border-radius: var(--radius-md);
  border: var(--border-glass);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: var(--text-sm);
  outline: none;
  transition: var(--transition-fast);
}

.input:focus {
  border-color: var(--color-primary);
}

.actions {
  text-align: center;
}

.btn-export {
  width: 100%;
  padding: var(--comp-padding-md);
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: white;
  border: none;
  font-weight: var(--weight-semibold);
  font-size: var(--text-base);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn-export:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: var(--btn-hover-lift);
  box-shadow: var(--btn-hover-shadow);
}

.btn-export:disabled {
  opacity: var(--disabled-opacity);
  cursor: not-allowed;
}

.file-hint {
  margin-top: var(--spacing-sm);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.error-msg {
  color: var(--color-danger);
  margin-top: var(--spacing-sm);
  font-size: var(--text-sm);
}

/* Animations */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>
