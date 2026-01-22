import { ref } from 'vue'
import type { Shortcut } from '../../../types'
import { defaultShortcuts } from '../config'

export function useShortcutData() {
  const shortcuts = ref<Shortcut[]>([])

  const loadData = () => {
    const saved = localStorage.getItem('shortcuts')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        shortcuts.value = parsed.map((item: any) => ({
          ...item,
          id: item.id || Date.now() + Math.random(),
          type: item.type || 'app',
          children: item.children || [],
        }))
      } catch (e) {
        shortcuts.value = [...defaultShortcuts]
      }
    } else {
      shortcuts.value = [...defaultShortcuts]
    }
  }

  const saveData = () => {
    try {
      localStorage.setItem('shortcuts', JSON.stringify(shortcuts.value))
    } catch (e) {
      console.error(e)
    }
  }

  const resetToDemo = () => {
    if (confirm('重置布局？')) {
      shortcuts.value = JSON.parse(JSON.stringify(defaultShortcuts))
      saveData()
      return true
    }
    return false
  }

  const createFolder = () => {
    shortcuts.value.push({
      id: Date.now(),
      type: 'folder',
      name: '新文件夹',
      children: [],
      color: 'rgba(255,255,255,0.15)',
    })
    saveData()
  }

  return {
    shortcuts,
    loadData,
    saveData,
    resetToDemo,
    createFolder,
  }
}
