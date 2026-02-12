<script setup lang="ts">
/**
 * 设置差异对比查看器
 * V1.2 细粒度配置导入核心组件
 */
import { computed, ref } from 'vue'
import {
  CATEGORY_LABELS,
  formatSettingValue,
  getSettingCategory,
  groupSettingsByCategory,
  type SettingCategory
} from '@/utils/settings-meta'

export interface SettingsDiffItem {
  key: string
  label: string
  localValue: any
  backupValue: any
  isDifferent: boolean
}

interface Props {
  diffItems: SettingsDiffItem[]
  selected?: string[]  // 外部传入的已选 keys（用于恢复状态）
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:selected', keys: string[]): void
}>()

// 选中的 keys
const selectedKeys = ref<Set<string>>(new Set())

// 展开的分类
const expandedCategories = ref<Set<SettingCategory>>(new Set())

// 按分类分组
const groupedItems = computed(() => {
  return groupSettingsByCategory(props.diffItems)
})

// 有差异的分类（默认展开）
const categoriesWithDiff = computed(() => {
  const cats = new Set<SettingCategory>()
  props.diffItems.forEach(item => {
    if (item.isDifferent) {
      const cat = getSettingCategory(item.key)
      if (cat) cats.add(cat)
    }
  })
  return cats
})

// 初始化：展开有差异的分类，选中所有差异项
const initSelection = () => {
  expandedCategories.value = new Set(categoriesWithDiff.value)

  // 优先使用外部传入的 selected，否则默认选中所有差异项
  if (props.selected && props.selected.length > 0) {
    selectedKeys.value = new Set(props.selected)
  } else {
    selectedKeys.value = new Set(
      props.diffItems.filter(i => i.isDifferent).map(i => i.key)
    )
  }
  emitSelected()
}

// 切换分类展开
const toggleCategory = (cat: SettingCategory) => {
  if (expandedCategories.value.has(cat)) {
    expandedCategories.value.delete(cat)
  } else {
    expandedCategories.value.add(cat)
  }
  expandedCategories.value = new Set(expandedCategories.value)
}

// 切换单项选中
const toggleItem = (key: string) => {
  if (selectedKeys.value.has(key)) {
    selectedKeys.value.delete(key)
  } else {
    selectedKeys.value.add(key)
  }
  selectedKeys.value = new Set(selectedKeys.value)
  emitSelected()
}

// 全选差异项
const selectAllDiff = () => {
  props.diffItems.forEach(item => {
    if (item.isDifferent) {
      selectedKeys.value.add(item.key)
    }
  })
  selectedKeys.value = new Set(selectedKeys.value)
  emitSelected()
}

// 清空选择
const clearSelection = () => {
  selectedKeys.value.clear()
  selectedKeys.value = new Set(selectedKeys.value)
  emitSelected()
}

// 发送选中事件
const emitSelected = () => {
  emit('update:selected', Array.from(selectedKeys.value))
}

// 获取分类差异数量 (Cached)
const categoryDiffCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const cat in groupedItems.value) {
    counts[cat] = groupedItems.value[cat as SettingCategory]?.filter(i => i.isDifferent).length || 0
  }
  return counts
})

// 初始化
initSelection()

// 暴露方法
defineExpose({
  getSelectedKeys: () => Array.from(selectedKeys.value),
  selectAllDiff,
  clearSelection
})
</script>

<template>
  <div class="settings-diff-viewer">
    <!-- 工具栏 -->
    <div class="toolbar">
      <span class="stats">
        已选 {{ selectedKeys.size }} / {{ diffItems.filter(i => i.isDifferent).length }} 项差异
      </span>
      <div class="actions">
        <button class="btn-text" @click="selectAllDiff">全选差异</button>
        <button class="btn-text" @click="clearSelection">清空</button>
      </div>
    </div>

    <!-- 分类列表 -->
    <div class="category-list">
      <template v-for="(items, category) in groupedItems" :key="category">
        <div
          v-if="items.length > 0"
          class="category-section"
          :class="{ expanded: expandedCategories.has(category as SettingCategory) }"
        >
          <!-- 分类标题 -->
          <div
            class="category-header"
            @click="toggleCategory(category as SettingCategory)"
          >
            <span class="expand-icon">
              {{ expandedCategories.has(category as SettingCategory) ? '▼' : '▶' }}
            </span>
            <span class="category-name">{{ CATEGORY_LABELS[category as SettingCategory] }}</span>
            <span
              v-if="(categoryDiffCounts[category as SettingCategory] || 0) > 0"
              class="diff-badge"
            >
              {{ categoryDiffCounts[category as SettingCategory] }} 项差异
            </span>
          </div>

          <!-- 设置项列表 -->
          <div
            v-show="expandedCategories.has(category as SettingCategory)"
            class="items-table"
          >
            <div
              v-for="item in items"
              :key="item.key"
              class="item-row"
              :class="{
                different: item.isDifferent,
                selected: selectedKeys.has(item.key)
              }"
            >
              <!-- 勾选框 -->
              <div class="cell checkbox">
                <input
                  type="checkbox"
                  :checked="selectedKeys.has(item.key)"
                  :disabled="!item.isDifferent"
                  @change="toggleItem(item.key)"
                />
              </div>

              <!-- 设置项名称 -->
              <div class="cell label">
                {{ item.label }}
              </div>

              <!-- 当前值 -->
              <div class="cell value local">
                {{ formatSettingValue(item.key, item.localValue) }}
              </div>

              <!-- 箭头 -->
              <div class="cell arrow">
                <span v-if="item.isDifferent">→</span>
              </div>

              <!-- 备份值 -->
              <div class="cell value backup" :class="{ highlight: item.isDifferent }">
                {{ formatSettingValue(item.key, item.backupValue) }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.settings-diff-viewer {
  font-size: 13px;
  max-height: 400px;
  overflow-y: auto;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--glass-bg-light, rgba(255, 255, 255, 0.05));
  border-radius: 8px;
  margin-bottom: 12px;
}

.stats {
  color: var(--text-secondary, #8a9199);
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn-text {
  background: none;
  border: none;
  color: var(--primary, #88c0d0);
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-text:hover {
  background: var(--glass-bg-light, rgba(255, 255, 255, 0.1));
}

/* 分类 */
.category-section {
  margin-bottom: 8px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--glass-bg-light, rgba(255, 255, 255, 0.03));
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.category-header:hover {
  background: var(--glass-bg-light, rgba(255, 255, 255, 0.05));
}

.expand-icon {
  font-size: 10px;
  color: var(--text-secondary, #8a9199);
  width: 12px;
}

.category-name {
  font-weight: 500;
  color: var(--text-primary, #eceff4);
}

.diff-badge {
  margin-left: auto;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--warning-bg, rgba(235, 203, 139, 0.15));
  color: var(--warning, #ebcb8b);
}

/* 表格 */
.items-table {
  padding: 0 8px 8px;
}

.item-row {
  display: grid;
  grid-template-columns: 28px 1fr 120px 24px 120px;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}

.item-row:hover {
  background: var(--glass-bg-light, rgba(255, 255, 255, 0.03));
}

.item-row.different {
  background: var(--glass-bg-light, rgba(255, 255, 255, 0.02));
}

.item-row.selected {
  background: var(--primary-bg, rgba(136, 192, 208, 0.1));
}

.cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell.checkbox {
  display: flex;
  justify-content: center;
}

.cell.checkbox input {
  cursor: pointer;
  accent-color: var(--primary, #88c0d0);
}

.cell.checkbox input:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.cell.label {
  color: var(--text-primary, #eceff4);
}

.cell.value {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
  text-align: center;
}

.cell.value.local {
  color: var(--text-secondary, #8a9199);
}

.cell.value.backup {
  color: var(--text-secondary, #8a9199);
}

.cell.value.backup.highlight {
  color: var(--success, #a3be8c);
  font-weight: 500;
}

.cell.arrow {
  text-align: center;
  color: var(--text-muted, #5e6770);
  font-size: 11px;
}

/* 滚动条 */
.settings-diff-viewer::-webkit-scrollbar {
  width: 6px;
}

.settings-diff-viewer::-webkit-scrollbar-track {
  background: transparent;
}

.settings-diff-viewer::-webkit-scrollbar-thumb {
  background: var(--glass-bg-light, rgba(255, 255, 255, 0.1));
  border-radius: 3px;
}
</style>
