/**
 * src/composables/useAsyncWordCount.ts
 * 异步字数统计 Hook (Vue 3)
 *
 * 功能：
 * 1. 使用统一的 debounce 工具，避免阻塞 UI 线程。
 * 2. 自动处理富文本 (TipTap HTML) 的标签清洗。
 * 3. 响应式返回统计结果和 loading 状态。
 */

import { ref, watch, onUnmounted, type Ref } from 'vue'
import { getWordCount, type WordCountResult } from '../utils/wordCount'
import { debounce } from '../utils/debounce'

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 高效清洗 HTML 标签，获取纯文本
 * 利用浏览器 DOM 引擎，比正则更准确且安全
 */
function stripHtml(html: string): string {
  if (!html) return ''

  // 快速路径：如果不含尖括号，直接返回
  if (html.indexOf('<') === -1) return html

  // 创建临时 DOM 元素提取文本
  const tmp = document.createElement('div')
  tmp.innerHTML = html

  // textContent 性能优于 innerText，且不会触发回流 (Reflow)
  return tmp.textContent || ''
}

// ============================================================================
// Main Composable
// ============================================================================

/**
 * @param contentSource - 响应式的文本内容 (可能是 HTML 或 纯文本)
 * @param isRichText - 响应式的布尔值，指示当前内容是否为富文本
 * @param delay - 防抖延迟，默认 300ms
 */
export function useAsyncWordCount(
  contentSource: Ref<string | undefined>,
  isRichText: Ref<boolean>,
  delay: number = 300
) {
  // 核心统计结果 (total)
  const total = ref(0)

  // 完整统计结果 (如果UI需要展示详细信息，可以使用这个)
  const fullStats = ref<WordCountResult | null>(null)

  // 计算状态 (UI 可据此显示 "计算中..." 或 loading 动画)
  const isCalculating = ref(false)

  // 使用统一的 debounce 工具函数
  const debouncedCount = debounce((text: string | undefined, isRich: boolean) => {
    if (!text) {
      total.value = 0
      fullStats.value = getWordCount('')
    } else {
      // 如果是富文本模式，先剥离 HTML 标签
      const plainText = isRich ? stripHtml(text) : text
      const result = getWordCount(plainText)
      total.value = result.total
      fullStats.value = result
    }
    isCalculating.value = false
  }, delay)

  // 监听数据源变化
  watch(
    [contentSource, isRichText] as const,
    ([newContent, newIsRich]) => {
      isCalculating.value = true
      debouncedCount(newContent, newIsRich)
    },
    { immediate: true }
  )

  // 组件卸载时清理定时器
  onUnmounted(() => {
    debouncedCount.cancel()
  })

  return {
    total, // 简化的总数 (常用)
    fullStats, // 完整的统计对象 (如需展示段落数、字符数等)
    isCalculating, // 计算状态
  }
}
