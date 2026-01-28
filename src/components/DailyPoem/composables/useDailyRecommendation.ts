/**
 * 每日推荐 Hook
 * 职责：负责每日诗词的推荐逻辑 (缓存、算法、API)
 */
import { ref, type Ref } from 'vue'
import { type Poem, type DailyPoemSettings } from '../types'
import { fetchHitokotoPoem, fetchJinrishiciPoem } from './usePoemApi'
import { type LocalPoem } from '../types'

const CACHE_KEY = 'daily-poem-cache'
const CACHE_DATE_KEY = 'daily-poem-date'

// 工具：获取今天日期字符串
const getTodayString = (): string => {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

// 工具：基于日期生成稳定的随机索引
const getDailyIndex = (max: number): number => {
  const today = getTodayString()
  let hash = 0
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash) % max
}

export function useDailyRecommendation(
  settings: Ref<DailyPoemSettings>,
  localPoems: Ref<LocalPoem[]>,
  initLocalPoems: () => Promise<void>
) {
  const poem = ref<Poem | null>(null)
  const loading = ref(false)

  // 缓存逻辑
  const loadFromCache = (): Poem | null => {
    try {
      const cachedDate = localStorage.getItem(CACHE_DATE_KEY)
      if (cachedDate === getTodayString()) {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) return JSON.parse(cached)
      }
    } catch (e) { console.warn(e) }
    return null
  }

  const saveToCache = (p: Poem) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(p))
      localStorage.setItem(CACHE_DATE_KEY, getTodayString())
    } catch (e) { console.warn(e) }
  }

  // 清除缓存
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY)
    localStorage.removeItem(CACHE_DATE_KEY)
  }

  // 获取逻辑
  const getLocalPoem = (random = false): Poem | null => {
    if (localPoems.value.length === 0) return null
    const index = random
      ? Math.floor(Math.random() * localPoems.value.length)
      : getDailyIndex(localPoems.value.length)
    const p = localPoems.value[index]
    return { content: p.content, author: p.author, title: p.title, dynasty: p.dynasty }
  }

  const fetchOnline = async (): Promise<Poem | null> => {
    if (settings.value.source === 'hitokoto') {
      return await fetchHitokotoPoem(settings.value.hitokotoCategories)
    } else {
      return await fetchJinrishiciPoem()
    }
  }

  const loadPoem = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = loadFromCache()
      if (cached) {
        poem.value = cached
        return
      }
    }

    loading.value = true
    try {
      // 确保本地数据已加载
      await initLocalPoems()

      let newPoem: Poem | null = null
      
      if (settings.value.online) {
        newPoem = await fetchOnline()
      }
      
      if (!newPoem) {
        newPoem = getLocalPoem(forceRefresh) // 如果是强制刷新，则随机
      }
      
      if (newPoem) {
        poem.value = newPoem
        saveToCache(newPoem)
      }
    } finally {
      loading.value = false
    }
  }

  return {
    poem,
    loading,
    loadPoem,
    clearCache,
    fetchOnline // 暴露给外部使用 (如 PoemForm)
  }
}
