/**
 * QR 二维码组件类型定义
 */

/** 模块样式 */
export type ModuleStyle = 'square' | 'rounded' | 'circle' | 'dot'

/** 渲染格式 */
export type RenderFormat = 'canvas' | 'svg'

/** 二维码样式配置 */
export interface QRStyleConfig {
  /** 模块样式 */
  moduleStyle: ModuleStyle
  /** 圆角半径 (0-50)，仅 rounded 模式有效 */
  cornerRadius: number
  /** 前景色 */
  foregroundColor: string
  /** 背景色 */
  backgroundColor: string
  /** 是否显示 Logo */
  showLogo: boolean
  /** Logo 大小比例 (0.1-0.3) */
  logoScale: number
}

/** 渲染选项 */
export interface QRRenderOptions {
  /** 二维码数据 */
  data: string
  /** 输出尺寸 */
  size: number
  /** 静默区大小 */
  quietZone: number
  /** 样式配置 */
  style: QRStyleConfig
}

/** 默认样式配置 */
export const DEFAULT_QR_STYLE: QRStyleConfig = {
  moduleStyle: 'square',
  cornerRadius: 30,
  foregroundColor: '#000000',
  backgroundColor: '#ffffff',
  showLogo: false,
  logoScale: 0.2
}
