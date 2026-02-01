<script setup lang="ts">
/**
 * QR 导入预览确认组件
 * 显示配置差异，确认导入
 */
import { computed } from 'vue'
import { useQRSync } from './composables/useQRSync'
import { useSettings } from '@/composables/useSettings'
import { IconClock } from '@tabler/icons-vue'
import dayjs from 'dayjs'
import { SETTINGS_LABELS, ICON_LABELS } from 'virtual:settings-labels'

const { importPreview } = useQRSync()
const { settings, iconConfig } = useSettings()

// 格式化时间
const formattedTime = computed(() => {
  if (!importPreview.value) return ''
  return dayjs(importPreview.value.timestamp).format('YYYY-MM-DD HH:mm')
})

// 模式标签
const modeLabel = computed(() => {
  if (!importPreview.value) return ''
  return importPreview.value.mode === 'theme' ? '主题风格' : '完整设置'
})

// 配置差异列表
const diffList = computed(() => {
  if (!importPreview.value) return []

  const { settings: newSettings, iconConfig: newIcon } = importPreview.value.payload.d as {
    settings?: Record<string, any>
    iconConfig?: Record<string, any>
  }

  const diffs: Array<{ key: string; label: string; from: any; to: any }> = []

  // 字段中文映射
  // 比较 settings
  if (newSettings) {
    for (const [key, newVal] of Object.entries(newSettings)) {
      const oldVal = (settings as any)[key]
      if (oldVal !== newVal) {
        diffs.push({
          key,
          label: SETTINGS_LABELS[key] || key,
          from: oldVal,
          to: newVal
        })
      }
    }
  }

  // 比较 iconConfig
  if (newIcon) {
    for (const [key, newVal] of Object.entries(newIcon)) {
      const oldVal = (iconConfig as any)[key]
      if (oldVal !== newVal) {
        diffs.push({
          key: `icon.${key}`,
          label: ICON_LABELS[key] || `图标.${key}`,
          from: oldVal,
          to: newVal
        })
      }
    }
  }

  return diffs.slice(0, 10) // 最多显示 10 项
})
</script>

<template>
  <div class="qr-preview" v-if="importPreview">
    <!-- 头部信息 -->
    <div class="preview-header">
      <div class="time-info">
        <IconClock :size="14" />
        <span>{{ formattedTime }}</span>
      </div>
      <div class="mode-badge">{{ modeLabel }}</div>
    </div>

    <!-- 差异列表 -->
    <div class="diff-section">
      <div class="section-title">将更新以下配置：</div>
      <div class="diff-list" v-if="diffList.length > 0">
        <div
          v-for="item in diffList"
          :key="item.key"
          class="diff-row"
        >
          <span class="diff-key">{{ item.label }}</span>
          <span class="diff-change">
            <span class="old-val">{{ item.from }}</span>
            <span class="arrow">→</span>
            <span class="new-val">{{ item.to }}</span>
          </span>
        </div>
      </div>
      <div v-else class="no-diff">
        配置相同，无需更新
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats">
      <span>设置项: {{ importPreview.settingsCount }}</span>
      <span>图标配置: {{ importPreview.iconConfigCount }}</span>
    </div>


  </div>
</template>

<style scoped>
.qr-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 头部信息 */
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
}

.mode-badge {
  padding: 4px 8px;
  background: var(--color-primary-bg);
  color: var(--color-primary);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

/* 差异区域 */
.diff-section {
  background: var(--bg-input);
  border-radius: 8px;
  padding: 12px;
}

.section-title {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.diff-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.diff-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background: var(--bg-panel);
  border-radius: 4px;
  font-size: 13px;
}

.diff-key {
  color: var(--text-primary);
  font-weight: 500;
}

.diff-change {
  display: flex;
  align-items: center;
  gap: 6px;
}

.old-val {
  color: var(--text-tertiary);
  text-decoration: line-through;
}

.arrow {
  color: var(--text-tertiary);
}

.new-val {
  color: var(--color-success);
  font-weight: 500;
}

.no-diff {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
  padding: 12px;
}

/* 统计信息 */
.stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 操作按钮 */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
