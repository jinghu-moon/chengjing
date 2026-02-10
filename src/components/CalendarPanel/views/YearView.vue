<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import { useCalendarState } from '../composables/useCalendarPanelState'
import { useCalendarData } from '@/composables/useCalendarData'
import TimeCapsule from '../components/TimeCapsule.vue'
import DashboardCards from '../components/DashboardCards.vue'

const { currentYear, handleYearNav, yearScrollDirection, selectDate } = useCalendarState()

const { getDayMetadata } = useCalendarData()

const emit = defineEmits<{
  (e: 'select-month', payload: { month: number; target: EventTarget | null }): void
}>()

// Local State for grid generation
const now = ref(dayjs())
let timer: ReturnType<typeof setInterval>
onMounted(() => {
  timer = setInterval(() => {
    now.value = dayjs()
  }, 60000)
})
onUnmounted(() => clearInterval(timer))

const YEAR_GRID_COLUMNS = 4
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const yearGridData = computed(() => {
  const currentY = currentYear.value
  const currentM = now.value.month()
  const currentD = now.value.date()

  return Array.from({ length: 12 }, (_, i) => {
    const date = dayjs().year(currentY).month(i).startOf('month')
    const daysInMonth = date.daysInMonth()

    const days = Array.from({ length: daysInMonth }, (_, d) => {
      const dayDate = date.add(d, 'day')
      const meta = getDayMetadata(dayDate.toDate())
      return {
        day: d + 1,
        type: meta.type,
      }
    })

    return {
      index: i,
      name: `${i + 1}月`,
      firstDay: date.day(),
      days,
      hasToday: currentY === now.value.year() && i === currentM,
      todayKey: currentD,
    }
  })
})

const handleMonthClick = (monthIndex: number, event: MouseEvent) => {
  emit('select-month', { month: monthIndex, target: event.currentTarget })
}

const handleDateClick = (monthIndex: number, day: number, event: MouseEvent) => {
  // Logic from original goToDate
  // We need to calculate date and call selectDate
  const targetDate = dayjs().year(currentYear.value).month(monthIndex).date(day).toDate()
  selectDate(targetDate)
  // Also switch view via parent logic (managed by month click usually?
  // In org code: goToDate did everything. Here we can use the same flow.
  // We emit 'select-month' but also implies date selection.
  // Actually original goToDate switched to 'month' view.
  emit('select-month', { month: monthIndex, target: event.currentTarget })
}

const handleYearScroll = (e: WheelEvent) => {
  const dir = e.deltaY > 0 ? 1 : -1
  handleYearNav(dir > 0 ? 'down' : 'up')
}
</script>

<template>
  <div class="view-container year-view-outer" @wheel.prevent="handleYearScroll">
    <div class="year-view-scroll-area">
      <Transition
        :name="yearScrollDirection === 'down' ? 'year-grid-scroll-up' : 'year-grid-scroll-down'"
      >
        <div :key="currentYear" class="year-view-grid" :style="{ '--cols': YEAR_GRID_COLUMNS }">
          <div
            v-for="month in yearGridData"
            :key="month.index"
            v-memo="[currentYear, month.index, month.todayKey]"
            class="mini-month"
            @click="handleMonthClick(month.index, $event)"
          >
            <div class="mini-month-title">{{ month.name }}</div>
            <div class="mini-grid">
              <div v-for="d in weekDays" :key="d" class="mini-weekday">{{ d }}</div>
              <div v-for="n in month.firstDay" :key="`empty-${n}`"></div>

              <div
                v-for="dayObj in month.days"
                :key="dayObj.day"
                :class="[
                  'mini-day',
                  {
                    'today-dot': month.hasToday && dayObj.day === month.todayKey,
                    [`type-${dayObj.type}`]: dayObj.type,
                  },
                ]"
                @click.stop="handleDateClick(month.index, dayObj.day, $event)"
              >
                {{ dayObj.day }}
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <div class="year-footer">
      <TimeCapsule />
      <DashboardCards />
    </div>
  </div>
</template>

<style scoped>
@import url('../styles/common.css');

/* ========== Year View Flex Layout ========== */
.year-view-outer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.year-view-scroll-area {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.year-view-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols, 4), 1fr);
  gap: 4px 16px;
  height: 100%;
  align-content: space-between;
  will-change: transform, opacity;
}

/* Transitions */
.year-grid-scroll-up-enter-active,
.year-grid-scroll-up-leave-active,
.year-grid-scroll-down-enter-active,
.year-grid-scroll-down-leave-active {
  transition:
    transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.year-grid-scroll-up-leave-to {
  transform: translateY(-100%);
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.year-grid-scroll-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.year-grid-scroll-down-leave-to {
  transform: translateY(100%);
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.year-grid-scroll-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

/* Mini Month Styles */
.mini-month {
  cursor: pointer;
  transition: transform 0.2s;
}

.mini-month:hover {
  transform: translateY(-2px);
}

.mini-month-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.mini-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  font-size: 11px;
  text-align: center;
  gap: 4px;
}

.mini-weekday {
  color: var(--text-tertiary);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-day {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: var(--text-secondary);
  position: relative;
  transition: all 0.15s ease;
}

.mini-day:hover {
  transform: scale(1.35);
  background: var(--bg-hover);
  font-weight: 600;
  z-index: 1;
  color: var(--text-primary);
}

.mini-day.type-holiday::after,
.mini-day.type-festival::after,
.mini-day.type-term::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
}

.mini-day.type-holiday::after {
  background: var(--color-danger);
  box-shadow: 0 0 4px var(--color-danger-bg);
}

.mini-day.type-festival::after {
  background: var(--color-purple);
}

.mini-day.type-term::after {
  background: var(--color-success);
  opacity: 0.8;
}

.mini-day.today-dot {
  color: var(--color-primary);
  font-weight: 800;
  text-decoration: underline;
}

/* Footer Layout (Replicated for layout structure) */
.year-footer {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-shrink: 0;
  min-height: 240px;
}
</style>
