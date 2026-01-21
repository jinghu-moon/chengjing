<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: string
  }>(),
  {
    modelValue: '12:00',
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// ==================== State ====================
const hour = ref(12)
const minute = ref(0)
const isTyping = ref(false)
const hourDirection = ref<'up' | 'down'>('down')
const minuteDirection = ref<'up' | 'down'>('down')

const parseTime = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number)
  hour.value = isNaN(h) ? 12 : Math.min(23, Math.max(0, h))
  minute.value = isNaN(m) ? 0 : Math.min(59, Math.max(0, m))
}

const formatTime = computed(
  () => `${hour.value.toString().padStart(2, '0')}:${minute.value.toString().padStart(2, '0')}`
)

watch([hour, minute], () => {
  emit('update:modelValue', formatTime.value)
})

// ==================== 滚轮逻辑 ====================
let accHour = 0
let accMin = 0
const WHEEL_THRESHOLD = 30

const onInputWheel = (e: WheelEvent, isHour: boolean) => {
  if (isTyping.value) return

  e.preventDefault()
  // 如果存在 input 元素，失焦
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT') {
    target.blur()
  }

  const delta = e.deltaMode === 1 ? e.deltaY * 20 : e.deltaY

  if (isHour) {
    accHour += delta
  } else {
    accMin += delta
  }

  const currentAcc = isHour ? accHour : accMin

  if (Math.abs(currentAcc) >= WHEEL_THRESHOLD) {
    const direction = currentAcc > 0 ? 1 : -1

    if (isHour) {
      hourDirection.value = direction > 0 ? 'down' : 'up'
      hour.value = (((hour.value + direction) % 24) + 24) % 24
      accHour = 0
    } else {
      minuteDirection.value = direction > 0 ? 'down' : 'up'
      minute.value = (((minute.value + direction) % 60) + 60) % 60
      accMin = 0
    }
  }
}

// ==================== 输入框逻辑 ====================
const onFocus = (e: FocusEvent) => {
  isTyping.value = true
  ;(e.target as HTMLInputElement).select()
}

const onBlur = (e: Event, isHour: boolean) => {
  isTyping.value = false
  const target = e.target as HTMLInputElement
  let val = parseInt(target.value)

  if (isNaN(val)) val = 0

  if (isHour) {
    val = Math.min(23, Math.max(0, val))
    hour.value = val
  } else {
    val = Math.min(59, Math.max(0, val))
    minute.value = val
  }

  target.value = val.toString().padStart(2, '0')
}

// ==================== Lifecycle ====================
onMounted(() => {
  parseTime(props.modelValue)
})

watch(
  () => props.modelValue,
  newVal => {
    parseTime(newVal)
  }
)
</script>

<template>
  <div class="time-picker">
    <!-- 小时 -->
    <div class="tp-digit-wrapper" @wheel.prevent="onInputWheel($event, true)">
      <Transition :name="hourDirection === 'down' ? 'scroll-up' : 'scroll-down'">
        <input
          :key="hour"
          class="tp-digit"
          type="text"
          inputmode="numeric"
          :value="hour.toString().padStart(2, '0')"
          @focus="onFocus"
          @blur="onBlur($event, true)"
          @keydown.enter="($event.target as HTMLInputElement).blur()"
        />
      </Transition>
    </div>

    <span class="tp-colon">:</span>

    <!-- 分钟 -->
    <div class="tp-digit-wrapper" @wheel.prevent="onInputWheel($event, false)">
      <Transition :name="minuteDirection === 'down' ? 'scroll-up' : 'scroll-down'">
        <input
          :key="minute"
          class="tp-digit"
          type="text"
          inputmode="numeric"
          :value="minute.toString().padStart(2, '0')"
          @focus="onFocus"
          @blur="onBlur($event, false)"
          @keydown.enter="($event.target as HTMLInputElement).blur()"
        />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.time-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  line-height: 1;
}

.tp-digit-wrapper {
  position: relative;
  width: 2rem;
  height: 1.5rem;
  overflow: hidden;
}

.tp-digit {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  font-family: var(--font-family-base);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5rem;
  color: var(--text-primary);
  text-align: center;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  border-radius: var(--radius-sm);
  outline: none;
  cursor: text;
  transition:
    background 0.3s,
    color 0.3s;
  font-variant-numeric: tabular-nums;
}

.tp-digit::-webkit-inner-spin-button,
.tp-digit::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.tp-digit:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.tp-digit:focus {
  background: var(--bg-active);
  color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
}

.tp-colon {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-tertiary);
  margin: 0 2px;
  opacity: 0.6;
}

/* ==================== 滚动动画 ==================== */
.scroll-up-enter-active,
.scroll-up-leave-active,
.scroll-down-enter-active,
.scroll-down-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    opacity 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/* 向上滚动：新元素从下往上进入，旧元素向上离开 */
.scroll-up-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.scroll-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

/* 向下滚动：新元素从上往下进入，旧元素向下离开 */
.scroll-down-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.scroll-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
