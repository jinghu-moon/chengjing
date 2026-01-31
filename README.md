<div align="center">
  <img src="public/icons/128.png" width="80" height="80" alt="Logo">
  <h1>澄镜 Chengjing</h1>
  <p><b>极简 · 高效 · 毛玻璃</b></p>
  <p>专为现代浏览器打造的沉浸式新标签页扩展</p>
  
  <p>
    <a href="#-核心特性">核心特性</a> •
    <a href="#-技术栈">技术栈</a> •
    <a href="#-安装使用">安装使用</a> •
    <a href="#-目录结构">目录结构</a>
  </p>
</div>

---

## 📖 简介

**澄镜 (Chengjing)** 是一款基于 **Manifest V3** 的 Chrome 新标签页扩展。它摒弃了传统导航页的繁杂，采用 **Vue 3** 驱动的现代化架构，结合 **Glassmorphism (毛玻璃)** 设计语言，为你还原一个干净、高效、赏心悦目的浏览器起始页。

它不仅仅是一个启动器，更是一个集成了任务管理、知识积累、美学欣赏的个人效率中心。

## ✨ 核心特性

### 1. 🎨 极致的视觉体验
- **动态毛玻璃系统**：全局 CSS 变量控制，只需拖动滑块即可实时调整模糊度 (`backdrop-filter`)、透明度、圆角和阴影。
- **壁纸管理**：
  - 支持 **Bing每日壁纸**（自动同步/缓存）。
  - 支持自定义上传（通过 IndexedDB 存储，无视大小限制）。
  - 智能遮罩层，确保在任何壁纸下文字都清晰可见。

### 2. 📚 沉浸式书签管理
- **性能怪兽**：采用 `@tanstack/vue-virtual` 虚拟滚动技术，轻松承载 10,000+ 条书签，渲染零卡顿。
- **极速索引**：书签数据处理与搜索索引构建在 **Web Worker** 中运行，绝对不阻塞主线程 UI。
- **便捷交互**：支持拼音/首字母搜索、多层级文件夹树导航、右键菜单管理。

### 3. 📜 每日诗词 (Daily Poem)
- **多源推荐**：集成 **今日诗词** (智能推荐) 和 **一言 (Hitokoto)** API。
- **卡片分享**：内置 Canvas 绘图引擎，一键生成精美的诗词分享卡片（支持二维码、自定义样式）。
- **本地珍藏**：支持一键收藏喜欢的诗句到本地，并提供完整的增删改查 (CRUD) 管理面板。
- **交互优化**：异步加载重型组件，支持一键复制 (`useClipboard`)。

### 4. 📝 全能笔记 (NotePad)
- **富文本引擎**：基于 **TipTap** 构建，支持 Markdown 快捷语法、代码高亮 (`lowlight`)、任务列表。
- **图片压缩**：内置 `browser-image-compression`，粘贴/上传图片自动压缩并转为 Base64 存储。
- **即时保存**：输入即存，通过 Storage API 确保灵感不丢失。
- **多模式**：支持“沉浸富文本”和“极简纯文本”模式切换。

### 5. ✅ 智能助手组件
- **番茄钟**：支持自定义专注/休息时长，自动循环，带有平滑的倒计时动画。
- **待办清单 (Todo)**：支持拖拽排序 (`vue-draggable-plus`)，简单的任务管理。
- **万年历**：基于 `chinese-days`，精准显示农历、节气、法定节假日及调休信息。
- **多功能计算器**：支持历时记录的轻量级计算器。

### 6. 🛠️ 现代化架构
- **真·热重载 (HMR)**：基于 Vite + CRXJS，修改代码后扩展自动刷新，开发体验如同开发普通 Web App。
- **TypeScript**: 全项目严格类型定义，拒绝 `any`。
- **按需加载**: 路由级与组件级 (Async Component) 的代码分割，极大减小首屏体积。

## 🛠️ 技术栈

| 领域 | 技术方案 | 说明 |
|------|----------|------|
| **Core** | **Vue 3.4+** | Composition API, `<script setup>` |
| **Language** | **TypeScript 5.x** | Strict Mode Enabled |
| **Build** | **Vite 6.x** | 下一代前端构建工具 |
| **Extension** | **CRXJS** | Vite 插件，提供 HMR 和 Manifest 自动生成 |
| **Styling** | **Vanilla CSS** | CSS Variables, Scoped CSS (无 Tailwind 依赖) |
| **Icons** | **Tabler Icons** | `@tabler/icons-vue` |
| **State** | **Composables** | 基于 VueUse 的逻辑复用，替代庞大的 Vuex/Pinia |

### 关键库 (Dependencies)

- **逻辑复用**: `@vueuse/core` - 实用的 Composition API 工具集
- **虚拟列表**: `@tanstack/vue-virtual` - 高性能长列表渲染
- **富文本**: `@tiptap/vue-3` & `tiptap-markdown` -  headless 编辑器框架
- **日历算法**: `chinese-days` - 专业农历/节假日计算
- **日期处理**: `dayjs` - 轻量级时间库
- **拖拽排序**: `vue-draggable-plus` - 基于 Sortablejs 的 Vue 封装
- **绘图**: `html-to-image` - DOM 转图片
- **存储**: `idb-keyval` - Promise 风格的 IndexedDB 封装

## 📂 目录结构

```bash
src/
├── assets/                 # 静态资源 (字体, 图片)
├── components/             # 业务组件模块
│   ├── BookmarkPanel/      # 书签面板 (含 Worker 逻辑)
│   ├── DailyPoem/          # 每日诗词 (含 PoemManager, ShareCard)
│   ├── NotePad/            # 笔记编辑器 (TipTap 集成)
│   ├── SettingsPanel/      # 全局设置面板
│   ├── CalendarPanel/      # 日历组件
│   ├── TodoList/           # 待办事项
│   └── ...
├── composables/            # 全局通用 Hooks (useTheme, useWallPaper 等)
├── styles/                 # 全局样式
│   ├── main.css            # 基础重置与通用样式
│   ├── variables.css       # CSS 变量设计系统 (Design Tokens)
│   └── transitions.css     # 全局过渡动画定义
├── utils/                  # 工具函数 (db.ts, storage.ts 等)
├── App.vue                 # 根组件 (布局入口)
├── main.ts                 # 入口文件
└── manifest.json           # Chrome 扩展清单 (V3)
```

## 🚀 安装与开发

### 环境要求
- Node.js >= 18
- pnpm / npm

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器 (HMR)

```bash
npm run dev
```

该命令会启动 Vite 服务。
1. 打开 Chrome 扩展管理页 `chrome://extensions/`
2. 开启右上角的 **"开发者模式"**
3. 扩展此时应当已经自动加载（CRXJS 会自动加载 `dist`）。如果没有，请点击 **"加载已解压的扩展程序"** 并选择项目根目录下的 `dist` 文件夹。

> ✨ **提示**: 修改代码后，Vite 会自动热更新内容，无需手动刷新扩展页面。

### 3. 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。
- **优化**: 会自动压缩代码、分离 Vendor Chunk、移除 console (视配置而定)。
- **发布**: 将 `dist/` 目录打包即可发布到 Chrome Web Store。

## 🔧 最佳实践遵循

本项目严格遵循以下开发规范：
- **组件化**: 所有功能模块解耦，通过 `props`/`emits` 通信。
- **Lazy Loading**: 
  - `DailyPoem` 的管理面板和分享卡片仅在需要时加载 (`defineAsyncComponent`)。
  - 大体积库（如 `html-to-image`）建议动态导入。
- **Worker Offloading**: 耗时的书签索引构建在 Worker 中进行，保障主线程流畅。
- **Design Tokens**: 严禁硬编码颜色值，统一定义在 `variables.css` 中，支持一键换肤。

---

<div align="center">
  <sub>Made with ❤️ by Seeyue</sub>
</div>
