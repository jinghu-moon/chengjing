import type { Component } from 'vue'

export type DialogType = 'info' | 'success' | 'warning' | 'error' | 'confirm'
export type DialogLayout = 'center' | 'top' | 'bottom' | 'custom'
export type DialogPlacement =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'

// 基础 Dialog Props (组件式调用)
export interface DialogProps {
  modelValue?: boolean
  title?: string
  content?: string
  type?: DialogType
  width?: string | number
  layout?: DialogLayout

  // Follow Trigger 模式相关
  triggerRect?: DOMRect | VirtualRect
  placement?: DialogPlacement
  mousePosition?: { x: number; y: number }

  mask?: boolean
  maskClosable?: boolean
  showClose?: boolean
  zIndex?: number

  // 按钮配置
  okText?: string
  cancelText?: string
  okButtonProps?: ButtonProps
  cancelButtonProps?: ButtonProps // 支持自定义取消按钮样式
  showConfirmBtn?: boolean
  showCancelBtn?: boolean
  loading?: boolean

  // 事件
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

// 透传给 Button 组件的 Props
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  [key: string]: any
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
