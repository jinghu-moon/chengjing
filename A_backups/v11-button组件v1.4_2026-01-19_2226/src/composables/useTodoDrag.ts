import { ref } from 'vue'
import type { TodoItem } from './useTodos'
import { useTodos } from './useTodos'
import dayjs from 'dayjs'

export function useTodoDrag() {
  const { todos } = useTodos()
  const isDragging = ref(false)
  const draggedTodo = ref<TodoItem | null>(null)

  /**
   * 更新待办事项的日期
   * @param todo 待办事项对象
   * @param newDateStr 新的日期字符串 (YYYY-MM-DD)
   * @param keepTime 是否保留原有的时间部分
   */
  const updateTodoDate = (todo: TodoItem, newDateStr: string, keepTime: boolean = true) => {
    if (!todo.dueDate && !keepTime) {
      // 如果原本没有日期，直接设置为当天的开始时间
      todo.dueDate = dayjs(newDateStr).startOf('day').format('YYYY-MM-DD HH:mm')
      return
    }

    if (!todo.dueDate) {
      // 没有原日期且不保留时间，设置为新日期的中午12点
      todo.dueDate = dayjs(newDateStr).hour(12).minute(0).format('YYYY-MM-DD HH:mm')
      return
    }

    const oldDate = dayjs(todo.dueDate)
    const newDate = dayjs(newDateStr)

    if (keepTime) {
      // 保留原有的时分秒
      todo.dueDate = newDate
        .hour(oldDate.hour())
        .minute(oldDate.minute())
        .second(oldDate.second())
        .format('YYYY-MM-DD HH:mm')
    } else {
      // 不保留时间，设置为新日期的开始时间
      todo.dueDate = newDate.startOf('day').format('YYYY-MM-DD HH:mm')
    }
  }

  /**
   * 处理拖拽结束事件
   * 从 evt.to 获取目标容器的 data-date 属性来确定目标日期
   */
  const handleDragEnd = (evt: any) => {
    isDragging.value = false
    draggedTodo.value = null

    // evt.to 是目标容器，从它的 data-date 属性获取目标日期
    const toEl = evt.to as HTMLElement
    const targetDateStr = toEl?.dataset?.date

    // evt.item 包含被拖动元素的信息
    const itemEl = evt.item as HTMLElement
    const todoId = parseInt(itemEl?.dataset?.id || '', 10)

    console.log('[Drag End]', {
      todoId,
      targetDateStr,
      from: evt.from?.dataset?.date,
      to: evt.to?.dataset?.date,
    })

    if (!targetDateStr) {
      console.warn('[Drag End] No target date found on container:', toEl)
      return
    }

    if (!isNaN(todoId)) {
      const todo = todos.value.find(t => t.id === todoId)
      if (todo) {
        const oldDate = todo.dueDate ? dayjs(todo.dueDate).format('YYYY-MM-DD') : ''

        // 更新日期（保留原有时间）
        if (oldDate !== targetDateStr) {
          updateTodoDate(todo, targetDateStr, true)
        }
      }
    }
  }

  /**
   * 月视图拖拽配置
   */
  const getMonthDragOptions = () => ({
    animation: 200,
    group: 'todos',
    ghostClass: 'ghost-todo',
    chosenClass: 'chosen-todo',
    dragClass: 'dragging-todo',
    forceFallback: true,
    fallbackClass: 'fallback-todo',
    fallbackOnBody: true,
    scroll: true,
    scrollSensitivity: 100,
    scrollSpeed: 10,
    bubbleScroll: true,
    onStart: () => {
      isDragging.value = true
    },
    onEnd: handleDragEnd,
  })

  /**
   * 周视图拖拽配置
   */
  const getWeekDragOptions = () => ({
    animation: 200,
    group: 'week-todos',
    ghostClass: 'ghost-todo',
    chosenClass: 'chosen-todo',
    dragClass: 'dragging-todo',
    forceFallback: true,
    fallbackClass: 'fallback-todo',
    fallbackOnBody: true,
    scroll: true,
    scrollSensitivity: 100,
    scrollSpeed: 10,
    bubbleScroll: true,
    onStart: () => {
      isDragging.value = true
    },
    onEnd: handleDragEnd,
  })

  return {
    isDragging,
    draggedTodo,
    updateTodoDate,
    handleDragEnd,
    getMonthDragOptions,
    getWeekDragOptions,
  }
}
