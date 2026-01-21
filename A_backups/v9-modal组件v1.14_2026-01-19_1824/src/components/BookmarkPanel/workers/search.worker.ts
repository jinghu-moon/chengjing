/// <reference lib="webworker" />

import { getPinyinFirstLetters } from '../../../utils/pinyin'

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
      payload: { ids: string[]; titles: string[]; urls: string[]; dates: Float64Array }
    }
  | { type: 'SEARCH'; payload: { query: string; id: number } }

export type WorkerOutMessage =
  | { type: 'READY'; count: number }
  | { type: 'RESULT'; results: string[]; id: number }

// ============================================
// Worker 状态 (SoA Cache)
// ============================================

let searchCache: string[] = [] // Title + URL (全量字符串，用于兜底过滤)
let pinyinCache: string[] = [] // [New] 拼音首字母缓存
let idCache: string[] = [] // ID 映射
let titleCache: string[] = [] // [New] 小写标题 (用于精准打分)
let urlCache: string[] = [] // [New] 小写 URL (用于精准打分)

// Intl.Segmenter (中文分词器)
const segmenter = TypedIntl.Segmenter
  ? new TypedIntl.Segmenter('zh', { granularity: 'word' })
  : null

// ============================================
// 消息处理
// ============================================

self.onmessage = (e: MessageEvent<WorkerInMessage>) => {
  const { type, payload } = e.data

  // 🔄 INIT: 构建缓存 (空间换时间)
  if (type === 'INIT') {
    const { ids, titles, urls, dates } = payload
    const total = ids.length

    // 1. 分配内存
    searchCache = new Array(total)
    pinyinCache = new Array(total)
    idCache = new Array(total)
    titleCache = new Array(total)
    urlCache = new Array(total)

    // 2. 排序逻辑 (按时间倒序预处理 indices)
    // 这样默认返回的结果就是按时间排好的
    const indices = new Uint32Array(total)
    for (let i = 0; i < total; i++) indices[i] = i
    // @ts-ignore Float64Array indexing
    const datesArr = new Float64Array(dates)
    indices.sort((a, b) => datesArr[b] - datesArr[a])

    // 3. 填充缓存
    for (let i = 0; i < total; i++) {
      const idx = indices[i] // 使用排序后的索引
      const t = titles[idx] || ''
      const u = urls[idx] || ''

      idCache[i] = ids[idx]
      titleCache[i] = t.toLowerCase()
      urlCache[i] = u.toLowerCase()

      // 原始缓存 (用于快速过滤兜底)
      searchCache[i] = (t + '\uFFFF' + u).toLowerCase()

      // [关键] 生成拼音缓存
      // 由于有 VIP_MAP，这一步非常快
      pinyinCache[i] = getPinyinFirstLetters(t)
    }

    self.postMessage({ type: 'READY', count: total })
  }

  // 🔍 SEARCH: 执行搜索 (智能打分)
  if (type === 'SEARCH') {
    const { query: rawQuery, id } = payload
    const query = (rawQuery || '').trim().toLowerCase()

    if (!query) {
      self.postMessage({ type: 'RESULT', results: [], id })
      return
    }

    // 1. 预处理
    // 判断是否为纯字母 (只有纯字母才启用拼音搜索)
    const isAscii = /^[a-z0-9\s]+$/i.test(query)

    // 智能分词 (用于兜底匹配)
    let tokens: string[] = []
    if (segmenter) {
      tokens = Array.from(segmenter.segment(query))
        .map(x => x.segment.toLowerCase())
        .filter(s => s.trim().length > 0)
    } else {
      // 降级分词
      tokens = query.split(/[\s\-_.]+/).filter(Boolean)
    }

    const scoredResults: { id: string; score: number }[] = []
    const total = searchCache.length

    // 2. 线性扫描与打分
    for (let i = 0; i < total; i++) {
      let score = 0
      const title = titleCache[i]
      const url = urlCache[i]
      const pinyin = pinyinCache[i]

      // --- 核心打分逻辑 ---

      // A. 标题匹配 (权重最高)
      if (title === query) {
        score += 100 // 完美匹配
      } else if (title.startsWith(query)) {
        score += 80 // 前缀匹配
      } else if (title.includes(query)) {
        score += 60 // 包含匹配
      }

      // B. URL 匹配
      if (url.includes(query)) {
        score += 30
        // 如果是域名匹配 (如 baidu.com 搜 baidu) 额外加分
        if (url.startsWith(query) || url.includes(`://${query}`)) {
          score += 20
        }
      }

      // C. 拼音匹配 (仅限 ASCII 输入)
      if (isAscii && pinyin) {
        if (pinyin === query) {
          score += 50 // 拼音全匹配 (jd -> 京东)
        } else if (pinyin.startsWith(query)) {
          score += 30 // 拼音前缀 (j -> 京东)
        } else if (pinyin.includes(query)) {
          score += 10 // 拼音包含
        }
      }

      // D. 多词/分词匹配 (兜底)
      // 如果还没得分，尝试检查分词是否全部命中 (例如 "vue router" 匹配 "Vue.js Router")
      if (score === 0 && tokens.length > 1) {
        const target = searchCache[i] // 全文
        const allMatch = tokens.every(token => target.includes(token))
        if (allMatch) {
          score += 10 // 给予最低分让其显示
        }
      }

      if (score > 0) {
        scoredResults.push({ id: idCache[i], score })
      }
    }

    // 3. 排序与返回
    // 分数降序 -> 原始顺序(时间倒序)
    scoredResults.sort((a, b) => b.score - a.score)

    // 截取前 100 条，减少 IPC 传输压力
    const finalIds = scoredResults.slice(0, 100).map(r => r.id)

    self.postMessage({ type: 'RESULT', results: finalIds, id })
  }
}
