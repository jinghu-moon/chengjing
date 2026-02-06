# SettingsPanel 设置面板

## 概述

全局设置面板组件，以右侧抽屉形式展示，管理应用所有可配置项。内部按功能分组为可折叠卡片（手风琴），涵盖配置预设、番茄钟、待办清单、便签、每日诗词、图标风格、搜索框、布局壁纸、功能模块等设置区域。通过 `useSettings` composable 读写全局设置，子组件 `SettingSlider`、`SettingSwitch`、`CapsuleTabs`、`LayoutSelector`、`LayoutSettingsModal` 提供专用控件。

## 目录结构

```
SettingsPanel/
├── index.vue                              # 主组件（右侧抽屉 + 折叠卡片分组）
├── styles.css                             # 全局样式（面板/卡片/控件/动画）
└── components/
    ├── SettingSlider.vue                  # 数值滑块控件（range + 数字输入 + ±按钮）
    ├── SettingSwitch.vue                  # 开关控件（label + toggle switch）
    ├── CapsuleTabs.vue                   # 胶囊标签页（滑动指示器 + 键盘导航）
    ├── LayoutSelector.vue                # 布局网格选择器（预设 + 自定义）
    └── LayoutSettingsModal.vue           # 布局设置弹窗（网格/间距/文件夹策略）
```

## 面板架构

### 抽屉式布局

- **定位**：`fixed` 右侧，距四边 `var(--space-4)`，宽度 360px
- **进出动画**：`translateX(120%)` ↔ `translateX(0)`，400ms ease-smooth
- **遮罩层**：半透明背景 + 轻度模糊，点击关闭面板
- **内容滚动**：`panel-content` 区域 `overflow-y: auto`，4px 细滚动条

### 折叠卡片（手风琴）

每个设置分组为一个 `section-card`，通过 JS 动画实现高度过渡：

| 钩子 | 逻辑 |
|------|------|
| `onEnter` | 临时 `position:absolute + visibility:hidden` 测量真实高度 → `height:0` → rAF → `height:目标值` |
| `onAfterEnter` | 恢复 `height:auto`（允许内容动态变化） |
| `onLeave` | 读取当前高度 → 强制重绘 → rAF → `height:0` |

折叠状态通过 `sectionState` reactive 对象管理，`toggleSection(key)` 切换。

## 设置分组

| 分组 key | 图标 | 标题 | 主要设置项 |
|----------|------|------|-----------|
| `presets` | IconPackage | 配置预设 | PresetManager 组件（预设导入/导出/切换） |
| `pomodoro` | IconFocus2 | 番茄钟设置 | 自动休息、自动循环、专注时长、休息时长 |
| `todo` | IconListCheck | 待办清单设置 | 开关、默认折叠、面板宽度、列表最大高度 |
| `notepad` | IconNotes | 便签设置 | 开关、编辑器模式（富文本/纯文本）、宽高、位置重置 |
| `dailyPoem` | IconSparkles | 每日诗词设置 | 开关、在线API、显示作者/标题、操作按钮、API来源/分类 |
| `style` | IconPalette | 图标风格 | 图标大小、盒子尺寸、圆角、不透明度、阴影、隐藏名称 |
| `search` | IconSearch | 搜索框样式 | 开关、搜索按钮、宽度、高度、圆角、不透明度 |
| `layout` | IconLayoutDashboard | 布局与壁纸 | 桌面布局、顶部留白、间距、文件夹大小、壁纸模糊/遮罩/每日Bing/自定义上传 |
| `features` | IconApps | 功能模块 | 时钟、快捷方式、计算器、新标签页打开、清空删除文件夹 |

## 组件说明

### SettingSlider 数值滑块

数值调节控件，提供三种交互方式：

| 交互 | 说明 |
|------|------|
| **range 滑块** | 拖拽调节，CSS 变量驱动进度条填充色 |
| **数字输入框** | 直接键入数值，`type="number"` + 隐藏原生 spinner |
| **±按钮** | 点击 IconMinus / IconPlus 按 step 步进 |
| **滚轮** | 输入框上滚轮调节（向上增加，向下减少） |

**Props**：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `number` | — | 当前值 (v-model) |
| `label` | `string` | — | 标签文本 |
| `min` | `number` | — | 最小值 |
| `max` | `number` | — | 最大值 |
| `step` | `number` | `1` | 步进值 |
| `unit` | `string` | `''` | 单位文本（px / % / 分钟等） |

**range 进度填充**：通过 CSS 变量 `--value` / `--min` / `--max` 计算 `linear-gradient` 填充比例，实现滑块左侧着色效果。

### SettingSwitch 开关控件

布尔值切换控件，label + toggle switch 横向排列。

**Props**：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `boolean` | — | 开关状态 (v-model) |
| `label` | `string` | — | 标签文本 |
| `size` | `'normal' \| 'sm'` | `'normal'` | 尺寸（normal: 44×24, sm: 36×20） |

**实现**：纯 CSS 实现，隐藏原生 `<input type="checkbox">`，通过 `:checked + .slider` 伪类驱动滑块位移和背景色变化。

### CapsuleTabs 胶囊标签页

带滑动指示器的标签页切换组件，支持 flex 横向和 grid 网格两种布局。

**Props**：

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string \| number` | — | 选中值 (v-model) |
| `items` | `CapsuleTabItem[]` | — | 标签项（value + label + icon?） |
| `equalWidth` | `boolean` | `false` | 等宽模式（取所有标签最大宽度） |
| `stretch` | `boolean` | `false` | 拉伸模式（均分容器宽度） |
| `layout` | `'flex' \| 'grid'` | `'flex'` | 布局模式 |
| `gridCols` | `number` | `2` | grid 模式列数 |

**滑动指示器**：
- 绝对定位的 `capsule-indicator` 元素，通过 `transform: translate(x, y)` + `width` + `height` 跟随激活标签
- 切换动画：350ms `cubic-bezier(0.34, 1.25, 0.64, 1)`（弹性过冲）
- 布局变化时禁用过渡（`enableTransition = false`），下一帧恢复

**Ghost 元素防抖动**：每个标签内部包含 `tab-content`（可见）+ `tab-ghost`（隐藏，font-weight:600），通过 `grid-area: stack` 重叠，确保激活态加粗时宽度不变。

**键盘导航**：
- flex 模式：←→ 循环切换
- grid 模式：←→ 行内移动，↑↓ 跨行移动（边界检查）

**ResizeObserver**：监听容器尺寸变化，自动重算指示器位置和等宽值。

### LayoutSelector 布局网格选择器

3×2 网格布局的桌面网格预设选择器，5 个预设 + 1 个自定义入口。

**预设列表**：`2x4` / `2x5` / `2x6` / `2x7` / `3x3`

**棋盘格预览**：每个预设卡片内通过 CSS Grid（`--p-rows` × `--p-cols`）渲染棋盘格缩略图，`isLight` 函数计算交替着色。

**选中态**：白色 outline 边框 + 上浮阴影 + 棋盘格高对比度配色。

**自定义入口**：点击展开父组件的自定义滑块区域（通过 `emit('toggleCustom', true)`）。

### LayoutSettingsModal 布局设置弹窗

独立模态弹窗，提供桌面网格的完整配置界面。

**布局**：定位于设置面板左侧（`padding-right: 396px`），小屏幕居中显示。

**功能区域**：

| 区域 | 内容 |
|------|------|
| **网格大小** | LayoutSelector 预设选择 + 自定义滑块（行数/列数/列间距/行间距/文件夹内部间距） |
| **大文件夹策略** | 双卡片 Radio 选择：自动压缩（保持布局整齐）/ 保持原样（空间不足换页） |

**动画**：`modal-slide` 过渡（右移 30px + 缩放 0.95 + 淡入，300ms）。

## 主组件关键逻辑

### 壁纸上传

`handleFileChange` 处理自定义壁纸上传：
1. 校验文件大小 < 10MB
2. `FileReader.readAsDataURL` 转 Base64
3. `saveImage('custom-bg', base64)` 存入 IndexedDB
4. 清除 localStorage 旧缓存
5. 关闭每日 Bing 壁纸
6. `forceWallpaperUpdate()` 强制刷新

### 每日诗词 API 配置

通过 `useDailyPoem` composable 管理诗词设置：
- **API 来源切换**：今日诗词（智能推荐）/ 一言 Hitokoto
- **Hitokoto 分类**：Checkbox 多选（诗词/哲学/文学/动画/影视/其他），`handleCategoryCheck` 维护分类数组
- **条件渲染**：在线模式开启时展示 API 配置区域，Hitokoto 选中时展示分类筛选

### 恢复默认设置

`handleReset` 执行：`confirm` 确认 → `resetSettings()` → 清除 localStorage `custom-bg` → 删除 IndexedDB 自定义壁纸。

## 动画系统

| 动画名称 | 效果 | 用途 |
|----------|------|------|
| 面板滑入 | `translateX(120%)` → `translateX(0)`，400ms | 设置面板开关 |
| `accordion` | JS 驱动高度过渡，300ms ease-smooth | 折叠卡片展开/收起 |
| `slide-fade` | `max-height` + `opacity`，300ms | 子设置项条件显隐 |
| `expand` | `max-height` + `opacity` + `margin`，300ms | API 配置区域展开 |
| `modal-slide` | 右移 30px + 缩放 0.95 + 淡入，300ms | 布局弹窗进出 |

## 外部依赖

| 依赖 | 用途 |
|------|------|
| `@tabler/icons-vue` | 分组图标、关闭按钮、±按钮、布局策略图标 |
| `useSettings` | 全局设置读写（自动导入） |
| `useDailyPoem` | 每日诗词设置管理 |
| `@/utils/db` | IndexedDB 图片存取（saveImage / removeImage） |
| `SelectMenu` | API 来源 / 分类筛选下拉选择 |
| `PresetManager` | 配置预设管理组件 |
