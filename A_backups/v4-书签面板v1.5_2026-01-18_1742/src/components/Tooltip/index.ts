/**
 * Tooltip 模块入口
 * 同时导出组件、类型和 composables，方便外部统一引用
 */

// 默认导出组件（供 unplugin-vue-components 自动导入使用）
export { default } from './index.vue'
export { default as Tooltip } from './index.vue'
export { default as TooltipProvider } from './TooltipProvider.vue'

// 导出 composables 和类型
export { useTooltipPosition, type TooltipPlacement } from './composables/useTooltipPosition'
export {
  useTooltipSingleton,
  tooltipSingleton,
  type TooltipConfig,
} from './composables/useTooltipSingleton'

// 导出指令
export { vTooltip } from './vTooltip'
