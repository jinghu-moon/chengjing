<script setup lang="ts">
/**
 * 快捷计算器组件
 * 桌面小组件形式，支持计算 + 换算双模式
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  IconCalculator,
  IconBackspace,
  IconArrowsExchange,
  IconRuler2,
  IconScale,
  IconSquare,
  IconClock,
  IconCube,
  IconBinary,
  IconTemperature,
  IconRocket,
  IconLanguageHiragana,
  IconCoin,
} from '@tabler/icons-vue'
import CapsuleTabs from './SettingsPanel/components/CapsuleTabs.vue'
import SelectMenu from './SelectMenu'
import { Dialog } from './Dialog'
import { useCalculator } from '../composables/useCalculator'
import { useConverter, converterCategories, type ConverterType } from '../composables/useConverter'

// 计算器逻辑
const {
  display,
  currentExpression,
  history,
  lastResult,
  inputDigit,
  inputDecimal,
  inputOperator,
  equals,
  clear,
  backspace,
  toggleSign,
  percentage,
} = useCalculator()

// 换算逻辑
const {
  activeType,
  inputValue,
  fromUnit,
  toUnit,
  currentUnits,
  result,
  setType,
  swapUnits,
} = useConverter()

// UI 状态
const isExpanded = ref(false)
const activeTab = ref<'calc' | 'convert'>('calc')
const showConverterList = ref(true)

const tabs = [
  { value: 'calc', label: '计算' },
  { value: 'convert', label: '换算' },
]

// 图标映射
const converterIcons: Record<ConverterType, any> = {
  length: IconRuler2,
  weight: IconScale,
  area: IconSquare,
  time: IconClock,
  volume: IconCube,
  radix: IconBinary,
  temperature: IconTemperature,
  speed: IconRocket,
  chinese: IconLanguageHiragana,
  currency: IconCoin,
}

// 温度/进制单位名称
const temperatureUnits = ['摄氏度 ℃', '华氏度 ℉', '开尔文 K']
const radixUnits = ['二进制', '八进制', '十进制', '十六进制']

const getUnitOptions = () => {
  if (activeType.value === 'temperature') return temperatureUnits
  if (activeType.value === 'radix') return radixUnits
  return currentUnits.value.map(u => `${u.name} (${u.symbol})`)
}

// SelectMenu 使用的选项格式
const unitOptions = computed(() => {
  return getUnitOptions().map((label, idx) => ({
    value: String(idx),
    label
  }))
})

// 单位选择处理
const handleFromUnitChange = (val: string) => {
  fromUnit.value = parseInt(val)
}

const handleToUnitChange = (val: string) => {
  toUnit.value = parseInt(val)
}

// 选择换算类型
const selectConverter = (type: ConverterType) => {
  setType(type)
  showConverterList.value = false
}

// 返回换算列表
const backToList = () => {
  showConverterList.value = true
}

// 切换展开
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

// 关闭面板
const closePanel = () => {
  isExpanded.value = false
}

// 键盘支持
const handleKeyDown = (e: KeyboardEvent) => {
  if (!isExpanded.value || activeTab.value !== 'calc') return

  const key = e.key

  if (/^[0-9]$/.test(key)) {
    inputDigit(key)
  } else if (key === '.') {
    inputDecimal()
  } else if (key === '+' || key === '-' || key === '*' || key === '/') {
    inputOperator(key)
  } else if (key === 'Enter' || key === '=') {
    e.preventDefault()
    equals()
  } else if (key === 'Backspace') {
    backspace()
  } else if (key === 'c' || key === 'C') {
    clear()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

// Tab 切换时重置换算列表视图
const handleTabChange = (tab: string | number) => {
  activeTab.value = tab as 'calc' | 'convert'
  if (tab === 'convert') {
    showConverterList.value = true
  }
}
</script>

<template>
  <div class="calculator-wrapper">
    <!-- 迷你入口 -->
    <div class="mini-trigger" title="计算器" @click="toggleExpand">
      <IconCalculator :size="20" stroke-width="1.5" />
      <span v-if="lastResult" class="mini-result">{{ lastResult }}</span>
    </div>

    <!-- 使用 Dialog 组件承载计算器面板 -->
    <Dialog
      v-model="isExpanded"
      :mask="true"
      :mask-closable="true"
      :closable="false"
      :show-icon="false"
      :show-confirm-btn="false"
      :show-cancel-btn="false"
      :close-on-esc="true"
      :lock-scroll="false"
      width="320px"
      placement="topLeft"
      dialog-class="calc-dialog"
      mask-class="calc-mask"
      @close="closePanel"
    >
      <template #header>
        <div class="calc-header">
          <CapsuleTabs
            :model-value="activeTab"
            :items="tabs"
            :equal-width="true"
            @update:model-value="handleTabChange"
          />
        </div>
      </template>

      <!-- 计算器视图 -->
      <div v-if="activeTab === 'calc'" class="calc-view">
        <!-- 显示区 -->
        <div class="display-area">
          <div class="expression">{{ currentExpression || history[0]?.expression || '' }}</div>
          <div class="result">{{ display }}</div>
        </div>

        <!-- 按钮区 -->
        <div class="button-grid">
          <button class="btn func" @click="clear">C</button>
          <button class="btn func" @click="backspace">
            <IconBackspace :size="20" />
          </button>
          <button class="btn func" @click="percentage">%</button>
          <button class="btn op" @click="inputOperator('/')">÷</button>

          <button class="btn" @click="inputDigit('7')">7</button>
          <button class="btn" @click="inputDigit('8')">8</button>
          <button class="btn" @click="inputDigit('9')">9</button>
          <button class="btn op" @click="inputOperator('*')">×</button>

          <button class="btn" @click="inputDigit('4')">4</button>
          <button class="btn" @click="inputDigit('5')">5</button>
          <button class="btn" @click="inputDigit('6')">6</button>
          <button class="btn op" @click="inputOperator('-')">−</button>

          <button class="btn" @click="inputDigit('1')">1</button>
          <button class="btn" @click="inputDigit('2')">2</button>
          <button class="btn" @click="inputDigit('3')">3</button>
          <button class="btn op" @click="inputOperator('+')">+</button>

          <button class="btn func" @click="toggleSign">±</button>
          <button class="btn" @click="inputDigit('0')">0</button>
          <button class="btn" @click="inputDecimal">.</button>
          <button class="btn equal" @click="equals">=</button>
        </div>
      </div>

      <!-- 换算视图 -->
      <div v-else class="convert-view">
        <!-- 换算分类列表 -->
        <div v-if="showConverterList" class="converter-list">
          <div
            v-for="cat in converterCategories"
            :key="cat.type"
            class="converter-item"
            @click="selectConverter(cat.type)"
          >
            <component :is="converterIcons[cat.type]" :size="24" stroke-width="1.5" />
            <span>{{ cat.label }}</span>
          </div>
        </div>

        <!-- 换算详情 -->
        <div v-else class="converter-detail">
          <button class="back-btn" @click="backToList">
            ← 返回
          </button>

          <div class="convert-input-area">
            <div class="convert-row">
              <SelectMenu
                :model-value="String(fromUnit)"
                :options="unitOptions"
                trigger-width="140px"
                @update:model-value="handleFromUnitChange"
              />
              <input
                v-model="inputValue"
                type="text"
                class="convert-input"
                placeholder="输入数值"
              />
            </div>

            <button class="swap-btn" @click="swapUnits">
              <IconArrowsExchange :size="20" />
            </button>

            <div class="convert-row">
              <SelectMenu
                :model-value="String(toUnit)"
                :options="unitOptions"
                trigger-width="140px"
                @update:model-value="handleToUnitChange"
              />
              <div class="convert-result">{{ result || '—' }}</div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
/* 基础布局 */
.calculator-wrapper {
  position: absolute;
  top: 180px;
  left: 28px;
  z-index: var(--z-panel);
}



/* 迷你入口 */
.mini-trigger {
  background: var(--bg-panel);
  backdrop-filter: var(--glass-md);
  border: var(--border-glass);
  height: 40px;
  padding: 0 16px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all var(--duration-normal) var(--ease-smooth);
  color: var(--text-primary);
  box-shadow: var(--shadow-md);
}

.mini-trigger:hover {
  background: var(--bg-hover-card);
  transform: scale(1.05);
}

.mini-result {
  font-size: 14px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Dialog 弹窗样式 */
.calc-header {
  display: flex;
  align-items: center;
  width: 100%;
}

/* 计算器视图 */
.calc-view {
  padding: 12px;
}

.display-area {
  text-align: right;
  padding: 12px 16px;
  margin-bottom: 12px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.expression {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  min-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result {
  font-size: 32px;
  font-weight: 500;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 按钮网格 */
.button-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.btn {
  height: 52px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--bg-active);
  color: var(--text-primary);
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast);
}

.btn:hover {
  background: var(--bg-hover-card);
}

.btn:active {
  transform: scale(0.95);
}

.btn.func {
  background: var(--bg-panel-card);
  color: var(--text-secondary);
}

.btn.op {
  color: var(--color-primary);
  font-size: 22px;
}

.btn.equal {
  background: var(--color-primary);
  color: #fff;
}

.btn.equal:hover {
  background: var(--color-primary-hover);
}

/* 换算视图 */
.convert-view {
  padding: 12px;
  min-height: 320px;
}

.converter-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.converter-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: var(--radius-md);
  background: var(--bg-active);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast);
  font-size: var(--text-sm);
}

.converter-item:hover {
  background: var(--bg-hover-card);
  color: var(--text-primary);
}

/* 换算详情 */
.converter-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.back-btn {
  align-self: flex-start;
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--bg-panel-card);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--duration-fast);
}

.back-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.convert-input-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.convert-row {
  width: 100%;
  display: flex;
  gap: 8px;
  min-width: 0;
}

.unit-select {
  flex: 1;
  min-width: 0;
  max-width: 140px;
  height: 44px;
  padding: 0 12px;
  border: var(--border-glass);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: var(--text-base);
  cursor: pointer;
  outline: none;
}

.unit-select:focus {
  border-color: var(--color-primary);
}

.convert-input,
.convert-result {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 12px;
  border: var(--border-glass);
  border-radius: var(--radius-md);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: var(--text-md);
  font-variant-numeric: tabular-nums;
  outline: none;
}

.convert-input:focus {
  border-color: var(--color-primary);
}

.convert-result {
  display: flex;
  align-items: center;
  background: var(--bg-active);
  font-weight: 500;
}

.swap-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast);
}

.swap-btn:hover {
  transform: rotate(180deg);
  background: var(--color-primary-hover);
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--duration-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all var(--duration-normal) var(--ease-smooth);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>

<!-- 全局样式用于覆盖 Dialog 组件 -->
<style>
/* 计算器 Dialog 定制样式 */
.calc-dialog {
  /* 自适应内容高度，不要填满 */
  height: auto !important;
  max-height: 90vh;
}

.calc-dialog .dialog-header {
  padding: 12px 16px 8px;
}

.calc-dialog .dialog-body {
  padding: 0;
}

/* 透明遮罩 */
.calc-mask {
  background: rgba(0, 0, 0, 0.15) !important;
  backdrop-filter: blur(2px) !important;
}
</style>
