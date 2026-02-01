<script setup lang="ts">
/**
 * 导出选择器组件
 * 用于选择性导出配置项
 */
import { ref, computed, inject } from 'vue'
import { SETTINGS_CATEGORIES, ICON_CATEGORY } from '../constants/settings-categories'
import { SETTINGS_LABELS, ICON_LABELS } from 'virtual:settings-labels'
import { IconChevronDown } from '@tabler/icons-vue'

// 从 Dialog 注入的关闭方法
const dialogClose = inject<(result?: any) => void>('dialogClose')

// Props
const props = defineProps<{
  settings: Record<string, any>
  iconConfig: Record<string, any>
  onConfirm?: (data: { settings: Record<string, any>; iconConfig: Record<string, any> }) => void
}>()

// 选中的键
const selectedSettings = ref<Set<string>>(new Set())
const selectedIcons = ref<Set<string>>(new Set())

// 展开的分类
const expandedCategories = ref<Set<string>>(new Set(['layout', 'wallpaper']))

// 切换分类展开
function toggleCategory(key: string) {
  if (expandedCategories.value.has(key)) {
    expandedCategories.value.delete(key)
  } else {
    expandedCategories.value.add(key)
  }
}

// 切换单个配置项
function toggleSetting(key: string) {
  if (selectedSettings.value.has(key)) {
    selectedSettings.value.delete(key)
  } else {
    selectedSettings.value.add(key)
  }
}

function toggleIcon(key: string) {
  if (selectedIcons.value.has(key)) {
    selectedIcons.value.delete(key)
  } else {
    selectedIcons.value.add(key)
  }
}

// 切换整个分类
function toggleCategoryAll(categoryKey: string) {
  const category = SETTINGS_CATEGORIES[categoryKey]
  if (!category) return

  const allSelected = category.keys.every(k => selectedSettings.value.has(k))
  if (allSelected) {
    category.keys.forEach(k => selectedSettings.value.delete(k))
  } else {
    category.keys.forEach(k => selectedSettings.value.add(k))
  }
}

function toggleIconAll() {
  const allSelected = ICON_CATEGORY.keys.every(k => selectedIcons.value.has(k))
  if (allSelected) {
    ICON_CATEGORY.keys.forEach(k => selectedIcons.value.delete(k))
  } else {
    ICON_CATEGORY.keys.forEach(k => selectedIcons.value.add(k))
  }
}

// 分类选中状态
function getCategoryState(categoryKey: string): 'none' | 'partial' | 'all' {
  const category = SETTINGS_CATEGORIES[categoryKey]
  if (!category) return 'none'

  const selectedCount = category.keys.filter(k => selectedSettings.value.has(k)).length
  if (selectedCount === 0) return 'none'
  if (selectedCount === category.keys.length) return 'all'
  return 'partial'
}

function getIconState(): 'none' | 'partial' | 'all' {
  const selectedCount = ICON_CATEGORY.keys.filter(k => selectedIcons.value.has(k)).length
  if (selectedCount === 0) return 'none'
  if (selectedCount === ICON_CATEGORY.keys.length) return 'all'
  return 'partial'
}

// 统计
const totalSelected = computed(() => selectedSettings.value.size + selectedIcons.value.size)

// 全选/清空
function selectAll() {
  Object.values(SETTINGS_CATEGORIES).forEach(c => {
    c.keys.forEach(k => selectedSettings.value.add(k))
  })
  ICON_CATEGORY.keys.forEach(k => selectedIcons.value.add(k))
}

function clearAll() {
  selectedSettings.value.clear()
  selectedIcons.value.clear()
}

// 确认导出
function confirmExport() {
  const result = {
    settings: Object.fromEntries(
      Array.from(selectedSettings.value).map(k => [k, props.settings[k]])
    ),
    iconConfig: Object.fromEntries(
      Array.from(selectedIcons.value).map(k => [k, props.iconConfig[k]])
    )
  }

  // 调用回调
  props.onConfirm?.(result)

  // 关闭对话框
  dialogClose?.(result)
}

// 暴露给 Dialog
defineExpose({ confirmExport })
</script>

<template>
  <div class="export-selector">
    <!-- 快捷操作 -->
    <div class="quick-actions">
      <button class="action-btn" @click="selectAll">全选</button>
      <button class="action-btn" @click="clearAll">清空</button>
      <span class="selected-count">已选: {{ totalSelected }} 项</span>
    </div>

    <!-- 分类列表 -->
    <div class="category-list">
      <!-- Settings 分类 -->
      <div
        v-for="(category, key) in SETTINGS_CATEGORIES"
        :key="key"
        class="category-item"
      >
        <div class="category-header" @click="toggleCategory(key)">
          <label class="checkbox-wrapper" @click.stop>
            <input
              type="checkbox"
              :checked="getCategoryState(key) === 'all'"
              :indeterminate="getCategoryState(key) === 'partial'"
              @change="toggleCategoryAll(key)"
            >
            <span class="category-label">{{ category.label }}</span>
            <span class="category-count">({{ category.keys.length }})</span>
          </label>
          <IconChevronDown
            :size="16"
            class="expand-icon"
            :class="{ expanded: expandedCategories.has(key) }"
          />
        </div>

        <!-- 展开的配置项 -->
        <div v-if="expandedCategories.has(key)" class="category-items">
          <label
            v-for="itemKey in category.keys"
            :key="itemKey"
            class="item-row"
          >
            <input
              type="checkbox"
              :checked="selectedSettings.has(itemKey)"
              @change="toggleSetting(itemKey)"
            >
            <span class="item-label">{{ SETTINGS_LABELS[itemKey] || itemKey }}</span>
          </label>
        </div>
      </div>

      <!-- 图标配置分类 -->
      <div class="category-item">
        <div class="category-header" @click="toggleCategory('icon')">
          <label class="checkbox-wrapper" @click.stop>
            <input
              type="checkbox"
              :checked="getIconState() === 'all'"
              :indeterminate="getIconState() === 'partial'"
              @change="toggleIconAll"
            >
            <span class="category-label">{{ ICON_CATEGORY.label }}</span>
            <span class="category-count">({{ ICON_CATEGORY.keys.length }})</span>
          </label>
          <IconChevronDown
            :size="16"
            class="expand-icon"
            :class="{ expanded: expandedCategories.has('icon') }"
          />
        </div>

        <div v-if="expandedCategories.has('icon')" class="category-items">
          <label
            v-for="itemKey in ICON_CATEGORY.keys"
            :key="itemKey"
            class="item-row"
          >
            <input
              type="checkbox"
              :checked="selectedIcons.has(itemKey)"
              @change="toggleIcon(itemKey)"
            >
            <span class="item-label">{{ ICON_LABELS[itemKey] || itemKey }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.export-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.action-btn {
  padding: 4px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bg-hover-card);
  color: var(--text-primary);
}

.selected-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 分类列表 */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 360px;
  overflow-y: auto;
  overflow-x: hidden;
  /* 防止在 Flex 容器中被意外压缩 */
  min-height: 0; 
  /* 增加底部内边距，防止滚动到底部时太贴边 */
  padding-bottom: 8px; 
}

.category-item {
  background: var(--bg-input);
  border-radius: 6px;
  overflow: hidden;
  /* 关键修复：防止列表项被挤压 */
  flex-shrink: 0; 
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
  user-select: none;
}

.category-header:hover {
  background: var(--bg-hover-card);
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.category-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.category-count {
  font-size: 12px;
  color: var(--text-tertiary);
}

.expand-icon {
  color: var(--text-tertiary);
  transition: transform 0.2s;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

/* 配置项列表 */
.category-items {
  display: flex;
  flex-direction: column;
  padding: 4px 12px 8px 32px;
  background: var(--bg-panel);
}

.item-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0; /* 略微增加点击区域高度 */
  cursor: pointer;
  user-select: none;
}

.item-row:hover .item-label {
  color: var(--text-primary);
}

.item-label {
  font-size: 12px;
  color: var(--text-secondary);
  transition: color 0.2s;
}

/* Custom Checkbox Style */
input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid var(--text-tertiary);
  border-radius: 4px;
  background-color: transparent;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

input[type="checkbox"]:hover {
  border-color: var(--color-primary);
  background-color: var(--bg-hover-card);
}

input[type="checkbox"]:checked {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

input[type="checkbox"]:checked::after {
  content: '';
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-top: -2px;
}

/* Indeterminate state */
input[type="checkbox"]:indeterminate {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

input[type="checkbox"]:indeterminate::after {
  content: '';
  width: 8px;
  height: 2px;
  background-color: white;
  border-radius: 1px;
}
</style>
