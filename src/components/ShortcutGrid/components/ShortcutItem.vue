<script setup lang="ts">
import { computed } from 'vue'
import { IconPlus } from '@tabler/icons-vue'
import type { Shortcut } from '../../../types'
import { useSettings } from '../../../composables/useSettings'
import { useFolderIconSize } from '../composables/useFolderIconSize'

interface Props {
  item: Shortcut
  isDragTarget?: boolean
  isMergeTarget?: boolean
  previewChildren?: Shortcut[] | null // 🔑 新增：拖动过程中的实时预览数据
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: []
  contextmenu: [e: MouseEvent]
  openShortcut: [url?: string]
  'sub-contextmenu': [e: MouseEvent, item: Shortcut]
}>()

const { settings, iconConfig } = useSettings()
const { calculateModeVars, getCapacity } = useFolderIconSize(settings, iconConfig)

// 计算文件夹的 CSS 变量
const folderStyle = computed(() => {
  if (props.item.type !== 'folder') {
    return { '--brand-color': props.item.color || '#888' }
  }

  const mode = props.item.folderMode || settings.defaultFolderMode || settings.folderPreviewMode
  const vars = calculateModeVars(mode)

  // 1x8 扁平化适配
  if (settings.gridRows === 1) {
    const [, c] = mode.split('x').map(Number)
    vars['--f-rows'] = 1
    // 重新计算内部网格
    const flatVars = calculateModeVars(`1x${c}`)
    Object.assign(vars, flatVars)
    vars['--f-rows'] = 1
  }

  return {
    ...vars,
    '--brand-color': props.item.color || '#888',
  }
})

// 文件夹容量
const capacity = computed(() => {
  const mode = props.item.folderMode || settings.defaultFolderMode || settings.folderPreviewMode
  return getCapacity(mode)
})

// 优先使用预览数据，否则使用真实数据
const effectiveChildren = computed(() => {
  return props.previewChildren || props.item.children || []
})

// 是否需要嵌套预览（children 数量超过容量）
const needsNesting = computed(() => {
  return effectiveChildren.value.length > capacity.value
})

// 显示的普通图标
const visibleChildren = computed(() => {
  const children = effectiveChildren.value
  if (children.length === 0) return []
  if (needsNesting.value) {
    // 需要嵌套时：显示前 capacity-1 个，最后一个槽位留给嵌套预览
    return children.slice(0, capacity.value - 1)
  }
  // 不需要嵌套时：直接显示所有（最多 capacity 个）
  return children.slice(0, capacity.value)
})

// 嵌套预览的图标（第 capacity-1 到 capacity+2 个）
const nestedChildren = computed(() => {
  if (effectiveChildren.value.length === 0 || !needsNesting.value) return []
  return effectiveChildren.value.slice(capacity.value - 1, capacity.value + 3)
})

// 最后一个槽位的单独图标（仅当需要嵌套但嵌套图标不足时使用，通常不需要）
// 修复：当不需要嵌套时返回 null，因为 visibleChildren 已包含所有图标
const lastChild = computed(() => {
  // 不需要嵌套时，不单独渲染最后一个（visibleChildren 已包含）
  if (!needsNesting.value) return null
  if (effectiveChildren.value.length === 0) return null
  return effectiveChildren.value[capacity.value - 1] || null
})

const getIconSrc = (item: Shortcut) => {
  if (item.iconBase64) return item.iconBase64
  if (!item.url) return ''
  try {
    return `https://icons.bitwarden.net/${new URL(item.url).hostname}/icon.png`
  } catch {
    return ''
  }
}

const handleImageLoad = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.opacity = '1'
  const fb = img.nextElementSibling as HTMLElement
  if (fb) fb.style.opacity = '0'
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  img.style.opacity = '0'
  const fb = img.nextElementSibling as HTMLElement
  if (fb) fb.style.opacity = '1'
}

const handleClick = () => {
  emit('click')
}

const handleContextMenu = (e: MouseEvent) => {
  emit('contextmenu', e)
}

const handleSubItemClick = (e: Event, url?: string) => {
  e.stopPropagation()
  emit('openShortcut', url)
}
</script>

<template>
  <div
    class="shortcut-item"
    :class="{ 'is-folder': item.type === 'folder' }"
    :style="folderStyle"
    :data-id="item.id"
    :data-type="item.type"
    @contextmenu.stop="handleContextMenu"
    @click="handleClick"
  >
    <!-- 应用类型 -->
    <div
      v-if="item.type === 'app'"
      class="icon-box"
      :class="{ filled: item.filled, inverted: item.inverted, 'is-merge-target': isMergeTarget }"
    >
      <img
        :src="getIconSrc(item)"
        class="shortcut-icon"
        alt=""
        @load="handleImageLoad"
        @error="handleImageError"
      />
      <div class="shortcut-fallback">{{ item.name.charAt(0).toUpperCase() }}</div>
    </div>

    <!-- 文件夹类型 -->
    <div
      v-else-if="item.type === 'folder'"
      class="folder-box"
      :class="{ 'is-drag-target': isDragTarget }"
    >
      <div v-if="effectiveChildren.length > 0" class="folder-grid">
        <!-- 普通槽位 -->
        <div
          v-for="subItem in visibleChildren"
          :key="subItem.id"
          class="mini-app"
          @click="handleSubItemClick($event, subItem.url)"
          @contextmenu.prevent.stop="emit('sub-contextmenu', $event, subItem)"
        >
          <div class="mini-icon-wrapper" :style="subItem.color ? { backgroundColor: subItem.color } : {}">
            <img
              :src="getIconSrc(subItem)"
              class="mini-icon-img"
              @error="e => ((e.target as HTMLElement).style.display = 'none')"
            />
          </div>
        </div>

        <!-- 最后槽位：嵌套预览或普通图标 -->
        <div v-if="needsNesting" class="mini-app nested-slot" @click.stop>
          <div class="nested-preview">
            <div
              v-for="n in nestedChildren"
              :key="n.id"
              class="nested-dot"
            >
              <img :src="getIconSrc(n)" class="nested-icon-img" />
            </div>
          </div>
        </div>
        <div
          v-else-if="lastChild"
          class="mini-app"
          @click="handleSubItemClick($event, lastChild.url)"
          @contextmenu.prevent.stop="emit('sub-contextmenu', $event, lastChild)"
        >
          <div class="mini-icon-wrapper" :style="lastChild.color ? { backgroundColor: lastChild.color } : {}">
            <img
              :src="getIconSrc(lastChild)"
              class="mini-icon-img"
              @error="e => ((e.target as HTMLElement).style.display = 'none')"
            />
          </div>
        </div>
      </div>
      <div v-else class="empty-folder-grid">
        <span v-for="n in capacity" :key="n" class="dot"></span>
      </div>
      <transition name="fade">
        <div v-if="isDragTarget" class="folder-hover-overlay">
          <IconPlus :size="32" color="#fff" stroke-width="3" />
        </div>
      </transition>
    </div>

    <span class="shortcut-name">{{ item.name }}</span>
  </div>
</template>

<style scoped src="../styles/index.css"></style>

<style scoped>
/* 递归嵌套预览样式 */
.nested-preview {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template: repeat(2, 1fr) / repeat(2, 1fr);
  gap: 4px;
  padding: 4px;
  background: transparent;
  border-radius: calc(var(--f-icon-size, 40px) * 0.2);
  overflow: hidden;
}

.nested-dot {
  border-radius: 22.5%;
  overflow: hidden;
  background: #fff;
}

.nested-dot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nested-icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nested-slot {
  cursor: default;
}

/* 空文件夹网格 */
.empty-folder-grid {
  width: 60%;
  height: 60%;
  display: grid;
  grid-template-rows: repeat(var(--f-inner-rows, 2), 1fr);
  grid-template-columns: repeat(var(--f-inner-cols, 2), 1fr);
  gap: 6px;
  opacity: 0.3;
  align-items: center;
  justify-items: center;
}
</style>
