import type { Component, VNode } from 'vue'

export type ButtonTheme = 'default' | 'primary' | 'danger' | 'warning' | 'success'
export type ButtonVariant = 'base' | 'outline' | 'dashed' | 'text'
export type ButtonShape = 'rectangle' | 'square' | 'round' | 'circle'
export type ButtonSize = 'small' | 'medium' | 'large'
export type ButtonType = 'submit' | 'reset' | 'button'
export type ButtonTag = 'button' | 'a' | 'div'
export type ButtonEffect =
  // Hover Effects
  | 'lift'           // Hover: 悬浮升起
  | 'sheen'          // Hover: 流光扫过
  | 'icon-slide'     // Hover: 图标滑入(需配合 suffix 使用)
  // Active Effects
  | 'scale'          // Active: 缩放按压
  // Click Effects
  | 'pulse'          // Click: 光环扩散
  | 'ripple'         // Click: 水波纹
  | 'sweep'          // Click: 斜向填充
  | 'shake'          // Click: 错误抖动
  | 'slide-feedback' // Click: 滑轨反馈(状态切换)
  | 'progress'       // Click: 边框进度
  | 'none'

export interface ButtonProps {
  /** 是否为块级元素 */
  block?: boolean
  /** 按钮内容 */
  content?: string
  /** 禁用状态 */
  disabled?: boolean
  /** 原生 form 属性 */
  form?: string
  /** 是否为幽灵按钮（镂空按钮） */
  ghost?: boolean
  /** 跳转地址 */
  href?: string
  /** 按钮内部图标 */
  icon?: Component | VNode
  /** 是否显示为加载状态 */
  loading?: boolean
  /** 按钮形状 */
  shape?: ButtonShape
  /** 组件尺寸 */
  size?: ButtonSize
  /** 右侧内容 */
  suffix?: Component | VNode
  /** 渲染按钮的 HTML 标签 */
  tag?: ButtonTag
  /** 组件风格 */
  theme?: ButtonTheme
  /** 按钮类型 */
  type?: ButtonType
  /** 按钮形式 */
  variant?: ButtonVariant
  /** 按钮点击/悬停效果 */
  effect?: ButtonEffect
}

export type ButtonEmits = {
  (e: 'click', event: MouseEvent): void
}
