<script setup lang="ts">
import { toRef } from 'vue'
import Dialog from './Dialog.vue'
import type { DialogInstance } from './types'
import { useDialog } from './composables/useDialog'

const props = defineProps<{
  instance: DialogInstance
}>()

const { remove } = useDialog()
const instance = toRef(props, 'instance')

// Mapping Events
const handleOk = async () => {
  // onOk 在 useDialog.ts 中已经封装了 resolve 和 close 逻辑
  // 以及 loading 状态?
  // Wait, useDialog.open logic:
  // onOk: async () => { if(options.onOk) await...; close(id, true) }

  // 这里 Component 不需要做太多，只需要触发 helper 里的 onOk
  if (instance.value.onOk) {
    // 如果 instance.loading 需要在这里控制？
    // useDialog 并没有内置 loading state control inside the instance object reactively unless we added it ??
    // check types.ts -> DialogOptions doesn't enforce reactive loading.

    // BUT, we can make the button loading if onOk returns promise.
    // The `Dialog` component handles loading prop.
    // We need to set instance.loading = true self?

    // Optimization: Let's handle loading here.
    try {
      instance.value.loading = true
      await instance.value.onOk()
    } finally {
      instance.value.loading = false
    }
  }
}

const handleCancel = () => {
  if (instance.value.onCancel) instance.value.onCancel()
}

const handleAfterClose = () => {
  remove(instance.value.id)
  if (instance.value.onAfterClose) instance.value.onAfterClose()
}
</script>

<template>
  <Dialog
    v-bind="instance"
    v-model="instance.visible"
    @positive-click="handleOk"
    @negative-click="handleCancel"
    @after-close="handleAfterClose"
  >
    <!-- 支持自定义组件内容 -->
    <component
      :is="instance.component"
      v-if="instance.component"
      v-bind="instance.componentProps"
    />
    <template v-else>{{ instance.content }}</template>
  </Dialog>
</template>
