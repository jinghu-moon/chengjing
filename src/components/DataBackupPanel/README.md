# DataBackupPanel 数据备份面板

## 概述

数据备份的独立侧边抽屉容器，基于 `@/components/Container` 的 `Drawer` 组件实现。作为 `DataBackup` 组件的展示壳层，通过右侧滑入面板（420px 宽）承载完整的数据管理功能。

## 目录结构

```
DataBackupPanel/
└── index.vue              # Drawer 壳层（包裹 DataBackup 组件）
```

## Props

| Prop | 类型 | 说明 |
|------|------|------|
| `open` | `boolean` | 面板显隐状态（v-model:open） |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:open` | `boolean` | 面板开关状态变更 |

## 渲染结构

```
<Drawer v-model:open width="420px" title="数据管理" :icon="IconDatabase">
  └── <DataBackup />（完整数据备份组件）
</Drawer>
```

遮罩、关闭按钮、滑入动画、ESC 关闭、滚动锁定等均由 Drawer 组件统一管理。

## 外部依赖

| 依赖 | 用途 |
|------|------|
| `Drawer` | `@/components/Container` 抽屉容器组件 |
| `@tabler/icons-vue` | IconDatabase（标题图标） |
| `DataBackup` | 完整数据备份功能组件（预设管理/历史回溯/文件备份） |
