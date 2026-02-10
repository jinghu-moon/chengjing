<script setup lang="ts">
defineProps<{
  modelValue: boolean
  label: string
  size?: 'normal' | 'sm'
}>()

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="control-row">
    <span>{{ label }}</span>
    <label class="switch" :class="size || ''">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <span class="slider round"></span>
    </label>
  </div>
</template>

<style scoped>
.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: var(--height-xs);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch.sm {
  width: 36px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--mask-light);
  transition: 0.3s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: var(--control-indicator);
  transition: 0.3s;
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-sm);
}

.switch.sm .slider:before {
  height: 16px;
  width: 16px;
}

input:checked + .slider {
  background-color: var(--color-primary);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.switch.sm input:checked + .slider:before {
  transform: translateX(16px);
}
</style>
