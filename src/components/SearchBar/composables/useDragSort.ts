import { ref } from 'vue'
import type { DragData } from '../../SelectMenu/types'

// ==================== 类型定义 ====================

export interface DragState {
  /** 是否正在拖拽 */
  isDragging: boolean
  /** 拖拽源数据 */
  source: DragData | null
  /** 放置目标数据 */
  target: DragData | null
  /** 放置位置：在目标之前还是之后 */
  position: 'before' | 'after' | null
}

export interface UseDragSortOptions {
  /** 引擎移动回调 */
  onMoveEngine: (engineId: string, targetGroup: string, beforeEngineId?: string | null) => void
  /** 分组重排回调 */
  onReorderGroup: (fromGroup: string, beforeGroup: string | null) => void
}

// ==================== Composable ====================

export function useDragSort(options: UseDragSortOptions) {
  const dragState = ref<DragState>({
    isDragging: false,
    source: null,
    target: null,
    position: null,
  })

  // 拖拽阈值（像素），超过此距离才开始拖拽
  const DRAG_THRESHOLD = 5

  // 内部状态
  let startX = 0
  let startY = 0
  let offsetX = 0
  let offsetY = 0
  let ghostEl: HTMLElement | null = null
  let sourceEl: HTMLElement | null = null
  let scrollContainer: HTMLElement | null = null
  let pendingDragData: DragData | null = null
  let isDragStarted = false
  let previewEl: HTMLElement | null = null

  // ==================== 镜像体 (复用 drag.css: drag-mirror-proxy) ====================

  /** 创建跟随鼠标的镜像克隆 */
  function createGhost(el: HTMLElement) {
    const rect = el.getBoundingClientRect()
    const clone = el.cloneNode(true) as HTMLElement

    // 复用全局 drag.css 样式类
    clone.classList.add('drag-mirror-proxy')

    // 仅设置布局定位（视觉样式由 drag.css 控制）
    clone.style.width = `${rect.width}px`
    clone.style.height = `${rect.height}px`
    clone.style.left = `${rect.left}px`
    clone.style.top = `${rect.top}px`

    document.body.appendChild(clone)
    ghostEl = clone
  }

  /** 更新镜像位置 */
  function moveGhost(x: number, y: number) {
    if (!ghostEl) return
    ghostEl.style.left = `${x - offsetX}px`
    ghostEl.style.top = `${y - offsetY}px`
  }

  /** 销毁镜像 */
  function destroyGhost() {
    if (ghostEl) {
      ghostEl.remove()
      ghostEl = null
    }
  }

  // ==================== 放置目标检测 ====================

  /** 根据鼠标位置查找最近的放置目标 */
  function findDropTarget(x: number, y: number): { target: DragData; position: 'before' | 'after' } | null {
    if (!scrollContainer) return null

    const source = dragState.value.source
    if (!source) return null

    // 查找所有可放置的元素
    const items = scrollContainer.querySelectorAll('[data-drag-type]')
    let bestMatch: { el: HTMLElement; data: DragData; distance: number; position: 'before' | 'after' } | null = null

    for (const item of items) {
      const el = item as HTMLElement
      const type = el.dataset.dragType as 'engine' | 'group'
      const id = el.dataset.dragId || ''
      const group = el.dataset.dragGroup || ''

      // 不能放到自己身上
      if (type === source.type && id === source.id) continue

      // 分组只能拖到分组旁边
      if (source.type === 'group' && type !== 'group') continue

      const rect = el.getBoundingClientRect()

      // 引擎盒子（grid 布局）：判断左右
      if (type === 'engine') {
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
        const position: 'before' | 'after' = x < centerX ? 'before' : 'after'

        if (!bestMatch || dist < bestMatch.distance) {
          bestMatch = { el, data: { type, id, group }, distance: dist, position }
        }
      }

      // 分组 header：判断上下
      if (type === 'group') {
        const centerY = rect.top + rect.height / 2
        const dist = Math.abs(y - centerY)
        const position: 'before' | 'after' = y < centerY ? 'before' : 'after'

        if (!bestMatch || dist < bestMatch.distance) {
          bestMatch = { el, data: { type, id, group }, distance: dist, position }
        }
      }
    }

    // 限制检测范围：距离过远则不算
    if (bestMatch && bestMatch.distance < 80) {
      return { target: bestMatch.data, position: bestMatch.position }
    }

    return null
  }

  // ==================== 预览占位符 (复用 drag.css: drop-preview-placeholder) ====================

  /** 移除预览占位符 */
  function removePreview() {
    if (previewEl) {
      previewEl.remove()
      previewEl = null
    }
  }

  /** 在目标位置插入预览占位符 */
  function updatePreview(target: DragData, position: 'before' | 'after') {
    if (!scrollContainer || !sourceEl) return

    const targetEl = scrollContainer.querySelector(
      `[data-drag-type="${target.type}"][data-drag-id="${target.id}"]`
    ) as HTMLElement
    if (!targetEl) return

    // 复用已有 preview 或创建新的
    if (!previewEl) {
      const rect = sourceEl.getBoundingClientRect()
      previewEl = sourceEl.cloneNode(true) as HTMLElement
      previewEl.classList.remove('drag-source-ghost')
      previewEl.classList.add('drop-preview-placeholder')
      // 移除拖拽属性，防止被 findDropTarget 误检测
      previewEl.removeAttribute('data-drag-type')
      previewEl.removeAttribute('data-drag-id')
      previewEl.removeAttribute('data-drag-group')
      previewEl.style.width = `${rect.width}px`
      previewEl.style.height = `${rect.height}px`
    }

    // 插入到目标之前或之后
    if (position === 'before') {
      targetEl.parentNode?.insertBefore(previewEl, targetEl)
    } else {
      targetEl.parentNode?.insertBefore(previewEl, targetEl.nextSibling)
    }
  }

  // ==================== Pointer 事件处理 ====================

  /** 在 pointerdown 时调用 */
  function handlePointerDown(e: PointerEvent, data: DragData, el: HTMLElement, container: HTMLElement) {
    // 只响应左键
    if (e.button !== 0) return
    // 不要拦截 checkbox 点击
    if ((e.target as HTMLElement).closest('.grid-checkbox, .type-icon')) return

    startX = e.clientX
    startY = e.clientY
    pendingDragData = data
    sourceEl = el
    scrollContainer = container
    isDragStarted = false

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }

  /** pointermove：检测是否超过阈值，然后更新 */
  function handlePointerMove(e: PointerEvent) {
    const dx = e.clientX - startX
    const dy = e.clientY - startY

    if (!isDragStarted) {
      // 未超过阈值，不开始拖拽
      if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return

      // 超过阈值，正式开始拖拽
      isDragStarted = true
      dragState.value = {
        isDragging: true,
        source: pendingDragData,
        target: null,
        position: null,
      }

      if (sourceEl) {
        // 计算偏移量
        const rect = sourceEl.getBoundingClientRect()
        offsetX = e.clientX - rect.left
        offsetY = e.clientY - rect.top

        // 源元素：半透明 + 虚线 (drag.css)
        sourceEl.classList.add('drag-source-ghost')
        createGhost(sourceEl)
      }

      document.body.classList.add('body-grabbing')
      e.preventDefault()
      return
    }

    // 正在拖拽中
    e.preventDefault()
    moveGhost(e.clientX, e.clientY)

    // 检测放置目标
    const result = findDropTarget(e.clientX, e.clientY)
    if (result) {
      dragState.value.target = result.target
      dragState.value.position = result.position
      updatePreview(result.target, result.position)
      ghostEl?.classList.add('drag-mirror-can-drop')
    } else {
      dragState.value.target = null
      dragState.value.position = null
      removePreview()
      ghostEl?.classList.remove('drag-mirror-can-drop')
    }
  }

  /** pointerup：执行放置或取消 */
  function handlePointerUp(_e: PointerEvent) {
    document.removeEventListener('pointermove', handlePointerMove)
    document.removeEventListener('pointerup', handlePointerUp)

    if (isDragStarted && dragState.value.source && dragState.value.target) {
      const { source, target, position } = dragState.value

      if (source!.type === 'engine' && target!.type === 'engine') {
        // 引擎 → 引擎：移动到目标引擎之前或之后
        if (position === 'after') {
          options.onMoveEngine(source!.id, target!.group, getNextEngineId(target!.id))
        } else {
          options.onMoveEngine(source!.id, target!.group, target!.id)
        }
      } else if (source!.type === 'engine' && target!.type === 'group') {
        // 引擎 → 分组 header：移动到该分组末尾
        options.onMoveEngine(source!.id, target!.id, null)
      } else if (source!.type === 'group' && target!.type === 'group') {
        // 分组 → 分组
        if (position === 'after') {
          options.onReorderGroup(source!.id, getNextGroupId(target!.id))
        } else {
          options.onReorderGroup(source!.id, target!.id)
        }
      }
    }

    // 清理
    cleanup()
  }

  /** 获取目标引擎之后的下一个引擎 ID */
  function getNextEngineId(targetId: string): string | null {
    if (!scrollContainer) return null
    const items = scrollContainer.querySelectorAll('[data-drag-type="engine"]')
    let found = false
    for (const item of items) {
      if (found) return (item as HTMLElement).dataset.dragId || null
      if ((item as HTMLElement).dataset.dragId === targetId) found = true
    }
    return null
  }

  /** 获取目标分组之后的下一个分组 ID */
  function getNextGroupId(targetId: string): string | null {
    if (!scrollContainer) return null
    const items = scrollContainer.querySelectorAll('[data-drag-type="group"]')
    let found = false
    for (const item of items) {
      if (found) return (item as HTMLElement).dataset.dragId || null
      if ((item as HTMLElement).dataset.dragId === targetId) found = true
    }
    return null
  }

  /** 清理所有拖拽状态 */
  function cleanup() {
    isDragStarted = false
    pendingDragData = null

    // 移除源元素样式
    if (sourceEl) {
      sourceEl.classList.remove('drag-source-ghost')
      sourceEl = null
    }

    destroyGhost()
    removePreview()
    document.body.classList.remove('body-grabbing')

    dragState.value = {
      isDragging: false,
      source: null,
      target: null,
      position: null,
    }
  }

  return {
    dragState,
    handlePointerDown,
  }
}
