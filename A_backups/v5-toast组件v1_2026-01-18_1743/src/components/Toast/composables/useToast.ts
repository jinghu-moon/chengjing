import { ref, reactive, computed } from 'vue'
import type { ToastInstance, ToastOptions, ToastConfig, ToastPosition } from '../types'

// ==========================================
// 全局单例状态 (Singleton State)
// ==========================================

// 1. 消息队列
const toasts = ref<ToastInstance[]>([])

// 2. 全局配置
const config = reactive<ToastConfig>({
  position: 'top-right', // 默认位置
  maxCount: 5, // 最大存在数（内存中）
  defaultDuration: 3000,
  defaultClosable: true,
})

// 3. 定时器管理 (防止内存泄漏)
const timers = new Map<string, number>()

// 4. ID 生成器
let idCounter = 0
function generateId(): string {
  return `toast-${Date.now()}-${idCounter++}`
}

// ==========================================
// Composable Logic
// ==========================================

export function useToast() {
  /**
   * 移除 Toast
   */
  const remove = (id: string) => {
    // 清理定时器
    const timer = timers.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.delete(id)
    }

    // 从数组中移除
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  /**
   * 添加 Toast (核心方法)
   */
  const add = (options: ToastOptions): string => {
    const id = generateId()
    const duration = options.duration ?? config.defaultDuration

    // --- 1. 简单防抖 ---
    // 防止短时间内重复报错 (500ms 内相同消息不重复添加)
    const lastToast = toasts.value[toasts.value.length - 1]
    if (
      lastToast &&
      lastToast.message === options.message &&
      Date.now() - lastToast.createdAt < 500
    ) {
      return lastToast.id
    }

    // --- 2. 溢出处理 ---
    // 保持内存中最多只存 maxCount 个，移除最早的
    if (toasts.value.length >= config.maxCount) {
      toasts.value.shift() // 移除头部 (最早的)
    }

    const toast: ToastInstance = {
      id,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      icon: options.icon,
      closable: options.closable ?? config.defaultClosable,
      action: options.action,
      duration,
      createdAt: Date.now(),
      isVisible: true,
    }

    toasts.value.push(toast)

    // 设置自动消失定时器
    if (duration > 0) {
      const timer = window.setTimeout(() => {
        remove(id)
      }, duration)
      timers.set(id, timer)
    }

    return id
  }

  /**
   * 清空所有
   */
  const clear = () => {
    timers.forEach(timer => clearTimeout(timer))
    timers.clear()
    toasts.value = []
  }

  /**
   * 设置位置
   */
  const setPosition = (newPosition: ToastPosition) => {
    config.position = newPosition
  }

  // --- 语法糖 ---

  const success = (message: string, options?: Partial<ToastOptions>) =>
    add({ message, type: 'success', ...options })

  const error = (message: string, options?: Partial<ToastOptions>) =>
    add({ message, type: 'error', duration: 5000, ...options })

  const warning = (message: string, options?: Partial<ToastOptions>) =>
    add({ message, type: 'warning', ...options })

  const info = (message: string, options?: Partial<ToastOptions>) =>
    add({ message, type: 'info', ...options })

  return {
    // 状态
    toasts,
    config,
    // [关键] 暴露计算属性 position，解决 index.vue 类型报错
    position: computed(() => config.position),

    // 方法
    add,
    remove,
    clear,
    setPosition,

    // 快捷调用
    success,
    error,
    warning,
    info,
  }
}
