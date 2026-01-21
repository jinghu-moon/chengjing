<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import { IconHourglassLow } from '@tabler/icons-vue'

// 时光胶囊逻辑
const now = ref(dayjs())
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => {
    now.value = dayjs()
  }, 60000)
})

onUnmounted(() => clearInterval(timer))

const timeCapsule = computed(() => {
  const t = now.value
  const dayOfWeek = t.day() === 0 ? 7 : t.day()

  const periods: [string, string, number, number][] = [
    ['今日', '小时', t.hour(), 24],
    ['本周', '天', dayOfWeek, 7],
    ['本月', '天', t.date(), t.daysInMonth()],
    [
      '本年',
      '天',
      t.diff(t.startOf('year'), 'day'),
      t.endOf('year').diff(t.startOf('year'), 'day') + 1,
    ],
  ]

  return periods.map(([label, unitName, passed, total]) => {
    const percent = ((passed / total) * 100).toFixed(1)
    return { label, passed, total, unit: unitName, percent, left: total - passed }
  })
})
</script>

<template>
  <div class="footer-card capsule-card">
    <div class="card-title">
      <IconHourglassLow size="14" style="margin-right: 4px; vertical-align: -2px" />
      时光胶囊
    </div>
    <div class="capsule-list">
      <div v-for="item in timeCapsule" :key="item.label" class="capsule-item">
        <div class="capsule-info">
          <span class="capsule-label"
            >{{ item.label }}已度过 <b>{{ item.passed }}</b> {{ item.unit }}</span
          >
          <span class="capsule-left">剩余 {{ item.left }} {{ item.unit }}</span>
        </div>
        <div class="capsule-progress-track">
          <div class="capsule-progress-fill" :style="{ width: item.percent + '%' }">
            <span v-if="parseFloat(item.percent) > 10" class="capsule-percent-text"
              >{{ item.percent }}%</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.footer-card {
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  padding: 16px;
}

.capsule-card {
  flex: 1.8;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.card-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.capsule-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  justify-content: center;
}

.capsule-item {
  width: 100%;
}

.capsule-info {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.capsule-label b {
  color: var(--text-primary);
  font-weight: 700;
}

.capsule-left {
  color: var(--text-tertiary);
  font-style: italic;
}

.capsule-progress-track {
  position: relative;
  height: 14px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}

.capsule-progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 7px;
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 6px;
  position: relative;
}

.capsule-percent-text {
  font-size: 9px;
  color: var(--text-primary);
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}
</style>
