<script setup lang="ts">
import { ref, watch } from 'vue'
import { IconArrowLeft, IconSparkles } from '@tabler/icons-vue'
import { Button } from '../../Button'
import type { PoemFormData } from '../types'

const props = defineProps<{
  initialData?: PoemFormData
  loading?: boolean
  apiLoading?: boolean
  title?: string
  submitText?: string
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', data: PoemFormData): void
  (e: 'fetch-api'): void
}>()

// 表单数据
const formData = ref<PoemFormData>({
  content: '',
  author: '',
  title: '',
  dynasty: '',
})

// 初始化/监听 initialData
watch(
  () => props.initialData,
  (val) => {
    if (val) {
      formData.value = { ...val }
    } else {
      resetForm()
    }
  },
  { immediate: true, deep: true }
)

const resetForm = () => {
  formData.value = { content: '', author: '', title: '', dynasty: '' }
}



const onSubmitClick = () => {
  emit('submit', formData.value)
}
</script>

<template>
  <div class="poem-form">
    <button class="back-btn" @click="emit('cancel')">
      <IconArrowLeft :size="16" />
      返回列表
    </button>

    <div class="form-container">
      <div class="form-group">
        <label>诗句内容 *</label>
        <textarea
          v-model="formData.content"
          rows="3"
          placeholder="请输入诗句内容"
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>作者 *</label>
          <input v-model="formData.author" type="text" placeholder="作者" />
        </div>
        <div class="form-group">
          <label>朝代</label>
          <input v-model="formData.dynasty" type="text" placeholder="朝代（可选）" />
        </div>
      </div>

      <div class="form-group">
        <label>标题</label>
        <input v-model="formData.title" type="text" placeholder="作品标题（可选）" />
      </div>

      <!-- 从 API 获取 -->
      <Button
        variant="outline"
        size="small"
        :loading="apiLoading"
        class="fetch-btn"
        @click="emit('fetch-api')"
      >
        <IconSparkles :size="16" />
        从 API 获取
      </Button>

      <div class="form-actions">
        <Button :ghost="true" @click="emit('cancel')">取消</Button>
        <Button :loading="loading" @click="onSubmitClick">
          {{ submitText || '保存' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  border-radius: var(--radius-md);
  margin: -4px -8px 0;
  width: fit-content;
}

.back-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-group input,
.form-group textarea {
  padding: 10px 12px;
  border: var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  font-family: inherit;
  resize: none;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--color-primary);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: var(--text-placeholder);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.fetch-btn {
  align-self: flex-start;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
}
</style>
