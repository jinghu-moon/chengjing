import type { Component } from 'vue'

// ============================================
// 共享基础类型
// ============================================

/** 容器尺寸 */
export type ContainerSize = 'xs' | 'sm' | 'md' | 'lg'

/** 容器变体 */
export type ContainerVariant = 'default' | 'outlined' | 'flat' | 'glass'

/** 徽章类型 */
export type BadgeType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

/** 折叠动画类型 */
export type CollapseAnimation = 'smooth' | 'bounce' | 'elastic'

/** 折叠面板布局预设 */
export type CollapseLayout = 'default' | 'icon-right' | 'compact' | 'actions-left' | 'minimal'

/** 折叠面板触发区域 */
export type CollapseTriggerArea = 'header' | 'title' | 'icon' | 'switch'

/** 标签页项 */
export interface CardTab {
  label: string
  value: string | number
  disabled?: boolean
}

// ============================================
// 共享 Header Props
// ============================================

export interface ContainerHeaderProps {
  /** 标题 */
  title?: string
  /** 标题位置 */
  titlePosition?: 'left' | 'center' | 'right'
  /** 左侧图标 */
  icon?: Component
  /** 徽章 */
  badge?: string | number
  /** 徽章类型 */
  badgeType?: BadgeType
}

// ============================================
// Card Props
// ============================================

/**
 * Card 为纯展示容器，不参与 ContainerGroup 选择管理。
 * 选择功能由 List 组件通过 useSelection 提供。
 */
export interface CardProps extends ContainerHeaderProps {
  size?: ContainerSize
  variant?: ContainerVariant
  bordered?: boolean
  hoverable?: boolean
  clickable?: boolean
  dashed?: boolean
  loading?: boolean
  /** 布局方向 */
  layout?: 'column' | 'row' | 'grid'
  /** Grid 布局列数 */
  gridColumns?: number
  /** 标签页配置 */
  tabs?: CardTab[]
  /** 当前标签 */
  activeTab?: string | number
}

// ============================================
// Collapse Props
// ============================================

export interface CollapseProps extends ContainerHeaderProps {
  size?: ContainerSize
  variant?: ContainerVariant
  bordered?: boolean
  /** 展开状态 (v-model:expanded) */
  expanded?: boolean
  /** 默认展开 */
  defaultExpanded?: boolean
  /** 显示 switch 开关 */
  showSwitch?: boolean
  /** 折叠动画类型 */
  collapseAnimation?: CollapseAnimation
  /** 显示折叠箭头图标 */
  showCollapseIcon?: boolean
  /** 触发折叠的区域 */
  triggerArea?: CollapseTriggerArea
  /** 标题栏布局预设 */
  layout?: CollapseLayout
}

// ============================================
// List Props
// ============================================

/**
 * checked 与 value 互斥规则：
 * - checked (v-model:checked)：独立模式，自管理选中状态
 * - value：ContainerGroup 模式，由 Group 统一管理
 * - 两者同时传入时：DEV 环境 console.warn 警告，value 优先
 */
export interface ListProps extends ContainerHeaderProps {
  size?: ContainerSize
  variant?: ContainerVariant
  bordered?: boolean
  hoverable?: boolean
  clickable?: boolean
  /** 副标题 */
  subtitle?: string
  /** 显示选择指示器 */
  selectable?: boolean
  /** 独立模式选中状态 (v-model:checked) */
  checked?: boolean
  /** ContainerGroup 模式标识值 */
  value?: any
}

// ============================================
// EmptyState Props
// ============================================

export interface EmptyStateProps {
  /** 图标组件 */
  icon?: Component
  /** 标题 */
  title?: string
  /** 描述文字 */
  description?: string
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg'
}

// ============================================
// Drawer Props
// ============================================

/** Drawer 放置方向 */
export type DrawerPlacement = 'left' | 'right' | 'top' | 'bottom'

export interface DrawerProps {
  /** 打开状态 (v-model:open) */
  open: boolean
  /** 标题 */
  title?: string
  /** 左侧图标 */
  icon?: Component
  /** 面板宽度（left/right 方向） */
  width?: string | number
  /** 面板高度（top/bottom 方向） */
  height?: string | number
  /** 滑入方向 */
  placement?: DrawerPlacement
  /** 显示遮罩 */
  overlay?: boolean
  /** 点击遮罩关闭 */
  overlayClosable?: boolean
  /** Teleport 目标 */
  teleport?: string | boolean
  /** z-index */
  zIndex?: number
  /** 圆角+间距模式（SettingsPanel 风格） */
  bordered?: boolean
  /** 按 ESC 键关闭，默认 true */
  escClosable?: boolean
  /** 锁定页面滚动，默认 true */
  lockScroll?: boolean
  /** body 区域自定义 class */
  bodyClass?: string | string[] | Record<string, boolean>
  /** body 区域自定义 style */
  bodyStyle?: string | Record<string, string>
  /** 关闭前回调，返回 false 阻止关闭 */
  onBeforeClose?: () => boolean | void
}

// ============================================
// ContainerGroup Props
// ============================================

export interface ContainerGroupProps {
  modelValue?: any
  /** 多选模式 */
  multiple?: boolean
  /** 网格列数 */
  columns?: number
  /** 最小宽度（启用 auto-fill） */
  minWidth?: number | string
  /** 间距 */
  gap?: string | number
  /** 手风琴模式（Collapse 专用） */
  accordion?: boolean
}

// ============================================
// ContainerGroup 注入上下文
// ============================================

export interface ContainerGroupContext {
  modelValue: { value: any }
  multiple: { value: boolean }
  handleItemClick: (value: any) => void
  /** 手风琴：注册/注销/切换 */
  registerPanel: (panelId: string, methods: { collapse: () => void }) => void
  unregisterPanel: (panelId: string) => void
  handlePanelToggle: (panelId: string) => void
  accordion: { value: boolean }
}

/** provide/inject key */
export const CONTAINER_GROUP_KEY = 'cj-container-group'
