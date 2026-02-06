# DatePicker 日期选择器

## 概述

日期时间选择器组件，通过 Teleport 渲染浮动下拉面板，支持日历网格选择、年月滚轮快速切换、时间精确调节。采用双下拉架构（主面板 + 年月选择器），通过 `useCalendar`、`usePickerPosition`、`useTimeLogic`、`useYearWheel` 四个 Composable 解耦核心逻辑。

## 目录结构

```
DatePicker/
├── index.vue                          # 主组件（双 Teleport 下拉面板）
├── index.ts                           # 统一导出（组件 + 全部 Composables）
├── styles.css                         # 过渡动画（picker-fade / slide-up / fade）
├── composables/
│   ├── useCalendar.ts                # 日历核心（42 天矩阵 + 导航 + 动画）
│   ├── usePickerPosition.ts          # 下拉定位（fixed + 窗口事件监听）
│   ├── useTimeLogic.ts               # 时间逻辑（时/分/秒调节 + Tab 导航）
│   └── useYearWheel.ts              # 年份滚轮（中心 ±3 年 + 滚轮事件）
└── components/
    ├── CalendarGrid.vue              # 日历网格（7×6 + slide 动画）
    ├── YearMonthWheel.vue            # 年月选择器（滚轮 + 月份网格）
    ├── TimePanel.vue                 # 时间面板（时:分:秒分段输入）
    └── PickerFooter.vue              # 底部操作栏（今天/清除/确定）
```

## Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `modelValue` | `string` | — | 日期时间值 (v-model)，格式 `YYYY-MM-DDTHH:mm:ss` |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `string` | 日期时间值变更 |

## 核心架构

### 双下拉面板

主组件通过两个 `<Teleport to="body">` 渲染独立的浮动面板：

| 面板 | 触发方式 | 内容 | 过渡动画 |
|------|----------|------|----------|
| **主面板** | 点击输入框 | CalendarGrid + TimePanel + PickerFooter | `picker-fade`（左移淡入） |
| **年月面板** | 点击主面板中的月份标题 | YearMonthWheel | `slide-up`（上移淡入） |

点击外部区域自动关闭面板（`@click.self` + `mousedown` 事件委托）。

### 数据流

```
┌─────────────────────────────────────────────────┐
│  index.vue (主组件)                              │
│  ├── v-model:modelValue (YYYY-MM-DDTHH:mm:ss)  │
│  ├── useCalendar → days[], viewDate, navigate   │
│  ├── usePickerPosition → dropdownStyle 定位     │
│  └── useTimeLogic → hour/minute/second          │
└──────────────────┬──────────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
CalendarGrid   TimePanel    PickerFooter
(日期选择)     (时间调节)    (今天/清除/确定)
    │
    ▼ (点击月份标题)
YearMonthWheel
(年份滚轮 + 月份网格)
```

## 核心 Composables

### useCalendar

日历核心逻辑，基于 dayjs 生成 42 天（6×7）矩阵：

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `days` | `ComputedRef<CalendarDay[]>` | 42 天矩阵，含 date/isCurrentMonth/isToday/isSelected |
| `viewDate` | `Ref<Dayjs>` | 当前视图月份 |
| `selectedDate` | `Ref<Dayjs \| null>` | 选中日期 |
| `slideDirection` | `Ref<SlideDirection>` | 切换动画方向 (`left` / `right` / `none`) |
| `monthYearKey` | `ComputedRef<string>` | 月份唯一标识（动画 key） |
| `navigate(dir)` | `(1 \| -1) => void` | 前/后月导航（含 200ms 动画锁） |
| `goToMonth(y, m)` | `(number, number) => void` | 跳转到指定年月 |
| `selectDate(day)` | `(CalendarDay) => void` | 选择日期 |

**配置项**：`weekStart` 支持 `0`（周日）或 `1`（周一，默认）。

### usePickerPosition

下拉面板定位逻辑，基于触发元素的 `getBoundingClientRect()` 计算 `fixed` 定位：

- **主面板**：定位于触发元素右侧（`rect.right + offset`），底部对齐
- **年月面板**：定位于月份标题下方居中
- **窗口事件**：监听 `resize` / `scroll`（capture）实时重算位置
- 自动在 `onBeforeUnmount` 时清理事件监听

### useTimeLogic

时间调节逻辑，管理时/分/秒三个独立 ref：

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `hour` / `minute` / `second` | `Ref<number>` | 时间值（循环溢出：23→0, 59→0） |
| `adjustTime(unit, dir)` | — | 上下调节，自动循环 |
| `handleTimeInput(unit, val)` | — | 输入框值解析，clamp 到合法范围 |
| `handleWheel(event, unit)` | — | 滚轮事件处理 |
| `handleKeydown(event, unit)` | — | Tab / Shift+Tab 焦点导航 |
| `setTime(h, m, s)` | — | 外部同步设置 |
| `setNow()` | — | 设置为当前系统时间 |

### useYearWheel

年份滚轮逻辑，以中心年份为基准展示 ±3 年：

| 返回值 | 类型 | 说明 |
|--------|------|------|
| `wheelCenter` | `Ref<number>` | 滚轮中心年份 |
| `displayYears` | `ComputedRef<YearData[]>` | 周边 6 年数据（上 3 + 下 3） |
| `centerYearData` | `ComputedRef<YearData>` | 中心年份数据（含 isCurrent/isSelected） |
| `adjustWheel(dir)` | — | 上下滚动滚轮 |
| `handleWheel(event)` | — | 原生滚轮事件处理 |
| `syncToYear(year)` | — | 同步滚轮中心到指定年份 |

## 组件说明

### CalendarGrid 日历网格

7×6 日历网格，星期标题行 + 42 天单元格：

- **星期行**：固定 `['一','二','三','四','五','六','日']`
- **日期单元格**：区分当月/非当月（opacity 0.3）、今天（primary 背景）、选中（primary 实色）
- **切换动画**：通过 `slideDirection` + `monthYearKey` 实现 `slide-left` / `slide-right` 过渡
- 非当月日期不可点击

### YearMonthWheel 年月选择器

左右双栏布局：左侧年份滚轮 + 右侧月份网格。

- **年份滚轮**：中心年份放大加粗，周边年份渐变透明（opacity 0.2→0.5），支持鼠标滚轮和上下按钮
- **月份网格**：2×6 网格（large 模式 3×4），当前月高亮边框
- **尺寸变体**：`size="large"` 用于 CalendarPanel 集成，增大滚轮和网格尺寸

### TimePanel 时间面板

时:分:秒三段式输入，嵌入日历面板底部：

- **分段输入**：每段独立 `<input>`，`maxlength="2"`，`tabular-nums` 等宽数字
- **滚轮调节**：每段支持鼠标滚轮上下调节
- **Tab 导航**：Tab / Shift+Tab 在时→分→秒间切换焦点
- **defineModel**：通过 `v-model:hour` / `v-model:minute` / `v-model:second` 双向绑定

### PickerFooter 底部操作栏

四个操作按钮：

| 按钮 | 事件 | 说明 |
|------|------|------|
| 📅 (图标) | `goToToday` | 日历跳转到今天所在月份 |
| 今天 | `setToday` | 选中今天并设置当前时间 |
| 清除 | `clear` | 清空选中值 |
| 确定 | `apply` | 确认选择并关闭面板 |

## 过渡动画 (styles.css)

| 动画名称 | 效果 | 用途 |
|----------|------|------|
| `picker-fade` | 左移 8px + 淡入/淡出 | 主面板开关 |
| `slide-up` | 上移 8px + 淡入/淡出 | 年月面板开关 |
| `fade` | 纯透明度过渡 | 月份标题切换 |
| `slide-left` / `slide-right` | 水平 100% 位移 + 淡入/淡出 | 日历月份切换（CalendarGrid 内部） |

## 外部依赖

| 依赖 | 用途 |
|------|------|
| `dayjs` | 日期计算、格式化、月份导航 |
| `@tabler/icons-vue` | 导航箭头、日历图标、时钟图标 |
