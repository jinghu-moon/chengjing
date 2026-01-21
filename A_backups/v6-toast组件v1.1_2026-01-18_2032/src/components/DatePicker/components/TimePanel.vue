<script setup lang="ts">
// [1. API 自动导入] ref, defineModel 等无需引入
import { IconClock } from '@tabler/icons-vue'

// [2. 修正类型引入路径]
// useTimeLogic.ts 在 DatePicker/composables/
// TimePanel.vue   在 DatePicker/components/
import type { TimeUnit } from '../composables/useTimeLogic'

const hour = defineModel<number>('hour', { required: true })
const minute = defineModel<number>('minute', { required: true })
const second = defineModel<number>('second', { required: true })

const TIME_LIMITS: Record<TimeUnit, number> = {
  hour: 23,
  minute: 59,
  second: 59,
}

const inputRefs = ref<Record<TimeUnit, HTMLInputElement | null>>({
  hour: null,
  minute: null,
  second: null,
})

const inputOrder: TimeUnit[] = ['hour', 'minute', 'second']

const values: Record<TimeUnit, { value: number }> = {
  hour: hour as { value: number },
  minute: minute as { value: number },
  second: second as { value: number },
}

const adjustTime = (unit: TimeUnit, direction: 'up' | 'down') => {
  const delta = direction === 'up' ? 1 : -1
  const max = TIME_LIMITS[unit]
  const current = values[unit].value
  values[unit].value = (current + delta + max + 1) % (max + 1)
}

const handleTimeInput = (unit: TimeUnit, value: string) => {
  const num = parseInt(value) || 0
  const max = TIME_LIMITS[unit]
  values[unit].value = Math.min(max, Math.max(0, num))
}

const handleWheel = (event: WheelEvent, unit: TimeUnit) => {
  event.preventDefault()
  adjustTime(unit, event.deltaY < 0 ? 'up' : 'down')
}

const focusInput = (unit: TimeUnit) => {
  const el = inputRefs.value[unit]
  el?.focus()
  el?.select()
}

const handleKeydown = (event: KeyboardEvent, unit: TimeUnit) => {
  if (event.key !== 'Tab') return

  event.preventDefault()
  const index = inputOrder.indexOf(unit)
  const nextIndex = index + (event.shiftKey ? -1 : 1)

  if (nextIndex >= 0 && nextIndex < inputOrder.length) {
    focusInput(inputOrder[nextIndex])
  }
}
</script>

<template>
  <div class="time-picker-wrapper">
    <div class="time-label">
      <IconClock :size="14" />
      <span>时间</span>
    </div>

    <div class="time-controls">
      <div class="single-input-wrapper">
        <!-- Hour -->
        <div class="time-input-segment-wrapper">
          <input
            :ref="el => (inputRefs.hour = el as HTMLInputElement | null)"
            type="text"
            class="time-input-segment"
            :value="hour.toString().padStart(2, '0')"
            maxlength="2"
            @input="handleTimeInput('hour', ($event.target as HTMLInputElement).value)"
            @wheel="handleWheel($event, 'hour')"
            @focus="focusInput('hour')"
            @keydown="handleKeydown($event, 'hour')"
          />
        </div>

        <span class="time-separator">:</span>

        <!-- Minute -->
        <div class="time-input-segment-wrapper">
          <input
            :ref="el => (inputRefs.minute = el as HTMLInputElement | null)"
            type="text"
            class="time-input-segment"
            :value="minute.toString().padStart(2, '0')"
            maxlength="2"
            @input="handleTimeInput('minute', ($event.target as HTMLInputElement).value)"
            @wheel="handleWheel($event, 'minute')"
            @focus="focusInput('minute')"
            @keydown="handleKeydown($event, 'minute')"
          />
        </div>

        <span class="time-separator">:</span>

        <!-- Second -->
        <div class="time-input-segment-wrapper">
          <input
            :ref="el => (inputRefs.second = el as HTMLInputElement | null)"
            type="text"
            class="time-input-segment"
            :value="second.toString().padStart(2, '0')"
            maxlength="2"
            @input="handleTimeInput('second', ($event.target as HTMLInputElement).value)"
            @wheel="handleWheel($event, 'second')"
            @focus="focusInput('second')"
            @keydown="handleKeydown($event, 'second')"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.time-picker-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: var(--space-3);
  border-top: var(--divider-light);
  margin-top: var(--space-3);
  margin-bottom: var(--space-1);
}

.time-label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  white-space: nowrap;
  flex-shrink: 0;
}

.time-controls {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex: 1;
  justify-content: flex-end;
}

.single-input-wrapper {
  display: flex;
  align-items: center;
  background: var(--bg-active);
  border: var(--border-white-10);
  border-radius: var(--radius-sm);
  padding: 0 4px;
  transition: all 0.2s;
}

.single-input-wrapper:hover {
  border-color: rgba(var(--nord6-rgb), 0.2);
}

.single-input-wrapper:focus-within {
  border-color: var(--color-primary);
  background: var(--bg-hover);
}

.time-input-segment-wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0;
}

.time-input-segment {
  width: 30px;
  background: transparent;
  border: none;
  padding: var(--space-1) 0;
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-variant-numeric: tabular-nums;
  text-align: center;
  outline: none;
  font-family: var(--font-family-base);
  font-weight: var(--weight-semibold);
}

.time-separator {
  color: var(--text-secondary);
  font-weight: var(--weight-bold);
  font-size: var(--text-sm);
  margin: 0 2px;
}
</style>
