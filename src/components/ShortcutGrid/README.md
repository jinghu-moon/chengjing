# ShortcutGrid 快捷方式网格

## 概述

桌面快捷方式网格组件，实现类 iOS 主屏幕的图标管理体验。支持多页横向滑动（@tanstack/vue-virtual 虚拟化）、文件夹（任意 RxC 布局）、拖拽排序与合并（vue-draggable-plus）、布局快照系统、右键上下文菜单等。通过 Provide/Inject（GridStateKey）实现跨组件状态共享，5 个 Composable 分别管理布局分页、数据持久化、拖拽状态机、文件夹图标尺寸和快照系统。

## 目录结构

```
ShortcutGrid/
├── ShortcutGrid.vue                          # 主组件（虚拟化分页 + 状态提供者）
├── index.ts                                  # 统一导出
├── keys.ts                                   # GridState InjectionKey 定义
├── config.ts                                 # 默认快捷方式 + 随机颜色池
├── LAYOUT_DESIGN.md                          # 文件夹尺寸计算设计文档
├── styles/
│   └── index.css                             # 全局样式（网格/图标/文件夹/模态框/动画）
├── composables/
│   ├── useShortcutLayout.ts                  # 分页引擎（容量计算 + 自动回流）
│   ├── useShortcutData.ts                    # 数据 CRUD + localStorage 持久化
│   ├── useShortcutDrag.ts                    # 拖拽状态机（桌面拖入文件夹 + 文件夹内拖出）
│   ├── useFolderIconSize.ts                  # 文件夹 CSS 变量计算引擎（iOS 风格圆角）
│   └── useSnapshot.ts                        # 布局快照 CRUD + JSON 导入导出
└── components/
    ├── GridPage.vue                          # 单页容器（VueDraggable 包装）
    ├── ShortcutItem.vue                      # 快捷方式项（app 图标 / 文件夹网格）
    ├── FolderModal.vue                       # 文件夹展开弹窗（全屏遮罩 + 内部拖拽）
    ├── EditForm.vue                          # 快捷方式编辑表单（图标/URL/颜色/文件夹布局）
    └── SnapshotManager/
        ├── SnapshotManager.vue               # 快照管理面板（列表 + 详情 + 操作）
        └── SnapshotPreview.vue               # 快照缩略预览（缩放渲染 ShortcutGrid）
```

## 主组件架构 (ShortcutGrid.vue)

### 双数据源模式

主组件支持**真实模式**和**预览模式**两种数据源：

| 模式 | 触发条件 | 数据来源 | 交互能力 |
|------|----------|----------|----------|
| **真实模式** | 默认 | useShortcutData + useShortcutLayout | 完整（拖拽/编辑/右键） |
| **预览模式** | 传入 `previewSnapshot` prop | 快照数据，mock 空函数 | 只读（仅渲染） |

预览模式用于 SnapshotPreview 中缩放渲染快照缩略图。

### 虚拟化分页

基于 `@tanstack/vue-virtual` 的 `useVirtualizer` 实现横向页面虚拟化：

- **横向滚动**：`horizontal` 方向，每页宽度 = 容器宽度
- **scroll-snap**：`scroll-snap-type: x mandatory` 实现页面吸附
- **页面导航**：左右箭头按钮（`scrollToIndex`）+ 底部分页圆点
- **移动端适配**：768px 以下隐藏导航箭头，依赖触摸滑动

### 状态共享 (GridStateKey)

通过 `InjectionKey<GridState>` 向子组件提供全局状态：

| 字段 | 类型 | 说明 |
|------|------|------|
| `settings` | `Ref` | 布局设置（行列数/间距/文件夹模式等） |
| `iconConfig` | `Ref` | 图标配置（盒子尺寸/圆角/缩放/透明度/阴影） |
| `dragTargetFolderId` | `Ref<string \| null>` | 当前拖拽悬停的文件夹 ID |
| `mergeTargetId` | `Ref<string \| null>` | 当前拖拽悬停的合并目标 app ID |
| `previewFolderId` | `Ref<string \| null>` | 正在预览的文件夹 ID |
| `previewChildren` | `Ref<Shortcut[] \| null>` | 拖拽过程中的实时预览子项 |
| `openShortcut` | `Function` | 打开快捷方式（新标签页/当前页） |
| `openFolder` | `Function` | 打开文件夹弹窗 |
| `showContextMenu` | `Function` | 显示右键上下文菜单 |

### CSS 变量系统

主组件通过 `containerStyle` computed 注入全局 CSS 变量：

| 变量 | 来源 | 说明 |
|------|------|------|
| `--grid-cols` | settings.layoutGridCols | 网格列数 |
| `--grid-rows` | settings.layoutGridRows | 网格行数 |
| `--grid-gap-x` | settings.layoutGridGapX | 列间距 (px) |
| `--grid-gap-y` | settings.layoutGridGapY | 行间距 (px) |
| `--item-size` | iconConfig.boxSize | 图标盒子尺寸 (px) |
| `--item-radius` | iconConfig.radius | 图标圆角 (%) |
| `--icon-scale` | iconConfig.iconScale | 图标缩放 (%) |
| `--bg-opacity` | iconConfig.opacity / 100 | 背景透明度 |
| `--shadow-display` | iconConfig.showShadow | 阴影显隐 (block/none) |
| `--label-display` | settings.hideShortcutNames | 名称显隐 (block/none) |
| `--dynamic-container-width` | computed | 容器动态宽度 |

## 核心 Composables

### useShortcutLayout 分页引擎

将快捷方式列表按网格容量自动分页，处理文件夹占多格位的情况。

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `pages` | `Ref<Shortcut[][]>` | 分页后的二维数组 |
| `pageCapacity` | `ComputedRef<number>` | 单页容量（rows × cols） |
| `reflowShortcuts` | `() => void` | 重新分页（手动触发） |
| `syncFromPages` | `() => boolean` | 从 pages 反向同步到 shortcuts（JSON diff 检查） |

**分页算法**：

1. `getItemSlots(item)` 计算每个项目占用的格位数：
   - 普通 app → 1 格
   - 文件夹 → `rows × cols`（由 folderMode 决定，如 `2x2` = 4 格）
   - 单行文件夹优化：`1xN` 模式展平为 N 格
2. `reflowShortcuts` 按顺序将项目装入页面，当前页剩余容量不足时溢出到下一页
3. `watch` 监听 5 个设置项变化（行列数/间距/文件夹模式/大文件夹策略）自动触发回流

### useShortcutData 数据持久化

快捷方式 CRUD 操作与 localStorage 持久化。

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `shortcuts` | `Ref<Shortcut[]>` | 快捷方式列表（扁平，含文件夹） |
| `loadData` | `() => void` | 从 localStorage 加载（含迁移：补全缺失 id/type/children） |
| `saveData` | `() => void` | 保存到 localStorage |
| `resetToDemo` | `() => void` | 重置为默认数据（confirm 确认 + 深拷贝） |
| `createFolder` | `() => Shortcut` | 创建空文件夹（随机颜色） |

### useShortcutDrag 拖拽状态机

复杂的拖拽交互系统，支持桌面拖入文件夹和文件夹内拖出两种场景。

**状态机**：

```
idle ──→ dragging-inside ──→ idle
  │                            ↑
  └──→ dragging-outside ───────┘
```

| 状态 | 含义 | 触发条件 |
|------|------|----------|
| `idle` | 无拖拽 | 初始 / 拖拽结束 |
| `dragging-inside` | 桌面内拖拽 | 桌面 GridPage 内 `@start` |
| `dragging-outside` | 从文件夹内拖出 | 文件夹内拖拽超出边界 |

**Logic A — 桌面拖拽（dragging-inside）**：

1. `handleGlobalMouseMove`（16ms 节流）通过 `elementsFromPoint` 检测鼠标下方元素
2. 检测到 `.is-folder` → 设置 `dragTargetFolderId`（拖入文件夹高亮）
3. 检测到 `.shortcut-item:not(.is-folder)` → 设置 `mergeTargetId`（合并创建文件夹高亮）
4. `onDragEnd` 处理最终操作：
   - 有 `dragTargetFolderId` → 将拖拽项移入目标文件夹
   - 有 `mergeTargetId` → 创建新文件夹，将两个 app 合并
   - 都没有 → 普通排序完成

**Logic B — 文件夹内拖出（dragging-outside）**：

1. `detectFolderExit` 通过 `getBoundingClientRect` 检测拖拽项是否超出文件夹边界
2. 超出时 `onFolderMove` 返回 `false`（冻结 VueDraggable 排序）
3. `onFolderDragEnd` 将项目从文件夹移除，插入桌面 `hoverDropIndex` 位置
4. 空文件夹自动清理（children.length === 0 时删除）
5. 深拷贝上下文防止引用污染

### useFolderIconSize CSS 变量计算引擎

为任意 RxC 文件夹布局计算精确的 CSS 变量，实现 iOS 风格的图标圆角。

**核心函数 `calculateModeVars(mode)`**：

```
输入：mode = "2x3"（行×列）
输出：CSS 变量对象 {
  --f-rows: 2,        // 外部网格跨行数
  --f-cols: 3,        // 外部网格跨列数
  --f-inner-rows: 2,  // 内部网格行数
  --f-inner-cols: 3,  // 内部网格列数
  --f-inner-gap: 4px, // 内部间距
  --f-inner-pad: 12px,// 内部 padding
  --f-icon-size: 81px,// 内部小图标尺寸
  --f-radius: 24px,   // 文件夹外部圆角
  --f-icon-radius: 18px // 内部图标圆角（22% of min dimension）
}
```

**关键设计**：
- **圆角比例**：`22% × min(iconSize, iconSize)` — 模拟 iOS 图标的 superellipse 圆角
- **1x1 特殊处理**：外部 1×1 但内部渲染 3×3 微型网格
- **预计算缓存**：`folderSizeVars` 预计算 9 种常用模式（1x1 ~ 4x4），避免运行时重复计算
- **`getCapacity(mode)`**：返回文件夹可容纳的子项数量

### useSnapshot 布局快照系统

布局快照的 CRUD、导入导出与 localStorage 持久化。

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `snapshots` | `Ref<LayoutSnapshot[]>` | 快照列表 |
| `createSnapshot` | `(name, data) => LayoutSnapshot` | 创建快照 |
| `restoreSnapshot` | `(id) => SnapshotData \| null` | 恢复快照数据 |
| `removeSnapshot` | `(id) => void` | 删除快照 |
| `renameSnapshot` | `(id, name) => void` | 重命名 |
| `exportSnapshot` | `(id) => void` | 导出为 JSON 文件下载 |
| `importSnapshot` | `(file) => Promise<LayoutSnapshot>` | 从 JSON 文件导入 |
| `getStorageSize` | `() => number` | 获取存储占用字节数 |

**持久化策略**：
- 存储 key：`lime-snapshots`
- 最大数量：`MAX_SNAPSHOTS = 20`
- `persistSnapshots` 写入时捕获 `QuotaExceededError`，自动移除最旧快照重试（最多 3 次）
- `validateSnapshot` 类型守卫确保导入数据结构完整性

### useGridActions 操作处理器

快捷方式的增删改操作，集成 Dialog 函数式调用和 Toast 通知。

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `openAddModal` | `() => Promise` | 打开新增弹窗（Dialog + EditForm） |
| `openEditModal` | `(item) => Promise` | 打开编辑弹窗（Dialog + EditForm） |
| `deleteItem` | `(id) => () => void` | 删除项目，返回撤销闭包 |
| `showContextMenu` | `(evt, item) => void` | 右键菜单（编辑/删除选项） |

**交互链路**：
- 新增/编辑 → `useDialog().open()` 渲染 EditForm → `onSave` 回调实时更新 → 关闭时持久化
- 删除 → 从列表移除 + Toast 通知（带撤销按钮）→ 撤销时恢复原位
- 右键 → `ContextMenu.open(event, options)` → 选择编辑/删除

## 组件说明

### GridPage 单页容器

VueDraggable 包装的单页网格，通过 `inject(GridStateKey)` 获取全局状态。

**核心职责**：
- 渲染 `v-for` 遍历的 ShortcutItem 列表
- VueDraggable 配置：`group` 共享（跨页拖拽）、`animation: 300`、`ghost-class: shortcut-ghost`
- 最后一页末尾渲染"添加"按钮（虚线 dashed 样式）
- 事件代理：`@start` / `@end` / `@update` 转发给父组件拖拽处理

### ShortcutItem 快捷方式项

根据 `type` 渲染两种形态的快捷方式项：

| 类型 | 渲染内容 | 交互 |
|------|----------|------|
| **app** | icon-box（favicon + 首字母 fallback）+ 名称 | 点击打开 URL，右键菜单 |
| **folder** | folder-box（folder-grid 内嵌 mini-app 图标）+ 名称 | 点击打开文件夹弹窗 |

**图标加载**：
- 优先使用 `iconBase64`（自定义上传）
- 回退到 Bitwarden Icons API：`https://icons.bitwarden.net/{hostname}/icon.png`
- 加载失败时显示首字母 fallback（`shortcut-fallback`，`opacity: 0 → 1`）

**文件夹网格渲染**：
- `useFolderIconSize` 注入 CSS 变量控制内部网格布局
- `effectiveChildren` 优先使用 `previewChildren`（拖拽实时预览）
- `needsNesting`：子项数 > 容量时启用嵌套预览（最后一格显示 `+N`）
- `visibleChildren`：嵌套时取前 `capacity - 1` 项 + 嵌套指示器

### FolderModal 文件夹展开弹窗

全屏遮罩式文件夹内容展示，支持内部拖拽排序和拖出到桌面。

**布局**：
- `<Teleport to="body">` 渲染，`folder-overlay` 全屏遮罩（blur 8px）
- `folder-container` 居中面板（520px，max 90vw），玻璃拟态背景
- 顶部标题输入框（`v-model` 直接编辑文件夹名称）
- 内部 VueDraggable 网格（`auto-fill` 列，响应式布局）

**拖拽集成**：
- `draggableGroup` 与桌面共享 group（支持跨容器拖拽）
- `@change` 事件计算预览顺序（手动 splice 模拟），emit `previewUpdate`
- `handleFolderMove` 返回 `false` 阻止拖出时的排序
- `isDraggingOut` 状态驱动视觉反馈（遮罩透明 + 面板缩小淡出）

**事件**：

| 事件 | 说明 |
|------|------|
| `close` | 关闭弹窗（点击遮罩 / ESC） |
| `openShortcut` | 点击子项打开 URL |
| `folderDragStart/End` | 文件夹内拖拽开始/结束 |
| `folderUpdate` | 内部排序变化 |
| `previewUpdate` | 拖拽过程中实时预览 |
| `contextmenu` | 子项右键菜单 |

### EditForm 编辑表单

快捷方式新增/编辑的表单组件，通过 Dialog 函数式调用渲染。根据 `isFolderMode` 切换两种表单：

**App 模式**（`isFolderMode = false`）：

| 区域 | 内容 |
|------|------|
| **图标预览** | 80px 预览框，点击上传自定义图标（FileReader → Base64） |
| **名称/URL** | 两个 modern-input 输入框 |
| **显示选项** | 填充（filled）/ 反色（inverted）切换按钮 |
| **背景颜色** | 17 个预设色 + 自定义取色器 + 清除按钮 |

**文件夹模式**（`isFolderMode = true`）：

| 区域 | 内容 |
|------|------|
| **名称** | 文件夹名称输入框 |
| **布局尺寸** | CapsuleTabs 选择器（默认/1x1/2x2/2x3/3x2/3x3/4x4）+ 自定义 RxC 输入（滚轮调节） |

**实时更新**：`watch(formData, deep: true)` 监听变化，通过 `onSave` 回调实时同步到父组件。

### SnapshotManager 快照管理面板

左右分栏的快照管理界面，通过 Dialog 函数式调用渲染（800×580px）。

**左侧 — 快照列表**（240px）：
- 按创建时间倒序排列
- 每项显示：图标 + 名称 + 时间（今天/昨天/日期）
- 选中态：primary 背景 + 勾选徽章
- 空状态：IconLayoutOff + "暂无快照"

**右侧 — 详情面板**：
- **信息卡片**：名称（双击重命名）+ 统计胶囊（应用数/文件夹数/预览模式/网格尺寸/创建时间）
- **预览卡片**：16:9 视口内渲染 SnapshotPreview 缩略图
- **操作区**：恢复 / 导出 / 删除 三按钮（grid 三等分）

**底部**：快照数量/上限 + 存储占用 + 导入按钮（`<input type="file" accept=".json">`）

**事件**：`restore` / `delete` / `rename` / `export` / `import` / `close`

### SnapshotPreview 快照缩略预览

将完整的 ShortcutGrid 缩放渲染到 16:9 视口中，用于快照管理面板的预览卡片。

**缩放机制**：
1. `ResizeObserver` 监听容器实际尺寸
2. `contentSize` 根据快照设置计算原始内容尺寸（cols × boxSize + gaps + padding）
3. `scale = min(containerWidth / contentWidth, containerHeight / contentHeight, 1)`（contain 模式，不放大）
4. `wrapperStyle` 通过 `transform: scale()` + `marginLeft/Top` 居中偏移
5. `shouldRender` 延迟到 ResizeObserver 首次回调后才渲染（避免闪烁）

渲染时传入 `previewSnapshot` prop，ShortcutGrid 进入只读预览模式。

## 样式系统 (styles/index.css)

### 核心布局层级

| 层级 | 类名 | 说明 |
|------|------|------|
| **外层** | `.shortcuts-wrapper` | flex column 居中，overflow visible |
| **分页容器** | `.pages-container` | flex 横向，scroll-snap，`max-width: min(var(--dynamic-container-width), 100vw)` |
| **单页** | `.grid-page` | flex: 0 0 100%，scroll-snap-align: start，内部垂直滚动 |
| **网格** | `.page-inner-grid` | CSS Grid，`repeat(var(--grid-cols), var(--item-size))`，gap 变量驱动 |

### 图标与文件夹外观

**App 图标 (`.icon-box`)**：
- 玻璃拟态：`rgba(255,255,255, var(--bg-opacity))` + `backdrop-filter: blur(12px)`
- Hover：背景变白 + 品牌色阴影 + `translateY(-4px)` 上浮
- 变体：`.filled`（图标撑满）、`.inverted`（暗底 + `filter: invert(1)`）、`.dashed`（虚线添加按钮）
- 合并目标态：`.is-merge-target` 蓝色光晕 + `scale(1.08)`

**文件夹 (`.folder-box`)**：
- 玻璃拟态：`rgba(255,255,255,0.15)` + `backdrop-filter: blur(20px)`
- 动态圆角：`var(--f-radius)` 由 useFolderIconSize 计算
- 拖拽目标态：`.is-drag-target` 蓝色光晕 + `scale(1.05)`
- 内部网格：`.folder-grid` 使用 `var(--f-inner-rows/cols/gap/pad)` 变量驱动

### 导航与分页指示器

**导航箭头 (`.nav-arrow` / `.nav-btn-glass`)**：
- 绝对定位左右两侧，48px 圆形玻璃拟态按钮
- Hover：`scale(1.1)` + 白色高亮
- 768px 以下隐藏（移动端触摸滑动）

**分页圆点 (`.pagination-dots`)**：
- Fixed 底部居中，玻璃拟态背景条
- 8px 圆点，激活态：白色 + `scale(1.3)` + 发光阴影

## 动画系统

| 动画名称 | 效果 | 用途 |
|----------|------|------|
| `fade` | 纯透明度 300ms | 导航箭头显隐 |
| `folder-fade` | 透明度 + 子元素 scale(0.9)，300ms | 文件夹弹窗进出 |
| `folder-expand` | scale(0.9) + 淡入，250ms elastic | 文件夹内容展开 |
| `modalUp` | scale(0.95) + translateY(10px) + 淡入，300ms elastic | 编辑弹窗进入 |
| `fadeIn` | 纯透明度 200ms | 文件夹遮罩层 |
| `shortcut-ghost` | opacity: 0.2 | 拖拽占位符 |

## 外部依赖

| 依赖 | 用途 |
|------|------|
| `@tanstack/vue-virtual` | 横向页面虚拟化（useVirtualizer） |
| `vue-draggable-plus` | 拖拽排序（VueDraggable，基于 Sortable.js） |
| `@tabler/icons-vue` | 导航箭头、操作按钮、状态图标 |
| `useSettings` | 全局设置读取（布局/图标配置） |
| `useDialog` | 函数式对话框（编辑表单/快照管理） |
| `useToast` | Toast 通知（删除撤销） |
| `ContextMenu` | 右键上下文菜单（编辑/删除） |
| `CapsuleTabs` | 文件夹布局尺寸选择器（EditForm 引用） |
