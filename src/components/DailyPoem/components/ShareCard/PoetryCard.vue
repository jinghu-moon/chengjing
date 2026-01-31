<!--
  PoetryCard.vue - 核心预览卡片组件
  职责：纯展示组件，接收状态并渲染卡片，将被截图
-->
<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useShareCard } from '../../composables/useShareCard'
import dayjs from 'dayjs'
import { getLunarDate } from 'chinese-days'

const { state, getFontFamily, canvasSize } = useShareCard()

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

const poemStyle = computed(() => {
  const s = state.styles.poem
  return {
    fontSize: `${s.fontSize}px`,
    fontWeight: s.fontWeight,
    color: s.color,
    fontFamily: getFontFamily(s.font),
    textShadow: state.shadow ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
    WebkitTextStroke: s.strokeWidth > 0 ? `${s.strokeWidth}px ${s.strokeColor}` : 'unset',
    textAlign: s.align,
    lineHeight: s.lineHeight,
    letterSpacing: `${s.letterSpacing}px`
  }
})

const authorStyle = computed(() => {
  const s = state.styles.author
  return {
    fontSize: `${s.fontSize}px`,
    fontWeight: s.fontWeight,
    color: s.color,
    fontFamily: getFontFamily(s.font),
    textShadow: state.shadow ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
    WebkitTextStroke: s.strokeWidth > 0 ? `${s.strokeWidth}px ${s.strokeColor}` : 'unset',
    textAlign: s.align,
    lineHeight: s.lineHeight,
    letterSpacing: `${s.letterSpacing}px`
  }
})

const titleStyle = computed(() => {
  const s = state.styles.title
  return {
    fontSize: `${s.fontSize}px`,
    fontWeight: s.fontWeight,
    color: s.color,
    fontFamily: getFontFamily(s.font),
    textShadow: state.shadow ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
    WebkitTextStroke: s.strokeWidth > 0 ? `${s.strokeWidth}px ${s.strokeColor}` : 'unset',
    textAlign: s.align,
    lineHeight: s.lineHeight,
    letterSpacing: `${s.letterSpacing}px`
  }
})

// 日期信息
const dateInfo = computed(() => {
  const style = state.dateStyle
  if (style === 'none') return null
  
  if (style === 'custom') {
    return { type: 'single', text: state.customDate || '自定义日期' }
  }

  const now = dayjs()
  let lunar
  try {
     lunar = getLunarDate(now.toDate())
  } catch (e) {
    console.error('Lunar date error', e)
    lunar = { yearCyl: '', lunarMonCN: '', lunarDayCN: '' }
  }

  switch (style) {
    case 'combined':
      return { 
        type: 'combined', 
        lunar: `${lunar.yearCyl}年 · ${lunar.lunarMonCN} · ${lunar.lunarDayCN}`,
        gregorian: now.format('YYYY.MM.DD')
      }
    case 'gregorian_dot':
      return { type: 'single', text: now.format('YYYY.MM.DD') }
    case 'gregorian_dash':
      return { type: 'single', text: now.format('YYYY-MM-DD') }
    case 'gregorian_slash':
      return { type: 'single', text: now.format('YYYY/MM/DD') }
    case 'chinese_date':
      return { type: 'single', text: now.format('YYYY年M月D日') }
    case 'en_short':
      return { type: 'single', text: now.format('MMM D, YYYY') }
    case 'lunar':
      return { type: 'single', text: `${lunar.lunarMonCN} · ${lunar.lunarDayCN}` }
    case 'lunar_detail':
      return { type: 'single', text: `${lunar.yearCyl}年 · ${lunar.lunarMonCN} · ${lunar.lunarDayCN}` }
    case 'datetime':
      return { type: 'single', text: now.format('YYYY.MM.DD HH:mm') }
    default:
      return null
  }
})

const dateStyle = computed(() => {
  // 跟随作者样式，但稍小
  const s = state.styles.author
  return {
    color: s.color,
    fontFamily: getFontFamily(s.font),
    fontWeight: 400,
    fontSize: `${Math.max(12, s.fontSize * 0.6)}px`, // 动态缩放
    opacity: 0.8
  }
})

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
            
             <!-- 日期显示 -->
            <div v-if="dateInfo" class="date-text" :style="dateStyle">
              <template v-if="dateInfo.type === 'combined'">
                <span class="lunar">{{ dateInfo.lunar }}</span>
                <span class="divider"></span>
                <span class="gregorian">{{ dateInfo.gregorian }}</span>
              </template>
              <template v-else>
                <span>{{ dateInfo.text }}</span>
              </template>
            </div>
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
  border-radius: 16px; /* 确保阴影也是圆角的 */
}

.card {
  width: 100%;
  height: 100%;
  position: relative;
  /* background: #fff;  Removed to allow transparent export */
  overflow: hidden;
  border-radius: 16px;
  transform: translateZ(0); /* 强制 GPU 渲染，修复圆角抗锯齿白边 */
  -webkit-mask-image: -webkit-radial-gradient(white, black); /* 修复 Safari/Chrome 圆角溢出 */
  mask-image: radial-gradient(white, black); /* 修复 Safari/Chrome 圆角溢出 */
}

.card-bg {
  position: absolute;
  inset: -1px; /* 微量外扩，防止边缘缝隙 */
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
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center; /* 默认垂直居中 */
}

.poem-text {
  white-space: pre-wrap;
  transition: all 0.2s;
}

.meta-group {
  margin-top: 24px;
  transition: all 0.2s;
}

.author-text,
.title-text {
  transition: all 0.2s;
}

.title-text {
  margin-top: 8px;
}

/* 日期样式 */
.date-text {
  margin-top: 32px;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.8;
  white-space: nowrap;
}

.layout-vertical .date-text {
  writing-mode: vertical-rl;
  margin-top: 0;
  margin-left: 24px;
}

.date-text .divider {
  display: inline-block;
  width: 1px;
  height: 12px;
  background-color: currentColor;
  opacity: 0.6;
}

.layout-vertical .date-text .divider {
  width: 12px;
  height: 1px;
}
</style>
