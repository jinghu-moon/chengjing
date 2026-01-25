<script setup lang="ts">
import { inject, computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { IconPlus } from '@tabler/icons-vue'
import ShortcutItem from './ShortcutItem.vue'
import type { Shortcut } from '@/types'
import { GridStateKey } from '../keys' 

const props = defineProps<{
  modelValue: Shortcut[] 
  pageIndex: number
  isLastPage: boolean
  draggableGroup: any
  onMoveCallback: (evt: any) => boolean
  onStart: (evt: any) => void
  onEnd: () => void
  onAddClick: () => void 
}>()

const emit = defineEmits(['update:modelValue'])

const pageData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const gridState = inject(GridStateKey)!
</script>

<template>
  <div class="grid-page">
    <VueDraggable
      v-model="pageData"
      :group="props.draggableGroup"
      :animation="300"
      :force-fallback="true"
      :fallback-tolerance="3"
      ghost-class="shortcut-ghost"
      chosen-class="shortcut-chosen"
      drag-class="shortcut-drag"
      :move="props.onMoveCallback"
      class="page-inner-grid"
      item-key="id"
      @start="props.onStart"
      @end="props.onEnd"
    >
      <ShortcutItem
        v-for="item in pageData"
        :key="item.id"
        :item="item"
        :is-drag-target="String(gridState.dragTargetFolderId.value) === String(item.id)"
        :is-merge-target="String(gridState.mergeTargetId.value) === String(item.id)"
        :preview-children="String(gridState.previewFolderId.value) === String(item.id) ? gridState.previewChildren.value : null"
        @click="item.type === 'app' ? gridState.openShortcut(item.url) : gridState.openFolder(item)"
        @contextmenu="gridState.showContextMenu($event, item)"
        @sub-contextmenu="gridState.showContextMenu"
        @open-shortcut="gridState.openShortcut"
      />
      
      <div
        v-if="isLastPage"
        class="shortcut-item add-btn-group"
        @click="props.onAddClick"
      >
        <div class="icon-box dashed">
          <IconPlus :size="28" stroke-width="1.5" />
        </div>
        <span class="shortcut-name">添加</span>
      </div>
    </VueDraggable>
  </div>
</template>

<style scoped src="../styles/index.css"></style>
