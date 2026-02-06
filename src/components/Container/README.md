# Container 容器组件体系

## 概述

统一的容器组件体系，包含 Card（卡片）、Collapse（折叠面板）、List（列表项）三种容器组件，共享 ContainerHeader 和 ContainerGroup。通过 `provide/inject` 实现选择管理和手风琴模式。

## 目录结构

```
Container/
├── index.ts                    # 统一导出
├── config.ts                   # 预设配置（Card/Collapse/List）
├── ContainerGroup.vue          # 容器组（网格布局 + 选择/手风琴管理）
├── shared/
│   ├── types.ts                # 所有类型定义
│   ├── ContainerHeader.vue     # 共享 Header 组件
│   └── shared.css              # 共享 CSS（Header/Badge 样式）
├── components/
│   ├── Card.vue                # 卡片组件
│   ├── Collapse.vue            # 折叠面板组件
│   └── List.vue                # 列表项组件
└── composables/
    ├── useCollapse.ts          # 折叠逻辑（手风琴支持）
    └── useSelection.ts         # 选择逻辑（单选/多选）
```

## 三种容器组件

### Card 卡片

通用内容容器，支持标题、图标、标签页、骨架屏加载、三种布局方向。

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | — | 标题 |
| `size` | `ContainerSize` | `'md'` | 尺寸 (xs/sm/md/lg) |
| `layout` | `'column'\|'row'\|'grid'` | `'column'` | 布局方向 |
| `gridColumns` | `number` | `2` | Grid 布局列数 |
| `tabs` | `CardTab[]` | `[]` | 标签页配置 |
| `activeTab` | `string\|number` | — | 当前标签 (v-model) |
| `hoverable` | `boolean` | `false` | 悬停效果 |
| `clickable` | `boolean` | `false` | 可点击（含 scale 反馈） |
| `dashed` | `boolean` | `false` | 虚线边框（占位符风格） |
| `loading` | `boolean` | `false` | 骨架屏加载态 |

### Collapse 折叠面板

可展开/收起的内容面板，支持 CSS Grid 动画、5 种布局预设、手风琴模式。

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `expanded` | `boolean` | — | 展开状态 (v-model) |
| `defaultExpanded` | `boolean` | `false` | 默认展开 |
| `showSwitch` | `boolean` | `true` | 显示 switch 开关 |
| `showCollapseIcon` | `boolean` | `true` | 显示折叠箭头 |
| `collapseAnimation` | `CollapseAnimation` | `'smooth'` | 动画类型 (smooth/bounce/elastic) |
| `triggerArea` | `CollapseTriggerArea` | `'header'` | 触发区域 (header/title/icon/switch) |
| `layout` | `CollapseLayout` | `'default'` | 布局预设 (5种) |
| `panelId` | `string` | 自动生成 | 手风琴模式面板标识 |

### List 列表项

横向布局的列表条目，支持选择指示器（单选圆形/多选方形）、图标、副标题。

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | — | 标题 |
| `subtitle` | `string` | — | 副标题 |
| `selectable` | `boolean` | `false` | 显示选择指示器 |
| `checked` | `boolean` | — | 独立模式选中 (v-model) |
| `value` | `any` | — | Group 模式标识值 |

## ContainerGroup 容器组

通过 `provide` 向子组件注入统一上下文，管理网格布局、选择状态和手风琴行为。

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `any` | — | 选中值 (v-model) |
| `multiple` | `boolean` | `false` | 多选模式 |
| `columns` | `number` | `1` | 网格列数 |
| `minWidth` | `number\|string` | — | 最小宽度（启用 auto-fill） |
| `gap` | `string\|number` | `'var(--space-4)'` | 间距 |
| `accordion` | `boolean` | `false` | 手风琴模式 |

## 核心 Composables

### useCollapse

折叠逻辑，支持 v-model:expanded 和手风琴模式：
- 注入 ContainerGroup 上下文
- 手风琴展开时通知 Group 关闭其他面板
- 组件卸载时自动注销

### useSelection

选择逻辑，支持独立模式和 Group 模式：
- Group 模式：通过 `value` prop 与 Group 的 `modelValue` 联动
- 独立模式：通过 `checked` prop 自管理
- 自动检测单选/多选，切换指示器形状

## 预设配置

```ts
// Card 预设
cardPresets.row         // 横向布局
cardPresets.grid2       // 2列网格
cardPresets.hero        // 大尺寸
cardPresets.placeholder // 虚线占位符

// Collapse 预设
collapsePresets.default   // 带边框默认展开
collapsePresets.accordion // 手风琴项
collapsePresets.compact   // 紧凑无 switch

// List 预设
listPresets.default  // 默认可点击
listPresets.option   // 可选择选项
listPresets.tiny     // 极致紧凑
```
