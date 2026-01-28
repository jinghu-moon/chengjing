<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconDownload,
  IconUpload,
} from '@tabler/icons-vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { Button } from '../../Button'
import SearchInput from '../../SearchInput.vue'
import type { LocalPoem } from '../types'
import type { PoemListProps } from '../types'

const props = defineProps<PoemListProps>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'edit', poem: LocalPoem): void
  (e: 'delete', id: string): void
  (e: 'export'): void
  (e: 'import'): void
  (e: 'update:searchKeyword', value: string): void
}>()

// 搜索防抖
// 注意：searchKeyword 应该由父组件管理？不，列表组件内部管理搜索更内聚。
// 但 props 传入了 searchKeyword 吗？没，我们在 props 没定义。
// 原 Dialog 逻辑是内部管理。我们可以在 PoemList 内部管理，或者 emits 回去。
// BookmarkPanel 中 search 是 useBookmarkSearch。
// 这里我们在 PoemList 内部处理搜索输入，但过滤逻辑是在父组件？
// 父组件传入了 `poems` (filtered)。
// 所以 PoemList 只需要 emit 'update:searchKeyword' 让父组件去过滤。
const keyword = ref('')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(keyword, (val) => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('update:searchKeyword', val)
  }, 300)
})

// 虚拟滚动
const scrollContainerRef = ref<HTMLElement | null>(null)

const virtualizer = useVirtualizer({
  get count() {
    return props.poems.length
  },
  getScrollElement: () => scrollContainerRef.value,
  estimateSize: () => 80,
  overscan: 5,
})

const virtualItems = computed(() => virtualizer.value.getVirtualItems())
const totalSize = computed(() => virtualizer.value.getTotalSize())

// 辅助函数
const formatAuthor = (poem: LocalPoem) => {
  let info = ''
  if (poem.dynasty) info += `〔${poem.dynasty}〕`
  info += poem.author
  if (poem.title) info += `《${poem.title}》`
  return info
}
</script>

<template>
  <div class="poem-list-view">
    <!-- 搜索栏 -->
    <div class="toolbar">
      <SearchInput
        v-model="keyword"
        placeholder="搜索诗词..."
        size="md"
        class="search-input-wrapper"
        @clear="keyword = ''"
      />
      <Button size="medium" @click="emit('add')">
        <IconPlus :size="16" />
        新增
      </Button>
    </div>

    <!-- 诗词数量 -->
    <div class="poem-count">
      共 {{ poems.length }} 首
      <span v-if="keyword && totalCount">(筛选自 {{ totalCount }} 首)</span>
    </div>

    <!-- 虚拟滚动列表 -->
    <div ref="scrollContainerRef" class="poem-list-container">
      <div
        class="poem-list-inner"
        :style="{ height: `${totalSize}px`, position: 'relative' }"
      >
        <div
          v-for="item in virtualItems"
          :key="poems[item.index].id"
          class="poem-item"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${item.start}px)`,
          }"
        >
          <div class="poem-content">{{ poems[item.index].content }}</div>
          <div class="poem-author">─ {{ formatAuthor(poems[item.index]) }}</div>
          <div class="poem-actions">
            <button class="action-btn edit" @click="emit('edit', poems[item.index])">
              <IconEdit :size="14" />
            </button>
            <button class="action-btn delete" @click="emit('delete', poems[item.index].id)">
              <IconTrash :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="poems.length === 0" class="empty-state">
        {{ keyword ? '未找到匹配的诗词' : '暂无诗词' }}
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="footer-actions">
      <Button :ghost="true" size="small" @click="emit('export')">
        <IconDownload :size="16" />
        导出
      </Button>
      <Button :ghost="true" size="small" @click="emit('import')">
        <IconUpload :size="16" />
        导入
      </Button>
    </div>
  </div>
</template>

<style scoped>
.poem-list-view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input-wrapper {
  flex: 1;
}

.poem-count {
  font-size: 12px;
  color: var(--text-tertiary);
}

.poem-list-container {
  height: 40vh; /* Fixed height for virtual scroll */
  overflow-y: auto;
  border: var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-input);
}

.poem-list-inner {
  width: 100%;
}

.poem-item {
  padding: 12px 16px;
  border-bottom: var(--border-light);
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.poem-item:hover {
  background: var(--bg-hover);
}

.poem-content {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  padding-right: 60px;
}

.poem-author {
  font-size: 12px;
  color: var(--text-secondary);
}

.poem-actions {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.poem-item:hover .poem-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-sm);
  background: var(--bg-panel);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn.edit {
  color: var(--color-primary);
}

.action-btn.edit:hover {
  background: var(--color-primary-alpha);
}

.action-btn.delete {
  color: var(--color-danger);
}

.action-btn.delete:hover {
  background: var(--color-danger-bg);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
  font-size: 14px;
}

.footer-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: var(--border-light);
}
</style>
