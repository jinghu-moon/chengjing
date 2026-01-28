<script setup lang="ts">
/**
 * 诗词管理面板 (容器组件)
 * 职责：
 * 1. 管理 Dialog 显示
 * 2. 管理 ViewMode (列表/表单)
 * 3. 编排数据流 (useDailyPoem)
 */
import { ref } from 'vue'
import { Dialog } from '../Dialog'
import { useDailyPoem } from './composables/useDailyPoem'
import { usePoemSearch } from './composables/usePoemSearch'
import { type LocalPoem } from './types'
import { useToast } from '../Toast/composables/useToast'
import PoemList from './components/PoemList.vue'
import PoemForm from './components/PoemForm.vue'
import type { ViewMode, PoemFormData } from './types'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const {
  poemCount,
  localPoems, // Need access to store
  addPoem,
  updatePoem,
  deletePoem,
  fetchOneForForm,
  exportPoems,
  importPoems,
} = useDailyPoem()

const { showToast } = useToast()

// ===== 状态管理 =====
const viewMode = ref<ViewMode>('list')
const editingId = ref<string | null>(null)
const formData = ref<PoemFormData | undefined>(undefined)
const formLoading = ref(false)
const apiLoading = ref(false)

// 导入相关
const fileInputRef = ref<HTMLInputElement | null>(null)

// ===== 高性能搜索 =====
const { 
  query: searchKeyword, // Bind directly
  filteredPoems, 
  search 
} = usePoemSearch(localPoems)

// 监听搜索词变化
const handleSearchUpdate = (val: string) => {
  search(val)
}

// ===== 事件处理 =====

// 切换到新增模式
const handleAdd = () => {
  editingId.value = null
  formData.value = undefined
  viewMode.value = 'form'
}

// 切换到编辑模式
const handleEdit = (poem: LocalPoem) => {
  editingId.value = poem.id
  formData.value = {
    content: poem.content,
    author: poem.author,
    title: poem.title || '',
    dynasty: poem.dynasty || '',
  }
  viewMode.value = 'form'
}

// 删除
const handleDelete = (id: string) => {
  if (confirm('确定要删除这首诗词吗？')) {
    deletePoem(id)
    showToast({ type: 'success', message: '删除成功' })
  }
}

// 导出
const handleExport = () => {
  exportPoems()
  showToast({ type: 'success', message: '导出成功' })
}

// 导入点击
const handleImportClick = () => {
  fileInputRef.value?.click()
}

// 导入文件处理
const handleImportFile = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  try {
    const result = await importPoems(file)
    showToast({
      type: 'success',
      message: `导入完成：新增 ${result.added} 首，跳过 ${result.skipped} 首重复`,
    })
  } catch (err) {
    showToast({ type: 'error', message: (err as Error).message })
  }

  if (fileInputRef.value) fileInputRef.value.value = ''
}

// 表单提交
const handleFormSubmit = (data: PoemFormData) => {
  if (editingId.value) {
    updatePoem(editingId.value, {
      content: data.content,
      author: data.author,
      title: data.title || undefined,
      dynasty: data.dynasty || undefined,
    })
    showToast({ type: 'success', message: '修改成功' })
  } else {
    addPoem({
      content: data.content,
      author: data.author,
      title: data.title || undefined,
      dynasty: data.dynasty || undefined,
    })
    showToast({ type: 'success', message: '添加成功' })
  }
  handleViewBack()
}

// API 获取
const handleFetchApi = async () => {
  apiLoading.value = true
  try {
    const poem = await fetchOneForForm()
    if (poem) {
      // 更新 formData
      // 注意：这里需要响应式地更新传递给 PoemForm 的 props
      // 我们直接修改 formData.value，PoemForm 会 watch props.initialData
      formData.value = {
        content: poem.content,
        author: poem.author,
        title: poem.title || '',
        dynasty: poem.dynasty || '',
      }
      showToast({ type: 'success', message: '已获取在线诗词' })
    } else {
      showToast({ type: 'error', message: '获取失败，请稍后重试' })
    }
  } finally {
    apiLoading.value = false
  }
}

// 返回列表
const handleViewBack = () => {
  viewMode.value = 'list'
  editingId.value = null
  formData.value = undefined
}

// 关闭 Dialog
const handleClose = () => {
  emit('update:modelValue', false)
  // 延迟重置
  setTimeout(() => {
    handleViewBack()
    searchKeyword.value = ''
  }, 300)
}
</script>

<template>
  <Dialog
    :model-value="props.modelValue"
    title="诗词管理"
    width="560px"
    :show-confirm-btn="false"
    :show-cancel-btn="false"
    :closable="true"
    :mask-closable="true"
    dialog-class="poem-manager-dialog"
    @update:model-value="emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <div class="poem-manager-body">
      <transition name="fade" mode="out-in">
        <PoemList
          v-if="viewMode === 'list'"
          :poems="filteredPoems"
          :total-count="poemCount"
          @update:search-keyword="handleSearchUpdate"
          @add="handleAdd"
          @edit="handleEdit"
          @delete="handleDelete"
          @export="handleExport"
          @import="handleImportClick"
        />
        
        <PoemForm
          v-else
          :initial-data="formData"
          :loading="formLoading"
          :api-loading="apiLoading"
          :submit-text="editingId ? '保存修改' : '添加诗词'"
          @submit="handleFormSubmit"
          @cancel="handleViewBack"
          @fetch-api="handleFetchApi"
        />
      </transition>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      hidden
      @change="handleImportFile"
    />
  </Dialog>
</template>

<style scoped>
.poem-manager-body {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 简单的淡入淡出过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style>
/* 覆盖 Dialog padding */
.poem-manager-dialog .dialog-body {
  padding: 16px;
  min-height: 400px; /* 保证最小高度，防止切换视图时抖动 */
}
</style>
