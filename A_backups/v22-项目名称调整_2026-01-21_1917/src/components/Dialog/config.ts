import type { DialogProps } from './types'

/**
 * 对话框预设配置 - 每个预设代表一种实际使用场景
 * 使用方式：dialog.create({ ...dialogPresets.confirm, title: '确认操作' })
 */
export const dialogPresets = {
  // 确认对话框（警告类型，显示取消按钮）
  confirm: {
    type: 'warning',
    size: 'small',
    showCancelBtn: true,
    confirmOnEnter: true,
  } as Partial<DialogProps>,

  // 提示对话框（信息类型，仅显示确认按钮）
  alert: {
    type: 'info',
    size: 'small',
    showCancelBtn: false,
    confirmOnEnter: true,
  } as Partial<DialogProps>,

  // 危险操作对话框（错误类型，危险按钮）
  danger: {
    type: 'error',
    size: 'small',
    showCancelBtn: true,
    confirmOnEnter: false, // 危险操作不允许 Enter 快速确认
    okButtonProps: { theme: 'danger' },
  } as Partial<DialogProps>,

  // 成功提示对话框
  success: {
    type: 'success',
    size: 'small',
    showCancelBtn: false,
    confirmOnEnter: true,
  } as Partial<DialogProps>,

  // 表单对话框（中等尺寸，显示取消按钮）
  form: {
    type: 'info',
    size: 'medium',
    showCancelBtn: true,
    confirmOnEnter: false, // 表单中可能有多行输入，不自动 Enter 确认
  } as Partial<DialogProps>,

  // 大内容对话框（大尺寸）
  large: {
    type: 'info',
    size: 'large',
    showCancelBtn: true,
    confirmOnEnter: false,
  } as Partial<DialogProps>,
} as const
