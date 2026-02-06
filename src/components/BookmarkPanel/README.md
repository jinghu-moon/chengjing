# BookmarkPanel 书签面板

## 概述

浏览器书签管理面板，以右侧抽屉形式展示。采用 **SoA (Structure of Arrays)** 高性能数据架构，通过 Web Worker 异步处理搜索和数据扁平化，支持文件夹树导航、拖拽排序、模糊搜索等功能。

## 目录结构

```
BookmarkPanel/
├── index.vue              # 主组件（抽屉面板）
├── index.ts               # 统一导出
├── types.ts               # 类型定义（SoA 存储、Worker 消息、视图 DTO）
├── components/
│   ├── BookmarkCard.vue    # 单个书签卡片（favicon + 标题）
│   ├── BookmarkGrid.vue    # 书签网格（虚拟滚动 + 分组 sticky header）
│   ├── Breadcrumb.vue      # 面包屑导航
│   ├── FolderTabs.vue      # 文件夹标签页
│   ├── FolderTree.vue      # 左侧文件夹树
│   ├── FolderTreeItem.vue  # 文件夹树节点（递归）
│   └── SearchResults.vue   # 搜索结果列表
├── composables/
│   ├── useBookmarks.ts     # 核心数据管理（SoA 存储、CRUD、导航）
│   ├── useBookmarkSearch.ts# Worker 异步搜索
│   ├── useBookmarkDrag.ts  # 拖拽排序（ghost 元素 + 位置计算）
│   ├── useFavicon.ts       # Favicon 获取（Google API + 字母头像降级）
│   └── useFolderOrder.ts   # 文件夹排序持久化（localStorage）
├── utils/
│   └── flatten.ts          # SoA 扁平化工具（Chrome API → SoA 转换）
├── workers/
│   ├── data.worker.ts      # 数据扁平化 Worker（CPU 密集型计算）
│   └── search.worker.ts    # 搜索 Worker（Fuse.js 模糊匹配）
└── styles/
    └── drag.css            # 拖拽相关样式
```

## 核心架构

### SoA 数据结构

传统 AoS（Array of Structures）为每个书签创建一个对象，SoA 将所有字段按列存储：

```ts
interface BookmarkStore {
  ids: readonly string[]        // 所有 ID
  parentIds: readonly string[]  // 所有父文件夹 ID
  titles: readonly string[]     // 所有标题
  urls: readonly string[]       // 所有 URL
  indices: Uint16Array          // 排序索引
  dates: Float64Array           // 创建时间戳
  isFolder: Uint8Array          // 文件夹标记
  count: number                 // 总数量
  idToIndex: ReadonlyMap<string, number>          // O(1) ID 查找
  childrenMap: ReadonlyMap<string, readonly number[]>  // O(1) 子节点查找
}
```

**优势**：内存连续、CPU 缓存命中率高、TypedArray 支持 Worker 零拷贝传输、无键名开销减少 ~25% 内存。

### 数据流

```
Chrome Bookmarks API
        │
        ▼
  data.worker.ts          ← CPU 密集型扁平化（Worker 线程）
  (createFlatArrays)
        │
        ▼ postMessage (TypedArray 零拷贝)
        │
  useBookmarks.ts         ← 主线程构建索引 Map
  (createLookupMaps)
        │
        ▼
  BookmarkStore (shallowRef)
        │
   ┌────┴────┐
   ▼         ▼
 渲染层    search.worker.ts  ← Fuse.js 模糊搜索（Worker 线程）
```

## 关键 Composables

| Composable | 职责 |
|---|---|
| `useBookmarks` | 核心状态管理：加载书签树、SoA 存储、文件夹导航、CRUD 操作、拖拽移动 |
| `useBookmarkSearch` | Worker 异步搜索：防抖、竞态处理、SoA 索引直接返回 |
| `useBookmarkDrag` | 拖拽交互：ghost 元素创建、drop 位置计算（before/after/inside） |
| `useFavicon` | Favicon 获取：Google Favicon API → 字母头像降级策略 |
| `useFolderOrder` | 文件夹排序持久化：localStorage 读写 |

## Props

```ts
interface BookmarkPanelProps {
  open: boolean  // 面板开关状态 (v-model:open)
}
```

## 事件

| 事件 | 参数 | 说明 |
|---|---|---|
| `update:open` | `boolean` | 面板开关状态变更 |

## 快捷键

| 快捷键 | 功能 |
|---|---|
| `Ctrl+K` | 聚焦搜索框 |
| `Escape` | 清除搜索 → 返回根目录 → 关闭面板 |

## 环境适配

- **扩展环境**：调用 `chrome.bookmarks.getTree()` 获取真实书签
- **开发环境**：使用 `mockToSoA()` 加载 Mock 数据
