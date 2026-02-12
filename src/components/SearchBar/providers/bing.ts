import type { SuggestionProvider } from '../types'

const isDev = import.meta.env.DEV

/** Bing 搜索建议 Provider */
export const bingProvider: SuggestionProvider = {
  id: 'bing',
  name: 'Bing',

  async fetch(query: string, signal: AbortSignal): Promise<string[]> {
    const q = encodeURIComponent(query)
    const url = isDev
      ? `/__suggest/bing/osjson.aspx?query=${q}`
      : `https://api.bing.com/osjson.aspx?query=${q}`

    const res = await fetch(url, { signal })
    const data = await res.json()

    // OpenSearch JSON 格式: [query, [suggestions...]]
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return data[1].slice(0, 8)
    }
    return []
  },
}
