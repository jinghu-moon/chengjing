import { computed, type Ref } from 'vue'
import type { Engine } from '../types'
import { useSettings } from '../../../composables/useSettings'

// ==================== URL 检测 ====================

const URL_PATTERN = /^(https?:\/\/|www\.)/i
const DOMAIN_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+([\/?#].*)?$/

/** 判断输入是否为 URL */
export function isLikelyUrl(input: string): boolean {
  return URL_PATTERN.test(input) || DOMAIN_PATTERN.test(input)
}

/** URL 标准化：补全 https:// 前缀 */
export function normalizeUrl(input: string): string {
  if (/^https?:\/\//i.test(input)) return input
  return `https://${input}`
}

// ==================== 标点符号中英文映射表 ====================

/** 中文→英文标点映射（完整对应表） */
const PUNCT_EQUIV_MAP: Record<string, string> = {
  // 形式与功能基本对应的标点
  '。': '.', '，': ',', '？': '?', '！': '!',
  '：': ':', '；': ';',
  '（': '(', '）': ')',
  '【': '[', '】': ']', '［': '[', '］': ']',
  '｛': '{', '｝': '}',
  '\u201c': '"', '\u201d': '"',   // "" 中文双引号
  '\u2018': "'", '\u2019': "'",   // '' 中文单引号

  // 全角 ASCII 标点（键盘直接输入的全角字符）
  '＠': '@', '＃': '#', '＄': '$', '％': '%',
  '＆': '&', '＊': '*', '＋': '+', '－': '-',
  '＝': '=', '／': '/', '＼': '\\', '～': '~',
  '＜': '<', '＞': '>', '｜': '|',
  '＇': "'", '＂': '"',

  // 中文特有标点 → 最接近的英文表示
  '《': '<', '》': '>',
  '、': ',',
}

/**
 * 将输入中的中文标点转换为对应的英文标点
 * 仅转换前缀部分（第一个空格之前），避免影响搜索词
 */
function normalizePunctuation(input: string): string {
  const spaceIdx = input.indexOf(' ')
  const prefix = spaceIdx >= 0 ? input.slice(0, spaceIdx) : input
  const rest = spaceIdx >= 0 ? input.slice(spaceIdx) : ''

  let normalized = ''
  for (const ch of prefix) {
    normalized += PUNCT_EQUIV_MAP[ch] ?? ch
  }
  return normalized + rest
}

// ==================== Bang 解析 ====================

/** 解析结果类型 */
export interface BangResult {
  engine: Engine
  query: string
}

export interface MultiBangResult {
  engines: Engine[]
  query: string
}

export interface ActiveBang {
  bang: string
  rest: string
  engineName: string
}

/**
 * 根据前缀字符构建 Bang 匹配正则
 * 需要转义正则特殊字符
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildBangPatterns(prefix: string) {
  const p = escapeRegExp(prefix)
  return {
    bang: new RegExp(`^(${p}[\\w]+)\\s+(.+)$`),
    multiBang: new RegExp(`^((?:${p}[\\w]+\\+)+${p}[\\w]+)\\s+(.+)$`),
    bangPrefix: new RegExp(`^((?:${p}[\\w]+\\+)*${p}[\\w]+)(\\s.*)?$`),
  }
}

/**
 * Bang 解析和 URL 检测 Composable
 * 职责：解析 Bang 语法、检测 URL、提供实时 bang 高亮状态、Bang 提示列表
 */
export function useBangParser(
  searchQuery: Ref<string>,
  findEngineByBang: (bang: string) => Engine | undefined,
  engines?: Ref<Engine[]>,
) {
  const { settings } = useSettings()

  /** 根据当前设置的前缀构建正则（响应式） */
  const patterns = computed(() => buildBangPatterns(settings.searchBangPrefix || '!'))

  /** 预处理输入：中英文标点等价转换 */
  function preprocess(input: string): string {
    if (settings.searchBangSymbolEquiv) {
      return normalizePunctuation(input)
    }
    return input
  }

  /** 解析单 Bang 语法（如 !g vue3） */
  function parseBang(input: string): BangResult | null {
    const processed = preprocess(input)
    const match = processed.match(patterns.value.bang)
    if (!match) return null
    const engine = findEngineByBang(match[1])
    if (!engine) return null
    return { engine, query: match[2] }
  }

  /** 解析多 Bang 语法（如 !g+!bd vue3） */
  function parseMultiBang(input: string): MultiBangResult | null {
    const processed = preprocess(input)
    const match = processed.match(patterns.value.multiBang)
    if (!match) return null
    const bangs = match[1].split('+')
    const resolved = bangs.map(b => findEngineByBang(b)).filter(Boolean) as Engine[]
    if (resolved.length < 2) return null
    return { engines: resolved, query: match[2] }
  }

  /** 实时检测输入中的 bang 前缀（用于高亮渲染） */
  const activeBang = computed<ActiveBang | null>(() => {
    const val = preprocess(searchQuery.value)
    const m = val.match(patterns.value.bangPrefix)
    if (!m) return null
    const bangStr = m[1]
    // 多 Bang：!g+!bd
    if (bangStr.includes('+')) {
      const bangs = bangStr.split('+')
      const names = bangs.map(b => findEngineByBang(b)?.name).filter(Boolean)
      if (names.length < 2) return null
      return { bang: bangStr, rest: val.slice(bangStr.length), engineName: names.join(' + ') }
    }
    // 单 Bang
    const engine = findEngineByBang(bangStr)
    if (!engine) return null
    return { bang: bangStr, rest: val.slice(bangStr.length), engineName: engine.name }
  })

  /** Bang 提示列表：输入以前缀开头且无空格时，返回匹配的引擎 */
  interface BangHint {
    bang: string
    name: string
    icon: string
  }

  const bangHints = computed<BangHint[]>(() => {
    if (!engines) return []
    const val = preprocess(searchQuery.value.trim())
    const prefix = settings.searchBangPrefix || '!'
    // 必须以前缀开头，且不包含空格（尚未输入搜索词）
    if (!val.startsWith(prefix) || val.includes(' ')) return []
    const lower = val.toLowerCase()
    return engines.value
      .filter(e => e.bang && e.bang.toLowerCase().startsWith(lower))
      .map(e => ({ bang: e.bang!, name: e.name, icon: e.icon }))
  })

  return {
    isLikelyUrl,
    normalizeUrl,
    parseBang,
    parseMultiBang,
    activeBang,
    bangHints,
  }
}
