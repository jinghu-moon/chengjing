/**
 * 诗词分享卡片状态管理
 * 核心 Composable，管理卡片的所有配置状态
 */
import { reactive, computed, toRefs } from 'vue'

// 导入本地背景图片
import bg2 from '@/assets/DailyPoemBackgroud/bg2.webp'
import bg3 from '@/assets/DailyPoemBackgroud/bg3.webp'
import bg4 from '@/assets/DailyPoemBackgroud/bg4.webp'
import bg5 from '@/assets/DailyPoemBackgroud/bg5.webp'
import bg6 from '@/assets/DailyPoemBackgroud/bg6.webp'
import bg7 from '@/assets/DailyPoemBackgroud/bg7.webp'

// ============================================
// 类型定义
// ============================================

export type TextAlign = 'left' | 'center' | 'right'
export type FontType = 'song' | 'kai' | 'shufa' | 'hei'

export interface ElementStyle {
  font: FontType
  fontSize: number
  fontWeight: number
  color: string
  strokeWidth: number
  strokeColor: string
  align: TextAlign
  lineHeight: number
  letterSpacing: number
}

export interface ShareCardState {
  // 内容
  poem: string
  author: string
  title: string
  
  // 全局布局
  layout: 'horizontal' | 'vertical'
  size: string
  
  // 独立样式配置
  styles: {
    poem: ElementStyle
    author: ElementStyle
    title: ElementStyle
  }

  // 装饰元素
  // 装饰元素
  dateStyle: string // 'none' | 'combined' | 'gregorian' | 'lunar' | 'chinese' | 'datetime' | 'custom'
  customDate: string

  // 全局效果
  shadow: boolean
  
  // 背景
  bgType: 'image' | 'gradient'
  bgSrc: string
  blur: number
  overlay: number
  vignette: number
  noise: number
  // 导出设置
  exportScale: number
}

// ============================================
// 预设数据
// ============================================

export const SIZE_OPTIONS = [
  { value: '600x900', label: '600×900' },
  { value: '800x1200', label: '800×1200' },
  { value: '1080x1080', label: '1080×1080' },
  { value: '1200x630', label: '1200×630' },
  { value: '750x1334', label: '750×1334' },
]

export const FONT_OPTIONS = [
  { value: 'song', label: '思源宋体' },
  { value: 'kai', label: '霞鹜文楷' },
  { value: 'shufa', label: '马善政书法' },
  { value: 'hei', label: 'HarmonyOS 黑体' },
]

export const ALIGN_OPTIONS = [
  { value: 'left', label: '左对齐' },
  { value: 'center', label: '居中' },
  { value: 'right', label: '右对齐' },
]

// 本地图片背景预设
export const IMAGE_BACKGROUNDS = [
  { src: bg2, label: '背景2' },
  { src: bg3, label: '背景3' },
  { src: bg4, label: '背景4' },
  { src: bg5, label: '背景5' },
  { src: bg6, label: '背景6' },
  { src: bg7, label: '背景7' },
]

// 网格线背景预设
export const GRID_PATTERN_BG = {
  src: 'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,0,0,0.04) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,0,0,0.04) 40px), #fff',
  label: '网格线'
}

// 渐变色预设
export const GRADIENT_BACKGROUNDS = [
  { src: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', label: '紫罗兰' },
  { src: 'linear-gradient(to top, #fdfbfb 0%, #ebedee 100%)', label: '素白' },
  { src: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)', label: '晴空' },
  { src: 'linear-gradient(to top, #fff1eb 0%, #ace0f9 100%)', label: '朝霞' },
  { src: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', label: '银灰' },
  { src: 'linear-gradient(to right, #243949 0%, #517fa4 100%)', label: '深海' },
  { src: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', label: '暖橙' },
  { src: 'linear-gradient(to top, #c1dfc4 0%, #deecdd 100%)', label: '青竹' },
]

export const EXPORT_SCALE_OPTIONS = [
  { value: 1, label: '1x (标准)' },
  { value: 2, label: '2x (高清)' },
  { value: 3, label: '3x (超清)' },
]

// ============================================
// 默认状态
// ============================================

const defaultPoemStyle: ElementStyle = {
  font: 'song',
  fontSize: 56,
  fontWeight: 400,
  color: '#2c1810',
  strokeWidth: 0,
  strokeColor: '#ffffff',
  align: 'center',
  lineHeight: 1.8,
  letterSpacing: 2
}

const defaultAuthorStyle: ElementStyle = {
  font: 'song',
  fontSize: 26,
  fontWeight: 400,
  color: 'rgba(44, 24, 16, 0.75)',
  strokeWidth: 0,
  strokeColor: '#ffffff',
  align: 'center',
  lineHeight: 1.6,
  letterSpacing: 0
}

const defaultTitleStyle: ElementStyle = {
  font: 'song',
  fontSize: 24,
  fontWeight: 400,
  color: 'rgba(44, 24, 16, 0.75)',
  strokeWidth: 0,
  strokeColor: '#ffffff',
  align: 'center',
  lineHeight: 1.6,
  letterSpacing: 0
}

const defaultState: ShareCardState = {
  poem: '',
  author: '',
  title: '',
  layout: 'vertical',
  size: '600x900',
  styles: {
    poem: { ...defaultPoemStyle },
    author: { ...defaultAuthorStyle },
    title: { ...defaultTitleStyle }
  },
  dateStyle: 'combined',
  customDate: '',
  shadow: true,
  bgType: 'image',
  bgSrc: bg2,
  blur: 0,
  overlay: 20,
  vignette: 30,
  noise: 12,
  exportScale: 2
}

// ============================================
// Composable
// ============================================

// 使用模块级变量实现单例状态
const state = reactive<ShareCardState>(JSON.parse(JSON.stringify(defaultState)))

export function useShareCard() {
  /** 重置为默认值 */
  const reset = () => {
    // 深度重置
    state.layout = defaultState.layout
    state.size = defaultState.size
    state.styles.poem = { ...defaultPoemStyle }
    state.styles.author = { ...defaultAuthorStyle }
    state.styles.title = { ...defaultTitleStyle }
    state.shadow = defaultState.shadow
    state.bgType = defaultState.bgType
    state.bgSrc = defaultState.bgSrc
    state.blur = defaultState.blur
    state.overlay = defaultState.overlay
    state.vignette = defaultState.vignette
    state.noise = defaultState.noise
    state.dateStyle = 'combined'
    state.customDate = ''
    state.exportScale = defaultState.exportScale
  }

  /** 初始化诗词内容 */
  const init = (poem: string, author: string, title?: string) => {
    state.poem = poem
    state.author = author
    state.title = title ? `《${title}》` : ''
  }

  /** 计算属性：画布尺寸 */
  const canvasSize = computed(() => {
    const [w, h] = state.size.split('x').map(Number)
    return { width: w, height: h }
  })

  /** 获取字体 CSS 变量 */
  const getFontFamily = (font: FontType) => {
    const map: Record<string, string> = {
      song: "'Noto Serif SC', serif",
      kai: "'LXGW WenKai Screen', cursive",
      shufa: "'Ma Shan Zheng', cursive",
      hei: "'HarmonyOS Sans SC', sans-serif"
    }
    return map[font] || map.song
  }

  /** 设置背景 */
  const setBackground = (type: 'image' | 'gradient', src: string) => {
    state.bgType = type
    state.bgSrc = src
  }

  return {
    state,
    ...toRefs(state),
    reset,
    init,
    canvasSize,
    getFontFamily,
    setBackground
  }
}
