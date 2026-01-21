import { ref, nextTick, toValue, type CSSProperties, type Ref, type ComputedRef } from 'vue'
import { throttleRaf } from '@/utils/throttle'
import { POSITION_CONFIG, type PlacementPosition } from '../types'
import {
  checkFit,
  calculateCoords,
  type Rect,
  type Viewport,
  type BaseDirection,
  type Alignment,
} from '@/utils/positioning'

// ==================== 类型定义 ====================
type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

export interface VirtualRect {
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}

interface UsePositionOptions {
  isOpen: Ref<boolean>
  selectRef?: Ref<HTMLElement | null>
  dropdownRef: MaybeRef<HTMLElement | null>
  virtualRect?: Ref<VirtualRect | null>
  showArrow?: MaybeRef<boolean>
  dropdownMinWidth?: MaybeRef<string | number | undefined>
  placement?: MaybeRef<PlacementPosition>
}

// ==================== 核心逻辑 ====================
export function usePosition({
  isOpen,
  selectRef,
  dropdownRef,
  virtualRect,
  showArrow,
  dropdownMinWidth,
  placement: placementProp = 'auto',
}: UsePositionOptions) {
  const dropdownStyle = ref<CSSProperties>({
    position: 'fixed',
    zIndex: 9999,
    top: '',
    bottom: '',
    left: '',
    right: '',
    minWidth: '',
    transformOrigin: 'top center',
    maxHeight: '',
  })

  const arrowStyle = ref({
    left: '50%',
    top: '',
    bottom: '',
  })

  const arrowPlacementClass = ref('')
  const cachedContentHeight = ref(0)
  const currentPlacement = ref<PlacementPosition>('bottomLeft')

  // ==================== 主更新函数 ====================
  const updatePosition = async () => {
    if (!isOpen.value) return
    if (!selectRef?.value && !virtualRect?.value) return

    await nextTick()
    const dropdownEl = toValue(dropdownRef)
    if (!dropdownEl) return

    // 1. 获取触发器信息
    let triggerRect: Rect
    if (virtualRect?.value) {
      triggerRect = virtualRect.value
    } else if (selectRef?.value) {
      triggerRect = selectRef.value.getBoundingClientRect()
    } else {
      return
    }

    const viewport: Viewport = { w: window.innerWidth, h: window.innerHeight }
    const isVirtual = triggerRect.width === 0 && triggerRect.height === 0

    // 2. 准备尺寸信息
    const userMinWidth = toValue(dropdownMinWidth)
    const baseMinWidth = userMinWidth !== undefined ? userMinWidth : POSITION_CONFIG.MIN_WIDTH
    const baseMinWidthCSS = typeof baseMinWidth === 'number' ? `${baseMinWidth}px` : baseMinWidth
    const finalMinWidthCSS = `max(${triggerRect.width}px, ${baseMinWidthCSS})`

    const numericMinWidth =
      typeof baseMinWidth === 'number' ? baseMinWidth : parseFloat(String(baseMinWidth)) || 150
    const estimatedWidth = Math.max(dropdownEl.scrollWidth, triggerRect.width, numericMinWidth)

    if (cachedContentHeight.value === 0) {
      const prev = {
        opacity: dropdownEl.style.opacity,
        maxHeight: dropdownEl.style.maxHeight,
        display: dropdownEl.style.display,
      }
      dropdownEl.style.opacity = '0'
      dropdownEl.style.maxHeight = 'none'
      dropdownEl.style.display = 'flex'
      cachedContentHeight.value = dropdownEl.scrollHeight
      dropdownEl.style.maxHeight = prev.maxHeight
      dropdownEl.style.opacity = prev.opacity
      dropdownEl.style.display = prev.display
    }
    const estimatedHeight = Math.min(cachedContentHeight.value || 300, POSITION_CONFIG.MAX_HEIGHT)
    const menuSize = { w: estimatedWidth, h: estimatedHeight }

    // 3. 确定候选位置
    type Candidate = { dir: BaseDirection; align: Alignment; name: PlacementPosition }
    let candidates: Candidate[] = []
    const preferredPlacement = toValue(placementProp)

    if (isVirtual) {
      candidates = [
        { dir: 'bottom', align: 'start', name: 'bottomLeft' },
        { dir: 'bottom', align: 'end', name: 'bottomRight' },
        { dir: 'top', align: 'start', name: 'topLeft' },
        { dir: 'top', align: 'end', name: 'topRight' },
      ]
    } else {
      const defaults: Candidate[] = [
        { dir: 'bottom', align: 'start', name: 'bottomLeft' },
        { dir: 'top', align: 'start', name: 'topLeft' },
        { dir: 'bottom', align: 'end', name: 'bottomRight' },
        { dir: 'top', align: 'end', name: 'topRight' },
      ]

      if (preferredPlacement === 'topCenter')
        candidates = [{ dir: 'top', align: 'center', name: 'topCenter' }, ...defaults]
      else if (preferredPlacement === 'bottomCenter')
        candidates = [{ dir: 'bottom', align: 'center', name: 'bottomCenter' }, ...defaults]
      else candidates = defaults
    }

    // 4. 选择最佳位置
    let best = candidates[0]
    for (const cand of candidates) {
      if (checkFit(cand.dir, cand.align, triggerRect, menuSize, viewport, POSITION_CONFIG.BUFFER)) {
        best = cand
        break
      }
    }

    // 强制回退逻辑 (垂直优先)
    if (!checkFit(best.dir, best.align, triggerRect, menuSize, viewport, POSITION_CONFIG.BUFFER)) {
      // 简单判断：如果上方空间更多，就选上方
      const spaceTop = triggerRect.top
      const spaceBottom = viewport.h - triggerRect.bottom
      if (spaceTop > spaceBottom && spaceBottom < menuSize.h) {
        best = candidates.find(c => c.dir === 'top') || best
      }
    }

    // 5. 应用位置
    const result = calculateCoords(
      best.dir,
      best.align,
      triggerRect,
      menuSize,
      viewport,
      POSITION_CONFIG.BUFFER,
      POSITION_CONFIG.BUFFER
    )
    currentPlacement.value = best.name

    dropdownStyle.value = {
      position: 'fixed',
      zIndex: 9999,
      top: `${result.top}px`,
      left: `${result.left}px`,
      minWidth: finalMinWidthCSS,
      transformOrigin: result.transformOrigin,
      maxHeight: `${estimatedHeight}px`,
    }

    // 6. 箭头样式
    const shouldShowArrow = toValue(showArrow) ?? true
    if (shouldShowArrow && !isVirtual) {
      arrowPlacementClass.value = best.dir === 'bottom' ? 'arrow-top' : 'arrow-bottom'

      // 计算箭头位置 (相对于菜单)
      const triggerCenter = triggerRect.left + triggerRect.width / 2
      const arrowX = triggerCenter - result.left
      const safeArrowX = Math.max(
        POSITION_CONFIG.ARROW_SAFE_MARGIN,
        Math.min(arrowX, menuSize.w - POSITION_CONFIG.ARROW_SAFE_MARGIN)
      )

      arrowStyle.value = {
        left: `${safeArrowX}px`,
        top: best.dir === 'bottom' ? '-5px' : 'auto',
        bottom: best.dir === 'top' ? '-5px' : 'auto',
      }
    } else {
      arrowPlacementClass.value = ''
      arrowStyle.value = { left: '0', top: '0', bottom: '0' }
    }
  }

  const throttledUpdatePosition = throttleRaf(updatePosition)
  const resetCache = () => {
    cachedContentHeight.value = 0
  }

  return {
    dropdownStyle,
    arrowStyle,
    arrowPlacementClass,
    currentPlacement,
    updatePosition,
    throttledUpdatePosition,
    resetCache,
  }
}
