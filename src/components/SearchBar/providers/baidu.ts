import type { SuggestionProvider } from '../types'

const isDev = import.meta.env.DEV

/**
 * 百度搜索建议 Provider
 * 开发环境：Vite proxy 代理
 * 生产环境：background SW 代理（百度 API 返回 JSONP，CSP 下需中转）
 */
export const baiduProvider: SuggestionProvider = {
  id: 'baidu',
  name: '百度',

  async fetch(query: string, signal: AbortSignal): Promise<string[]> {
    const q = encodeURIComponent(query)
    const params = `wd=${q}&action=opensearch`

    let data: unknown

    if (isDev) {
      // 开发环境：Vite proxy
      const res = await fetch(`/__suggest/baidu/su?${params}`, { signal })
      data = await res.json()
    } else {
      // 生产环境：background SW 代理
      const url = `https://suggestion.baidu.com/su?${params}`
      data = await chrome.runtime.sendMessage({ type: 'FETCH_SUGGESTION', url })
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    }

    // OpenSearch JSON 格式: [query, [suggestions...]]
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return data[1].slice(0, 8)
    }
    return []
  },
}
