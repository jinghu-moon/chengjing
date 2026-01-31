<script setup lang="ts">
import { ref, reactive } from 'vue'
import { IconDatabase, IconDownload, IconUpload } from '@tabler/icons-vue'
import Dialog from '@/components/Dialog/Dialog.vue'
import { useDataBackup, type RestoreStats } from '@/composables/useDataBackup'
import { useToast } from '@/components/Toast/composables/useToast'
import type { DiffResult } from '@/utils/backup-diff'

const { showToast } = useToast()
const { 
  exportBackup, 
  estimateSizeKB, 
  parseAndValidate, 
  performRestore,
  collectAllData,
  analyzeBackup,
  performMerge
} = useDataBackup()

const fileInput = ref<HTMLInputElement | null>(null)
const sizeEstimate = ref('...')
const showConfirmDialog = ref(false)
const restoreStats = ref<RestoreStats | null>(null)
const tempRestoreData = ref<any>(null)
const isLoading = ref(false)

// V1.1 State
const diffResult = ref<DiffResult | null>(null)
const mergeOptions = reactive({
  includePoems: true,
  includeTodos: true,
  includeNotes: true,
  overwriteSettings: false
})
const showResultDialog = ref(false)
const mergeReport = ref<any>(null)

// 加载时预估大小
const updateEstimate = async () => {
  sizeEstimate.value = await estimateSizeKB()
}

// 导出
const handleExport = async () => {
  const success = await exportBackup()
  if (success) {
    showToast({ type: 'success', message: '备份已下载' })
  } else {
    showToast({ type: 'error', message: '导出失败' })
  }
}

// 触发文件选择
const triggerImport = () => {
  fileInput.value?.click()
}

// 文件选择回调
const onFileSelected = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  isLoading.value = true
  
  // 1. 基础校验
  const result = await parseAndValidate(file)
  
  if (result.valid) {
    // 2. Diff 分析
    const currentData = await collectAllData()
    const diff = analyzeBackup(result.data, currentData)
    
    diffResult.value = diff
    restoreStats.value = result.stats!
    tempRestoreData.value = result.data
    
    // 重置选项
    mergeOptions.includePoems = true
    mergeOptions.includeTodos = true
    mergeOptions.includeNotes = true
    mergeOptions.overwriteSettings = false

    showConfirmDialog.value = true
  } else {
    showToast({ type: 'error', message: `无效文件: ${result.error}` })
  }
  
  isLoading.value = false
  if (fileInput.value) fileInput.value.value = ''
}

// 执行合并
const handleMerge = async () => {
  if (!tempRestoreData.value || !diffResult.value) return
  
  isLoading.value = true
  try {
    const report = await performMerge(diffResult.value, {
      ...mergeOptions,
      sourceData: tempRestoreData.value
    })
    
    // 显示结果
    mergeReport.value = report.addedCount
    showConfirmDialog.value = false
    showResultDialog.value = true
    showToast({ type: 'success', message: '增量合并已完成' })
    
    setTimeout(updateEstimate, 500)
  } catch (e: any) {
    showToast({ type: 'error', message: '合并失败: ' + e.message })
  } finally {
    isLoading.value = false
  }
}

// 确认恢复 (旧版覆盖)
const confirmRestore = async () => {
  if (!tempRestoreData.value) return

  isLoading.value = true
  const result = await performRestore(tempRestoreData.value)
  isLoading.value = false
  showConfirmDialog.value = false

  if (result.success) {
    showToast({ type: 'success', message: '数据已恢复' })
    setTimeout(updateEstimate, 500)
  } else {
    const msg = result.rolledBack ? '恢复失败，已自动回滚' : '恢复失败'
    showToast({ type: 'error', message: msg })
  }
}

// Init
updateEstimate()
</script>

<template>
  <div class="backup-section">
    <div class="section-header">
      <div class="title-row">
        <IconDatabase size="20" class="icon" />
        <h3>数据管理</h3>
      </div>
      <span class="subtitle">备份或恢复您的配置与数据</span>
    </div>

    <div class="action-grid">
      <!-- 导出 -->
      <button class="action-card export" @click="handleExport" @mouseenter="updateEstimate">
        <div class="icon-box">
          <IconDownload size="24" />
        </div>
        <div class="info">
          <span class="label">导出备份</span>
          <span class="desc">JSON 格式 • 约 {{ sizeEstimate }} KB</span>
        </div>
      </button>

      <!-- 导入 -->
      <button class="action-card import" @click="triggerImport">
        <div class="icon-box">
          <IconUpload size="24" />
        </div>
        <div class="info">
          <span class="label">恢复备份</span>
          <span class="desc">支持 V1 版本文件</span>
        </div>
        <input 
          ref="fileInput"
          type="file" 
          accept=".json,application/json" 
          class="hidden-input"
          @change="onFileSelected"
        >
      </button>
    </div>

    <!-- Step 1: 确认与合并 Dialog -->
    <Dialog
      v-model="showConfirmDialog"
      :title="`备份文件分析 (v${restoreStats?.version || '?'})`"
      width="480px"
      type="info"
      :show-icon="false"
      content-class="no-padding-top"
    >
      <div class="modal-content-wrapper" v-if="diffResult">
        <div class="date-header">
          <span class="date-tag">{{ restoreStats?.exportTimeDisplay.split(' ')[0] }}</span>
        </div>

        <!-- Diff 列表 -->
        <div class="diff-list">
          <!-- 诗词 -->
          <div class="diff-item">
            <div class="diff-label">
              <label>
                <input type="checkbox" v-model="mergeOptions.includePoems"> 诗词收藏
              </label>
            </div>
            <div class="diff-stat">
              <span class="added" v-if="diffResult.poems.toAdd.length">+{{ diffResult.poems.toAdd.length }}</span>
              <span class="skip" v-if="diffResult.poems.duplicateCount">跳过 {{ diffResult.poems.duplicateCount }}</span>
            </div>
          </div>

          <!-- 待办 -->
          <div class="diff-item">
            <div class="diff-label">
              <label>
                <input type="checkbox" v-model="mergeOptions.includeTodos"> 待办事项
              </label>
            </div>
            <div class="diff-stat">
              <span class="added" v-if="diffResult.todos.toAdd.length">+{{ diffResult.todos.toAdd.length }}</span>
              <span class="skip" v-if="diffResult.todos.duplicateCount">跳过 {{ diffResult.todos.duplicateCount }}</span>
            </div>
          </div>

          <!-- 笔记 -->
          <div class="diff-item">
            <div class="diff-label">
              <label>
                <input type="checkbox" v-model="mergeOptions.includeNotes"> 笔记
              </label>
            </div>
            <div class="diff-stat">
              <span class="added" v-if="diffResult.notes.toAdd.length">+{{ diffResult.notes.toAdd.length }}</span>
              <span class="skip" v-if="diffResult.notes.duplicateCount">跳过 {{ diffResult.notes.duplicateCount }}</span>
            </div>
          </div>

          <!-- 配置 (默认不合并) -->
          <div class="diff-item settings" :class="{ active: mergeOptions.overwriteSettings }">
             <div class="diff-label">
              <label>
                <input type="checkbox" v-model="mergeOptions.overwriteSettings"> 
                覆盖设置 
                <span class="badge" v-if="diffResult.settings.hasDiff">有差异</span>
              </label>
            </div>
             <div class="diff-stat" v-if="diffResult.settings.hasDiff">
               {{ diffResult.settings.diffKeys.length }} 项变动
            </div>
             <div class="diff-stat" v-else>无差异</div>
          </div>
        </div>
      </div>

      <!-- 自定义底部 -->
      <template #footer>
        <div class="modal-actions-v2">
          <div class="left">
             <button class="btn-text danger" @click="confirmRestore">⚠️ 覆盖恢复 (旧版)</button>
          </div>
          <div class="right">
            <button class="btn-cancel" @click="showConfirmDialog = false">取消</button>
            <button class="btn-confirm primary" @click="handleMerge" :disabled="isLoading">
              {{ isLoading ? '合并中...' : '开始合并' }}
            </button>
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Step 2: 结果展示 Dialog -->
    <Dialog
      v-model="showResultDialog"
      title="合并完成"
      width="360px"
      type="success"
      :show-cancel-btn="false"
      ok-text="完成"
    >
      <div class="result-box">
        <div class="result-list" v-if="mergeReport">
          <div class="row"><span>新增诗词</span> <strong>{{ mergeReport.poems }}</strong></div>
          <div class="row"><span>新增待办</span> <strong>{{ mergeReport.todos }}</strong></div>
          <div class="row"><span>新增笔记</span> <strong>{{ mergeReport.notes }}</strong></div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.backup-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
}

.icon { opacity: 0.8; }
.subtitle { font-size: 13px; color: var(--text-tertiary); margin-left: 28px; }

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: var(--bg-input);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.action-card:hover {
  background: var(--bg-hover-card);
  transform: translateY(-1px);
}

.action-card.export:hover { border-color: var(--color-primary); }
.action-card.import:hover { border-color: var(--color-warning); }

.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--bg-panel);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

.info { display: flex; flex-direction: column; gap: 2px; }
.label { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.desc { font-size: 12px; color: var(--text-tertiary); }
.hidden-input { display: none; }

/* Dialog Content Styles */
.date-header { margin-bottom: 12px; }
.date-tag {
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-input);
  padding: 2px 6px;
  border-radius: 4px;
}

.diff-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.diff-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: var(--bg-input);
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.diff-item:hover { background: var(--bg-hover-card); }
.diff-item.settings.active {
  border-color: var(--color-warning);
  background: var(--color-warning-bg);
}

.diff-label label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--text-primary);
  font-weight: 500;
}

.diff-stat { display: flex; gap: 8px; font-size: 13px; }
.added { color: var(--color-success); font-weight: 600; }
.skip { color: var(--text-tertiary); }
.badge { font-size: 10px; background: var(--color-danger); color: #fff; padding: 1px 4px; border-radius: 4px; margin-left: 4px; }

/* Custom Footer Actions */
.modal-actions-v2 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.modal-actions-v2 .right { display: flex; gap: 12px; }

.btn-text.danger {
  background: none;
  border: none;
  color: var(--color-danger);
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  opacity: 0.8;
}
.btn-text.danger:hover { opacity: 1; }

.btn-cancel {
  padding: 8px 16px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--color-divider);
  color: var(--text-secondary);
  cursor: pointer;
}

.btn-confirm.primary {
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  cursor: pointer;
}
.btn-confirm.primary:disabled { opacity: 0.6; cursor: not-allowed; }

/* Result Box */
.result-list {
  width: 100%;
  background: var(--bg-input);
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.result-list .row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
</style>
