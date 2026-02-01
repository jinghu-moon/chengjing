/**
 * 历史记录系统 Composable
 * DataBackup 2.0 - Phase 2
 */

import { ref, watch, toRaw } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { BackupSnapshot, SnapshotMeta, SnapshotTrigger } from '@/types/backup'
import { useSettings } from './useSettings'
import {
  saveSnapshot,
  getSnapshot,
  getAllSnapshotMetas,
  deleteSnapshot,
  cleanupOldSnapshots,
  toggleSnapshotLock
} from '@/utils/snapshot-storage'

// 自动保存防抖时间（5分钟）
const AUTO_SAVE_DEBOUNCE_MS = 5 * 60 * 1000

// 单例状态
const snapshotMetas = ref<SnapshotMeta[]>([])
const isLoading = ref(false)
let watcherInitialized = false
let historyLoaded = false

/**
 * 生成快照 ID
 */
const generateId = (): string => {
  return `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 计算数据大小 (KB)
 */
const calcSizeKB = (data: any): number => {
  const json = JSON.stringify(data)
  return Math.round(new Blob([json]).size / 1024 * 10) / 10
}

export function useHistory() {
  // 在函数内部获取 settings 引用
  const { settings, iconConfig } = useSettings()

  /**
   * 加载历史记录列表
   */
  const loadHistory = async () => {
    isLoading.value = true
    try {
      snapshotMetas.value = await getAllSnapshotMetas()
    } catch (e) {
      console.error('[History] Load failed:', e)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 创建快照
   */
  const createSnapshot = async (
    trigger: SnapshotTrigger,
    label?: string
  ): Promise<BackupSnapshot | null> => {
    try {
      // 使用 toRaw 获取原始数据
      const data = {
        settings: { ...toRaw(settings) },
        iconConfig: { ...toRaw(iconConfig) }
      }

      const snapshot: BackupSnapshot = {
        id: generateId(),
        timestamp: Date.now(),
        trigger,
        label,
        sizeKB: calcSizeKB(data),
        isLocked: false,
        data
      }

      await saveSnapshot(snapshot)
      await cleanupOldSnapshots()
      await loadHistory()

      return snapshot
    } catch (e) {
      console.error('[History] Create snapshot failed:', e)
      return null
    }
  }

  /**
   * 恢复快照
   */
  const restoreSnapshot = async (id: string): Promise<boolean> => {
    try {
      const snapshot = await getSnapshot(id)
      if (!snapshot) return false

      // 先创建恢复点
      await createSnapshot('restore_point', '恢复前自动备份')

      // 应用配置
      Object.assign(settings, snapshot.data.settings)
      Object.assign(iconConfig, snapshot.data.iconConfig)

      return true
    } catch (e) {
      console.error('[History] Restore failed:', e)
      return false
    }
  }

  /**
   * 删除快照
   */
  const removeSnapshot = async (id: string): Promise<boolean> => {
    try {
      await deleteSnapshot(id)
      await loadHistory()
      return true
    } catch (e) {
      console.error('[History] Delete failed:', e)
      return false
    }
  }

  /**
   * 切换锁定状态
   */
  const toggleLock = async (id: string): Promise<boolean> => {
    const newState = await toggleSnapshotLock(id)
    await loadHistory()
    return newState
  }

  /**
   * 手动保存
   */
  const manualSave = async (label?: string) => {
    return await createSnapshot('manual', label || '手动保存')
  }

  // 自动保存（防抖）
  const debouncedAutoSave = useDebounceFn(() => {
    createSnapshot('auto')
  }, AUTO_SAVE_DEBOUNCE_MS)

  /**
   * 初始化自动保存监听
   */
  const initAutoSaveWatcher = () => {
    if (watcherInitialized) return

    watch(
      [() => ({ ...settings }), () => ({ ...iconConfig })],
      () => {
        debouncedAutoSave()
      },
      { deep: true }
    )

    watcherInitialized = true
  }

  // 首次加载历史
  if (!historyLoaded) {
    loadHistory()
    historyLoaded = true
  }

  return {
    snapshotMetas,
    isLoading,
    loadHistory,
    createSnapshot,
    restoreSnapshot,
    removeSnapshot,
    toggleLock,
    manualSave,
    initAutoSaveWatcher
  }
}
