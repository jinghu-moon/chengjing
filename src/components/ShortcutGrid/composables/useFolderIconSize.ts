import { computed } from 'vue'

/**
 * 计算文件夹内部小图标的精确尺寸
 * 使用统一的间距系统：边距 = 行间距 = 列间距
 */
export function useFolderIconSize(settings: any, iconConfig: any) {
  /**
   * 计算指定文件夹模式下的内部图标尺寸
   * @param mode 文件夹模式，如 "2x2", "3x3" 等
   * @returns 内部小图标的尺寸（px）
   */
  const getInnerIconSize = (mode: string) => {
    const [cols, rows] = mode.split('x').map(Number)

    // 外部网格参数
    const itemSize = iconConfig.boxSize // 单个格子大小
    const gapX = settings.gridGapX // 列间距
    const gapY = settings.gridGapY // 行间距

    // 统一间距：边距 = 行间距 = 列间距（从设置中读取）
    const innerSpacing = settings.folderInnerSpacing || 8

    // 计算文件夹外部尺寸（使用正确的行列间距）
    const folderWidth = cols * itemSize + (cols - 1) * gapX
    const folderHeight = rows * itemSize + (rows - 1) * gapY

    // 计算内部可用空间（减去边距）
    const availableWidth = folderWidth - innerSpacing * 2
    const availableHeight = folderHeight - innerSpacing * 2

    // 计算每个小图标的尺寸（减去内部间距）
    const iconWidth = (availableWidth - innerSpacing * (cols - 1)) / cols
    const iconHeight = (availableHeight - innerSpacing * (rows - 1)) / rows

    // 取较小值确保图标不会溢出，并保持正方形
    const iconSize = Math.min(iconWidth, iconHeight)

    return {
      iconSize: Math.floor(iconSize), // 向下取整避免溢出
      innerSpacing, // 统一间距
      cols,
      rows,
      folderWidth,
      folderHeight,
      availableWidth,
      availableHeight,
    }
  }

  /**
   * 获取所有文件夹模式的尺寸信息
   */
  const allFolderSizes = computed(() => {
    const modes = ['1x2', '2x1', '2x2', '1x3', '3x1', '2x3', '3x2', '3x3']
    const result: Record<string, ReturnType<typeof getInnerIconSize>> = {}

    modes.forEach(mode => {
      result[mode] = getInnerIconSize(mode)
    })

    return result
  })

  /**
   * 获取当前文件夹预览模式的尺寸
   */
  const currentFolderSize = computed(() => {
    return getInnerIconSize(settings.folderPreviewMode)
  })

  /**
   * 生成 CSS 变量用于样式
   */
  const folderSizeVars = computed(() => {
    const sizes = allFolderSizes.value
    const vars: Record<string, string> = {}

    Object.entries(sizes).forEach(([mode, size]) => {
      vars[`--folder-${mode}-icon-size`] = `${size.iconSize}px`
      vars[`--folder-${mode}-spacing`] = `${size.innerSpacing}px`
    })

    return vars
  })

  return {
    getInnerIconSize,
    allFolderSizes,
    currentFolderSize,
    folderSizeVars,
  }
}
