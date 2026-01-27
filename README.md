<div align="center">
  <h1>澄镜 Chengjing</h1>
  <p>极简、高效、毛玻璃风格的 Chrome 新标签页扩展</p>
  <p>
    <b>🚀 真·HMR 热重载</b> | 
    <b>🎨 动态毛玻璃</b> | 
    <b>⚡ 极速构建</b>
  </p>
</div>

## ✨ 核心特性

- **📚 沉浸式书签** - 虚拟滚动 + 拼音搜索 + 文件夹树，万级书签秒开。
- **📝 富文本笔记** - 基于 TipTap，支持 Markdown、图片压缩、代码高亮。
- **✅ 智能待办** - 拖拽排序，支持优先级与日期关联。
- **📅 万年历** - 农历、节气、节日、加班调休一目了然。
- **⚙️ 极致性能** - Web Worker 后台索引，CRXJS 极速热更。

## 🛠️ 技术栈

- **Core**: Vue 3 (Composition API) + TypeScript
- **Build**: Vite + @crxjs/vite-plugin (HMR Support)
- **UI**: Tailwind CSS? (Vanilla + Scoped), Tabler Icons
- **Perf**: 
  - 虚拟滚动 (@tanstack/vue-virtual)
  - 离屏渲染 (OffscreenCanvas)
  - 增量构建 (Target: es2020)

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式 (支持 HMR)

```bash
npm run dev
```

该命令会启动 Vite 开发服务器 (Port 5173)。
- 打开 Chrome 扩展管理页 `chrome://extensions/`
-开启「开发者模式」
- 点击「加载已解压的扩展程序」，选择 `dist` 目录

👉 **修改代码后，扩展会自动热更新 (HMR)，无需手动刷新页面！**

### 3. 生产构建

```bash
npm run build
```

- 输出目录: `dist`
- 优化策略: 
  - 关闭 Sourcemap (减小体积)
  - Esbuild 压缩
  - 代码分包 (Vendor Splitting)

## 📂 项目结构

```
src/
├── components/        # 业务组件 (自动导入)
│   ├── BookmarkPanel/ # 书签核心 (含 Worker)
│   ├── NotePad/       # 笔记编辑器
│   └── ...
├── composables/       # 逻辑复用 (Hooks)
├── utils/             # 工具库
├── assets/            # 静态资源
└── manifest.json      # 扩展配置 (V3)
```

## 🔧 最佳实践

### 性能优化
*   **Web Worker**: 书签搜索和数据处理在 Worker 中运行，主线程 0 阻塞。
*   **Virtual Scroll**: 仅渲染可视区域 DOM，内存占用极低。
*   **Persistence**: 利用 SessionStorage + CRXJS 保持页面状态，热更后不丢失滚动位置。

### 代码规范
*   **TypeScript**: 全类型覆盖
*   **ESLint + Prettier**: 统一代码风格
*   **Auto Import**: 自动按需引入 Vue API 和组件

## 📄 许可证

MIT License

<div align="center">
  Made with ❤️ by Seeyue
</div>
