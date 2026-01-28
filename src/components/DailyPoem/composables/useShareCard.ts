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

export interface ShareCardState {
  // 内容
  poem: string
  author: string
  title: string
  // 全局布局
  layout: 'horizontal' | 'vertical'
  size: string
  // 诗词布局
  poemAlign: TextAlign
  // 作者布局
  authorAlign: TextAlign
  // 标题布局  
  titleAlign: TextAlign
  // 字体
  font: 'song' | 'kai' | 'shufa' | 'hei'
  color: string
  fontSize: number
  strokeWidth: number
  strokeColor: string
  shadow: boolean
  // 背景
  bgType: 'image' | 'gradient'
  bgSrc: string
  blur: number
  overlay: number
  vignette: number
  noise: number
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

// ============================================
// 默认状态
// ============================================

const defaultState: ShareCardState = {
  poem: '',
  author: '',
  title: '',
  layout: 'vertical',
  size: '600x900',
  poemAlign: 'center',
  authorAlign: 'center',
  titleAlign: 'center',
  font: 'song',
  color: '#2c1810',
  fontSize: 56,
  strokeWidth: 0,
  strokeColor: '#ffffff',
  shadow: true,
  bgType: 'image',
  bgSrc: bg2,
  blur: 0,
  overlay: 20,
  vignette: 30,
  noise: 12
}

// ============================================
// Composable
// ============================================

// 使用模块级变量实现单例状态
const state = reactive<ShareCardState>({ ...defaultState })

export function useShareCard() {
  /** 重置为默认值 */
  const reset = () => {
    Object.assign(state, defaultState)
  }

  /** 初始化诗词内容 */
  const init = (poem: string, author: string, title?: string) => {
    state.poem = poem
    state.author = author
    state.title = title ? `《${title}》` : ''
  }

  /** 计算属性：作者颜色 (带 75% 透明度) */
  const authorColor = computed(() => {
    const hex = state.color
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, 0.75)`
  })

  /** 计算属性：画布尺寸 */
  const canvasSize = computed(() => {
    const [w, h] = state.size.split('x').map(Number)
    return { width: w, height: h }
  })

  /** 计算属性：字体 CSS 变量 */
  const fontFamily = computed(() => {
    const map: Record<string, string> = {
      song: "'Noto Serif SC', serif",
      kai: "'LXGW WenKai Screen', cursive",
      shufa: "'Ma Shan Zheng', cursive",
      hei: "'HarmonyOS Sans SC', sans-serif"
    }
    return map[state.font] || map.song
  })

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
    authorColor,
    canvasSize,
    fontFamily,
    setBackground
  }
}
