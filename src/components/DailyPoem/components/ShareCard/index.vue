<!--
  ShareCardDialog/index.vue - 主对话框容器
  职责：组装 ControlPanel 和 PoetryCard，处理导出逻辑
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { IconDownload, IconShare, IconRefresh } from '@tabler/icons-vue'
import { Dialog } from '@/components/Dialog'
import { useToast } from '@/components/Toast/composables/useToast'
import { useShareCard } from '../../composables/useShareCard'
import { useExportImage } from '../../composables/useExportImage'
import ControlPanel from './ControlPanel.vue'
import PoetryCard from './PoetryCard.vue'

const props = defineProps<{
  modelValue: boolean
  poem?: string
  author?: string
  title?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { state, init, reset } = useShareCard()
const { isExporting, exportAsBlob, download, share } = useExportImage()
const { showToast } = useToast()

// 卡片引用
const cardRef = ref<HTMLElement | null>(null)

// 初始化诗词内容
watch(() => props.modelValue, (visible) => {
  if (visible && props.poem) {
    init(props.poem, props.author || '', props.title)
  }
}, { immediate: true })

// 导出图片
const handleDownload = async () => {
  if (!cardRef.value) return

  showToast({ message: '正在生成图片...' })
  const blob = await exportAsBlob(cardRef.value)

  if (blob) {
    download(blob)
    showToast({ type: 'success', message: '图片已开始下载' })
  } else {
    showToast({ type: 'error', message: '导出失败，请重试' })
  }
}

// 分享图片
const handleShare = async () => {
  if (!cardRef.value) return

  showToast({ message: '正在生成图片...' })
  const blob = await exportAsBlob(cardRef.value)

  if (blob) {
    const shared = await share(blob, state.poem.substring(0, 50))
    if (!shared) {
      // 分享不可用或用户取消，降级为下载
      download(blob)
      showToast({ type: 'success', message: '图片已开始下载' })
    } else {
      showToast({ type: 'success', message: '分享成功' })
    }
  } else {
    showToast({ type: 'error', message: '导出失败，请重试' })
  }
}

// 重置配置
const handleReset = () => {
  reset()
  if (props.poem) {
    init(props.poem, props.author || '', props.title)
  }
  showToast({ message: '已重置为默认' })
}
</script>

<template>
  <Dialog
    :model-value="modelValue"
    title="生成分享卡片"
    width="1200px"
    :show-confirm-btn="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="share-card-layout">
      <ControlPanel />
      <div class="preview-area">
        <div ref="cardRef" class="card-container">
          <PoetryCard />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="footer-actions">
        <button class="btn btn-outline" :disabled="isExporting" @click="handleReset">
          <IconRefresh :size="16" />
          <span>重置</span>
        </button>
        <button class="btn btn-outline" :disabled="isExporting" @click="handleShare">
          <IconShare :size="16" />
          <span>分享</span>
        </button>
        <button class="btn btn-primary" :disabled="isExporting" @click="handleDownload">
          <IconDownload :size="16" />
          <span>{{ isExporting ? '处理中...' : '导出图片' }}</span>
        </button>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.footer-actions {
  display: flex;
  gap: var(--space-3);
  width: 100%;
  justify-content: flex-end;
}

.btn {
  padding: 0 var(--space-4);
  height: 36px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: var(--border-glass);
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  position: relative;
  overflow: hidden;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border-color: transparent;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-outline {
  background: var(--bg-panel-card);
  backdrop-filter: blur(8px);
  color: var(--text-primary);
}

.btn-outline:hover {
  background: var(--bg-hover);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.share-card-layout {
  display: flex;
  height: 75vh;
  max-height: 800px;
  background: var(--bg-panel);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.preview-area {
  flex: 1;
  background: 
    repeating-linear-gradient(
      45deg,
      rgba(255, 255, 255, 0.02) 0px,
      rgba(255, 255, 255, 0.02) 10px,
      transparent 10px,
      transparent 20px
    );
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  overflow: auto;
  position: relative;
}

.card-container {
  /* 缩放以适应预览区域 */
  transform: scale(0.7);
  transform-origin: center center;
}
</style>
