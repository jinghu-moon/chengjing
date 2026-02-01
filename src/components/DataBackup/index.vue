<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { IconDatabase, IconDownload, IconUpload } from '@tabler/icons-vue'
import Dialog from '@/components/Dialog/Dialog.vue'
import Button from '@/components/Button/Button.vue'
import { useDataBackup, type RestoreStats } from '@/composables/useDataBackup'
import { useToast } from '@/components/Toast/composables/useToast'
import type { DiffResult } from '@/utils/backup-diff'

// V2.0 Components
import PresetManager from './PresetManager.vue'
import HistoryTimeline from './HistoryTimeline.vue'
import { useHistory } from '@/composables/useHistory'

const { showToast } = useToast()

// V2.0: 初始化历史记录自动保存
const { initAutoSaveWatcher } = useHistory()
onMounted(() => {
  initAutoSaveWatcher()
})
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

// V1.2 State
import { getDetailedSettingsDiff, type SettingsDiffItem } from '@/utils/backup-diff'
import SettingsDiffViewer from './SettingsDiffViewer.vue'

const showSettingsDiffDialog = ref(false)
const settingsDiffItems = ref<SettingsDiffItem[]>([])
const selectedSettingsKeys = ref<string[]>([])
const hasSelectedSettings = ref(false) // 是否选择了部分设置
const { performSelectiveSettingsRestore } = useDataBackup()

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
    
    // V1.2: 预先计算设置差异
    if (diff.settings.hasDiff) {
      settingsDiffItems.value = getDetailedSettingsDiff(
        result.data.settings,
        result.data.iconConfig,
        currentData.settings,
        currentData.iconConfig
      )
    } else {
      settingsDiffItems.value = []
    }
    
    // 重置 V1.2 状态
    selectedSettingsKeys.value = []
    hasSelectedSettings.value = false
    
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
    let report: any = {}

    // 1. 常规合并 (Poems/Todos/Notes)
    // 如果勾选了 overwriteSettings (全选)，则由 V1.1 逻辑处理 (全量覆盖)
    // 如果没勾选 overwriteSettings，但 hasSelectedSettings 为 true，则由 V1.2 处理 (部分覆盖)
    
    // 修改策略：
    // 即使 V1.1 performMerge 支持 overwriteSettings，我们也主要用 V1.2 的逻辑来做更精细控制？
    // 为了兼容性，如果 mergeOptions.overwriteSettings 为 true，我们将其传递给 performMerge
    // 如果为 false，我们再检查 V1.2 的 selectedSettingsKeys

    const v1MergeOptions = {
      ...mergeOptions,
      sourceData: tempRestoreData.value
    }
    
    // V1.1 合并执行 (含全量配置覆盖)
    const v1Report = await performMerge(diffResult.value, v1MergeOptions)
    report = v1Report

    // V1.2: 如果没有全量覆盖，且有部分选择，则执行选择性恢复
    if (!mergeOptions.overwriteSettings && hasSelectedSettings.value && selectedSettingsKeys.value.length > 0) {
       const v12Report = await performSelectiveSettingsRestore(
         selectedSettingsKeys.value,
         tempRestoreData.value
       )
       if (!v12Report.success) {
         throw new Error(v12Report.error)
       }
       // 记录设置更新数量
       if (!report.addedCount) report.addedCount = {}
       report.addedCount.settings = v12Report.appliedCount
    }
    
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

// V1.2 UI Logic
const openSettingsDiff = () => {
  showSettingsDiffDialog.value = true
}

const handleSettingsSelection = (keys: string[]) => {
  selectedSettingsKeys.value = keys
  const totalCount = settingsDiffItems.value.filter(i => i.isDifferent).length
  
  hasSelectedSettings.value = keys.length > 0
  
  // 联动逻辑：全选时自动勾选主 Checkbox
  if (keys.length > 0 && keys.length === totalCount) {
    mergeOptions.overwriteSettings = true
  } else {
    // 否则作为“部分选择”状态，主 Checkbox 不勾选 (或者需要一个 indeterminate 状态，Vue checkbox 可通过 prop 控制)
    mergeOptions.overwriteSettings = false
  }
}

// 监听主 Checkbox 变化，联动 V1.2 状态
const onMainSettingCheckboxChange = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    // 全选所有差异项
    selectedSettingsKeys.value = settingsDiffItems.value
      .filter(i => i.isDifferent)
      .map(i => i.key)
    hasSelectedSettings.value = true
  } else {
    // 清空选择
    selectedSettingsKeys.value = []
    hasSelectedSettings.value = false
  }
}

// Init
updateEstimate()
</script>

<template>
  <div class="backup-section">
    <!-- V2.0 板块1: 快速预设 -->
    <section class="panel preset-panel">
      <PresetManager />
    </section>

    <!-- V2.0 板块2: 历史回溯 -->
    <section class="panel history-panel">
      <HistoryTimeline />
    </section>

    <!-- 板块3: 文件备份 (原有功能) -->
    <section class="panel file-panel">
      <div class="panel-header">
        <IconDatabase :size="16" />
        <span>文件备份</span>
      </div>
      <div class="action-grid">
        <!-- 导出 -->
        <button class="action-card export" @click="handleExport" @mouseenter="updateEstimate">
          <div class="icon-box">
            <IconDownload size="24" />
          </div>
          <div class="info">
            <span class="label">导出备份</span>
            <span class="desc">JSON • 约 {{ sizeEstimate }} KB</span>
          </div>
        </button>

        <!-- 导入 -->
        <button class="action-card import" @click="triggerImport">
          <div class="icon-box">
            <IconUpload size="24" />
          </div>
          <div class="info">
            <span class="label">恢复备份</span>
            <span class="desc">支持 V1 版本</span>
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
    </section>

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

          <!-- 配置 (V1.2 增强) -->
          <div class="diff-item settings" :class="{ active: mergeOptions.overwriteSettings || hasSelectedSettings }">
             <div class="diff-label">
              <label>
                <input 
                  type="checkbox" 
                  v-model="mergeOptions.overwriteSettings"
                  @change="onMainSettingCheckboxChange"
                > 
                覆盖设置 
                <span class="badge" v-if="diffResult.settings.hasDiff">有差异</span>
              </label>
            </div>
             <div class="diff-right">
               <div class="diff-stat" v-if="diffResult.settings.hasDiff">
                 <span v-if="hasSelectedSettings && !mergeOptions.overwriteSettings" class="highlight-text">
                   已选 {{ selectedSettingsKeys.length }} 项
                 </span>
                 <span v-else>
                   {{ diffResult.settings.diffKeys.length }} 项变动
                 </span>
              </div>
              
              <!-- 详情按钮 -->
              <Button
                v-if="diffResult.settings.hasDiff"
                size="small"
                variant="outline"
                title="查看差异详情"
                @click="openSettingsDiff"
              >
                查看
              </Button>
             </div>
          </div>
        </div>
      </div>

      <!-- 自定义底部 -->
      <template #footer>
        <div class="modal-actions-v2">
          <div class="left">
             <Button variant="text" theme="danger" @click="confirmRestore">⚠️ 覆盖恢复 (旧版)</Button>
          </div>
          <div class="right">
            <Button variant="outline" @click="showConfirmDialog = false">取消</Button>
            <Button theme="primary" @click="handleMerge" :loading="isLoading">
              {{ isLoading ? '合并中...' : '开始合并' }}
            </Button>
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
          <div class="row"><span>新增诗词</span> <strong>{{ mergeReport.poems || 0 }}</strong></div>
          <div class="row"><span>新增待办</span> <strong>{{ mergeReport.todos || 0 }}</strong></div>
          <div class="row"><span>新增笔记</span> <strong>{{ mergeReport.notes || 0 }}</strong></div>
          <div class="row" v-if="mergeReport.settings"><span>更新设置</span> <strong>{{ mergeReport.settings }} 项</strong></div>
          <div class="row" v-if="mergeOptions.overwriteSettings && !mergeReport.settings"><span>更新设置</span> <strong>全部</strong></div>
        </div>
      </div>
    </Dialog>

    <!-- V1.2 Settings Diff Dialog -->
    <Dialog
      v-model="showSettingsDiffDialog"
      title="配置差异对比"
      width="700px"
      type="info"
      :show-icon="false"
    >
      <SettingsDiffViewer
        :diff-items="settingsDiffItems"
        :selected="selectedSettingsKeys"
        @update:selected="handleSettingsSelection"
      />
      <template #footer>
        <div class="diff-footer">
          <div class="left-tip">
             已选择 {{ selectedSettingsKeys.length }} 项待恢复设置
          </div>
          <Button theme="primary" @click="showSettingsDiffDialog = false">
            确认选择
          </Button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.backup-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px 0;
}

/* V2.0 板块通用样式 */
.panel {
  background: var(--bg-input);
  border-radius: 12px;
  padding: 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

/* 文件备份板块 */
.file-panel {
  background: transparent;
  padding: 0;
}

.file-panel .panel-header {
  margin-bottom: 8px;
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

.diff-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.highlight-text {
  color: var(--primary);
  font-weight: 500;
}

.diff-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.left-tip {
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
