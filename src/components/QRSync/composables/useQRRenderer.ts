/**
 * QR 二维码渲染 Composable
 * 整合 Canvas 和 SVG 渲染逻辑
 */

import { ref, computed } from 'vue'
import { renderQRToSVG, downloadSVG } from '../renderers/SVGRenderer'
import { DEFAULT_QR_STYLE } from '../types'
import type { QRStyleConfig, RenderFormat, ModuleStyle } from '../types'

export function useQRRenderer() {
  // 渲染格式
  const renderFormat = ref<RenderFormat>('canvas')

  // 样式配置
  const styleConfig = ref<QRStyleConfig>({ ...DEFAULT_QR_STYLE })

  // 模块样式选项
  const moduleStyleOptions: { value: ModuleStyle; label: string }[] = [
    { value: 'square', label: '方形' },
    { value: 'rounded', label: '圆角' },
    { value: 'circle', label: '圆形' },
    { value: 'dot', label: '圆点' }
  ]

  // 格式选项
  const formatOptions: { value: RenderFormat; label: string }[] = [
    { value: 'canvas', label: 'PNG' },
    { value: 'svg', label: 'SVG' }
  ]

  // 重置样式
  function resetStyle() {
    styleConfig.value = { ...DEFAULT_QR_STYLE }
  }

  return {
    renderFormat,
    styleConfig,
    moduleStyleOptions,
    formatOptions,
    resetStyle,
    renderQRToSVG,
    downloadSVG
  }
}
