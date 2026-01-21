import { ref, nextTick, type CSSProperties } from 'vue'
import { POSITION_CONFIG, type SubmenuPlacement, type SubmenuAlign } from '../types'
import {
  checkFit,
  calculateCoords,
  type Rect,
  type BaseDirection,
  type Alignment,
} from '@/utils/positioning'

// ==================== 类型定义 ====================
interface SubmenuPositionResult {
  placement: SubmenuPlacement
  align: SubmenuAlign
  style: CSSProperties
}

interface CalculateSubmenuPositionParams {
  parentRect: DOMRect
  triggerItemRect: DOMRect
  submenuSize: { width: number; height: number }
  viewport: { width: number; height: number }
  level?: number
}

// ==================== 常量 ====================
const SUBMENU_GAP = 2 // 子菜单与父菜单的间距
const MAX_VISUAL_LEVEL = 3 // 最大视觉层级

// ==================== 导出 Composable ====================
export function useSubmenuPosition() {
  const submenuStyle = ref<CSSProperties>({})
  const currentPlacement = ref<SubmenuPlacement>('right')
  const currentAlign = ref<SubmenuAlign>('alignTop')

  /**
   * 计算子菜单位置
   */
  const calculateSubmenuPosition = (
    params: CalculateSubmenuPositionParams
  ): SubmenuPositionResult => {
    const { parentRect, triggerItemRect, submenuSize, viewport, level = 1 } = params

    // 1. 确定候选位置 (子菜单优先左右展开)
    type Candidate = { dir: BaseDirection; align: Alignment; name: SubmenuPlacement }

    // 默认优先右侧，顶部对齐
    const candidates: Candidate[] = [
      { dir: 'right', align: 'start', name: 'right' },
      { dir: 'left', align: 'start', name: 'left' },
      // 如果顶部对齐放不下，尝试底部对齐
      { dir: 'right', align: 'end', name: 'right' },
      { dir: 'left', align: 'end', name: 'left' },
    ]

    // 2. 选择最佳位置
    let best = candidates[0]
    for (const cand of candidates) {
      // 注意：子菜单的 triggerRect 其实是 parentRect (父菜单)，
      // 但我们需要基于 triggerItemRect (触发项) 来对齐。
      // 这里我们需要一点 trick：
      // 我们把 triggerItemRect 作为基准，但是左右方向上需要偏移到 parentRect 之外。

      // 为了复用 checkFit，我们构造一个特殊的 Rect
      // 实际上 checkFit 主要检查空间是否足够。
      // 对于子菜单，水平空间取决于 parentRect，垂直空间取决于 triggerItemRect。

      // 让我们构建一个混合 Rect 传给 checkFit
      const hybridRect: Rect = {
        top: triggerItemRect.top,
        bottom: triggerItemRect.bottom,
        left: parentRect.left,
        right: parentRect.right,
        width: parentRect.width,
        height: triggerItemRect.height,
      }

      const mappedSize = { w: submenuSize.width, h: submenuSize.height }
      const mappedViewport = { w: viewport.width, h: viewport.height }

      // 使用 SUBMENU_GAP 作为 offset
      if (
        checkFit(
          cand.dir,
          cand.align,
          hybridRect,
          mappedSize,
          mappedViewport,
          POSITION_CONFIG.BUFFER,
          SUBMENU_GAP
        )
      ) {
        best = cand
        break
      }
    }

    // 3. 计算坐标
    // 同样需要构建混合 Rect
    const hybridRect: Rect = {
      top: triggerItemRect.top,
      bottom: triggerItemRect.bottom,
      left: parentRect.left,
      right: parentRect.right,
      width: parentRect.width,
      height: triggerItemRect.height,
    }

    const mappedSize = { w: submenuSize.width, h: submenuSize.height }
    const mappedViewport = { w: viewport.width, h: viewport.height }

    const result = calculateCoords(
      best.dir,
      best.align,
      hybridRect,
      mappedSize,
      mappedViewport,
      POSITION_CONFIG.BUFFER,
      SUBMENU_GAP
    )

    // 4. 视觉层级限制
    const visualLevel = Math.min(level, MAX_VISUAL_LEVEL)
    const levelOpacity = 1 - (visualLevel - 1) * 0.05
    const levelScale = 1 - (visualLevel - 1) * 0.02

    // 5. 转换对齐方式名称 (为了兼容旧代码/动画)
    let alignName: SubmenuAlign = 'alignTop'
    if (best.align === 'end') alignName = 'alignBottom'
    // 注意：checkFit 可能会返回 center，但子菜单通常不用 center

    return {
      placement: best.name,
      align: alignName,
      style: {
        position: 'fixed',
        zIndex: 9999 + level,
        left: `${result.left}px`,
        top: `${result.top}px`,
        opacity: levelOpacity,
        transform: `scale(${levelScale})`,
        transformOrigin: result.transformOrigin,
      },
    }
  }

  /**
   * 更新子菜单位置
   */
  const updateSubmenuPosition = async (params: CalculateSubmenuPositionParams) => {
    await nextTick()
    const result = calculateSubmenuPosition(params)
    submenuStyle.value = result.style
    currentPlacement.value = result.placement
    currentAlign.value = result.align
    return result
  }

  return {
    submenuStyle,
    currentPlacement,
    currentAlign,
    calculateSubmenuPosition,
    updateSubmenuPosition,
  }
}
