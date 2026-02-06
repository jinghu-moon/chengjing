import type { CardProps, CollapseProps, DrawerProps, ListProps } from './shared/types'

// ============================================
// Card 预设
// ============================================

export const cardPresets = {
  /** 横向布局 */
  row: {
    layout: 'row',
  },

  /** 网格布局 - 2列 */
  grid2: {
    layout: 'grid',
    gridColumns: 2,
  },

  /** 网格布局 - 3列 */
  grid3: {
    layout: 'grid',
    gridColumns: 3,
  },

  /** 宽松大卡片 */
  hero: {
    size: 'lg',
  },

  /** 新增占位符 (虚线框) */
  placeholder: {
    dashed: true,
    clickable: true,
  },
} as const satisfies Record<string, Partial<CardProps>>

// ============================================
// Collapse 预设
// ============================================

export const collapsePresets = {
  /** 默认：带边框、默认展开 */
  default: {
    bordered: true,
    defaultExpanded: true,
  },

  /** 手风琴项 */
  accordion: {
    bordered: true,
  },

  /** 紧凑：小尺寸、无 switch */
  compact: {
    size: 'sm',
    showSwitch: false,
  },
} as const satisfies Record<string, Partial<CollapseProps>>

// ============================================
// List 预设
// ============================================

export const listPresets = {
  /** 默认列表项 */
  default: {
    size: 'sm',
    hoverable: true,
    clickable: true,
  },

  /** 可选择选项 */
  option: {
    selectable: true,
    hoverable: true,
  },

  /** 极致紧凑 */
  tiny: {
    size: 'xs',
    hoverable: true,
  },
} as const satisfies Record<string, Partial<ListProps>>

// ============================================
// Drawer 预设
// ============================================

export const drawerPresets = {
  /** 设置面板风格：圆角+间距 */
  settings: {
    width: '360px',
    placement: 'right',
    bordered: true,
  },

  /** 标准侧边栏：贴边无圆角 */
  sidebar: {
    width: '420px',
    placement: 'right',
    bordered: false,
  },

  /** 宽面板 */
  wide: {
    width: '700px',
    placement: 'right',
    bordered: false,
  },
} as const satisfies Record<string, Partial<DrawerProps>>
