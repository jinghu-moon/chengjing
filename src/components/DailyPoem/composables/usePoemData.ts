import { shallowRef } from 'vue'
import { type LocalPoem } from '../types'
import defaultPoemsData from '@/data/poems.json'

const LOCAL_POEMS_KEY = 'daily-poem-local-poems'

// 单例状态
const localPoems = shallowRef<LocalPoem[]>([])
let initialized = false

/** 生成唯一 ID */
export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function usePoemData() {
  /** 保存本地诗词到 localStorage */
  const saveLocalPoems = () => {
    try {
      localStorage.setItem(LOCAL_POEMS_KEY, JSON.stringify(localPoems.value))
    } catch (e) {
      console.warn('[DailyPoem] 本地诗词保存失败', e)
    }
  }

  /** 初始化本地诗词 */
  const initLocalPoems = () => {
    if (initialized) return
    initialized = true
    
    try {
      const stored = localStorage.getItem(LOCAL_POEMS_KEY)
      if (stored) {
        localPoems.value = JSON.parse(stored)
      } else {
        // 首次使用，从默认数据初始化
        // FIXME: 类型断言可能需要调整，这里假设 defaultPoemsData 结构正确
        // @ts-ignore
        const defaultPoems = (defaultPoemsData.poems).map((p: any) => ({
          id: generateId(),
          ...p,
          createdAt: Date.now()
        }))
        localPoems.value = defaultPoems
        saveLocalPoems()
      }
    } catch (e) {
      console.warn('[DailyPoem] 本地诗词加载失败', e)
      localPoems.value = []
    }
  }

  /** 新增诗词 */
  const addPoem = (poemData: Omit<LocalPoem, 'id' | 'createdAt'>): LocalPoem => {
    const newPoem: LocalPoem = {
      id: generateId(),
      ...poemData,
      createdAt: Date.now()
    }
    localPoems.value = [newPoem, ...localPoems.value]
    saveLocalPoems()
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
  const exportPoems = () => {
    // 简单获取日期字符串用于文件名
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
    const data = JSON.stringify(localPoems.value, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `poems-backup-${dateStr}.json`
    a.click()
    URL.revokeObjectURL(url)
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
         
          // 建立现有内容的指纹集合
          const existingContents = new Set(localPoems.value.map(p => `${p.content}|${p.author}`))
          
          imported.forEach(p => {
            const key = `${p.content}|${p.author}`
            if (!existingContents.has(key)) {
              localPoems.value = [...localPoems.value, {
                ...p,
                id: generateId(),
                createdAt: p.createdAt || Date.now()
              }]
              existingContents.add(key)
              added++
            } else {
              skipped++
            }
          })
          
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

  return {
    localPoems,
    initLocalPoems,
    addPoem,
    updatePoem,
    deletePoem,
    searchPoems,
    saveLocalPoems,
    exportPoems,
    importPoems
  }
}
