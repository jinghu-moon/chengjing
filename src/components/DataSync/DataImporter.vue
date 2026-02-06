<template>
  <div class="importer">
    <!-- Step 1: Select File -->
    <div v-if="!previewData" class="upload-area" @click="triggerUpload" @drop.prevent="handleDrop" @dragover.prevent>
      <input 
        type="file" 
        ref="fileInput" 
        accept=".json,application/json" 
        class="hidden-input"
        @change="handleFileSelect"
      >
      <div class="upload-icon">
        <IconFolderOpen :size="48" stroke-width="1.2" />
      </div>
      <div class="upload-text">点击或拖拽上传配置文件</div>
      <div class="upload-hint">支持 .json 格式</div>
    </div>

    <!-- Step 2: Preview & Apply -->
    <div v-else class="preview-card">
      <div class="preview-header">
        <div class="preview-title">文件解析成功</div>
        <button class="btn-close" @click="reset">×</button>
      </div>
      
      <div class="preview-info">
        <div class="info-row">
          <span class="label">包含内容:</span>
          <span class="value">{{ getModeLabel(previewData.m) }}</span>
        </div>
        <div class="info-row">
          <span class="label">导出时间:</span>
          <span class="value">{{ new Date(previewData.t).toLocaleString() }}</span>
        </div>
        <div class="info-row" v-if="previewData.wallpaper">
          <span class="label">包含壁纸:</span>
          <span class="value">是 (自定义图片)</span>
        </div>
        <div class="info-row">
          <span class="label">版本:</span>
          <span class="value">v{{ previewData.v }}</span>
        </div>
      </div>

      <div class="actions">
        <button 
          class="btn-apply" 
          :disabled="isProcessing"
          @click="handleApply"
        >
          <span v-if="isProcessing">应用中...</span>
          <span v-else>确认覆盖当前设置</span>
        </button>
      </div>
    </div>

    <!-- Password Prompt -->
    <div v-if="showPasswordPrompt" class="password-modal">
        <div class="modal-content">
            <h3>请输入密码</h3>
            <p>该配置文件已加密</p>
            <input 
                type="password" 
                v-model="password" 
                placeholder="密码"
                class="input"
                @keyup.enter="retryImport"
            >
            <div class="modal-actions">
                <button @click="showPasswordPrompt = false">取消</button>
                <button class="primary" @click="retryImport">确认</button>
            </div>
            <div v-if="importError" class="error-msg">{{ importError }}</div>
        </div>
    </div>

    <div v-if="error && !showPasswordPrompt" class="global-error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDataSync } from './composables/useDataSync'
import type { SyncData, ExportMode } from './types'
import { IconFolderOpen } from '@tabler/icons-vue'

const { importConfig, applyImport, isProcessing, error } = useDataSync()

const fileInput = ref<HTMLInputElement | null>(null)
const previewData = ref<SyncData | null>(null)
const showPasswordPrompt = ref(false)
const password = ref('')
const currentFile = ref<File | null>(null)
const importError = ref('')

const triggerUpload = () => {
  fileInput.value?.click()
}

const processFile = async (file: File) => {
    currentFile.value = file
    const res = await importConfig(file, password.value)
    
    if (res.success && res.data) {
        previewData.value = res.data
        showPasswordPrompt.value = false
        error.value = ''
        importError.value = ''
    } else {
        if (res.error === 'PASSWORD_REQUIRED' || res.error === 'INVALID_PASSWORD') {
            showPasswordPrompt.value = true
            importError.value = res.error === 'INVALID_PASSWORD' ? '密码错误' : ''
        } else {
            error.value = res.error || '解析失败'
        }
    }
}

const handleFileSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
}

const handleDrop = (e: DragEvent) => {
  const file = e.dataTransfer?.files[0]
  if (file) processFile(file)
}

const retryImport = () => {
    if (currentFile.value) {
        processFile(currentFile.value)
    }
}

const handleApply = async () => {
  if (previewData.value) {
    if (confirm('应用新配置将覆盖当前设置，确定继续吗？')) {
        await applyImport(previewData.value)
        alert('配置已应用！')
        reset()
    }
  }
}

const reset = () => {
  previewData.value = null
  currentFile.value = null
  password.value = ''
  showPasswordPrompt.value = false
  error.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

const getModeLabel = (mode: ExportMode) => {
    const map: Record<ExportMode, string> = {
        theme: '仅主题',
        full: '完整配置',
        wallpaper: '完整配置 + 壁纸'
    }
    return map[mode] || mode
}
</script>

<style scoped>
.importer {
  padding: var(--spacing-md);
}

.hidden-input {
  display: none;
}

.upload-area {
  border: 2px dashed var(--color-border-glass);
  border-radius: var(--radius-ml);
  padding: var(--spacing-xl);
  text-align: center;
  cursor: pointer;
  transition: var(--transition-fast);
  background: var(--bg-input);
}

.upload-area:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-alpha);
}

.upload-icon {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.upload-text {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
}

.upload-hint {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: var(--spacing-xs);
}

.preview-card {
  background: var(--bg-input);
  border-radius: var(--radius-ml);
  padding: var(--spacing-md);
  border: var(--border-glass);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  border-bottom: var(--border-divider);
  padding-bottom: var(--spacing-sm);
}

.preview-title {
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-tertiary);
  font-size: var(--text-xl);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-close:hover {
  color: var(--text-primary);
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  font-size: var(--text-sm);
}

.label {
  color: var(--text-tertiary);
}

.value {
  color: var(--text-primary);
}

.actions {
  margin-top: var(--spacing-md);
}

.btn-apply {
  width: 100%;
  padding: var(--comp-padding-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-apply:hover:not(:disabled) {
  background: var(--color-primary-hover);
}

.btn-apply:disabled {
  opacity: var(--disabled-opacity);
  cursor: not-allowed;
}

.global-error {
  margin-top: var(--spacing-md);
  color: var(--color-danger);
  text-align: center;
  background: var(--color-danger-bg);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

/* Modal */
.password-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--mask-dark);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: var(--z-modal);
}

.modal-content {
  background: var(--bg-panel-dark);
  padding: var(--spacing-lg);
  border-radius: var(--radius-ml);
  width: 300px;
  text-align: center;
  border: var(--border-glass);
}

.modal-content h3 {
  margin: 0 0 var(--spacing-sm);
  color: var(--text-primary);
}

.modal-content p {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  margin: 0;
}

.modal-content .input {
  width: 100%;
  padding: var(--comp-padding-sm);
  margin: var(--spacing-sm) 0;
  background: var(--bg-input);
  border: var(--border-glass);
  color: var(--text-primary);
  border-radius: var(--radius-md);
  outline: none;
}

.modal-content .input:focus {
  border-color: var(--color-primary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.modal-actions button {
  padding: var(--comp-padding-sm);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  font-size: var(--text-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  transition: var(--transition-fast);
}

.modal-actions button:hover {
  background: var(--bg-hover-card);
}

.modal-actions button.primary {
  background: var(--color-primary);
  color: white;
}

.modal-actions button.primary:hover {
  background: var(--color-primary-hover);
}

.error-msg {
  color: var(--color-danger);
  font-size: var(--text-xs);
  margin-top: var(--spacing-sm);
}
</style>
