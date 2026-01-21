import { ref, nextTick, toValue, type CSSProperties, type Ref, type ComputedRef } from 'vue'
import { throttleRaf } from '@/utils/throttle'
import {
  checkFit,
  calculateCoords,
  type Rect,
  type Viewport,
  type BaseDirection,
  type Alignment,
} from '@/utils/positioning'

// ==================== 类型定义 ====================
/**
 * 13 个定位方向 (包含 auto)
 */
export type TooltipPlacement =
  | 'auto'
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

/**
 * 基础方向（用于核心逻辑计算）
 */
type LocalBaseDirection = 'top' | 'bottom' | 'left' | 'right'

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

interface UseTooltipPositionOptions {
  isOpen: Ref<boolean>
  triggerRef: Ref<HTMLElement | null>
  tooltipRef: MaybeRef<HTMLElement | null>
  placement: MaybeRef<TooltipPlacement>
  offset: MaybeRef<number>
}

// ==================== 常量配置 ====================
const CONFIG = {
  BUFFER: 8, // 距离视口边缘的最小安全距离
  ARROW_SAFE_MARGIN: 12, // 箭头距离 Tooltip 边缘的最小距离
} as const

// ==================== 辅助工具函数 ====================
/**
 * 提取基础方向 (top, bottom, left, right)
 */
const getBaseDirection = (placement: TooltipPlacement): LocalBaseDirection => {
  return placement.split('-')[0] as LocalBaseDirection
}

/**
 * 获取对齐方式 (start, center, end)
 */
const getAlignment = (placement: TooltipPlacement): Alignment => {
  if (placement.endsWith('-start')) return 'start'
  if (placement.endsWith('-end')) return 'end'
  return 'center'
}

// ==================== 导出 Composable ====================
export function useTooltipPosition({
  isOpen,
  triggerRef,
  tooltipRef,
  placement,
  offset,
}: UseTooltipPositionOptions) {
  /**
   * 实际渲染的方向 (会随着翻转逻辑动态改变)
   * 它的值将决定 CSS 中小箭头的指向类名
   */
  const actualPlacement = ref<TooltipPlacement>('top')

  /**
   * Tooltip 容器样式
   */
  const tooltipStyle = ref<CSSProperties>({
    position: 'fixed',
    zIndex: 9999,
    top: '',
    left: '',
  })

  /**
   * 内部小箭头样式
   */
  const arrowStyle = ref<CSSProperties>({
    left: '',
    top: '',
  })

  /**
   * ==================== 核心算法：获取最佳定位方向 ====================
   * 采用二维搜索策略：
   * 1. 遍历 12 个精确位置，寻找一个主轴不挤且交叉轴不撞墙的位置。
   * 2. 优先级：Top 组 > Bottom 组 > Right 组 > Left 组。
   */
  const getBestPlacement = (
    triggerRect: Rect,
    tooltipSize: { w: number; h: number },
    viewport: Viewport,
    gap: number
  ): TooltipPlacement => {
    const canFitPerfectly = (p: TooltipPlacement): boolean => {
      const base = getBaseDirection(p) as BaseDirection
      const align = getAlignment(p)
      return checkFit(base, align, triggerRect, tooltipSize, viewport, CONFIG.BUFFER, gap)
    }

    const candidates: TooltipPlacement[] = [
      'top',
      'top-start',
      'top-end',
      'bottom',
      'bottom-start',
      'bottom-end',
      'right',
      'right-start',
      'right-end',
      'left',
      'left-start',
      'left-end',
    ]

    for (const candidate of candidates) {
      if (canFitPerfectly(candidate)) return candidate
    }

    // ========== 降级逻辑优化：引入垂直权重 ==========
    const spaces = {
      top: triggerRect.top,
      bottom: viewport.h - triggerRect.bottom,
      left: triggerRect.left,
      right: viewport.w - triggerRect.right,
    }

    // 给予垂直方向（上下） 2 倍的权重。
    // 这意味着除非左右空间比上下空间大 2 倍以上，否则优先上下。
    const WEIGHT = 2
    const score = {
      top: spaces.top * WEIGHT,
      bottom: spaces.bottom * WEIGHT,
      left: spaces.left,
      right: spaces.right,
    }

    let bestBase: LocalBaseDirection = 'top'
    let maxScore = score.top

    if (score.bottom > maxScore) {
      bestBase = 'bottom'
      maxScore = score.bottom
    }
    if (score.right > maxScore) {
      bestBase = 'right'
      maxScore = score.right
    }
    if (score.left > maxScore) {
      bestBase = 'left'
      maxScore = score.left
    }

    return bestBase
  }

  /**
   * ==================== 翻转逻辑 (用于非 Auto 模式) ====================
   */
  const getFlippedPlacement = (
    preferred: TooltipPlacement,
    triggerRect: Rect,
    tooltipSize: { w: number; h: number },
    viewport: Viewport,
    gap: number
  ): TooltipPlacement => {
    if (preferred === 'auto') {
      return getBestPlacement(triggerRect, tooltipSize, viewport, gap)
    }

    const baseDir = getBaseDirection(preferred) as BaseDirection
    const alignment = getAlignment(preferred)

    // 当前预设方向空间足够，直接使用
    if (checkFit(baseDir, alignment, triggerRect, tooltipSize, viewport, CONFIG.BUFFER, gap)) {
      return preferred
    }

    // 否则翻转到对侧
    const opposite: Record<LocalBaseDirection, LocalBaseDirection> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    }

    const flippedBase = opposite[baseDir as LocalBaseDirection]
    const flippedPlacement =
      alignment === 'center' ? flippedBase : (`${flippedBase}-${alignment}` as TooltipPlacement)

    // 比较对侧和原侧的空间 (简单比较主轴空间)
    const spaces = {
      top: triggerRect.top - gap,
      bottom: viewport.h - triggerRect.bottom - gap,
      left: triggerRect.left - gap,
      right: viewport.w - triggerRect.right - gap,
    }

    return spaces[flippedBase] >= spaces[baseDir as LocalBaseDirection]
      ? flippedPlacement
      : preferred
  }

  /**
   * ==================== 核心定位计算函数 ====================
   */
  const updatePosition = async () => {
    if (!isOpen.value) return

    const trigger = triggerRef.value
    const tooltip = toValue(tooltipRef)
    if (!trigger || !tooltip) return

    await nextTick()

    const triggerRect = trigger.getBoundingClientRect()
    const tooltipRect = tooltip.getBoundingClientRect()
    const viewport = { w: window.innerWidth, h: window.innerHeight }
    const gap = toValue(offset)
    const preferredPlacement = toValue(placement)

    const tooltipSize = { w: tooltipRect.width, h: tooltipRect.height }

    // 1. 确定最终的实际位置
    const actual = getFlippedPlacement(preferredPlacement, triggerRect, tooltipSize, viewport, gap)
    actualPlacement.value = actual

    const baseDir = getBaseDirection(actual) as BaseDirection
    const alignment = getAlignment(actual)

    // 2. 计算坐标
    const result = calculateCoords(
      baseDir,
      alignment,
      triggerRect,
      tooltipSize,
      viewport,
      CONFIG.BUFFER,
      gap
    )

    // 3. 箭头位置计算
    // 箭头必须始终指向触发器的几何中心
    const triggerCenterX = triggerRect.left + triggerRect.width / 2
    const triggerCenterY = triggerRect.top + triggerRect.height / 2

    let arrowL = ''
    let arrowT = ''

    if (baseDir === 'top' || baseDir === 'bottom') {
      const arrowX = triggerCenterX - result.left
      const safeX = Math.max(
        CONFIG.ARROW_SAFE_MARGIN,
        Math.min(arrowX, tooltipRect.width - CONFIG.ARROW_SAFE_MARGIN)
      )
      arrowL = `${safeX}px`
    } else {
      const arrowY = triggerCenterY - result.top
      const safeY = Math.max(
        CONFIG.ARROW_SAFE_MARGIN,
        Math.min(arrowY, tooltipRect.height - CONFIG.ARROW_SAFE_MARGIN)
      )
      arrowT = `${safeY}px`
    }

    // 4. 状态更新渲染
    tooltipStyle.value = {
      position: 'fixed',
      zIndex: 9999,
      top: `${result.top}px`,
      left: `${result.left}px`,
    }

    arrowStyle.value = {
      left: arrowL,
      top: arrowT,
    }
  }

  const throttledUpdatePosition = throttleRaf(updatePosition)

  return {
    actualPlacement,
    tooltipStyle,
    arrowStyle,
    updatePosition,
    throttledUpdatePosition,
    getBaseDirection,
  }
}
