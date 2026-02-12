import type { SuggestionProvider } from '../types'

const isDev = import.meta.env.DEV

/** Google 搜索建议 Provider */
export const googleProvider: SuggestionProvider = {
  id: 'google',
  name: 'Google',

  async fetch(query: string, signal: AbortSignal): Promise<string[]> {
    const q = encodeURIComponent(query)
    const url = isDev
      ? `/__suggest/google/complete/search?client=chrome&q=${q}`
      : `https://suggestqueries.google.com/complete/search?client=chrome&q=${q}`

    const res = await fetch(url, { signal })
    const data = await res.json()

    // 响应格式: [query, [suggestions...]]
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return data[1].slice(0, 8)
    }
    return []
  },
}
