<script setup lang="ts">
// [1. 工具库与图标]
import dayjs from 'dayjs'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronLeftPipe,
  IconChevronRightPipe,
  IconClock,
  IconX,
} from '@tabler/icons-vue'

// [2. 局部 Hook] 必须显式引入，因为它不在全局 auto-imports 的扫描路径下
import { useCalendar, type CalendarDay } from './composables/useCalendar'
import { usePickerPosition } from './composables/usePickerPosition'

// [3. 样式]
import './styles.css'

// [4. 组件]
// ❌ 删除显式导入，unplugin-vue-components 会自动处理
// import CalendarGrid from './components/CalendarGrid.vue';
// import TimePanel from './components/TimePanel.vue';
// import YearMonthWheel from './components/YearMonthWheel.vue';
// import PickerFooter from './components/PickerFooter.vue';

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// State
const isOpen = ref(false)
const isYearMonthOpen = ref(false)
const selectedDate = ref<Date | null>(null)
const selectedHour = ref(9)
const selectedMinute = ref(0)
const selectedSecond = ref(0)

// Refs
const inputRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const yearMonthDropdownRef = ref<HTMLElement | null>(null)

// Composables
const calendar = useCalendar(selectedDate)
const position = usePickerPosition(
  inputRef,
  dropdownRef,
  yearMonthDropdownRef,
  isOpen,
  isYearMonthOpen
)

// Sync model value to internal state
watch(
  () => props.modelValue,
  val => {
    if (val) {
      const date = dayjs(val)
      selectedDate.value = date.toDate()
      calendar.setViewDate(date.toDate())
      selectedHour.value = date.hour()
      selectedMinute.value = date.minute()
      selectedSecond.value = date.second()
    }
  },
  { immediate: true }
)

// Display value
const displayValue = computed(() => {
  if (!props.modelValue) return ''
  return dayjs(props.modelValue).format('MM/DD HH:mm')
})

// Actions
const togglePicker = () => {
  isOpen.value = !isOpen.value
  isYearMonthOpen.value = false
  if (isOpen.value) {
    position.calculatePosition()
  }
}

const toggleYearMonth = async () => {
  isYearMonthOpen.value = !isYearMonthOpen.value
  if (isYearMonthOpen.value) {
    await nextTick()
    position.calculatePosition()
  }
}

const selectDate = (day: CalendarDay) => {
  if (!day.isCurrentMonth) return
  selectedDate.value = new Date(
    calendar.viewDate.value.year(),
    calendar.viewDate.value.month(),
    day.date,
    selectedHour.value,
    selectedMinute.value,
    selectedSecond.value
  )
}

const handleSelectYear = (year: number) => {
  calendar.viewDate.value = calendar.viewDate.value.year(year)
}

const handleSelectMonth = (month: number) => {
  calendar.viewDate.value = calendar.viewDate.value.month(month - 1)
  isYearMonthOpen.value = false
}

const setToday = () => {
  const now = dayjs()
  calendar.setViewDate(now.toDate())
  selectedDate.value = now.toDate()
  selectedHour.value = now.hour()
  selectedMinute.value = now.minute()
  selectedSecond.value = now.second()
  applyDateTime()
}

const goToToday = () => {
  calendar.goToToday()
  isYearMonthOpen.value = false
}

const clear = () => {
  selectedDate.value = null
  emit('update:modelValue', '')
  isOpen.value = false
}

const applyDateTime = () => {
  if (!selectedDate.value) return

  const finalDate = dayjs(selectedDate.value)
    .hour(selectedHour.value)
    .minute(selectedMinute.value)
    .second(selectedSecond.value)

  emit('update:modelValue', finalDate.format('YYYY-MM-DDTHH:mm:ss'))
  isOpen.value = false
}

// Click outside handler
const handleClickOutside = (event: MouseEvent) => {
  if (!isOpen.value && !isYearMonthOpen.value) return

  const target = event.target as HTMLElement
  const refs = [inputRef, dropdownRef, yearMonthDropdownRef]

  if (refs.some(r => r.value?.contains(target))) return

  isOpen.value = false
  isYearMonthOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Recalculate position when year-month opens
watch(isYearMonthOpen, val => {
  if (val) position.calculatePosition()
})

watch(calendar.viewDate, () => {
  if (isYearMonthOpen.value) position.calculatePosition()
})
</script>

<template>
  <div class="datetime-picker">
    <!-- Trigger -->
    <div ref="inputRef" class="datetime-input" @click="togglePicker">
      <IconClock :size="14" class="input-icon" />
      <span class="input-text" :class="{ placeholder: !modelValue }">
        {{ displayValue || placeholder || '选择日期时间' }}
      </span>
      <IconX v-if="modelValue" :size="14" class="clear-icon" @click.stop="clear" />
    </div>

    <!-- Main Dropdown -->
    <teleport to="body">
      <transition name="picker-fade">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="picker-dropdown"
          :style="position.dropdownStyle.value"
          @click.stop
        >
          <!-- Header -->
          <div class="picker-header">
            <button
              class="nav-btn year-nav"
              title="前一年"
              :disabled="calendar.isAnimating.value"
              @click="calendar.prevYear"
            >
              <IconChevronLeftPipe :size="16" />
            </button>
            <button
              class="nav-btn"
              :disabled="calendar.isAnimating.value"
              @click="calendar.prevMonth"
            >
              <IconChevronLeft :size="16" />
            </button>
            <transition name="fade" mode="out-in">
              <div
                :key="calendar.currentMonthYear.value"
                class="month-year"
                @click="toggleYearMonth"
              >
                <span>{{ calendar.currentMonthYear.value }}</span>
              </div>
            </transition>
            <button
              class="nav-btn"
              :disabled="calendar.isAnimating.value"
              @click="calendar.nextMonth"
            >
              <IconChevronRight :size="16" />
            </button>
            <button
              class="nav-btn year-nav"
              title="后一年"
              :disabled="calendar.isAnimating.value"
              @click="calendar.nextYear"
            >
              <IconChevronRightPipe :size="16" />
            </button>
          </div>

          <!-- Calendar + Time -->
          <div class="calendar-container">
            <CalendarGrid
              :days="calendar.calendarDays.value"
              :slide-direction="calendar.slideDirection.value"
              :month-year-key="calendar.monthYearKey.value"
              @select-date="selectDate"
            />
            <TimePanel
              v-model:hour="selectedHour"
              v-model:minute="selectedMinute"
              v-model:second="selectedSecond"
            />
          </div>

          <!-- Footer -->
          <PickerFooter
            @go-to-today="goToToday"
            @set-today="setToday"
            @clear="clear"
            @apply="applyDateTime"
          />
        </div>
      </transition>
    </teleport>

    <!-- Year-Month Dropdown -->
    <teleport to="body">
      <transition name="slide-up">
        <div
          v-if="isYearMonthOpen"
          ref="yearMonthDropdownRef"
          class="year-month-dropdown"
          :style="position.yearMonthStyle.value"
          @click.stop
        >
          <YearMonthWheel
            :view-date="calendar.viewDate.value.toDate()"
            @select-year="handleSelectYear"
            @select-month="handleSelectMonth"
          />
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style scoped>
.datetime-picker {
  position: relative;
  width: 100%;
}

.datetime-input {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--bg-input);
  border: var(--border-white-10);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  transition: all 0.2s;
}

.datetime-input:hover {
  background: var(--bg-hover);
  border-color: rgba(var(--nord6-rgb), 0.2);
}

.input-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.input-text {
  flex: 1;
  font-size: var(--text-xs);
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.input-text.placeholder {
  color: var(--text-placeholder);
}

.clear-icon {
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color 0.2s;
  flex-shrink: 0;
}

.clear-icon:hover {
  color: var(--color-danger);
}

.picker-dropdown {
  background: var(--bg-panel);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: var(--border-glass);
  box-shadow: var(--shadow-lg);
  padding: var(--space-3);
  min-width: 280px;
  width: 300px;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-lg);
}

.year-month-dropdown {
  background: var(--bg-panel-overlay);
  backdrop-filter: blur(var(--blur-md));
  -webkit-backdrop-filter: blur(var(--blur-md));
  border: var(--border-glass);
  border-radius: var(--radius-ml);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  width: 240px;
  height: 300px;
  padding: var(--space-3);
  padding-right: 20px;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  z-index: var(--z-dropdown);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
  gap: var(--space-1);
}

.nav-btn {
  background: var(--bg-hover);
  border: none;
  color: var(--text-primary);
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.nav-btn:hover {
  background: var(--bg-active);
  color: var(--color-primary);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-btn.year-nav {
  opacity: 0.8;
  padding: 0 4px;
}

.month-year {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: all 0.2s;
  flex-grow: 1;
  text-align: center;
}

.month-year:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.calendar-container {
  min-height: 250px;
}
</style>
