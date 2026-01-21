# Dialog 对话框组件

参考主流组件库 API 设计的现代化对话框组件，支持标准对话框模式和 Popover 跟随模式。

## 基础用法

```vue
<template>
  <Dialog
    v-model="visible"
    title="提示"
    content="这是一个对话框"
    @positive-click="handleConfirm"
  />
</template>

<script setup>
import { ref } from 'vue'
import { Dialog } from '@/components/Dialog'

const visible = ref(false)

const handleConfirm = () => {
  console.log('确认')
}
</script>
```

## Props

### 基础属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| modelValue | `boolean` | `false` | 是否显示对话框 |
| title | `string` | - | 对话框标题 |
| content | `string` | - | 对话框内容 |
| type | `'info' \| 'success' \| 'warning' \| 'error' \| 'confirm'` | `'info'` | 对话框类型 |
| width | `string \| number` | `'480px'` | 对话框宽度 |

### 布局定位

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| placement | `'top' \| 'center' \| 'bottom'` | `'center'` | 对话框位置 |
| top | `string \| number` | - | 距离顶部距离，优先级高于 placement |
| fullscreen | `boolean` | `false` | 全屏模式 |
| centered | `boolean` | `false` | 垂直水平居中（等同于 placement="center"） |

### Follow Trigger 模式（Popover 风格）

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| triggerRect | `DOMRect \| VirtualRect` | - | 触发器位置信息 |
| popoverPlacement | `'top' \| 'bottom' \| 'left' \| 'right' \| 'topLeft' \| 'topRight' \| 'bottomLeft' \| 'bottomRight'` | - | Follow 模式下的弹出位置 |

### 样式配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| bordered | `boolean` | `false` | 是否显示边框 |
| showIcon | `boolean` | `true` | 是否显示类型图标 |
| icon | `() => VNode` | - | 自定义图标 |
| class | `string` | - | 自定义类名 |
| style | `string \| Record<string, any>` | - | 自定义样式 |

### 遮罩配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| modal | `boolean` | `true` | 是否显示遮罩 |
| maskClosable | `boolean` | `true` | 点击遮罩是否关闭 |

### 交互配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| closable | `boolean` | `true` | 是否显示关闭按钮 |
| closeOnEsc | `boolean` | `true` | 按 ESC 键是否关闭 |
| draggable | `boolean` | `false` | 是否可拖拽（待实现） |
| destroyOnClose | `boolean` | `false` | 关闭时是否销毁内容 |

### 按钮配置

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| positiveText | `string` | `'确定'` | 确认按钮文字 |
| negativeText | `string` | `'取消'` | 取消按钮文字 |
| positiveButtonProps | `Record<string, any>` | - | 确认按钮属性 |
| negativeButtonProps | `Record<string, any>` | - | 取消按钮属性 |
| showPositiveButton | `boolean` | `true` | 是否显示确认按钮 |
| showNegativeButton | `boolean` | `false` | 是否显示取消按钮 |
| loading | `boolean` | `false` | 确认按钮加载状态 |

### 其他

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| zIndex | `number` | `2000` | 对话框层级 |
| transformOrigin | `'mouse' \| 'center'` | `'mouse'` | 动画原点 |
| mousePosition | `{ x: number; y: number }` | - | 鼠标位置（用于动画） |

## Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| open | - | 对话框打开时触发 |
| opened | - | 对话框打开动画结束时触发 |
| close | - | 对话框关闭时触发 |
| closed | - | 对话框关闭动画结束时触发 |
| positive-click | `(e: MouseEvent)` | 点击确认按钮时触发 |
| negative-click | `(e: MouseEvent)` | 点击取消按钮时触发 |
| mask-click | - | 点击遮罩时触发 |
| esc | - | 按下 ESC 键时触发 |

## Callbacks

| 回调 | 类型 | 说明 |
|------|------|------|
| onOpen | `() => void` | 对话框打开时回调 |
| onOpened | `() => void` | 对话框打开动画结束时回调 |
| onClose | `() => void \| boolean \| Promise<boolean>` | 对话框关闭时回调，返回 `false` 可阻止关闭 |
| onClosed | `() => void` | 对话框关闭动画结束时回调 |
| onPositiveClick | `(e: MouseEvent) => void \| boolean \| Promise<boolean>` | 点击确认按钮回调，返回 `false` 可阻止关闭 |
| onNegativeClick | `(e: MouseEvent) => void \| boolean \| Promise<boolean>` | 点击取消按钮回调，返回 `false` 可阻止关闭 |
| onMaskClick | `() => void` | 点击遮罩回调 |
| onEsc | `() => void` | 按下 ESC 键回调 |
| beforeClose | `() => boolean \| Promise<boolean>` | 关闭前回调，返回 `false` 可阻止关闭 |

## Slots

| 插槽名 | 说明 |
|--------|------|
| default | 对话框内容 |
| header | 对话框标题 |
| footer | 对话框底部 |
| icon | 自定义图标 |
| close | 自定义关闭按钮 |

## 使用示例

### 基础对话框

```vue
<Dialog
  v-model="visible"
  title="提示"
  content="这是一个提示对话框"
  type="info"
/>
```

### 确认对话框

```vue
<Dialog
  v-model="visible"
  title="确认删除"
  content="确定要删除这条记录吗？"
  type="warning"
  :show-negative-button="true"
  @positive-click="handleDelete"
/>
```

### 自定义内容

```vue
<Dialog v-model="visible" title="自定义内容">
  <div class="custom-content">
    <p>这是自定义的内容</p>
    <input type="text" placeholder="请输入..." />
  </div>
</Dialog>
```

### 阻止关闭

```vue
<Dialog
  v-model="visible"
  title="表单提交"
  :before-close="handleBeforeClose"
>
  <form>...</form>
</Dialog>

<script setup>
const handleBeforeClose = async () => {
  const confirmed = await confirm('确定要关闭吗？')
  return confirmed
}
</script>
```

### 全屏模式

```vue
<Dialog
  v-model="visible"
  title="全屏对话框"
  fullscreen
>
  <div class="fullscreen-content">...</div>
</Dialog>
```

### Follow Trigger 模式（Popover 风格）

```vue
<template>
  <button ref="triggerRef" @click="handleClick">
    点击我
  </button>

  <Dialog
    v-model="visible"
    :trigger-rect="triggerRect"
    popover-placement="bottom"
    content="这是一个跟随按钮的对话框"
  />
</template>

<script setup>
import { ref } from 'vue'

const triggerRef = ref()
const visible = ref(false)
const triggerRect = ref()

const handleClick = () => {
  triggerRect.value = triggerRef.value.getBoundingClientRect()
  visible.value = true
}
</script>
```

## 特色功能

### 1. 鼠标位置动画
对话框会从鼠标点击位置展开，提供更自然的交互体验。

### 2. Follow Trigger 模式
支持跟随触发器定位，类似 Popover 组件，适合上下文菜单等场景。

### 3. 完整的生命周期
提供 `open`、`opened`、`close`、`closed` 等完整的生命周期事件。

### 4. 灵活的关闭控制
通过 `beforeClose`、`onClose` 等回调，可以灵活控制对话框的关闭行为。

## 与主流组件库的对比

| 功能 | Naive UI | Element Plus | Ant Design | TDesign | 本组件 |
|------|----------|--------------|------------|---------|--------|
| 基础对话框 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 类型图标 | ✅ | ❌ | ✅ | ✅ | ✅ |
| ESC 关闭 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 销毁内容 | ❌ | ✅ | ✅ | ✅ | ✅ |
| 全屏模式 | ❌ | ✅ | ❌ | ✅ | ✅ |
| 拖拽 | ✅ | ✅ | ❌ | ✅ | 🚧 |
| 鼠标动画 | ✅ | ❌ | ❌ | ❌ | ✅ |
| Follow Mode | ❌ | ❌ | ❌ | ❌ | ✅ |

## 注意事项

1. `destroyOnClose` 为 `true` 时，关闭对话框会销毁内部内容，下次打开会重新渲染
2. `beforeClose` 和 `onClose` 返回 `false` 可以阻止对话框关闭
3. Follow Mode 下会自动隐藏遮罩，点击外部区域会关闭对话框
4. 鼠标位置动画需要传入 `mousePosition` 属性
