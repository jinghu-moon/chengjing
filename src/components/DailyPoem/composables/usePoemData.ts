import { shallowRef, toRaw } from 'vue'
import { get, set } from 'idb-keyval'
import { downloadFile } from '@/utils/file'
import { type LocalPoem } from '../types'
import defaultPoemsData from '@/data/poems.json'

const LOCAL_POEMS_KEY = 'daily-poem-local-poems'

// 单例状态
const localPoems = shallowRef<LocalPoem[]>([])
let initialized = false
let initPromise: Promise<void> | null = null

/** 生成唯一 ID */
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function usePoemData() {
  /** 保存本地诗词到 IndexedDB (异步) */
  const saveLocalPoems = async () => {
    try {
      // 使用 toRaw 获取原始对象，避免 Proxy 问题 (尽管 idb-keyval 通常能处理)
      await set(LOCAL_POEMS_KEY, toRaw(localPoems.value))
    } catch (e) {
      console.warn('[DailyPoem] 本地诗词保存失败', e)
    }
  }

  /** 初始化本地诗词 (支持从 localStorage 迁移) */
  const initLocalPoems = async () => {
    if (initialized) return
    if (initPromise) return initPromise

    initPromise = (async () => {
      try {
        // 1. 尝试从 IDB 读取
        let data = await get<LocalPoem[]>(LOCAL_POEMS_KEY)

        // 2. 迁移逻辑：如果 IDB 为空，检查 localStorage
        if (!data) {
          const localStr = localStorage.getItem(LOCAL_POEMS_KEY)
          if (localStr) {
            try {
              data = JSON.parse(localStr)
              // 迁移到 IDB
              await set(LOCAL_POEMS_KEY, data)
              // 清理旧数据
              localStorage.removeItem(LOCAL_POEMS_KEY)
              console.log('[DailyPoem] 已将诗词数据迁移至 IndexedDB')
            } catch (e) {
              console.warn('[DailyPoem] 迁移失败，将使用默认数据', e)
            }
          }
        }

        // 3. 默认数据初始化
        if (!data) {
          // @ts-ignore
          const defaultPoems = (defaultPoemsData.poems).map((p: any) => ({
            id: generateId(),
            ...p,
            createdAt: Date.now()
          }))
          data = defaultPoems
          await set(LOCAL_POEMS_KEY, data)
        }

        localPoems.value = data || []
        initialized = true
      } catch (e) {
        console.warn('[DailyPoem] 初始化失败', e)
        localPoems.value = []
      } finally {
        initPromise = null
      }
    })()

    return initPromise
  }

  /** 新增诗词 */
  const addPoem = (poemData: Omit<LocalPoem, 'id' | 'createdAt'>): LocalPoem => {
    const newPoem: LocalPoem = {
      id: generateId(),
      ...poemData,
      createdAt: Date.now()
    }
    localPoems.value = [newPoem, ...localPoems.value]
    saveLocalPoems() // 触发异步保存
    return newPoem
  }

  /** 更新诗词 */
  const updatePoem = (id: string, data: Partial<Omit<LocalPoem, 'id' | 'createdAt'>>) => {
    const index = localPoems.value.findIndex(p => p.id === id)
    if (index !== -1) {
      localPoems.value = localPoems.value.map((p, i) => 
        i === index ? { ...p, ...data } : p
      )
      saveLocalPoems()
    }
  }

  /** 删除诗词 */
  const deletePoem = (id: string) => {
    localPoems.value = localPoems.value.filter(p => p.id !== id)
    saveLocalPoems()
  }

  /** 搜索诗词 */
  const searchPoems = (keyword: string): LocalPoem[] => {
    if (!keyword.trim()) return localPoems.value
    const kw = keyword.toLowerCase()
    return localPoems.value.filter(p => 
      p.content.toLowerCase().includes(kw) ||
      p.author.toLowerCase().includes(kw) ||
      (p.title && p.title.toLowerCase().includes(kw)) ||
      (p.dynasty && p.dynasty.toLowerCase().includes(kw))
    )
  }

  /** 导出诗词为 JSON */
  /** 导出诗词为 JSON */
  const exportPoems = () => {
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    const data = JSON.stringify(localPoems.value, null, 2)
    downloadFile(`poems-backup-${dateStr}.json`, data)
  }

  /** 导入诗词（合并模式） */
  const importPoems = (file: File): Promise<{ added: number; skipped: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string) as LocalPoem[]
          let added = 0
          let skipped = 0
         
          // 建立现有内容的指纹集合 (优化 O(n))
          const existingContents = new Set(localPoems.value.map(p => `${p.content}|${p.author}`))
          const toAdd: LocalPoem[] = []
          
          imported.forEach(p => {
            const key = `${p.content}|${p.author}`
            if (!existingContents.has(key)) {
              toAdd.push({
                ...p,
                id: generateId(),
                createdAt: p.createdAt || Date.now()
              })
              existingContents.add(key)
              added++
            } else {
              skipped++
            }
          })
          
          // 批量更新 Vue 响应式数据 (优化: 避免循环内展开数组)
          if (toAdd.length > 0) {
            localPoems.value = [...localPoems.value, ...toAdd]
          }
          
          saveLocalPoems()
          resolve({ added, skipped })
        } catch (err) {
          reject(new Error('JSON 解析失败'))
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  }

  /** 
   * [Backup] 获取原始数据（同步+异步）
   * 用于备份导出，确保获取到最新的 localPoems
   */
  const getRawData = async (): Promise<LocalPoem[]> => {
    // 确保已初始化
    if (!initialized) {
      await initLocalPoems()
    }
    return toRaw(localPoems.value)
  }

  /**
   * [Restore] 覆盖原始数据 (Batch Write)
   * 采用重置 + 批量写入模式，提高性能
   */
  const overwriteRawData = async (newPoems: LocalPoem[]) => {
    try {
      // 1. 更新内存状态 (Vue Reactivity)
      localPoems.value = newPoems
      
      // 2. 持久化 (IndexedDB)
      // 直接覆盖 Key，idb-keyval 的 set 是原子操作，对于大数组可能较慢，
      // 但对于 poems 这种单 key 存储数组的模式，直接 set 即可。
      // 注意：之前的实现是把整个数组存为一个 Key 'daily-poem-local-poems'
      // 所以这里直接 set 整个数组就是最高效的 "Batch Write"
      await set(LOCAL_POEMS_KEY, toRaw(newPoems))
      
      console.log(`[DailyPoem] 已恢复 ${newPoems.length} 首诗词`)
    } catch (e) {
      console.error('[DailyPoem] 恢复数据失败', e)
      throw e // 抛出错误供上层回滚
    }
  }

  return {
    localPoems,
    initLocalPoems,
    addPoem,
    updatePoem,
    deletePoem,
    searchPoems,
    saveLocalPoems,
    exportPoems,
    importPoems,
    // Backup API
    getRawData,
    overwriteRawData
  }
}
