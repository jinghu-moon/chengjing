<template>
  <div
    class="cj-header"
    :data-title-position="titlePosition"
    :data-trigger="triggerArea"
    @click="$emit('header-click', $event)"
  >
    <!-- 前缀插槽（Collapse 折叠箭头注入点） -->
    <slot name="prefix" />

    <!-- 图标 -->
    <div v-if="icon || $slots.icon" class="cj-header__icon">
      <slot name="icon">
        <component :is="icon" v-if="icon" />
      </slot>
    </div>

    <!-- 标题容器 -->
    <div class="cj-header__title-wrapper" @click="$emit('title-click', $event)">
      <span v-if="title" class="cj-header__title">{{ title }}</span>
      <span
        v-if="badge != null"
        class="cj-header__badge"
        :class="`cj-header__badge--${badgeType}`"
      >
        {{ badge }}
      </span>
      <slot name="header" />
    </div>

    <!-- 右侧操作按钮 -->
    <div v-if="$slots.actions" class="cj-header__actions" @click.stop>
      <slot name="actions" />
    </div>

    <!-- 额外右侧内容（Collapse 的 switch 等） -->
    <slot name="suffix" />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { BadgeType, CollapseTriggerArea } from './types'

withDefaults(defineProps<{
  title?: string
  titlePosition?: 'left' | 'center' | 'right'
  icon?: Component
  badge?: string | number
  badgeType?: BadgeType
  triggerArea?: CollapseTriggerArea
}>(), {
  title: undefined,
  titlePosition: 'left',
  icon: undefined,
  badge: undefined,
  badgeType: 'primary',
  triggerArea: undefined,
})

defineEmits<{
  'header-click': [event: MouseEvent]
  'title-click': [event: MouseEvent]
}>()
</script>
