import { ref, watch } from 'vue'

// 存储键名
const STORAGE_KEY = 'lime-theme'

// 模块级单例状态
const isDark = ref(true)
let isInitialized = false

/**
 * 获取初始主题
 * 优先级：localStorage > 系统偏好 > 默认暗色
 */
function resolveInitialTheme(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) {
    return stored === 'dark'
  }
  // 跟随系统偏好
  return !window.matchMedia('(prefers-color-scheme: light)').matches
}

/**
 * 将主题状态同步到 DOM
 * 暗色 = 无类名（:root 默认），亮色 = html.light
 */
function applyTheme(dark: boolean): void {
  const el = document.documentElement
  el.classList.toggle('light', !dark)
  // 声明 color-scheme，让浏览器原生控件（滚动条、表单）自动适配
  el.style.colorScheme = dark ? 'dark' : 'light'
}

/**
 * 初始化主题系统
 * 仅在首次调用 useTheme() 时执行
 */
function init(): void {
  if (isInitialized) return
  isInitialized = true

  // 解析初始主题并应用
  isDark.value = resolveInitialTheme()
  applyTheme(isDark.value)

  // 监听响应式变化 → 同步 DOM + 持久化
  watch(isDark, (dark) => {
    applyTheme(dark)
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  })

  // 监听系统主题变化（仅在用户未手动设置时跟随）
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    // 如果用户已手动选择过主题，不跟随系统变化
    if (localStorage.getItem(STORAGE_KEY) !== null) return
    isDark.value = e.matches
  })
}

/**
 * 主题管理 Composable
 *
 * @example
 * ```vue
 * const { isDark, toggleTheme } = useTheme()
 * ```
 */
export function useTheme() {
  init()

  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  return {
    /** 当前是否为暗色模式 */
    isDark,
    /** 切换深浅主题 */
    toggleTheme,
  }
}
