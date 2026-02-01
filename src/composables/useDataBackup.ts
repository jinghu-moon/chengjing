import { ref } from 'vue'
import dayjs from 'dayjs'
import { downloadFile } from '../utils/file'
import { validateBackup, CURRENT_BACKUP_VERSION } from '../utils/backup-validator'
import { analyzeBackup, type DiffResult } from '../utils/backup-diff'

// 引入各模块 Stores
import { useSettings } from './useSettings' // Settings + IconConfig
import { useTodos } from './useTodos'
import { useNotes } from './useNotes'
import { usePoemData } from '../components/DailyPoem/composables/usePoemData'

// SessionKey for Rollback
const ROLLBACK_KEY = 'chengjing_restore_rollback_point'
const SAFE_SIZE_LIMIT_KB = 4500 // 4.5MB 限制 (SessionStorage 通常 5MB)

export interface RestoreStats {
  settings: boolean
  iconConfig: boolean
  todoCount: number
  noteCount: number
  poemCount: number
  exportTimeDisplay: string
  version: number
}

export function useDataBackup() {
  const { settings, iconConfig } = useSettings()
  const { todos, initTodos } = useTodos()
  const { notes, initNotes } = useNotes()
  // DailyPoem 需要底层 Data API
  const { getRawData, overwriteRawData } = usePoemData()

  // UI State
  const isBackingUp = ref(false)
  const isRestoring = ref(false)

  /**
   * 收集当前所有数据
   */
  const collectAllData = async () => {
    // 确保 store 已初始化
    initTodos()
    initNotes()
    
    // Poems 是异步读取
    const poems = await getRawData()

    return {
      settings: settings, // Reactive -> Data
      iconConfig: iconConfig,
      todos: todos.value,
      notes: notes.value,
      poems: poems
    }
  }

  /**
   * 预估导出大小 (KB)
   */
  const estimateSizeKB = async () => {
    const data = await collectAllData()
    const json = JSON.stringify(data)
    return (new Blob([json]).size / 1024).toFixed(1)
  }

  /**
   * 导出备份
   */
  const exportBackup = async () => {
    try {
      isBackingUp.value = true
      const data = await collectAllData()

      const backup = {
        meta: {
          version: CURRENT_BACKUP_VERSION,
          exportTime: Date.now(),
          appName: 'ChengJing',
          dataKeys: Object.keys(data)
        },
        data: data
      }

      const timeStr = dayjs().format('YYYYMMDD-HHmmss')
      const fileName = `chengjing-backup-v1-${timeStr}.json`
      
      downloadFile(fileName, JSON.stringify(backup, null, 2))
      return true
    } catch (e) {
      console.error('[Backup] Export failed:', e)
      return false
    } finally {
      isBackingUp.value = false
    }
  }

  /**
   * 创建安全快照 (SessionStorage)
   * 返回 IsFullBackup (Boolean)
   */
  const createSafetySnapshot = async (): Promise<boolean> => {
    try {
      const data = await collectAllData()
      const json = JSON.stringify(data)
      const sizeKB = new Blob([json]).size / 1024

      if (sizeKB > SAFE_SIZE_LIMIT_KB) {
        // 降级备份：只存配置
        const liteData = {
          settings: data.settings,
          iconConfig: data.iconConfig
          // 丢弃大数据
        }
        sessionStorage.setItem(ROLLBACK_KEY, JSON.stringify({
          isPartial: true,
          data: liteData
        }))
        console.warn('[Backup] 数据量过大，快照仅包含配置项')
        return false
      } else {
        // 全量备份
        sessionStorage.setItem(ROLLBACK_KEY, JSON.stringify({
          isPartial: false,
          data: data
        }))
        return true
      }
    } catch (e) {
      console.error('[Backup] Snapshot failed:', e)
      return false
    }
  }

  /**
   * 执行回滚
   */
  const rollback = async () => {
    try {
      const stored = sessionStorage.getItem(ROLLBACK_KEY)
      if (!stored) return

      const { data, isPartial } = JSON.parse(stored)
      
      // 恢复内存状态
      if (data.settings) Object.assign(settings, data.settings)
      if (data.iconConfig) Object.assign(iconConfig, data.iconConfig)
      
      if (!isPartial) {
        if (data.todos) todos.value = data.todos
        if (data.notes) notes.value = data.notes
        if (data.poems) await overwriteRawData(data.poems)
      }

      console.log('[Backup] 已回滚状态', isPartial ? '(部分)' : '(全量)')
      sessionStorage.removeItem(ROLLBACK_KEY)
    } catch (e) {
      console.error('[Backup] Rollback CRITICAL ERROR:', e)
      // 此时非常危险，建议提示用户刷新页面
      // Toast 提示
      // showToast({ type: 'error', message: '严重错误：回滚失败，请立即刷新页面！' })
      // 但由于此处也是 composable，通过 throw error 让上层 UI (DataBackupSection) 处理
      throw new Error('CRITICAL_ROLLBACK_FAILED')
    }
  }

  /**
   * 解析并校验文件
   */
  const parseAndValidate = async (file: File) => {
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      
      // 1. 校验
      const validRes = validateBackup(json)
      if (validRes.status === 'reject') {
        throw new Error(validRes.reason)
      }

      // 2. 提取统计信息
      const d = json.data
      const stats: RestoreStats = {
        settings: !!d.settings,
        iconConfig: !!d.iconConfig,
        todoCount: d.todos?.length || 0,
        noteCount: d.notes?.length || 0,
        poemCount: d.poems?.length || 0,
        exportTimeDisplay: dayjs(json.meta.exportTime).format('YYYY-MM-DD HH:mm:ss'),
        version: json.meta.version
      }

      return { valid: true, data: d, stats }
    } catch (e: any) {
      return { valid: false, error: e.message }
    }
  }

  /**
   * 主恢复逻辑
   */
  const performRestore = async (json: any) => {
    isRestoring.value = true
    try {
      // 1. 创建快照
      await createSafetySnapshot()

      // 2. 执行恢复 (Reactive Update)
      // 如果传入的是完整备份对象(含meta)，取.data；如果已经是数据对象，则直接使用
      const d = json.data || json 

      if (d.settings) Object.assign(settings, d.settings)
      if (d.iconConfig) Object.assign(iconConfig, d.iconConfig)
      
      // 必须创建新数组引用以触发 Watcher
      if (d.todos) todos.value = [...d.todos] 
      if (d.notes) notes.value = [...d.notes]

      // 异步写入
      if (d.poems) {
        await overwriteRawData(d.poems)
      }

      return { success: true }
    } catch (e: any) {
      console.error('[Backup] Restore failed, rolling back...', e)
      await rollback()
      return { success: false, error: e.message, rolledBack: true }
    } finally {
      isRestoring.value = false
    }
  }

  /**
   * V1.1 新增: 合并逻辑
   */
  const performMerge = async (diff: DiffResult, options: { 
    includePoems: boolean,
    includeTodos: boolean,
    includeNotes: boolean,
    overwriteSettings: boolean,
    sourceData: any // backup json data
  }) => {
    isRestoring.value = true
    try {
      // 1. 安全快照 (Merge 虽为增量，仍建议快照)
      await createSafetySnapshot()

      const d = options.sourceData

      // 2. 执行 Setttings 覆盖 (若开启)
      if (options.overwriteSettings) {
        if (d.settings) Object.assign(settings, d.settings)
        if (d.iconConfig) Object.assign(iconConfig, d.iconConfig)
      }

      // 3. 执行增量合并 (使用 Diff 结果)
      
      // Todos: 生成新ID并追加
      if (options.includeTodos && diff.todos.toAdd.length > 0) {
        const newTodos = diff.todos.toAdd.map((t, i) => ({
          ...t,
          id: crypto.randomUUID ? parseInt(crypto.randomUUID()) : (Date.now() + i) // 保持 number 类型
        }))
        todos.value = [...todos.value, ...newTodos]
      }

      // Notes: 生成新ID并追加
      if (options.includeNotes && diff.notes.toAdd.length > 0) {
        const newNotes = diff.notes.toAdd.map((n, i) => ({
          ...n,
          id: crypto.randomUUID ? crypto.randomUUID() : (Date.now() + i).toString()
        }))
        notes.value = [...notes.value, ...newNotes]
      }

      // Poems: 批量追加 (已去重)
      if (options.includePoems && diff.poems.toAdd.length > 0) {
        await overwriteRawData([...(await getRawData()), ...diff.poems.toAdd])
      }

      return { success: true, addedCount: {
        todos: options.includeTodos ? diff.todos.toAdd.length : 0,
        notes: options.includeNotes ? diff.notes.toAdd.length : 0,
        poems: options.includePoems ? diff.poems.toAdd.length : 0
      }}

    } catch (e: any) {
      console.error('[Backup] Merge failed:', e)
      await rollback()
      throw e
    } finally {
      isRestoring.value = false
    }
  }

  /**
   * V1.2: 选择性恢复设置项
   * @param selectedKeys 用户选中的配置项 key 数组
   * @param backupData 备份数据 (json.data)
   */
  const performSelectiveSettingsRestore = async (
    selectedKeys: string[],
    backupData: any
  ) => {
    isRestoring.value = true
    try {
      // 1. 创建安全快照
      await createSafetySnapshot()

      // 2. 分离 settings 和 iconConfig 的 keys
      const settingsKeys = selectedKeys.filter(k => k in settings)
      const iconKeys = selectedKeys.filter(k => k in iconConfig)

      // 3. 选择性写入 settings
      settingsKeys.forEach(key => {
        if (backupData.settings && key in backupData.settings) {
          (settings as any)[key] = backupData.settings[key]
        }
      })

      // 4. 选择性写入 iconConfig
      iconKeys.forEach(key => {
        if (backupData.iconConfig && key in backupData.iconConfig) {
          (iconConfig as any)[key] = backupData.iconConfig[key]
        }
      })

      return {
        success: true,
        appliedCount: selectedKeys.length
      }
    } catch (e: any) {
      console.error('[Backup] Selective restore failed:', e)
      await rollback()
      return { success: false, error: e.message }
    } finally {
      isRestoring.value = false
    }
  }

  return {
    isBackingUp,
    isRestoring,
    estimateSizeKB,
    exportBackup,
    parseAndValidate,
    performRestore,

    // V1.1 Exports
    collectAllData,
    analyzeBackup,
    performMerge,

    // V1.2 Exports
    performSelectiveSettingsRestore
  }
}
