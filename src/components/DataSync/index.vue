<template>
  <div class="data-sync">
    <div class="tabs-container">
      <CapsuleTabs 
        v-model="activeTab" 
        :items="tabItems" 
        stretch 
      />
    </div>

    <div class="content full-height">
      <DataExporter v-if="activeTab === 'export'" />
      <DataImporter v-if="activeTab === 'import'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataExporter from './DataExporter.vue'
import DataImporter from './DataImporter.vue'
import CapsuleTabs from '@/components/SettingsPanel/components/CapsuleTabs.vue'
import { IconDownload, IconUpload } from '@tabler/icons-vue'

const activeTab = ref<'export' | 'import'>('export')

const tabItems = [
  { value: 'export', label: '导出配置', icon: IconDownload },
  { value: 'import', label: '导入配置', icon: IconUpload }
]
</script>

<style scoped>
.data-sync {
  background: var(--bg-panel);
  backdrop-filter: var(--glass-md);
  border-radius: var(--radius-lg);
  border: var(--border-glass);
  color: var(--text-primary);
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  overflow: hidden;
  height: min(600px, 80vh);
  display: flex;
  flex-direction: column;
}

.tabs-container {
  padding: var(--spacing-sm);
  background: var(--bg-panel-card);
  border-bottom: var(--border-divider);
}

.content {
  flex: 1;
  overflow-y: auto;
}

/* Custom Scrollbar */
.content::-webkit-scrollbar {
  width: 6px;
}
.content::-webkit-scrollbar-thumb {
  background: var(--color-border-glass);
  border-radius: var(--radius-full);
}
</style>
