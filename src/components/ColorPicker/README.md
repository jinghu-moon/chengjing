# ColorPicker 颜色选择器

## 概述

基于 HSV 色彩模型的颜色选择器组件，支持 SV 面板拖拽、Hue/Alpha 滑块、HEX 输入和预设色板。通过 Teleport 渲染到 body，自动计算弹出方向。

## 目录结构

```
ColorPicker/
├── ColorPicker.vue    # 主组件（触发器 + 弹出面板）
└── utils.ts           # 色彩空间转换工具函数
```

## Props

| Prop | 类型 | 说明 |
|------|------|------|
| `modelValue` | `string` | HEX 颜色值（支持 `#RGB` `#RRGGBB` `#RRGGBBAA`） |

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `update:modelValue` | `string` | 颜色变更，返回 `#RRGGBBAA` 格式 |

## 核心架构

### 色彩模型

内部使用 HSV + Alpha 四通道状态：

```ts
navState = { h: 0-360, s: 0-100, v: 0-100, a: 0-1 }
```

外部输入/输出统一为 HEX 格式，通过 `utils.ts` 进行双向转换。

### 面板组成

| 区域 | 功能 |
|------|------|
| **SV Panel** | 饱和度(x轴) + 明度(y轴) 拖拽选择 |
| **Hue Slider** | 色相滑块 (0-360°) |
| **Alpha Slider** | 透明度滑块 (0-1)，棋盘格背景 |
| **HEX Input** | 手动输入 HEX 值，实时校验 |
| **RGB Display** | 只读显示当前 RGB + Alpha 值 |
| **Presets** | 14 色预设色板，点击快速选择 |

### 定位策略

使用 `@vueuse/core` 的 `useElementBounding` + `useWindowSize` 计算弹出位置：
- 默认向下展开（trigger 下方 8px）
- 底部空间不足时向上翻转

## 工具函数 (utils.ts)

| 函数 | 签名 | 说明 |
|------|------|------|
| `hsvToRgb` | `(h, s, v) → [r, g, b]` | HSV → RGB |
| `rgbToHsv` | `(r, g, b) → [h, s, v]` | RGB → HSV |
| `hexToRgba` | `(hex) → [r, g, b, a]` | HEX → RGBA |
| `rgbaToHex` | `(r, g, b, a?) → string` | RGBA → HEX |
