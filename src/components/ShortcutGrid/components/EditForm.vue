<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { IconPhoto, IconX } from '@tabler/icons-vue'
import type { Shortcut, FolderLayoutMode } from '../../../types'
import CapsuleTabs from '../../SettingsPanel/components/CapsuleTabs.vue'

interface Props {
  isFolderMode: boolean
  editingItem: Shortcut
  onSave?: (data: Shortcut) => void
}

const props = defineProps<Props>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const formData = ref<Shortcut>({ ...props.editingItem })

// 监听 formData 变化，实时更新
watch(
  formData,
  newData => {
    if (props.onSave) {
      props.onSave(newData)
    }
  },
  { deep: true, immediate: true }
)

const previewIcon = computed(() => {
  if (formData.value.iconBase64) return formData.value.iconBase64
  if (formData.value.url) {
    try {
      return `https://icons.bitwarden.net/${new URL(formData.value.url).hostname}/icon.png`
    } catch {
      return ''
    }
  }
  return ''
})

const previewChar = computed(() =>
  formData.value.name ? formData.value.name.charAt(0).toUpperCase() : '?'
)

const PRESET_COLORS = [
  '#F1F1F1',
  '#FAFAFA',
  '#F5E6A1',
  '#F2D675',
  '#EAD98B',
  '#E8EEF3',
  '#C7EDE6',
  '#E6D6F3',
  '#D6E3B5',
  '#F2C6C6',
  '#D1D5DB',
  '#1F2933',
  '#FFCC00',
  '#B45309',
  '#7C2D12',
  '#FFFFFF',
  '#000000',
]

const folderModesOptions = [
  { label: '默认', value: 'default' },
  { label: '1x1', value: '1x1' },
  { label: '2x2', value: '2x2' },
  { label: '2x3', value: '2x3' },
  { label: '3x2', value: '3x2' },
  { label: '3x3', value: '3x3' },
  { label: '4x4', value: '4x4' },
]

const activeFolderMode = computed({
  get: () => formData.value.folderMode || 'default',
  set: (val: string | number) => {
    formData.value.folderMode = val === 'default' ? undefined : (val as FolderLayoutMode)
  }
})

const customRows = ref<number | string>('')
const customCols = ref<number | string>('')

const isCustomActive = computed(() => {
  return formData.value.folderMode && !folderModesOptions.some(opt => opt.value === formData.value.folderMode)
})

watch([customRows, customCols], ([r, c]) => {
  if (r && c) {
    formData.value.folderMode = `${r}x${c}` as FolderLayoutMode
  }
})

watch(() => formData.value.folderMode, (val) => {
  if (val) {
    const [r, c] = val.split('x').map(Number)
    if (r && c) {
      customRows.value = r
      customCols.value = c
    }
  }
}, { immediate: true })

const customColorInput = ref<HTMLInputElement | null>(null)

const handleColorSelect = (color: string) => {
  formData.value.color = color
}

const triggerColorPicker = () => {
  customColorInput.value?.click()
}

const triggerFileUpload = () => {
  fileInputRef.value?.click()
}

const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    formData.value.iconBase64 = ev.target?.result as string
  }
  reader.readAsDataURL(file)
  reader.readAsDataURL(file)
}

const handleWheel = (e: WheelEvent, target: 'rows' | 'cols') => {
  e.preventDefault()
  // Determine direction: deltaY > 0 is scroll down (decrease), deltaY < 0 is scroll up (increase)
  const delta = e.deltaY > 0 ? -1 : 1
  
  if (target === 'rows') {
    const current = typeof customRows.value === 'number' ? customRows.value : (parseInt(customRows.value as string) || 0)
    let newVal = current + delta
    if (newVal < 1) newVal = 1
    if (newVal > 10) newVal = 10 // Reasonable limit
    customRows.value = newVal
  } else {
    const current = typeof customCols.value === 'number' ? customCols.value : (parseInt(customCols.value as string) || 0)
    let newVal = current + delta
    if (newVal < 1) newVal = 1
    if (newVal > 10) newVal = 10
    customCols.value = newVal
  }
}
</script>

<template>
  <div class="edit-form">
    <div v-if="isFolderMode" class="form-section">
      <input
        v-model="formData.name"
        type="text"
        class="modern-input"
        placeholder="文件夹名称"
      />
      
      <div class="mode-selector">
        <span class="label-text">布局尺寸</span>
        <CapsuleTabs
          v-model="activeFolderMode"
          :items="folderModesOptions"
          class="folder-mode-tabs"
          layout="grid"
          :grid-cols="4"
        >
          <template #extra>
            <div 
              class="custom-layout-cell" 
              :class="{ active: isCustomActive }"
            >
              <input 
                class="mini-input" 
                placeholder="行" 
                v-model.number="customRows" 
                @keydown.stop 
                type="text"
                maxlength="1"
                @wheel="handleWheel($event, 'rows')"
              />
              <IconX :size="12" class="cross-icon" />
              <input 
                class="mini-input" 
                placeholder="列" 
                v-model.number="customCols" 
                @keydown.stop 
                type="text"
                maxlength="1"
                @wheel="handleWheel($event, 'cols')"
              />
            </div>
          </template>
        </CapsuleTabs>
      </div>
    </div>
    <template v-else>
      <div class="form-body">
        <div class="upload-section" @click="triggerFileUpload">
          <div
            class="preview-box"
            :class="{ filled: formData.filled, inverted: formData.inverted }"
            :style="{ backgroundColor: formData.color }"
          >
            <img
              v-if="previewIcon"
              :src="previewIcon"
              class="preview-img"
              @error="e => ((e.target as HTMLElement).style.display = 'none')"
            />
            <span v-else class="preview-char">{{ previewChar }}</span>
            <div class="upload-hint">
              <IconPhoto :size="20" />
            </div>
          </div>
          <span class="upload-text">更换图标</span>
          <input
            ref="fileInputRef"
            type="file"
            style="display: none"
            accept="image/*"
            @change="handleFileChange"
          />
        </div>
        <div class="form-section">
          <input v-model="formData.name" type="text" class="modern-input" placeholder="名称" />
          <input v-model="formData.url" type="text" class="modern-input" placeholder="URL" />
          <div class="options-row">
            <label class="checkbox-btn" :class="{ active: formData.filled }">
              <input v-model="formData.filled" type="checkbox" />
              <span>填充</span>
            </label>
            <label class="checkbox-btn" :class="{ active: formData.inverted }">
              <input v-model="formData.inverted" type="checkbox" />
              <span>反色</span>
            </label>
          </div>

          <!-- 颜色选择 -->
          <div class="color-selector">
            <span class="label-text">背景颜色</span>
            <div class="color-grid">
              <!-- 预设颜色 -->
              <div
                v-for="color in PRESET_COLORS"
                :key="color"
                class="color-dot"
                :style="{ backgroundColor: color }"
                :class="{ active: formData.color === color }"
                @click="handleColorSelect(color)"
              ></div>
              
              <!-- 自定义颜色 -->
              <div
                class="color-dot custom-add"
                :class="{ active: formData.color && !PRESET_COLORS.includes(formData.color) }"
                @click="triggerColorPicker"
                :style="formData.color && !PRESET_COLORS.includes(formData.color) ? { backgroundColor: formData.color } : {}"
              >
                <span class="plus-icon">+</span>
                <input
                  ref="customColorInput"
                  type="color"
                  v-model="formData.color"
                  class="native-color-input"
                />
              </div>
              
              <!-- 清除颜色（恢复半透明） -->
              <div 
                class="color-dot clear-btn"
                title="恢复默认"
                @click="formData.color = undefined"
              >
                <div class="slash-line"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.edit-form {
  width: 100%;
}

.form-body {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.upload-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  flex-shrink: 0;
}

.preview-box {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
}

.preview-box:hover {
  border-color: var(--color-primary);
  background: rgba(255, 255, 255, 0.15);
}

.preview-box.filled .preview-img {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

.preview-box.inverted {
  background: #1a1a1a;
}

.preview-box.inverted .preview-img {
  filter: invert(1) brightness(2);
}

.preview-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  z-index: 1;
  border-radius: 10px;
}

.preview-char {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
}

.upload-hint {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: 0.2s;
  color: #fff;
}

.upload-section:hover .upload-hint {
  opacity: 1;
}

.upload-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.form-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.modern-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  color: #fff;
  outline: none;
  transition: all 0.2s;
}

.modern-input:focus {
  background: rgba(0, 0, 0, 0.4);
  border-color: var(--color-primary);
}

.modern-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.options-row {
  display: flex;
  gap: 10px;
}

.checkbox-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.checkbox-btn input {
  display: none;
}

.checkbox-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.checkbox-btn.active {
  background: rgba(0, 122, 255, 0.15);
  color: var(--color-primary);
  border-color: rgba(0, 122, 255, 0.3);
  font-weight: 500;
}

.color-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-left: 2px;
}

.color-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-dot:hover {
  transform: scale(1.1);
}

.color-dot.active {
  border-color: #fff;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
}

.custom-add {
  border: 1px dashed rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.05);
}

.custom-add:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.6);
}

.plus-icon {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1;
}

.native-color-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

.clear-btn {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.2);
}

.slash-line {
  width: 100%;
  height: 1px;
  background: #ff5b5b;
  transform: rotate(45deg);
}

/* 文件夹模式选择器 */
.mode-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-layout-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
  border-radius: 8px;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.05); /* Match tab style */
  background: rgba(255, 255, 255, 0.05);
  box-sizing: border-box;
}

.custom-layout-cell.active {
   border-color: var(--color-primary);
   background: rgba(0, 123, 255, 0.1); 
   box-shadow: 0 0 0 1px var(--color-primary);
}

.mini-input {
   width: 24px;
   padding: 2px;
   text-align: center;
   background: rgba(0,0,0,0.3);
   border: 1px solid rgba(255,255,255,0.1);
   border-radius: 4px;
   color: #fff;
   font-size: 12px;
   outline: none;
   transition: border-color 0.2s;
}

.mini-input:focus {
   border-color: var(--color-primary);
}

.cross-icon {
   color: rgba(255,255,255,0.4);
}
</style>
