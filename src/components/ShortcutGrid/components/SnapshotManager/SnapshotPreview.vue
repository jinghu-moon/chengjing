<template>
  <div class="snapshot-preview" ref="containerRef">
    <div class="scale-wrapper" :style="wrapperStyle">
       <ShortcutGrid 
         v-if="shouldRender"
         :preview-snapshot="snapshot" 
       />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { LayoutSnapshot } from '../../composables/useSnapshot'
import ShortcutGrid from '../../ShortcutGrid.vue'

interface Props {
  snapshot: LayoutSnapshot
}

const props = defineProps<Props>()

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)
const containerHeight = ref(0)
const shouldRender = ref(false)

// 计算实际内容尺寸
const contentSize = computed(() => {
  const { layoutGridCols, layoutGridRows, layoutGridGapX, layoutGridGapY, iconConfig } = props.snapshot.data.settings
  // 必须与 ShortcutGrid 中的计算逻辑保持一致
  // containerWidthStyle logic:
  // cols * boxSize + (cols - 1) * gapX + contentPadding (40)
  const paddingX = 40
  const width = layoutGridCols * iconConfig.boxSize + (layoutGridCols - 1) * layoutGridGapX + paddingX

  // containerHeightStyle logic:
  // rows * boxSize + (rows - 1) * gapY + paddingY (20)
  const paddingY = 20
  const height = layoutGridRows * iconConfig.boxSize + (layoutGridRows - 1) * layoutGridGapY + paddingY

  return { width, height }
})

// 计算缩放比例
const scale = computed(() => {
  if (containerWidth.value === 0 || contentSize.value.width === 0) return 0.2 // 默认安全值
  
  const scaleX = containerWidth.value / contentSize.value.width
  const scaleY = containerHeight.value / contentSize.value.height
  
  // 保持比例，取较小值以完全容纳 (contain)
  return Math.min(scaleX, scaleY, 1) // 不放大，最大 1
})

const wrapperStyle = computed(() => ({
  width: `${contentSize.value.width}px`,
  height: `${contentSize.value.height}px`,
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left',
  // 居中偏移: 如果 scale 之后比 container 小，居中对齐
  marginLeft: `${(containerWidth.value - contentSize.value.width * scale.value) / 2}px`,
  marginTop: `${(containerHeight.value - contentSize.value.height * scale.value) / 2}px`
}))

// 监听容器大小变化
let observer: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        // 使用 contentRect 更准确
        containerWidth.value = entry.contentRect.width
        containerHeight.value = entry.contentRect.height
        shouldRender.value = true
      }
    })
    observer.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>

<style scoped>
.snapshot-preview {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  /* 背景由 SnapshotManager 提供，这里保持透明或跟随 */
  background: transparent; 
}

.scale-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  /* 硬件加速 */
  will-change: transform; 
}
</style>
