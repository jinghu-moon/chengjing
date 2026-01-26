<template>
  <div class="snapshot-manager">
    <!-- 头部 -->
    <div class="manager-header">
      <div class="header-content">
        <IconLayout :size="20" />
        <h3>布局快照</h3>
      </div>
      <button @click="$emit('close')" class="close-btn">
        <IconX :size="18" />
      </button>
    </div>

    <!-- 主体：左右分栏 -->
    <div class="manager-body">
      <!-- 左侧：快照列表 -->
      <div class="snapshot-list">
        <div class="list-header">
          <span class="list-title">快照</span>
          <span class="list-count">{{ snapshots.length }}</span>
        </div>

        <div class="list-content">
          <div
            v-for="snap in sortedSnapshots"
            :key="snap.id"
            :class="['snapshot-item', { active: selectedId === snap.id }]"
            @click="selectSnapshot(snap.id)"
          >
            <div class="item-icon">
              <IconDeviceFloppy :size="16" />
            </div>
            <div class="item-main">
              <div class="item-name">{{ snap.name }}</div>
              <div class="item-time">{{ formatTime(snap.createdAt) }}</div>
            </div>
            <div class="item-badge" v-if="selectedId === snap.id">
              <IconCheck :size="12" />
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="snapshots.length === 0" class="empty-list">
            <IconLayoutOff :size="48" />
            <p class="empty-text">暂无快照</p>
          </div>
        </div>
      </div>

      <!-- 右侧：详情面板 -->
      <div class="snapshot-detail" v-if="selectedSnapshot">
        <!-- 分离卡片布局：信息卡片 + 预览卡片 -->
        <div class="detail-split-layout">
          <!-- 1. 信息卡片 -->
          <div class="info-card">
            <!-- 名称组 -->
            <div class="info-main">
              <div class="name-display" @dblclick="startRename" title="双击重命名">
                 <IconTag :size="16" class="name-icon" />
                 <span v-if="!isRenaming" class="name-text">{{ selectedSnapshot.name }}</span>
                 <input
                   v-else
                   ref="renameInputRef"
                   v-model="renameText"
                   class="name-input"
                   @blur="finishRename"
                   @keydown.enter="finishRename"
                   @keydown.esc="cancelRename"
                 />
                 <button v-if="!isRenaming" @click="startRename" class="edit-btn-mini">
                   <IconEdit :size="14" />
                 </button>
              </div>
            </div>

            <!-- 数据组 -->
            <div class="info-stats">
               <div class="stat-pill" title="应用 | 文件夹">
                 <IconApps :size="13" />
                 <span>{{ appCount }}</span>
                 <span class="v-line"></span>
                 <IconFolder :size="13" />
                 <span>{{ folderCount }}</span>
               </div>
               
               <div class="stat-pill" title="预览模式 | 网格">
                 <IconLayoutGrid :size="13" />
                 <span>{{ selectedSnapshot.data.settings.folderPreviewMode || '2x2' }}</span>
                 <span class="v-line"></span>
                 <IconGrid3x3 :size="13" />
                 <span>{{ selectedSnapshot.data.settings.gridRows }}×{{ selectedSnapshot.data.settings.gridCols }}</span>
               </div>

               <div class="stat-pill time" title="创建时间">
                 <IconClock :size="13" />
                 <span>{{ formatShortTime(selectedSnapshot.createdAt) }}</span>
               </div>
            </div>
          </div>

          <!-- 2. 预览卡片 -->
          <div class="preview-card">
            <div class="preview-card-header">
              <span class="card-title">布局预览</span>
              <span class="page-badge">Page 1</span>
            </div>
            <div class="preview-viewport">
              <SnapshotPreview :snapshot="selectedSnapshot" />
            </div>
          </div>
        </div>

        <!-- 操作区 - 横向排列 -->
        <div class="detail-actions">
          <button @click="handleRestore" class="action-btn primary">
            <IconRotate2 :size="16" />
            <span>恢复</span>
          </button>
          <button @click="handleExport" class="action-btn secondary">
            <IconDownload :size="16" />
            <span>导出</span>
          </button>
          <button @click="handleDelete" class="action-btn danger">
            <IconTrash :size="16" />
            <span>删除</span>
          </button>
        </div>
      </div>

      <!-- 未选中状态 -->
      <div v-else class="detail-empty">
        <IconLayout :size="64" class="empty-icon" />
        <p class="empty-title">选择一个快照</p>
      </div>
    </div>

    <!-- 底部 -->
    <div class="manager-footer">
      <div class="footer-info">
        <IconDatabase :size="14" />
        <span>{{ snapshots.length }}/{{ maxSnapshots }}</span>
        <span class="divider">·</span>
        <span>{{ formatSize(storageSize) }}</span>
      </div>
      <label class="import-btn">
        <IconUpload :size="14" />
        <span>导入</span>
        <input type="file" accept=".json" @change="handleImportFile" style="display:none" />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import type { LayoutSnapshot } from '../../composables/useSnapshot'
import SnapshotPreview from './SnapshotPreview.vue'
import {
  IconX,
  IconLayoutOff,
  IconEdit,
  IconRotate2,
  IconDownload,
  IconTrash,
  IconLayout,
  IconUpload,
  IconDeviceFloppy,
  IconCheck,
  IconTag,
  IconClock,
  IconApps,
  IconFolder,
  IconLayoutGrid,
  IconGrid3x3,
  IconDatabase
} from '@tabler/icons-vue'

interface Props {
  snapshots: LayoutSnapshot[]
  maxSnapshots?: number
  storageSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxSnapshots: 20,
  storageSize: 0
})

const emit = defineEmits<{
  restore: [id: string]
  delete: [id: string]
  rename: [id: string, newName: string]
  export: [id: string]
  import: [file: File]
  close: []
}>()

const selectedId = ref<string | null>(null)

const sortedSnapshots = computed(() =>
  [...props.snapshots].sort((a, b) => b.createdAt - a.createdAt)
)

watch(sortedSnapshots, (list) => {
  if (list.length > 0 && !selectedId.value) {
    selectedId.value = list[0].id
  } else if (list.length === 0) {
    selectedId.value = null
  }
}, { immediate: true })

const selectedSnapshot = computed(() =>
  props.snapshots.find(s => s.id === selectedId.value) || null
)

// 统计信息计算
const appCount = computed(() => {
  if (!selectedSnapshot.value) return 0
  return selectedSnapshot.value.data.shortcuts.filter(s => s.type !== 'folder').length
})

const folderCount = computed(() => {
  if (!selectedSnapshot.value) return 0
  return selectedSnapshot.value.data.shortcuts.filter(s => s.type === 'folder').length
})

const selectSnapshot = (id: string) => {
  selectedId.value = id
  isRenaming.value = false
}

// 重命名
const isRenaming = ref(false)
const renameText = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

const startRename = () => {
  if (!selectedSnapshot.value) return
  renameText.value = selectedSnapshot.value.name
  isRenaming.value = true
  nextTick(() => {
    renameInputRef.value?.focus()
    renameInputRef.value?.select()
  })
}

const finishRename = () => {
  if (!isRenaming.value) return
  if (selectedSnapshot.value && renameText.value.trim()) {
    if (renameText.value.trim() !== selectedSnapshot.value.name) {
      emit('rename', selectedSnapshot.value.id, renameText.value.trim())
    }
  }
  isRenaming.value = false
}

const cancelRename = () => {
  isRenaming.value = false
}

// 操作
const handleRestore = () => {
  if (selectedId.value) emit('restore', selectedId.value)
}
const handleDelete = () => {
  if (selectedId.value) emit('delete', selectedId.value)
}
const handleExport = () => {
  if (selectedId.value) emit('export', selectedId.value)
}
const handleImportFile = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    emit('import', target.files[0])
    target.value = ''
  }
}

// 格式化
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()

  if (date.toDateString() === now.toDateString()) {
    return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
  }

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const formatShortTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
</script>

<style scoped>
.snapshot-manager {
  display: flex;
  flex-direction: column;
  width: 800px;
  height: 580px;
  background: rgba(46, 52, 64, 0.65); /* 更加透明的背景 */
  backdrop-filter: blur(20px); /* 强毛玻璃 */
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

/* ===== 头部 ===== */
.manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-5);
  background: rgba(46, 52, 64, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.header-content svg {
  color: var(--color-primary);
}

.manager-header h3 {
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--duration-fast);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
}

/* ===== 主体 ===== */
.manager-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  padding: 10px;
}

/* ===== 左侧列表 ===== */
.snapshot-list {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: var(--border-divider);
}

.list-title {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.list-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 var(--space-2);
  background: var(--color-primary);
  color: var(--nord6);
  font-size: 11px;
  font-weight: var(--weight-semibold);
  border-radius: var(--radius-full);
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.snapshot-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-1);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all var(--duration-fast);
}

.snapshot-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.snapshot-item.active {
  background: var(--color-primary-alpha);
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-primary);
  color: var(--nord6);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
  margin-bottom: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.item-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: var(--color-primary);
  color: var(--nord6);
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: var(--space-8) var(--space-4);
  text-align: center;
}

.empty-list svg {
  opacity: 0.2;
  margin-bottom: var(--space-3);
  color: var(--text-tertiary);
}

.empty-text {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* ===== 右侧详情 ===== */
.snapshot-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  gap: var(--space-3);
}

.detail-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* 信息区 - 单行极简 */
.info-section-compact {
  padding: var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between; /* 左右分布 */
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  gap: var(--space-4);
}

/* 左侧：名称组 */
.info-name-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0; /* 防止溢出 */
}

.info-icon {
  color: var(--color-primary);
  opacity: 0.8;
  flex-shrink: 0;
}

.name-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex: 1;
  min-width: 0;
}

.name-text {
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: text;
}

.name-input {
  flex: 1;
  min-width: 100px;
  max-width: 200px;
  padding: 2px 6px;
  font-size: var(--text-base);
  border: 2px solid var(--color-primary);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  outline: none;
}

.edit-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--duration-fast);
  flex-shrink: 0;
}

.edit-icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* 右侧：元数据组 */
.info-meta-group {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-shrink: 0;
}

.meta-group-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(0,0,0,0.15);
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.05);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-secondary);
  font-size: 11px;
}

.meta-item svg {
  color: var(--text-tertiary);
  opacity: 0.8;
}

.meta-item.time {
  color: var(--text-tertiary);
}

.meta-divider {
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.1);
}

.meta-vertical-line {
    width: 1px;
    height: 10px;
    background: rgba(255, 255, 255, 0.15);
}

/* 预览区 */
.preview-section {
  padding: var(--space-4);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.preview-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--text-secondary);
}

.preview-badge {
  padding: 2px var(--space-2);
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: var(--weight-medium);
  border-radius: var(--radius-sm);
}

.preview-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* 操作区 - 横向排列 */
.detail-actions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-2);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.action-btn.primary {
  background: var(--color-primary);
  color: var(--nord6);
}

.action-btn.primary:hover {
  background: var(--color-primary-hover);
  transform: var(--btn-hover-lift);
}

.action-btn.secondary {
  background: var(--bg-panel-card);
  color: var(--text-primary);
  border: 1px solid var(--color-border-glass);
}

.action-btn.secondary:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.action-btn.danger {
  background: var(--bg-panel-card);
  color: var(--color-danger);
  border: 1px solid var(--color-border-glass);
}

.action-btn.danger:hover {
  background: var(--color-danger-bg);
  border-color: var(--color-danger);
}

/* 空状态 */
.detail-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-10);
  text-align: center;
}

.empty-icon {
  color: var(--color-primary);
  opacity: 0.3;
  margin-bottom: var(--space-4);
}

.empty-title {
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

/* ===== 底部 ===== */
.manager-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-5);
  border-top: var(--border-glass);
}

.footer-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

.divider {
  opacity: 0.4;
}

.import-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-primary);
  color: var(--nord6);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--duration-fast);
  border: none;
}

.import-btn:hover {
  background: var(--color-primary-hover);
  transform: var(--btn-hover-lift);
}

/* 滚动条 */
.list-content::-webkit-scrollbar,
.snapshot-detail::-webkit-scrollbar {
  width: 4px;
}

.list-content::-webkit-scrollbar-track,
.snapshot-detail::-webkit-scrollbar-track {
  background: transparent;
}

.list-content::-webkit-scrollbar-thumb,
.snapshot-detail::-webkit-scrollbar-thumb {
  background: var(--nord3);
  border-radius: var(--radius-sm);
}

.list-content::-webkit-scrollbar-thumb:hover,
.snapshot-detail::-webkit-scrollbar-thumb:hover {
  background: var(--nord2);
}

/* 响应式 */
@media (max-width: 800px) {
  .snapshot-manager {
    width: 100%;
    max-width: 700px;
  }

  .snapshot-list {
    width: 200px;
  }
}

/* 动画 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-card {
  animation: slideIn var(--duration-normal) var(--ease-smooth);
}

/* 新布局样式 */
.detail-split-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slideIn var(--duration-normal) var(--ease-smooth);
}

.info-card {
  background: rgba(30, 35, 45, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-main {
  display: flex;
  align-items: center;
}

.name-display {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.name-icon {
  color: var(--color-primary);
}

.name-text {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.name-input {
  background: rgba(0,0,0,0.3);
  border: 1px solid var(--color-primary);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 14px;
}

.edit-btn-mini {
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.4);
  cursor: pointer;
  padding: 2px;
  display: flex;
}
.edit-btn-mini:hover { color: #fff; }

.info-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.04);
  padding: 4px 10px;
  border-radius: 100px; /* 胶囊圆角 */
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.stat-pill svg {
  opacity: 0.7;
}

.v-line {
  width: 1px;
  height: 10px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 2px;
}

.preview-card {
  background: rgba(30, 35, 45, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-lg);
  padding: 16px; 
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255,255,255,0.5);
  text-transform: uppercase;
}

.page-badge {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.8);
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}

.preview-viewport {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(135deg, #1e2532 0%, #151922 100%);
  position: relative;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
}
</style>
