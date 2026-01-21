import type { Component } from 'vue'

// Toast 类型
export type ToastType = 'success' | 'error' | 'warning' | 'info'

// Toast 位置
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'left-center'
  | 'right-center'

// Toast 操作按钮
export interface ToastAction {
  label: string // 按钮文本（如"撤回"）
  onClick: () => void // 点击回调
  variant?: 'primary' | 'ghost' // 按钮样式
}

// 关闭按钮位置
export type CloseButtonPosition = 'top-right' | 'center-right'

// Toast 实例
export interface ToastInstance {
  id: string // 唯一标识
  type: ToastType // 类型

  // Toast 组件元素
  title?: string // 标题 - 可选
  message: string // 内容 - 必选
  icon?: Component // 自定义图标 - 可选
  closable: boolean // 是否显示关闭按钮
  action?: ToastAction // 操作按钮 - 可选
  closeButtonPosition: CloseButtonPosition // 关闭按钮位置

  // 时间配置
  duration: number // 持续时间（ms），0 = 永不消失

  // 内部状态
  createdAt: number // 创建时间戳
  isVisible: boolean // 是否可见（用于动画）
}

// Toast 选项
export interface ToastOptions {
  type?: ToastType
  title?: string
  message: string
  icon?: Component
  closable?: boolean
  action?: ToastAction
  duration?: number
  closeButtonPosition?: CloseButtonPosition // 关闭按钮位置
}

// Toast 配置
export interface ToastConfig {
  position: ToastPosition // 默认位置
  maxCount: number // 最大同时显示数量
  defaultDuration: number // 默认持续时间
  defaultClosable: boolean // 默认是否可关闭
}

// Promise 状态跟踪配置
export interface ToastPromiseMessages {
  loading: string // 加载中的消息
  success: string // 成功的消息
  error: string // 失败的消息
}
