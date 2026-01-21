import type { ButtonEffect, ButtonProps } from './types'

export interface ButtonConfig {
  defaultEffect: ButtonEffect
  defaultKeyboard: boolean
}

export const buttonConfig: ButtonConfig = {
  defaultEffect: 'ripple',
  defaultKeyboard: true,
}

/**
 * 按钮预设配置 - 每个预设代表一种实际使用场景
 * 使用方式：<Button {...buttonPresets.primary}>确认</Button>
 */
export const buttonPresets = {
  // 主要操作按钮（实心，高对比度）
  primary: { theme: 'primary', variant: 'base' } as Partial<ButtonProps>,
  danger: { theme: 'danger', variant: 'base' } as Partial<ButtonProps>,
  success: { theme: 'success', variant: 'base' } as Partial<ButtonProps>,
  warning: { theme: 'warning', variant: 'base' } as Partial<ButtonProps>,

  // 次要操作按钮（线框，低对比度）
  secondary: { theme: 'default', variant: 'outline' } as Partial<ButtonProps>,
  ghost: { theme: 'default', variant: 'base', ghost: true } as Partial<ButtonProps>,

  // 文本样式按钮（无边框，最低对比度）
  link: { theme: 'primary', variant: 'text' } as Partial<ButtonProps>,
  text: { theme: 'default', variant: 'text' } as Partial<ButtonProps>,
} as const
