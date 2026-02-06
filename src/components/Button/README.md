# Button 按钮

## 概述

多功能按钮组件，支持 5 种主题色、4 种变体样式、3 种尺寸、4 种形状和 4 种交互效果。通过 `ButtonGroup` 实现按钮组合，基于 `provide/inject` 统一子按钮属性。

## 目录结构

```
Button/
├── index.ts           # 统一导出
├── types.ts           # 类型定义（Theme/Variant/Shape/Size/Effect）
├── config.ts          # 默认配置 + 8 种预设
├── Button.vue         # 单按钮组件
└── ButtonGroup.vue    # 按钮组容器
```

## 设计维度

| 维度 | 可选值 | 说明 |
|------|--------|------|
| **Theme** | `default` `primary` `danger` `warning` `success` | 语义色彩 |
| **Variant** | `base` `outline` `dashed` `text` | 填充方式 |
| **Size** | `small(24px)` `medium(32px)` `large(40px)` | 高度尺寸 |
| **Shape** | `rectangle` `square` `round` `circle` | 外形 |
| **Effect** | `ripple` `sweep` `scale` `icon-slide` `none` | 交互效果 |

## Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `theme` | `ButtonTheme` | `'default'` | 主题色 |
| `variant` | `ButtonVariant` | `'base'` | 变体样式 |
| `size` | `ButtonSize` | `'medium'` | 尺寸 |
| `shape` | `ButtonShape` | `'rectangle'` | 形状 |
| `effect` | `ButtonEffect` | `'ripple'` | 交互效果 |
| `icon` | `Component \| VNode` | — | 图标组件 |
| `iconPlacement` | `'left' \| 'right'` | `'left'` | 图标位置 |
| `suffix` | `Component \| VNode` | — | 右侧附加内容（icon-slide 效果需要） |
| `content` | `string` | — | 按钮文本（也可用默认 slot） |
| `block` | `boolean` | `false` | 块级按钮（宽度 100%） |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `loading` | `boolean` | `false` | 加载状态（显示 spinner） |
| `ghost` | `boolean` | `false` | 幽灵按钮（透明背景） |
| `href` | `string` | — | 链接地址（自动渲染为 `<a>`） |
| `tag` | `ButtonTag` | `'button'` | 渲染标签 (`button`/`a`/`div`/`span`) |
| `type` | `ButtonType` | `'button'` | 原生 type 属性 |
| `keyboard` | `boolean` | `true` | 非 button 标签的键盘支持 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `click` | `MouseEvent` | 点击回调（disabled/loading 时不触发） |

## 交互效果详解

| 效果 | 触发时机 | 实现方式 |
|------|----------|----------|
| `ripple` | Click | DOM 注入圆形元素 + CSS 动画扩散 |
| `sweep` | Click | CSS `::after` 伪元素斜向滑入 |
| `scale` | Active | CSS `transform: scale(0.95)` |
| `icon-slide` | Hover | `btn-inner` 偏移 + suffix 淡入滑入 |

## 预设配置

```ts
import { buttonPresets } from './config'

// 主要操作（实心高对比）
buttonPresets.primary   // { theme: 'primary', variant: 'base' }
buttonPresets.danger    // { theme: 'danger',  variant: 'base' }
buttonPresets.success   // { theme: 'success', variant: 'base' }
buttonPresets.warning   // { theme: 'warning', variant: 'base' }

// 次要操作（低对比）
buttonPresets.secondary // { theme: 'default', variant: 'outline' }
buttonPresets.ghost     // { theme: 'default', variant: 'base', ghost: true }

// 文本样式（无边框）
buttonPresets.link      // { theme: 'primary', variant: 'text' }
buttonPresets.text      // { theme: 'default', variant: 'text' }
```

## ButtonGroup 按钮组

通过 `provide('buttonGroup', ...)` 向子 Button 注入统一属性。

### ButtonGroup Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `theme` | `ButtonTheme` | `'default'` | 统一主题 |
| `variant` | `ButtonVariant` | `'base'` | 统一变体 |
| `size` | `ButtonSize` | `'medium'` | 统一尺寸 |
| `shape` | `ButtonShape` | `'rectangle'` | 统一形状 |
| `vertical` | `boolean` | `false` | 垂直排列 |
| `gap` | `string` | `'0'` | 按钮间距 |
| `split` | `boolean` | `false` | 分割线模式 |

### 属性合并优先级

Button 自身 props > ButtonGroup inject > 默认值

### 布局特性

- **无间距模式** (`gap='0'`)：相邻按钮边框重叠 (`margin-left: -1px`)，首尾圆角保留、中间圆角清零
- **有间距模式**：保留各按钮独立圆角
- **分割线模式** (`split`)：按钮间显示竖向分割线
- **Hover z-index**：悬停/聚焦/激活时提升层级，避免边框被遮挡
