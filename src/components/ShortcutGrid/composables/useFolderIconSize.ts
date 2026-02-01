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
    const gapX = settings.layoutGridGapX
    const gapY = settings.layoutGridGapY

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
    
    // 计算动态圆角：基于最短边长的 22%，模仿 iOS icon 比例
    // 对于 2x1 这样的扁长形状，最短边是 height (itemSize)，圆角将基于 height 计算，保持圆形而非椭圆
    const minDimension = Math.min(totalW, totalH)
    const radius = Math.floor(minDimension * 0.22)
    
    // 内部图标的圆角：基于图标自身尺寸的 22%
    // 这样自然形成了 "外圆角大(因为容器大)，内圆角小(因为图标小)" 的层级关系
    const iconRadius = Math.floor(iconSize * 0.22)

    return {
      '--f-rows': r,
      '--f-cols': c,
      '--f-inner-rows': innerRows,
      '--f-inner-cols': innerCols,
      '--f-inner-gap': `${innerGap}px`,
      '--f-inner-pad': `${innerPad}px`,
      '--f-icon-size': `${iconSize}px`,
      '--f-radius': `${radius}px`,
      '--f-icon-radius': `${iconRadius}px`,
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
