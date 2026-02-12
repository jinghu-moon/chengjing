import { ref, computed, triggerRef } from 'vue'
import { getPinyinFirstLetters } from '../../../utils/pinyin'
import type { HistoryEntry } from '../types'

const STORAGE_KEY = 'lime-search-history-v2'
const LEGACY_KEY = 'lime-search-history'
const MAX_HISTORY = 30
const GRAVITY = 1.5
const OFFSET = 2

// ==================== 评分算法 ====================

/**
 * Hacker News Gravity 变体热度评分
 * Score = C / (T + 2)^G
 * @see docs/formula.md
 */
function calculateScore(entry: HistoryEntry): number {
  const hoursSince = (Date.now() - entry.lastUsed) / 3_600_000
  const timeComponent = Math.max(0, hoursSince) + OFFSET
  return entry.count / Math.pow(timeComponent, GRAVITY)
}

/** 按热度降序排列 */
function sortByScore(entries: HistoryEntry[]): HistoryEntry[] {
  return [...entries].sort((a, b) => calculateScore(b) - calculateScore(a))
}

// ==================== 持久化与迁移 ====================

function loadEntries(): HistoryEntry[] {
  try {
    // 优先读取 v2 格式
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }

    // 回退：迁移旧 string[] 格式
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const oldList = JSON.parse(legacy)
      if (Array.isArray(oldList) && typeof oldList[0] === 'string') {
        const migrated = (oldList as string[]).map((query, i) => ({
          query,
          count: 1,
          lastUsed: Date.now() - i * 60_000,
        }))
        // 持久化新格式并清理旧键
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
        localStorage.removeItem(LEGACY_KEY)
        return migrated
      }
    }
  } catch { /* 静默降级 */ }
  return []
}

function persistEntries(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

// ==================== 拼音搜索打分 ====================

/** 拼音首字母缓存 Map (query → pinyin) */
const pinyinCache = new Map<string, string>()

/** 获取或缓存拼音首字母 */
function getCachedPinyin(text: string): string {
  let py = pinyinCache.get(text)
  if (py === undefined) {
    py = getPinyinFirstLetters(text)
    pinyinCache.set(text, py)
  }
  return py
}

/**
 * 对单条历史记录计算匹配分数
 * 参考 BookmarkPanel search.worker.ts 的打分策略
 */
function matchScore(query: string, entryLower: string, entryPinyin: string): number {
  let score = 0

  // A. 文本匹配（权重最高）
  if (entryLower === query) {
    score += 100 // 完美匹配
  } else if (entryLower.startsWith(query)) {
    score += 80 // 前缀匹配
  } else if (entryLower.includes(query)) {
    score += 60 // 包含匹配
  }

  // B. 拼音匹配（仅 ASCII 输入时启用）
  const isAscii = /^[a-z0-9]+$/.test(query)
  if (isAscii && entryPinyin) {
    if (entryPinyin === query) {
      score = Math.max(score, 50) // 拼音全匹配
    } else if (entryPinyin.startsWith(query)) {
      score = Math.max(score, 40) // 拼音前缀
    } else if (entryPinyin.includes(query)) {
      score = Math.max(score, 20) // 拼音包含
    }
  }

  return score
}

// ==================== 全局单例状态 ====================

const entries = ref<HistoryEntry[]>(loadEntries())

/** 缓存排序结果，仅 entries 变化时重算（消除 sortByScore 重复调用） */
const sortedEntries = computed(() => sortByScore(entries.value))

/**
 * 搜索历史管理 Composable
 * 职责：频率统计、Gravity 热度排序、拼音模糊匹配、localStorage 持久化
 */
export function useSearchHistory() {
  /** 按热度排序后的查询文本列表（向后兼容） */
  const history = computed<string[]>(() =>
    sortedEntries.value.map(e => e.query)
  )

  /** 添加/更新搜索记录 */
  function addHistory(query: string, engineId?: string) {
    const trimmed = query.trim()
    if (!trimmed) return

    const existing = entries.value.find(
      e => e.query.toLowerCase() === trimmed.toLowerCase(),
    )

    if (existing) {
      // 已存在：count++ 并更新时间戳
      existing.count++
      existing.lastUsed = Date.now()
      if (engineId) existing.engineId = engineId
    } else {
      // 新增条目，同时生成拼音缓存
      entries.value.push({
        query: trimmed,
        count: 1,
        lastUsed: Date.now(),
        engineId,
      })
      getCachedPinyin(trimmed)

      // 超过容量：淘汰热度最低的条目
      if (entries.value.length > MAX_HISTORY) {
        triggerRef(entries)
        entries.value = sortedEntries.value.slice(0, MAX_HISTORY)
      }
    }

    persistEntries(entries.value)
  }

  /** 删除单条记录 */
  function removeHistory(query: string) {
    const idx = entries.value.findIndex(e => e.query === query)
    if (idx !== -1) {
      entries.value.splice(idx, 1)
      pinyinCache.delete(query)
      persistEntries(entries.value)
    }
  }

  /** 清空全部记录 */
  function clearHistory() {
    entries.value = []
    pinyinCache.clear()
    persistEntries(entries.value)
  }

  /**
   * 按关键词过滤，返回基于拼音打分 + 热度排序后的查询文本
   * 打分参考 BookmarkPanel search.worker.ts 策略
   */
  function filteredHistory(keyword: string): string[] {
    const k = keyword.trim().toLowerCase()
    if (!k) return history.value

    const scored: { query: string; score: number; heat: number }[] = []

    for (const e of sortedEntries.value) {
      const lower = e.query.toLowerCase()
      const pinyin = getCachedPinyin(e.query)
      const score = matchScore(k, lower, pinyin)
      if (score > 0) {
        scored.push({ query: e.query, score, heat: calculateScore(e) })
      }
    }

    // 先按匹配分数降序，同分再按热度降序
    scored.sort((a, b) => b.score - a.score || b.heat - a.heat)
    return scored.map(s => s.query)
  }

  /** 获取指定查询的搜索次数（用于 UI 徽章） */
  function getEntryCount(query: string): number {
    return entries.value.find(e => e.query === query)?.count ?? 0
  }

  return {
    history,
    addHistory,
    removeHistory,
    clearHistory,
    filteredHistory,
    getEntryCount,
  }
}
