import type { Component } from 'vue'

// ==================== 选项类型 ====================
export type OptionType = 'default' | 'checkbox' | 'radio'

/** 拖拽数据标识 */
export interface DragData {
  /** 拖拽类型：引擎盒子或分组 header */
  type: 'engine' | 'group'
  /** 引擎 ID 或分组名 */
  id: string
  /** 所属分组名 */
  group: string
}

export interface SelectOption {
  value: string
  label?: string
  description?: string // 次级描述文本（仅 list 布局显示）
  danger?: boolean // 危险操作标记（红色高亮）
  // 键盘快捷键提示 (e.g. "⌘C")
  shortcut?: string
  type?: OptionType // 选项类型：default（默认）、checkbox（多选）、radio（单选互斥）
  group?: string // Radio 分组名（同组互斥）
  checked?: boolean // Checkbox/Radio 是否选中（受控模式）
  disabled?: boolean
  prefixIcon?: Component
  suffixIcon?: Component
  children?: OptionItem[]
  /** 拖拽标识数据 */
  dragData?: DragData
}

export interface DividerOption {
  value: 'divider'
  label?: string
  // [新增] 交互支持
  actionValue?: string // e.g. 'activate-combo:xyz'
  checked?: boolean
  type?: 'radio' | 'checkbox'
  /** 拖拽标识数据 */
  dragData?: DragData
}

export type OptionItem = SelectOption | DividerOption
export type TriggerMode = 'click' | 'hover'
export type PlacementPosition =
  | 'auto'
  | 'topLeft'
  | 'topCenter'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomCenter'
  | 'bottomCenter'
  | 'bottomRight'

export type SubmenuPlacement = 'left' | 'right'
export type SubmenuAlign = 'alignTop' | 'alignBottom' | 'alignParentTop' | 'alignParentBottom'

// ==================== Props 接口 ====================
export interface CustomSelectProps {
  modelValue: string
  options: OptionItem[]

  // 外观
  triggerWidth?: string
  placeholder?: string

  // 行为
  trigger?: TriggerMode
  hoverDelay?: number
  placement?: PlacementPosition
  showArrow?: boolean
  disabled?: boolean
  layout?: 'list' | 'grid'

  // 功能 - 搜索与清除
  clearable?: boolean // 是否可清除
  emptyText?: string // 空数据文案
  filterable?: boolean // [核心] 是否开启搜索/双态模式
  searchPlaceholder?: string // 搜索时的占位符
  // 是否开启多选标签回显模式
  multiple?: boolean

  // 下拉尺寸
  dropdownMaxHeight?: string | number
  dropdownMinWidth?: string | number

  // [新增] 是否显示级联路径
  showPath?: boolean

  // [新增] 自定义触发器模式 - 完全使用 slot 内容作为触发器
  customTrigger?: boolean

  // Grid 布局下是否在图标下方显示文本标签
  showGridLabel?: boolean

  /** 启用拖拽排序 */
  draggable?: boolean
}

// ==================== 常量配置 ====================
export const POSITION_CONFIG = {
  BUFFER: 12,
  ARROW_OFFSET: -5,
  ARROW_SAFE_MARGIN: 16,
  MIN_HEIGHT: 100,
  MAX_HEIGHT: 400,
  MIN_WIDTH: 150,
  CONTENT_PADDING: 12,
  HOVER_LEAVE_DELAY: 150,
} as const

export const GRID_COLUMNS = 4

// ==================== 工具函数 ====================
export const isSelectOption = (opt: OptionItem): opt is SelectOption => {
  return opt.value !== 'divider'
}

export const isValidOption = (options: OptionItem[], index: number): boolean => {
  const opt = options[index]
  return !!opt && isSelectOption(opt) && !opt.disabled
}
