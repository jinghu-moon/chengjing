import type { Component } from 'vue'
import type { ButtonProps as BaseButtonProps } from '@/components/Button/types'

export type DialogType = 'info' | 'success' | 'warning' | 'error' | 'confirm'
export type DialogSize = 'small' | 'medium' | 'large'

// Follow 模式的位置选项
export type DialogPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'center' // 也支持 center

// 基础 Dialog Props (组件式调用)
export interface DialogProps {
  modelValue?: boolean
  title?: string
  content?: string
  type?: DialogType
  width?: string | number
  size?: DialogSize // 尺寸预设

  // 位置和动画
  placement?: DialogPlacement // 统一使用 DialogPlacement
  transformOrigin?: 'mouse' | 'center' // 动画原点模式
  mousePosition?: { x: number; y: number } // 鼠标位置（用于动画原点）

  // Follow Trigger 模式
  triggerRect?: DOMRect | VirtualRect // 如果提供，则进入 Follow 模式

  // 遮罩和交互
  mask?: boolean
  maskClosable?: boolean
  closable?: boolean // 是否显示关闭按钮
  closeOnEsc?: boolean // 按 ESC 关闭
  confirmOnEnter?: boolean // 按 Enter 确认
  destroyOnClose?: boolean // 关闭时销毁内容
  lockScroll?: boolean // 锁定 body 滚动
  zIndex?: number

  // 关闭前钩子
  beforeClose?: (action: 'positive' | 'negative' | 'close') => boolean | Promise<boolean>

  // 自定义类名
  dialogClass?: string // 对话框容器类名
  contentClass?: string // 内容区域类名
  headerClass?: string // 头部区域类名
  footerClass?: string // 底部区域类名
  rootClass?: string // 根节点类名
  maskClass?: string // 遮罩层类名

  // 图标
  showIcon?: boolean

  // 按钮配置
  okText?: string
  cancelText?: string
  okButtonProps?: BaseButtonProps
  cancelButtonProps?: BaseButtonProps
  showConfirmBtn?: boolean
  showCancelBtn?: boolean
  loading?: boolean

  // 事件（保留用于函数式调用）
  onOk?: () => void | Promise<void>
  onCancel?: () => void
  onClose?: () => void
  onAfterClose?: () => void
}

// 虚拟 Rect 定义 (用于 Follow Trigger)
export interface VirtualRect {
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}

// 函数式调用的配置项
export interface DialogOptions extends Omit<DialogProps, 'modelValue'> {
  // 函数式调用特有
  component?: Component // 支持挂载自定义组件内容
  componentProps?: Record<string, any> // 传递给自定义组件的 props
}

// 内部管理的 Dialog 实例
export interface DialogInstance extends DialogOptions {
  id: string
  visible: boolean // 用于控制进出动画
  resolve?: (value: boolean) => void
  reject?: (reason?: any) => void
}
