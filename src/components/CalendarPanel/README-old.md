# CalendarPanel 日历面板

## 概述

全屏模态日历面板，支持年/月/周三种视图切换，集成待办事项管理、农历/节假日元数据、时间胶囊等功能。通过 `provide/inject` 共享状态，视图间支持 Zoom/Slide 动画过渡。

## 目录结构

```
CalendarPanel/
├── index.vue                          # 主组件（模态容器 + 视图路由）
├── index.ts                           # 统一导出
├── types.ts                           # 类型定义
├── composables/
│   └── useCalendarPanelState.ts       # 核心状态管理（provide/inject）
├── views/
│   ├── YearView.vue                   # 年视图（12 月迷你网格 + 时间胶囊）
│   ├── MonthView.vue                  # 月视图（7×6 日历网格 + 待办面板）
│   └── WeekView.vue                   # 周视图（7 行横向待办列表）
├── components/
│   ├── DashboardCards.vue             # 仪表盘卡片（年视图底部）
│   ├── TimeCapsule.vue                # 时间胶囊进度条
│   └── TodoItem.vue                   # 待办事项条目
└── styles/
    └── common.css                     # 共享样式（按钮、过渡动画）
```

## Props

| Prop | 类型 | 说明 |
|------|------|------|
| `isOpen` | `boolean` | 面板开关状态 (v-model:isOpen) |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:isOpen` | `boolean` | 面板开关状态变更 |

## 核心架构

### 状态管理 (useCalendarPanelState)

通过 `provide(CalendarStateKey, state)` 向所有子视图注入共享状态：

| 状态/方法 | 类型 | 说明 |
|-----------|------|------|
| `currentView` | `Ref<'year'\|'month'\|'week'>` | 当前视图 |
| `selectedDate` | `Ref<Date\|null>` | 选中日期 |
| `calendar` | `useCalendar()` | 日历核心逻辑（来自 DatePicker） |
| `todos` | `Ref<TodoItem[]>` | 全局待办列表 |
| `switchView()` | `(view) => void` | 切换视图 |
| `selectDate()` | `(date) => void` | 选择日期并同步视图月份 |
| `goToToday()` | `() => void` | 回到今天 |

子组件通过 `useCalendarState()` 注入状态。

### 视图切换动画

| 切换方向 | 动画名称 | 效果 |
|----------|----------|------|
| 年 → 月 | `zoom-in` | 从点击月份位置放大进入 |
| 月 → 年 | `zoom-out` | 缩小回月份网格位置 |
| 月 → 周 | `zoom-in` | 放大进入 |
| 周 → 月 | `zoom-out` | 缩小返回 |

Zoom 原点通过 `calculateZoomOrigin()` 从点击元素位置动态计算。

### 三种视图

| 视图 | 核心功能 |
|------|----------|
| **YearView** | 12 个迷你月历网格（4×3），滚轮切换年份，底部时间胶囊 + 仪表盘 |
| **MonthView** | 7×6 日历网格，农历/节假日标签，底部待办面板，拖拽排序 |
| **WeekView** | 7 行横向布局，左侧日期信息，右侧待办网格，拖拽排序 |

## 外部依赖

| 依赖 | 用途 |
|------|------|
| `dayjs` | 日期计算 |
| `useCalendar` (DatePicker) | 日历核心逻辑复用 |
| `useTodos` (全局) | 待办事项 CRUD |
| `useCalendarData` (全局) | 农历/节假日元数据 |
| `useSimpleDrag` (自动导入) | 待办拖拽排序 |
