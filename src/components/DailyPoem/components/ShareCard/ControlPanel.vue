<!--
  ControlPanel.vue - 配置面板组件
  职责：提供所有卡片配置控件，通过 v-model 双向绑定到 state
-->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  IconPhoto, 
  IconUpload, 
  IconLayoutRows, 
  IconLayoutColumns,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconPalette,
  IconX
} from '@tabler/icons-vue'
import { 
  useShareCard, 
  SIZE_OPTIONS, 
  FONT_OPTIONS, 
  IMAGE_BACKGROUNDS, 
  GRADIENT_BACKGROUNDS,
  GRID_PATTERN_BG
} from '../../composables/useShareCard'
import SettingSwitch from '@/components/SettingsPanel/components/SettingSwitch.vue'
import SettingSlider from '@/components/SettingsPanel/components/SettingSlider.vue'
import CapsuleTabs from '@/components/SettingsPanel/components/CapsuleTabs.vue'

const { state, setBackground } = useShareCard()

// 文件上传
const fileInputRef = ref<HTMLInputElement | null>(null)

const handleUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (evt) => {
    setBackground('image', evt.target?.result as string)
  }
  reader.readAsDataURL(file)
}

const selectImageBg = (src: string) => {
  setBackground('image', src)
}

const selectGradientBg = (src: string) => {
  setBackground('gradient', src)
}

const selectGridBg = () => {
  setBackground('gradient', GRID_PATTERN_BG.src)
}

// Tab 配置
const layoutTabs = [
  { value: 'vertical', label: '竖排', icon: IconLayoutColumns },
  { value: 'horizontal', label: '横排', icon: IconLayoutRows }
]

const alignTabs = [
  { value: 'left', label: '左', icon: IconAlignLeft },
  { value: 'center', label: '中', icon: IconAlignCenter },
  { value: 'right', label: '右', icon: IconAlignRight }
]

const fontTabs = FONT_OPTIONS.map(f => ({ value: f.value, label: f.label }))
const sizeTabs = SIZE_OPTIONS.map(s => ({ value: s.value, label: s.label }))

// 背景类型切换
const bgTypeTabs = [
  { value: 'image', label: '图片', icon: IconPhoto },
  { value: 'gradient', label: '渐变', icon: IconPalette }
]

// 自定义尺寸输入
const customWidth = ref<number | string>('')
const customHeight = ref<number | string>('')

const isCustomSizeActive = computed(() => {
  return state.size && !SIZE_OPTIONS.some(opt => opt.value === state.size)
})

watch([customWidth, customHeight], ([w, h]) => {
  if (w && h) {
    state.size = `${w}x${h}`
  }
})

watch(() => state.size, (val) => {
  if (val && isCustomSizeActive.value) {
    const [w, h] = val.split('x').map(Number)
    if (w && h) {
      customWidth.value = w
      customHeight.value = h
    }
  }
}, { immediate: true })

const handleWheel = (e: WheelEvent, target: 'width' | 'height') => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -50 : 50
  
  if (target === 'width') {
    const current = typeof customWidth.value === 'number' ? customWidth.value : (parseInt(customWidth.value as string) || 600)
    let newVal = current + delta
    if (newVal < 100) newVal = 100
    if (newVal > 3000) newVal = 3000
    customWidth.value = newVal
  } else {
    const current = typeof customHeight.value === 'number' ? customHeight.value : (parseInt(customHeight.value as string) || 900)
    let newVal = current + delta
    if (newVal < 100) newVal = 100
    if (newVal > 3000) newVal = 3000
    customHeight.value = newVal
  }
}
</script>

<template>
  <aside class="control-panel">
    <!-- 内容编辑 -->
    <section class="control-group">
      <h3 class="group-title">内容编辑</h3>
      <div class="form-item">
        <label class="form-label">诗句</label>
        <textarea
          v-model="state.poem"
          class="form-textarea"
          placeholder="输入诗句..."
          rows="4"
        ></textarea>
      </div>
      <div class="form-row">
        <div class="form-col">
          <label class="form-label">作者</label>
          <input v-model="state.author" type="text" class="form-input" placeholder="〔唐〕李白" />
        </div>
        <div class="form-col">
          <label class="form-label">标题</label>
          <input v-model="state.title" type="text" class="form-input" placeholder="《静夜思》" />
        </div>
      </div>
    </section>

    <!-- 布局设置 -->
    <section class="control-group">
      <h3 class="group-title">布局设置</h3>
      <div class="form-item">
        <label class="form-label">排版方向</label>
        <CapsuleTabs v-model="state.layout" :items="layoutTabs" stretch />
      </div>
      <div class="form-item">
        <label class="form-label">画布尺寸</label>
        <CapsuleTabs v-model="state.size" :items="sizeTabs" layout="grid" :grid-cols="2">
          <template #extra>
            <div 
              class="custom-size-cell" 
              :class="{ active: isCustomSizeActive }"
            >
              <input 
                class="size-input" 
                placeholder="宽" 
                v-model.number="customWidth" 
                @keydown.stop 
                type="text"
                maxlength="4"
                @wheel="handleWheel($event, 'width')"
              />
              <IconX :size="12" class="cross-icon" />
              <input 
                class="size-input" 
                placeholder="高" 
                v-model.number="customHeight" 
                @keydown.stop 
                type="text"
                maxlength="4"
                @wheel="handleWheel($event, 'height')"
              />
            </div>
          </template>
        </CapsuleTabs>
      </div>
      
      <!-- 独立对齐控制 -->
      <div class="form-item">
        <label class="form-label">诗句对齐</label>
        <CapsuleTabs v-model="state.poemAlign" :items="alignTabs" stretch />
      </div>
      <div class="form-item">
        <label class="form-label">作者对齐</label>
        <CapsuleTabs v-model="state.authorAlign" :items="alignTabs" stretch />
      </div>
      <div class="form-item">
        <label class="form-label">标题对齐</label>
        <CapsuleTabs v-model="state.titleAlign" :items="alignTabs" stretch />
      </div>
    </section>

    <!-- 字体样式 -->
    <section class="control-group">
      <h3 class="group-title">字体样式</h3>
      <div class="form-item">
        <label class="form-label">字体</label>
        <CapsuleTabs v-model="state.font" :items="fontTabs" layout="grid" :grid-cols="2" />
      </div>
      <div class="form-row">
        <div class="form-col">
          <SettingSlider v-model="state.fontSize" label="字号" :min="24" :max="120" :step="2" unit="px" />
        </div>
        <div class="form-col color-col">
          <label class="form-label">颜色</label>
          <input v-model="state.color" type="color" class="form-color" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-col">
          <SettingSlider v-model="state.strokeWidth" label="描边" :min="0" :max="8" :step="0.5" unit="px" />
        </div>
        <div class="form-col color-col">
          <label class="form-label">描边色</label>
          <input v-model="state.strokeColor" type="color" class="form-color" />
        </div>
      </div>
      <SettingSwitch v-model="state.shadow" label="文字阴影" />
    </section>

    <!-- 背景设置 -->
    <section class="control-group">
      <h3 class="group-title">
        <IconPhoto :size="16" />
        背景设置
      </h3>
      
      <!-- 背景类型切换 -->
      <div class="form-item">
        <CapsuleTabs v-model="state.bgType" :items="bgTypeTabs" stretch />
      </div>

      <!-- 图片背景 -->
      <div v-if="state.bgType === 'image'" class="form-item">
        <label class="form-label">选择背景图片</label>
        <div class="bg-grid">
          <div
            v-for="(bg, index) in IMAGE_BACKGROUNDS"
            :key="index"
            class="bg-item"
            :class="{ active: state.bgSrc === bg.src }"
            :style="{ backgroundImage: `url('${bg.src}')` }"
            :title="bg.label"
            @click="selectImageBg(bg.src)"
          ></div>
          <!-- 网格线背景 -->
          <div 
            class="bg-item bg-grid-pattern"
            :class="{ active: state.bgSrc === GRID_PATTERN_BG.src }"
            :title="GRID_PATTERN_BG.label"
            @click="selectGridBg"
          ></div>
          <!-- 上传按钮 -->
          <div class="bg-item bg-upload" @click="fileInputRef?.click()" title="上传图片">
            <IconUpload :size="18" />
          </div>
        </div>
        <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="handleUpload" />
      </div>

      <!-- 渐变背景 -->
      <div v-if="state.bgType === 'gradient'" class="form-item">
        <label class="form-label">选择渐变色</label>
        <div class="bg-grid">
          <div
            v-for="(bg, index) in GRADIENT_BACKGROUNDS"
            :key="index"
            class="bg-item"
            :class="{ active: state.bgSrc === bg.src }"
            :style="{ background: bg.src }"
            :title="bg.label"
            @click="selectGradientBg(bg.src)"
          ></div>
        </div>
      </div>

      <SettingSlider v-model="state.blur" label="背景模糊" :min="0" :max="30" unit="px" />
      <SettingSlider v-model="state.overlay" label="遮罩浓度" :min="0" :max="80" unit="%" />
      <SettingSlider v-model="state.vignette" label="暗角强度" :min="0" :max="100" unit="%" />
      <SettingSlider v-model="state.noise" label="纸张纹理" :min="0" :max="50" unit="%" />
    </section>
  </aside>
</template>

<style scoped>
.control-panel {
  width: 380px;
  background: var(--bg-panel);
  backdrop-filter: blur(16px);
  border-right: var(--border-glass);
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  flex-shrink: 0;
}

.control-panel::-webkit-scrollbar {
  width: 6px;
}

.control-panel::-webkit-scrollbar-track {
  background: transparent;
}

.control-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.control-group {
  border-bottom: var(--border-divider);
  padding-bottom: var(--space-6);
}

.control-group:last-child {
  border-bottom: none;
}

.group-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.group-title svg {
  color: var(--color-primary);
}

.form-item {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
  font-weight: 500;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-input);
  border: var(--border-glass);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  background: rgba(94, 129, 172, 0.05);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  line-height: 1.6;
}

.form-row {
  display: flex;
  gap: var(--space-3);
}

.form-col {
  flex: 1;
}

.color-col {
  flex: 0 0 70px;
}

.form-color {
  width: 100%;
  height: 36px;
  border: var(--border-glass);
  border-radius: var(--radius-md);
  cursor: pointer;
  background: transparent;
  padding: 0;
}

.form-color::-webkit-color-swatch-wrapper {
  padding: 0;
}

.form-color::-webkit-color-swatch {
  border: none;
  border-radius: 6px;
}

/* 背景选择网格 */
.bg-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.bg-item {
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  background-size: cover;
  background-position: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
}

.bg-item:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(--shadow-sm);
}

.bg-item.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(94, 129, 172, 0.3);
}

.bg-upload {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  background: var(--bg-panel-card);
  color: var(--text-tertiary);
}

.bg-upload:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.bg-grid-pattern {
  background: 
    repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(0,0,0,0.06) 20px),
    repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(0,0,0,0.06) 20px),
    #fff;
}

.hidden {
  display: none;
}

/* 自定义尺寸输入 */
.custom-size-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  border-radius: 8px;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.05);
  box-sizing: border-box;
  padding: 8px 12px;
}

.custom-size-cell.active {
  border-color: var(--color-primary);
  background: rgba(94, 129, 172, 0.1);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.size-input {
  width: 48px;
  padding: 4px 6px;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
  outline: none;
  transition: border-color 0.2s;
}

.size-input:focus {
  border-color: var(--color-primary);
}

.cross-icon {
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}
</style>
