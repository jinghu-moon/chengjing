<script setup lang="ts">
import { computed } from 'vue'
import { IconEdit } from '@tabler/icons-vue'

const props = defineProps<{
  rows: number
  cols: number
  isCustomExpanded: boolean // [新增] 接收父组件状态，用于高亮自定义按钮
}>()

const emit = defineEmits(['update:layout', 'toggleCustom'])

// 预设选项 (正好 5 个，加上自定义一共 6 个，填满 2x3 网格)
const presets = [
  { label: '2x4', r: 2, c: 4 },
  { label: '2x5', r: 2, c: 5 },
  { label: '2x6', r: 2, c: 6 },
  { label: '2x7', r: 2, c: 7 },
  { label: '3x3', r: 3, c: 3 },
]

// 判断当前是否匹配某个预设
const matchedPresetIndex = computed(() => {
  return presets.findIndex(p => p.r === props.rows && p.c === props.cols)
})

// 选择预设
const selectLayout = (r: number, c: number) => {
  emit('update:layout', { rows: r, cols: c })
  // 选择预设时，告诉父组件关闭自定义面板
  emit('toggleCustom', false)
}

// 点击自定义
const handleCustom = () => {
  // 切换展开状态，或者强制展开
  emit('toggleCustom', true)
}
// 计算是否为浅色格子 (棋盘格逻辑)
const isLight = (n: number, cols: number) => {
  const i = n - 1
  const row = Math.floor(i / cols)
  const col = i % cols
  return (row + col) % 2 !== 0
}
</script>

<template>
  <div class="layout-grid-selector">
    <div
      v-for="(preset, index) in presets"
      :key="preset.label"
      class="layout-option"
      :class="{ active: matchedPresetIndex === index && !isCustomExpanded }"
      @click="selectLayout(preset.r, preset.c)"
    >
      <div class="preview-container">
        <div
          class="preview-box"
          :style="{
            '--p-rows': preset.r,
            '--p-cols': preset.c,
          }"
        >
          <div
            v-for="n in preset.r * preset.c"
            :key="n"
            class="cell"
            :class="{ light: isLight(n, preset.c) }"
          ></div>
        </div>
      </div>
      <span class="label">{{ preset.label }}</span>
    </div>

    <div
      class="layout-option custom"
      :class="{ active: isCustomExpanded || matchedPresetIndex === -1 }"
      @click="handleCustom"
    >
      <div class="preview-container">
        <div class="preview-box icon-mode">
          <IconEdit :size="24" stroke-width="1.5" />
        </div>
      </div>
      <span class="label">自定义</span>
    </div>
  </div>
</template>

<style scoped>
.layout-grid-selector {
  display: grid;
  /* [修改] 改为 3 列布局，形成 2行x3列 */
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 100%;
}

.layout-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  position: relative;
}

.preview-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  /* 稍微调整比例以适应3列 */
}

/* --- 预览盒子主体 --- */
.preview-box {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  outline: 2px solid transparent;
  /* 预留给选中态 */
  outline-offset: -2px;

  display: grid;
  grid-template-rows: repeat(var(--p-rows), 1fr);
  grid-template-columns: repeat(var(--p-cols), 1fr);
  gap: 0;

  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.preview-box.icon-mode {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.5);
}

/* --- 棋盘格逻辑 --- */
.cell {
  background: rgba(255, 255, 255, 0.06);
  transition: background 0.2s;
}

.cell.light {
  background: rgba(255, 255, 255, 0.16);
}

/* --- 选中态 --- */
.layout-option.active .preview-box {
  border-color: transparent;
  outline-color: #ffffff;
  /* 纯白高亮 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  transform: translateY(-2px);
}

.layout-option.active .cell {
  background: #333;
}

.layout-option.active .cell.light {
  background: #e6e6e6;
}

.layout-option.active .preview-box.icon-mode {
  background: #333;
  color: #fff;
  border-color: transparent;
  outline-color: #ffffff;
}

.label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
  transition: color 0.2s;
}

.layout-option.active .label {
  color: #fff;
  font-weight: 600;
}

.layout-option:hover .preview-box {
  border-color: rgba(255, 255, 255, 0.3);
}

.layout-option.active:hover .preview-box {
  border-color: transparent;
  outline-color: #ffffff;
}
</style>
