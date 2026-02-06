# DailyPoem 每日诗词

## 概述

每日诗词展示组件，以固定底部横幅形式展示诗词内容。支持在线/离线双模式、本地诗词库 CRUD 管理、Web Worker 异步搜索、分享卡片生成与导出。采用聚合层 Composable 架构，将数据、设置、推荐、搜索、分享等逻辑解耦为独立模块。

## 目录结构

```
DailyPoem/
├── index.vue                          # 主组件（底部横幅展示）
├── PoemManager.vue                    # 诗词管理面板（Dialog 容器）
├── types.ts                           # 类型定义
├── composables/
│   ├── useDailyPoem.ts               # 聚合层（编排所有子模块）
│   ├── usePoemData.ts                # 数据层（IndexedDB CRUD + 导入导出）
│   ├── useDailyPoemSettings.ts       # 设置管理（localStorage 单例）
│   ├── useDailyRecommendation.ts     # 推荐逻辑（缓存 + 在线/离线策略）
│   ├── usePoemApi.ts                 # API 适配器（今日诗词 / Hitokoto）
│   ├── usePoemSearch.ts              # Worker 异步搜索（SoA + 防抖 + 竞态）
│   ├── useShareCard.ts              # 分享卡片状态管理（单例 reactive）
│   └── useExportImage.ts            # 图片导出（html-to-image）
├── components/
│   ├── PoemList.vue                  # 诗词列表（虚拟滚动）
│   ├── PoemForm.vue                  # 诗词表单（新增/编辑）
│   └── ShareCard/
│       ├── index.vue                 # 分享卡片对话框（预览 + 导出）
│       ├── PoetryCard.vue            # 卡片渲染组件
│       └── ControlPanel.vue          # 卡片配置面板
├── workers/
│   └── search.worker.ts             # 搜索 Worker（SoA 缓存 + 拼音 + 分词打分）
└── styles/                           # 共享样式（如有）
```

## 核心架构

### Composable 聚合层

`useDailyPoem` 作为聚合层，编排四个子模块并对外暴露统一 API：

```
useDailyPoem (聚合层)
├── usePoemData          → localPoems, CRUD, 导入导出
├── useDailyPoemSettings → settings, updateSettings
├── useDailyRecommendation → poem, loading, loadPoem, refresh
└── usePoemApi           → fetchHitokotoPoem, fetchJinrishiciPoem
```

### 数据流

```
┌─────────────────────────────────────────────────┐
│  index.vue (底部横幅)                            │
│  ├── 展示 poem.content / author / title          │
│  ├── 操作按钮：复制/收藏/刷新/卡片/管理           │
│  └── 异步加载 PoemManager / ShareCard Dialog     │
└──────────────────┬──────────────────────────────┘
                   │ useDailyPoem()
                   ▼
┌─────────────────────────────────────────────────┐
│  useDailyRecommendation                          │
│  ├── localStorage 日缓存 (daily-poem-cache)      │
│  ├── 在线模式 → usePoemApi (今日诗词/Hitokoto)   │
│  └── 离线模式 → 基于日期哈希的稳定随机选取        │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  usePoemData (IndexedDB via idb-keyval)          │
│  ├── 单例 shallowRef<LocalPoem[]>               │
│  ├── localStorage → IndexedDB 自动迁移           │
│  └── 默认数据从 poems.json 初始化                │
└─────────────────────────────────────────────────┘
```

## 在线 API 适配

| API 源 | 端点 | SDK 加载方式 | 返回映射 |
|--------|------|-------------|---------|
| **今日诗词** (jinrishici) | SDK 动态注入 `<script>` | 懒加载 + 单例锁 | `result.data.content/origin.*` |
| **Hitokoto** (一言) | `https://v1.hitokoto.cn/` | 原生 fetch | `data.hitokoto/from_who/from` |

Hitokoto 支持分类参数 (`c=i,d,k` 等)，通过 `DailyPoemSettings.hitokotoCategories` 配置。

## 搜索系统

### Worker 架构 (search.worker.ts)

搜索在 Web Worker 中执行，避免阻塞主线程：

```
主线程 (usePoemSearch)              Worker 线程 (search.worker)
       │                                    │
       │── INIT (SoA 数据) ──────────────→  │ 构建缓存 + 拼音索引
       │                                    │
       │←──────────── READY ────────────────│
       │                                    │
       │── SEARCH (query, id) ───────────→  │ 线性扫描 + 打分排序
       │                                    │
       │←──── RESULT (ids[], id) ───────────│
```

### 搜索打分规则

| 匹配类型 | 分值 | 说明 |
|----------|------|------|
| 作者精确匹配 | 90 | `author === query` |
| 标题精确匹配 | 80 | `title === query` |
| 作者拼音精确 | 70 | 拼音首字母完全匹配 |
| 作者包含匹配 | 60 | `author.includes(query)` |
| 标题包含匹配 | 50 | `title.includes(query)` |
| 内容包含匹配 | 40 | `content.includes(query)` |
| 拼音部分匹配 | 20-30 | 拼音首字母部分匹配 |
| 分词全匹配 | 15 | `Intl.Segmenter` 中文分词后全部命中 |
| 全文兜底 | 10 | `searchCache` 包含查询词 |

## 分享卡片系统

### 架构

ShareCard 子系统由三个模块组成：

| 模块 | 职责 |
|------|------|
| `useShareCard` | 单例 `reactive` 状态管理，包含布局/字体/背景/效果全部配置 |
| `ControlPanel.vue` | 左侧配置面板，控制所有卡片参数 |
| `PoetryCard.vue` | 右侧实时预览渲染，作为 `html-to-image` 的导出目标 |

### 卡片配置维度

| 维度 | 可选值 |
|------|--------|
| **布局** | `horizontal` / `vertical` |
| **尺寸** | 600×900, 800×1200, 1080×1080, 1200×630, 750×1334 |
| **字体** | 思源宋体 / 霞鹜文楷 / 马善政书法 / HarmonyOS 黑体 |
| **背景** | 6 张本地图片 / 8 种渐变色 / 网格线 |
| **效果** | 模糊(blur) / 遮罩(overlay) / 暗角(vignette) / 噪点(noise) |
| **日期** | 无 / 公历+农历 / 仅公历 / 仅农历 / 中文 / 日期时间 / 自定义 |
| **导出** | 1x / 2x / 3x 分辨率 |

每个文本元素（诗句/作者/标题）独立配置：字体、字号、字重、颜色、描边、对齐、行高、字间距。

## 设置系统

`useDailyPoemSettings` 采用模块级单例模式，通过 localStorage 持久化：

| 设置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `online` | `boolean` | `false` | 在线模式开关 |
| `source` | `ApiSource` | `'jinrishici'` | API 源选择 |
| `hitokotoCategories` | `HitokotoCategory[]` | `['i','k','d']` | Hitokoto 分类 |
| `showAuthor` | `boolean` | `true` | 显示作者 |
| `showTitle` | `boolean` | `true` | 显示标题 |
| `showCollect` | `boolean` | `true` | 显示收藏按钮 |
| `showRefresh` | `boolean` | `false` | 显示刷新按钮 |
| `showCopy` | `boolean` | `true` | 显示复制按钮 |
| `showCard` | `boolean` | `true` | 显示卡片按钮 |
| `showManager` | `boolean` | `true` | 显示管理按钮 |

## 关键 Composables

| Composable | 模式 | 职责 |
|------------|------|------|
| `useDailyPoem` | 聚合层 | 编排子模块，对外暴露统一 API（state + methods + CRUD） |
| `usePoemData` | 单例 shallowRef | IndexedDB CRUD、导入导出、localStorage 迁移、备份 API |
| `useDailyPoemSettings` | 单例 ref | 设置加载/保存/更新，localStorage 持久化 |
| `useDailyRecommendation` | 实例 | 每日推荐策略：日缓存 → 在线获取 → 离线哈希随机 |
| `usePoemSearch` | 实例 | Worker 异步搜索：SoA 同步、防抖 50ms、竞态 ID 过滤 |
| `useShareCard` | 单例 reactive | 分享卡片全量配置状态，含重置/初始化/字体映射 |
| `useExportImage` | 实例 | html-to-image 封装：Blob/DataURL 导出、文件下载 |

## 组件说明

### index.vue 主组件

固定定位于页面底部居中，横幅形式展示诗词。功能按钮通过 `settings` 动态显隐。

| 功能 | 触发 | 说明 |
|------|------|------|
| 复制 | `@vueuse/core` useClipboard | 格式化诗词内容到剪贴板 |
| 收藏 | saveCurrentToLocal | 仅在线模式可用，去重检测 |
| 刷新 | refresh (2s 节流) | 强制获取新诗词 |
| 卡片 | ShareCardDialog | 异步加载分享卡片对话框 |
| 管理 | PoemManagerDialog | 异步加载诗词管理面板 |

动画效果：`fade-blur`（诗词切换）、`collapse`（footer 展开）、`list-fade`/`list-horizontal`（按钮组增减）。

### PoemManager.vue 管理面板

Dialog 容器组件，管理 list/form 双视图切换：

- **列表视图**：PoemList（虚拟滚动 `@tanstack/vue-virtual`）+ 搜索/导入/导出
- **表单视图**：PoemForm（新增/编辑）+ API 在线获取填充

## 外部依赖

| 依赖 | 用途 |
|------|------|
| `idb-keyval` | IndexedDB 简化读写（诗词数据持久化） |
| `@tanstack/vue-virtual` | PoemList 虚拟滚动 |
| `@vueuse/core` | useClipboard（复制）、useWindowSize（卡片自适应） |
| `html-to-image` | DOM → PNG/Blob 导出（分享卡片） |
| `@tabler/icons-vue` | 图标组件 |
| `Intl.Segmenter` | Worker 中文分词（浏览器原生，无需安装） |
