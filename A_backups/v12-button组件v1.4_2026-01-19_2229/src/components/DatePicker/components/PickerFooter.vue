<script setup lang="ts">
import { IconCalendarEvent } from '@tabler/icons-vue'

defineEmits<{
  goToToday: []
  setToday: []
  clear: []
  apply: []
}>()
</script>

<template>
  <div class="picker-footer">
    <button class="footer-btn goto-today-btn" title="跳转到今天" @click="$emit('goToToday')">
      <IconCalendarEvent :size="14" />
    </button>
    <button class="footer-btn today-btn" @click="$emit('setToday')">今天</button>
    <button class="footer-btn clear-btn" @click="$emit('clear')">清除</button>
    <button class="footer-btn apply-btn" @click="$emit('apply')">确定</button>
  </div>
</template>

<style scoped>
.picker-footer {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
  align-items: center;
}

.footer-btn {
  padding: var(--space-1) var(--space-3);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--font-family-base);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.goto-today-btn {
  background: var(--bg-hover);
  color: var(--text-primary);
  padding: var(--space-1);
  width: 28px;
  height: 28px;
  justify-content: center;
  margin-right: auto;
}

.goto-today-btn:hover {
  background: var(--bg-active);
  color: var(--color-primary);
}

.today-btn {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.today-btn:hover {
  background: var(--bg-active);
}

.clear-btn {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.clear-btn:hover {
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.apply-btn {
  background: var(--color-primary);
  color: #fff;
}

.apply-btn:hover {
  opacity: 0.8;
}
</style>
