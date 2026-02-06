# Toast 消息提示

## 概述

Sonner 风格的消息提示组件，支持 8 个方位定位、堆叠动画（Hover 展开）、进度条倒计时、操作按钮、Promise 状态跟踪等。通过 `useToast` composable 实现全局单例管理，函数式调用创建 Toast 实例。

## 目录结构

```
Toast/
├── index.vue                              # 容器组件（Teleport + 堆叠动画 + 定位）
├── ToastItem.vue                          # 单条 Toast（图标/内容/操作/进度条）
├── types.ts                               # 类型定义（ToastInstance / ToastOptions / ToastConfig）
└── composables/
    └── useToast.ts                        # 全局单例管理（队列/定时器/CRUD）
```

## 调用方式

```ts
const toast = useToast()

// 快捷方法
toast.success('操作成功')
toast.error('操作失败', { duration: 5000 })
toast.warning('请注意')
toast.info('提示信息')

// 完整选项
toast.add({
  type: 'success',
  title: '标题',
  message: '内容',
  action: { label: '撤销', onClick: () => restore() },
  duration: 5000,
})

// Promise 状态跟踪
await toast.promise(fetchData(), {
  loading: '加载中...',
  success: '加载完成',
  error: '加载失败',
})
```

## 类型定义

### ToastOptions

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `ToastType` | `'info'` | 类型：success / error / warning / info |
| `title` | `string` | — | 标题（可选，加粗显示） |
| `message` | `string` | — | 内容文本（必填） |
| `icon` | `Component` | 按 type 自动 | 自定义图标组件 |
| `closable` | `boolean` | `true` | 显示关闭按钮 |
| `action` | `ToastAction` | — | 操作按钮（label + onClick + variant） |
| `duration` | `number` | `3000` | 持续时间（ms），0 = 永不消失 |
| `closeButtonPosition` | `CloseButtonPosition` | 自动 | 关闭按钮位置：top-right / center-right |

**关闭按钮位置自动检测**：有 `action` 时默认 `top-right`（避免与操作按钮重叠），否则 `center-right`。

### ToastAction

| 字段 | 类型 | 说明 |
|------|------|------|
| `label` | `string` | 按钮文本（如"撤销"） |
| `onClick` | `() => void` | 点击回调 |
| `variant` | `'primary' \| 'ghost'` | 按钮样式（默认 ghost） |

### ToastConfig 全局配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `position` | `ToastPosition` | `'top-right'` | 默认位置 |
| `maxCount` | `number` | `5` | 最大同时存在数量 |
| `defaultDuration` | `number` | `3000` | 默认持续时间 (ms) |
| `defaultClosable` | `boolean` | `true` | 默认是否可关闭 |

### ToastPosition 支持的 8 个方位

`top-left` / `top-center` / `top-right` / `bottom-left` / `bottom-center` / `bottom-right` / `left-center` / `right-center`

## 核心 Composable

### useToast

全局单例管理器，模块级状态（`toasts` / `config` / `timers`）在所有调用者间共享。

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `toasts` | `Ref<ToastInstance[]>` | 当前活跃的 Toast 队列 |
| `config` | `Reactive<ToastConfig>` | 全局配置 |
| `position` | `ComputedRef<ToastPosition>` | 当前位置（computed 包装） |
| `add` | `(options) => string` | 核心方法，创建 Toast 并返回 ID |
| `remove` | `(id) => void` | 移除指定 Toast（清理定时器） |
| `update` | `(id, options) => void` | 更新已有 Toast 属性 |
| `clear` | `() => void` | 清空所有 Toast |
| `setPosition` | `(position) => void` | 动态修改位置 |
| `success/error/warning/info` | `(msg, opts?) => string` | 快捷方法 |
| `promise` | `(promise, messages) => Promise` | Promise 状态跟踪 |

### add() 关键机制

**去重策略**：500ms 内相同 `type + message` 的 Toast 不会重复创建。通过 `lastToastKey` + `lastToastTime` 模块级变量实现，避免快速连续调用产生重复提示。

**溢出处理**：当队列长度超过 `config.maxCount` 时，自动移除最早的 Toast（FIFO），确保屏幕上不会堆积过多提示。

**定时器管理**：每个 Toast 创建时启动 `setTimeout` 定时器（存入 `timers` Map），到期后先设置 `isVisible = false` 触发退出动画，再延迟移除实例。`duration = 0` 时不启动定时器（永久显示）。

**error 类型特殊处理**：error 类型默认 `duration = 5000`（其他类型 3000），给用户更多阅读时间。

### promise() 状态跟踪

```
promise(asyncFn, messages)
  → 立即创建 info Toast（显示 loading 文本，duration = 0）
  → asyncFn 成功 → update() 为 success 类型 + 启动定时器
  → asyncFn 失败 → update() 为 error 类型 + 启动定时器
  → 返回原始 Promise 结果（透传）
```

## 组件说明

### index.vue 容器组件

通过 `<Teleport to="body">` 渲染的 Toast 容器，管理堆叠动画和 8 方位定位。

**Sonner 风格堆叠**：

| 常量 | 值 | 说明 |
|------|-----|------|
| `TOAST_OFFSET` | `14px` | 堆叠时每层的垂直偏移 |
| `TOAST_SCALE` | `0.05` | 堆叠时每层的缩放递减 |
| `VISIBLE_COUNT` | `3` | 最多可见的堆叠层数 |
| `HOVER_GAP` | `10px` | Hover 展开时的间距 |

**堆叠渲染逻辑**：

1. `sortedToasts`：按 `createdAt` 倒序排列，最新的 Toast 在最前
2. `getToastStyle(index)`：根据索引计算每条 Toast 的样式：
   - `z-index`：倒序递减（最新的最高）
   - `transform`：`translateY(offset) scale(scale)`，越靠后越小越远
   - `opacity`：超过 `VISIBLE_COUNT` 的项透明度为 0
3. **Hover 展开**：鼠标悬停容器时，所有 Toast 展开为等间距排列（`HOVER_GAP`），取消缩放
4. **动态高度测量**：`watch` + `nextTick` 测量每条 Toast 的实际高度，用于 Hover 展开时精确计算偏移

**8 方位定位**：

容器通过 `position: fixed` + `positionStyle` computed 实现 8 个方位。垂直方向（top/bottom）控制堆叠方向：`top-*` 向下堆叠，`bottom-*` 向上堆叠。`left-center` / `right-center` 使用 `top: 50% + translateY(-50%)` 垂直居中。

**TransitionGroup**：`toast-stack` 过渡组，配合 `isVisible` 标志位实现进入/退出动画。退出时先设 `isVisible = false` 触发 CSS 过渡，300ms 后从队列移除 DOM。

### ToastItem 单条 Toast

单条 Toast 的完整渲染，包含图标、内容、操作按钮、进度条和关闭按钮。

**类型图标映射**：

| 类型 | 图标 | Nord 色彩 |
|------|------|-----------|
| `success` | IconCheck | `--nord-green` (#A3BE8C) |
| `error` | IconX | `--nord-red` (#BF616A) |
| `warning` | IconAlertTriangle | `--nord-yellow` (#EBCB8B) |
| `info` | IconInfoCircle | `--nord-blue` (#81A1C1) |

**渲染结构**：

```
.toast-item
├── .toast-color-bar          # 左侧色条（::before 伪元素，4px 宽，类型色）
├── .toast-icon               # 类型图标（24px，类型色）
├── .toast-content
│   ├── .toast-title          # 标题（可选，font-weight: 600）
│   └── .toast-message        # 内容文本
├── .toast-action             # 操作按钮（ghost / primary 变体）
├── .toast-close              # 关闭按钮（top-right / center-right）
└── .toast-progress           # 进度条（底部，CSS 动画）
```

**进度条**：底部 3px 高度条，通过 CSS `animation: toast-progress` 从 `scaleX(1)` 到 `scaleX(0)` 线性过渡，`animation-duration` 等于 `duration`。鼠标悬停时 `animation-play-state: paused`，暂停倒计时。

**关闭按钮位置**：`closeButtonPosition` 控制关闭按钮的垂直位置。有 `action` 操作按钮时自动切换到 `top-right`，避免与操作按钮在同一行重叠。

**暗色模式**：通过 `@media (prefers-color-scheme: dark)` 适配，调整背景色、文字色和边框色。

## 动画系统

| 动画名称 | 效果 | 用途 |
|----------|------|------|
| `toast-stack-enter` | `translateY(-20px) + scale(0.95) + opacity:0` → 正常，300ms ease-out | Toast 进入 |
| `toast-stack-leave` | 正常 → `translateY(-20px) + scale(0.95) + opacity:0`，200ms ease-in | Toast 退出 |
| `toast-progress` | `scaleX(1)` → `scaleX(0)`，线性，duration 动态 | 进度条倒计时 |
| hover 展开 | 堆叠偏移 → 等间距排列，300ms ease | 鼠标悬停容器 |

## 外部依赖

| 依赖 | 用途 |
|------|------|
| `@tabler/icons-vue` | 类型图标（IconCheck / IconX / IconAlertTriangle / IconInfoCircle）、关闭按钮 |
| `vue` | ref / reactive / computed / watch / nextTick / Teleport / TransitionGroup |
