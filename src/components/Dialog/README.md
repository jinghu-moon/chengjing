# Dialog 对话框

## 概述

现代化对话框组件，支持组件式调用和函数式调用两种模式。提供标准对话框和 Follow Trigger（Popover 风格）两种定位方式，内置鼠标位置动画原点、beforeClose 拦截、body 滚动锁定、高度自适应动画等特性。通过 `useDialog` composable 实现全局函数式调用，`DialogProvider` 渲染函数式实例。

## 目录结构

```
Dialog/
├── index.ts                           # 统一导出
├── types.ts                           # 类型定义（DialogProps / DialogOptions / DialogInstance）
├── config.ts                          # 预设配置（confirm / alert / danger / success / form / large）
├── Dialog.vue                         # 核心对话框组件（Teleport + 动画 + 定位）
├── DialogItem.vue                     # 函数式实例包装器（provide dialogClose）
├── DialogProvider.vue                 # 函数式实例渲染容器
└── composables/
    ├── useDialog.ts                   # 函数式调用管理（全局 dialogs 数组 + Promise）
    └── useDialogPosition.ts           # Follow 模式定位（候选位置 + 自动翻转）
```

## 双模式架构

### 组件式调用

直接在模板中使用 `<Dialog>` 组件，通过 `v-model` 控制显隐：

```vue
<Dialog v-model="visible" title="提示" content="内容" />
```

### 函数式调用

通过 `useDialog()` 返回的方法命令式创建对话框，返回 `Promise<boolean>`：

```ts
const dialog = useDialog()
const confirmed = await dialog.confirm({ title: '确认删除？' })
```

**函数式调用链路**：

```
useDialog.open(options)
  → 创建 DialogInstance (id + visible + resolve/reject)
  → push 到全局 dialogs 数组
  → nextTick 设置 visible = true (触发进入动画)
  → DialogProvider 渲染 DialogItem
  → DialogItem 包装 Dialog 组件 + provide('dialogClose')
  → 用户操作 → close(id, result) → resolve(Promise) → 动画结束 → remove
```

## Props

### 基础属性

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `boolean` | `false` | 显隐状态 (v-model) |
| `title` | `string` | — | 标题 |
| `content` | `string` | — | 内容文本 |
| `type` | `DialogType` | `'info'` | 类型：info / success / warning / error / confirm |
| `size` | `DialogSize` | `'medium'` | 尺寸预设：small(400) / medium(600) / large(800) |
| `width` | `string \| number` | — | 自定义宽度（优先于 size） |

### 定位与动画

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `placement` | `DialogPlacement` | `'center'` | 位置：center / top / bottom / left / right / topLeft 等 |
| `triggerRect` | `DOMRect \| VirtualRect` | — | 提供后进入 Follow Trigger 模式 |
| `transformOrigin` | `'mouse' \| 'center'` | `'mouse'` | 动画原点模式 |
| `mousePosition` | `{ x, y }` | — | 鼠标位置（用于动画原点计算） |

### 交互配置

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mask` | `boolean` | `true` | 显示遮罩层 |
| `maskClosable` | `boolean` | `true` | 点击遮罩关闭 |
| `closable` | `boolean` | `true` | 显示关闭按钮 |
| `closeOnEsc` | `boolean` | `true` | ESC 键关闭 |
| `confirmOnEnter` | `boolean` | `true` | Enter 键确认 |
| `destroyOnClose` | `boolean` | `false` | 关闭时销毁内容 |
| `lockScroll` | `boolean` | `true` | 锁定 body 滚动 |
| `beforeClose` | `(action) => boolean \| Promise` | — | 关闭前拦截钩子 |

### 按钮配置

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `okText` | `string` | `'确定'` | 确认按钮文字 |
| `cancelText` | `string` | `'取消'` | 取消按钮文字 |
| `showConfirmBtn` | `boolean` | `true` | 显示确认按钮 |
| `showCancelBtn` | `boolean` | `false` | 显示取消按钮 |
| `okButtonProps` | `ButtonProps` | — | 确认按钮属性透传 |
| `cancelButtonProps` | `ButtonProps` | — | 取消按钮属性透传 |
| `loading` | `boolean` | `false` | 确认按钮加载状态 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `before-open` | — | 打开动画开始前 |
| `open` / `opened` | — | 打开动画结束 |
| `before-close` | — | 关闭动画开始前 |
| `close` | — | 关闭时触发 |
| `closed` | — | 关闭动画结束（destroyOnClose 在此时销毁） |
| `positive-click` | — | 点击确认按钮 |
| `negative-click` | — | 点击取消/关闭按钮 |
| `mask-click` | — | 点击遮罩层 |
| `esc` | — | 按下 ESC 键 |

## Slots

| 插槽 | 说明 |
|------|------|
| `default` | 对话框内容（覆盖 content prop） |
| `header` | 自定义标题区域 |
| `footer` | 自定义底部按钮区域 |

## 核心 Composables

### useDialog

全局函数式调用管理器，维护模块级 `dialogs` 数组：

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `dialogs` | `Ref<DialogInstance[]>` | 当前活跃的对话框实例列表 |
| `open(options)` | `(DialogOptions) => Promise<boolean>` | 核心方法，创建实例并返回 Promise |
| `close(id, result)` | — | 关闭指定实例，resolve Promise |
| `remove(id)` | — | 动画结束后移除实例 |
| `confirm(options)` | 快捷方法 | type=confirm + showCancelBtn |
| `info(options)` | 快捷方法 | type=info |
| `success(options)` | 快捷方法 | type=success |
| `warning(options)` | 快捷方法 | type=warning |
| `error(options)` | 快捷方法 | type=error |

### useDialogPosition

Follow Trigger 模式的定位引擎，基于 `@/utils/positioning` 工具：

- **候选位置**：8 个方向（bottomLeft / topLeft / bottomRight / topRight / bottom / top / left / right）
- **自动翻转**：按用户偏好排序候选位置，逐一检测 `checkFit`，选择首个可容纳的方向
- **垂直回退**：所有候选均不适配时，比较上下空间选择较大一侧
- **RAF 节流**：`throttledUpdatePosition` 用于高频更新场景

## 预设配置 (config.ts)

| 预设 | type | size | showCancelBtn | confirmOnEnter | 说明 |
|------|------|------|---------------|----------------|------|
| `confirm` | warning | small | ✅ | ✅ | 确认对话框 |
| `alert` | info | small | ❌ | ✅ | 提示对话框 |
| `danger` | error | small | ✅ | ❌ | 危险操作（不允许 Enter 快速确认） |
| `success` | success | small | ❌ | ✅ | 成功提示 |
| `form` | info | medium | ✅ | ❌ | 表单对话框（避免多行输入误触） |
| `large` | info | large | ✅ | ❌ | 大内容对话框 |

## 动画系统

### 标准模式动画 (`dialog`)

从鼠标点击位置展开/收起，通过 CSS 变量 `--dialog-origin-x/y` 动态设置 `transform-origin`：

- **进入**：scale(0) → scale(1)，400ms ease-out
- **离开**：scale(1) → scale(0)，300ms ease-in

### Follow 模式动画 (`zoom-fade`)

从触发元素方向滑入，通过 `--dialog-slide-direction` 控制方向：

- **进入/离开**：translateY(±12px) + scale(0.95) + opacity，200ms

### 其他动画

- **遮罩层**：`fade` 纯透明度过渡，300ms
- **高度自适应**：`ResizeObserver` 监听内容高度变化，CSS `transition: height 0.3s`

## 组件说明

### Dialog.vue 核心组件

通过 `<Teleport to="body">` 渲染，内部结构：遮罩层 → 布局容器 → 对话框面板（header + body + footer）。

关键机制：
- **shouldRender / visible 双状态**：shouldRender 控制 DOM 存在，visible 控制动画进出
- **body 滚动锁定**：打开时计算滚动条宽度补偿 `paddingRight`，避免页面抖动
- **ResizeObserver**：监听 `dialog-panel-inner` 高度变化，驱动面板高度平滑过渡

### DialogItem.vue 函数式实例包装器

将 `DialogInstance` 映射为 `<Dialog>` 组件 props，处理函数式调用的事件桥接：

- **provide('dialogClose')**：允许自定义组件内容通过 `inject` 主动关闭对话框并传递结果
- **loading 管理**：`onOk` 为异步时自动设置 `instance.loading = true`，完成后恢复
- **动画结束清理**：`@after-close` 时调用 `remove(id)` 从全局数组移除实例

### DialogProvider.vue 渲染容器

遍历 `useDialog().dialogs` 数组，为每个实例渲染 `<DialogItem>`。需在应用根组件中挂载一次。

## 外部依赖

| 依赖 | 用途 |
|------|------|
| `@tabler/icons-vue` | 类型图标（info/success/warning/error/confirm）+ 关闭按钮 |
| `@/components/Button` | 底部确认/取消按钮 + buttonPresets |
| `@/utils/positioning` | Follow 模式坐标计算（checkFit / calculateCoords） |
| `@/utils/throttle` | RAF 节流（throttleRaf） |
