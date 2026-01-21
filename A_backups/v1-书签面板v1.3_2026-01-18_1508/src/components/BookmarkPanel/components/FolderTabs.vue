<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { IconChevronDown } from '@tabler/icons-vue'
import SelectMenu from '@/components/SelectMenu/index.vue'
import type { SelectOption } from '@/components/SelectMenu/types'
import type { BookmarkFolder } from '../types'

const props = defineProps<{
  folders: BookmarkFolder[]
  allFolders: BookmarkFolder[]
  currentFolderId: string | null
  folderOrder: string[]
}>()

const emit = defineEmits<{
  (e: 'select', folderId: string | null): void
  (e: 'update:folderOrder', order: string[]): void
}>()

// 按用户自定义顺序排列文件夹
const sortedFolders = computed({
  get: () => {
    const order = props.folderOrder
    if (order.length === 0) return props.folders

    const orderMap = new Map(order.map((id, idx) => [id, idx]))
    return [...props.folders].sort((a, b) => {
      const aIdx = orderMap.get(a.id) ?? Infinity
      const bIdx = orderMap.get(b.id) ?? Infinity
      return aIdx - bIdx
    })
  },
  set: newFolders => {
    emit(
      'update:folderOrder',
      newFolders.map(f => f.id)
    )
  },
})

// 滚动容器引用
const scrollContainer = ref<HTMLElement | null>(null)
const showLeftFade = ref(false)
const showRightFade = ref(false)

const updateFadeVisibility = () => {
  const el = scrollContainer.value
  if (!el) return

  showLeftFade.value = el.scrollLeft > 10
  showRightFade.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 10
}

const handleSelect = (folderId: string | null) => {
  emit('select', folderId)
}

const handleDragEnd = () => {
  // 拖拽结束后，sortedFolders 的 setter 会自动触发 order 更新
}

// 检查文件夹是否有子文件夹 (通过查找 parentId 匹配)
const hasChildren = (folder: BookmarkFolder): boolean => {
  return props.allFolders.some(f => f.parentId === folder.id)
}

// 获取文件夹的子文件夹作为下拉选项
const getChildOptions = (folder: BookmarkFolder): SelectOption[] => {
  const children = props.allFolders.filter(f => f.parentId === folder.id)
  return children.map(child => ({
    value: child.id,
    label: child.title,
    // 递归添加子选项
    children: hasChildren(child) ? getChildOptions(child) : undefined,
  }))
}

// 处理下拉菜单选择
const handleDropdownSelect = (value: string) => {
  emit('select', value)
}

onMounted(() => {
  updateFadeVisibility()
  scrollContainer.value?.addEventListener('scroll', updateFadeVisibility)
  window.addEventListener('resize', updateFadeVisibility)
})

onUnmounted(() => {
  scrollContainer.value?.removeEventListener('scroll', updateFadeVisibility)
  window.removeEventListener('resize', updateFadeVisibility)
})

watch(() => props.folders, updateFadeVisibility, { flush: 'post' })
</script>

<template>
  <div class="folder-tabs-container">
    <!-- 全部按钮 -->
    <button
      class="folder-tab tab-all"
      :class="{ active: currentFolderId === null }"
      @click="handleSelect(null)"
    >
      全部
    </button>

    <!-- 可拖拽标签区域 -->
    <div class="tabs-scroll-wrapper">
      <div v-show="showLeftFade" class="fade-left" />

      <div ref="scrollContainer" class="tabs-scroll">
        <VueDraggable
          v-model="sortedFolders"
          class="tabs-list"
          :animation="200"
          ghost-class="tab-ghost"
          @end="handleDragEnd"
        >
          <template v-for="folder in sortedFolders" :key="folder.id">
            <!-- 有子文件夹：使用 SelectMenu with customTrigger (split button) -->
            <SelectMenu
              v-if="hasChildren(folder)"
              custom-trigger
              :model-value="''"
              :options="getChildOptions(folder)"
              trigger="hover"
              placement="bottomLeft"
              :hover-delay="100"
              :show-arrow="false"
              :dropdown-min-width="120"
              @update:model-value="handleDropdownSelect"
            >
              <template #trigger="{ isOpen, toggle, close }">
                <div
                  class="folder-tab split-tab"
                  :class="{ active: folder.id === currentFolderId, open: isOpen }"
                  :title="folder.title"
                >
                  <!-- 文本区域：点击进入文件夹 -->
                  <span
                    class="tab-text"
                    @click.stop="
                      () => {
                        close()
                        handleSelect(folder.id)
                      }
                    "
                  >
                    {{ folder.title }}
                  </span>
                  <!-- 图标区域：点击切换下拉 -->
                  <span class="tab-icon" @click.stop="toggle">
                    <IconChevronDown :size="14" :class="{ rotated: isOpen }" />
                  </span>
                </div>
              </template>
            </SelectMenu>

            <!-- 无子文件夹：普通按钮 -->
            <button
              v-else
              class="folder-tab"
              :class="{ active: folder.id === currentFolderId }"
              :title="folder.title"
              @click="handleSelect(folder.id)"
            >
              <span class="tab-label">{{ folder.title }}</span>
            </button>
          </template>
        </VueDraggable>
      </div>

      <div v-show="showRightFade" class="fade-right" />
    </div>
  </div>
</template>

<style scoped>
.folder-tabs-container {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  flex-shrink: 0;
}

.tabs-scroll-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
}

.tabs-scroll {
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tabs-scroll::-webkit-scrollbar {
  display: none;
}

.tabs-list {
  display: flex;
  gap: var(--space-2);
  padding: 2px 0;
}

.folder-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  background: var(--bg-input);
  color: var(--text-secondary);
  font-size: 13px;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
}

.folder-tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.folder-tab.active {
  background: var(--bg-active);
  color: var(--text-primary);
  font-weight: 500;
}

.tab-all {
  flex-shrink: 0;
}

.tab-label {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-arrow {
  font-size: 8px;
  color: var(--text-tertiary);
  flex-shrink: 0;
  transition: transform 0.15s;
}

.folder-tab:hover .tab-arrow {
  color: var(--text-secondary);
}

.tab-ghost {
  opacity: 0.5;
  background: var(--bg-active);
}

/* 渐隐效果 */
.fade-left,
.fade-right {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 24px;
  pointer-events: none;
  z-index: 1;
}

.fade-left {
  left: 0;
  background: linear-gradient(to right, var(--bg-panel), transparent);
}

.fade-right {
  right: 0;
  background: linear-gradient(to left, var(--bg-panel), transparent);
}

/* Split Button 样式 */
.split-tab {
  padding: 0;
  display: inline-flex;
  align-items: stretch;
}

.split-tab .tab-text {
  padding: 6px 8px 6px 12px;
  cursor: pointer;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.split-tab .tab-text:hover {
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-full) 0 0 var(--radius-full);
}

.split-tab .tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  margin: 4px 0;
  cursor: pointer;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-tertiary);
  transition: all 0.15s;
}

.split-tab .tab-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  border-radius: 0 var(--radius-full) var(--radius-full) 0;
}

.split-tab .tab-icon svg {
  transition: transform 0.2s;
}

.split-tab .tab-icon .rotated {
  transform: rotate(180deg);
}

.split-tab.open {
  background: var(--bg-hover);
}

.split-tab.open .tab-icon {
  color: var(--text-primary);
}
</style>
