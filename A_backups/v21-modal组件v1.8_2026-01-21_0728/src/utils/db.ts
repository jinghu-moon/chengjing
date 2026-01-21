const DB_NAME = 'LimeTabDB'
const DB_VERSION = 2 // Upgraded for Blob support
const STORE_NAME = 'images'

let dbInstance: IDBDatabase | null = null

// Open Database with Singleton Pattern
const openDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      dbInstance = request.result
      dbInstance.onclose = () => {
        dbInstance = null
      }
      resolve(dbInstance)
    }

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

// Save image (supports Blob, File, or Base64 string)
export const saveImage = async (key: string, data: Blob | File | string): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(data, key)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// 内存缓存：Key 是 imageId, Value 是生成的 blob: URL
const blobCache = new Map<string, string>()

// Get image URL (returns Blob URL for rendering)
export const getImageUrl = async (key: string): Promise<string | null> => {
  // 1. 优先从内存缓存读取
  if (blobCache.has(key)) return blobCache.get(key)!

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(key)

    request.onsuccess = () => {
      const result = request.result
      if (!result) {
        resolve(null)
        return
      }
      // 2. 将存储的 Blob 转换为临时预览 URL
      const url = result instanceof Blob ? URL.createObjectURL(result) : result

      // 3. 写入缓存并返回
      if (typeof url === 'string') blobCache.set(key, url)
      resolve(url)
    }
    request.onerror = () => reject(request.error)
  })
}

// Get all keys (for Garbage Collection)
export const getAllImageIds = async (): Promise<string[]> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAllKeys()

    request.onsuccess = () => resolve(request.result as string[])
    request.onerror = () => reject(request.error)
  })
}

// Remove image
export const deleteImage = async (key: string): Promise<void> => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(key)

    request.onsuccess = () => {
      // 同时清理内存缓存
      if (blobCache.has(key)) {
        URL.revokeObjectURL(blobCache.get(key)!)
        blobCache.delete(key)
      }
      resolve()
    }
    request.onerror = () => reject(request.error)
  })
}

// Export alias for compatibility or clarity if needed
export const getAllKeys = getAllImageIds
export const removeImage = deleteImage
export const getImageKeys = getAllImageIds
