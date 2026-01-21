<script setup lang="ts">
// [1. 自动导入] computed, defineProps 等无需引入
import { IconChevronUp, IconChevronDown } from '@tabler/icons-vue'
import dayjs from 'dayjs'

// [2. 修正 Hook 路径]
import { useYearWheel } from '../composables/useYearWheel'

const props = defineProps<{
  viewDate: Date
  size?: 'default' | 'large'
}>()

// ✅ 关键修复：必须用 const emit = ... 接收返回值
const emit = defineEmits<{
  selectYear: [year: number]
  selectMonth: [month: number]
}>()

const viewDateRef = computed(() => ({
  value: dayjs(props.viewDate),
}))

const { displayYears, centerYearData, adjustWheel, handleWheel } = useYearWheel(viewDateRef.value)

const currentMonth = computed(() => dayjs(props.viewDate).month() + 1)

const handleSelectYear = (year: number) => {
  emit('selectYear', year)
}

const handleSelectMonth = (month: number) => {
  emit('selectMonth', month)
}
</script>

<template>
  <div class="year-month-content" :class="{ 'size-large': props.size === 'large' }">
    <!-- Year Wheel -->
    <div class="year-wheel-box">
      <div class="year-wheel">
        <div class="wheel-nav-top">
          <button class="wheel-nav-btn" @click="adjustWheel('down')">
            <IconChevronUp :size="18" />
          </button>
        </div>

        <div class="year-items-wrapper" @wheel="handleWheel">
          <div class="year-items-top">
            <div
              v-for="data in displayYears.slice(0, 3)"
              :key="data.year"
              class="year-item"
              :class="{ 'is-current': data.isCurrent, 'is-selected': data.isSelected }"
              @click="handleSelectYear(data.year)"
            >
              {{ data.year }}
            </div>
          </div>

          <div class="year-item-center-wrapper">
            <div
              class="year-item is-center"
              :class="{
                'is-current': centerYearData.isCurrent,
                'is-selected': centerYearData.isSelected,
              }"
              @click="handleSelectYear(centerYearData.year)"
            >
              {{ centerYearData.year }}
            </div>
          </div>

          <div class="year-items-bottom">
            <div
              v-for="data in displayYears.slice(3, 6)"
              :key="data.year"
              class="year-item"
              :class="{ 'is-current': data.isCurrent, 'is-selected': data.isSelected }"
              @click="handleSelectYear(data.year)"
            >
              {{ data.year }}
            </div>
          </div>
        </div>

        <div class="wheel-nav-bottom">
          <button class="wheel-nav-btn" @click="adjustWheel('up')">
            <IconChevronDown :size="18" />
          </button>
        </div>
      </div>
    </div>

    <!-- Month Grid -->
    <div class="month-grid-wrapper">
      <div class="month-items">
        <div
          v-for="month in 12"
          :key="month"
          class="month-item"
          :class="{ 'is-current': month === currentMonth }"
          @click="handleSelectMonth(month)"
        >
          {{ month }}月
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.year-month-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.year-wheel-box {
  width: 70px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.year-wheel {
  width: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  user-select: none;
  height: 266px;
}

.wheel-nav-top,
.wheel-nav-bottom {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wheel-nav-btn {
  background: var(--bg-hover);
  border: none;
  border-radius: var(--radius-sm);
  padding: 2px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.wheel-nav-btn:hover {
  background: var(--bg-active);
  color: var(--color-primary);
}

.year-items-wrapper {
  position: relative;
  height: 210px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex-grow: 0;
  flex-shrink: 0;
}

.year-items-top,
.year-items-bottom {
  height: 90px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.year-item-center-wrapper {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.year-wheel .year-item {
  padding: 2px 0;
  cursor: pointer;
  line-height: 1.4;
  flex-shrink: 0;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: var(--text-base);
  color: var(--text-secondary);
  font-weight: var(--weight-normal);
  transition:
    opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    font-size 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    font-weight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    color 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    letter-spacing 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.year-wheel .year-item:hover:not(.is-center) {
  opacity: 0.7;
  color: var(--text-primary);
  transform: scale(1.02);
}

.year-items-top .year-item:nth-child(1),
.year-items-bottom .year-item:nth-child(3) {
  opacity: 0.2;
  transform: scale(0.85);
  filter: blur(0.3px);
}

.year-items-top .year-item:nth-child(2),
.year-items-bottom .year-item:nth-child(2) {
  opacity: 0.3;
  transform: scale(0.9);
}

.year-items-top .year-item:nth-child(3),
.year-items-bottom .year-item:nth-child(1) {
  opacity: 0.5;
  transform: scale(0.95);
}

.year-item.is-center {
  opacity: 1;
  height: 30px;
  pointer-events: auto;
  color: var(--text-primary);
  font-weight: var(--weight-bold);
  font-size: var(--text-xl);
  transform: scale(1.1);
  letter-spacing: 0.5px;
  transition:
    opacity 0.4s cubic-bezier(0.34, 1.3, 0.64, 1),
    transform 0.4s cubic-bezier(0.34, 1.3, 0.64, 1),
    font-size 0.4s cubic-bezier(0.34, 1.3, 0.64, 1),
    font-weight 0.4s cubic-bezier(0.34, 1.3, 0.64, 1),
    color 0.4s cubic-bezier(0.34, 1.3, 0.64, 1),
    letter-spacing 0.4s cubic-bezier(0.34, 1.3, 0.64, 1);
}

.year-wheel .year-item.is-selected,
.year-item.is-center.is-selected {
  color: var(--color-primary);
}

.month-grid-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.month-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  width: 100%;
  align-content: center;
}

.month-item {
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  padding: var(--space-1) 0;
  cursor: pointer;
  transition: all 0.2s;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  display: flex;
  align-items: center;
  justify-content: center;
}

.month-item:hover {
  background: var(--bg-hover);
}

.month-item.is-current {
  background: var(--color-primary-alpha);
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  font-weight: var(--weight-bold);
}

/* Large size variant for CalendarPanel */
.size-large {
  height: 380px;
  gap: var(--space-4);
}

.size-large .year-wheel-box {
  width: 100px;
}

.size-large .year-wheel {
  width: 100px;
  height: 340px;
}

.size-large .year-items-wrapper {
  height: 280px;
}

.size-large .year-items-top,
.size-large .year-items-bottom {
  height: 120px;
}

.size-large .year-wheel .year-item {
  height: 40px;
  font-size: var(--text-lg);
}

.size-large .year-item.is-center {
  height: 40px;
  font-size: 28px;
}

.size-large .month-items {
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  height: 100%;
  align-content: space-evenly;
}

.size-large .month-item {
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  height: 48px;
}
</style>
