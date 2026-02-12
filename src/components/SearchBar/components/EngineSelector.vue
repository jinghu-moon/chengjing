<script setup lang="ts">
/**
 * EngineSelector - 搜索引擎选择器
 * 职责：引擎下拉菜单（SelectMenu）+ 触发器图标 + 管理入口 + 拖拽排序
 */
import { computed } from 'vue'
import { defineAsyncComponent } from 'vue'
import {
  IconBrandGoogle,
  IconPaw,
  IconBrandBing,
  IconBrandBilibili,
  IconSettings,
  IconWorld,
  IconBrandYoutube,
  IconBrandTiktok,
  IconBrandTwitch,
  IconBrandAmazon,
  IconBrandGithub,
  IconBrandStackoverflow,
  IconBrandReddit,
  IconBrandWikipedia,
  IconBrandOpenai,
} from '@tabler/icons-vue'
import { useSettings } from '../../../composables/useSettings'
import { SelectMenu, type OptionItem } from '../../SelectMenu'
import { useDialog } from '../../Dialog'
import { useEngines, GROUP_LABELS } from '../composables/useEngines'
import { useDragSort } from '../composables/useDragSort'

// EngineManager 懒加载（仅在点击"管理搜索引擎"时加载）
const EngineManager = defineAsyncComponent(() => import('./EngineManager.vue'))

const props = defineProps<{
  /** 触发器按钮尺寸样式 */
  triggerStyle: Record<string, string>
}>()

const { settings } = useSettings()
const {
  engines,
  currentEngine,
  selectEngine,
  checkedEngineIds,
  toggleCheck,
  toggleGroupCheck,
  groupOrder,
  moveEngine,
  reorderGroup,
} = useEngines()
const dialog = useDialog()

// ==================== 图标映射 ====================
const ICON_MAP: Record<string, any> = {
  IconBrandGoogle,
  IconPaw,
  IconBrandBing,
  IconBrandBilibili,
  IconBrandYoutube,
  IconBrandTiktok,
  IconBrandTwitch,
  IconBrandAmazon,
  IconBrandGithub,
  IconBrandStackoverflow,
  IconBrandReddit,
  IconBrandWikipedia,
  IconBrandOpenai,
}

function resolveIcon(iconName: string) {
  return ICON_MAP[iconName] ?? IconWorld
}

// ==================== 引擎选项 ====================
const engineOptions = computed<OptionItem[]>(() => {
  const grouped = new Map<string, import('../types').Engine[]>()
  for (const e of engines.value) {
    const g = e.group ?? 'uncategorized'
    if (!grouped.has(g)) grouped.set(g, [])
    grouped.get(g)!.push(e)
  }

  const result: OptionItem[] = []
  const sortedGroups = Array.from(grouped.keys()).sort((a, b) => {
    return groupOrder.value.indexOf(a) - groupOrder.value.indexOf(b)
  })

  for (const group of sortedGroups) {
    const items = grouped.get(group)!
    const allChecked = items.every(e => checkedEngineIds.value.has(e.id))

    result.push({
      value: 'divider',
      label: GROUP_LABELS[group] ?? group,
      type: 'checkbox',
      checked: allChecked,
      actionValue: `group:${group}`,
      dragData: { type: 'group', id: group, group },
    })

    for (const e of items) {
      result.push({
        value: e.id,
        label: e.name,
        prefixIcon: resolveIcon(e.icon),
        type: 'checkbox',
        checked: checkedEngineIds.value.has(e.id),
        dragData: { type: 'engine', id: e.id, group },
      })
    }
  }

  return result
})

// ==================== 事件处理 ====================
const handleEngineChange = (value: string) => {
  selectEngine(value)
}

const handleGroupCheck = (value: string) => {
  if (value.startsWith('group:')) {
    toggleGroupCheck(value.slice(6))
  }
}

const handleItemCheck = (value: string) => {
  toggleCheck(value)
}

// ==================== 拖拽排序 ====================
const { handlePointerDown } = useDragSort({
  onMoveEngine: moveEngine,
  onReorderGroup: reorderGroup,
})

const handleDragPointerDown = (event: PointerEvent, el: HTMLElement) => {
  const type = el.dataset.dragType as 'engine' | 'group'
  const id = el.dataset.dragId
  const group = el.dataset.dragGroup
  if (!type || !id || !group) return

  const scrollContainer = el.closest('.dropdown-scroll') as HTMLElement
  if (!scrollContainer) return

  handlePointerDown(event, { type, id, group }, el, scrollContainer)
}

const openEngineManager = () => {
  dialog.open({
    component: EngineManager,
    title: '搜索引擎管理',
    width: 500,
    showConfirmBtn: false,
    showCancelBtn: false,
    closable: true,
  })
}
</script>

<template>
  <SelectMenu
    :model-value="currentEngine.id"
    :options="engineOptions"
    custom-trigger
    layout="grid"
    dropdown-min-width="320"
    placement="bottomLeft"
    :show-arrow="false"
    :show-grid-label="settings.searchBarShowEngineTitle"
    draggable
    @change="handleEngineChange"
    @header-click="handleGroupCheck"
    @check-item="handleItemCheck"
    @drag-pointer-down="handleDragPointerDown"
  >
    <template #trigger="{ toggle }">
      <div class="engine-trigger left" :style="triggerStyle" @click.stop="toggle">
        <component :is="resolveIcon(currentEngine.icon)" :size="24" :stroke-width="1.5" />
      </div>
    </template>
    <template #footer="{ close }">
      <div class="engine-manage-btn" @click="() => { openEngineManager(); close() }">
        <IconSettings :size="14" :stroke-width="1.5" />
        <span>管理搜索引擎</span>
      </div>
    </template>
  </SelectMenu>
</template>

<style scoped>
/* ==================== 引擎触发器 ==================== */
.engine-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.engine-trigger.left {
  margin-right: 4px;
}

.engine-trigger:hover {
  background: var(--mask-light);
  color: var(--text-primary);
  transform: scale(1.05);
}

.engine-trigger:active {
  transform: scale(0.95);
}

/* ==================== 引擎管理入口 ==================== */
.engine-manage-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-xs);
  transition: all 0.15s;
  justify-content: center;
}

.engine-manage-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.engine-manage-btn:active {
  transform: scale(0.97);
}
</style>
