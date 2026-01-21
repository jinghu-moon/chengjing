import { ref, onUnmounted } from 'vue'
import { useTodos } from './useTodos'
import dayjs from 'dayjs'

/**
 * 轻量级拖拽 Hook (样式分离版)
 *
 * 依赖样式: src/style/drag.css
 *
 * 拖拽流程：
 * 1. startDrag (mousedown) - 创建克隆镜像，原地元素变淡
 * 2. onDrag (mousemove) - 镜像跟随鼠标，检测放置目标，插入预览
 * 3. endDrag (mouseup) - 更新数据，清理状态
 */
export function useSimpleDrag() {
  const { todos } = useTodos()

  // --- 响应式状态 ---
  const isDragging = ref(false)
  const dropTargetDate = ref<string | null>(null)
  const draggedTodoId = ref<number | null>(null)

  // --- 内部变量 (无需响应式) ---
  let cloneElement: HTMLElement | null = null
  let sourceElement: HTMLElement | null = null
  let dropPreviewElement: HTMLElement | null = null // 目标盒子内的预览占位符
  let currentDropTarget: HTMLElement | null = null // 当前目标盒子
  let offsetX = 0
  let offsetY = 0

  /**
   * 创建目标盒子内的预览占位符
   * 只在周视图使用，月视图不插入预览（避免撑大格子）
   */
  const createDropPreview = (dropTarget: HTMLElement) => {
    if (!sourceElement) return

    // 如果已存在预览，先移除
    removeDropPreview()

    // 月视图的日期格子不插入预览，只高亮即可
    if (dropTarget.classList.contains('day-cell')) {
      currentDropTarget = dropTarget
      return
    }

    // 获取原始元素的实际宽度
    const sourceRect = sourceElement.getBoundingClientRect()

    // 克隆原始元素作为预览
    dropPreviewElement = sourceElement.cloneNode(true) as HTMLElement
    dropPreviewElement.classList.remove('drag-source-ghost')
    dropPreviewElement.classList.add('drop-preview-placeholder')

    // 设置固定宽度，防止被 flex 拉伸
    dropPreviewElement.style.width = `${sourceRect.width}px`
    dropPreviewElement.style.minWidth = `${sourceRect.width}px`
    dropPreviewElement.style.maxWidth = `${sourceRect.width}px`
    dropPreviewElement.style.flex = 'none'

    // 查找目标盒子内的内容区域（周视图）
    const contentArea =
      dropTarget.querySelector('.week-todo-grid') ||
      dropTarget.querySelector('.week-row-content') ||
      dropTarget

    contentArea.appendChild(dropPreviewElement)
    currentDropTarget = dropTarget
  }

  /**
   * 移除预览占位符
   */
  const removeDropPreview = () => {
    if (dropPreviewElement) {
      dropPreviewElement.remove()
      dropPreviewElement = null
    }
    currentDropTarget = null
  }

  /**
   * 1. 开始拖拽 (Start)
   */
  const startDrag = (e: MouseEvent, todoId: number, _fromDate?: string) => {
    if (e.button !== 0) return

    e.preventDefault()
    e.stopPropagation()

    const target = e.currentTarget as HTMLElement
    if (!target) return

    // A. 锁定状态
    isDragging.value = true
    draggedTodoId.value = todoId
    sourceElement = target

    // B. 添加样式类：让原元素变淡
    sourceElement.classList.add('drag-source-ghost')

    // C. 计算几何坐标
    const rect = target.getBoundingClientRect()
    offsetX = e.clientX - rect.left
    offsetY = e.clientY - rect.top

    // D. 创建克隆镜像
    cloneElement = target.cloneNode(true) as HTMLElement
    cloneElement.classList.add('drag-mirror-proxy')

    // JS 仅负责必要的布局定位
    cloneElement.style.width = `${rect.width}px`
    cloneElement.style.height = `${rect.height}px`
    cloneElement.style.left = `${rect.left}px`
    cloneElement.style.top = `${rect.top}px`

    document.body.appendChild(cloneElement)

    // E. 全局设置
    document.body.classList.add('body-grabbing')

    // F. 开始监听移动和松开
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', endDrag)
  }

  /**
   * 2. 拖拽过程 (Move)
   */
  const onDrag = (e: MouseEvent) => {
    if (!cloneElement) return

    // 更新镜像位置
    cloneElement.style.left = `${e.clientX - offsetX}px`
    cloneElement.style.top = `${e.clientY - offsetY}px`

    // 临时隐藏镜像，以便检测下方元素
    cloneElement.style.display = 'none'
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY)
    cloneElement.style.display = ''

    if (!elementBelow) {
      dropTargetDate.value = null
      cloneElement.classList.remove('drag-mirror-can-drop')
      removeDropPreview()
      return
    }

    // 查找最近的日期格子
    const dropTarget = elementBelow.closest<HTMLElement>('[data-date]')

    if (dropTarget) {
      dropTargetDate.value = dropTarget.dataset.date || null
      cloneElement.classList.add('drag-mirror-can-drop')

      // 如果目标盒子变了，更新预览
      if (currentDropTarget !== dropTarget) {
        createDropPreview(dropTarget)
      }
    } else {
      dropTargetDate.value = null
      cloneElement.classList.remove('drag-mirror-can-drop')
      removeDropPreview()
    }
  }

  /**
   * 3. 结束拖拽 (End)
   */
  const endDrag = () => {
    // 移除监听
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', endDrag)
    document.body.classList.remove('body-grabbing')

    // 保存当前状态供动画回调使用
    const todoId = draggedTodoId.value
    const targetDateStr = dropTargetDate.value
    const source = sourceElement
    const preview = dropPreviewElement

    /**
     * 更新 Todo 数据的函数
     */
    const updateTodoData = () => {
      if (todoId && targetDateStr) {
        const todo = todos.value.find(t => t.id === todoId)
        if (todo) {
          const targetDate = dayjs(targetDateStr)

          if (todo.dueDate) {
            const oldTime = dayjs(todo.dueDate)
            todo.dueDate = targetDate
              .hour(oldTime.hour())
              .minute(oldTime.minute())
              .format('YYYY-MM-DD HH:mm')
          } else {
            todo.dueDate = targetDate.hour(12).minute(0).format('YYYY-MM-DD HH:mm')
          }

          console.log(`✅ Todo 移动成功: ${todo.dueDate}`)
        }
      }
    }

    // 有有效目标时
    if (cloneElement && targetDateStr) {
      // 周视图：有预览，播放飞入动画
      if (preview) {
        const previewRect = preview.getBoundingClientRect()

        // 添加飞入动画类
        cloneElement.classList.add('drag-fly-to-target')
        cloneElement.style.left = `${previewRect.left}px`
        cloneElement.style.top = `${previewRect.top}px`
        cloneElement.style.width = `${previewRect.width}px`
        cloneElement.style.height = `${previewRect.height}px`

        // 动画结束后：清理 + 更新数据
        const clone = cloneElement
        setTimeout(() => {
          clone?.remove()
          preview?.remove()
          if (source) {
            source.classList.remove('drag-source-ghost')
          }
          updateTodoData()
        }, 200)
      } else {
        // 月视图：无预览，直接更新数据
        cloneElement.remove()
        if (source) {
          source.classList.remove('drag-source-ghost')
        }
        updateTodoData()
      }

      cloneElement = null
      sourceElement = null
      dropPreviewElement = null
      currentDropTarget = null
    } else {
      // 没有有效目标，直接清理
      if (cloneElement) {
        cloneElement.remove()
        cloneElement = null
      }
      if (sourceElement) {
        sourceElement.classList.remove('drag-source-ghost')
        sourceElement = null
      }
      removeDropPreview()
    }

    // 重置状态
    isDragging.value = false
    draggedTodoId.value = null
    dropTargetDate.value = null
  }

  // 组件卸载时安全清理
  onUnmounted(() => {
    if (cloneElement) cloneElement.remove()
    removeDropPreview()
    document.body.classList.remove('body-grabbing')
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', endDrag)
  })

  return {
    isDragging,
    dropTargetDate,
    startDrag,
  }
}
