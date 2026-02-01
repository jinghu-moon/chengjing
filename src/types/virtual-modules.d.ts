/**
 * 虚拟模块类型声明
 * virtual:settings-labels - 由 vite-plugin-settings-labels 生成
 */

declare module 'virtual:settings-labels' {
  /** Settings 字段中文标签映射 */
  export const SETTINGS_LABELS: Record<string, string>

  /** IconConfig 字段中文标签映射 */
  export const ICON_LABELS: Record<string, string>

  /** 获取 Settings 字段的中文标签 */
  export function getSettingLabel(key: string): string

  /** 获取 IconConfig 字段的中文标签 */
  export function getIconLabel(key: string): string
}
