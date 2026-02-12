import { watch, type Ref } from 'vue'
import { useStorage } from '@vueuse/core'
import { useSettings } from '../../../composables/useSettings'
import { isLikelyUrl } from './useBangParser'

/** 剪贴板内容最大长度（超出部分截断） */
const MAX_CLIPBOARD_LENGTH = 200
/** 读取冷却时间（ms），避免频繁调用 */
const READ_COOLDOWN = 3000

export interface ClipboardItem {
  text: string
  isUrl: boolean
  timestamp: number
}

/**
 * 剪贴板感知 Composable (Multi-History Version)
 * 职责：搜索框聚焦时读取剪贴板文本，维护本地历史队列
 */
export function useClipboard(searchQuery: Ref<string>) {
  const { settings } = useSettings()

  /** 剪贴板历史队列（持久化存储） */
  const history = useStorage<ClipboardItem[]>('chengjing-clipboard-history', [])

  /** 最近一次读取的时间戳（内存变量） */
  let lastReadTime = 0

  /**
   * 读取剪贴板文本并追加到历史
   */
  async function readClipboard() {
    // 功能关闭
    if (!settings.searchClipboardAware) return

    // 冷却期内，不重复读取（除非历史为空）
    const now = Date.now()
    if (now - lastReadTime < READ_COOLDOWN && history.value.length > 0) return
    lastReadTime = now

    try {
      const text = await navigator.clipboard.readText()
      const trimmed = text?.trim() ?? ''

      // 过滤：空白、与当前搜索词相同
      if (!trimmed || trimmed === searchQuery.value.trim()) return

      // 截断超长内容
      const processedText = trimmed.length > MAX_CLIPBOARD_LENGTH
        ? trimmed.slice(0, MAX_CLIPBOARD_LENGTH)
        : trimmed

      // 如果与最新一条历史记录相同，则不重复记录
      if (history.value.length > 0 && history.value[0].text === processedText) return

      // 如果历史中已存在该内容（非首条），将其移动到队首
      const existingIndex = history.value.findIndex(item => item.text === processedText)
      if (existingIndex > -1) {
        history.value.splice(existingIndex, 1)
      }

      // 插入新记录
      history.value.unshift({
        text: processedText,
        isUrl: isLikelyUrl(processedText),
        timestamp: Date.now(),
      })

      // 限制历史数量（根据设置，最小保留 1 条）
      const limit = Math.max(1, settings.searchClipboardHistoryCount || 1)
      if (history.value.length > limit) {
        history.value = history.value.slice(0, limit)
      }

    } catch {
      // 权限拒绝或静默失败
    }
  }

  /**
   * 移除历史条目（用户手动删除或选中后清除）
   * @param text 要移除的文本（可选，不传则移除第一条）
   */
  function removeClipboardItem(text?: string) {
    if (!text) {
      // 移除第一条
      history.value.shift()
    } else {
      const index = history.value.findIndex(item => item.text === text)
      if (index > -1) {
        history.value.splice(index, 1)
      }
    }
  }

  /** 清空所有历史 */
  function clearClipboard() {
    history.value = []
  }

  // 监听设置变更，自动裁剪历史
  watch(() => settings.searchClipboardHistoryCount, (newLimit) => {
    const limit = Math.max(1, newLimit || 1)
    if (history.value.length > limit) {
      history.value = history.value.slice(0, limit)
    }
  })

  return {
    clipboardHistory: history,
    readClipboard,
    removeClipboardItem,
    clearClipboard,
  }
}
