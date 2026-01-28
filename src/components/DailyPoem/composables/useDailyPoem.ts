/**
 * 每日诗词 Hook (聚合层)
 */
import { ref, computed } from 'vue'
import { type DailyPoemSettings, type Poem } from '../types'
import { fetchHitokotoPoem, fetchJinrishiciPoem } from './usePoemApi'
import { usePoemData } from './usePoemData'

// 常量
const SETTINGS_KEY = 'daily-poem-settings'
const CACHE_KEY = 'daily-poem-cache'
const CACHE_DATE_KEY = 'daily-poem-date'

const defaultSettings: DailyPoemSettings = {
  online: false,
  source: 'jinrishici',
  hitokotoCategories: ['i', 'k', 'd']
}

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

export function useDailyPoem() {
  // 1. 初始化数据模块
  const {
    localPoems,
    initLocalPoems,
    addPoem,
    updatePoem,
    deletePoem,
    searchPoems,
    exportPoems,
    importPoems
  } = usePoemData()
  
  // 确保初始化
  initLocalPoems()

  // 2. 设置管理
  const loadSettings = (): DailyPoemSettings => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.warn('[DailyPoem] 设置加载失败', e)
    }
    return defaultSettings
  }

  const settings = ref<DailyPoemSettings>(loadSettings())

  const saveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
  }

  const updateSettings = (newSettings: Partial<DailyPoemSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    saveSettings()
    // 清除缓存以加载新内容
    if (newSettings.online !== undefined || newSettings.source !== undefined) {
      localStorage.removeItem(CACHE_KEY)
      localStorage.removeItem(CACHE_DATE_KEY)
      loadPoem()
    }
  }

  // 3. 核心状态
  const poem = ref<Poem | null>(null)
  const loading = ref(false)
  const isOnlineMode = computed({
    get: () => settings.value.online,
    set: (val) => updateSettings({ online: val })
  })

  // 4. 缓存逻辑
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

  // 5. 获取逻辑
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

  const loadPoem = async () => {
    const cached = loadFromCache()
    if (cached) {
      poem.value = cached
      return
    }

    loading.value = true
    try {
      // 确保本地数据已加载 (IDB 是异步的)
      await initLocalPoems()

      let newPoem: Poem | null = null
      
      if (settings.value.online) {
        newPoem = await fetchOnline()
      }
      
      if (!newPoem) {
        newPoem = getLocalPoem()
      }
      
      if (newPoem) {
        poem.value = newPoem
        saveToCache(newPoem)
      }
    } finally {
      loading.value = false
    }
  }

  const refresh = async () => {
    loading.value = true
    try {
      // 确保本地数据已加载
      await initLocalPoems()

      let newPoem: Poem | null = null
      
      if (settings.value.online) {
        newPoem = await fetchOnline()
      }
      
      if (!newPoem) {
        newPoem = getLocalPoem(true)
      }
      
      if (newPoem) {
        poem.value = newPoem
        saveToCache(newPoem)
      }
    } finally {
      loading.value = false
    }
  }

  // 兼容逻辑
  const saveCurrentToLocal = (): boolean => {
    if (!poem.value) return false
    const exists = localPoems.value.some(
      p => p.content === poem.value!.content && p.author === poem.value!.author
    )
    if (exists) return false
    
    addPoem({
      content: poem.value.content,
      author: poem.value.author,
      title: poem.value.title,
      dynasty: poem.value.dynasty
    })
    return true
  }

  const fetchOneForForm = async (): Promise<Poem | null> => {
    return await fetchOnline()
  }

  const authorInfo = computed(() => {
    if (!poem.value) return ''
    const { author, title, dynasty } = poem.value
    let info = ''
    if (dynasty) info += `〔${dynasty}〕`
    info += author
    if (title) info += `《${title}》`
    return info
  })

  const poemCount = computed(() => localPoems.value.length)

  return {
    poem,
    loading,
    isOnlineMode,
    settings,
    localPoems,
    poemCount,
    authorInfo,
    loadPoem,
    refresh,
    setOnlineMode: (val: boolean) => updateSettings({ online: val }),
    updateSettings,
    addPoem,
    updatePoem,
    deletePoem,
    saveCurrentToLocal,
    fetchOneForForm,
    searchPoems,
    exportPoems,
    importPoems,
  }
}
