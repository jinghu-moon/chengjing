<script setup lang="ts">
import { useDialog } from './composables/useDialog'
import DialogItem from './DialogItem.vue'

const { dialogs } = useDialog()
</script>

<template>
  <div class="dialog-provider">
    <DialogItem v-for="item in dialogs" :key="item.id" :instance="item" />
  </div>
</template>
