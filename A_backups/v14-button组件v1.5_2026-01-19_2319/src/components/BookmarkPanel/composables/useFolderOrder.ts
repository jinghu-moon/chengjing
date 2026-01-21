import { ref } from 'vue'

const STORAGE_KEY = 'bookmark-folder-order'

/**
 * 文件夹排序持久化 Composable
 *
 * 用于保存和恢复用户自定义的文件夹显示顺序
 */
export function useFolderOrder() {
  const folderOrder = ref<string[]>([])

  // 从 localStorage 加载顺序
  const loadOrder = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        folderOrder.value = JSON.parse(saved)
      }
    } catch (e) {
      console.warn('[useFolderOrder] Failed to load order:', e)
      folderOrder.value = []
    }
  }

  // 保存顺序到 localStorage
  const saveOrder = (order: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
      folderOrder.value = order
    } catch (e) {
      console.warn('[useFolderOrder] Failed to save order:', e)
    }
  }

  // 重置顺序
  const resetOrder = () => {
    localStorage.removeItem(STORAGE_KEY)
    folderOrder.value = []
  }

  // 初始化时加载
  loadOrder()

  return {
    folderOrder,
    saveOrder,
    resetOrder,
  }
}
