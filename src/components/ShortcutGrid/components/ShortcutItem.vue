<script setup lang="ts">
import { IconPlus } from '@tabler/icons-vue'
import type { Shortcut } from '../../../types'

interface Props {
  item: Shortcut
  isDragTarget?: boolean
  folderGridClass: string
  folderCapacity: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: []
  contextmenu: [e: MouseEvent]
  openShortcut: [url?: string]
}>()

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
    :class="[
      { 'is-folder': item.type === 'folder' },
      item.type === 'folder' ? folderGridClass : '',
    ]"
    :style="{ '--brand-color': item.color || '#888' }"
    :data-id="item.id"
    :data-type="item.type"
    @contextmenu.stop="handleContextMenu"
    @click="handleClick"
  >
    <!-- 应用类型 -->
    <div
      v-if="item.type === 'app'"
      class="icon-box"
      :class="{ filled: item.filled, inverted: item.inverted }"
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
      <div
        v-if="item.children && item.children.length > 0"
        class="folder-grid"
        :class="folderGridClass"
      >
        <div
          v-for="subItem in item.children.slice(0, folderCapacity)"
          :key="subItem.id"
          class="mini-app"
          @click="handleSubItemClick($event, subItem.url)"
        >
          <div class="mini-icon-wrapper" :style="{ backgroundColor: subItem.color || '#ddd' }">
            <img
              :src="getIconSrc(subItem)"
              class="mini-icon-img"
              @error="e => ((e.target as HTMLElement).style.display = 'none')"
            />
          </div>
        </div>
      </div>
      <div v-else class="empty-folder-grid" :class="folderGridClass">
        <span v-for="n in folderCapacity" :key="n" class="dot"></span>
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
