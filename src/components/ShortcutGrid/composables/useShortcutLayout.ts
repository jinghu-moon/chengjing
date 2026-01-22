import { ref, computed, watch, type Ref } from 'vue'
import type { Shortcut } from '../../../types'

export function useShortcutLayout(
  shortcuts: Ref<Shortcut[]>,
  settings: any,
  saveData: () => void
) {
  const pagedShortcuts = ref<Shortcut[][]>([])

  const pageCapacity = computed(() => settings.gridRows * settings.gridCols)

  const getItemSlots = (item: Shortcut) => {
    if (item.type === 'app') return 1
    const [fc, fr] = settings.folderPreviewMode.split('x').map(Number)

    if (settings.compressLargeFolders) {
      const actualCols = Math.min(fc, settings.gridCols)
      const actualRows = Math.min(fr, settings.gridRows)
      return actualCols * actualRows
    } else {
      return fc * fr
    }
  }

  const reflowShortcuts = () => {
    const flat = shortcuts.value
    const maxSlots = pageCapacity.value
    const newPages: Shortcut[][] = []

    let currentPageItems: Shortcut[] = []
    let currentSlotsUsed = 0

    flat.forEach(item => {
      const itemCost = getItemSlots(item)
      if (currentSlotsUsed + itemCost > maxSlots) {
        newPages.push(currentPageItems)
        currentPageItems = []
        currentSlotsUsed = 0
      }
      currentPageItems.push(item)
      currentSlotsUsed += itemCost
    })

    if (currentPageItems.length > 0) newPages.push(currentPageItems)
    if (newPages.length === 0 || currentSlotsUsed + 1 > maxSlots) newPages.push([])

    pagedShortcuts.value = newPages
  }

  const syncFromPages = () => {
    const flat = pagedShortcuts.value.flat()
    if (JSON.stringify(flat) !== JSON.stringify(shortcuts.value)) {
      shortcuts.value = flat
      saveData()
    }
  }

  // 监听设置变化自动重新布局
  watch(
    [
      () => settings.gridRows,
      () => settings.gridCols,
      () => settings.folderPreviewMode,
      () => settings.compressLargeFolders,
    ],
    () => {
      reflowShortcuts()
    }
  )

  return {
    pagedShortcuts,
    pageCapacity,
    getItemSlots,
    reflowShortcuts,
    syncFromPages,
  }
}
