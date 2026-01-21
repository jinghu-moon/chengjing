import { ref, nextTick } from 'vue'
import type { DialogOptions, DialogInstance } from '../types'

// 全局状态：存储当前激活的对话框实例
const dialogs = ref<DialogInstance[]>([])

export function useDialog() {
  /**
   * 生成唯一 ID
   */
  const generateId = () => `dialog-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  /**
   * 打开对话框 (核心方法)
   * 返回一个 Promise,当点击确认时 resolve(true),取消时 resolve(false)
   */
  const open = (options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const id = generateId()

      const instance: DialogInstance = {
        ...options,
        id,
        visible: false, // 初始为 false,下一帧设为 true 以触发进入动画
        resolve,
        reject,
        // 拦截 onOk 和 onCancel 以处理 Promise
        onOk: async () => {
          try {
            if (options.onOk) await options.onOk()
            close(id, true)
          } catch (e) {
            console.error('Dialog onOk error:', e)
            // loading 状态通常由组件内部控制,这里只处理关闭
          }
        },
        onCancel: () => {
          if (options.onCancel) options.onCancel()
          close(id, false)
        },
      }

      dialogs.value.push(instance)

      // 使用 nextTick 确保 DOM 更新后再显示,触发进入动画
      nextTick(() => {
        const current = dialogs.value.find(d => d.id === id)
        if (current) {
          current.visible = true
        }
      })
    })
  }

  /**
   * 关闭对话框
   * @param id 实例 ID
   * @param result Promise resolve 的结果 (true=confirmed, false=cancelled)
   */
  const close = (id: string, result: boolean = false) => {
    const index = dialogs.value.findIndex(d => d.id === id)
    if (index === -1) return

    const instance = dialogs.value[index]

    // 1. 设置 visible = false 触发离开动画
    instance.visible = false

    // 2. 解决 Promise
    if (instance.resolve) instance.resolve(result)

    // 3. 延迟移除实例（等待动画结束）
    setTimeout(() => {
      const idx = dialogs.value.findIndex(d => d.id === id)
      if (idx !== -1) dialogs.value.splice(idx, 1)
    }, 300) // 对应 CSS duration
  }

  /**
   * 移除实例 (在动画结束后调用)
   */
  const remove = (id: string) => {
    const index = dialogs.value.findIndex(d => d.id === id)
    if (index !== -1) dialogs.value.splice(index, 1)
  }

  // 快捷方法
  const confirm = (options: DialogOptions) =>
    open({ type: 'confirm', showCancelBtn: true, ...options })
  const info = (options: DialogOptions) => open({ type: 'info', showCancelBtn: false, ...options })
  const success = (options: DialogOptions) =>
    open({ type: 'success', showCancelBtn: false, ...options })
  const warning = (options: DialogOptions) =>
    open({ type: 'warning', showCancelBtn: false, ...options })
  const error = (options: DialogOptions) =>
    open({ type: 'error', showCancelBtn: false, ...options })

  return {
    dialogs,
    open,
    close,
    remove,
    confirm,
    info,
    success,
    warning,
    error,
  }
}
