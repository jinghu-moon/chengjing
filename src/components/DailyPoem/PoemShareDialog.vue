<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Dialog } from '../Dialog'
import { Button } from '../../Button'
import { IconDownload, IconX, IconLayout, IconTypography, IconPalette } from '@tabler/icons-vue'
import html2canvas from 'html2canvas'
import { useToast } from '../Toast/composables/useToast'
import type { Poem } from '../types'

const props = defineProps<{
  modelValue: boolean
  poem: Poem | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { showToast } = useToast()

// ===== State =====
const cardRef = ref<HTMLElement | null>(null)
const generating = ref(false)

// Config
const config = ref({
  layout: 'vertical' as 'horizontal' | 'vertical',
  align: 'center' as 'flex-start' | 'center' | 'flex-end',
  font: 'kaiti' as 'harmony' | 'song' | 'kaiti',
  theme: 0,
})

// Themes
const themes = [
  { name: 'Paper', bg: '#fdf6e3', color: '#5f5f5f', border: 'none' },
  { name: 'Ink', bg: '#f5f5f5', color: '#1a1a1a', border: '1px solid #ddd' },
  { name: 'Dark', bg: '#1a1a1a', color: '#e0e0e0', border: 'none' },
  { name: 'Gradient 1', bg: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', color: '#333', border: 'none' },
  { name: 'Gradient 2', bg: 'linear-gradient(to top, #fff1eb 0%, #ace0f9 100%)', color: '#444', border: 'none' },
  { name: 'Gradient 3', bg: 'linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)', color: '#fff', border: 'none' },
]

// Computed Styles
const currentTheme = computed(() => themes[config.value.theme])

const cardStyle = computed(() => {
  const t = currentTheme.value
  return {
    background: t.bg,
    color: t.color,
    border: t.border,
    writingMode: config.value.layout === 'vertical' ? 'vertical-rl' : 'horizontal-tb',
    // Flex direction depends on writing mode
    flexDirection: config.value.layout === 'vertical' ? 'column' : 'column', 
    // In vertical-rl, main axis is vertical. column makes items stack vertically (right to left). 
    // Actually we want poem and author to be separate blocks.
    // Let's control inner layout manually.
    fontFamily: getFontFamily(config.value.font),
    textAlign: config.value.layout === 'horizontal' ? 
      (config.value.align === 'flex-start' ? 'left' : config.value.align === 'flex-end' ? 'right' : 'center') 
      : 'left', // Vertical usually ignores text-align in flex container, align-items handles it
    alignItems: config.value.align, // For flex container
  }
})

const getFontFamily = (font: string) => {
  switch (font) {
    case 'song': return '"Noto Serif SC", "Source Han Serif SC", "Source Han Serif", "SimSun", "Songti SC", serif'
    case 'kaiti': return '"LXGW WenKai", "KaiTi", "STKaiti", "楷体", "Kai", serif'
    default: return '"HarmonyOS Sans SC", sans-serif'
  }
}

// ===== Methods =====

// Align label helper
const alignOptions = [
  { value: 'flex-start', label: '居左/上', icon: 'align-left' }, // Horizontal Left / Vertical Top
  { value: 'center', label: '居中', icon: 'align-center' },
  { value: 'flex-end', label: '居右/下', icon: 'align-right' }, // Horizontal Right / Vertical Bottom
]

const handleExport = async () => {
  if (!cardRef.value) return
  generating.value = true
  
  try {
    // Wait for fonts? (Assuming loaded or system)
    const canvas = await html2canvas(cardRef.value, {
      scale: 3, // High DPI
      useCORS: true,
      backgroundColor: null, // Transparent if styles handles it
      logging: false,
    })
    
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `daily-poem-${Date.now()}.png`
    link.click()
    
    showToast({ type: 'success', message: '图片已保存' })
    emit('update:modelValue', false)
  } catch (e) {
    console.error(e)
    showToast({ type: 'error', message: '生成失败，请重试' })
  } finally {
    generating.value = false
  }
}
</script>

<template>
  <Dialog
    :model-value="modelValue"
    title="生成诗词卡片"
    width="800px" 
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="share-container">
      <!-- Left: Preview -->
      <div class="preview-area">
        <div class="canvas-wrapper">
          <div 
            ref="cardRef" 
            class="poem-card"
            :class="[config.layout]"
            :style="cardStyle"
          >
            <div class="card-content">
              <div class="poem-body">
                <template v-if="poem">
                  {{ poem.content }}
                </template>
              </div>
              <div class="poem-meta">
                <span v-if="poem?.dynasty" class="dynasty">〔{{ poem.dynasty }}〕</span>
                <span class="author">{{ poem?.author }}</span>
                <!-- <span v-if="poem?.title" class="title">《{{ poem.title }}》</span> -->
              </div>
            </div>
            
            <!-- Watermark / Footer -->
            <div class="card-footer">
              <span class="logo">Daily Poem · 澄镜</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Controls -->
      <div class="controls-area">
        <div class="control-group">
          <label>布局</label>
          <div class="btn-group">
            <button 
              v-for="l in ['horizontal', 'vertical']" :key="l"
              :class="{ active: config.layout === l }"
              @click="config.layout = l as any"
            >
              {{ l === 'horizontal' ? '横版' : '竖版' }}
            </button>
          </div>
        </div>

        <div class="control-group">
          <label>对齐</label>
          <div class="btn-group">
            <button 
              v-for="opt in alignOptions" :key="opt.value"
              :class="{ active: config.align === opt.value }"
              @click="config.align = opt.value as any"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="control-group">
          <label>字体</label>
          <div class="btn-group">
            <button 
              :class="{ active: config.font === 'harmony' }"
              @click="config.font = 'harmony'"
              style="font-family: 'HarmonyOS Sans SC'"
            >黑体</button>
            <button 
              :class="{ active: config.font === 'song' }"
              @click="config.font = 'song'"
              style="font-family: 'Noto Serif SC', 'SimSun', serif"
            >宋体</button>
            <button 
              :class="{ active: config.font === 'kaiti' }"
              @click="config.font = 'kaiti'"
              style="font-family: 'LXGW WenKai', 'KaiTi', serif"
            >楷体</button>
          </div>
        </div>

        <div class="control-group">
          <label>背景主题</label>
          <div class="theme-grid">
            <button
              v-for="(t, idx) in themes" :key="idx"
              class="theme-btn"
              :class="{ active: config.theme === idx }"
              :style="{ background: t.bg, border: t.border }"
              @click="config.theme = idx"
            ></button>
          </div>
        </div>

        <div class="actions">
          <Button 
            variant="primary" 
            :loading="generating"
            block
            @click="handleExport"
          >
            <IconDownload size="18" style="margin-right: 6px;" />
            保存图片
          </Button>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
/* Import Web Fonts */
@import url('https://npm.elemecdn.com/lxgw-wenkai-screen-web/style.css');
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap');

.share-container {
  display: flex;
  height: 500px;
  overflow: hidden;
}

.preview-area {
  flex: 1;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 20px;
}

.canvas-wrapper {
  /* Scale preview to fit */
  transform-origin: center;
}

.poem-card {
  width: 400px;
  min-height: 400px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  position: relative;
}

/* Layout Specifics */
.poem-card.horizontal {
  /* writing-mode already set by inline style */
}

.poem-card.vertical {
  width: 300px;
  min-height: 500px;
  /* writing-mode set by inline style */
}

/* Content Area */
.card-content {
  flex: 1;
  display: flex;
  flex-direction: inherit; /* Inherit column/row from parent flex-dir */
  justify-content: center;
  gap: 24px;
  width: 100%;
}

.poem-body {
  font-size: 24px;
  line-height: 1.8;
  white-space: pre-wrap;
  font-weight: 500;
}

.poem-meta {
  font-size: 16px;
  opacity: 0.8;
  display: flex;
  gap: 8px;
  /* Align meta based on layout */
}

.poem-card.horizontal .poem-meta {
  flex-direction: row;
  justify-content: flex-end; /* Usually meta is at end? Or controlled by flex align */
}

.poem-card.vertical .poem-meta {
  flex-direction: column;
  /* In vertical-rl, column means stacking horizontally (from right to left or left to right depending) */
  /* Actually flex-direction column in vertical-rl stacks items right-to-left */
  margin-top: 20px;
}

.card-footer {
  margin-top: 30px;
  font-size: 12px;
  opacity: 0.6;
  text-align: right;
  /* Handle Footer in vertical mode */
}
.poem-card.vertical .card-footer {
  text-align: left; /* relative to bottom */
  margin-top: 0;
  margin-left: 20px;
}

/* Controls */
.controls-area {
  width: 280px;
  background: var(--bg-surface);
  border-left: 1px solid var(--border-color);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.control-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.btn-group {
  display: flex;
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 4px;
  gap: 2px;
}

.btn-group button {
  flex: 1;
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-tertiary);
  transition: all 0.2s;
}

.btn-group button.active {
  background: var(--bg-surface);
  color: var(--text-primary);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  font-weight: 500;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-btn {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
}

.theme-btn.active::after {
  content: '';
  position: absolute;
  inset: -3px;
  border: 2px solid var(--color-primary);
  border-radius: 50%;
}

.actions {
  margin-top: auto;
}
</style>
