<script setup lang="ts">
// [1. API 自动导入] defineProps, defineEmits 无需引入

// [2. 修正类型引入路径]
import type { CalendarDay, SlideDirection } from '../composables/useCalendar'

defineProps<{
  days: CalendarDay[]
  slideDirection: SlideDirection
  monthYearKey: string
}>()

const emit = defineEmits<{
  selectDate: [day: CalendarDay]
}>()

const weekdays = ['一', '二', '三', '四', '五', '六', '日']
</script>

<template>
  <div class="calendar">
    <div class="weekdays">
      <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
    </div>

    <div class="days-wrapper">
      <transition :name="slideDirection === 'left' ? 'slide-left' : 'slide-right'">
        <div :key="monthYearKey" class="days">
          <div
            v-for="(day, index) in days"
            :key="index"
            class="day"
            :class="{
              'other-month': !day.isCurrentMonth,
              today: day.isToday,
              selected: day.isSelected,
            }"
            @click="day.isCurrentMonth && emit('selectDate', day)"
          >
            {{ day.date }}
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: var(--space-2);
}

.weekday {
  text-align: center;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-weight: var(--weight-medium);
  padding: 4px 0;
}

.days-wrapper {
  position: relative;
  overflow: hidden;
  min-height: 240px;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.day:hover:not(.other-month) {
  background: var(--bg-hover);
}

.day.other-month {
  color: var(--text-tertiary);
  opacity: 0.3;
  cursor: default;
}

.day.today {
  background: var(--color-primary-alpha);
  color: var(--color-primary);
  font-weight: var(--weight-bold);
}

.day.selected {
  background: var(--color-primary);
  color: #fff;
  font-weight: var(--weight-bold);
}

/* Slide animations */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-leave-active,
.slide-right-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
</style>
