<script setup lang="ts">
import { computed } from 'vue'
import { IconHome, IconChevronRight, IconDots } from '@tabler/icons-vue'
import SelectMenu from '@/components/SelectMenu/index.vue'
import type { SelectOption } from '@/components/SelectMenu/types'

interface BreadcrumbItem {
  id: string
  title: string
}

const props = defineProps<{
  path: BreadcrumbItem[]
}>()

const emit = defineEmits<{
  (e: 'navigate', folderId: string | null): void
}>()

// Configuration
const MAX_VISIBLE_ITEMS = 5

const structure = computed(() => {
  const total = props.path.length

  if (total <= MAX_VISIBLE_ITEMS) {
    return {
      start: props.path,
      collapsed: [],
      end: [],
    }
  }

  // Logic: Keep first 2, Keep last 2, Collapse middle
  // Example: 1 > 2 > ... > 6 > 7 > 8 (Wait, user showed 2 start, 3 end?)
  // Let's stick to 2 start, 2 end for symmetry, flexible.

  const startCount = 2
  const endCount = 2

  return {
    start: props.path.slice(0, startCount),
    collapsed: props.path.slice(startCount, total - endCount),
    end: props.path.slice(total - endCount),
  }
})

const collapsedOptions = computed<SelectOption[]>(() => {
  return structure.value.collapsed.map(item => ({
    label: item.title,
    value: item.id,
  }))
})

const handleNavigate = (folderId: string | null) => {
  emit('navigate', folderId)
}

const handleCollapsedSelect = (value: string) => {
  handleNavigate(value)
}
</script>

<template>
  <nav class="breadcrumb">
    <button class="crumb crumb-home" title="返回根目录" @click="handleNavigate(null)">
      <IconHome :size="14" />
    </button>

    <!-- Start Items -->
    <template v-for="(item, idx) in structure.start" :key="item.id">
      <IconChevronRight :size="12" class="separator" />
      <button
        class="crumb"
        :class="{
          'crumb-current': structure.collapsed.length === 0 && idx === structure.start.length - 1,
        }"
        :title="item.title"
        @click="handleNavigate(item.id)"
      >
        {{ item.title }}
      </button>
    </template>

    <!-- Collapsed Ellipsis -->
    <template v-if="structure.collapsed.length > 0">
      <IconChevronRight :size="12" class="separator" />

      <SelectMenu
        :options="collapsedOptions"
        model-value=""
        trigger="click"
        placement="bottomLeft"
        custom-trigger
        :trigger-width="'auto'"
        class="breadcrumb-menu"
        @change="handleCollapsedSelect"
      >
        <template #trigger="{ toggle }">
          <button class="crumb crumb-dots" title="更多文件夹" @click="toggle">
            <IconDots :size="14" />
          </button>
        </template>
      </SelectMenu>
    </template>

    <!-- End Items -->
    <template v-for="(item, idx) in structure.end" :key="item.id">
      <IconChevronRight :size="12" class="separator" />
      <button
        class="crumb"
        :class="{ 'crumb-current': idx === structure.end.length - 1 }"
        :title="item.title"
        @click="handleNavigate(item.id)"
      >
        {{ item.title }}
      </button>
    </template>
  </nav>
</template>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 2px;
  /* Tighter gap */
  padding: 0 4px;
  /* Adjust padding as needed */
  min-height: 24px;
  flex-shrink: 0;
  flex-wrap: nowrap;
  /* Prevent wrapping */
  overflow: hidden;
  /* Safety */
}

.crumb {
  display: flex;
  align-items: center;
  padding: 2px 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  /* Smaller font */
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  max-width: 100px;
  /* Limit width */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.crumb:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.crumb-home {
  padding: 4px;
  color: var(--text-tertiary);
}

.crumb-dots {
  padding: 2px 4px;
  color: var(--text-tertiary);
}

.crumb-dots:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.crumb-current {
  color: var(--text-primary);
  font-weight: 500;
  pointer-events: none;
}

.separator {
  color: var(--text-tertiary);
  opacity: 0.6;
  flex-shrink: 0;
}

/* Override SelectMenu styles if needed */
.breadcrumb-menu {
  display: flex;
  align-items: center;
}
</style>
