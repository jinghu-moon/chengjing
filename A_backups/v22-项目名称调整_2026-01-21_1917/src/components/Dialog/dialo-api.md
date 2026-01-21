# Naive UI API

### useDialog API

| 名称       | 类型                                         | 说明                        |
| ---------- | -------------------------------------------- | --------------------------- |
| destroyAll | `() => void`                                 | 销毁所有弹出的对话框        |
| create     | `(options: DialogOptions) => DialogReactive` | 创建对话框                  |
| error      | `(options: DialogOptions) => DialogReactive` | 调用 `error` 类型的对话框   |
| info       | `(options: DialogOptions) => DialogReactive` | 调用 `info` 类型的对话框    |
| success    | `(options: DialogOptions) => DialogReactive` | 调用 `success` 类型的对话框 |
| warning    | `(options: DialogOptions) => DialogReactive` | 调用 `warning` 类型的对话框 |

### useDialogReactiveList API

```
() => Ref<readonly DialogReactive[]>
```

### DialogOptions Properties

| 名称                | 类型                                                  | 默认值      | 说明                                                         | 版本   |
| ------------------- | ----------------------------------------------------- | ----------- | ------------------------------------------------------------ | ------ |
| action              | `() => VNodeChild`                                    | `undefined` | 操作区域的内容，需要是渲染函数                               |        |
| actionClass         | `string`                                              | `undefined` | 操作区域的类名                                               | 2.38.2 |
| actionStyle         | `Object | string`                                     | `undefined` | 操作区域的样式                                               | 2.38.2 |
| autoFocus           | `boolean`                                             | `true`      | 是否自动聚焦 Modal 第一个可聚焦的元素                        | 2.28.3 |
| blockScroll         | `boolean`                                             | `true`      | 是否在打开时禁用 body 滚动                                   | 2.28.3 |
| bordered            | `boolean`                                             | `false`     | 是否显示 `border`                                            |        |
| class               | `any`                                                 | `undefined` | 类名                                                         | 2.33.0 |
| closable            | `boolean`                                             | `true`      | 是否显示 `close` 图标                                        |        |
| closeFocusable      | `boolean`                                             | `false`     | 关闭按钮是否可以聚焦                                         | 2.43.0 |
| closeOnEsc          | `boolean`                                             | `true`      | 是否在摁下 Esc 键的时候关闭对话框                            | 2.26.4 |
| content             | `string | (() => VNodeChild)`                         | `undefined` | 对话框内容，可以是渲染函数                                   |        |
| contentClass        | `string`                                              | `undefined` | 内容的类名                                                   | 2.38.2 |
| contentStyle        | `Object | string`                                     | `undefined` | 内容的样式                                                   | 2.38.2 |
| draggable           | `boolean | { bounds?: 'none' }`                       | `false`     | 是否可拖拽                                                   | 2.41.0 |
| iconPlacement       | `'left' | 'top'`                                      | `'left'`    | 图标的位置                                                   |        |
| icon                | `() => VNodeChild`                                    | `undefined` | 对话框 `icon`, 需要是渲染函数                                |        |
| loading             | `boolean`                                             | `false`     | 是否显示 `loading` 状态                                      |        |
| maskClosable        | `boolean`                                             | `true`      | 是否可以通过点击 `mask` 关闭对话框                           |        |
| negativeButtonProps | `ButtonProps`                                         | `undefined` | 取消按钮的属性                                               | 2.27.0 |
| negativeText        | `string`                                              | `undefined` | 取消按钮的文字，不填对应的按钮不会出现                       |        |
| positiveButtonProps | `ButtonProps`                                         | `undefined` | 确认按钮的属性                                               | 2.27.0 |
| positiveText        | `string`                                              | `undefined` | 确认按钮的文字，不填对应的按钮不会出现                       |        |
| showIcon            | `boolean`                                             | `true`      | 是否显示 `icon`                                              |        |
| style               | `string | Object`                                     | `undefined` | 样式                                                         |        |
| title               | `string | (() => VNodeChild)`                         | `undefined` | 标题，可以是渲染函数                                         |        |
| titleClass          | `string`                                              | `undefined` | 标题的类名                                                   | 2.38.2 |
| titleStyle          | `Object | string`                                     | `undefined` | 标题的样式                                                   | 2.38.2 |
| transformOrigin     | `'mouse' | 'center'`                                  | `'mouse'`   | 对话框动画出现的位置                                         | 2.34.0 |
| type                | `'error | 'success' | 'warning'`                      | `'warning'` | 对话框类型                                                   |        |
| zIndex              | `number`                                              | `undefined` | Dialog 的 z-index                                            | 2.43.0 |
| onAfterEnter        | `() => void`                                          | `undefined` | 出现动画完成执行的回调                                       | 2.33.0 |
| onAfterLeave        | `() => void`                                          | `undefined` | 关闭动画完成执行的回调                                       | 2.33.3 |
| onClose             | `() => boolean | Promise<boolean> | any`              | `undefined` | 默认行为是关闭确认框。返回 `false` 或者 `resolve false` 或者 `Promise` 被 `reject` 会避免默认行为 |        |
| onNegativeClick     | `(e: MouseEvent) => boolean | Promise<boolean> | any` | `undefined` | 默认行为是关闭确认框。返回 `false` 或者 `resolve false` 或者 `Promise` 被 `reject` 会避免默认行为 |        |
| onPositiveClick     | `(e: MouseEvent) => boolean | Promise<boolean> | any` | `undefined` | 默认行为是关闭确认框。返回 `false` 或者 `resolve false` 或者 `Promise` 被 `reject` 会避免默认行为 |        |
| onMaskClick         | `() => void`                                          | `undefined` | 点击蒙层后执行的回调                                         |        |

### DialogReactive API

#### DialogReactive Properties

下列属性都可以被动态修改。

| 名称                | 类型                                                  | 说明                                                         | 版本   |
| ------------------- | ----------------------------------------------------- | ------------------------------------------------------------ | ------ |
| actionClass         | `string`                                              | 操作区域的类名                                               | 2.38.2 |
| actionStyle         | `Object | string`                                     | 操作区域的样式                                               | 2.38.2 |
| bordered            | `boolean`                                             | 是否显示 `border`                                            |        |
| class               | `any`                                                 | 类名                                                         | 2.33.0 |
| closable            | `boolean`                                             | 是否显示 `close` 图标                                        |        |
| closeFocusable      | `boolean`                                             | 关闭按钮是否可以聚焦                                         | 2.43.0 |
| closeOnEsc          | `boolean`                                             | 是否在摁下 Esc 键的时候关闭对话框                            | 2.26.4 |
| content             | `string | (() => VNodeChild)`                         | 对话框内容，可以是渲染函数                                   |        |
| contentClass        | `string`                                              | 内容的类名                                                   | 2.38.2 |
| contentStyle        | `Object | string`                                     | 内容的样式                                                   | 2.38.2 |
| iconPlacement       | `'left' | 'top'`                                      | 图标的位置                                                   |        |
| icon                | `() => VNodeChild`                                    | 对话框 `icon`，需要是渲染函数                                |        |
| loading             | `boolean`                                             | 是否显示 `loading` 状态                                      |        |
| maskClosable        | `boolean`                                             | 是否可以通过点击 `mask` 关闭对话框                           |        |
| negativeButtonProps | `ButtonProps`                                         | 取消按钮的属性                                               | 2.27.0 |
| negativeText        | `string`                                              | 取消按钮的文字，不填对应的按钮不会出现                       |        |
| positiveButtonProps | `ButtonProps`                                         | 确认按钮的属性                                               | 2.27.0 |
| positiveText        | `string`                                              | 确认按钮的文字，不填对应的按钮不会出现                       |        |
| showIcon            | `boolean`                                             | 是否显示 `icon`                                              |        |
| style               | `string | Object`                                     | 样式                                                         |        |
| title               | `string | (() => VNodeChild)`                         | 可以是渲染函数                                               |        |
| titleClass          | `string`                                              | 标题的类名                                                   | 2.38.2 |
| titleStyle          | `Object | string`                                     | 标题的样式                                                   | 2.38.2 |
| transformOrigin     | `'mouse' | 'center'`                                  | 对话框动画出现的位置                                         | 2.34.0 |
| type                | `'error | 'success' | 'warning'`                      | 对话框类型                                                   |        |
| onAfterEnter        | `() => void | undefined`                              | 出现动画完成执行的回调                                       | 2.33.0 |
| onAfterLeave        | `() => void | undefined`                              | 关闭动画完成执行的回调                                       | 2.33.3 |
| onClose             | `() => boolean | Promise<boolean> | any`              | 默认行为是关闭确认框。返回 `false` 或者 resolve `false` 或者 `Promise` 被 `reject` 会避免默认行为 |        |
| onEsc               | `() => void`                                          | 焦点在 dialog 内部时按下 Esc 键的回调                        | 2.32.0 |
| onNegativeClick     | `(e: MouseEvent) => boolean | Promise<boolean> | any` | 默认行为是关闭确认框。返回 `false` 或者 resolve `false` 或者 `Promise` 被 `reject` 会避免默认行为 |        |
| onPositiveClick     | `(e: MouseEvent) => boolean | Promise<boolean> | any` | 默认行为是关闭确认框。返回 `false` 或者 resolve `false` 或者 `Promise` 被 `reject` 会避免默认行为 |        |

#### DialogReactive Methods

| 名称    | 类型 | 说明          |
| ------- | ---- | ------------- |
| destroy | `()` | 关闭 `Dialog` |

### Dialog Props

| 名称                  | 类型                                      | 默认值      | 说明                                   | 版本   |
| --------------------- | ----------------------------------------- | ----------- | -------------------------------------- | ------ |
| action-class          | `string`                                  | `undefined` | 操作区域的类名                         | 2.38.2 |
| action-style          | `Object | string`                         | `undefined` | 操作区域的样式                         | 2.38.2 |
| bordered              | `boolean`                                 | `false`     | 是否显示 `border`                      |        |
| closable              | `boolean`                                 | `true`      | 是否显示 `close` 图标                  |        |
| close-focusable       | `boolean`                                 | `false`     | 关闭按钮是否可以聚焦                   | 2.43.0 |
| content               | `string | (() => VNodeChild)`             | `undefined` | 对话框内容，可以是渲染函数             |        |
| content-class         | `string`                                  | `undefined` | 内容的类名                             | 2.38.2 |
| content-style         | `Object | string`                         | `undefined` | 内容的样式                             | 2.38.2 |
| icon-placement        | `'left' | 'top'`                          | `'left'`    | 图标放置的位置                         |        |
| icon                  | `() => VNodeChild`                        | `undefined` | 需要是渲染函数                         |        |
| loading               | `boolean`                                 | `false`     | 是否显示 `loading` 状态                |        |
| negative-button-props | `ButtonProps`                             | `undefined` | 取消按钮的属性                         | 2.27.0 |
| negative-text         | `string`                                  | `undefined` | 取消按钮的文字，不填对应的按钮不会出现 |        |
| positive-button-props | `ButtonProps`                             | `undefined` | 确认按钮的属性                         | 2.27.0 |
| positive-text         | `string`                                  | `undefined` | 确认按钮的文字，不填对应的按钮不会出现 |        |
| show-icon             | `boolean`                                 | `true`      | 是否显示 `icon`                        |        |
| title                 | `string | (() => VNodeChild)`             | `undefined` | 对话框标题，可以是渲染函数             |        |
| title-class           | `string`                                  | `undefined` | 标题的类名                             | 2.38.2 |
| title-style           | `Object | string`                         | `undefined` | 标题的样式                             | 2.38.2 |
| type                  | `'error | 'success' | 'warning' | 'info'` | `'warning'` | 对话框类型                             |        |
| on-close              | `() => void`                              | `undefined` | 点击关闭时执行的回调函数               |        |
| on-negative-click     | `(e: MouseEvent) => void`                 | `undefined` | 执行 `negative` 时执行的回调函数       |        |
| on-positive-click     | `(e: MouseEvent) => void`                 | `undefined` | 执行 `positive` 时执行的回调函数       |        |

### Dialog Slots

| 名称    | 参数 | 说明          | 版本   |
| ------- | ---- | ------------- | ------ |
| action  | `()` | `action` 内容 |        |
| default | `()` | 对话框内容    |        |
| header  | `()` | `header` 内容 |        |
| icon    | `()` | `icon` 内容   |        |
| close   | `()` | `close` 内容  | 2.36.0 |

# Element Plus API

### Attributes

| 属性名                  | 说明                                                         | 类型                          | 默认        |
| :---------------------- | :----------------------------------------------------------- | :---------------------------- | :---------- |
| model-value / v-model   | 是否显示 Dialog                                              | `boolean`                     | 你好        |
| title                   | Dialog 对话框 Dialog 的标题， 也可通过具名 slot （见下表）传入 | `string`                      | ''          |
| width                   | 对话框的宽度，默认值为 50%                                   | `string` / `number`           | ''          |
| fullscreen              | 是否为全屏 Dialog                                            | `boolean`                     | false       |
| top                     | dialog CSS 中的 margin-top 值，默认为 15vh                   | `string`                      | ''          |
| modal                   | 是否需要遮罩层                                               | `boolean`                     | true        |
| modal-penetrable 2.10.5 | 是否允许穿透遮罩层。 modal 属性必须为 `false`。              | `boolean`                     | false       |
| modal-class             | 遮罩的自定义类名                                             | `string`                      | —           |
| header-class 2.9.3      | header 部分的自定义 class 名                                 | `string`                      | —           |
| body-class 2.9.3        | body 部分的自定义 class 名                                   | `string`                      | —           |
| footer-class 2.9.3      | footer 部分的自定义 class 名                                 | `string`                      | —           |
| append-to-body          | Dialog 自身是否插入至 body 元素上。 嵌套的 Dialog 必须指定该属性并赋值为 `true` | `boolean`                     | false       |
| append-to 2.4.3         | Dialog 挂载到哪个 DOM 元素 将覆盖 `append-to-body`           | `CSSSelector` / `HTMLElement` | body        |
| lock-scroll             | 是否在 Dialog 出现时将 body 滚动锁定                         | `boolean`                     | true        |
| open-delay              | dialog 打开的延时时间，单位毫秒                              | `number`                      | 0           |
| close-delay             | dialog 关闭的延时时间，单位毫秒                              | `number`                      | 0           |
| close-on-click-modal    | 是否可以通过点击 modal 关闭 Dialog                           | `boolean`                     | true        |
| close-on-press-escape   | 是否可以通过按下 ESC 关闭 Dialog                             | `boolean`                     | true        |
| show-close              | 是否显示关闭按钮                                             | `boolean`                     | true        |
| before-close            | 关闭前的回调，会暂停 Dialog 的关闭. 回调函数内执行 done 参数方法的时候才是真正关闭对话框的时候. | `Function`                    | —           |
| draggable               | 为 Dialog 启用可拖拽功能                                     | `boolean`                     | false       |
| overflow 2.5.4          | 拖动范围可以超出可视区                                       | `boolean`                     | false       |
| center                  | 是否让 Dialog 的 header 和 footer 部分居中排列               | `boolean`                     | false       |
| align-center 2.2.16     | 是否水平垂直对齐对话框                                       | `boolean`                     | false       |
| destroy-on-close        | 当关闭 Dialog 时，销毁其中的元素                             | `boolean`                     | false       |
| close-icon              | 自定义关闭图标，默认 Close                                   | `string` / `Component`        | —           |
| z-index                 | 和原生的 CSS 的 z-index 相同，改变 z 轴的顺序                | `number`                      | —           |
| header-aria-level a11y  | header 的 `aria-level` 属性                                  | `string`                      | 2           |
| transition 2.10.5       | 对话框动画的自定义过渡配置。 可以是一个字符串（过渡名称），也可以是一个包含 Vue 过渡属性的对象。 | `string` / `object`           | dialog-fade |
| custom-class deprecated | Dialog 的自定义类名                                          | `string`                      | ''          |

WARNING

`custom-class` 已被 **弃用**, 之后将会在 2.4.0 **移除**, 请使用 `class`.

### Slots

| 插槽名           | 说明                                                   |
| :--------------- | :----------------------------------------------------- |
| default          | 对话框的默认内容                                       |
| header           | 对话框标题的内容；会替换标题部分，但不会移除关闭按钮。 |
| footer           | Dialog 按钮操作区的内容                                |
| title deprecated | 与 header 作用相同 请使用 header                       |

WARNING

`title` 已被**弃用**，并将在 3.0.0 版本中**移除**，请使用 `header` 代替。

### 事件

| 名称             | 详情                               | Type       |
| :--------------- | :--------------------------------- | :--------- |
| open             | Dialog 打开的回调                  | `Function` |
| opened           | Dialog 打开动画结束时的回调        | `Function` |
| close            | Dialog 关闭的回调                  | `Function` |
| closed           | Dialog 关闭动画结束时的回调        | `Function` |
| open-auto-focus  | 输入焦点聚焦在 Dialog 内容时的回调 | `Function` |
| close-auto-focus | 输入焦点从 Dialog 内容失焦时的回调 | `Function` |

### Exposes

| 名称                | 详情       | 类型       |
| :------------------ | :--------- | :--------- |
| resetPosition 2.8.1 | 重置位置   | `Function` |
| handleClose 2.9.8   | 关闭对话框 | `Function` |

# Ant Design Vue API

| 参数              | 说明                                                        | 类型                                                    | 默认值              | 版本 |
| :---------------- | :---------------------------------------------------------- | :------------------------------------------------------ | :------------------ | :--- |
| afterClose        | Modal 完全关闭后的回调                                      | function                                                | -                   |      |
| bodyStyle         | Modal body 样式                                             | object                                                  | {}                  |      |
| cancelButtonProps | cancel 按钮 props                                           | [ButtonProps](https://antdv.com/components/button/#api) | -                   |      |
| cancelText        | 取消按钮文字                                                | string\| slot                                           | 取消                |      |
| centered          | 垂直居中展示 Modal                                          | boolean                                                 | `false`             |      |
| closable          | 是否显示右上角的关闭按钮                                    | boolean                                                 | true                |      |
| closeIcon         | 自定义关闭图标                                              | VNode \| slot                                           | -                   |      |
| confirmLoading    | 确定按钮 loading                                            | boolean                                                 | -                   |      |
| destroyOnClose    | 关闭时销毁 Modal 里的子元素                                 | boolean                                                 | false               |      |
| footer            | 底部内容，当不需要默认底部按钮时，可以设为 `:footer="null"` | string\|slot                                            | 确定取消按钮        |      |
| forceRender       | 强制渲染 Modal                                              | boolean                                                 | false               |      |
| getContainer      | 指定 Modal 挂载的 HTML 节点                                 | (instance): HTMLElement                                 | () => document.body |      |
| keyboard          | 是否支持键盘 esc 关闭                                       | boolean                                                 | true                |      |
| mask              | 是否展示遮罩                                                | boolean                                                 | true                |      |
| maskClosable      | 点击蒙层是否允许关闭                                        | boolean                                                 | true                |      |
| maskStyle         | 遮罩样式                                                    | object                                                  | {}                  |      |
| okButtonProps     | ok 按钮 props                                               | [ButtonProps](https://antdv.com/components/button/#api) | -                   |      |
| okText            | 确认按钮文字                                                | string\|slot                                            | 确定                |      |
| okType            | 确认按钮类型                                                | string                                                  | primary             |      |
| title             | 标题                                                        | string\|slot                                            | -                   |      |
| open(v-model)     | 对话框是否可见                                              | boolean                                                 | -                   |      |
| width             | 宽度                                                        | string\|number                                          | 520                 |      |
| wrapClassName     | 对话框外层容器的类名                                        | string                                                  | -                   |      |
| zIndex            | 设置 Modal 的 `z-index`                                     | number                                                  | 1000                |      |

### 事件 [#](https://antdv.com/components/modal-cn#事件)

| 事件名称 | 说明                                 | 回调参数    |
| :------- | :----------------------------------- | :---------- |
| cancel   | 点击遮罩层或右上角叉或取消按钮的回调 | function(e) |
| ok       | 点击确定回调                         | function(e) |

#### 注意 [#](https://antdv.com/components/modal-cn#注意)

> `<Modal />` 默认关闭后状态不会自动清空, 如果希望每次打开都是新内容，请设置 `destroyOnClose`。

### Modal.method() [#](https://antdv.com/components/modal-cn#modal-method)

包括：

- `Modal.info`
- `Modal.success`
- `Modal.error`
- `Modal.warning`
- `Modal.confirm`

以上均为一个函数，参数为 object，具体属性如下：

| 参数              | 说明                                                         | 类型                                               | 默认值  | 版本  |
| :---------------- | :----------------------------------------------------------- | :------------------------------------------------- | :------ | :---- |
| appContext        | 弹窗的上下文，一般用于获取全局注册组件、vuex 等内容          | -                                                  | -       |       |
| autoFocusButton   | 指定自动获得焦点的按钮                                       | `null` | `ok` | `cancel`                           | `ok`    |       |
| cancelButtonProps | cancel 按钮 props                                            | [ButtonProps](https://antdv.com/components/button) | -       |       |
| cancelText        | 取消按钮文字                                                 | string                                             | 取消    |       |
| centered          | 垂直居中展示 Modal                                           | boolean                                            | `false` |       |
| class             | 容器类名                                                     | string                                             | -       |       |
| closable          | 是否显示右上角的关闭按钮                                     | boolean                                            | `false` |       |
| content           | 内容                                                         | string \|VNode \|function()                        | -       |       |
| footer            | 底部内容，当不需要默认底部按钮时，可以设为 `footer: null`    | string \|VNode \|function()                        | -       | 4.0.0 |
| icon              | 自定义图标（1.14.0 新增）                                    | VNode \| ()=>VNode                                 | -       |       |
| keyboard          | 是否支持键盘 esc 关闭                                        | boolean                                            | true    |       |
| mask              | 是否展示遮罩                                                 | boolean                                            | true    |       |
| maskClosable      | 点击蒙层是否允许关闭                                         | boolean                                            | `false` |       |
| okButtonProps     | ok 按钮 props                                                | [ButtonProps](https://antdv.com/components/button) | -       |       |
| okText            | 确认按钮文字                                                 | string                                             | 确定    |       |
| okType            | 确认按钮类型                                                 | string                                             | primary |       |
| title             | 标题                                                         | string\|VNode \|function()                         | -       |       |
| width             | 宽度                                                         | string\|number                                     | 416     |       |
| wrapClassName     | 对话框外层容器的类名                                         | string                                             | -       | 3.2.3 |
| zIndex            | 设置 Modal 的 `z-index`                                      | number                                             | 1000    |       |
| onCancel          | 取消回调，参数为关闭函数，返回 promise 时 resolve 后自动关闭 | function                                           | -       |       |
| onOk              | 点击确定回调，参数为关闭函数，返回 promise 时 resolve 后自动关闭 | function                                           | -       |       |

以上函数调用后，会返回一个引用，可以通过该引用更新和关闭弹窗。

# TDesign API

### Dialog Props 

| 名称                  | 类型                               | 默认值    | 描述                                                         | 必传 |
| :-------------------- | :--------------------------------- | :-------- | :----------------------------------------------------------- | :--- |
| attach                | String / Function                  | -         | 对话框挂载的节点。数据类型为 String 时，会被当作选择器处理，进行节点查询。示例：'body' 或 () => document.body。TS 类型：`AttachNode`。[通用类型定义](https://github.com/Tencent/tdesign-vue/blob/develop/src/common.ts) | N    |
| body                  | String / Slot / Function           | -         | 对话框内容。TS 类型：`string | TNode`。[通用类型定义](https://github.com/Tencent/tdesign-vue/blob/develop/src/common.ts) | N    |
| cancelBtn             | String / Object / Slot / Function  | -         | 取消按钮，可自定义。值为 null 则不显示取消按钮。值类型为字符串，则表示自定义按钮文本，值类型为 Object 则表示透传 Button 组件属性。使用 TNode 自定义按钮时，需自行控制取消事件。TS 类型：`string | ButtonProps | TNode | null`，[Button API Documents](https://tdesign.tencent.com/vue/components/button?tab=api)。[通用类型定义](https://github.com/Tencent/tdesign-vue/blob/develop/src/common.ts)。[详细类型定义](https://github.com/Tencent/tdesign-vue/tree/develop/src/dialog/type.ts) | N    |
| closeBtn              | String / Boolean / Slot / Function | true      | 关闭按钮，可以自定义。值为 true 显示默认关闭按钮，值为 false 不显示关闭按钮。值类型为 string 则直接显示值，如：“关闭”。值类型为 TNode，则表示呈现自定义按钮示例。TS 类型：`string | boolean | TNode`。[通用类型定义](https://github.com/Tencent/tdesign-vue/blob/develop/src/common.ts) | N    |
| closeOnEscKeydown     | Boolean                            | true      | 按下 ESC 时是否触发对话框关闭事件                            | N    |
| closeOnOverlayClick   | Boolean                            | true      | 点击蒙层时是否触发关闭事件                                   | N    |
| confirmBtn            | String / Object / Slot / Function  | -         | 确认按钮。值为 null 则不显示确认按钮。值类型为字符串，则表示自定义按钮文本，值类型为 Object 则表示透传 Button 组件属性。使用 TNode 自定义按钮时，需自行控制确认事件。TS 类型：`string | ButtonProps | TNode | null`。[通用类型定义](https://github.com/Tencent/tdesign-vue/blob/develop/src/common.ts) | N    |
| confirmLoading        | Boolean                            | undefined | 确认按钮加载状态                                             | N    |
| confirmOnEnter        | Boolean                            | -         | 是否在按下回车键时，触发确认事件                             | N    |
| default               | String / Slot / Function           | -         | 对话框内容，同 body。TS 类型：`string | TNode`。[通用类型定义](https://github.com/Tencent/tdesign-vue/blob/develop/src/common.ts) | N    |
| destroyOnClose        | Boolean                            | false     | 是否在关闭弹框的时候销毁子元素                               | N    |
| dialogClassName       | String                             | -         | 弹框元素类名，示例：'t-class-dialog-first t-class-dialog-second' | N    |
| dialogStyle           | Object                             | -         | 作用于对话框本身的样式。TS 类型：`Styles`。[通用类型定义](https://github.com/Tencent/tdesign-vue/blob/develop/src/common.ts) | N    |
| draggable             | Boolean                            | false     | 对话框是否可以拖拽（仅在非模态对话框时有效）                 | N    |
| footer                | Boolean / Slot / Function          | true      | 底部操作栏，默认会有“确认”和“取消”两个按钮。值为 true 显示默认操作按钮，值为 false 不显示任何内容，值类型为 Function 表示自定义底部内容。TS 类型：`boolean | TNode`。[通用类型定义](https://github.com/Tencent/tdesign-vue/blob/develop/src/common.ts) | N    |
| header                | String / Boolean / Slot / Function | true      | 头部内容。值为 true 显示空白头部，值为 false 不显示任何内容，值类型为 string 则直接显示值，值类型为 Function 表示自定义头部内容。TS 类型：`string | boolean | TNode`。[通用类型定义](https://github.com/Tencent/tdesign-vue/blob/develop/src/common.ts) | N    |
| mode                  | String                             | modal     | 对话框类型，有 4 种：模态对话框、非模态对话框、普通对话框、全屏对话框。弹出「模态对话框」时，只能操作对话框里面的内容，不能操作其他内容。弹出「非模态对话框」时，则可以操作页面内所有内容。「普通对话框」是指没有脱离文档流的对话框，可以在这个基础上开发更多的插件。可选项：modal/modeless/normal/full-screen | N    |
| placement             | String                             | top       | 对话框位置，内置两种：垂直水平居中显示 和 靠近顶部（top:20%）显示。默认情况，为避免贴顶或贴底，顶部和底部距离最小为 `48px`，可通过调整 `top` 覆盖默认大小。可选项：top/center | N    |
| preventScrollThrough  | Boolean                            | true      | 防止滚动穿透                                                 | N    |
| showInAttachedElement | Boolean                            | false     | 仅在挂载元素中显示抽屉，默认在浏览器可视区域显示。父元素需要有定位属性，如：position: relative | N    |
| showOverlay           | Boolean                            | true      | 是否显示遮罩层                                               | N    |
| theme                 | String                             | default   | 对话框风格。可选项：default/info/warning/danger/success      | N    |
| top                   | String / Number                    | -         | 用于弹框具体窗口顶部的距离，优先级大于 placement             | N    |
| visible               | Boolean                            | -         | 控制对话框是否显示                                           | N    |
| width                 | String / Number                    | -         | 对话框宽度，示例：320, '500px', '80%'                        | N    |
| zIndex                | Number                             | -         | 对话框层级，Web 侧样式默认为 2500，移动端和小程序样式默认为 1500 | N    |
| onBeforeClose         | Function                           |           | TS 类型：`() => void` 对话框执行消失动画效果前触发           | N    |
| onBeforeOpen          | Function                           |           | TS 类型：`() => void` 对话框执行弹出动画效果前触发           | N    |
| onCancel              | Function                           |           | TS 类型：`(context: { e: MouseEvent }) => void` 如果“取消”按钮存在，则点击“取消”按钮时触发，同时触发关闭事件 | N    |
| onClose               | Function                           |           | TS 类型：`(context: DialogCloseContext) => void` 关闭事件，点击取消按钮、点击关闭按钮、点击蒙层、按下 ESC 等场景下触发。[详细类型定义](https://github.com/Tencent/tdesign-vue/tree/develop/src/dialog/type.ts)。 `type DialogEventSource = 'esc' | 'close-btn' | 'cancel' | 'overlay'`  `interface DialogCloseContext { trigger: DialogEventSource; e: MouseEvent | KeyboardEvent }` | N    |
| onCloseBtnClick       | Function                           |           | TS 类型：`(context: { e: MouseEvent }) => void` 点击右上角关闭按钮时触发 | N    |
| onClosed              | Function                           |           | TS 类型：`() => void` 对话框消失动画效果结束后触发           | N    |
| onConfirm             | Function                           |           | TS 类型：`(context: { e: MouseEvent | KeyboardEvent }) => void` 如果“确认”按钮存在，则点击“确认”按钮时触发，或者键盘按下回车键时触发 | N    |
| onEscKeydown          | Function                           |           | TS 类型：`(context: { e: KeyboardEvent }) => void` 按下 ESC 时触发事件 | N    |
| onOpened              | Function                           |           | TS 类型：`() => void` 对话框弹出动画效果结束后触发           | N    |
| onOverlayClick        | Function                           |           | TS 类型：`(context: { e: MouseEvent }) => void` 如果蒙层存在，点击蒙层时触发 | N    |

### Dialog Events 

| 名称            | 参数                                           | 描述                                                         |
| :-------------- | :--------------------------------------------- | :----------------------------------------------------------- |
| before-close    | -                                              | 对话框执行消失动画效果前触发                                 |
| before-open     | -                                              | 对话框执行弹出动画效果前触发                                 |
| cancel          | `(context: { e: MouseEvent })`                 | 如果“取消”按钮存在，则点击“取消”按钮时触发，同时触发关闭事件 |
| close           | `(context: DialogCloseContext)`                | 关闭事件，点击取消按钮、点击关闭按钮、点击蒙层、按下 ESC 等场景下触发。[详细类型定义](https://github.com/Tencent/tdesign-vue/tree/develop/src/dialog/type.ts)。 `type DialogEventSource = 'esc' | 'close-btn' | 'cancel' | 'overlay'`  `interface DialogCloseContext { trigger: DialogEventSource; e: MouseEvent | KeyboardEvent }` |
| close-btn-click | `(context: { e: MouseEvent })`                 | 点击右上角关闭按钮时触发                                     |
| closed          | -                                              | 对话框消失动画效果结束后触发                                 |
| confirm         | `(context: { e: MouseEvent | KeyboardEvent })` | 如果“确认”按钮存在，则点击“确认”按钮时触发，或者键盘按下回车键时触发 |
| esc-keydown     | `(context: { e: KeyboardEvent })`              | 按下 ESC 时触发事件                                          |
| opened          | -                                              | 对话框弹出动画效果结束后触发                                 |
| overlay-click   | `(context: { e: MouseEvent })`                 | 如果蒙层存在，点击蒙层时触发                                 |

### DialogOptions 

| 名称                          | 类型              | 默认值 | 描述                                                         | 必传 |
| :---------------------------- | :---------------- | :----- | :----------------------------------------------------------- | :--- |
| attach                        | String / Function | 'body' | 对话框挂载的节点。数据类型为 String 时，会被当作选择器处理，进行节点查询。示例：'body' 或 () => document.body。TS 类型：`AttachNode`。[通用类型定义](https://github.com/Tencent/tdesign-vue/blob/develop/src/common.ts) | N    |
| className                     | String            | -      | 弹框类名，示例：'t-class-dialog-first t-class-dialog-second' | N    |
| style                         | String / Object   | -      | 弹框 style 属性，输入 [CSSStyleDeclaration.cssText](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleDeclaration/cssText)。TS 类型：`string | Styles`。[通用类型定义](https://github.com/Tencent/tdesign-vue/blob/develop/src/common.ts) | N    |
| `Omit<DialogProps, 'attach'>` | -                 | -      | 继承 `Omit<DialogProps, 'attach'>` 中的全部属性              | N    |

### DialogInstance 

| 名称              | 参数                     | 返回值 | 描述                       |
| :---------------- | :----------------------- | :----- | :------------------------- |
| destroy           | -                        | -      | 必需。销毁弹框             |
| hide              | -                        | -      | 必需。隐藏弹框             |
| setConfirmLoading | `(loading: boolean)`     | -      | 必需。设置确认按钮加载状态 |
| show              | -                        | -      | 必需。显示弹框             |
| update            | `(props: DialogOptions)` | -      | 必需。更新弹框内容         |

### DialogPlugin 

同时也支持 `this.$dialog`。

| 参数名称 | 参数类型 | 参数默认值 | 参数描述                 |
| :------- | :------- | :--------- | :----------------------- |
| options  | -        | -          | TS 类型：`DialogOptions` |

插件返回值：`DialogInstance`

### DialogPlugin.confirm 

同时也支持 `this.$dialog.confirm`。

| 参数名称 | 参数类型 | 参数默认值 | 参数描述                 |
| :------- | :------- | :--------- | :----------------------- |
| options  | -        | -          | TS 类型：`DialogOptions` |

插件返回值：`DialogInstance`

### DialogPlugin.alert 

同时也支持 `this.$dialog.alert`。

| 参数名称 | 参数类型 | 参数默认值 | 参数描述                                    |
| :------- | :------- | :--------- | :------------------------------------------ |
| options  | Object   | -          | TS 类型：`Omit<DialogOptions, 'cancelBtn'>` |

插件返回值：`DialogInstance`

