import { computed } from 'vue'

/**
 * 通用 CSS 变量计算引擎
 * 支持任意 RxC 文件夹布局模式
 */
export function useFolderIconSize(settings: any, iconConfig: any) {
  /**
   * 计算任意 RxC 模式的 CSS 变量
   * @param mode 文件夹模式，如 "2x2", "3x3", "1x1" 等
   * @returns CSS 变量对象
   */
  const calculateModeVars = (mode: string) => {
    const [r, c] = mode.split('x').map(Number)
    const itemSize = iconConfig.boxSize
    const gapX = settings.gridGapX
    const gapY = settings.gridGapY

    // 1x1 特殊处理：内部强制 3x3 网格
    const isSmall = r === 1 && c === 1
    const innerRows = isSmall ? 3 : r
    const innerCols = isSmall ? 3 : c
    // 大文件夹：行间距 = 列间距 = 边距
    const spacing = settings.folderInnerSpacing || 8
    const innerGap = isSmall ? 4 : spacing
    const innerPad = isSmall ? 6 : spacing

    // 计算文件夹物理尺寸
    const totalW = c * itemSize + (c - 1) * gapX
    const totalH = r * itemSize + (r - 1) * gapY

    // 计算内部可用空间
    const availW = totalW - innerPad * 2 - (innerCols - 1) * innerGap
    const availH = totalH - innerPad * 2 - (innerRows - 1) * innerGap

    // 计算内部图标尺寸（取较小值保证正方形且不溢出）
    const iconSize = Math.floor(Math.min(availW / innerCols, availH / innerRows))

    return {
      '--f-rows': r,
      '--f-cols': c,
      '--f-inner-rows': innerRows,
      '--f-inner-cols': innerCols,
      '--f-inner-gap': `${innerGap}px`,
      '--f-inner-pad': `${innerPad}px`,
      '--f-icon-size': `${iconSize}px`,
    }
  }

  /**
   * 获取文件夹容量（可容纳的图标数量）
   */
  const getCapacity = (mode: string) => {
    const [r, c] = mode.split('x').map(Number)
    // 1x1 文件夹内部 3x3，容量为 9
    return r === 1 && c === 1 ? 9 : r * c
  }

  /**
   * 预计算所有常用模式的变量（用于 CSS 变量注入）
   */
  const folderSizeVars = computed(() => {
    const modes = ['1x1', '1x2', '2x1', '2x2', '1x3', '3x1', '2x3', '3x2', '3x3']
    const vars: Record<string, string> = {}

    modes.forEach(mode => {
      const modeVars = calculateModeVars(mode)
      vars[`--folder-${mode}-icon-size`] = modeVars['--f-icon-size']
      vars[`--folder-${mode}-gap`] = modeVars['--f-inner-gap']
    })

    return vars
  })

  return {
    calculateModeVars,
    getCapacity,
    folderSizeVars,
  }
}
