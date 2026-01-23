<script setup lang="ts">
/**
 * NotePadTrigger.vue
 * 便签图标触发器 - 点击打开迷你便签
 */
import { computed } from 'vue'
import { IconNotes } from '@tabler/icons-vue'
// [自动导入] useSettings 无需显式导入

const { settings } = useSettings()

defineEmits<{
  (e: 'open'): void
}>()

defineProps<{
  visible: boolean
}>()

// 计算图标位置：紧跟在 TodoList 后面
const triggerStyle = computed(() => ({
  left: `calc(32px + ${settings.todoWidth}px + 12px)`,
  bottom: '39px',
}))
</script>

<template>
  <Transition name="scale-fade">
    <div
      v-if="visible"
      class="note-trigger"
      :style="triggerStyle"
      title="打开便签"
      @click="$emit('open')"
    >
      <IconNotes size="20" />
    </div>
  </Transition>
</template>

<style scoped>
.note-trigger {
  position: fixed;
  z-index: var(--z-panel);
  width: 42px;
  height: 42px;
  background: var(--bg-panel);
  border: var(--border-glass);
  border-radius: 50%;
  box-shadow: var(--shadow-md);
  backdrop-filter: var(--glass-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.note-trigger:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
  transform: scale(1.05);
}

/* 图标缩放动画 */
.scale-fade-enter-active {
  transition: all 0.3s var(--ease-elastic);
}

.scale-fade-leave-active {
  transition: all 0.15s ease-out;
}

.scale-fade-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
