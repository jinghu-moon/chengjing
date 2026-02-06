<script setup lang="ts">
/**
 * 配置预设管理组件
 * 竖向卡片布局
 */
import { ref, computed } from 'vue'
import { IconCheck, IconTag, IconX } from '@tabler/icons-vue'
import { usePresets } from '@/composables/usePresets'
import { useToast } from '@/components/Toast/composables/useToast'
import Dialog from '@/components/Dialog/Dialog.vue'
import Button from '@/components/Button/Button.vue'

const { presets, saveCurrentAsPreset, applyPreset, deletePreset } = usePresets()
const { showToast } = useToast()

// 当前应用的预设 ID
const activePresetId = ref('')

// Delete Dialog State
const showDeleteDialog = ref(false)
const targetPreset = ref<{ id: string; name: string } | null>(null)

// 新建预设弹窗
const showCreateDialog = ref(false)
const newPresetName = ref('')
const newPresetDesc = ref('')

// 分组预设
const systemPresets = computed(() => presets.value.filter(p => p.isSystem))
const userPresets = computed(() => presets.value.filter(p => !p.isSystem))

// 应用预设
const handleApply = (id: string, name: string) => {
  const success = applyPreset(id)
  if (success) {
    activePresetId.value = id
    showToast({ type: 'success', message: `已应用「${name}」` })
  }
}

// 删除预设
const handleDelete = (id: string, name: string) => {
  targetPreset.value = { id, name }
  showDeleteDialog.value = true
}

const executeDelete = () => {
  if (!targetPreset.value) return
  deletePreset(targetPreset.value.id)
  if (activePresetId.value === targetPreset.value.id) {
    activePresetId.value = ''
  }
  showToast({ type: 'info', message: '预设已删除' })
  showDeleteDialog.value = false
}

// 创建预设
const handleCreate = () => {
  if (!newPresetName.value.trim()) {
    showToast({ type: 'warning', message: '请输入预设名称' })
    return
  }

  saveCurrentAsPreset(
    newPresetName.value.trim(),
    'IconPackage',
    newPresetDesc.value.trim() || undefined
  )

  showToast({ type: 'success', message: '预设已保存' })
  showCreateDialog.value = false
  newPresetName.value = ''
  newPresetDesc.value = ''
}
</script>

<template>
  <div class="preset-manager">
    <!-- 预设卡片列表 -->
    <div class="preset-list">
      <!-- 系统预设 -->
      <div
        v-for="preset in systemPresets"
        :key="preset.id"
        class="preset-card"
        :class="{ active: activePresetId === preset.id }"
        @click="handleApply(preset.id, preset.name)"
      >
        <div class="radio-indicator" :class="{ checked: activePresetId === preset.id }">
          <IconCheck v-if="activePresetId === preset.id" :size="14" :stroke-width="3" />
        </div>
        <div class="preset-info">
          <span class="preset-name">{{ preset.name }}</span>
          <span class="preset-desc">{{ preset.description || '系统预设' }}</span>
        </div>
        <div class="card-actions">
          <button class="action-btn"><IconTag :size="16" /></button>
        </div>
      </div>

      <!-- 用户预设 -->
      <div
        v-for="preset in userPresets"
        :key="preset.id"
        class="preset-card user"
        :class="{ active: activePresetId === preset.id }"
        @click="handleApply(preset.id, preset.name)"
      >
        <div class="radio-indicator" :class="{ checked: activePresetId === preset.id }">
          <IconCheck v-if="activePresetId === preset.id" :size="14" :stroke-width="3" />
        </div>
        <div class="preset-info">
          <span class="preset-name">{{ preset.name }}</span>
          <span class="preset-desc">{{ preset.description || '自定义' }}</span>
        </div>
        <div class="card-actions">
          <button class="action-btn"><IconTag :size="16" /></button>
          <button class="action-btn delete" @click.stop="handleDelete(preset.id, preset.name)">
            <IconX :size="16" />
          </button>
        </div>
      </div>

      <!-- 新建预设卡片 -->
      <div class="preset-card add-card" @click="showCreateDialog = true">
        <span>+ 新建预设配置</span>
      </div>
    </div>

    <!-- 新建预设面板 -->
    <div v-if="showCreateDialog" class="create-panel">
      <div class="panel-header">
        <span class="title">保存当前配置</span>
        <button class="close-btn" @click="showCreateDialog = false">×</button>
      </div>

      <div class="create-form">
        <div class="form-row">
          <label>名称 <span class="required">*</span></label>
          <input
            v-model="newPresetName"
            type="text"
            placeholder="如：工作模式"
            maxlength="20"
            @keydown.enter="handleCreate"
          />
        </div>

        <div class="form-row">
          <label>描述</label>
          <input
            v-model="newPresetDesc"
            type="text"
            placeholder="可选"
            maxlength="50"
            @keydown.enter="handleCreate"
          />
        </div>

        <div class="form-actions">
          <Button variant="outline" size="small" @click="showCreateDialog = false">取消</Button>
          <Button theme="primary" size="small" :icon="IconCheck" @click="handleCreate">保存</Button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <Dialog
      v-model="showDeleteDialog"
      title="删除预设"
      width="360px"
      type="error"
      :show-icon="true"
      @confirm="executeDelete"
    >
      <p>确定删除预设「{{ targetPreset?.name }}」？</p>
    </Dialog>
  </div>
</template>

<style scoped>
.preset-manager {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 预设卡片列表 */
.preset-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preset-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--bg-input);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1.5px solid var(--color-border-glass);
}

.preset-card:hover {
  background: var(--bg-hover-card);
  border-color: var(--color-border-hover);
}

.preset-card.active {
  border-color: var(--color-primary);
  background: var(--color-primary-alpha);
}

/* Radio 指示器 */
.radio-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--color-border-glass);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  background: transparent;
}

.radio-indicator.checked {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.preset-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.preset-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  transition: color 0.2s;
}

.preset-card.active .preset-name {
  color: var(--color-primary);
}

.preset-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 卡片操作按钮 */
.card-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--bg-input);
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bg-hover-card);
  color: var(--text-primary);
}

.action-btn.delete:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

/* 新建预设卡片 */
.add-card {
  justify-content: center;
  border: 2px dashed var(--color-border-glass);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  padding: 18px 16px;
}

.add-card:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-alpha);
}

/* 创建面板 */
.create-panel {
  background: var(--bg-panel-card);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid var(--border-glass);
  animation: slideDown 0.2s ease-out;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.panel-header .title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text-primary);
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.form-row .required {
  color: var(--color-danger);
}

.form-row input {
  padding: 8px 12px;
  border: 1px solid var(--border-glass);
  border-radius: 8px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 13px;
  transition: border-color 0.2s;
}

.form-row input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
