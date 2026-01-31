<!--
  ShareCardDialog/index.vue - 主对话框容器
  职责：组装 ControlPanel 和 PoetryCard，处理导出逻辑
-->
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { 
  IconDownload, 
  IconRefresh, 
  IconMaximize, 
  IconMinus, 
  IconPlus,
  IconChevronLeft,
  IconChevronRight
} from '@tabler/icons-vue'
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
const { isExporting, exportAsBlob, download } = useExportImage()
const { showToast } = useToast()
const { width, height } = useWindowSize()

// 侧边栏折叠状态
const isCollapsed = ref(false)

// 预览缩放比例 (默认自适应)
const scale = ref(0.7)
// 预览区域 DOM 引用
const previewAreaRef = ref<HTMLElement | null>(null)

// 自动适应窗口/容器大小
const fitToWindow = () => {
  if (!previewAreaRef.value) return

  // 获取预览容器的实际可用宽高 (减去 padding)
  const padding = 64 // var(--space-8) * 2
  const availableWidth = previewAreaRef.value.clientWidth - padding
  const availableHeight = previewAreaRef.value.clientHeight - padding
  
  if (availableWidth <= 0 || availableHeight <= 0) return

  // 解析卡片实际尺寸
  const [w, h] = state.size.split('x').map(Number)
  
  // 计算宽/高适配比例
  const ratioW = availableWidth / w
  const ratioH = availableHeight / h
  
  // 取较小值，保留 10% 的额外边距让它看起来更舒服
  let s = Math.min(ratioW, ratioH) * 0.9
  
  // 限制范围: 最小 0.2, 最大 1.5 (允许稍放大)
  s = Math.max(0.2, Math.min(1.5, s))
  
  scale.value = parseFloat(s.toFixed(2))
}

// 监听状态变化触发适配
// state.size 变化时需要重新适配
watch(() => state.size, () => {
  // 稍微延迟等待 DOM 更新
  setTimeout(fitToWindow, 50)
})

// 监听 Dialog 可见性变化初始化
watch(() => props.modelValue, (val) => {
  if (val) {
    // Dialog 打开动画结束后计算
    setTimeout(fitToWindow, 300)
  }
})

// 监听窗口大小变化 (因为 Dialog 可能是响应式的)
watch([width, height], () => {
  fitToWindow()
})

// 监听侧边栏折叠，重新计算适配
watch(isCollapsed, () => {
  setTimeout(fitToWindow, 350) // 等待动画结束
})

// 卡片引用
const cardRef = ref<InstanceType<typeof PoetryCard> | null>(null)

// 初始化诗词内容
watch(() => props.modelValue, (visible) => {
  if (visible && props.poem) {
    init(props.poem, props.author || '', props.title)
  }
}, { immediate: true })

// 导出图片
const handleDownload = async () => {
  if (!cardRef.value) return
  const el = cardRef.value.$el as HTMLElement

  showToast({ message: '正在生成图片...' })
  const blob = await exportAsBlob(el, { pixelRatio: state.exportScale })
  
  if (blob) {
    download(blob)
    showToast({ type: 'success', message: '图片已开始下载' })
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
      <!-- 侧边栏 -->
      <aside class="sidebar-container" :class="{ collapsed: isCollapsed }">
        <div class="sidebar-content">
          <ControlPanel />
        </div>
      </aside>

      <!-- 折叠切换按钮 -->
      <button 
        class="sidebar-toggle" 
        :class="{ collapsed: isCollapsed }"
        @click="isCollapsed = !isCollapsed"
        :title="isCollapsed ? '展开配置' : '折叠配置'"
      >
        <IconChevronRight v-if="isCollapsed" :size="16" />
        <IconChevronLeft v-else :size="16" />
      </button>

      <div class="preview-area" ref="previewAreaRef">
        <div class="card-container" :style="{ transform: `scale(${scale})` }">
          <PoetryCard ref="cardRef" />
        </div>
        
        <!-- 缩放控制栏 -->
        <div class="zoom-controls">
          <button class="zoom-btn" @click="scale = Math.max(0.2, parseFloat((scale - 0.1).toFixed(1)))">
            <IconMinus :size="16" />
          </button>
          
          <div class="zoom-slider-wrapper">
             <input 
              type="range" 
              v-model.number="scale" 
              class="zoom-slider" 
              min="0.2" 
              max="2" 
              step="0.05" 
            />
            <span class="zoom-text">{{ Math.round(scale * 100) }}%</span>
          </div>

          <button class="zoom-btn" @click="scale = Math.min(2, parseFloat((scale + 0.1).toFixed(1)))">
            <IconPlus :size="16" />
          </button>
          
          <div class="divider"></div>
          
          <button class="zoom-btn" @click="fitToWindow" title="适应窗口">
            <IconMaximize :size="16" />
          </button>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="footer-actions">
        <button class="btn btn-outline" :disabled="isExporting" @click="handleReset">
          <IconRefresh :size="16" />
          <span>重置</span>
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
  border-radius: var(--radius-ml);
  overflow: hidden;
  position: relative;
}

.sidebar-container {
  width: 420px;
  height: 100%;
  flex-shrink: 0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  border-right: var(--border-glass);
  position: relative;
  background: var(--bg-panel);
}

.sidebar-container.collapsed {
  width: 0;
  border-right: none;
}

.sidebar-content {
  width: 420px; /* 固定宽度，防止内容被压缩 */
  height: 100%;
}

.sidebar-toggle {
  position: absolute;
  left: 420px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 24px;
  height: 48px;
  background: var(--bg-panel);
  border: var(--border-glass);
  border-left: none; /*移除左边框，使其看起来像长在侧边栏上 */
  border-radius: 0 12px 12px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-sm);
}

/* 当侧边栏折叠时，按钮贴在左边缘 */
.sidebar-toggle.collapsed {
  left: 0;
  border-left: var(--border-glass); /* 恢复左边框 */
  border-radius: 0 12px 12px 0;
  transform: translateY(-50%);
}

.sidebar-toggle:hover {
  color: var(--color-primary);
  background: var(--bg-hover);
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
  transition: all 0.3s ease; /* 这里的 transition 可能不需要，flex 自动调整 */
}

.card-container {
  /* scale 由内联样式控制 */
  transform-origin: center center;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.zoom-controls {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  padding: 8px 12px;
  border-radius: 99px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 100;
}

.zoom-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;
}

.zoom-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.zoom-slider-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 180px;
}

.zoom-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
}

.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  transition: transform 0.2s;
}

.zoom-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.zoom-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-variant-numeric: tabular-nums;
  width: 36px;
  text-align: right;
}

.divider {
  width: 1px;
  height: 16px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 4px;
}

/* 统一滚动条样式 */
.preview-area::-webkit-scrollbar,
.sidebar-content :deep(.control-panel)::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.preview-area::-webkit-scrollbar-track,
.sidebar-content :deep(.control-panel)::-webkit-scrollbar-track {
  background: transparent;
}

.preview-area::-webkit-scrollbar-thumb,
.sidebar-content :deep(.control-panel)::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

.preview-area::-webkit-scrollbar-thumb:hover,
.sidebar-content :deep(.control-panel)::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>
