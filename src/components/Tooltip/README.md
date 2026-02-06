# Tooltip 工具提示

## 概述

双模式工具提示组件，支持**组件模式**（`<Tooltip>` 包裹触发器）和**指令模式**（`v-tooltip` 自定义指令）。提供 13 个定位方向（含 auto 自动选择）、智能翻转、箭头跟随、方向感知动画等。通过 `useTooltipPosition` composable 实现定位引擎，`useTooltipSingleton` 实现指令模式的全局单例复用，`TooltipProvider` 作为单例渲染容器。

## 目录结构

```
Tooltip/
├── index.vue                              # 组件模式（Props 驱动 + 4 种触发方式）
├── index.ts                               # 统一导出（组件 + 类型 + composables + 指令）
├── vTooltip.ts                            # v-tooltip 自定义指令（事件绑定 + 生命周期）
├── TooltipProvider.vue                    # 单例渲染容器（指令模式的 DOM 载体）
└── composables/
    ├── useTooltipPosition.ts              # 定位引擎（13 方向 + 翻转 + 箭头计算）
    └── useTooltipSingleton.ts             # 全局单例管理（状态 + 定时器 + show/hide）
```

## 调用方式

### 组件模式

```vue
<Tooltip content="提示文本" placement="top">
  <button>悬停显示</button>
</Tooltip>

<!-- 自定义内容插槽 -->
<Tooltip placement="bottom" :show-arrow="false">
  <button>触发器</button>
  <template #content>
    <div>富文本内容</div>
  </template>
</Tooltip>

<!-- 手动控制 -->
<Tooltip trigger="manual" v-model:visible="show">
  <button>手动控制</button>
</Tooltip>
```

### 指令模式

```vue
<!-- 简写：字符串 -->
<button v-tooltip="'提示文本'">悬停</button>

<!-- 完整配置 -->
<button v-tooltip="{ content: '提示', placement: 'right', maxWidth: 200 }">
  悬停
</button>
```

指令模式需要在 App 根组件中挂载 `<TooltipProvider />`。

## Props（组件模式）

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `content` | `string` | `''` | 提示文本 |
| `placement` | `TooltipPlacement` | `'top'` | 定位方向（13 个方向） |
| `trigger` | `'hover' \| 'click' \| 'focus' \| 'manual'` | `'hover'` | 触发方式 |
| `showArrow` | `boolean` | `true` | 显示箭头 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `showDelay` | `number` | `200` | 显示延迟（ms） |
| `hideDelay` | `number` | `100` | 隐藏延迟（ms） |
| `offset` | `number` | `8` | 与触发器的间距（px） |
| `maxWidth` | `number \| string` | `280` | 最大宽度 |
| `visible` | `boolean` | `undefined` | 手动控制显隐（v-model:visible） |

### TooltipPlacement 13 个定位方向

`auto` / `top` / `top-start` / `top-end` / `bottom` / `bottom-start` / `bottom-end` / `left` / `left-start` / `left-end` / `right` / `right-start` / `right-end`

### 触发方式

| 模式 | 显示条件 | 隐藏条件 |
|------|----------|----------|
| `hover` | mouseenter（延迟 showDelay） | mouseleave（延迟 hideDelay） |
| `click` | 点击触发器 toggle | 点击外部区域 |
| `focus` | 触发器获得焦点 | 触发器失去焦点 |
| `manual` | `v-model:visible` 控制 | `v-model:visible` 控制 |

**hover 断层修复**：Tooltip 内容区域也绑定 mouseenter/mouseleave，鼠标从触发器移入 Tooltip 时清除隐藏定时器，防止间隙导致闪烁。

## Slots

| 插槽 | 说明 |
|------|------|
| `default` | 触发器元素 |
| `content` | 自定义 Tooltip 内容（优先于 `content` prop） |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:visible` | `boolean` | 显隐状态变更 |

## Expose 方法

| 方法 | 说明 |
|------|------|
| `show()` | 立即显示（无延迟） |
| `hide()` | 立即隐藏（无延迟） |
| `toggle()` | 切换显隐 |
| `setTriggerElement(el)` | 动态设置触发器元素（指令模式使用） |

## 核心 Composables

### useTooltipPosition 定位引擎

基于 `@/utils/positioning` 工具库的 Tooltip 专用定位引擎，支持 13 个方向 + 智能翻转 + 箭头跟随。

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `actualPlacement` | `Ref<TooltipPlacement>` | 实际渲染方向（翻转后） |
| `tooltipStyle` | `Ref<CSSProperties>` | fixed 定位样式（top/left） |
| `arrowStyle` | `Ref<CSSProperties>` | 箭头偏移样式 |
| `updatePosition` | `() => Promise<void>` | 异步位置更新（含 nextTick） |
| `throttledUpdatePosition` | `Function` | RAF 节流版位置更新 |
| `getBaseDirection` | `(placement) => string` | 提取基础方向（top/bottom/left/right） |

**常量配置**：

| 常量 | 值 | 说明 |
|------|-----|------|
| `BUFFER` | `8px` | 距离视口边缘的最小安全距离 |
| `ARROW_SAFE_MARGIN` | `12px` | 箭头距离 Tooltip 边缘的最小距离 |

**定位算法（auto 模式）**：

1. 遍历 12 个候选位置（Top 组 → Bottom 组 → Right 组 → Left 组）
2. 对每个候选调用 `checkFit()` 检测主轴空间 + 交叉轴边界
3. 首个通过检测的候选即为最终位置
4. **降级逻辑**：全部不通过时，计算四个方向的可用空间，垂直方向（上下）给予 2 倍权重，选择得分最高的方向

**翻转逻辑（非 auto 模式）**：

1. 检测用户指定方向是否有足够空间
2. 空间不足时翻转到对侧（top ↔ bottom，left ↔ right），保留对齐方式（start/end/center）
3. 比较对侧与原侧的主轴空间，选择较大一侧

**箭头位置计算**：

箭头始终指向触发器的几何中心：
- 水平方向（top/bottom）：`arrowX = triggerCenterX - tooltipLeft`，clamp 到 `[ARROW_SAFE_MARGIN, tooltipWidth - ARROW_SAFE_MARGIN]`
- 垂直方向（left/right）：`arrowY = triggerCenterY - tooltipTop`，clamp 到 `[ARROW_SAFE_MARGIN, tooltipHeight - ARROW_SAFE_MARGIN]`

### useTooltipSingleton 全局单例管理

为 `v-tooltip` 指令模式提供全局单例状态，所有指令共享同一个 Tooltip DOM 实例。

**模块级状态**：

| 状态 | 类型 | 说明 |
|------|------|------|
| `isOpen` | `Ref<boolean>` | 当前是否显示 |
| `triggerElement` | `ShallowRef<HTMLElement>` | 当前触发器元素 |
| `config` | `Ref<TooltipConfig>` | 当前配置（content/placement/delay/maxWidth/showArrow） |

**单例方法**：

| 方法 | 说明 |
|------|------|
| `show(el, config)` | 设置触发器元素 + 配置 → 延迟显示（showDelay） |
| `hide()` | 延迟隐藏（hideDelay） |

**工作流程**：`v-tooltip` 指令在 mouseenter 时调用 `tooltipSingleton.show(el, config)`，单例更新 `triggerElement` 和 `config`，`TooltipProvider` 响应式渲染 Tooltip DOM。多个指令共享同一个 DOM 实例，切换触发器时无需销毁重建。

## 组件说明

### index.vue 组件模式

Props 驱动的 Tooltip 组件，通过默认 slot 包裹触发器元素。

**渲染结构**：

```
.tooltip-wrapper（inline-block，事件代理层）
├── .tooltip-trigger（触发器 slot）
└── <Teleport to="body">
    └── <transition name="tooltip-fade">
        └── .tooltip-content（fixed 定位面板）
            ├── .tooltip-arrow（方向箭头）
            └── slot#content / {{ content }}
```

**关键机制**：

- **内容检测**：`hasContent` computed 检查 `content` prop 或 `#content` slot 是否存在，无内容时不显示
- **A11y**：触发器设置 `aria-describedby` 指向 Tooltip ID，Tooltip 设置 `role="tooltip"`
- **滚动/resize 跟随**：打开时注册 `scroll`（capture）+ `resize` 监听，关闭时移除
- **点击外部关闭**：click 模式下，`document.click` 检测目标是否在触发器/Tooltip 外部

### TooltipProvider 单例渲染容器

指令模式的 DOM 载体，通过 `useTooltipSingleton()` 获取全局单例状态，渲染唯一的 Tooltip DOM。

- 通过 `<Teleport to="body">` 渲染，`pointer-events: none`（不拦截鼠标事件）
- 监听 `isOpen` 和 `triggerElement` 变化，自动调用 `updatePosition()`
- 支持 `v-html` 渲染富文本内容
- 与 index.vue 共享相同的样式和箭头系统

### vTooltip 自定义指令

Vue 自定义指令，将 Tooltip 能力以 `v-tooltip` 形式提供给任意元素。

**值类型**：

| 类型 | 示例 | 说明 |
|------|------|------|
| `string` | `v-tooltip="'提示'"` | 简写，仅设置 content |
| `object` | `v-tooltip="{ content, placement, ... }"` | 完整配置 |

**对象配置字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `content` | `string` | 提示文本（必填） |
| `placement` | `TooltipPlacement` | 定位方向 |
| `showDelay` | `number` | 显示延迟 |
| `hideDelay` | `number` | 隐藏延迟 |
| `maxWidth` | `number \| string` | 最大宽度 |
| `showArrow` | `boolean` | 显示箭头 |
| `disabled` | `boolean` | 禁用 |

**指令生命周期**：

| 钩子 | 行为 |
|------|------|
| `mounted` | 绑定 mouseenter/mouseleave/focus/blur 事件，存储清理函数到 `el.__vTooltip` |
| `updated` | 销毁旧绑定 → 重新执行 mounted（响应值变化） |
| `unmounted` | 调用 `destroy()` 移除所有事件监听 |

## 样式系统

### Tooltip 外观

- **玻璃拟态**：`rgba(30, 34, 44, 0.95)` 背景 + `backdrop-filter: blur`
- **边框**：`rgba(255, 255, 255, 0.08)` 半透明玻璃边框
- **圆角**：`var(--radius-md, 8px)`
- **阴影**：`var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.2))`
- **字号**：`var(--text-xs, 12px)`，行高 1.5

### 箭头系统

8×8px 正方形，通过 `rotate(45deg)` 旋转为菱形，裁剪对角边框实现三角效果：

| 方向类 | 箭头位置 | 隐藏边框 |
|--------|----------|----------|
| `arrow-top` | 底部 -4px | 隐藏 top + left 边框 |
| `arrow-bottom` | 顶部 -4px | 隐藏 bottom + right 边框 |
| `arrow-left` | 右侧 -4px | 隐藏 bottom + right 边框 |
| `arrow-right` | 左侧 -4px | 隐藏 top + left 边框 |

## 动画系统

| 动画名称 | 效果 | 用途 |
|----------|------|------|
| `tooltip-fade-enter` | opacity 0→1 + 方向位移 6px→0，200ms 弹性曲线 | Tooltip 进入 |
| `tooltip-fade-leave` | opacity 1→0 + 方向位移 0→6px，100ms ease | Tooltip 退出 |

**方向感知位移**：

| 方向组 | 进入起点 | 退出终点 |
|--------|----------|----------|
| `top / top-start / top-end` | `translateY(6px)` | `translateY(6px)` |
| `bottom / bottom-start / bottom-end` | `translateY(-6px)` | `translateY(-6px)` |
| `left / left-start / left-end` | `translateX(6px)` | `translateX(6px)` |
| `right / right-start / right-end` | `translateX(-6px)` | `translateX(-6px)` |

进入动画使用弹性曲线 `cubic-bezier(0.34, 1.56, 0.64, 1)` 实现微过冲回弹效果。

## 外部依赖

| 依赖 | 用途 |
|------|------|
| `@/utils/positioning` | 坐标计算（checkFit / calculateCoords） |
| `@/utils/throttle` | RAF 节流（throttleRaf） |
| `vue` | ref / shallowRef / computed / watch / nextTick / Teleport / transition |
