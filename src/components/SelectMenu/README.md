# SelectMenu 选择菜单

## 概述

功能丰富的下拉选择组件，支持单选、多选（Checkbox/Radio）、级联子菜单、搜索过滤、网格布局、右键上下文菜单等模式。通过 `usePosition`、`useKeyboardNav`、`useSubmenuPosition`、`useSafeTriangle` 四个 Composable 解耦定位、键盘导航、子菜单定位和安全三角区逻辑。

## 目录结构

```
SelectMenu/
├── index.vue                              # 主组件（触发器 + Teleport 下拉面板）
├── index.ts                               # 统一导出（组件 + 类型 + 工具函数）
├── types.ts                               # 类型定义 + 常量配置
├── composables/
│   ├── usePosition.ts                     # 下拉定位（候选位置 + 自动翻转 + 箭头）
│   ├── useKeyboardNav.ts                  # 键盘导航（方向键 + Type-ahead + Grid 2D）
│   ├── useSubmenuPosition.ts              # 子菜单定位（左右展开 + 层级衰减）
│   └── useSafeTriangle.ts                 # 安全三角区（防止鼠标移向子菜单时误关）
└── components/
    ├── SelectTrigger.vue                  # 触发器（展示态/编辑态双模式）
    ├── SelectDropdown.vue                 # 下拉面板（列表/网格 + 子菜单渲染）
    ├── SubmenuPanel.vue                   # 子菜单面板（递归渲染 + 嵌套定位）
    └── ContextMenu.vue                    # 右键上下文菜单（Promise 式调用）
```

## 选项类型

### SelectOption

| 字段 | 类型 | 说明 |
|------|------|------|
| `value` | `string` | 选项值（唯一标识） |
| `label` | `string` | 显示文本 |
| `description` | `string` | 次级描述（仅 list 布局） |
| `danger` | `boolean` | 危险操作标记（红色高亮） |
| `shortcut` | `string` | 键盘快捷键提示（如 `⌘C`） |
| `type` | `OptionType` | 选项类型：default / checkbox / radio |
| `group` | `string` | Radio 分组名（同组互斥） |
| `checked` | `boolean` | Checkbox/Radio 选中状态 |
| `disabled` | `boolean` | 禁用状态 |
| `prefixIcon` | `Component` | 前缀图标组件 |
| `suffixIcon` | `Component` | 后缀图标组件 |
| `children` | `OptionItem[]` | 子菜单选项（级联） |

### DividerOption

`{ value: 'divider', label?: string }` — 分隔线，带 `label` 时渲染为分组标题（可点击全选/取消该组）。

## Props

### 基础属性

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string` | — | 选中值 (v-model) |
| `options` | `OptionItem[]` | — | 选项列表 |
| `placeholder` | `string` | `'请选择'` | 占位文本 |
| `triggerWidth` | `string` | `'160px'` | 触发器宽度 |
| `disabled` | `boolean` | `false` | 禁用状态 |
| `layout` | `'list' \| 'grid'` | `'list'` | 布局模式（列表/网格） |

### 交互配置

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `trigger` | `'click' \| 'hover'` | `'click'` | 触发方式 |
| `hoverDelay` | `number` | `200` | hover 模式延迟（ms） |
| `placement` | `PlacementPosition` | `'auto'` | 下拉方向偏好 |
| `showArrow` | `boolean` | `true` | 显示箭头指示器 |
| `customTrigger` | `boolean` | `false` | 自定义触发器模式（完全使用 slot） |

### 功能属性

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `clearable` | `boolean` | `false` | 可清除选中值 |
| `filterable` | `boolean` | `false` | 开启搜索过滤（双态触发器） |
| `searchPlaceholder` | `string` | `'输入关键词搜索...'` | 搜索占位符 |
| `multiple` | `boolean` | `false` | 多选标签回显模式 |
| `showPath` | `boolean` | `false` | 显示级联路径 |
| `emptyText` | `string` | `'暂无数据'` | 空数据文案 |
| `dropdownMaxHeight` | `string \| number` | `300` | 下拉最大高度 |
| `dropdownMinWidth` | `string \| number` | — | 下拉最小宽度 |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `string` | 选中值变更 |
| `change` | `string` | 选中值变更（同上，语义别名） |
| `clear` | — | 清除选中值 |
| `check` | `value: string, checked: boolean` | Checkbox 状态变化 |
| `radio-change` | `group: string, value: string` | Radio 选中变化 |

## Slots

| 插槽 | 作用域 | 说明 |
|------|--------|------|
| `trigger` | `{ isOpen, currentOption, open, close, toggle }` | 自定义触发器 |
| `header` | — | 下拉面板顶部 |
| `option` | `{ option, selected }` | 自定义选项渲染 |
| `footer` | — | 下拉面板底部 |

## 核心 Composables

### usePosition

下拉面板定位引擎，基于 `@/utils/positioning` 工具：

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `dropdownStyle` | `Ref<CSSProperties>` | 下拉面板 fixed 定位样式 |
| `arrowStyle` | `Ref<object>` | 箭头偏移样式 |
| `arrowPlacementClass` | `Ref<string>` | 箭头方向 CSS 类（arrow-top / arrow-bottom） |
| `currentPlacement` | `Ref<PlacementPosition>` | 当前实际定位方向 |
| `throttledUpdatePosition` | `Function` | RAF 节流的位置更新 |
| `resetCache` | `() => void` | 重置内容高度缓存 |

**定位策略**：
1. 获取触发器 `getBoundingClientRect()`（或 VirtualRect）
2. 幽灵测量下拉面板真实高度（临时 `opacity:0 + maxHeight:none`）
3. 按候选位置优先级逐一 `checkFit`（bottomLeft → topLeft → bottomRight → topRight）
4. 垂直回退：上下空间比较，选择较大一侧
5. `calculateCoords` 计算最终坐标 + `transformOrigin`

### useKeyboardNav

键盘导航引擎，支持列表线性导航和网格二维导航：

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `focusedIndex` | `Ref<number>` | 当前聚焦项索引 |
| `setFocusedIndex` | `(index: number) => void` | 手动设置聚焦索引 |
| `handleKeydown` | `(event: KeyboardEvent) => void` | 键盘事件处理入口 |
| `scrollToFocused` | `() => void` | 滚动到聚焦项可见区域 |
| `initFocusedIndex` | `() => void` | 从 modelValue 初始化聚焦位置 |

**导航模式**：

| 模式 | 触发条件 | 行为 |
|------|----------|------|
| **列表线性** | `layout='list'` | ↑↓ 循环遍历，跳过 divider 和 disabled |
| **网格二维** | `layout='grid'` | ↑↓ 跨行移动（最近列原则），←→ 行内移动 |
| **Type-ahead** | 按下字母键 | 跳转到首个 label 匹配的选项 |

**网格导航细节**：
- 构建 `gridMeta` 映射：每个有效选项记录 `row` / `col` 位置
- ↑↓ 移动时在目标行中查找最近列（`findNearestInRow`），保持列位置连贯
- Home / End 跳转到首项 / 末项
- `disableTypeAhead`：filterable 模式下禁用 Type-ahead（避免与搜索输入冲突）

### useSubmenuPosition

子菜单定位引擎，支持左右展开和层级视觉衰减：

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `submenuStyle` | `Ref<CSSProperties>` | 子菜单 fixed 定位样式 |
| `updatePosition` | `() => void` | 手动触发位置重算 |

**定位策略**：
1. 构建混合 Rect：父面板宽度 + 触发项高度（`parentRect.width` + `triggerItemRect.height`）
2. 4 个候选位置：right-start → left-start → right-end → left-end
3. 逐一 `checkFit` 检测可容纳方向，选择首个通过的候选
4. `SUBMENU_GAP = 2`：子菜单与父面板间距

**层级视觉衰减**（最多 3 级）：
- `opacity`：`1 - level × 0.05`（每级递减 5%）
- `scale`：`1 - level × 0.02`（每级缩小 2%）
- 通过 CSS `transform` 和 `opacity` 实现层级纵深感

### useSafeTriangle

安全三角区算法，防止鼠标从父菜单移向子菜单时误触其他选项导致子菜单关闭：

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `onItemEnter` | `(item, event) => void` | 鼠标进入选项时调用 |
| `onItemLeave` | `(item, event) => void` | 鼠标离开选项时调用 |
| `cancelExit` | `() => void` | 取消延迟关闭计时器 |

**安全三角区原理**：

```
鼠标当前位置 (P)
    ╲‾‾‾‾‾‾‾‾‾‾‾‾‾╲
     ╲   安全区域    ╲  ← 子菜单近边上角 (A)
      ╲              ╲
       ╲______________╲  ← 子菜单近边下角 (B)
```

- 三角形顶点：鼠标位置 P + 子菜单近边缘上角 A + 下角 B
- 判定算法：叉积法 `isPointInTriangle`（三次叉积符号一致则在三角形内）
- 鼠标在安全区内 → 取消关闭计时器，保持子菜单打开
- 鼠标离开安全区 → `scheduleExit` 延迟关闭（允许用户短暂偏离路径）
- 通过 `document.mousemove` 实时追踪鼠标位置

## 组件说明

### index.vue 主组件

协调 SelectTrigger + SelectDropdown 的容器组件，通过 `<Teleport to="body">` 渲染下拉面板。

**选择分发逻辑**（三种选项类型）：

| 类型 | 行为 |
|------|------|
| `checkbox` | 切换 `checked` 状态，emit `check(value, checked)` |
| `radio` | 同组互斥选中，emit `radio-change(group, value)` |
| `default` | emit `update:modelValue` + `change`，关闭下拉 |

**搜索过滤**：`filterOptionsRecursive` 递归遍历选项树，匹配 `label.includes(keyword)`，保留匹配项及其父级路径。

**级联路径**：`findOptionPath` 递归查找选中值的完整路径，`showPath` 启用时在触发器中显示 `A / B / C` 格式。

**触发模式**：
- `click`：点击触发器打开/关闭
- `hover`：鼠标进入触发器延迟打开（`hoverDelay` ms），离开延迟关闭

**样式变体**：通过 `variant` prop 支持 `sm` / `lg` / `ghost` / `primary` / `error` / `success` 等预设。

### SelectTrigger 触发器

展示态/编辑态双模式触发器，通过 `isEditMode` ref 切换：

| 模式 | 条件 | 渲染内容 |
|------|------|----------|
| **展示态** | 默认 / 非 filterable | 选中项 label + 箭头图标 |
| **编辑态** | filterable + 下拉打开 | 搜索输入框（自动聚焦） |

**关键机制**：
- **失焦缓冲**：`blur` 事件触发 200ms 延迟关闭（`blurTimer`），防止点击下拉选项时输入框失焦导致面板关闭
- **清除按钮**：hover 时显示，点击时取消 `blurTimer` 并 emit `clear`
- **多选标签**：`multiple` 模式下渲染标签列表，每个标签带删除按钮
- **级联路径**：`showPath` 模式下显示 `pathText`（`A / B / C` 格式）
- **Escape 优雅降级**：编辑态按 Escape → 退出编辑态；展示态按 Escape → 关闭菜单
- **expose**：暴露 `focus()` 方法供父组件调用

### SelectDropdown 下拉面板

列表/网格双布局的选项渲染面板，处理选项交互和子菜单管理。

**选项渲染**（三种类型）：

| 类型 | 渲染 | 交互 |
|------|------|------|
| `checkbox` | 自定义 SVG 勾选框 + label | 点击切换 checked |
| `radio` | 自定义 SVG 圆形选中标记 + label | 点击选中（同组互斥） |
| `default` | prefixIcon + label + description + suffixIcon/shortcut | 点击选中并关闭 |

**搜索高亮**：通过正则 `new RegExp(keyword, 'gi')` 匹配，`v-html` 渲染 `<mark>` 标签包裹匹配文本。

**分组标题交互**：带 `label` 的 divider 渲染为可点击分组标题，点击触发该组全选/取消全选（`handleGroupClick`）。

**相邻选中项合并样式**：连续选中的 checkbox 项通过 CSS 类合并圆角：
- `is-first`：仅顶部圆角
- `is-middle`：无圆角
- `is-last`：仅底部圆角
- `is-solo`：四角圆角

**子菜单管理**：
- X 轴趋势检测：`mouseMovingRight`（`X_THRESHOLD = 5`），鼠标向子菜单方向移动时使用较长延迟
- 延迟配置：`DELAY_FAST = 50`（快速切换）、`DELAY_SLOW = 200`（趋势保护）、`CLOSE_DELAY = 100`
- **expose**：暴露 `dropdownEl` 和 `scrollEl` refs

### SubmenuPanel 子菜单面板

递归渲染的子菜单组件，通过 `<Teleport to="body">` 独立定位：

- **递归自引用**：组件内部 `import SubmenuPanel from './SubmenuPanel.vue'`，支持无限层级嵌套
- **定位引擎**：`useSubmenuPosition` 计算 fixed 定位，基于父面板 Rect + 触发项 Rect 构建混合 Rect
- **嵌套 hover 管理**：`isNestedSubmenuHovered` 标志位，子菜单被 hover 时阻止父级关闭
- **位置更新**：`onMounted` + `watch(options)` 时触发 `updatePosition`
- **过渡动画**：`submenu-slide-right` / `submenu-slide-left`，方向由定位结果决定

### ContextMenu 右键上下文菜单

Promise 式调用的右键菜单组件，通过静态方法 `ContextMenu.open()` 创建：

```ts
const selected = await ContextMenu.open(event, options)
// selected: string | null（选中值或取消）
```

**实现机制**：
- 创建 `VirtualRect`（鼠标位置，宽高为 0）作为定位锚点
- 复用 SelectDropdown 渲染选项列表
- 全局事件监听（`setTimeout(0)` 延迟注册，避免触发事件立即关闭）：
  - `click` / `contextmenu` / `keydown(Escape)` → 关闭并 resolve(null)
  - `scroll` / `resize` → 关闭
- `onBeforeUnmount` 自动清理所有事件监听
- `context-menu` 过渡动画（缩放 + 淡入）

## 动画系统

| 动画名称 | 效果 | 用途 |
|----------|------|------|
| `select-fade` | 缩放 0.95 + 淡入，200ms ease-out | 主下拉面板开关 |
| `submenu-slide-right` | 右移 8px + 淡入，150ms | 子菜单向右展开 |
| `submenu-slide-left` | 左移 8px + 淡入，150ms | 子菜单向左展开 |
| `context-menu` | 缩放 0.9 + 淡入，150ms | 右键菜单开关 |

## 外部依赖

| 依赖 | 用途 |
|------|------|
| `@tabler/icons-vue` | 箭头、清除、勾选等图标 |
| `@/utils/positioning` | 坐标计算（checkFit / calculateCoords） |
| `@/utils/throttle` | RAF 节流（throttleRaf） |
