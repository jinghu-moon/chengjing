<script setup lang="ts">
import { IconMinus, IconPlus } from '@tabler/icons-vue'

// 定义 Props
const props = withDefaults(
  defineProps<{
    modelValue: number
    label: string
    min: number
    max: number
    step?: number
    unit?: string
  }>(),
  {
    step: 1,
    unit: '',
  }
)

// 定义 Emits
const emit = defineEmits(['update:modelValue'])

// 核心逻辑：更新数值
const updateVal = (delta: number) => {
  const newVal = props.modelValue + delta
  if (newVal >= props.min && newVal <= props.max) {
    emit('update:modelValue', newVal)
  }
}

// 滚轮逻辑
const handleWheel = (e: WheelEvent) => {
  e.preventDefault()
  // 向上滚(deltaY < 0)增加，向下滚减少
  const delta = e.deltaY < 0 ? props.step : -props.step
  updateVal(delta)
}
</script>

<template>
  <div class="slider-item">
    <div class="slider-header">
      <span class="label">{{ label }}</span>
      <div class="value-wrapper">
        <input
          type="number"
          class="val-input"
          :value="modelValue"
          :min="min"
          :max="max"
          :step="step"
          @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
          @wheel="handleWheel"
        />
        <span v-if="unit" class="unit">{{ unit }}</span>
      </div>
    </div>

    <div class="slider-controls">
      <div class="mini-btn" @click="updateVal(-step)">
        <IconMinus :size="14" />
      </div>

      <input
        type="range"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :style="{
          '--value': modelValue,
          '--min': min,
          '--max': max,
        }"
        @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
      />

      <div class="mini-btn" @click="updateVal(step)">
        <IconPlus :size="14" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.slider-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: var(--space-1) 0;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.value-wrapper {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.val-input {
  width: 48px;
  height: 26px;
  background: var(--bg-input);
  border: var(--border-glass);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  text-align: center;
  font-family: var(--font-family-base);
  font-weight: 500;
  outline: none;
  transition: all 0.2s ease;
  padding: 0;
  appearance: textfield;
  -moz-appearance: textfield;
}

.val-input::-webkit-outer-spin-button,
.val-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.val-input:focus {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.unit {
  font-size: 13px;
  color: var(--text-tertiary);
  min-width: 14px;
}

.slider-controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.mini-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  background: var(--bg-hover);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
  flex-shrink: 0; /* 防止在高密度布局下被压缩 */
}

.mini-btn:hover {
  background: var(--bg-active);
  color: var(--text-primary);
}

.mini-btn:active {
  transform: scale(0.9);
}

input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  background: transparent;
  cursor: pointer;
  min-width: 0; /* 允许 flex item 压缩到最小内容以下 */
}

input[type='range']:focus {
  outline: none;
}

input[type='range']::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  cursor: pointer;
  background: linear-gradient(
    to right,
    var(--color-primary) 0%,
    var(--color-primary)
      calc(
        (100% - 18px) * (var(--value, 0) - var(--min, 0)) / (var(--max, 100) - var(--min, 0)) + 9px
      ),
    var(--mask-light)
      calc(
        (100% - 18px) * (var(--value, 0) - var(--min, 0)) / (var(--max, 100) - var(--min, 0)) + 9px
      ),
    var(--mask-light) 100%
  );
  border-radius: var(--radius-xs);
}

input[type='range']::-webkit-slider-thumb {
  height: 18px;
  width: 18px;
  border-radius: var(--radius-full);
  background: var(--nord6);
  border: 3px solid var(--color-primary);
  cursor: pointer;
  -webkit-appearance: none;
  margin-top: -7px;
  box-shadow: 0 2px 8px rgba(var(--nord10-rgb), 0.3);
  transition:
    transform 0.1s,
    box-shadow 0.2s;
}

input[type='range']::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(var(--nord10-rgb), 0.4);
}

input[type='range']:active::-webkit-slider-thumb {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(var(--nord10-rgb), 0.5);
}
</style>
