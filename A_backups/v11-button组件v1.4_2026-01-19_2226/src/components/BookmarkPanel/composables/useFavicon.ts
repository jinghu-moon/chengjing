import { computed, type Ref } from 'vue'

/**
 * Generates favicon URL with multi-source fallback strategy
 * Priority: Google Favicon API > Direct favicon.ico > Letter avatar
 */

const GOOGLE_FAVICON_API = 'https://www.google.com/s2/favicons'

export interface FaviconOptions {
  size?: 16 | 32 | 64 | 128
  fallbackColors?: string[]
}

const DEFAULT_COLORS = [
  '#5E81AC',
  '#81A1C1',
  '#88C0D0',
  '#8FBCBB', // Nord blues
  '#A3BE8C',
  '#EBCB8B',
  '#D08770',
  '#BF616A', // Nord accents
]

/**
 * Get favicon URL from Google API
 */
export function getGoogleFaviconUrl(url: string, size: number = 64): string {
  try {
    const domain = new URL(url).hostname
    return `${GOOGLE_FAVICON_API}?domain=${domain}&sz=${size}`
  } catch {
    return ''
  }
}

/**
 * Generate letter avatar as fallback
 */
export function getLetterAvatar(
  title: string,
  colors: string[] = DEFAULT_COLORS
): { letter: string; color: string } {
  const letter = title.trim().charAt(0).toUpperCase() || '?'
  // Deterministic color based on title hash
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const color = colors[hash % colors.length]
  return { letter, color }
}

/**
 * Composable for favicon handling
 */
export function useFavicon(url: Ref<string>, title: Ref<string>, options: FaviconOptions = {}) {
  const { size = 64, fallbackColors = DEFAULT_COLORS } = options

  const faviconUrl = computed(() => getGoogleFaviconUrl(url.value, size))

  const letterAvatar = computed(() => getLetterAvatar(title.value, fallbackColors))

  return {
    faviconUrl,
    letterAvatar,
  }
}

export default useFavicon
