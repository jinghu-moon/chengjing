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
import type { VirtualRect, DialogPlacement } from '../types'

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

interface UseDialogPositionOptions {
  isOpen: Ref<boolean>
  dialogRef: MaybeRef<HTMLElement | null>
  triggerRect: MaybeRef<VirtualRect | DOMRect | undefined>
  placement?: MaybeRef<DialogPlacement | undefined>
}

const BUFFER = 8

export function useDialogPosition({
  isOpen,
  dialogRef,
  triggerRect: triggerRectProp,
  placement: placementProp = 'bottomLeft',
}: UseDialogPositionOptions) {
  const dialogStyle = ref<CSSProperties>({
    position: 'fixed',
    zIndex: 9999,
    top: '',
    left: '',
    transformOrigin: 'center center',
  })

  const arrowPlacementClass = ref('')
  const currentPlacement = ref<DialogPlacement>('bottomLeft')

  const updatePosition = async () => {
    if (!isOpen.value) return

    const trigger = toValue(triggerRectProp)
    if (!trigger) return

    await nextTick()
    const dialogEl = toValue(dialogRef)
    if (!dialogEl) return

    // 1. 准备数据
    const viewport: Viewport = { w: window.innerWidth, h: window.innerHeight }
    const dialogSize = {
      w: dialogEl.offsetWidth,
      h: dialogEl.offsetHeight,
    }

    // 2. 候选位置映射
    type Candidate = { dir: BaseDirection; align: Alignment; name: DialogPlacement }

    const candidates: Candidate[] = [
      { dir: 'bottom', align: 'start', name: 'bottomLeft' },
      { dir: 'top', align: 'start', name: 'topLeft' },
      { dir: 'bottom', align: 'end', name: 'bottomRight' },
      { dir: 'top', align: 'end', name: 'topRight' },
      { dir: 'bottom', align: 'center', name: 'bottom' },
      { dir: 'top', align: 'center', name: 'top' },
      { dir: 'left', align: 'start', name: 'left' },
      { dir: 'right', align: 'start', name: 'right' },
    ]

    // 将用户偏好的位置放到第一位
    const preferred = toValue(placementProp)
    if (preferred) {
      const found = candidates.find(c => c.name === preferred)
      if (found) {
        candidates.sort(a => (a.name === preferred ? -1 : 1))
      }
    }

    // 3. 选择最佳位置
    let best = candidates[0]
    for (const cand of candidates) {
      if (checkFit(cand.dir, cand.align, trigger as Rect, dialogSize, viewport, BUFFER)) {
        best = cand
        break
      }
    }

    // 4. 强制回退逻辑 (垂直空间优先)
    if (!checkFit(best.dir, best.align, trigger as Rect, dialogSize, viewport, BUFFER)) {
      const spaceTop = trigger.top
      const spaceBottom = viewport.h - trigger.bottom
      if (spaceTop > spaceBottom && spaceBottom < dialogSize.h) {
        best = candidates.find(c => c.dir === 'top') || best
      }
    }

    // 5. 应用位置
    const result = calculateCoords(
      best.dir,
      best.align,
      trigger as Rect,
      dialogSize,
      viewport,
      BUFFER,
      BUFFER
    )
    currentPlacement.value = best.name

    dialogStyle.value = {
      position: 'fixed',
      top: `${result.top}px`,
      left: `${result.left}px`,
      transformOrigin: result.transformOrigin,
      margin: 0,
    }

    // 6. 箭头方向
    arrowPlacementClass.value = best.dir === 'bottom' ? 'arrow-top' : 'arrow-bottom'
  }

  const throttledUpdatePosition = throttleRaf(updatePosition)

  return {
    dialogStyle,
    currentPlacement,
    arrowPlacementClass,
    updatePosition,
    throttledUpdatePosition,
  }
}
