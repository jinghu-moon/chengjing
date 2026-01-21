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
import { POSITION_CONFIG } from '@/components/SelectMenu/types' // 复用配置常量
import type { VirtualRect, DialogPlacement } from '../types'

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

interface UseDialogPositionOptions {
  isOpen: Ref<boolean>
  dialogRef: MaybeRef<HTMLElement | null>
  triggerRect: MaybeRef<VirtualRect | DOMRect | undefined>
  placement?: MaybeRef<DialogPlacement>
}

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
    // 将 DialogPlacement 转换为 positioning 库需要的 { dir, align, name }
    type Candidate = { dir: BaseDirection; align: Alignment; name: DialogPlacement }

    // 默认候选列表
    const candidates: Candidate[] = [
      { dir: 'bottom', align: 'start', name: 'bottomLeft' },
      { dir: 'top', align: 'start', name: 'topLeft' },
      { dir: 'bottom', align: 'end', name: 'bottomRight' },
      { dir: 'top', align: 'end', name: 'topRight' },
      { dir: 'bottom', align: 'center', name: 'bottom' }, // bottomCenter
      { dir: 'top', align: 'center', name: 'top' }, // topCenter
    ]

    // 将用户偏好的位置放到第一位
    const preferred = toValue(placementProp)
    if (preferred) {
      // 注意：这里做个简单的匹配，如果 types.ts 定义不同可能需要调整
      // 这里的 placementProp 是 DialogPlacement，我们需要匹配上面的 map

      const found = candidates.find(c => c.name === preferred)
      if (found) {
        // 把偏好的移到数组第一个
        candidates.sort(a => (a.name === preferred ? -1 : 1))
      }
    }

    // 3. 选择最佳位置
    let best = candidates[0]
    for (const cand of candidates) {
      if (
        checkFit(
          cand.dir,
          cand.align,
          trigger as Rect,
          dialogSize,
          viewport,
          POSITION_CONFIG.BUFFER
        )
      ) {
        best = cand
        break
      }
    }

    // 4. 强制回退逻辑 (垂直空间优先)
    if (
      !checkFit(best.dir, best.align, trigger as Rect, dialogSize, viewport, POSITION_CONFIG.BUFFER)
    ) {
      const spaceTop = trigger.top
      const spaceBottom = viewport.h - trigger.bottom
      // 如果上方空间大，且下方放不下，则优选上方
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
      POSITION_CONFIG.BUFFER,
      0
    )
    currentPlacement.value = best.name

    dialogStyle.value = {
      position: 'fixed',
      // zIndex 由 DialogItem 统一管理，这里不通过 style 覆盖，或者保持一致
      top: `${result.top}px`,
      left: `${result.left}px`,
      transformOrigin: result.transformOrigin,
      margin: 0, // 移除默认 margin
    }

    // 6. 简单的箭头逻辑 (可选)
    // 暂时不实现箭头，因为 Popconfirm 风格通常更简洁，或者稍后添加
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
