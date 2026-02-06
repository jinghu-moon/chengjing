# NotePad 记事本

## 概述

全功能记事本组件，集成 TipTap 富文本编辑器，支持 Markdown、代码高亮、图片管理、任务列表等。采用三模式渐进式交互架构（触发器 → 迷你 → 展开），通过 `useNotes` composable 管理笔记 CRUD 与 IndexedDB 持久化。

## 目录结构

```
NotePad/
├── index.vue                              # 主组件（三模式状态机 + 笔记管理）
├── styles.css                             # 全局样式（触发器/迷你/展开/Markdown）
├── composables/
│   ├── CustomImage.ts                     # TipTap 图片扩展（lime-image:// 协议 + IndexedDB）
│   └── useBubbleMenuPosition.ts           # 气泡菜单定位（选区跟随 + 防抖更新）
└── components/
    ├── NotePadTrigger.vue                 # 触发器图标按钮（42px 圆形浮动）
    ├── MiniNotePad.vue                    # 迷你浮动记事本（可拖拽 + 简易编辑）
    ├── NotePadEditor.vue                  # 展开模式编辑器（标题/工具栏/导出/统计）
    ├── NotePadSidebar.vue                 # 笔记列表侧边栏（搜索/排序/置顶/删除）
    ├── TipTapEditor.vue                   # TipTap 编辑器核心（扩展集成 + 图片处理）
    ├── NoteBubbleMenu.vue                 # 气泡菜单容器（工具栏/链接编辑双模式）
    ├── ImageNodeView.vue                  # 图片节点视图（懒加载 + 拖拽缩放）
    └── BubbleMenu/
        ├── BubbleToolbar.vue              # 气泡工具栏（上下文感知格式按钮）
        └── BubbleLinkForm.vue             # 链接编辑表单（输入/确认/移除）
```

## 三模式架构

### 模式状态机

```
NotePadTrigger (触发器)
    │ 点击
    ▼
MiniNotePad (迷你模式)
    │ 点击展开按钮
    ▼
NotePadEditor + NotePadSidebar (展开模式)
    │ 点击关闭/ESC
    ▼
NotePadTrigger (触发器)
```

| 模式 | 组件 | 定位方式 | 编辑能力 |
|------|------|----------|----------|
| **触发器** | NotePadTrigger | fixed，相对 TodoList 宽度偏移 | 无 |
| **迷你** | MiniNotePad | fixed，useDraggableCard 可拖拽 | TipTap 无工具栏 |
| **展开** | NotePadEditor + Sidebar | fixed 全屏遮罩 + 居中面板 | TipTap 完整工具栏 + 侧边栏 |

### 模式切换数据流

- **迷你 → 展开**：`expandNote()` 将迷你编辑器内容同步到当前笔记
- **展开 → 迷你**：`collapseNote()` 将当前笔记内容同步回迷你编辑器
- **迷你内容持久化**：localStorage 自动保存（1s 防抖），key = `mini-notepad-content`

## TipTap 编辑器

### 扩展集成 (TipTapEditor.vue)

基于 `@tiptap/vue-3` 构建，集成以下扩展：

| 扩展 | 来源 | 用途 |
|------|------|------|
| StarterKit | @tiptap/starter-kit | 基础格式（段落/标题/列表/引用/代码块等） |
| Markdown | tiptap-markdown | Markdown 序列化/反序列化 |
| TaskList + TaskItem | @tiptap/extension-task-* | 任务列表（checkbox） |
| CodeBlockLowlight | @tiptap/extension-code-block-lowlight | 代码块语法高亮（lowlight common） |
| CustomImage | 自定义 | 图片节点（lime-image:// 协议） |
| Highlight | @tiptap/extension-highlight | 文本高亮 |
| Subscript / Superscript | @tiptap/extension-* | 上标/下标 |
| Link | @tiptap/extension-link | 超链接 |
| Dropcursor | @tiptap/extension-dropcursor | 拖拽光标指示 |

### 图片处理流程

```
拖拽/粘贴图片
  → handleDrop / handlePaste 拦截
  → useImageUpload 压缩处理
  → 插入 blob: URL 到编辑器
  → onUpdate 回调中检测 blob: URL
  → 转换为 lime-image://{imageId} 协议
  → IndexedDB 持久化存储
```

**关键机制**：`isLocalUpdate` 标志位防止 `v-model` 双向绑定导致的无限循环。

### CustomImage 扩展 (composables/CustomImage.ts)

继承 `@tiptap/extension-image`，扩展以下能力：

| 属性 | 类型 | 说明 |
|------|------|------|
| `data-image-id` | `string` | IndexedDB 图片 ID |
| `width` | `string` | 图片宽度（px） |
| `height` | `string` | 图片高度 |
| `align` | `string` | 对齐方式：left / center / right |

- **渲染拦截**：`renderHTML` 中将 `lime-image://` 协议 src 替换为空字符串，防止浏览器报 `ERR_UNKNOWN_URL_SCHEME`
- **节点视图**：通过 `VueNodeViewRenderer(ImageNodeView)` 渲染自定义 Vue 组件

### ImageNodeView 图片节点视图

TipTap NodeView 组件，处理图片的显示、加载和交互：

**Hydration 逻辑**（三种 src 类型）：
1. `blob:` / `data:` — 直接显示（刚上传未保存）
2. `lime-image://` — 从 IndexedDB 加载为 blob URL
3. 普通外链 — 直接显示

**懒加载**：`IntersectionObserver` + `rootMargin: 200px` 提前加载，不在视口内的图片延迟 hydrate。

**拖拽缩放**：右侧 resize-handle，`mousedown` → `mousemove` 线性计算宽度差值，最小 50px。

**状态展示**：
- 加载中：旋转 `IconLoader2` 动画
- 加载失败：`IconPhotoOff` + "图片已丢失"
- 选中态：`2px primary` 边框 + 缩放手柄显示

## 气泡菜单系统

### NoteBubbleMenu 容器

通过 `<Teleport to="body">` 渲染的浮动菜单，跟随文本选区定位。内部切换两种模式：

| 模式 | 组件 | 触发条件 |
|------|------|----------|
| **工具栏** | BubbleToolbar | 默认模式，选中文本时显示 |
| **链接编辑** | BubbleLinkForm | 点击链接按钮后切换 |

**定位引擎**：`useBubbleMenuPosition` composable，基于 `coordsAtPos` 获取选区坐标，通过 `useTooltipPosition` 计算最终位置。

**箭头系统**：4 方向箭头（top/bottom/left/right），通过 `actualPlacement` 动态切换 CSS 类。

### BubbleToolbar 上下文感知工具栏

根据当前选区内容动态展示不同操作按钮组：

| 上下文 | 显示按钮 |
|--------|----------|
| **图片选中** | 左对齐 / 居中 / 右对齐 / 删除 |
| **块级元素** | 上方插入段落 / 下方插入段落 |
| **标题内** | H1 / H2 / H3 切换 |
| **列表内** | 无序 / 有序 / 任务列表切换 |
| **文本选中** | 加粗 / 斜体 / 删除线 / 高亮 / 上标 / 下标 / 行内代码 / 链接 |

链接激活时额外显示"移除链接"按钮。

### BubbleLinkForm 链接编辑表单

内联链接输入表单，挂载时自动聚焦并全选：

- **Enter** → 应用链接（空值则移除）
- **Escape** → 取消编辑，恢复编辑器焦点
- 已有链接时显示"移除链接"按钮（IconUnlink）

## 核心 Composables

### useBubbleMenuPosition

气泡菜单定位引擎，基于文本选区坐标实时跟随：

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `isOpen` | `Ref<boolean>` | 菜单是否可见 |
| `actualPlacement` | `Ref<string>` | 实际放置方向（top/bottom/left/right + start/end） |
| `tooltipStyle` | `Ref<CSSProperties>` | 定位样式（fixed + left/top） |
| `arrowStyle` | `Ref<CSSProperties>` | 箭头偏移样式 |
| `updatePosition` | `() => void` | 手动触发位置重算 |
| `getBaseDirection` | `(placement) => string` | 提取基础方向（用于箭头 CSS 类） |
| `handleMouseDown` | `(e) => void` | 阻止 mousedown 导致编辑器失焦 |

**显示条件**：`shouldShow()` 检测非空文本选区 + 编辑器聚焦 + 可编辑状态。

**防抖策略**：
- 选区变化：100ms 防抖更新位置
- 窗口 resize：60ms 防抖重算
- 链接编辑模式切换：`nextTick` 后立即重算（表单宽度可能不同）

## 组件说明

### index.vue 主组件

三模式状态机容器，协调所有子组件：

- **笔记管理**：通过 `useNotes()` 获取笔记列表、CRUD 操作、当前笔记
- **模式切换**：`currentMode` ref 控制 trigger / mini / expanded 三态
- **文件导入**：支持 `.md` / `.txt` 文件拖入，自动创建新笔记
- **导出处理**：`processMarkdownForExport` 将 `lime-image://` 协议图片转为 Base64 内联

### NotePadEditor 展开模式编辑器

全功能编辑面板，占据主区域右侧：

- **标题输入**：顶部 `<input>` 直接编辑笔记标题
- **编辑器加载**：`defineAsyncComponent` + `<Suspense>` 异步加载 TipTapEditor
- **视图切换**：富文本 / 纯文本（plain textarea）双模式
- **字数统计**：`useAsyncWordCount` 异步计算，通过 SelectMenu 切换 8 种统计类型（字符/字数/段落/行数等）
- **导出功能**：`.md` / `.txt` 格式，图片自动转 Base64
- **图片设置**：压缩质量、最大尺寸配置面板

### NotePadSidebar 笔记列表侧边栏

220px 固定宽度侧边栏：

- **搜索过滤**：实时搜索笔记标题和内容
- **排序方式**：通过 SelectMenu 切换（更新时间 / 创建时间 / 标题）
- **笔记列表**：卡片式列表项，显示标题、更新时间、内容预览
- **置顶功能**：置顶笔记左侧 `2px primary` 边框高亮
- **删除操作**：hover 显示删除按钮
- **导入按钮**：支持 `.md` / `.txt` 文件导入

### MiniNotePad 迷你浮动记事本

320px 宽度的浮动面板，通过 `useDraggableCard` 实现拖拽：

- **拖拽区域**：header 区域（cursor: grab / grabbing）
- **编辑器**：TipTap 无工具栏模式，200px 高度
- **模式切换**：富文本 / 纯文本
- **操作按钮**：展开（进入完整编辑器）/ 关闭（回到触发器）

## 动画系统 (styles.css)

| 动画名称 | 效果 | 用途 |
|----------|------|------|
| `fade` | 纯透明度 200ms | 展开模式遮罩层 |
| `slide-fade` | 左移 20px + 缩放 0.95 + 淡入，300ms elastic | 迷你记事本进出 |
| `scale-fade` | 缩放 0.8 + 淡入，300ms elastic | 触发器图标进出 |
| `tooltip-fade` | 方向感知位移 6px + 淡入，150ms | 气泡菜单进出 |

## 外部依赖

| 依赖 | 用途 |
|------|------|
| `@tiptap/vue-3` | 编辑器核心框架 |
| `@tiptap/starter-kit` | 基础格式扩展集 |
| `tiptap-markdown` | Markdown 序列化/反序列化 |
| `@tiptap/extension-code-block-lowlight` | 代码块语法高亮 |
| `lowlight` (common) | 语法高亮引擎（Nord 主题） |
| `@tiptap/extension-task-list` / `task-item` | 任务列表 |
| `@tiptap/extension-highlight` / `subscript` / `superscript` | 文本格式扩展 |
| `@tiptap/extension-link` | 超链接 |
| `@tabler/icons-vue` | 工具栏/状态图标 |
| `useNotes` (全局 composable) | 笔记 CRUD + IndexedDB 持久化 |
| `useImageUpload` (全局 composable) | 图片压缩与上传处理 |
| `useAsyncWordCount` (全局 composable) | 异步字数统计（CJK 支持） |
| `useDraggableCard` (全局 composable) | 迷你模式拖拽定位 |
| `useTooltipPosition` (全局 composable) | 气泡菜单坐标计算 |
| `@/utils/db` | IndexedDB 图片存取（getImageUrl / saveImage） |
