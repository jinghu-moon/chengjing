<script setup lang="ts">
/**
 * 快捷计算器组件
 * 桌面小组件形式，支持 标准/科学计算 + 换算 模式
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  IconCalculator,
  IconBackspace,
  IconHistory,
  IconFlask,
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
  IconTrash
} from '@tabler/icons-vue'
import { useClipboard } from '@vueuse/core'
import CapsuleTabs from './SettingsPanel/components/CapsuleTabs.vue'
import SelectMenu from './SelectMenu'
import { Dialog } from './Dialog'
import { useCalculator } from '../composables/useCalculator'
import { useConverter, converterCategories, type ConverterType } from '../composables/useConverter'
import { useToast } from './Toast/composables/useToast'

// --- 逻辑层 ---

// 剪贴板 & Toast
const { copy, isSupported: isCopySupported } = useClipboard()
const { showToast } = useToast()

// 计算器核心
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
  clearHistory,
  // 科学计算
  sin, cos, tan,
  log, ln,
  sqrt, square,
  reciprocal, factorial,
  exp,
  constantPi, constantE
} = useCalculator()

// 换算逻辑
const {
  activeType,
  inputValue,
  fromUnit,
  toUnit,
  currentUnits,
  result: convertResult,
  setType,
  swapUnits,
} = useConverter()

// UI 状态
const isExpanded = ref(false)
const activeTab = ref<'calc' | 'convert'>('calc')
const calcMode = ref<'standard' | 'scientific'>('standard')
const showHistory = ref(false)
const showConverterList = ref(true)

const tabs = [
  { value: 'calc', label: '计算' },
  { value: 'convert', label: '换算' },
]

// --- 换算图标映射 ---
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

// --- 辅助函数 ---

const getUnitOptions = () => {
  const temperatureUnits = ['摄氏度 ℃', '华氏度 ℉', '开尔文 K']
  const radixUnits = ['二进制', '八进制', '十进制', '十六进制']
  
  if (activeType.value === 'temperature') return temperatureUnits
  if (activeType.value === 'radix') return radixUnits
  return currentUnits.value.map(u => `${u.name} (${u.symbol})`)
}

const unitOptions = computed(() => {
  return getUnitOptions().map((label, idx) => ({
    value: String(idx),
    label
  }))
})

// --- 事件处理 ---

const handleCopy = async (text: string) => {
  if (!isCopySupported.value) return
  await copy(text)
  showToast({ type: 'success', message: '已复制结果' })
}

const handleHistoryClick = (item: { expression: string, result: string }) => {
  inputDigit(item.result)
  showHistory.value = false
}

const toggleMode = () => {
  calcMode.value = calcMode.value === 'standard' ? 'scientific' : 'standard'
}

// 键盘支持
const handleKeyDown = (e: KeyboardEvent) => {
  if (!isExpanded.value || activeTab.value !== 'calc') return

  const key = e.key
  
  if (['Enter', 'Backspace', 'Escape'].includes(key)) {
    // Escape 交给 Dialog 处理
  }

  if (/^[0-9]$/.test(key)) {
    inputDigit(key)
  } else if (key === '.') {
    inputDecimal()
  } else if (['+', '-', '*', '/'].includes(key)) {
    inputOperator(key)
  } else if (key === 'Enter' || key === '=') {
    e.preventDefault()
    equals()
  } else if (key === 'Backspace') {
    backspace()
  } else if (key.toLowerCase() === 'c') {
    clear()
  } else if (key === '^' && calcMode.value === 'scientific') {
    inputOperator('^')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

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
    <div class="mini-trigger" title="计算器" @click="isExpanded = !isExpanded">
      <IconCalculator :size="20" stroke-width="1.5" />
      <span v-if="lastResult" class="mini-result">{{ lastResult }}</span>
    </div>

    <!-- 主面板 -->
    <Dialog
      v-model="isExpanded"
      :width="activeTab === 'calc' && calcMode === 'scientific' ? '380px' : '320px'"
      placement="topLeft"
      :show-header="false"
      dialog-class="calc-dialog"
      mask-class="calc-mask"
    >
      <div class="calc-container">
        <!-- 顶部通栏 -->
        <div class="calc-header-bar">
          <CapsuleTabs
            :model-value="activeTab"
            :items="tabs"
            :equal-width="true"
            class="main-tabs"
            @update:model-value="handleTabChange"
          />
          
          <div v-if="activeTab === 'calc'" class="header-tools">
            <button 
              class="tool-btn" 
              :class="{ active: calcMode === 'scientific' }"
              title="科学模式"
              @click="toggleMode"
            >
              <IconFlask :size="18" />
            </button>
            <button 
              class="tool-btn" 
              :class="{ active: showHistory }"
              title="历史记录"
              @click="showHistory = !showHistory"
            >
              <IconHistory :size="18" />
            </button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="calc-body">
          
          <!-- 计算模式 -->
          <div v-if="activeTab === 'calc'" class="mode-calc">
            <!-- 显示屏 -->
            <div 
              class="display-screen" 
              @click="handleCopy(display)"
              title="点击复制"
            >
              <div class="expression-line">{{ currentExpression }}</div>
              <div class="result-line">{{ display }}</div>
            </div>

            <!-- 键盘区域 -->
            <div class="keypad" :class="calcMode">
              
              <!-- 标准模式 (4列) -->
              <template v-if="calcMode === 'standard'">
                <button class="btn func" @click="percentage">%</button>
                <button class="btn func" @click="clear">CE</button>
                <button class="btn func" @click="clear">C</button>
                <button class="btn func" @click="backspace" aria-label="backspace"><IconBackspace :size="20"/></button>
                
                <button class="btn func" @click="reciprocal">¹/x</button>
                <button class="btn func" @click="square">x²</button>
                <button class="btn func" @click="sqrt">²√x</button>
                <button class="btn func" @click="inputOperator('/')">÷</button>

                <button class="btn num" @click="inputDigit('7')">7</button>
                <button class="btn num" @click="inputDigit('8')">8</button>
                <button class="btn num" @click="inputDigit('9')">9</button>
                <button class="btn func" @click="inputOperator('*')">×</button>

                <button class="btn num" @click="inputDigit('4')">4</button>
                <button class="btn num" @click="inputDigit('5')">5</button>
                <button class="btn num" @click="inputDigit('6')">6</button>
                <button class="btn func" @click="inputOperator('-')">−</button>

                <button class="btn num" @click="inputDigit('1')">1</button>
                <button class="btn num" @click="inputDigit('2')">2</button>
                <button class="btn num" @click="inputDigit('3')">3</button>
                <button class="btn func" @click="inputOperator('+')">+</button>

                <button class="btn num" @click="toggleSign">±</button>
                <button class="btn num" @click="inputDigit('0')">0</button>
                <button class="btn num" @click="inputDecimal">.</button>
                <button class="btn equal" @click="equals">=</button>
              </template>

              <!-- 科学模式 (5列) -->
              <template v-else>
                <!-- Row 1 -->
                <button class="btn func scientific" @click="square">x²</button>
                <button class="btn func scientific" @click="constantPi">π</button>
                <button class="btn func scientific" @click="constantE">e</button>
                <button class="btn func" @click="clear">C</button>
                <button class="btn func" @click="backspace"><IconBackspace :size="20"/></button>

                <!-- Row 2 -->
                <button class="btn func scientific" @click="reciprocal">¹/x</button>
                <button class="btn func scientific" @click="sqrt">²√x</button>
                <button class="btn func scientific" @click="exp">exp</button>
                <button class="btn func scientific" @click="inputOperator('mod')">mod</button>
                <button class="btn func" @click="inputOperator('/')">÷</button>

                <!-- Row 3 -->
                <button class="btn func scientific" @click="sin">sin</button>
                <button class="btn func scientific" @click="cos">cos</button>
                <button class="btn func scientific" @click="tan">tan</button>
                <button class="btn func scientific" @click="factorial">n!</button>
                <button class="btn func" @click="inputOperator('*')">×</button>
                
                <!-- Row 4 -->
                <button class="btn func scientific" @click="inputOperator('^')">xʸ</button>
                <button class="btn num" @click="inputDigit('7')">7</button>
                <button class="btn num" @click="inputDigit('8')">8</button>
                <button class="btn num" @click="inputDigit('9')">9</button>
                <button class="btn func" @click="inputOperator('-')">−</button>

                <!-- Row 5 -->
                <button class="btn func scientific" @click="inputOperator('10^')">10ˣ</button>
                <button class="btn num" @click="inputDigit('4')">4</button>
                <button class="btn num" @click="inputDigit('5')">5</button>
                <button class="btn num" @click="inputDigit('6')">6</button>
                <button class="btn func" @click="inputOperator('+')">+</button>

                <!-- Row 6 -->
                <button class="btn func scientific" @click="log">log</button>
                <button class="btn num" @click="inputDigit('1')">1</button>
                <button class="btn num" @click="inputDigit('2')">2</button>
                <button class="btn num" @click="inputDigit('3')">3</button>
                <button class="btn equal row-span-2" @click="equals">=</button>

                <!-- Row 7 -->
                <button class="btn func scientific" @click="ln">ln</button>
                <button class="btn num" @click="toggleSign">±</button>
                <button class="btn num" @click="inputDigit('0')">0</button>
                <button class="btn num" @click="inputDecimal">.</button>
              </template>
            </div>
          </div>

          <!-- 换算模式保持不变 -->
          <div v-else class="mode-convert">
             <!-- ... existing convert template ... -->
             <!-- 换算分类列表 -->
             <div v-if="showConverterList" class="converter-list">
              <div
                v-for="cat in converterCategories"
                :key="cat.type"
                class="converter-item"
                @click="setType(cat.type); showConverterList = false"
              >
                <component :is="converterIcons[cat.type]" :size="24" stroke-width="1.5" />
                <span>{{ cat.label }}</span>
              </div>
            </div>

            <!-- 换算详情 -->
            <div v-else class="converter-detail">
              <button class="back-btn" @click="showConverterList = true">
                ← 返回
              </button>

              <div class="convert-input-area">
                <div class="convert-row">
                  <SelectMenu
                    :model-value="String(fromUnit)"
                    :options="unitOptions"
                    trigger-width="140px"
                    @update:model-value="v => fromUnit = parseInt(v)"
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
                    @update:model-value="v => toUnit = parseInt(v)"
                  />
                  <div class="convert-result">{{ convertResult || '—' }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 历史记录面板 (Overlay) -->
          <Transition name="slide-right">
            <div v-if="showHistory && activeTab === 'calc'" class="history-panel">
              <div class="history-header">
                <span>历史记录</span>
                <button class="icon-btn-small" @click="clearHistory" title="清空历史" v-if="history.length">
                  <IconTrash :size="16" />
                </button>
              </div>
              
              <div v-if="history.length === 0" class="history-empty">
                暂无记录
              </div>
              
              <ul v-else class="history-list">
                <li 
                  v-for="(item, idx) in history" 
                  :key="idx" 
                  class="history-item"
                  @click="handleHistoryClick(item)"
                >
                  <div class="hist-expr">{{ item.expression }} =</div>
                  <div class="hist-res">{{ item.result }}</div>
                </li>
              </ul>
            </div>
          </Transition>

        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
/* --- 布局变量 --- */
.calculator-wrapper {
  position: absolute;
  top: 180px;
  left: 28px;
  z-index: var(--z-widget);
}

/* --- 迷你入口 --- */
.mini-trigger {
  background: var(--bg-panel);
  backdrop-filter: var(--glass-md);
  border: var(--border-glass);
  height: 40px;
  padding: 0 var(--spacing-md);
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  transition: var(--transition-base);
  color: var(--text-primary);
  box-shadow: var(--shadow-md);
}

.mini-trigger:hover {
  background: var(--bg-hover-card);
  transform: translateY(-2px);
}

.mini-result {
  font-size: var(--text-base);
  font-family: var(--font-family-mono);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* --- 计算器容器 --- */
.calc-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.calc-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: var(--border-divider);
}

.main-tabs {
  flex: 1;
  max-width: 200px;
}

.header-tools {
  display: flex;
  gap: var(--spacing-xs);
}

.tool-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.tool-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tool-btn.active {
  color: var(--color-primary);
  background: var(--bg-active);
}

/* --- 内容区 --- */
.calc-body {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* --- 显示屏 --- */
.display-screen {
  padding: var(--spacing-md);
  text-align: right;
  cursor: pointer;
  transition: var(--transition-base);
}

.display-screen:hover {
  background: var(--bg-hover);
}

.display-screen:active {
  background: var(--bg-active);
}

.expression-line {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  min-height: 20px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
}
.expression-line::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.result-line {
  font-size: 40px; /* text-huge is 64px, too big for this dialog width */
  font-family: var(--font-family-mono);
  font-weight: var(--weight-medium);
  color: var(--text-primary);
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* --- 键盘 --- */
.keypad {
  flex: 1;
  display: grid;
  padding: var(--spacing-sm);
  gap: 6px; /* slightly larger gap for comfort */
}

.keypad.standard {
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(6, 1fr);
}

.keypad.scientific {
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(7, 1fr);
}

.btn {
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  min-height: 48px; /* Touch target optimized */
}

/* 键盘按键配色 (严格遵循 Design System) */
.btn.num {
  background: var(--bg-active); /* Light/Translucent */
  color: var(--text-primary);
}
.btn.num:hover {
  background: var(--bg-hover-card);
}

.btn.func {
  background: var(--bg-panel-card); /* Darker */
  color: var(--text-secondary);
}
.btn.func:hover {
  background: var(--bg-hover-card);
  color: var(--text-primary);
}

.btn.equal {
  background: var(--color-primary);
  color: #fff;
}
.btn.equal:hover {
  background: var(--color-primary-hover);
}

.btn:active {
  transform: scale(0.96);
}

.btn[disabled] {
  opacity: var(--disabled-opacity);
  cursor: not-allowed;
}

.row-span-2 {
  grid-row: span 2;
  height: 100%;
}

.scientific {
  font-size: var(--text-sm);
}

/* --- 历史记录面板 --- */
.history-panel {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 240px;
  background: var(--bg-panel-dark);
  backdrop-filter: var(--glass-lg);
  border-left: var(--border-glass);
  display: flex;
  flex-direction: column;
  z-index: 10;
}

.history-header {
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  border-bottom: var(--border-divider);
}

.icon-btn-small {
  background: transparent;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--radius-sm);
}
.icon-btn-small:hover {
  background: var(--bg-hover);
  color: var(--color-danger);
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm);
  list-style: none;
  margin: 0;
}

.history-item {
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  margin-bottom: var(--spacing-xs);
  transition: var(--transition-fast);
}

.history-item:hover {
  background: var(--bg-active);
}

.hist-expr {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-bottom: 2px;
}

.hist-res {
  font-size: var(--text-lg);
  color: var(--text-primary);
  font-family: var(--font-family-mono);
  font-weight: var(--weight-medium);
}

.history-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}

/* --- 动画 --- */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: var(--transition-base);
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* --- 换算样式 (复用原有逻辑，更新样式) --- */
.mode-convert {
  padding: var(--spacing-md);
  min-height: 380px;
}
.converter-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}
.converter-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-sm);
  border-radius: var(--radius-md);
  background: var(--bg-active);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}
.converter-item:hover {
  background: var(--bg-hover-card);
  color: var(--text-primary);
}

/* 更多换算样式略，沿用 Grid 布局即可 */
.convert-input-area {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}
.convert-row {
  display: flex;
  gap: var(--spacing-sm);
}
.convert-input, .convert-result {
  flex: 1;
  height: 40px;
  background: var(--bg-input);
  border: var(--border-glass);
  border-radius: var(--radius-md);
  padding: 0 var(--spacing-sm);
  color: var(--text-primary);
  font-family: var(--font-family-mono);
}
.swap-btn {
  align-self: center;
  width: 32px; height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.back-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  margin-bottom: var(--spacing-md);
}
.back-btn:hover { text-decoration: underline; }
</style>
