<script setup lang="ts">
/**
 * QR 二维码导入器组件
 * 支持文件上传、粘贴图片、文本粘贴
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { useQRSync } from './composables/useQRSync'
import { useToast } from '@/components/Toast/composables/useToast'
import Button from '@/components/Button/Button.vue'
import { IconUpload, IconClipboard, IconLoader2 } from '@tabler/icons-vue'

const emit = defineEmits<{
  (e: 'scanned'): void
}>()

const { showToast } = useToast()
const {
  scanStatus,
  scanError,
  scanFromFile,
  scanFromClipboard,
  parseFromText
} = useQRSync()

// 状态
const fileInput = ref<HTMLInputElement | null>(null)
const textInput = ref('')
const isDragOver = ref(false)

// 触发文件选择
function triggerFileSelect() {
  fileInput.value?.click()
}

// 文件选择回调
async function onFileSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const result = await scanFromFile(file)
  if (result.success) {
    emit('scanned')
  } else {
    showToast({ type: 'error', message: result.error || '扫描失败' })
  }

  // 清空 input
  if (fileInput.value) fileInput.value.value = ''
}

// 拖拽处理
function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

async function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false

  const file = e.dataTransfer?.files?.[0]
  if (!file || !file.type.startsWith('image/')) {
    showToast({ type: 'warning', message: '请拖入图片文件' })
    return
  }

  const result = await scanFromFile(file)
  if (result.success) {
    emit('scanned')
  } else {
    showToast({ type: 'error', message: result.error || '扫描失败' })
  }
}

// 粘贴处理
async function onPaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return

  for (const item of items) {
    // 优先处理图片
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const blob = item.getAsFile()
      if (blob) {
        const result = await scanFromClipboard(blob)
        if (result.success) {
          emit('scanned')
          showToast({ type: 'success', message: '二维码识别成功' })
        } else {
          showToast({ type: 'error', message: result.error || '识别失败' })
        }
      }
      return
    }
  }
}

// 文本解析
function handleTextParse() {
  if (!textInput.value.trim()) {
    showToast({ type: 'warning', message: '请输入配置文本' })
    return
  }

  const result = parseFromText(textInput.value)
  if (result.success) {
    emit('scanned')
    textInput.value = ''
  } else {
    showToast({ type: 'error', message: result.error || '解析失败' })
  }
}

// 全局粘贴监听
onMounted(() => {
  document.addEventListener('paste', onPaste)
})

onUnmounted(() => {
  document.removeEventListener('paste', onPaste)
})


</script>

<template>
  <div class="qr-importer">
    <!-- 拖拽上传区域 -->
    <div
      class="drop-zone"
      :class="{ 'drag-over': isDragOver, scanning: scanStatus === 'scanning' }"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="triggerFileSelect"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="hidden-input"
        @change="onFileSelected"
      >

      <div v-if="scanStatus === 'scanning'" class="scanning-state">
        <IconLoader2 :size="32" class="spin" />
        <span>识别中...</span>
      </div>

      <div v-else class="idle-state">
        <IconUpload :size="32" />
        <span class="main-text">点击上传或拖入二维码图片</span>
        <span class="sub-text">支持 Ctrl+V 粘贴图片</span>
      </div>
    </div>

    <!-- 分隔线 -->
    <div class="divider">
      <span>或</span>
    </div>

    <!-- 文本输入 -->
    <div class="text-input-area">
      <textarea
        v-model="textInput"
        placeholder="粘贴配置文本..."
        rows="3"
        class="text-input"
      />
      <Button
        variant="outline"
        size="small"
        :disabled="!textInput.trim()"
        @click="handleTextParse"
      >
        <IconClipboard :size="16" />
        解析文本
      </Button>
    </div>

    <!-- 错误提示 -->
    <div v-if="scanStatus === 'error'" class="error-tip">
      {{ scanError }}
    </div>
  </div>
</template>

<style scoped>
.qr-importer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 拖拽上传区域 */
.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  background: var(--bg-input);
  cursor: pointer;
  transition: all 0.2s;
}

.drop-zone:hover {
  border-color: var(--color-primary);
  background: var(--bg-hover-card);
}

.drop-zone.drag-over {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.drop-zone.scanning {
  cursor: wait;
  opacity: 0.8;
}

.hidden-input {
  display: none;
}

.idle-state,
.scanning-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
}

.main-text {
  font-size: 14px;
  font-weight: 500;
}

.sub-text {
  font-size: 12px;
  color: var(--text-tertiary);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 分隔线 */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

/* 文本输入区域 */
.text-input-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.text-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 13px;
  font-family: monospace;
  resize: vertical;
}

.text-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.text-input::placeholder {
  color: var(--text-tertiary);
}

/* 错误提示 */
.error-tip {
  padding: 12px;
  background: var(--color-danger-bg);
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-danger);
}
</style>
