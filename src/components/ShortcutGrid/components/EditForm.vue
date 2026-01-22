<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { IconPhoto } from '@tabler/icons-vue'
import type { Shortcut } from '../../../types'

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
    </div>
    <template v-else>
      <div class="form-body">
        <div class="upload-section" @click="triggerFileUpload">
          <div
            class="preview-box"
            :class="{ filled: formData.filled, inverted: formData.inverted }"
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
</style>
