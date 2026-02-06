<script setup lang="ts">
import { onMounted } from 'vue'
import { IconDeviceFloppy } from '@tabler/icons-vue'
import { useHistory } from '@/composables/useHistory'

// V2.0 Components
import HistoryTimeline from './HistoryTimeline.vue'

// V2.1 Data Sync
import DataSync from '@/components/DataSync/index.vue'

// V2.0: 初始化历史记录自动保存
const { initAutoSaveWatcher } = useHistory()
onMounted(() => {
  initAutoSaveWatcher()
})
</script>

<template>
  <div class="backup-section">
    <!-- V2.0 板块2: 历史回溯 -->
    <section class="panel history-panel">
      <HistoryTimeline />
    </section>

    <!-- V2.1 板块3: 数据同步 -->
    <section class="panel datasync-panel">
      <div class="panel-header">
        <IconDeviceFloppy :size="16" />
        <span>同步配置 (Data Sync)</span>
      </div>
      <DataSync />
    </section>
  </div>
</template>

<style scoped>
.backup-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px 0;
}

/* V2.0 板块通用样式 */
.panel {
  background: var(--bg-input);
  border-radius: 12px;
  padding: 16px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 12px;
}
</style>
