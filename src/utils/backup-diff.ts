import type { TodoItem } from '../composables/useTodos'
import type { Note } from '../composables/useNotes'
import type { LocalPoem } from '../components/DailyPoem/types'
import { SETTINGS_META, ICON_CONFIG_META, getSettingLabel } from './settings-meta'

/**
 * V1.2 详细设置差异项
 */
export interface SettingsDiffItem {
  key: string
  label: string
  localValue: any
  backupValue: any
  isDifferent: boolean
}

/**
 * 差异分析结果接口
 */
export interface DiffResult {
  poems: {
    toAdd: LocalPoem[]
    duplicateCount: number
    totalInBackup: number
  }
  todos: {
    toAdd: TodoItem[]
    duplicateCount: number
    totalInBackup: number
  }
  notes: {
    toAdd: Note[]
    duplicateCount: number
    totalInBackup: number
  }
  settings: {
    hasDiff: boolean
    diffKeys: string[] // 用于显示具体差异项 (e.g., 'darkMode', 'searchEngine')
  }
}

/**
 * 指纹生成策略
 */
const Fingerprints = {
  // 按照计划：poems 唯一性由 content + author 决定
  poem: (p: LocalPoem) => `${p.content}|${p.author}`,
  
  // 按照计划：todos 忽略 ID，仅由内容决定
  todo: (t: TodoItem) => `${t.text}`,
  
  // 按照计划：notes 忽略 ID，由标题+内容摘要决定 (取前100字)
  note: (n: Note) => `${n.title}|${(n.content || '').slice(0, 100)}`
}

/**
 * 泛型比对函数
 */
function diffCollection<T>(
  backupItems: T[] = [],
  currentItems: T[] = [],
  fingerprintFn: (item: T) => string
) {
  const currentSet = new Set(currentItems.map(fingerprintFn))
  const toAdd: T[] = []
  let duplicateCount = 0

  backupItems.forEach(item => {
    if (currentSet.has(fingerprintFn(item))) {
      duplicateCount++
    } else {
      toAdd.push(item)
    }
  })

  return {
    toAdd,
    duplicateCount,
    totalInBackup: backupItems.length
  }
}

/**
 * Settings 比对 (浅比较)
 * 仅比较值不一致的 Key
 */
function diffSettings(backupSettings: any = {}, currentSettings: any = {}) {
  const diffKeys: string[] = []
  const allKeys = new Set([...Object.keys(backupSettings), ...Object.keys(currentSettings)])
  
  allKeys.forEach(key => {
    // 忽略内部字段
    if (key.startsWith('__')) return
    
    // 简单的全等比较 (String/Boolean/Number)
    // 复杂对象转字符比较 (简易实现，足够用于配置项)
    const v1 = JSON.stringify(backupSettings[key])
    const v2 = JSON.stringify(currentSettings[key])
    
    if (v1 !== v2) {
      diffKeys.push(key)
    }
  })

  return {
    hasDiff: diffKeys.length > 0,
    diffKeys
  }
}

/**
 * 主分析入口
 */
export function analyzeBackup(
  backupData: any, // json.data
  currentData: any // from collectAllData
): DiffResult {
  return {
    poems: diffCollection<LocalPoem>(
      backupData.poems,
      currentData.poems,
      Fingerprints.poem
    ),
    todos: diffCollection<TodoItem>(
      backupData.todos,
      currentData.todos,
      Fingerprints.todo
    ),
    notes: diffCollection<Note>(
      backupData.notes,
      currentData.notes,
      Fingerprints.note
    ),
    settings: diffSettings(
      { ...backupData.settings, ...backupData.iconConfig }, // 视为大配置集合
      { ...currentData.settings, ...currentData.iconConfig }
    )
  }
}

/**
 * 高效值比较（避免原始类型的 JSON.stringify 开销）
 */
function isValueEqual(a: any, b: any): boolean {
  // 原始类型直接比较
  if (typeof a !== 'object' || a === null) {
    return a === b
  }
  // 对象/数组使用 JSON 比较
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * V1.2: 获取详细的设置差异列表
 * 用于细粒度配置对比界面
 */
export function getDetailedSettingsDiff(
  backupSettings: any = {},
  backupIconConfig: any = {},
  currentSettings: any = {},
  currentIconConfig: any = {}
): SettingsDiffItem[] {
  const result: SettingsDiffItem[] = []

  // 处理 Settings
  Object.keys(SETTINGS_META).forEach(key => {
    const localValue = currentSettings[key]
    const backupValue = backupSettings[key]

    result.push({
      key,
      label: getSettingLabel(key),
      localValue,
      backupValue,
      isDifferent: !isValueEqual(localValue, backupValue)
    })
  })

  // 处理 IconConfig
  Object.keys(ICON_CONFIG_META).forEach(key => {
    const localValue = currentIconConfig[key]
    const backupValue = backupIconConfig[key]

    result.push({
      key,
      label: getSettingLabel(key),
      localValue,
      backupValue,
      isDifferent: !isValueEqual(localValue, backupValue)
    })
  })

  return result
}
