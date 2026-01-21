/**
 * SelectMenu 模块入口
 * 同时导出组件和类型，方便外部统一引用
 */

// 默认导出组件（供 unplugin-vue-components 自动导入使用）
export { default } from './index.vue'
export { default as SelectMenu } from './index.vue'

// 导出所有类型（供外部 import type 使用）
export type {
  OptionType,
  SelectOption,
  DividerOption,
  OptionItem,
  TriggerMode,
  PlacementPosition,
  SubmenuPlacement,
  SubmenuAlign,
  CustomSelectProps,
} from './types'

// 导出常量和工具函数
export { POSITION_CONFIG, GRID_COLUMNS, isSelectOption, isValidOption } from './types'
