import { ref, onMounted } from 'vue'
import type { Shortcut, IconConfig } from '@/types'

// 快照数据结构
export interface LayoutSnapshot {
  id: string
  name: string
  createdAt: number
  version: number
  data: {
    shortcuts: Shortcut[]
    settings: {
      layoutGridRows: number
      layoutGridCols: number
      layoutGridGapX: number
      layoutGridGapY: number
      folderPreviewMode?: string
      iconConfig: IconConfig
    }
  }
}

const STORAGE_KEY = 'lime-snapshots'
const MAX_SNAPSHOTS = 20
const SNAPSHOT_VERSION = 1

export function useSnapshot() {
  const snapshots = ref<LayoutSnapshot[]>([])

  // ===== 私有方法 =====

  /**
   * 从 LocalStorage 加载快照
   */
  const loadSnapshots = (): void => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        snapshots.value = Array.isArray(parsed) ? parsed : []
      }
    } catch (error) {
      console.error('加载快照失败:', error)
      snapshots.value = []
    }
  }

  /**
   * 保存到 LocalStorage（带重试限制）
   */
  const persistSnapshots = (retryCount = 0): void => {
    const MAX_RETRY = 3

    try {
      const json = JSON.stringify(snapshots.value)
      localStorage.setItem(STORAGE_KEY, json)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('存储空间已满')

        if (retryCount < MAX_RETRY && snapshots.value.length > 0) {
          snapshots.value.shift()
          persistSnapshots(retryCount + 1)
        } else {
          throw new Error('存储空间不足，请删除其他数据后重试')
        }
      } else {
        throw error
      }
    }
  }

  /**
   * 深度克隆对象
   */
  const deepClone = <T>(obj: T): T => {
    try {
      return JSON.parse(JSON.stringify(obj))
    } catch (e) {
      console.error('Deep clone failed', e)
      throw new Error('数据克隆失败，无法保存快照')
    }
  }

  /**
   * 数据校验（完整版本）
   */
  const validateSnapshot = (snap: any): snap is LayoutSnapshot => {
    try {
      return !!(
        snap &&
        snap.id &&
        snap.name &&
        snap.createdAt &&
        snap.data &&
        Array.isArray(snap.data.shortcuts) &&
        snap.data.settings &&
        typeof snap.data.settings.layoutGridRows === 'number' &&
        typeof snap.data.settings.layoutGridCols === 'number' &&
        typeof snap.data.settings.layoutGridGapX === 'number' &&
        typeof snap.data.settings.layoutGridGapY === 'number' &&
        snap.data.settings.iconConfig &&
        typeof snap.data.settings.iconConfig === 'object'
      )
    } catch {
      return false
    }
  }

  /**
   * 生成 UUID (兼容性处理)
   */
  const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  /**
   * 格式化日期为文件名
   */
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toISOString().slice(0, 10)
  }

  // ===== 公共方法 =====

  /**
   * 创建新快照
   */
  const createSnapshot = (
    name: string,
    shortcuts: Shortcut[],
    settings: {
      layoutGridRows: number
      layoutGridCols: number
      layoutGridGapX: number
      layoutGridGapY: number
      folderPreviewMode?: string
      iconConfig: IconConfig
    }
  ): string => {
    if (!name.trim()) {
      throw new Error('快照名称不能为空')
    }

    const snapshot: LayoutSnapshot = {
      id: generateUUID(),
      name: name.trim(),
      createdAt: Date.now(),
      version: SNAPSHOT_VERSION,
      data: {
        shortcuts: deepClone(shortcuts),
        settings: deepClone(settings)
      }
    }

    snapshots.value.unshift(snapshot)

    if (snapshots.value.length > MAX_SNAPSHOTS) {
      snapshots.value = snapshots.value.slice(0, MAX_SNAPSHOTS)
    }

    persistSnapshots()

    return snapshot.id
  }

  /**
   * 恢复快照
   */
  const restoreSnapshot = (id: string) => {
    const snapshot = snapshots.value.find(s => s.id === id)

    if (!snapshot) {
      throw new Error('快照不存在')
    }

    if (!validateSnapshot(snapshot)) {
      throw new Error('快照数据已损坏')
    }

    return {
      shortcuts: deepClone(snapshot.data.shortcuts),
      settings: deepClone(snapshot.data.settings)
    }
  }

  /**
   * 删除快照
   */
  const removeSnapshot = (id: string): void => {
    const index = snapshots.value.findIndex(s => s.id === id)

    if (index === -1) {
      throw new Error('快照不存在')
    }

    snapshots.value.splice(index, 1)
    persistSnapshots()
  }

  /**
   * 重命名快照
   */
  const renameSnapshot = (id: string, newName: string): void => {
    const snapshot = snapshots.value.find(s => s.id === id)

    if (!snapshot) {
      throw new Error('快照不存在')
    }

    const trimmed = newName.trim()
    if (!trimmed) {
      throw new Error('快照名称不能为空')
    }

    snapshot.name = trimmed
    persistSnapshots()
  }

  /**
   * 导出快照为 JSON 文件
   */
  const exportSnapshot = (id: string): void => {
    const snapshot = snapshots.value.find(s => s.id === id)

    if (!snapshot) {
      throw new Error('快照不存在')
    }

    const json = JSON.stringify(snapshot, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `${snapshot.name}-${formatDate(Date.now())}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * 导入快照
   */
  const importSnapshot = async (file: File): Promise<string> => {
    try {
      const text = await file.text()
      const snapshot = JSON.parse(text) as LayoutSnapshot

      if (!validateSnapshot(snapshot)) {
        throw new Error('无效的快照文件格式，请确保文件包含必需的字段')
      }

      // ✅ 修复：使用 generateUUID
      snapshot.id = generateUUID()
      snapshot.createdAt = Date.now()

      snapshots.value.unshift(snapshot)

      if (snapshots.value.length > MAX_SNAPSHOTS) {
        snapshots.value = snapshots.value.slice(0, MAX_SNAPSHOTS)
      }

      persistSnapshots()

      return snapshot.id
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('文件格式错误，无法解析 JSON')
      }
      throw error
    }
  }

  /**
   * 获取存储大小（字节）
   */
  const getStorageSize = (): number => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Blob([raw]).size : 0
  }

  // ===== 生命周期 =====

  onMounted(() => {
    loadSnapshots()
  })

  // ===== 返回 API =====

  return {
    snapshots,
    maxSnapshots: MAX_SNAPSHOTS,
    createSnapshot,
    restoreSnapshot,
    removeSnapshot,
    renameSnapshot,
    exportSnapshot,
    importSnapshot,
    getStorageSize
  }
}