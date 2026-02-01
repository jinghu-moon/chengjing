/**
 * SVG 二维码渲染器
 * 支持圆角模块、Logo、颜色自定义
 */

import { encode as encodeQR } from 'uqr'
import type { QRRenderOptions, ModuleStyle } from '../types'

/**
 * 生成单个模块的 SVG path
 */
function getModulePath(
  x: number,
  y: number,
  size: number,
  style: ModuleStyle,
  cornerRadius: number
): string {
  const r = Math.min(cornerRadius / 100 * size / 2, size / 2)

  switch (style) {
    case 'circle':
    case 'dot':
      // 圆形模块
      const cx = x + size / 2
      const cy = y + size / 2
      const radius = style === 'dot' ? size * 0.35 : size / 2
      return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius} Z`

    case 'rounded':
      // 圆角矩形
      if (r === 0) {
        return `M ${x} ${y} h ${size} v ${size} h ${-size} Z`
      }
      return `M ${x + r} ${y} h ${size - 2 * r} a ${r} ${r} 0 0 1 ${r} ${r} v ${size - 2 * r} a ${r} ${r} 0 0 1 ${-r} ${r} h ${-(size - 2 * r)} a ${r} ${r} 0 0 1 ${-r} ${-r} v ${-(size - 2 * r)} a ${r} ${r} 0 0 1 ${r} ${-r} Z`

    case 'square':
    default:
      // 方形模块
      return `M ${x} ${y} h ${size} v ${size} h ${-size} Z`
  }
}

/**
 * 检查模块是否在 Logo 区域内
 */
function isInLogoArea(
  row: number,
  col: number,
  moduleCount: number,
  logoScale: number
): boolean {
  const logoModules = Math.ceil(moduleCount * logoScale)
  const start = Math.floor((moduleCount - logoModules) / 2)
  const end = start + logoModules
  return row >= start && row < end && col >= start && col < end
}

/**
 * 渲染二维码为 SVG 字符串
 */
export function renderQRToSVG(options: QRRenderOptions): string {
  const { data, size, quietZone, style } = options
  const totalSize = size + quietZone * 2

  // 生成二维码矩阵
  const qr = encodeQR(data, { ecc: style.showLogo ? 'H' : 'L' })
  const moduleCount = qr.size
  const moduleSize = size / moduleCount

  // 收集所有模块路径
  const paths: string[] = []

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!qr.data[row][col]) continue

      // 跳过 Logo 区域
      if (style.showLogo && isInLogoArea(row, col, moduleCount, style.logoScale)) {
        continue
      }

      const x = quietZone + col * moduleSize
      const y = quietZone + row * moduleSize
      paths.push(getModulePath(x, y, moduleSize, style.moduleStyle, style.cornerRadius))
    }
  }

  // 构建 SVG
  return buildSVG(totalSize, paths, style)
}

/**
 * 构建 SVG 字符串
 */
function buildSVG(
  size: number,
  paths: string[],
  style: QRRenderOptions['style']
): string {
  const logoSVG = style.showLogo ? getLogoSVG(size, style.logoScale) : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="100%" height="100%" fill="${style.backgroundColor}"/>
  <path d="${paths.join(' ')}" fill="${style.foregroundColor}"/>
  ${logoSVG}
</svg>`
}

/**
 * 生成 Logo SVG（澄镜图标）
 */
function getLogoSVG(totalSize: number, logoScale: number): string {
  const logoSize = totalSize * logoScale
  const x = (totalSize - logoSize) / 2
  const y = (totalSize - logoSize) / 2
  const padding = logoSize * 0.1
  const innerSize = logoSize - padding * 2

  return `
  <rect x="${x}" y="${y}" width="${logoSize}" height="${logoSize}" rx="8" fill="#ffffff"/>
  <text x="${totalSize / 2}" y="${totalSize / 2 + innerSize * 0.15}"
        font-size="${innerSize * 0.5}" font-weight="600"
        text-anchor="middle" fill="#5E81AC">澄</text>`
}

/**
 * 下载 SVG 文件
 */
export function downloadSVG(svgString: string, filename: string): void {
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.replace('.png', '.svg')
  a.click()
  URL.revokeObjectURL(url)
}
