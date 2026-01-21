<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'

// Auto-imported hooks
const { getDayMetadata } = useCalendarData()

// 视图数据准备
const todayDetail = computed(() => {
  const meta = getDayMetadata(new Date())
  const weekDaysList = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return {
    date: dayjs().format('M月D日'),
    weekDay: weekDaysList[dayjs().day()],
    lunarStr: meta.lunarText,
    special: meta.festival || meta.solarTerm,
  }
})

// 即将到来事件
const upcomingEvents = computed(() => {
  const today = dayjs().startOf('day')
  const events: { name: string; date: string; daysLeft: number; type: 'term' | 'festival' }[] = []

  for (let i = 0; i <= 60; i++) {
    const d = today.add(i, 'day')
    const meta = getDayMetadata(d.toDate())

    if (meta.festival) {
      events.push({ name: meta.festival, date: meta.dateStr, daysLeft: i, type: 'festival' })
    } else if (meta.solarTerm) {
      events.push({ name: meta.solarTerm, date: meta.dateStr, daysLeft: i, type: 'term' })
    }
  }

  return events.sort((a, b) => a.daysLeft - b.daysLeft).slice(0, 4)
})
</script>

<template>
  <div class="footer-side-col">
    <!-- Today Card -->
    <div class="footer-card today-card">
      <div class="card-title">今日</div>
      <div class="today-flex-wrapper">
        <div class="today-main">
          <span class="today-date">{{ todayDetail.date }}</span>
          <span class="today-weekday">{{ todayDetail.weekDay }}</span>
        </div>
        <div class="today-sub-info">
          <div class="today-lunar">{{ todayDetail.lunarStr }}</div>
          <div v-if="todayDetail.special" class="today-special">
            <span
              class="special-tag"
              :class="todayDetail.special === todayDetail.lunarStr ? 'festival' : 'term'"
            >
              <!-- Note: Simplified logic for tag class, improving original if needed -->
              <!-- Or just reuse the logic if getDayMetadata provides type -->
              {{ todayDetail.special }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Upcoming Card -->
    <div class="footer-card upcoming-card">
      <div class="card-title">即将到来</div>
      <div class="upcoming-list">
        <div v-for="event in upcomingEvents" :key="event.date + event.name" class="upcoming-item">
          <span :class="['event-dot', event.type]"></span>
          <span class="event-name">{{ event.name }}</span>
          <span class="event-days">{{
            event.daysLeft === 0 ? '今天' : event.daysLeft + '天后'
          }}</span>
        </div>
        <div v-if="upcomingEvents.length === 0" class="upcoming-empty">暂无即将到来的节日</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.footer-side-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.footer-card {
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  padding: 16px;
}

.today-card,
.upcoming-card {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.card-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.today-flex-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
}

.today-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 4px;
}

.today-date {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.today-weekday {
  font-size: 14px;
  color: var(--text-secondary);
}

.today-lunar {
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.today-special {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.special-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}

.special-tag.term {
  background: rgb(from var(--nord14) r g b / 0.2);
  color: var(--nord14);
}

.special-tag.festival {
  background: rgb(from var(--nord11) r g b / 0.15);
  color: var(--nord11);
}

/* Upcoming List */
.upcoming-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upcoming-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.event-dot.term {
  background: var(--nord14);
}

.event-dot.festival {
  background: var(--nord11);
}

.event-name {
  flex: 1;
  color: var(--text-primary);
  font-weight: 500;
}

.event-days {
  font-size: 12px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

.upcoming-empty {
  font-size: 12px;
  color: var(--text-placeholder);
  text-align: center;
  padding: 10px 0;
}
</style>
