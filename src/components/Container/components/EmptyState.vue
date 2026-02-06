<template>
  <div class="cj-empty-state" :class="`cj-empty-state--${size}`">
    <!-- 图标 -->
    <div v-if="icon || $slots.icon" class="cj-empty-state__icon">
      <slot name="icon">
        <component :is="icon" />
      </slot>
    </div>

    <!-- 标题 -->
    <div v-if="title" class="cj-empty-state__title">{{ title }}</div>

    <!-- 描述 -->
    <div v-if="description || $slots.default" class="cj-empty-state__description">
      <slot>{{ description }}</slot>
    </div>

    <!-- 操作按钮 -->
    <div v-if="$slots.action" class="cj-empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(defineProps<{
  icon?: Component
  title?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
}>(), {
  icon: undefined,
  title: undefined,
  description: undefined,
  size: 'md',
})
</script>

<style scoped>
.cj-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-8);
  gap: var(--space-3);
}

/* =========================================
   Icon
   ========================================= */
.cj-empty-state__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  opacity: 0.6;
}

/* =========================================
   Title
   ========================================= */
.cj-empty-state__title {
  font-weight: var(--weight-semibold);
  color: var(--text-secondary);
}

/* =========================================
   Description
   ========================================= */
.cj-empty-state__description {
  color: var(--text-tertiary);
  max-width: 280px;
  line-height: var(--line-relaxed);
}

/* =========================================
   Action
   ========================================= */
.cj-empty-state__action {
  margin-top: var(--space-2);
}

/* =========================================
   Size Variants
   ========================================= */
.cj-empty-state--sm {
  padding: var(--space-6);
  gap: var(--space-2);
}

.cj-empty-state--sm .cj-empty-state__icon {
  font-size: 28px;
}

.cj-empty-state--sm .cj-empty-state__title {
  font-size: var(--text-sm);
}

.cj-empty-state--sm .cj-empty-state__description {
  font-size: var(--text-xs);
}

.cj-empty-state--md .cj-empty-state__icon {
  font-size: 40px;
}

.cj-empty-state--md .cj-empty-state__title {
  font-size: var(--text-base);
}

.cj-empty-state--md .cj-empty-state__description {
  font-size: var(--text-sm);
}

.cj-empty-state--lg {
  padding: var(--space-12);
  gap: var(--space-4);
}

.cj-empty-state--lg .cj-empty-state__icon {
  font-size: 56px;
}

.cj-empty-state--lg .cj-empty-state__title {
  font-size: var(--text-lg);
}

.cj-empty-state--lg .cj-empty-state__description {
  font-size: var(--text-base);
  max-width: 360px;
}
</style>
