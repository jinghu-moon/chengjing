# DataBackupPanel 数据备份面板

## 概述

数据备份的独立侧边抽屉容器，作为 `DataBackup` 组件的展示壳层。通过右侧滑入面板（420px 宽）承载完整的数据管理功能，包含遮罩层、关闭按钮和滑入动画。

## 目录结构

```
DataBackupPanel/
└── index.vue                              # 抽屉面板（遮罩 + 容器 + DataBackup）
```

## Props

| Prop | 类型 | 说明 |
|------|------|------|
| `isOpen` | `boolean` | 面板显隐状态（v-model:isOpen） |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:isOpen` | `boolean` | 关闭面板（点击遮罩 / 关闭按钮） |

## 渲染结构

```
.panel-overlay（fixed 全屏遮罩，blur 4px）
└── .panel-container（右侧 420px，flex column）
    ├── .close-btn（36px 圆形关闭按钮）
    ├── .panel-header（IconDatabase + "数据管理"标题）
    └── .panel-content（overflow-y 滚动区域）
        └── <DataBackup />（完整数据备份组件）
```

## 动画

| 动画名称 | 效果 | 用途 |
|----------|------|------|
| `panel-slide` | 遮罩 opacity 0→1（300ms）+ 容器 translateX(100%)→0（300ms ease） | 面板滑入/滑出 |

## 外部依赖

| 依赖 | 用途 |
|------|------|
| `@tabler/icons-vue` | IconX（关闭按钮）、IconDatabase（标题图标） |
| `DataBackup` | 完整数据备份功能组件（预设管理/历史回溯/文件备份） |
