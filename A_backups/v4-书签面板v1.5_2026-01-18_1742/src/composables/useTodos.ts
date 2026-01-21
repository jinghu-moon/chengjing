import { ref, watch, computed } from 'vue'
import dayjs from 'dayjs'

export interface TodoItem {
  id: number
  text: string
  done: boolean
  description?: string
  priority?: 'low' | 'medium' | 'high'
  tag?: string
  dueDate?: string
  deleting?: boolean
  justCompleted?: boolean
}

// ========== 全局单例状态 ==========
const todos = ref<TodoItem[]>([])
const isInitialized = ref(false)

/**
 * [性能核心] 建立日期索引 Map
 * 自动缓存，O(1) 查找
 */
const todosMap = computed(() => {
  const map = new Map<string, TodoItem[]>()

  todos.value.forEach(t => {
    if (!t.dueDate) return

    // [新增] 解析日期对象
    const d = dayjs(t.dueDate)

    // [新增] 健壮性检查：防止非法日期导致 Key 变成 "Invalid Date"
    if (!d.isValid()) return

    // 格式化 Key
    const dateKey = d.format('YYYY-MM-DD')

    if (!map.has(dateKey)) {
      map.set(dateKey, [])
    }
    map.get(dateKey)!.push(t)
  })

  return map
})

export function useTodos() {
  const initTodos = () => {
    if (isInitialized.value) return

    const saved = localStorage.getItem('todos')
    if (saved) {
      try {
        todos.value = JSON.parse(saved)
      } catch (e) {
        console.error('Todo数据解析失败:', e)
        todos.value = []
      }
    }

    watch(
      todos,
      newVal => {
        localStorage.setItem('todos', JSON.stringify(newVal))
      },
      { deep: true }
    )

    isInitialized.value = true
  }

  /**
   * 根据日期获取未完成的任务
   * 时间复杂度 O(1)
   */
  const getTodosByDate = (dateStr: string) => {
    const list = todosMap.value.get(dateStr)

    if (!list) return []

    // [安全核心] 返回浅拷贝，防止外部 sort/reverse 污染索引
    return list.slice()
  }

  return {
    todos,
    initTodos,
    getTodosByDate,
  }
}
