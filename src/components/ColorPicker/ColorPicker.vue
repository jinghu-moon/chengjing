<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { onClickOutside, useElementBounding, useWindowSize } from '@vueuse/core'
import { hsvToRgb, rgbToHsv, hexToRgba, rgbaToHex } from './utils'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// 状态
const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

// 拖拽逻辑 (SV Panel)
const svPanelRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)

// HSV 内部状态
const navState = ref({
  h: 0,
  s: 0,
  v: 100,
  a: 1
})

// 初始化
watch(() => props.modelValue, (val) => {
  if (!val) return
  if (val.startsWith('#')) {
    const [r, g, b, a] = hexToRgba(val)
    const [h, s, v] = rgbToHsv(r, g, b)
    // 只有当面板未打开或正在外部更新时同步
    if (!isDragging.value) {
      navState.value = { h, s, v, a }
    }
  }
}, { immediate: true })

// 计算属性
const currentColor = computed(() => {
  const { h, s, v, a } = navState.value
  const [r, g, b] = hsvToRgb(h, s, v)
  return rgbaToHex(r, g, b, a)
})

const hueColor = computed(() => {
  const [r, g, b] = hsvToRgb(navState.value.h, 100, 100)
  return `rgb(${r}, ${g}, ${b})`
})

const pointerStyle = computed(() => {
  const { s, v } = navState.value
  return {
    left: `${s}%`,
    top: `${100 - v}%`,
    backgroundColor: currentColor.value // 指示器颜色跟随当前色
  }
})

// 更新 ModelValue
const updateColor = () => {
  emit('update:modelValue', currentColor.value)
}

const handleSvMove = (e: MouseEvent | TouchEvent) => {
  if (!svPanelRef.value) return
  const rect = svPanelRef.value.getBoundingClientRect()
  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY

  let x = clientX - rect.left
  let y = clientY - rect.top

  x = Math.max(0, Math.min(x, rect.width))
  y = Math.max(0, Math.min(y, rect.height))

  navState.value.s = (x / rect.width) * 100
  navState.value.v = 100 - (y / rect.height) * 100
  
  updateColor()
}

const startDrag = (e: MouseEvent | TouchEvent) => {
  isDragging.value = true
  handleSvMove(e)
  window.addEventListener('mousemove', handleDrag)
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchmove', handleDrag)
  window.addEventListener('touchend', stopDrag)
}

const handleDrag = (e: MouseEvent | TouchEvent) => {
  if (isDragging.value) {
    handleSvMove(e)
  }
}

const stopDrag = () => {
  isDragging.value = false
  window.removeEventListener('mousemove', handleDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchmove', handleDrag)
  window.removeEventListener('touchend', stopDrag)
}

// Sliders
const onHueChange = () => {
  updateColor()
}

const onAlphaChange = () => {
  updateColor()
}

// HEX Input
const inputHex = ref('')
watch(currentColor, (val) => {
  if (!isTypingHex.value) {
    inputHex.value = val.toUpperCase()
  }
})

const isTypingHex = ref(false)
const onHexInput = () => {
  const val = inputHex.value
  // 支持 6 位或 8 位 hex
  if (/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(val)) {
    const [r, g, b, a] = hexToRgba(val)
    const [h, s, v] = rgbToHsv(r, g, b)
    navState.value = { h, s, v, a }
    updateColor()
  }
}

// Popover Positioning
const { top, left, height } = useElementBounding(triggerRef)
const { height: windowHeight } = useWindowSize()

const panelStyle = computed(() => {
  // 简单计算，向下展开；如果底部不够，向上展开
  let t = top.value + height.value + 8
  if (t + 360 > windowHeight.value) {
    t = top.value - 360 - 8
  }
  
  return {
    top: `${t}px`,
    left: `${left.value}px`, // 简单左对齐
  }
})

// Close Logic
onClickOutside(panelRef, (e) => {
  // 忽略点击 trigger
  if (triggerRef.value && triggerRef.value.contains(e.target as Node)) return
  isOpen.value = false
})

// Presets
const presets = [
  '#FFFFFF', '#000000', '#F44336', '#E91E63', '#9C27B0', 
  '#673AB7', '#3F51B5', '#2196F3', '#009688', '#4CAF50', 
  '#FFEB3B', '#FF9800', '#795548', '#607D8B'
]
const selectPreset = (color: string) => {
  const [r, g, b, a] = hexToRgba(color)
  const [h, s, v] = rgbToHsv(r, g, b)
  navState.value = { h, s, v, a }
  updateColor()
}

</script>

<template>
  <div class="color-picker-trigger" ref="triggerRef" @click="isOpen = !isOpen">
    <div class="trigger-swatch" :style="{ backgroundColor: modelValue }"></div>
    <span class="trigger-text">{{ modelValue.toUpperCase() }}</span>
  </div>

  <Teleport to="body">
    <div 
      v-if="isOpen" 
      class="color-picker-panel" 
      ref="panelRef"
      :style="panelStyle"
    >
      <!-- SV Panel -->
      <div 
        class="sv-panel" 
        ref="svPanelRef" 
        @mousedown="startDrag"
        @touchstart.prevent="startDrag"
        :style="{ backgroundColor: hueColor }"
      >
        <div class="sv-white"></div>
        <div class="sv-black"></div>
        <div class="sv-cursor" :style="pointerStyle"></div>
      </div>

      <!-- Controls -->
      <div class="controls-section">
        <div class="sliders">
          <!-- Hue -->
          <div class="slider-row">
            <label>H</label>
            <input 
              type="range" 
              v-model.number="navState.h" 
              min="0" 
              max="360" 
              class="hue-slider"
              @input="onHueChange"
            />
          </div>
           <!-- Alpha -->
          <div class="slider-row">
            <label>A</label>
            <input 
              type="range" 
              v-model.number="navState.a" 
              min="0" 
              max="1" 
              step="0.01"
              class="alpha-slider"
              @input="onAlphaChange"
            />
          </div>
        </div>
        <!-- Active Color Preview -->
        <div class="active-color" :style="{ backgroundColor: currentColor }"></div>
      </div>

      <!-- Inputs -->
      <div class="input-section">
        <input 
          type="text" 
          v-model="inputHex"
          @focus="isTypingHex = true" 
          @blur="isTypingHex = false"
          @input="onHexInput"
          class="hex-input"
        />
        <div class="rgb-inputs">
           <!-- RGB Display (Readonly for now for simplicity) -->
            <div class="rgb-box">
              <span>{{ hsvToRgb(navState.h, navState.s, navState.v).join(',') }}, {{ navState.a }}</span>
            </div>
        </div>
      </div>

      <!-- Presets -->
      <div class="presets-section">
        <div 
          v-for="c in presets" 
          :key="c" 
          class="preset-dot"
          :style="{ backgroundColor: c }"
          @click="selectPreset(c)"
        ></div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.color-picker-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: var(--bg-input);
  border: var(--border-glass);
  border-radius: var(--radius-md);
  cursor: pointer;
  width: 100%;
  height: 36px;
  transition: all 0.2s;
}

.color-picker-trigger:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--color-primary);
}

.trigger-swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.trigger-text {
  font-family: var(--font-family-mono);
  font-size: 12px;
  color: var(--text-secondary);
}

/* Panel Styles */
.color-picker-panel {
  position: absolute; /* Fixed via style binding */
  width: 260px;
  background: #1e232a; /* Nord Bg */
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  border-radius: 12px;
  padding: 12px;
  z-index: 9999;
  user-select: none;
}

.sv-panel {
  width: 100%;
  height: 160px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: crosshair;
  margin-bottom: 12px;
}

.sv-white {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, #fff, rgba(255,255,255,0));
}

.sv-black {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, #000, rgba(0,0,0,0));
}

.sv-cursor {
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 2px rgba(0,0,0,0.5);
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.controls-section {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  align-items: center;
}

.sliders {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-row label {
  font-size: 10px;
  color: var(--text-tertiary);
  width: 10px;
}

.hue-slider {
  flex: 1;
  height: 10px;
  border-radius: 5px;
  -webkit-appearance: none;
  appearance: none;
  outline: none;
  background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
}

.hue-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 2px rgba(0,0,0,0.3);
  cursor: pointer;
  border: none;
}

.alpha-slider {
  flex: 1;
  height: 10px;
  border-radius: 5px;
  -webkit-appearance: none;
  appearance: none;
  outline: none;
  /* Checkerboard background for alpha */
  background: 
    linear-gradient(45deg, #ccc 25%, transparent 25%), 
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
  background-color: #fff;
  position: relative;
}

/* 动态背景覆盖，显示当前透明度效果 */
.alpha-slider::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 5px;
  background: linear-gradient(to right, transparent, currentColor);
  pointer-events: none;
}

.alpha-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 2px rgba(0,0,0,0.3);
  cursor: pointer;
  border: none;
  position: relative;
  z-index: 2;
}

.active-color {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.1);
  box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
}

.input-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 8px;
}

.hex-input {
  width: 90px;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  color: #fff;
  font-family: monospace;
  font-size: 12px;
  padding: 4px 8px;
  text-align: center;
}

.rgb-box {
  flex: 1;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  color: var(--text-secondary);
  font-family: monospace;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.presets-section {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.preset-dot {
  aspect-ratio: 1;
  border-radius: 4px; /* 方形圆角 */
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.1);
  transition: transform 0.1s;
}

.preset-dot:hover {
  transform: scale(1.1);
  border-color: #fff;
}
</style>
