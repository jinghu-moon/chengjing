/**
 * 每日诗词设置 Hook
 * 职责：管理设置的加载、保存和更新
 */
import { ref, type Ref } from 'vue'
import { type DailyPoemSettings } from '../types'

const SETTINGS_KEY = 'daily-poem-settings'

const defaultSettings: DailyPoemSettings = {
  online: false,
  source: 'jinrishici',
  hitokotoCategories: ['i', 'k', 'd'],
  showAuthor: true,
  showTitle: true,
  showCollect: true,
  showRefresh: true,
  showCard: true,
  showManager: true
}

// Singleton state
let settings: Ref<DailyPoemSettings> | null = null

export function useDailyPoemSettings() {
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

  // Initialize if not exists
  if (!settings) {
    settings = ref<DailyPoemSettings>(loadSettings())
  }

  const saveSettings = () => {
    if (!settings) return
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
  }

  const updateSettings = (newSettings: Partial<DailyPoemSettings>, callback?: () => void) => {
    if (!settings) return
    // 强制转换为 DailyPoemSettings，因为 Partial 覆盖后应当是完整的
    settings.value = { ...settings.value, ...newSettings } as DailyPoemSettings
    saveSettings()
    if (callback) callback()
  }

  return {
    settings: settings as Ref<DailyPoemSettings>,
    updateSettings
  }
}
