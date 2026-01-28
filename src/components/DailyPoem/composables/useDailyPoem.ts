/**
 * 每日诗词 Hook (聚合层)
 */
import { computed } from 'vue'
import { useDailyPoemSettings } from './useDailyPoemSettings'
import { useDailyRecommendation } from './useDailyRecommendation'
import { usePoemData } from './usePoemData'

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
  const { settings, updateSettings } = useDailyPoemSettings()

  // 3. 每日推荐逻辑
  const { 
    poem, 
    loading, 
    loadPoem: _loadPoem, 
    clearCache,
    fetchOnline
  } = useDailyRecommendation(settings, localPoems, initLocalPoems)

  // 4. 对外暴露的方法封装
  
  // 更新设置时的副作用处理
  const handleUpdateSettings = (newSettings: Partial<typeof settings.value>) => {
    updateSettings(newSettings, () => {
      // 如果改变了来源或在线模式，清除缓存并重新加载
      if (newSettings.online !== undefined || newSettings.source !== undefined) {
        clearCache()
        _loadPoem()
      }
    })
  }

  const isOnlineMode = computed({
    get: () => settings.value.online,
    set: (val) => handleUpdateSettings({ online: val })
  })

  const loadPoem = () => _loadPoem(false)
  const refresh = () => _loadPoem(true)

  // 兼容逻辑：保存当前到本地
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

  // 辅助 API
  const fetchOneForForm = async () => {
    return await fetchOnline()
  }

  const authorInfo = computed(() => {
    if (!poem.value) return ''
    const { author, title, dynasty } = poem.value
    let info = ''
    
    if (settings.value.showAuthor !== false) {
      if (dynasty) info += `〔${dynasty}〕`
      info += author
    }
    
    if (settings.value.showTitle !== false && title) {
      // 保持合适的间距
      if (info) info += ' '
      info += `《${title}》`
    }
    return info
  })

  const poemCount = computed(() => localPoems.value.length)

  return {
    // State
    poem,
    loading,
    isOnlineMode,
    settings,
    localPoems,
    poemCount,
    authorInfo,

    // Methods
    loadPoem,
    refresh,
    setOnlineMode: (val: boolean) => handleUpdateSettings({ online: val }),
    updateSettings: handleUpdateSettings,
    saveCurrentToLocal,
    fetchOneForForm,

    // CRUD Re-exports
    addPoem,
    updatePoem,
    deletePoem,
    searchPoems,
    exportPoems,
    importPoems,
  }
}
