/**
 * 定位计算工具函数库
 * 用于统一 CustomSelect, Submenu, Tooltip 等组件的底层数学计算
 */

export type BaseDirection = 'top' | 'bottom' | 'left' | 'right'
export type Alignment = 'start' | 'center' | 'end'

export interface Rect {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

export interface Viewport {
  w: number
  h: number
}

export interface PositionResult {
  top: number
  left: number
  transformOrigin: string
}

/**
 * 获取矩形周围的可用空间
 */
export const getAvailableSpace = (rect: Rect, viewport: Viewport, buffer: number) => ({
  top: rect.top - buffer,
  bottom: viewport.h - rect.bottom - buffer,
  left: rect.left - buffer,
  right: viewport.w - rect.right - buffer,
})

/**
 * 检查指定位置是否能容纳内容
 */
export const checkFit = (
  baseDir: BaseDirection,
  align: Alignment,
  triggerRect: Rect,
  contentSize: { w: number; h: number },
  viewport: Viewport,
  buffer: number,
  offset: number = 0
): boolean => {
  const spaces = getAvailableSpace(triggerRect, viewport, buffer)
  const neededMain = baseDir === 'top' || baseDir === 'bottom' ? contentSize.h : contentSize.w

  // 1. 主轴检查
  // 注意：offset 会减少可用空间
  if (spaces[baseDir] < neededMain + offset) return false

  // 2. 交叉轴检查
  let crossStart = 0
  const crossSize = baseDir === 'top' || baseDir === 'bottom' ? contentSize.w : contentSize.h

  if (baseDir === 'top' || baseDir === 'bottom') {
    const triggerCenter = triggerRect.left + triggerRect.width / 2
    if (align === 'center') crossStart = triggerCenter - crossSize / 2
    else if (align === 'start') crossStart = triggerRect.left
    else crossStart = triggerRect.right - crossSize

    // 只要不超出视口即可 (允许轻微超出 buffer，只要不被截断)
    return crossStart >= 0 && crossStart + crossSize <= viewport.w
  } else {
    const triggerCenter = triggerRect.top + triggerRect.height / 2
    if (align === 'center') crossStart = triggerCenter - crossSize / 2
    else if (align === 'start') crossStart = triggerRect.top
    else crossStart = triggerRect.bottom - crossSize

    return crossStart >= 0 && crossStart + crossSize <= viewport.h
  }
}

/**
 * 计算具体的 Top/Left 坐标
 */
export const calculateCoords = (
  baseDir: BaseDirection,
  align: Alignment,
  triggerRect: Rect,
  contentSize: { w: number; h: number },
  viewport: Viewport,
  buffer: number,
  offset: number = 0
): PositionResult => {
  let top = 0
  let left = 0
  let transformOrigin = ''

  // 1. 主轴定位
  switch (baseDir) {
    case 'top':
      top = triggerRect.top - contentSize.h - offset
      transformOrigin = 'bottom'
      break
    case 'bottom':
      top = triggerRect.bottom + offset
      transformOrigin = 'top'
      break
    case 'left':
      left = triggerRect.left - contentSize.w - offset
      transformOrigin = 'right'
      break
    case 'right':
      left = triggerRect.right + offset
      transformOrigin = 'left'
      break
  }

  // 2. 交叉轴定位
  if (baseDir === 'top' || baseDir === 'bottom') {
    const triggerCenterX = triggerRect.left + triggerRect.width / 2
    if (align === 'start') {
      left = triggerRect.left
      transformOrigin += ' left'
    } else if (align === 'end') {
      left = triggerRect.right - contentSize.w
      transformOrigin += ' right'
    } else {
      left = triggerCenterX - contentSize.w / 2
      transformOrigin += ' center'
    }
  } else {
    const triggerCenterY = triggerRect.top + triggerRect.height / 2
    if (align === 'start') {
      top = triggerRect.top
      transformOrigin += ' top'
    } else if (align === 'end') {
      top = triggerRect.bottom - contentSize.h
      transformOrigin += ' bottom'
    } else {
      top = triggerCenterY - contentSize.h / 2
      transformOrigin += ' center'
    }
  }

  // 3. 边界吸附 (Clamping)
  if (left < buffer) left = buffer
  else if (left + contentSize.w > viewport.w - buffer) {
    left = viewport.w - contentSize.w - buffer
  }

  if (top < buffer) top = buffer
  else if (top + contentSize.h > viewport.h - buffer) {
    top = viewport.h - contentSize.h - buffer
  }

  return { top, left, transformOrigin }
}
