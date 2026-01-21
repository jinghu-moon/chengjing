/// <reference lib="webworker" />

// src/components/BookmarkPanel/workers/search.worker.ts

// ============================================
// Type Definitions
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

// Worker Message Types (shared with main thread ideally)
export type WorkerInMessage =
  | { type: 'INIT'; payload: { ids: string[]; titles: string[]; urls: string[]; dates: number[] } }
  | { type: 'SEARCH'; payload: { query: string; id: number } }

export type WorkerOutMessage =
  | { type: 'READY'; count: number }
  | { type: 'RESULT'; results: string[]; id: number }

// ============================================
// Worker State
// ============================================

let searchCache: string[] = []
let idCache: string[] = []

// Intl.Segmenter (Safari 14.1+, Chrome 87+, Firefox 125+)
const segmenter = TypedIntl.Segmenter
  ? new TypedIntl.Segmenter('zh', { granularity: 'word' })
  : null

// ============================================
// Message Handler
// ============================================

self.onmessage = (e: MessageEvent<WorkerInMessage>) => {
  const { type, payload } = e.data

  // 🔄 INIT
  if (type === 'INIT') {
    const { ids, titles, urls, dates } = payload
    const total = ids.length

    // 1. Generate index array
    const indices = new Uint32Array(total)
    for (let i = 0; i < total; i++) indices[i] = i

    // 2. Sort indices by date (descending)
    const datesArr = new Float64Array(dates)
    indices.sort((a, b) => datesArr[b] - datesArr[a])

    // 3. Build sorted cache
    searchCache = new Array(total)
    idCache = new Array(total)

    for (let i = 0; i < total; i++) {
      const idx = indices[i]
      // Using \uFFFF as separator (safer than \u0000)
      searchCache[i] = ((titles[idx] || '') + '\uFFFF' + (urls[idx] || '')).toLowerCase()
      idCache[i] = ids[idx]
    }

    const msg: WorkerOutMessage = { type: 'READY', count: total }
    self.postMessage(msg)
  }

  // 🔍 SEARCH
  if (type === 'SEARCH') {
    const { query: rawQuery, id } = payload
    const query = (rawQuery || '').trim().toLowerCase()

    if (!query) {
      const msg: WorkerOutMessage = { type: 'RESULT', results: [], id }
      self.postMessage(msg)
      return
    }

    // Tokenize
    let tokens: string[] = []
    if (segmenter) {
      tokens = Array.from(segmenter.segment(query))
        .map(x => x.segment)
        .filter((s: string) => s.trim().length > 0)
    } else {
      // Bigram fallback for CJK
      const parts = query.split(/\s+/)
      for (const part of parts) {
        if (part.length < 2) {
          tokens.push(part)
          continue
        }
        const isASCII = /^[\x00-\x7F]*$/.test(part)
        if (isASCII) {
          tokens.push(part)
        } else {
          for (let i = 0; i < part.length - 1; i++) {
            tokens.push(part.slice(i, i + 2))
          }
        }
      }
      tokens = [...new Set(tokens)]
    }

    // Fail-Fast: sort by length descending
    tokens.sort((a, b) => b.length - a.length)

    const results: string[] = []
    const MAX_RESULTS = 100
    const total = searchCache.length

    for (let i = 0; i < total; i++) {
      const target = searchCache[i]
      let isMatch = true

      for (let j = 0; j < tokens.length; j++) {
        if (!target.includes(tokens[j])) {
          isMatch = false
          break
        }
      }

      if (isMatch) {
        results.push(idCache[i])
        if (results.length >= MAX_RESULTS) break
      }
    }

    const msg: WorkerOutMessage = { type: 'RESULT', results, id }
    self.postMessage(msg)
  }
}
