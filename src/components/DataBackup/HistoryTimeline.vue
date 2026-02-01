<script setup lang="ts">
/**
 * 历史时间轴组件
 * DataBackup 2.0 - Phase 2
 */
import { ref } from 'vue'
import { IconHistory, IconLock, IconLockOpen, IconRestore, IconTrash } from '@tabler/icons-vue'
import { useHistory } from '@/composables/useHistory'
import { useToast } from '@/components/Toast/composables/useToast'
import type { SnapshotMeta, SnapshotTrigger } from '@/types/backup'
import Button from '@/components/Button/Button.vue'
import Dialog from '@/components/Dialog/Dialog.vue'

const { snapshotMetas, isLoading, restoreSnapshot, removeSnapshot, toggleLock, manualSave } = useHistory()
const { showToast } = useToast()

// Dialog State
const showRestoreDialog = ref(false)
const showDeleteDialog = ref(false)
const targetMeta = ref<SnapshotMeta | null>(null)

// 触发类型标签
const triggerLabels: Record<SnapshotTrigger, string> = {
  manual: '手动',
  auto: '自动',
  restore_point: '恢复点',
  preset_apply: '预设'
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  if (isToday) {
    return `今天 ${time}`
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${time}`
  }

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' + time
}

// 恢复快照 (Trigger)
const handleRestore = (meta: SnapshotMeta) => {
  targetMeta.value = meta
  showRestoreDialog.value = true
}

// 执行恢复
const executeRestore = async () => {
  if (!targetMeta.value) return
  
  const success = await restoreSnapshot(targetMeta.value.id)
  if (success) {
    showToast({ type: 'success', message: '配置已恢复' })
  } else {
    showToast({ type: 'error', message: '恢复失败' })
  }
  showRestoreDialog.value = false
}

// 删除快照 (Trigger)
const handleDelete = (meta: SnapshotMeta) => {
  if (meta.isLocked) {
    showToast({ type: 'warning', message: '请先解锁再删除' })
    return
  }
  targetMeta.value = meta
  showDeleteDialog.value = true
}

// 执行删除
const executeDelete = async () => {
  if (!targetMeta.value) return
  
  const success = await removeSnapshot(targetMeta.value.id)
  if (success) {
    showToast({ type: 'info', message: '快照已删除' })
  }
  showDeleteDialog.value = false
}

// 切换锁定
const handleToggleLock = async (meta: SnapshotMeta) => {
  await toggleLock(meta.id)
  showToast({
    type: 'info',
    message: meta.isLocked ? '已解锁' : '已锁定，不会被自动清理'
  })
}

// 手动保存
const handleManualSave = async () => {
  const snapshot = await manualSave()
  if (snapshot) {
    showToast({ type: 'success', message: '快照已保存' })
  }
}
</script>

<template>
  <div class="history-timeline">
    <!-- 头部 -->
    <div class="timeline-header">
      <div class="title">
        <IconHistory :size="16" />
        <span>配置历史</span>
        <span class="count">({{ snapshotMetas.length }})</span>
      </div>
      <Button variant="outline" size="small" @click="handleManualSave">
        立即保存
      </Button>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="loading">
      加载中...
    </div>

    <!-- 空状态 -->
    <div v-else-if="snapshotMetas.length === 0" class="empty">
      <p>暂无历史记录</p>
      <p class="hint">修改设置后将自动保存快照</p>
    </div>

    <!-- 时间轴 -->
    <div v-else class="timeline">
      <div
        v-for="meta in snapshotMetas"
        :key="meta.id"
        class="timeline-item"
        :class="{ locked: meta.isLocked }"
      >
        <!-- 时间点 -->
        <div class="timeline-dot" :class="meta.trigger"></div>

        <!-- 内容 -->
        <div class="timeline-content">
          <div class="meta-row">
            <span class="time">{{ formatTime(meta.timestamp) }}</span>
            <span class="trigger-tag" :class="meta.trigger">
              {{ triggerLabels[meta.trigger] }}
            </span>
            <span class="size">{{ meta.sizeKB }} KB</span>
          </div>

          <div v-if="meta.label" class="label">{{ meta.label }}</div>

          <!-- 操作按钮 -->
          <div class="actions">
            <Button
              shape="square"
              size="small"
              variant="text"
              :icon="IconRestore"
              title="恢复此配置"
              @click="handleRestore(meta)"
            />

            <Button
              shape="square"
              size="small"
              variant="text"
              :icon="meta.isLocked ? IconLock : IconLockOpen"
              :title="meta.isLocked ? '解锁' : '锁定'"
              @click="handleToggleLock(meta)"
            />

            <Button
              shape="square"
              size="small"
              variant="text"
              theme="danger"
              :icon="IconTrash"
              title="删除"
              :disabled="meta.isLocked"
              @click="handleDelete(meta)"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- 恢复确认弹窗 -->
    <Dialog
      v-model="showRestoreDialog"
      title="恢复配置"
      width="360px"
      type="warning"
      :show-icon="true"
      @confirm="executeRestore"
    >
      <div v-if="targetMeta">
        <p>确定恢复到「{{ formatTime(targetMeta.timestamp) }}」的配置？</p>
        <p class="hint-text">当前配置将自动备份为恢复点。</p>
      </div>
    </Dialog>

    <!-- 删除确认弹窗 -->
    <Dialog
      v-model="showDeleteDialog"
      title="删除快照"
      width="360px"
      type="error"
      :show-icon="true"
      @confirm="executeDelete"
    >
      <p>确定删除此历史快照？此操作不可恢复。</p>
    </Dialog>
  </div>
</template>

<style scoped>
.hint-text {
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-secondary);
}
.history-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-header .title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.timeline-header .count {
  color: var(--text-muted);
  font-weight: normal;
}

.loading,
.empty {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.empty .hint {
  font-size: 12px;
  margin-top: 4px;
}

/* 时间轴 */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 300px;
  overflow-y: auto;
  padding-left: 12px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  position: relative;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 20px;
  bottom: -10px;
  width: 1px;
  background: var(--border-color);
}

.timeline-item:last-child::before {
  display: none;
}

.timeline-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--text-muted);
  flex-shrink: 0;
  margin-top: 4px;
  z-index: 1;
}

.timeline-dot.manual { background: var(--primary); }
.timeline-dot.auto { background: var(--text-muted); }
.timeline-dot.restore_point { background: var(--warning); }
.timeline-dot.preset_apply { background: var(--success); }

.timeline-content {
  flex: 1;
  min-width: 0;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.time {
  font-size: 12px;
  color: var(--text-primary);
}

.trigger-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--glass-bg-light);
  color: var(--text-muted);
}

.trigger-tag.manual { color: var(--primary); background: var(--primary-bg); }
.trigger-tag.restore_point { color: var(--warning); background: var(--warning-bg); }

.size {
  font-size: 11px;
  color: var(--text-muted);
}

.label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* 操作按钮 */
.actions {
  display: flex;
  gap: 4px;
  margin-top: 6px;
  opacity: 0;
  transition: opacity 0.2s;
}

.timeline-item:hover .actions {
  opacity: 1;
}

/* 锁定状态 */
.timeline-item.locked {
  background: var(--glass-bg-light);
  border-radius: 8px;
  padding: 8px;
  margin-left: -8px;
}

.timeline-item.locked .actions {
  opacity: 1;
}
</style>
