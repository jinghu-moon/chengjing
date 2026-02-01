/**
 * 配置预设系统 Composable
 * DataBackup 2.0 - Phase 1
 */

import { ref, computed } from 'vue'
import type { AppPreset } from '@/types/backup'
import { useSettings } from './useSettings'

const STORAGE_KEY = 'chengjing_presets'

// 单例状态
const presets = ref<AppPreset[]>([])
let initialized = false

/**
 * 系统默认预设
 */
const SYSTEM_PRESETS: AppPreset[] = [
  {
    id: 'system_minimal',
    name: '极简模式',
    description: '专注内容，减少干扰',
    icon: '🎯',
    isSystem: true,
    createdAt: 0,
    data: {
      settings: {
        showTodo: false,
        showNotePad: false,
        showCalculator: false,
        showDailyPoem: false,
        gridRows: 1,
        gridCols: 8,
        desktopPreset: 'compact'
      },
      iconConfig: {
        hideLabel: true,
        boxSize: 72
      }
    }
  },
  {
    id: 'system_standard',
    name: '标准模式',
    description: '平衡功能与简洁',
    icon: '⚖️',
    isSystem: true,
    createdAt: 0,
    data: {
      settings: {
        showTodo: true,
        showNotePad: true,
        showCalculator: true,
        showDailyPoem: true,
        gridRows: 2,
        gridCols: 6,
        desktopPreset: 'standard'
      },
      iconConfig: {
        hideLabel: false,
        boxSize: 84
      }
    }
  },
  {
    id: 'system_focus',
    name: '专注模式',
    description: '番茄钟 + 待办，高效工作',
    icon: '🍅',
    isSystem: true,
    createdAt: 0,
    data: {
      settings: {
        showTodo: true,
        showNotePad: false,
        showCalculator: false,
        showDailyPoem: false,
        pomodoroWorkMinutes: 25,
        pomodoroBreakMinutes: 5,
        pomodoroAutoBreak: true
      },
      iconConfig: {}
    }
  }
]

/**
 * 生成唯一 ID
 */
const generateId = (): string => {
  return `preset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function usePresets() {
  const { settings, iconConfig } = useSettings()

  /**
   * 初始化：从 localStorage 加载
   */
  const init = () => {
    if (initialized) return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const userPresets = JSON.parse(stored) as AppPreset[]
        // 合并系统预设 + 用户预设
        presets.value = [...SYSTEM_PRESETS, ...userPresets]
      } else {
        presets.value = [...SYSTEM_PRESETS]
      }
    } catch (e) {
      console.error('[Presets] Load failed:', e)
      presets.value = [...SYSTEM_PRESETS]
    }

    initialized = true
  }

  /**
   * 持久化用户预设（排除系统预设）
   */
  const persist = () => {
    const userPresets = presets.value.filter(p => !p.isSystem)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userPresets))
  }

  /**
   * 获取所有预设（系统 + 用户）
   */
  const allPresets = computed(() => presets.value)

  /**
   * 获取用户预设
   */
  const userPresets = computed(() => presets.value.filter(p => !p.isSystem))

  /**
   * 保存当前配置为新预设
   */
  const saveCurrentAsPreset = (name: string, icon: string = '📦', description?: string): AppPreset => {
    const newPreset: AppPreset = {
      id: generateId(),
      name,
      icon,
      description,
      isSystem: false,
      createdAt: Date.now(),
      data: {
        settings: { ...settings },
        iconConfig: { ...iconConfig }
      }
    }

    presets.value.push(newPreset)
    persist()

    return newPreset
  }

  /**
   * 应用预设
   */
  const applyPreset = (id: string): boolean => {
    const preset = presets.value.find(p => p.id === id)
    if (!preset) return false

    // 合并配置（Partial 合并，保留未定义的项）
    if (preset.data.settings) {
      Object.assign(settings, preset.data.settings)
    }
    if (preset.data.iconConfig) {
      Object.assign(iconConfig, preset.data.iconConfig)
    }

    return true
  }

  /**
   * 更新预设
   */
  const updatePreset = (id: string, updates: Partial<Pick<AppPreset, 'name' | 'icon' | 'description'>>): boolean => {
    const preset = presets.value.find(p => p.id === id)
    if (!preset || preset.isSystem) return false

    Object.assign(preset, updates, { updatedAt: Date.now() })
    persist()

    return true
  }

  /**
   * 删除预设
   */
  const deletePreset = (id: string): boolean => {
    const index = presets.value.findIndex(p => p.id === id)
    if (index === -1) return false

    const preset = presets.value[index]
    if (preset.isSystem) return false // 系统预设不可删除

    presets.value.splice(index, 1)
    persist()

    return true
  }

  // 自动初始化
  init()

  return {
    presets: allPresets,
    userPresets,
    saveCurrentAsPreset,
    applyPreset,
    updatePreset,
    deletePreset
  }
}
