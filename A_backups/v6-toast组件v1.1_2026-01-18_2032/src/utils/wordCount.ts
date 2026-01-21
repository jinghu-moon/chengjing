/**
 * src/utils/wordCount.ts
 * 现代文本字数统计核心模块 (Manifest V3 优化版)
 */

export interface WordCountResult {
  readonly total: number
  readonly cjk: number
  readonly nonCjk: number
  readonly characters: number // 视觉字符数 (不含空白)
  readonly charactersWithSpaces: number // 原始长度 (含空白)
  readonly paragraphs: number
  readonly lines: number // 行数 (连续空行归一)
  readonly details: Readonly<{
    chinese: number
    japanese: number
    korean: number
    latin: number
    digits: number
    punctuation: number
    others: number
  }>
}

// ============================================================================
// 正则与工具初始化
// ============================================================================

// 使用 Intl.Segmenter 计算视觉字符
const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

// 初始化正则常量
const REGEX = (() => {
  const cjkScriptsBlock = String.raw`\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}`
  const cjkMatchPattern = String.raw`\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}`

  return {
    // 分隔符：零宽空格、零宽非连字、BOM
    separators: /[\u200B\u200C\uFEFF]/g,

    // 换行符
    newlines: /(\r\n|\r|\n)/,

    // 核心分词器
    // Group 1: CJK 字符
    // Group 2: Non-CJK 词 (连续匹配)
    tokenizer: new RegExp(`(${cjkMatchPattern})|((?:[^\\s${cjkScriptsBlock}]+))`, 'gu'),

    // 边缘标点清洗
    edgePunct:
      /^[^\p{L}\p{N}\p{Extended_Pictographic}]+|[^\p{L}\p{N}\p{Extended_Pictographic}]+$/gu,

    isCjk: new RegExp(cjkMatchPattern, 'u'),

    // 详细分类正则
    detail: {
      chinese: /\p{Script=Han}/u,
      japanese: /[\p{Script=Hiragana}\p{Script=Katakana}]/u,
      korean: /\p{Script=Hangul}/u,
      latin: /\p{Script=Latin}/u,
      digit: /\p{N}/u,
      punctuation: /\p{P}/u,
    },

    // 非空白字符检测
    nonWhitespace: /[^\s]/,
  }
})()

// ============================================================================
// 主函数
// ============================================================================

export function getWordCount(text: string): WordCountResult {
  if (!text) return createEmptyResult()

  // 1. 原始长度
  const charactersWithSpaces = text.length

  // 2. 预处理
  const processText = text.replace(REGEX.separators, ' ')

  if (!processText.trim()) {
    return { ...createEmptyResult(), charactersWithSpaces }
  }

  // 3. 段落统计
  const paragraphs = processText.split(REGEX.newlines).filter(line => line.trim().length > 0).length

  // 3.5 行数统计（连续空行分别计数，忽略末尾空行）
  const lines = text ? text.replace(/[\r\n]+$/, '').split(/\r\n|\r|\n/).length : 0

  // 4. 视觉字符数统计
  let characters = 0
  // @ts-ignore
  for (const { segment } of graphemeSegmenter.segment(text)) {
    if (REGEX.nonWhitespace.test(segment)) {
      characters++
    }
  }

  // 5. 流式分词与统计
  let cjkCount = 0
  let nonCjkCount = 0

  const details = {
    chinese: 0,
    japanese: 0,
    korean: 0,
    latin: 0,
    digits: 0,
    punctuation: 0,
    others: 0,
  }

  const tokens = processText.matchAll(REGEX.tokenizer)

  for (const match of tokens) {
    const token = match[0]
    const cjkChar = match[1]

    if (cjkChar) {
      cjkCount++
      if (REGEX.detail.chinese.test(token)) details.chinese++
      else if (REGEX.detail.japanese.test(token)) details.japanese++
      else if (REGEX.detail.korean.test(token)) details.korean++
    } else {
      const coreWord = token.replace(REGEX.edgePunct, '')

      if (coreWord.length > 0) {
        nonCjkCount++

        for (const char of coreWord) {
          if (REGEX.detail.latin.test(char)) details.latin++
          else if (REGEX.detail.digit.test(char)) details.digits++
          else if (REGEX.detail.punctuation.test(char)) details.punctuation++
          else details.others++
        }
      }
    }
  }

  // 6. 标点补全
  const totalClassified =
    details.chinese +
    details.japanese +
    details.korean +
    details.latin +
    details.digits +
    details.others

  const nonSpaceChars = processText.replace(/\s/g, '').length
  const remainingPunctuation = Math.max(0, nonSpaceChars - totalClassified)
  details.punctuation += remainingPunctuation

  return {
    total: cjkCount + nonCjkCount,
    cjk: cjkCount,
    nonCjk: nonCjkCount,
    characters,
    charactersWithSpaces,
    paragraphs,
    lines,
    details,
  }
}

function createEmptyResult(): WordCountResult {
  return {
    total: 0,
    cjk: 0,
    nonCjk: 0,
    characters: 0,
    charactersWithSpaces: 0,
    paragraphs: 0,
    lines: 0,
    details: { chinese: 0, japanese: 0, korean: 0, latin: 0, digits: 0, punctuation: 0, others: 0 },
  }
}
