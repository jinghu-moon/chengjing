// Container 组件体系统一导出

// 共享样式（全局导入，避免 scoped @import 重复）
import './shared/shared.css'

export { default as Card } from './components/Card.vue'
export { default as Collapse } from './components/Collapse.vue'
export { default as Drawer } from './components/Drawer.vue'
export { default as EmptyState } from './components/EmptyState.vue'
export { default as List } from './components/List.vue'
export { default as ContainerGroup } from './ContainerGroup.vue'

// 类型导出
export type {
  ContainerSize,
  ContainerVariant,
  BadgeType,
  CollapseAnimation,
  CollapseLayout,
  CollapseTriggerArea,
  CardTab,
  ContainerHeaderProps,
  CardProps,
  CollapseProps,
  DrawerProps,
  DrawerPlacement,
  EmptyStateProps,
  ListProps,
  ContainerGroupProps,
} from './shared/types'

// 预设导出
export { cardPresets, collapsePresets, drawerPresets, listPresets } from './config'
