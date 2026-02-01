/**
 * DataBackup 2.0 类型定义
 */

import type { Settings, IconConfig } from './index'

/**
 * 配置预设
 */
export interface AppPreset {
  id: string
  name: string
  description?: string
  icon: string // emoji
  isSystem?: boolean // 系统预设不可删除
  createdAt: number
  updatedAt?: number
  data: {
    settings: Partial<Settings>
    iconConfig: Partial<IconConfig>
  }
}

/**
 * 历史快照触发类型
 */
export type SnapshotTrigger = 'manual' | 'auto' | 'restore_point' | 'preset_apply'

/**
 * 历史快照（仅存配置，避免全量数据过大）
 */
export interface BackupSnapshot {
  id: string
  timestamp: number
  trigger: SnapshotTrigger
  label?: string // 可选标签，如 "应用预设: 极简模式"
  sizeKB: number
  isLocked?: boolean // 锁定的快照不会被自动清理
  data: {
    settings: Settings
    iconConfig: IconConfig
  }
}

/**
 * 历史快照元数据（用于列表展示，不含完整数据）
 */
export interface SnapshotMeta {
  id: string
  timestamp: number
  trigger: SnapshotTrigger
  label?: string
  sizeKB: number
  isLocked?: boolean
}
