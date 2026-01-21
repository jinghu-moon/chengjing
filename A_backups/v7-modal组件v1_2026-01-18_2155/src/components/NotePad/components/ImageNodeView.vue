<script setup lang="ts">
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { IconPhotoOff, IconLoader2 } from '@tabler/icons-vue'

const props = defineProps(nodeViewProps)

const displaySrc = shallowRef('')
const isLoading = ref(true)
const isError = ref(false)
const containerRef = ref<HTMLElement | null>(null)

// 属性计算
const width = computed(() => props.node.attrs.width)
const align = computed(() => props.node.attrs.align || 'center')
const src = computed(() => props.node.attrs.src)

// Hydration 逻辑：将 lime-image协议转为 blob url
const hydrate = async () => {
  const currentSrc = src.value

  // Case 1: 已经是 blob (刚上传或粘贴但未保存)
  if (currentSrc.startsWith('blob:') || currentSrc.startsWith('data:')) {
    displaySrc.value = currentSrc
    isLoading.value = false
    return
  }

  // Case 2: lime-image 协议或 data-image-id
  const imageId =
    props.node.attrs['data-image-id'] ||
    (currentSrc.startsWith('lime-image://') ? currentSrc.replace('lime-image://', '') : null)

  if (imageId) {
    isLoading.value = true
    isError.value = false
    try {
      const url = await getImageUrl(imageId)
      if (url) {
        displaySrc.value = url
      } else {
        console.warn(`[ImageNodeView] Image not found: ${imageId}`)
        isError.value = true
      }
    } catch (e) {
      console.error(`[ImageNodeView] Failed to load image ${imageId}:`, e)
      isError.value = true
    } finally {
      isLoading.value = false
    }
  } else {
    // Case 3: 普通外链
    displaySrc.value = currentSrc
    isLoading.value = false
  }
}

// 监听 src 变化 (例如从 blob 变成了 lime-image://)
watch(src, () => {
  hydrate()
})

// Lazy Load using IntersectionObserver
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (typeof IntersectionObserver !== 'undefined' && containerRef.value) {
    observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          hydrate()
          observer?.disconnect()
          observer = null
        }
      },
      { rootMargin: '200px' }
    ) // 提前 200px 加载
    observer.observe(containerRef.value)
  } else {
    // Fallback for no IO or immediate load
    hydrate()
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

// 拖拽缩放逻辑
const startResize = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation() // 防止触发编辑器的其他事件
  const startX = event.clientX
  const startWidth = parseInt(props.node.attrs.width) || 300

  const onMouseMove = (e: MouseEvent) => {
    // 简单的线性计算，向右拖增加宽度
    const diff = e.clientX - startX
    const currentWidth = Math.max(startWidth + diff, 50) // 最小 50px
    props.updateAttributes({ width: currentWidth.toString() })
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <NodeViewWrapper
    class="image-node-view"
    :class="[`align-${align}`, { 'is-selected': selected }]"
    :style="{ textAlign: align }"
  >
    <div
      ref="containerRef"
      class="image-container"
      :style="{ width: width + 'px', maxWidth: '100%' }"
    >
      <!-- 图片主体 -->
      <img
        v-if="displaySrc && !isError"
        :src="displaySrc"
        :alt="node.attrs.alt"
        class="main-image"
      />

      <!-- 加载状态 -->
      <div v-if="isLoading" class="status-overlay loading">
        <IconLoader2 class="spin" size="24" />
      </div>

      <!-- 错误状态 -->
      <div v-if="isError" class="status-overlay error">
        <IconPhotoOff size="24" />
        <span>图片已丢失</span>
      </div>

      <!-- 选中态控件 (仅在选中且加载成功时显示) -->
      <div v-if="selected && !isLoading" class="image-controls">
        <!-- 缩放手柄 -->
        <div class="resize-handle" @mousedown="startResize"></div>
      </div>
    </div>
  </NodeViewWrapper>
</template>

<style scoped>
.image-node-view {
  margin: 0.5rem 0;
  display: block;
  /* 允许 text-align 生效 */
  /* content-visibility: auto; 性能优化，但在某些浏览器可能导致滚动条跳动，暂不开启 */
}

/* Flex 对齐 fallback */
.image-node-view.align-left {
  text-align: left;
}

.image-node-view.align-center {
  text-align: center;
}

.image-node-view.align-right {
  text-align: right;
}

.image-container {
  position: relative;
  display: inline-block;
  /* 为了适应 text-align */
  line-height: 0;
  transition: width 0.1s ease-out;
  /* 平滑视觉效果 */
}

.main-image {
  width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s;
}

.is-selected .main-image {
  box-shadow: 0 0 0 2px var(--color-primary);
}

/* 加载/错误 遮罩 */
.status-overlay {
  width: 100%;
  min-height: 150px;
  /* 最小高度，防止高度坍塌 */
  background: var(--bg-active);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-tertiary);
  font-size: 12px;
}

.status-overlay.error {
  background: var(--bg-hover);
  color: var(--color-danger);
}

.spin {
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/* 控件 */
.resize-handle {
  position: absolute;
  right: 6px;
  bottom: 12px;
  top: 12px;
  width: 6px;
  background: var(--color-primary);
  /* 直接使用颜色变量 */
  border-radius: 4px;
  cursor: ew-resize;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 50;
  /* 确保层级够高 */
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
  /* 增加阴影增加辨识度 */
}

.resize-handle:hover,
.is-selected .resize-handle {
  opacity: 0.8;
}

.image-toolbar {
  position: absolute;
  top: -36px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-panel-dark, #2b2f3a);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-sm);
  display: flex;
  padding: 4px;
  gap: 2px;
  box-shadow: var(--shadow-md);
  z-index: 20;
  backdrop-filter: blur(8px);
}

.image-toolbar button {
  padding: 4px 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.image-toolbar button:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.image-toolbar button.active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.image-toolbar .delete-btn:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.divider {
  width: 1px;
  background: var(--border-divider);
  margin: 0 4px;
}
</style>
