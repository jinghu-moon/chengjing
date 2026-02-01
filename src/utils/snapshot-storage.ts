/**
 * 历史快照 IndexedDB 存储
 * DataBackup 2.0 - Phase 2
 */

import type { BackupSnapshot, SnapshotMeta } from '@/types/backup'

const DB_NAME = 'chengjing_db'
const DB_VERSION = 1
const STORE_NAME = 'snapshots'
const MAX_SNAPSHOTS = 10

let dbInstance: IDBDatabase | null = null

/**
 * 打开数据库（单例模式）
 */
const openDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      dbInstance = request.result
      dbInstance.onclose = () => { dbInstance = null }
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

/**
 * 保存快照
 */
export const saveSnapshot = async (snapshot: BackupSnapshot): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(snapshot)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * 获取单个快照
 */
export const getSnapshot = async (id: string): Promise<BackupSnapshot | null> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 获取所有快照元数据（按时间倒序）
 */
export const getAllSnapshotMetas = async (): Promise<SnapshotMeta[]> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const index = store.index('timestamp')
    const request = index.openCursor(null, 'prev') // 倒序

    const metas: SnapshotMeta[] = []
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result
      if (cursor) {
        const { id, timestamp, trigger, label, sizeKB, isLocked } = cursor.value
        metas.push({ id, timestamp, trigger, label, sizeKB, isLocked })
        cursor.continue()
      } else {
        resolve(metas)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * 删除快照
 */
export const deleteSnapshot = async (id: string): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

/**
 * 获取快照数量
 */
export const getSnapshotCount = async (): Promise<number> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.count()

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 清理旧快照（保留锁定的）
 */
export const cleanupOldSnapshots = async (): Promise<number> => {
  const metas = await getAllSnapshotMetas()
  const unlocked = metas.filter(m => !m.isLocked)

  // 超出限制时删除最旧的未锁定快照
  const toDelete = unlocked.slice(MAX_SNAPSHOTS)
  for (const meta of toDelete) {
    await deleteSnapshot(meta.id)
  }

  return toDelete.length
}

/**
 * 切换快照锁定状态
 */
export const toggleSnapshotLock = async (id: string): Promise<boolean> => {
  const snapshot = await getSnapshot(id)
  if (!snapshot) return false

  snapshot.isLocked = !snapshot.isLocked
  await saveSnapshot(snapshot)

  return snapshot.isLocked
}
