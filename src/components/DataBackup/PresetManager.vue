<script setup lang="ts">
/**
 * 配置预设管理组件
 * DataBackup 2.0 - Phase 1
 */
import { ref, computed } from 'vue'
import { IconPlus, IconCheck } from '@tabler/icons-vue'
import { usePresets } from '@/composables/usePresets'
import { useToast } from '@/components/Toast/composables/useToast'
import Dialog from '@/components/Dialog/Dialog.vue'
import Button from '@/components/Button/Button.vue'

const { presets, saveCurrentAsPreset, applyPreset, deletePreset } = usePresets()
const { showToast } = useToast()

// Delete Dialog State
const showDeleteDialog = ref(false)
const targetPreset = ref<{ id: string; name: string } | null>(null)

// 新建预设弹窗
const showCreateDialog = ref(false)
const newPresetName = ref('')
const newPresetIcon = ref('📦')
const newPresetDesc = ref('')

// 常用 emoji 选项
const emojiOptions = ['📦', '🎯', '🍅', '🌙', '☀️', '💼', '🎮', '📚', '🎨', '⚡']

// 分组：系统预设 + 用户预设
const systemPresets = computed(() => presets.value.filter(p => p.isSystem))
const userPresets = computed(() => presets.value.filter(p => !p.isSystem))

// 应用预设
const handleApply = (id: string, name: string) => {
  const success = applyPreset(id)
  if (success) {
    showToast({ type: 'success', message: `已应用「${name}」` })
  }
}

// 删除预设 Trigger
const handleDelete = (id: string, name: string) => {
  targetPreset.value = { id, name }
  showDeleteDialog.value = true
}

// 执行删除
const executeDelete = () => {
  if (!targetPreset.value) return
  
  deletePreset(targetPreset.value.id)
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
    newPresetIcon.value,
    newPresetDesc.value.trim() || undefined
  )

  showToast({ type: 'success', message: '预设已保存' })
  showCreateDialog.value = false

  // 重置表单
  newPresetName.value = ''
  newPresetIcon.value = '📦'
  newPresetDesc.value = ''
}
</script>

<template>
  <div class="preset-manager">
    <!-- 系统预设 -->
    <div class="preset-section">
      <h4 class="section-title">快速切换</h4>
      <div class="preset-grid">
        <div
          v-for="preset in systemPresets"
          :key="preset.id"
          class="preset-card system"
          @click="handleApply(preset.id, preset.name)"
        >
          <span class="preset-icon">{{ preset.icon }}</span>
          <div class="preset-info">
            <span class="preset-name">{{ preset.name }}</span>
            <span class="preset-desc">{{ preset.description }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户预设 -->
    <div class="preset-section" v-if="userPresets.length > 0">
      <h4 class="section-title">我的预设</h4>
      <div class="preset-grid">
        <div
          v-for="preset in userPresets"
          :key="preset.id"
          class="preset-card user"
          @click="handleApply(preset.id, preset.name)"
          @contextmenu.prevent="handleDelete(preset.id, preset.name)"
        >
          <span class="preset-icon">{{ preset.icon }}</span>
          <div class="preset-info">
            <span class="preset-name">{{ preset.name }}</span>
            <span class="preset-desc">{{ preset.description || '自定义预设' }}</span>
          </div>
          <button
            class="delete-btn"
            @click.stop="handleDelete(preset.id, preset.name)"
            title="删除"
          >×</button>
        </div>
      </div>
    </div>

    <!-- 新建预设区域 -->
    <div v-if="showCreateDialog" class="create-panel">
      <div class="panel-header">
        <span class="title">新建预设</span>
        <button class="close-btn" @click="showCreateDialog = false">×</button>
      </div>
      
      <div class="create-form">
        <div class="form-row">
          <label>图标</label>
          <div class="emoji-picker">
            <button
              v-for="emoji in emojiOptions"
              :key="emoji"
              class="emoji-btn"
              :class="{ active: newPresetIcon === emoji }"
              @click="newPresetIcon = emoji"
            >
              {{ emoji }}
            </button>
          </div>
        </div>

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
           <Button theme="primary" size="small" :icon="IconCheck" @click="handleCreate">
             保存
           </Button>
        </div>
      </div>
    </div>

    <!-- 新建按钮 (非编辑态显示) -->
    <Button
      v-else
      variant="dashed"
      block
      :icon="IconPlus"
      @click="showCreateDialog = true"
    >
      保存当前配置为预设
    </Button>
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
  gap: 16px;
}

.section-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.preset-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--glass-bg-light);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.preset-card:hover {
  background: var(--glass-bg-hover);
  transform: translateY(-1px);
}

.preset-card.user:hover .delete-btn {
  opacity: 1;
}

.preset-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.preset-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.preset-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-desc {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: var(--danger-bg);
  color: var(--danger);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

/* 表单样式 */
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
}

.form-row .required {
  color: var(--danger);
}

.form-row input {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--glass-bg-light);
  color: var(--text-primary);
  font-size: 13px;
}

.form-row input:focus {
  outline: none;
  border-color: var(--primary);
}

.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.emoji-btn {
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--glass-bg-light);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.15s;
}

.emoji-btn:hover {
  background: var(--glass-bg-hover);
}

.emoji-btn.active {
  border-color: var(--primary);
  background: var(--primary-bg);
}

/* 内联创建面板 */
.create-panel {
  background: var(--bg-input);
  border-radius: 12px;
  padding: 12px;
  border: 1px solid var(--border-color);
  animation: slideDown 0.2s ease-out;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-header .title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 0 4px;
}
.close-btn:hover { color: var(--text-primary); }

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
