<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import UserEventPanel from './UserEventPanel.vue'

// Auto-imported hooks
const { getDayMetadata } = useCalendarData()

// Tab 切换状态
const activeTab = ref<'upcoming' | 'events'>('upcoming')

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
    <!-- Today Card（紧凑两行布局） -->
    <div class="footer-card today-card">
      <div class="today-date">{{ todayDetail.date }}</div>
      <div class="today-sub">
        <span class="today-weekday">{{ todayDetail.weekDay }}</span>
        <span class="today-divider">·</span>
        <span class="today-lunar">{{ todayDetail.lunarStr }}</span>
        <span
          v-if="todayDetail.special"
          class="special-tag"
          :class="todayDetail.special === todayDetail.lunarStr ? 'festival' : 'term'"
        >
          {{ todayDetail.special }}
        </span>
      </div>
    </div>

    <!-- 事件卡片（Tab 切换） -->
    <div class="footer-card events-card">
      <div class="tab-header">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'upcoming' }"
          @click="activeTab = 'upcoming'"
        >
          即将到来
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'events' }"
          @click="activeTab = 'events'"
        >
          我的事件
        </button>
      </div>

      <!-- 即将到来 -->
      <div v-if="activeTab === 'upcoming'" class="upcoming-list">
        <div v-for="event in upcomingEvents" :key="event.date + event.name" class="upcoming-item">
          <span :class="['event-dot', event.type]"></span>
          <span class="event-name">{{ event.name }}</span>
          <span class="event-days">{{
            event.daysLeft === 0 ? '今天' : event.daysLeft + '天后'
          }}</span>
        </div>
        <div v-if="upcomingEvents.length === 0" class="upcoming-empty">暂无即将到来的节日</div>
      </div>

      <!-- 我的事件 -->
      <UserEventPanel v-if="activeTab === 'events'" />
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

.today-card {
  flex: 0 0 auto;
  padding: 12px 16px;
}

.events-card {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.today-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.today-date {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.today-weekday {
  font-size: 12px;
  color: var(--text-secondary);
}

.today-divider {
  color: var(--text-tertiary);
  font-size: 12px;
}

.today-lunar {
  font-size: 12px;
  color: var(--text-tertiary);
}

.special-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}

.special-tag.term {
  background: var(--color-success-bg);
  color: var(--color-success);
}

.special-tag.festival {
  background: var(--color-danger-bg);
  color: var(--color-danger);
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
  background: var(--color-success);
}

.event-dot.festival {
  background: var(--color-danger);
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

/* Tab Header */
.tab-header {
  display: flex;
  gap: 0;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--color-divider);
}

.tab-btn {
  flex: 1;
  padding: 4px 0 6px;
  border: none;
  background: transparent;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: var(--transition-fast);
  border-bottom: 2px solid transparent;
  text-align: center;
  letter-spacing: 0.5px;
}

.tab-btn:hover {
  color: var(--text-secondary);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}
</style>
