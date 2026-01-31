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
  GRID_PATTERN_BG,
  EXPORT_SCALE_OPTIONS
} from '../../composables/useShareCard'
import SettingSlider from '@/components/SettingsPanel/components/SettingSlider.vue'
import CapsuleTabs from '@/components/SettingsPanel/components/CapsuleTabs.vue'
import ColorPicker from '@/components/ColorPicker/ColorPicker.vue'
import SelectMenu from '@/components/SelectMenu/index.vue'

const dateOptions = [
  { label: '隐藏', value: 'none' },
  { label: '公历 + 农历', value: 'combined', description: '2024.01.30 · 腊月廿一' },
  { label: '公历 (点)', value: 'gregorian_dot', description: '2024.01.30' },
  { label: '公历 (横线)', value: 'gregorian_dash', description: '2024-01-30' },
  { label: '公历 (斜杠)', value: 'gregorian_slash', description: '2024/01/30' },
  { label: '公历 (中文)', value: 'chinese_date', description: '2024年1月30日' },
  { label: '英文 (短)', value: 'en_short', description: 'Jan 30, 2024' },
  { label: '农历 (简约)', value: 'lunar', description: '腊月廿一' },
  { label: '农历 (干支)', value: 'lunar_detail', description: '甲辰年 · 腊月廿一' },
  { label: '日期 + 时间', value: 'datetime', description: '2024.01.30 14:00' },
  { label: '自定义', value: 'custom' }
]

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

// 目标切换
const activeTarget = ref<'poem' | 'author' | 'title'>('poem')

const targetTabs = [
  { value: 'poem', label: '诗句' },
  { value: 'author', label: '作者' },
  { value: 'title', label: '标题' }
]

const targetStyle = computed(() => state.styles[activeTarget.value])

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
const scaleTabs = EXPORT_SCALE_OPTIONS.map(s => ({ value: s.value, label: s.label }))

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
      <div class="form-row">
         <div class="form-col">
           <label class="form-label">日期显示</label>
           <SelectMenu
             v-model="state.dateStyle"
             :options="dateOptions"
             trigger-width="100%"
             placement="bottomRight"
           />
        </div>
      </div>
      <div class="form-row" v-if="state.dateStyle === 'custom'">
        <div class="form-col">
           <input
             v-model="state.customDate"
             type="text"
             class="form-input"
             placeholder="输入自定义日期文本"
           />
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
    </section>

    <!-- 样式设置 (整合) -->
    <section class="control-group">
      <h3 class="group-title">样式设置</h3>
      
      <!-- 编辑目标切换 -->
      <div class="form-item">
        <CapsuleTabs v-model="activeTarget" :items="targetTabs" stretch />
      </div>

      <!-- 字体 -->
      <div class="form-item">
        <label class="form-label">字体</label>
        <CapsuleTabs v-model="targetStyle.font" :items="fontTabs" layout="grid" :grid-cols="2" />
      </div>

      <!-- 对齐方式 -->
      <div class="form-item">
        <label class="form-label">对齐方式</label>
        <CapsuleTabs v-model="targetStyle.align" :items="alignTabs" stretch />
      </div>

      <!-- 字号 -->
      <div class="form-row">
        <div class="form-col">
          <SettingSlider v-model="targetStyle.fontSize" label="字号" :min="12" :max="120" :step="1" unit="px" />
        </div>
      </div>

       <!-- 字间距 & 行间距 -->
      <div class="form-row">
        <div class="form-col">
          <SettingSlider v-model="targetStyle.letterSpacing" label="字距" :min="0" :max="30" :step="1" unit="px" />
        </div>
      </div>

      <!-- 行距 & 字重 -->
      <div class="form-row">
         <div class="form-col">
          <SettingSlider v-model="targetStyle.lineHeight" label="行距" :min="1.0" :max="3.0" :step="0.1" />
        </div>
        <div class="form-col">
          <SettingSlider v-model="targetStyle.fontWeight" label="字重" :min="100" :max="900" :step="100" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-col">
           <SettingSlider v-model="targetStyle.strokeWidth" label="描边" :min="0" :max="8" :step="0.5" unit="px" />
        </div>
      </div>

      <!-- 颜色 & 描边色 -->
      <div class="form-row">
        <div class="form-col">
          <label class="form-label">颜色</label>
          <ColorPicker v-model="targetStyle.color" />
        </div>
        <div class="form-col">
          <label class="form-label">描边色</label>
           <ColorPicker v-model="targetStyle.strokeColor" />
        </div>
      </div>

      <!-- 阴影 -->
      <div class="form-row">
        <div class="form-col">
           <SettingSwitch v-model="state.shadow" label="全局阴影" />
        </div>
      </div>
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

    <!-- 导出设置 -->
    <section class="control-group">
      <h3 class="group-title">
        <IconUpload :size="16" />
        导出设置
      </h3>
      <div class="form-item">
        <label class="form-label">导出清晰度 (影响图片尺寸)</label>
        <CapsuleTabs v-model="state.exportScale" :items="scaleTabs" stretch />
      </div>
    </section>
  </aside>
</template>

<style scoped>
.control-panel {
  width: 420px;
  height: 100%;
  background: var(--bg-panel);
  backdrop-filter: blur(16px);
  border-right: var(--border-glass);
  overflow-y: auto;
  overflow-x: hidden;
  overflow-x: hidden;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  flex-direction: column;
  gap: var(--space-4);
  flex-shrink: 0;
  border-radius: var(--radius-ml) 0 0 var(--radius-ml)
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
  margin-bottom: var(--space-3);
  align-items: center; /* 确保垂直对齐 */
  width: 100%; /* 确保行占满容器宽度 */
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-col {
  flex: 1;
  min-width: 0; /* 关键：防止 flex 子项被内容撑开导致溢出 */
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
