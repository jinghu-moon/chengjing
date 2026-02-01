import { ref, computed, watch, type Ref } from 'vue'
import type { Shortcut, Settings } from '../../../types'

export function useShortcutLayout(
  shortcuts: Ref<Shortcut[]>,
  settings: Settings,
  saveData: () => void
) {
  const pagedShortcuts = ref<Shortcut[][]>([])

  const pageCapacity = computed(() => settings.layoutGridRows * settings.layoutGridCols)

  /**
   * 计算单个 item 占用的槽位数
   * 支持每个文件夹独立的 folderMode
   */
  const getItemSlots = (item: Shortcut) => {
    if (item.type === 'app') return 1

    // 优先使用 item 自身的 folderMode，否则用全局默认
    const mode = item.folderMode || settings.folderDefaultMode || settings.folderPreviewMode
    const [r, c] = mode.split('x').map(Number)

    // 1x8 扁平化适配：桌面只有 1 行时，强制高度为 1
    const actualR = settings.layoutGridRows === 1 ? 1 : Math.min(r, settings.layoutGridRows)
    const actualC = Math.min(c, settings.layoutGridCols)

    return actualR * actualC
  }

  /**
   * 重新计算分页布局
   */
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

  /**
   * 从分页数据同步回主数据
   */
  const syncFromPages = () => {
    const flat = pagedShortcuts.value.flat()
    if (JSON.stringify(flat) !== JSON.stringify(shortcuts.value)) {
      shortcuts.value = flat
      saveData()
    }
  }

  // 监听设置变化自动重新布局
  // 添加 immediate: false 避免初始化时立即触发
  // 添加 flush: 'post' 确保在 DOM 更新后执行
  watch(
    [
      () => settings.layoutGridRows,
      () => settings.layoutGridCols,
      () => settings.folderPreviewMode,
      () => settings.folderDefaultMode,
      () => settings.folderCompressLarge,
    ],
    () => {
      reflowShortcuts()
    },
    {
      flush: 'post',
      deep: false
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
