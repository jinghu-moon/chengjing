/**
 * useBubbleMenuPosition.ts
 *
 * Bubble Menu 的定位和显示/隐藏逻辑
 * 基于 @tiptap/extension-bubble-menu 源码实现
 */

import { ref, nextTick, onMounted, onUnmounted, type Ref } from 'vue'
import type { Editor } from '@tiptap/vue-3'
import { isTextSelection } from '@tiptap/core'
import { debounce } from '@/utils/debounce'
import { useTooltipPosition } from '@/components/Tooltip'

// ==================== 类型定义 ====================
interface UseBubbleMenuPositionOptions {
  editor: Editor
  tooltipRef: Ref<HTMLElement | null>
  isEditingLink?: Ref<boolean>
}

export function useBubbleMenuPosition(options: UseBubbleMenuPositionOptions) {
  const { editor, tooltipRef, isEditingLink } = options

  // ==================== 状态 ====================
  const isOpen = ref(false)
  let preventHide = false

  const UPDATE_DELAY = 100
  const RESIZE_DELAY = 60

  let lastSelectionFrom = -1
  let lastSelectionTo = -1

  // 虚拟矩形 (用于定位)
  const selectionRect = ref({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })

  const virtualElement = ref({
    getBoundingClientRect: () => selectionRect.value,
  })

  // ==================== 复用定位逻辑 ====================
  const { actualPlacement, tooltipStyle, arrowStyle, updatePosition, getBaseDirection } =
    useTooltipPosition({
      isOpen,
      triggerRef: virtualElement as any,
      tooltipRef,
      placement: ref('top'),
      offset: ref(10),
    })

  // ==================== shouldShow 逻辑 ====================
  const shouldShow = (): boolean => {
    const { view, state } = editor
    const { selection, doc } = state
    const { from, to, empty } = selection

    if (empty) return false
    const isEmptyTextBlock = !doc.textBetween(from, to).length && isTextSelection(selection)
    if (isEmptyTextBlock) return false
    const isChildOfMenu = tooltipRef.value?.contains(document.activeElement)
    const hasEditorFocus = view.hasFocus() || isChildOfMenu
    if (!hasEditorFocus) return false
    if (!editor.isEditable) return false

    return true
  }

  // ==================== 计算虚拟元素位置 ====================
  const computeVirtualElement = (): boolean => {
    const { view, state } = editor
    const { selection } = state
    const { from, to } = selection

    const start = view.coordsAtPos(from)
    const end = view.coordsAtPos(to)
    const left = Math.min(start.left, end.left)
    const right = Math.max(start.right, end.right)
    const top = Math.min(start.top, end.top)
    const bottom = Math.max(start.bottom, end.bottom)

    if (left === right) return false

    selectionRect.value = {
      top,
      bottom,
      left,
      right,
      width: right - left,
      height: bottom - top,
      x: left,
      y: top,
      toJSON: () => ({}),
    }

    return true
  }

  // ==================== 核心更新处理器 ====================
  const handleUpdate = (selectionChanged: boolean, docChanged: boolean) => {
    const { view, state } = editor
    const { selection } = state

    if (view.composing) return
    const isSame = !selectionChanged && !docChanged
    if (isSame) return

    // 如果正在编辑链接，不要因为选区微调而关闭菜单
    if (isEditingLink?.value && !selection.empty) {
      if (computeVirtualElement()) {
        nextTick(() => updatePosition())
      }
      return
    }

    if (!shouldShow()) {
      isOpen.value = false
      return
    }
    if (!computeVirtualElement()) {
      isOpen.value = false
      return
    }
    isOpen.value = true
    nextTick(() => updatePosition())
  }

  // 使用 debounce 包装核心更新逻辑
  const debouncedUpdate = debounce(handleUpdate, UPDATE_DELAY)

  const handleSelectionUpdate = () => {
    const { state } = editor
    const { from, to } = state.selection
    const hasValidSelection = from !== to
    const selectionChanged = from !== lastSelectionFrom || to !== lastSelectionTo
    lastSelectionFrom = from
    lastSelectionTo = to

    if (hasValidSelection) {
      debouncedUpdate(selectionChanged, false)
    } else {
      // 立即执行以关闭菜单或处理无效选区
      handleUpdate(selectionChanged, false)
    }
  }

  // ==================== 事件处理器 ====================
  const setPreventHide = (value: boolean) => {
    preventHide = value
  }

  const handleMouseDown = () => {
    preventHide = true
  }

  const handleBlur = ({ event }: { event: FocusEvent }) => {
    if (editor.isDestroyed) return
    if (preventHide) {
      preventHide = false
      return
    }

    if (event?.relatedTarget && tooltipRef.value?.contains(event.relatedTarget as Node)) return
    if (event?.relatedTarget && tooltipRef.value?.parentNode?.contains(event.relatedTarget as Node))
      return
    if (event?.relatedTarget === editor.view.dom) return

    isOpen.value = false
  }

  const handleFocus = () => {
    // 使用 nextTick 或 0ms 延迟确保编辑器状态已更新
    setTimeout(() => handleSelectionUpdate(), 0)
  }

  const handleDragStart = () => {
    isOpen.value = false
  }

  // 使用 debounce 包装 Resize 逻辑
  const debouncedResize = debounce(() => {
    if (isOpen.value && computeVirtualElement()) updatePosition()
  }, RESIZE_DELAY)

  const handleResize = () => {
    if (!isOpen.value) return
    debouncedResize()
  }

  const handleTransaction = ({ transaction: tr }: { transaction: any }) => {
    const meta = tr.getMeta('bubbleMenu')
    if (meta === 'updatePosition' && isOpen.value) {
      computeVirtualElement()
      updatePosition()
    }
  }

  // ==================== 生命周期 ====================
  onMounted(() => {
    editor.on('selectionUpdate', handleSelectionUpdate)
    editor.on('focus', handleFocus)
    editor.on('blur', handleBlur)
    editor.on('transaction', handleTransaction)
    editor.view.dom.addEventListener('dragstart', handleDragStart)
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)

    if (shouldShow() && computeVirtualElement()) {
      isOpen.value = true
      nextTick(() => updatePosition())
    }
  })

  onUnmounted(() => {
    debouncedUpdate.cancel()
    debouncedResize.cancel()

    editor.off('selectionUpdate', handleSelectionUpdate)
    editor.off('focus', handleFocus)
    editor.off('blur', handleBlur)
    editor.off('transaction', handleTransaction)
    // 安全地移除 DOM 监听器
    if (!editor.isDestroyed && editor.view && editor.view.dom) {
      editor.view.dom.removeEventListener('dragstart', handleDragStart)
    }
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('scroll', handleResize, true)
  })

  return {
    isOpen,
    actualPlacement,
    tooltipStyle,
    arrowStyle,
    updatePosition,
    getBaseDirection,
    handleMouseDown,
    setPreventHide,
  }
}
