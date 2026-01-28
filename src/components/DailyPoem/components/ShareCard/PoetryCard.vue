<!--
  PoetryCard.vue - 核心预览卡片组件
  职责：纯展示组件，接收状态并渲染卡片，将被截图
-->
<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useShareCard } from '../../composables/useShareCard'

const { state, authorColor, canvasSize, fontFamily } = useShareCard()

// Canvas 噪点绘制
const noiseCanvas = ref<HTMLCanvasElement | null>(null)

const drawNoise = () => {
  const canvas = noiseCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvasSize.value.width
  const h = canvasSize.value.height

  canvas.width = w
  canvas.height = h
  ctx.clearRect(0, 0, w, h)

  if (state.noise <= 0) return

  const alpha = state.noise / 100
  const idata = ctx.createImageData(w, h)
  const buffer32 = new Uint32Array(idata.data.buffer)
  const len = buffer32.length

  for (let i = 0; i < len; i++) {
    if (Math.random() < 0.5) {
      buffer32[i] = (255 * alpha) << 24
    }
  }
  ctx.putImageData(idata, 0, 0)
}

// 监听噪点/尺寸变化
watch(() => [state.noise, state.size], drawNoise)
onMounted(() => {
  setTimeout(drawNoise, 100)
})

// 计算样式
const wrapperStyle = computed(() => ({
  width: `${canvasSize.value.width}px`,
  height: `${canvasSize.value.height}px`
}))

const bgStyle = computed(() => {
  const base: Record<string, string> = {
    filter: `blur(${state.blur}px)`
  }
  if (state.bgType === 'gradient') {
    base.background = state.bgSrc
  } else {
    base.backgroundImage = `url('${state.bgSrc}')`
    base.backgroundSize = 'cover'
    base.backgroundPosition = 'center'
  }
  return base
})

const overlayStyle = computed(() => {
  const overlayAlpha = state.overlay / 100
  const vignetteAlpha = state.vignette / 100

  let bg = `linear-gradient(rgba(0,0,0,${overlayAlpha}), rgba(0,0,0,${overlayAlpha}))`
  if (state.vignette > 0) {
    bg += `, radial-gradient(circle at center, transparent 40%, rgba(0,0,0,${vignetteAlpha}) 100%)`
  }
  return { background: bg }
})

const poemStyle = computed(() => ({
  fontSize: `${state.fontSize}px`,
  color: state.color,
  fontFamily: fontFamily.value,
  textShadow: state.shadow ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
  WebkitTextStroke: state.strokeWidth > 0 ? `${state.strokeWidth}px ${state.strokeColor}` : 'unset',
  textAlign: state.poemAlign
}))

const authorStyle = computed(() => ({
  color: authorColor.value,
  fontFamily: fontFamily.value,
  textShadow: state.shadow ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
  WebkitTextStroke: state.strokeWidth > 0 ? `${state.strokeWidth / 2}px ${state.strokeColor}` : 'unset',
  textAlign: state.authorAlign
}))

const titleStyle = computed(() => ({
  color: authorColor.value,
  fontFamily: fontFamily.value,
  textShadow: state.shadow ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
  WebkitTextStroke: state.strokeWidth > 0 ? `${state.strokeWidth / 2}px ${state.strokeColor}` : 'unset',
  textAlign: state.titleAlign
}))

const contentClass = computed(() => [
  `layout-${state.layout}`
])
</script>

<template>
  <div class="card-wrapper" :style="wrapperStyle">
    <div class="card">
      <!-- 背景层 -->
      <div class="card-bg" :style="bgStyle"></div>
      <!-- 遮罩层 -->
      <div class="card-overlay" :style="overlayStyle"></div>
      <!-- 噪点层 -->
      <canvas ref="noiseCanvas" class="card-noise"></canvas>
      <!-- 内容层 -->
      <div class="card-content" :class="contentClass">
        <div class="text-group">
          <div class="poem-text" :style="poemStyle">{{ state.poem }}</div>
          <div class="meta-group">
            <div class="author-text" :style="authorStyle">{{ state.author }}</div>
            <div v-if="state.title" class="title-text" :style="titleStyle">{{ state.title }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-wrapper {
  box-shadow: 0 16px 48px rgba(46, 52, 64, 0.5);
  transition: all 0.3s ease;
  position: relative;
}

.card {
  width: 100%;
  height: 100%;
  position: relative;
  background: #fff;
  overflow: hidden;
  border-radius: 16px;
}

.card-bg {
  position: absolute;
  inset: 0;
  z-index: 1;
  transition: filter 0.2s;
}

.card-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.card-noise {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  opacity: 0.12;
}

.card-content {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  padding: 60px;
  display: flex;
}

/* 竖排布局 */
.layout-vertical {
  flex-direction: row-reverse;
  justify-content: center;
  align-items: center;
}

.layout-vertical .text-group {
  writing-mode: vertical-rl;
  text-orientation: upright;
}

.layout-vertical .poem-text {
  margin-left: 32px;
  margin-bottom: 0;
}

.layout-vertical .meta-group {
  margin-left: 24px;
  margin-top: 0;
}

.layout-vertical .title-text {
  margin-top: 0;
  margin-left: 16px;
}

/* 横排布局 */
.layout-horizontal {
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.layout-horizontal .poem-text {
  margin-bottom: 32px;
}

/* 文本样式 */
.text-group {
  max-width: 90%;
  max-height: 90%;
}

.poem-text {
  white-space: pre-wrap;
  line-height: 1.8;
  letter-spacing: 0.05em;
  transition: all 0.2s;
}

.meta-group {
  margin-top: 24px;
  transition: all 0.2s;
}

.author-text,
.title-text {
  font-size: 0.45em;
  opacity: 0.75;
  line-height: 1.6;
  transition: all 0.2s;
}

.title-text {
  margin-top: 8px;
}
</style>
