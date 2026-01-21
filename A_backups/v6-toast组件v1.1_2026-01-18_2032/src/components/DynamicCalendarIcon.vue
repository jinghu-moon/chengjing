<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    size?: number
    date?: number // 可选：自定义日期，默认使用当天
  }>(),
  {
    size: 24,
  }
)

// Tabler 官方 0-9 数字路径
const DIGIT_PATHS: Record<string, string[]> = {
  '0': ['M10 10v4a2 2 0 1 0 4 0v-4a2 2 0 1 0 -4 0'],
  '1': ['M11 8h1v8'],
  '2': ['M10 8h3a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 0 -1 1v2a1 1 0 0 0 1 1h3'],
  '3': [
    'M10 8h2.5a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1 -1.5 1.5h-1.5h1.5a1.5 1.5 0 0 1 1.5 1.5v1a1.5 1.5 0 0 1 -1.5 1.5h-2.5',
  ],
  '4': ['M10 8v3a1 1 0 0 0 1 1h3', 'M14 8v8'],
  '5': ['M10 15a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1v-2a1 1 0 0 0 -1 -1h-3v-4h4'],
  '6': [
    'M14 9a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1v-2a1 1 0 0 0 -1 -1h-3',
  ],
  '7': ['M10 8h4l-2 8'],
  '8': [
    'M12 12h-1a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1h2a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 0 -1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1v-2a1 1 0 0 0 -1 -1',
  ],
  '9': [
    'M10 15a1 1 0 0 0 1 1h2a1 1 0 0 0 1 -1v-6a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v2a1 1 0 0 0 1 1h3',
  ],
}

// 获取当天日期（两位数）
const dayString = computed(() => {
  const day = props.date ?? new Date().getDate()
  return String(day).padStart(2, '0')
})

// 生成两位数字的路径
const digit1Paths = computed(() => DIGIT_PATHS[dayString.value[0]] || [])
const digit2Paths = computed(() => DIGIT_PATHS[dayString.value[1]] || [])
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <!-- 日历外框 -->
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12" />
    <path d="M16 3v4" />
    <path d="M8 3v4" />
    <path d="M4 11h16" />

    <!-- 日期数字 -->
    <g stroke-width="2.4">
      <!-- 第一位数字 -->
      <g transform="translate(9.5, 16) scale(0.6) translate(-12, -12)">
        <path v-for="(d, i) in digit1Paths" :key="'d1-' + i" :d="d" />
      </g>
      <!-- 第二位数字 -->
      <g transform="translate(14.5, 16) scale(0.6) translate(-12, -12)">
        <path v-for="(d, i) in digit2Paths" :key="'d2-' + i" :d="d" />
      </g>
    </g>
  </svg>
</template>
