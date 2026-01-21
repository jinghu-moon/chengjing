import { computed, nextTick, toValue, ref, type Ref, type ComputedRef } from 'vue'
import { GRID_COLUMNS, isSelectOption, isValidOption, type OptionItem } from '../types'

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

// ==================== 类型定义 ====================
interface UseKeyboardNavOptions {
  options: Ref<OptionItem[]>
  layout: Ref<'list' | 'grid'>
  isOpen: Ref<boolean>
  focusedIndex: Ref<number>
  disabled: Ref<boolean>
  modelValue: Ref<string>
  dropdownScrollRef: MaybeRef<HTMLElement | null>
  onSelect: (value: string) => void
  // [新增] 是否禁用 Type-ahead (首字母快速跳转)
  // 当开启搜索模式时，需要禁用此功能，否则用户无法输入字符
  disableTypeAhead?: Ref<boolean>
}

// ==================== 导出 Composable ====================
export function useKeyboardNav({
  options,
  layout,
  isOpen,
  focusedIndex,
  disabled,
  modelValue,
  dropdownScrollRef,
  onSelect,
  // [新增] 默认为 false (启用)
  disableTypeAhead = ref(false),
}: UseKeyboardNavOptions) {
  // ==================== 滚动到聚焦项 ====================
  const scrollToFocused = () => {
    nextTick(() => {
      const scrollEl = toValue(dropdownScrollRef)
      if (!scrollEl) return
      const activeItem = scrollEl.querySelector('.dropdown-item.focused') as HTMLElement
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    })
  }

  // ==================== 获取选项 2D 坐标映射 ====================
  const getOptionCoords = () => {
    let currentRow = 0
    let currentCol = 0

    return options.value.map(opt => {
      const isDivider = opt.value === 'divider'

      if (isDivider) {
        if (currentCol !== 0) {
          currentRow++
          currentCol = 0
        }
        const coords = { row: currentRow, col: 0, isDivider: true }
        currentRow++
        return coords
      } else {
        const coords = { row: currentRow, col: currentCol, isDivider: false }
        currentCol++
        if (currentCol >= GRID_COLUMNS) {
          currentCol = 0
          currentRow++
        }
        return coords
      }
    })
  }

  // ==================== 网格元数据计算 ====================
  const gridMetadata = computed(() => {
    if (layout.value !== 'grid') return null

    const coords = getOptionCoords()
    const rows = new Map<number, { index: number; col: number }[]>()

    coords.forEach((coord, idx) => {
      if (!coord.isDivider && isValidOption(options.value, idx)) {
        if (!rows.has(coord.row)) rows.set(coord.row, [])
        rows.get(coord.row)!.push({ index: idx, col: coord.col })
      }
    })

    for (const items of rows.values()) {
      items.sort((a, b) => a.col - b.col)
    }

    const sortedRows = Array.from(rows.keys()).sort((a, b) => a - b)
    return { rows, sortedRows, coords }
  })

  // ==================== 方向键导航 ====================
  const navigateOptions = (
    direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | string
  ) => {
    const len = options.value.length
    if (len === 0) return

    // Type-ahead 搜索（单字符）
    if (typeof direction === 'string' && direction.length === 1) {
      const char = direction.toLowerCase()
      const match = options.value.findIndex(opt => {
        if (!isSelectOption(opt) || opt.disabled) return false
        return opt.label?.toLowerCase().startsWith(char)
      })
      if (match !== -1) {
        focusedIndex.value = match
        scrollToFocused()
      }
      return
    }

    // 初始聚焦逻辑
    if (focusedIndex.value === -1) {
      const firstValid = options.value.findIndex((_, i) => isValidOption(options.value, i))
      if (firstValid !== -1) {
        focusedIndex.value = firstValid
        scrollToFocused()
      }
      return
    }

    let targetIndex = -1

    // 线性导航（列表全方向 + 网格左右）
    const isLinear =
      layout.value === 'list' || direction === 'ArrowLeft' || direction === 'ArrowRight'

    if (isLinear) {
      const step = direction === 'ArrowRight' || direction === 'ArrowDown' ? 1 : -1
      for (let i = 1; i < len; i++) {
        const nextIdx = (focusedIndex.value + i * step + len) % len
        if (isValidOption(options.value, nextIdx)) {
          targetIndex = nextIdx
          break
        }
      }
    }
    // 网格模式下的上下导航（最近列原则）
    else if (gridMetadata.value) {
      const { rows, sortedRows, coords } = gridMetadata.value
      const currentCoord = coords[focusedIndex.value]
      const currentRowIndex = sortedRows.indexOf(currentCoord.row)
      const totalRows = sortedRows.length
      const isDown = direction === 'ArrowDown'

      for (let i = 1; i < totalRows; i++) {
        const nextRowIdx = (currentRowIndex + (isDown ? i : -i) + totalRows) % totalRows
        const targetRowKey = sortedRows[nextRowIdx]
        const candidates = rows.get(targetRowKey)

        if (!candidates || candidates.length === 0) continue

        const closest = candidates.reduce((best, curr) =>
          Math.abs(curr.col - currentCoord.col) < Math.abs(best.col - currentCoord.col)
            ? curr
            : best
        )

        if (closest.index !== focusedIndex.value) {
          targetIndex = closest.index
          break
        }
      }
    }

    if (targetIndex !== -1 && targetIndex !== focusedIndex.value) {
      focusedIndex.value = targetIndex
      scrollToFocused()
    }
  }

  // ==================== 键盘事件处理 ====================
  const handleKeydown = (e: KeyboardEvent) => {
    if (disabled.value) return

    const prevent = () => e.preventDefault()

    switch (e.key) {
      case 'Enter':
      case ' ':
        // 如果是空格键，且正在输入搜索词（disableTypeAhead=true），则不应阻止默认行为（输入空格）
        // 但如果是在选择模式，空格通常用于选择。
        // 这里为了兼容性，如果是搜索模式，建议空格键交给 Input 处理，除非 focusedIndex 有值且下拉框打开
        // 简单处理：搜索模式下，Input 会捕获空格。如果是 Input 冒泡上来的空格，我们通常不需要在这里处理选择
        // 除非我们希望回车选中。

        // 针对 Enter 键，始终处理选择
        if (e.key === 'Enter') {
          prevent()
          if (!isOpen.value) {
            isOpen.value = true
          } else if (focusedIndex.value >= 0) {
            const opt = options.value[focusedIndex.value]
            if (isSelectOption(opt) && !opt.disabled) {
              onSelect(opt.value)
            }
          }
          return
        }

        // 针对空格键：如果是搜索模式，忽略（让 Input 处理）；否则处理选择
        if (e.key === ' ' && !disableTypeAhead.value) {
          prevent()
          if (!isOpen.value) {
            isOpen.value = true
          } else if (focusedIndex.value >= 0) {
            const opt = options.value[focusedIndex.value]
            if (isSelectOption(opt) && !opt.disabled) {
              onSelect(opt.value)
            }
          }
        }
        break

      case 'Escape':
        if (isOpen.value) {
          prevent()
          isOpen.value = false
        }
        break

      case 'Tab':
        if (isOpen.value) {
          isOpen.value = false
        }
        break

      case 'ArrowDown':
      case 'ArrowUp':
      case 'ArrowLeft':
      case 'ArrowRight':
        prevent()
        if (!isOpen.value) {
          isOpen.value = true
        }
        navigateOptions(e.key)
        break

      case 'Home':
        prevent()
        if (isOpen.value) {
          const first = options.value.findIndex((_, i) => isValidOption(options.value, i))
          if (first !== -1) {
            focusedIndex.value = first
            scrollToFocused()
          }
        }
        break

      case 'End':
        prevent()
        if (isOpen.value) {
          let last = -1
          for (let i = options.value.length - 1; i >= 0; i--) {
            if (isValidOption(options.value, i)) {
              last = i
              break
            }
          }
          if (last !== -1) {
            focusedIndex.value = last
            scrollToFocused()
          }
        }
        break

      default:
        // [核心修复] 如果禁用了 Type-ahead (例如在搜索模式下)，直接返回
        // 这样字符键就能被 Input 正常捕获，而不会被 preventDefault
        if (toValue(disableTypeAhead)) return

        // Type-ahead：捕获所有可打印单字符
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          prevent()
          if (!isOpen.value) {
            isOpen.value = true
          }
          navigateOptions(e.key)
        }
        break
    }
  }

  // ==================== 初始化聚焦位置 ====================
  const initFocusedIndex = () => {
    const index = options.value.findIndex(
      (opt, i) =>
        isSelectOption(opt) && opt.value === modelValue.value && isValidOption(options.value, i)
    )
    focusedIndex.value = index >= 0 && isValidOption(options.value, index) ? index : -1
    scrollToFocused()
  }

  return {
    scrollToFocused,
    navigateOptions,
    handleKeydown,
    initFocusedIndex,
  }
}
