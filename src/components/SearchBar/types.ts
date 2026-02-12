/** 搜索引擎定义 */
export interface Engine {
  id: string
  name: string
  /** 搜索 URL 模板，使用 %s 作为查询占位符，或末尾直接拼接 */
  url: string
  /** tabler icon 名称（如 'IconBrandGoogle'），自定义引擎使用 'IconWorld' */
  icon: string
  /** 标记内置引擎 */
  builtin?: boolean
  /** 分组标识 */
  group?: string
  /** Bang 快捷前缀（如 '!g'），输入 '!g vue3' 可快速切换引擎并搜索 */
  bang?: string
}

// ==================== 搜索建议 ====================

/** 搜索历史条目（含频率统计） */
export interface HistoryEntry {
  query: string
  /** 累计搜索次数 */
  count: number
  /** 最后使用时间戳 */
  lastUsed: number
  /** 最后使用的引擎 ID */
  engineId?: string
}

/** 建议条目来源 */
export type SuggestionSource = 'history' | 'suggestion' | 'bang' | 'clipboard'

/** 联想建议数据源 */
export type SuggestionProviderId = 'google' | 'baidu' | 'bing' | 'off'

/** 统一的建议条目 */
export interface SuggestionItem {
  text: string
  source: SuggestionSource
  /** 搜索次数（仅历史条目） */
  count?: number
  /** 图标名称（仅 bang 条目） */
  icon?: string
  /** Bang 命令（仅 bang 条目，如 '!g'） */
  bang?: string
}

/** 搜索建议 Provider 接口 */
export interface SuggestionProvider {
  id: SuggestionProviderId
  name: string
  fetch(query: string, signal: AbortSignal): Promise<string[]>
}

