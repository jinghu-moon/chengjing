<script setup lang="ts">
import { ref, reactive } from 'vue'
import { IconDatabase, IconDownload, IconUpload } from '@tabler/icons-vue'
import { useDataBackup, type RestoreStats } from '@/composables/useDataBackup'
import { useSettings } from '@/composables/useSettings'
import { useToast } from '@/components/Toast/composables/useToast'

const { showToast } = useToast()
const { 
  exportBackup, 
  estimateSizeKB, 
  parseAndValidate, 
  performRestore,
  // V1.1
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
import type { DiffResult } from '@/utils/backup-diff'
const diffResult = ref<DiffResult | null>(null)
const mergeOptions = reactive({
  includePoems: true,
  includeTodos: true,
  includeNotes: true,
  overwriteSettings: false
})
const showResultDialog = ref(false) // Step 2: 结果页
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

// Modal Ref
const modalRef = ref<HTMLElement | null>(null)

// 文件选择回调
const onFileSelected = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  isLoading.value = true
  
  // 1. 基础校验
  const result = await parseAndValidate(file)
  
  if (result.valid) {
    // 2. Diff 分析 (V1.1)
    const currentData = await collectAllData()
    // 注意：analyzeBackup 是纯函数，不依赖 hook 内部状态，但这里通过 hook 导出或者直接从 utils 导入均可
    // 假设 hook 已经导出了 analyzeBackup
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
    setTimeout(() => modalRef.value?.focus(), 50)
  } else {
    showToast({ type: 'error', message: `无效文件: ${result.error}` })
  }
  
  isLoading.value = false
  if (fileInput.value) fileInput.value.value = ''
}

// 执行合并 (V1.1)
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

// 确认恢复
const confirmRestore = async () => {
  if (!tempRestoreData.value) return

  isLoading.value = true
  const result = await performRestore(tempRestoreData.value)
  isLoading.value = false
  showConfirmDialog.value = false

  if (result.success) {
    showToast({ type: 'success', message: '数据已恢复' })
    // 给一点时间让状态稳定，再刷新预估大小
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

      <!-- 重置 -->
      <!-- <button class="action-card danger" @click="handleReset">
        <div class="icon-box">
          <IconRefreshAlert size="24" />
        </div>
        <div class="info">
          <span class="label">重置设置</span>
          <span class="desc">仅重置配置项</span>
        </div>
      </button> -->
    </div>

    <!-- 确认对话框 -->
    <div 
      v-if="showConfirmDialog" 
      class="modal-overlay" 
      @click.self="showConfirmDialog = false"
      @keydown.esc="showConfirmDialog = false"
      tabindex="-1"
      ref="modalRef"
    >
      <div class="modal-content glass-panel" v-if="diffResult">
        <div class="modal-header">
          <h3>备份文件分析 (v{{ restoreStats?.version }})</h3>
          <span class="date-tag">{{ restoreStats?.exportTimeDisplay.split(' ')[0] }}</span>
        </div>

        <!-- V1.1 Diff 列表 -->
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
      </div>
    </div>

    <!-- Step 2: 结果展示 -->
    <div 
      v-if="showResultDialog" 
      class="modal-overlay" 
      @click.self="showResultDialog = false"
      @keydown.esc="showResultDialog = false"
      tabindex="-1"
    >
      <div class="modal-content glass-panel result-box">
        <div class="success-icon">🎉</div>
        <h3>合并完成</h3>
        <div class="result-list" v-if="mergeReport">
          <div class="row"><span>新增诗词</span> <strong>{{ mergeReport.poems }}</strong></div>
          <div class="row"><span>新增待办</span> <strong>{{ mergeReport.todos }}</strong></div>
          <div class="row"><span>新增笔记</span> <strong>{{ mergeReport.notes }}</strong></div>
        </div>
        <button class="btn-confirm full" @click="showResultDialog = false">完成</button>
      </div>
    </div>
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

.icon {
  opacity: 0.8;
}

.subtitle {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-left: 28px;
}

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

.action-card.export:hover {
  border-color: var(--color-primary);
}

.action-card.import:hover {
  border-color: var(--color-warning);
}

.action-card.danger:hover {
  border-color: var(--color-danger);
  background: var(--color-danger-bg);
}

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

.info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

.hidden-input {
  display: none;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 360px;
  background: var(--bg-panel-dark);
  border: var(--border-glass);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.version-tag {
  font-size: 12px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  padding: 2px 6px;
  border-radius: 4px;
}

.stats-list {
  background: var(--bg-input);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.key { color: var(--text-secondary); }
.val { font-weight: 500; color: var(--text-primary); }

.stat-divider {
  height: 1px;
  background: var(--color-divider);
  margin: 4px 0;
}

.warning-box {
  background: var(--color-warning-bg);
  color: var(--color-warning);
  font-size: 13px;
  padding: 10px;
  border-radius: 6px;
  line-height: 1.4;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 8px 16px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--color-divider);
  color: var(--text-secondary);
  cursor: pointer;
}

.btn-confirm {
  padding: 8px 16px;
  border-radius: 8px;
  background: var(--color-primary);
  border: none;
  color: #fff;
  cursor: pointer;
}

.btn-confirm:hover {
  background: var(--color-primary-hover);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* V1.1 Styles */
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
  margin: 8px 0;
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

.diff-item:hover {
  background: var(--bg-hover-card);
}

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

.diff-stat {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.added { color: var(--color-success); font-weight: 600; }
.skip { color: var(--text-tertiary); }
.badge { font-size: 10px; background: var(--color-danger); color: #fff; padding: 1px 4px; border-radius: 4px; margin-left: 4px; }

.modal-actions-v2 {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.modal-actions-v2 .right {
  display: flex;
  gap: 12px;
}

.btn-text.danger {
  background: none;
  border: none;
  color: var(--color-danger);
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
  opacity: 0.8;
}

.btn-text.danger:hover {
  opacity: 1;
}

.btn-confirm.primary {
  background: var(--color-primary);
  box-shadow: 0 4px 12px var(--color-primary-glow);
}

/* Result Modal */
.result-box {
  text-align: center;
  width: 300px;
  align-items: center;
}

.success-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.result-list {
  width: 100%;
  background: var(--bg-input);
  padding: 12px;
  border-radius: 8px;
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-list .row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.btn-confirm.full {
  width: 100%;
}
</style>
