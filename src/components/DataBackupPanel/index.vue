<script setup lang="ts">
/**
 * 数据备份面板
 * 独立的侧边抽屉面板，包含预设管理、历史回溯和文件备份功能
 */
import { IconDatabase } from '@tabler/icons-vue'
import { Drawer } from '@/components/Container'
import DataBackup from '@/components/DataBackup/index.vue'

const isOpen = defineModel<boolean>('open', { default: false })
</script>

<template>
  <Drawer
    v-model:open="isOpen"
    title="数据管理"
    :icon="IconDatabase"
    width="420px"
  >
    <DataBackup />
  </Drawer>
</template>

<style scoped>
/* 外壳样式已由 Drawer 组件接管 */
</style>
