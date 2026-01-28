/// <reference lib="webworker" />

import { getPinyinFirstLetters } from '@/utils/pinyin'

// ============================================
// 类型定义
// ============================================

interface SegmentData {
  segment: string
  index: number
  input: string
}
interface Segmenter {
  segment(input: string): Iterable<SegmentData>
}
type IntlWithSegmenter = typeof globalThis.Intl & {
  Segmenter?: new (
    locale: string,
    options?: { granularity: 'grapheme' | 'word' | 'sentence' }
  ) => Segmenter
}
const TypedIntl = globalThis.Intl as IntlWithSegmenter

export type WorkerInMessage =
  | {
      type: 'INIT'
      payload: { 
        ids: string[]
        contents: string[]
        authors: string[]
        titles: string[]
        dynasties: string[]
      }
    }
  | { type: 'SEARCH'; payload: { query: string; id: number } }

export type WorkerOutMessage =
  | { type: 'READY'; count: number }
  | { type: 'RESULT'; results: string[]; id: number }

// ============================================
// Worker 状态 (SoA Cache)
// ============================================

let searchCache: string[] = [] // 全文缓存
let idCache: string[] = [] 
let contentCache: string[] = []
let authorCache: string[] = []
let titleCache: string[] = []
let authorPinyinCache: string[] = [] // 作者拼音
let titlePinyinCache: string[] = [] // 标题拼音

// Intl.Segmenter (中文分词器)
const segmenter = TypedIntl.Segmenter
  ? new TypedIntl.Segmenter('zh', { granularity: 'word' })
  : null

// ============================================
// 消息处理
// ============================================

self.onmessage = (e: MessageEvent<WorkerInMessage>) => {
  const { type, payload } = e.data

  // 🔄 INIT: 构建缓存
  if (type === 'INIT') {
    const { ids, contents, authors, titles, dynasties } = payload
    const total = ids.length

    // 1. 分配内存
    searchCache = new Array(total)
    idCache = new Array(total)
    contentCache = new Array(total)
    authorCache = new Array(total)
    titleCache = new Array(total)
    authorPinyinCache = new Array(total)
    titlePinyinCache = new Array(total)

    // 2. 填充缓存 (诗词通常不需要按时间特殊排序，或者保持默认顺序)
    for (let i = 0; i < total; i++) {
      const content = contents[i] || ''
      const author = authors[i] || ''
      const title = titles[i] || ''
      const dynasty = dynasties[i] || ''

      // 优化：中文数据无需转小写(toLowerCase)，减少内存开销和初始化时间
      // 仅在搜索时将 query 转小写以匹配拼音输入
      idCache[i] = ids[i]
      contentCache[i] = content
      authorCache[i] = author
      titleCache[i] = title

      // 原始缓存 (用于快速过滤兜底)
      searchCache[i] = content + '\uFFFF' + author + '\uFFFF' + title + '\uFFFF' + dynasty

      // 生成拼音缓存
      authorPinyinCache[i] = getPinyinFirstLetters(author)
      titlePinyinCache[i] = getPinyinFirstLetters(title)
    }

    self.postMessage({ type: 'READY', count: total })
  }

  // 🔍 SEARCH: 执行搜索
  if (type === 'SEARCH') {
    const { query: rawQuery, id } = payload
    const query = (rawQuery || '').trim().toLowerCase()

    if (!query) {
      self.postMessage({ type: 'RESULT', results: [], id })
      return
    }

    // 1. 预处理
    const isAscii = /^[a-z0-9\s]+$/i.test(query)

    let tokens: string[] = []
    if (segmenter) {
      tokens = Array.from(segmenter.segment(query))
        .map(x => x.segment.toLowerCase())
        .filter(s => s.trim().length > 0)
    } else {
      tokens = query.split(/[\s\-_.]+/).filter(Boolean)
    }

    const scoredResults: { id: string; score: number }[] = []
    const total = searchCache.length

    // 2. 线性扫描与打分
    for (let i = 0; i < total; i++) {
      let score = 0
      const content = contentCache[i]
      const author = authorCache[i]
      const title = titleCache[i]
      const authorPinyin = authorPinyinCache[i]
      const titlePinyin = titlePinyinCache[i]

      // --- 核心打分逻辑 ---

      // A. 作者匹配
      if (author === query) score += 90
      else if (author.includes(query)) score += 60

      // B. 标题匹配
      if (title === query) score += 80
      else if (title.includes(query)) score += 50

      // C. 内容匹配
      if (content.includes(query)) score += 40

      // D. 拼音匹配 (仅限 ASCII)
      if (isAscii) {
        if (authorPinyin === query) score += 70
        else if (authorPinyin && authorPinyin.includes(query)) score += 30
        
        if (titlePinyin === query) score += 60
        else if (titlePinyin && titlePinyin.includes(query)) score += 20
      }

      // E. 全文/分词匹配 (兜底)
      if (score === 0) {
        if (tokens.length > 1) {
          // 全部 token 都必须出现在搜索缓存中
          const allMatch = tokens.every(token => searchCache[i].includes(token))
          if (allMatch) score += 15
        } else if (searchCache[i].includes(query)) {
          score += 10
        }
      }

      if (score > 0) {
        scoredResults.push({ id: idCache[i], score })
      }
    }

    // 3. 排序与返回
    scoredResults.sort((a, b) => b.score - a.score)

    // 截取前 100 条
    const finalIds = scoredResults.slice(0, 100).map(r => r.id)

    self.postMessage({ type: 'RESULT', results: finalIds, id })
  }
}
