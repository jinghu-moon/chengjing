<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSettings } from '../composables/useSettings'

const { settings } = useSettings()

const timeStr = ref('00:00:00')
const dateStr = ref('')
let clockTimer: ReturnType<typeof setInterval> | undefined

const updateTime = () => {
  const now = new Date()

  // 时间：HH:mm:ss
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  timeStr.value = `${h}:${m}:${s}`

  // 日期：YYYY/MM/DD
  const y = now.getFullYear()
  const mo = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  dateStr.value = `${y}/${mo}/${d}`
}

onMounted(() => {
  updateTime()
  clockTimer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  clearInterval(clockTimer)
})
</script>

<template>
  <div v-show="settings.clockShow" class="header-section">
    <div class="clock-line">
      <span id="clock-time">{{ timeStr }}</span>
    </div>
    <div id="clock-date">{{ dateStr }}</div>
  </div>
</template>

<style scoped>
.header-section {
  position: absolute;
  top: 24px;
  left: 28px;
  text-align: left;
  color: #fff;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 20;
  pointer-events: none;
  font-family: var(--font-family-base);
}

.clock-line {
  line-height: 1;
  margin-bottom: 4px;
}

#clock-time {
  font-size: 64px;
  font-weight: 500;
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
  /* 等宽数字，防止秒跳动抖动 */
}

#clock-date {
  font-size: 18px;
  /* 日期稍微大一点点 */
  opacity: 0.8;
  font-weight: 400;
  letter-spacing: 2px;
  /* 增加字间距，更有质感 */
  font-family: var(--font-family-base);
  /* 尝试用一点等宽字体风格，或者直接用默认 */
}
</style>
