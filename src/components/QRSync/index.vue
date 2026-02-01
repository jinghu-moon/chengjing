<script setup lang="ts">
/**
 * QR 二维码同步主组件
 * 整合生成器、导入器、预览确认功能
 */
import { ref } from 'vue'
import { useQRSync } from './composables/useQRSync'
import { useToast } from '@/components/Toast/composables/useToast'
import Dialog from '@/components/Dialog/Dialog.vue'
import QRGenerator from './QRGenerator.vue'
import QRImporter from './QRImporter.vue'
import QRPreview from './QRPreview.vue'

const { showToast } = useToast()
const { importPreview, applyImport, cancelImport } = useQRSync()

// 当前视图: generate | import
const currentView = ref<'generate' | 'import'>('generate')

// 预览弹窗
const showPreviewDialog = ref(false)

// 扫描成功回调
function onScanned() {
  if (importPreview.value) {
    showPreviewDialog.value = true
  }
}

// 导入确认回调
function onImportConfirm() {
  if (applyImport()) {
    showPreviewDialog.value = false
    showToast({ type: 'success', message: '配置已导入' })
  }
}

// 导入取消回调
function onImportCancel() {
  cancelImport()
  showPreviewDialog.value = false
}
</script>

<template>
  <div class="qr-sync">
    <!-- 标签切换 -->
    <div class="tab-header">
      <button
        class="tab-btn"
        :class="{ active: currentView === 'generate' }"
        @click="currentView = 'generate'"
      >
        生成二维码
      </button>
      <button
        class="tab-btn"
        :class="{ active: currentView === 'import' }"
        @click="currentView = 'import'"
      >
        导入配置
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="tab-content">
      <QRGenerator v-if="currentView === 'generate'" />
      <QRImporter v-else @scanned="onScanned" />
    </div>

    <!-- 预览确认弹窗 -->
    <Dialog
      v-model="showPreviewDialog"
      title="确认导入"
      width="420px"
      show-cancel-btn
      ok-text="确认导入"
      cancel-text="取消"
      @positive-click="onImportConfirm"
      @negative-click="onImportCancel"
    >
      <QRPreview />
    </Dialog>
  </div>
</template>

<style scoped>
.qr-sync {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 标签头部 */
.tab-header {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--bg-input);
  border-radius: 8px;
}

.tab-btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--bg-panel);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 内容区域 */
.tab-content {
  min-height: 300px;
}
</style>
