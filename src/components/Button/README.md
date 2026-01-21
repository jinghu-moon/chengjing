# Button 按钮组件

基于 Vue 3 的高性能按钮组件，支持多种主题、变体、交互效果和可访问性特性。

## 特性

- 🎨 **5 个主题** × **4 个变体** = 20 种样式组合
- ⚡ **纯 CSS 交互效果** - 零运行时开销
- ♿ **完整的可访问性支持** - 键盘操作、ARIA 属性
- 🎯 **8 个预设配置** - 快速应用常用样式
- 📦 **TypeScript 支持** - 完整的类型定义
- 🔧 **灵活的全局配置** - 统一管理默认行为

---

## 基础用法

```vue
<script setup>
import { Button } from '@/components/Button'
</script>

<template>
  <Button>默认按钮</Button>
  <Button theme="primary">主要按钮</Button>
  <Button theme="danger">危险按钮</Button>
</template>
```

---

## API

### Button Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `theme` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger'` | `'default'` | 按钮主题 |
| `variant` | `'base' \| 'outline' \| 'dashed' \| 'text'` | `'base'` | 按钮变体 |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | 按钮尺寸 |
| `shape` | `'rectangle' \| 'square' \| 'round' \| 'circle'` | `'rectangle'` | 按钮形状 |
| `block` | `boolean` | `false` | 是否为块级元素 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `loading` | `boolean` | `false` | 是否显示加载状态 |
| `ghost` | `boolean` | `false` | 是否为幽灵按钮（透明背景） |
| `icon` | `Component \| VNode` | - | 按钮图标 |
| `iconPlacement` | `'left' \| 'right'` | `'left'` | 图标位置 |
| `suffix` | `Component \| VNode` | - | 右侧内容（用于 icon-slide 效果） |
| `content` | `string` | - | 按钮文本内容 |
| `tag` | `'button' \| 'a' \| 'div' \| 'span'` | `'button'` | 渲染的 HTML 标签 |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | 原生 type 属性 |
| `href` | `string` | - | 链接地址（设置后自动渲染为 `<a>` 标签） |
| `form` | `string` | - | 原生 form 属性 |
| `autofocus` | `boolean` | `false` | 原生 autofocus 属性 |
| `keyboard` | `boolean` | `true` | 是否支持键盘操作（Enter/Space） |
| `effect` | `'ripple' \| 'scale' \| 'sweep' \| 'icon-slide' \| 'none'` | `'ripple'` | 交互效果 |

### Button Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `click` | `(event: MouseEvent) => void` | 点击按钮时触发 |

### Button Slots

| 插槽名 | 说明 |
|--------|------|
| `default` | 按钮内容 |

---

## 主题与变体

### 主题（Theme）

```vue
<Button theme="default">默认</Button>
<Button theme="primary">主要</Button>
<Button theme="success">成功</Button>
<Button theme="warning">警告</Button>
<Button theme="danger">危险</Button>
```

### 变体（Variant）

```vue
<Button variant="base">实心</Button>
<Button variant="outline">线框</Button>
<Button variant="dashed">虚线</Button>
<Button variant="text">文本</Button>
```

### 组合使用

```vue
<Button theme="primary" variant="outline">主要线框</Button>
<Button theme="danger" variant="text">危险文本</Button>
```

---

## 尺寸与形状

### 尺寸（Size）

```vue
<Button size="small">小按钮</Button>
<Button size="medium">中按钮</Button>
<Button size="large">大按钮</Button>
```

### 形状（Shape）

```vue
<Button shape="rectangle">矩形</Button>
<Button shape="round">圆角</Button>
<Button shape="square" :icon="SearchIcon" />
<Button shape="circle" :icon="SearchIcon" />
```

---

## 状态

### 禁用状态

```vue
<Button disabled>禁用按钮</Button>
```

### 加载状态

```vue
<Button loading>加载中</Button>
```

### 块级按钮

```vue
<Button block>块级按钮</Button>
```

### 幽灵按钮

```vue
<Button ghost>幽灵按钮</Button>
```

---

## 图标

### 基础图标

```vue
<Button :icon="SearchIcon">搜索</Button>
```

### 图标位置

```vue
<Button :icon="ArrowIcon" iconPlacement="left">上一步</Button>
<Button :icon="ArrowIcon" iconPlacement="right">下一步</Button>
```

### 仅图标

```vue
<Button :icon="SearchIcon" shape="circle" />
```

---

## 交互效果

### Ripple（水波纹）

```vue
<Button effect="ripple">点击我</Button>
```

### Scale（缩放）

```vue
<Button effect="scale">点击我</Button>
```

### Sweep（扫过）

```vue
<Button effect="sweep">点击我</Button>
```

### Icon Slide（图标滑入）

```vue
<Button effect="icon-slide" :suffix="ArrowIcon">
  查看详情
</Button>
```

---

## 预设配置

使用预设配置快速应用常用样式组合：

```vue
<script setup>
import { Button, buttonPresets } from '@/components/Button'
</script>

<template>
  <!-- 主要操作 -->
  <Button {...buttonPresets.primary}>确认</Button>
  <Button {...buttonPresets.danger}>删除</Button>
  <Button {...buttonPresets.success}>保存</Button>
  <Button {...buttonPresets.warning}>重置</Button>

  <!-- 次要操作 -->
  <Button {...buttonPresets.secondary}>取消</Button>
  <Button {...buttonPresets.ghost}>返回</Button>

  <!-- 文本样式 -->
  <Button {...buttonPresets.link}>查看详情</Button>
  <Button {...buttonPresets.text}>了解更多</Button>
</template>
```

### 可用预设

| 预设名 | 说明 | 配置 |
|--------|------|------|
| `primary` | 主要操作按钮 | `theme: 'primary', variant: 'base'` |
| `danger` | 危险操作按钮 | `theme: 'danger', variant: 'base'` |
| `success` | 成功操作按钮 | `theme: 'success', variant: 'base'` |
| `warning` | 警告操作按钮 | `theme: 'warning', variant: 'base'` |
| `secondary` | 次要操作按钮 | `theme: 'default', variant: 'outline'` |
| `ghost` | 幽灵按钮 | `theme: 'default', variant: 'base', ghost: true` |
| `link` | 链接样式按钮 | `theme: 'primary', variant: 'text'` |
| `text` | 纯文本按钮 | `theme: 'default', variant: 'text'` |

---

## ButtonGroup

按钮组用于将多个按钮组合在一起。

### 基础用法

```vue
<ButtonGroup>
  <Button>按钮 1</Button>
  <Button>按钮 2</Button>
  <Button>按钮 3</Button>
</ButtonGroup>
```

### ButtonGroup Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `theme` | `ButtonTheme` | - | 统一设置按钮主题 |
| `variant` | `ButtonVariant` | - | 统一设置按钮变体 |
| `size` | `ButtonSize` | - | 统一设置按钮尺寸 |
| `shape` | `ButtonShape` | - | 统一设置按钮形状 |
| `vertical` | `boolean` | `false` | 是否垂直排列 |
| `gap` | `string` | `'0'` | 按钮间距 |
| `split` | `boolean` | `false` | 是否显示分隔线 |

### 示例

```vue
<!-- 统一样式 -->
<ButtonGroup theme="primary" size="small">
  <Button>按钮 1</Button>
  <Button>按钮 2</Button>
</ButtonGroup>

<!-- 垂直排列 -->
<ButtonGroup vertical>
  <Button>按钮 1</Button>
  <Button>按钮 2</Button>
</ButtonGroup>

<!-- 带间距 -->
<ButtonGroup gap="8px">
  <Button>按钮 1</Button>
  <Button>按钮 2</Button>
</ButtonGroup>
```

---

## 全局配置

通过修改 `buttonConfig` 自定义全局默认行为：

```typescript
// config.ts
import { buttonConfig } from '@/components/Button'

// 修改默认交互效果
buttonConfig.defaultEffect = 'scale'

// 修改默认键盘支持
buttonConfig.defaultKeyboard = false
```

---

## 可访问性

### 键盘操作

- **Enter 键：** 触发按钮点击（非 button 标签）
- **Space 键：** 触发按钮点击（非 button 标签）
- 原生 `<button>` 标签自动支持键盘操作

### 禁用键盘操作

```vue
<Button :keyboard="false">仅鼠标点击</Button>
```

### ARIA 属性

组件自动处理以下 ARIA 属性：
- `disabled` 状态自动设置 `aria-disabled`
- `loading` 状态自动设置 `aria-busy`

---

## 最佳实践

### 1. 按钮层级

```vue
<!-- ✅ 推荐：明确的视觉层级 -->
<div class="actions">
  <Button {...buttonPresets.primary}>确认</Button>
  <Button {...buttonPresets.secondary}>取消</Button>
</div>

<!-- ❌ 避免：多个主要按钮 -->
<div class="actions">
  <Button theme="primary">确认</Button>
  <Button theme="primary">取消</Button>
</div>
```

### 2. 危险操作

```vue
<!-- ✅ 推荐：使用 danger 主题 -->
<Button {...buttonPresets.danger}>删除账户</Button>

<!-- ❌ 避免：危险操作使用 primary -->
<Button theme="primary">删除账户</Button>
```

### 3. 图标使用

```vue
<!-- ✅ 推荐：图标 + 文字 -->
<Button :icon="SearchIcon">搜索</Button>

<!-- ✅ 推荐：仅图标 + 合适的形状 -->
<Button :icon="SearchIcon" shape="circle" />

<!-- ❌ 避免：仅图标 + 矩形 -->
<Button :icon="SearchIcon" />
```

### 4. 加载状态

```vue
<script setup>
const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  try {
    await api.submit()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Button :loading="loading" @click="handleSubmit">
    提交
  </Button>
</template>
```

---

## 类型定义

```typescript
import type {
  ButtonProps,
  ButtonEmits,
  ButtonTheme,
  ButtonVariant,
  ButtonSize,
  ButtonShape,
  ButtonType,
  ButtonTag,
  ButtonEffect,
} from '@/components/Button'
```

---

## 性能优化

### 纯 CSS 交互效果

所有交互效果（包括 icon-slide）都使用纯 CSS 实现，无运行时 JavaScript 开销：

```css
/* icon-slide 使用 calc() 自动计算偏移量 */
transform: translateX(calc((var(--icon-size) + var(--gap)) / 2));
```

### 优化建议

1. **避免频繁切换 effect**：交互效果应在设计阶段确定
2. **使用预设配置**：减少 prop 传递，提高代码可读性
3. **合理使用 loading 状态**：避免不必要的状态切换

---

## 常见问题

### Q: 如何自定义按钮颜色？

A: 通过 CSS 变量覆盖主题颜色：

```css
.custom-button {
  --btn-bg: #your-color;
  --btn-bg-hover: #your-hover-color;
  --btn-color: #your-text-color;
}
```

### Q: 如何禁用所有交互效果？

A: 设置 `effect="none"`：

```vue
<Button effect="none">无效果按钮</Button>
```

### Q: ButtonGroup 中的按钮可以单独设置样式吗？

A: 可以，组件级别的 props 优先级高于 ButtonGroup：

```vue
<ButtonGroup theme="primary">
  <Button>继承 primary</Button>
  <Button theme="danger">覆盖为 danger</Button>
</ButtonGroup>
```

---

## 更新日志

### v1.0.0
- ✨ 初始版本发布
- ✨ 支持 5 个主题 × 4 个变体
- ✨ 纯 CSS icon-slide 效果
- ✨ 完整的可访问性支持
- ✨ 8 个预设配置
- ✨ TypeScript 支持
