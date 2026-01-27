/**
 * 计算器逻辑 Hook
 * 支持四则运算、百分比、正负切换、历史记录
 */
import { ref, computed } from 'vue'

const STORAGE_KEY = 'lime-calculator-history'
const MAX_HISTORY = 10

export interface HistoryItem {
  expression: string
  result: string
}

// 计算器状态（持久化）
const display = ref('0')
const expression = ref('')
const operator = ref<string | null>(null)
const waitingForOperand = ref(false)
const previousValue = ref<number | null>(null)
const history = ref<HistoryItem[]>([])
const lastResult = ref('')

// 初始化历史记录
const loadHistory = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      history.value = JSON.parse(saved)
      if (history.value.length > 0) {
        lastResult.value = history.value[0].result
      }
    }
  } catch (e) {
    console.error('加载计算器历史失败', e)
  }
}

const saveHistory = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
  } catch (e) {
    console.error('保存计算器历史失败', e)
  }
}

const addToHistory = (expr: string, result: string) => {
  history.value.unshift({ expression: expr, result })
  if (history.value.length > MAX_HISTORY) {
    history.value.pop()
  }
  lastResult.value = result
  saveHistory()
}

// 格式化显示数字
const formatDisplay = (num: number): string => {
  if (!isFinite(num)) return 'Error'
  // 处理精度问题
  const str = num.toPrecision(12)
  const parsed = parseFloat(str)
  // 如果是整数或简单小数，直接显示
  if (Math.abs(parsed) < 1e10 && Math.abs(parsed) > 1e-10) {
    return parsed.toString()
  }
  return parsed.toExponential(4)
}

// 操作符符号映射
const operatorSymbols: Record<string, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
}

export function useCalculator() {
  // 初始化
  if (history.value.length === 0) {
    loadHistory()
  }

  // 输入数字
  const inputDigit = (digit: string) => {
    if (waitingForOperand.value) {
      display.value = digit
      waitingForOperand.value = false
    } else {
      display.value = display.value === '0' ? digit : display.value + digit
    }
  }

  // 输入小数点
  const inputDecimal = () => {
    if (waitingForOperand.value) {
      display.value = '0.'
      waitingForOperand.value = false
      return
    }
    if (!display.value.includes('.')) {
      display.value += '.'
    }
  }

  // 输入运算符
  const inputOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display.value)

    if (previousValue.value === null) {
      previousValue.value = inputValue
      expression.value = `${inputValue} ${operatorSymbols[nextOperator] || nextOperator}`
    } else if (operator.value && !waitingForOperand.value) {
      const result = calculate(previousValue.value, inputValue, operator.value)
      display.value = formatDisplay(result)
      previousValue.value = result
      expression.value = `${formatDisplay(result)} ${operatorSymbols[nextOperator] || nextOperator}`
    } else {
      expression.value = `${formatDisplay(previousValue.value)} ${operatorSymbols[nextOperator] || nextOperator}`
    }

    operator.value = nextOperator
    waitingForOperand.value = true
  }

  // 计算结果
  const calculate = (left: number, right: number, op: string): number => {
    switch (op) {
      case '+': return left + right
      case '-': return left - right
      case '*': return left * right
      case '/': return right === 0 ? Infinity : left / right
      default: return right
    }
  }

  // 等于
  const equals = () => {
    if (operator.value === null || previousValue.value === null) return

    const inputValue = parseFloat(display.value)
    const result = calculate(previousValue.value, inputValue, operator.value)
    const fullExpression = `${expression.value} ${inputValue}`

    display.value = formatDisplay(result)
    addToHistory(fullExpression, formatDisplay(result))

    // 重置状态
    expression.value = ''
    operator.value = null
    previousValue.value = null
    waitingForOperand.value = true
  }

  // 清空
  const clear = () => {
    display.value = '0'
    expression.value = ''
    operator.value = null
    previousValue.value = null
    waitingForOperand.value = false
  }

  // 退格
  const backspace = () => {
    if (waitingForOperand.value) return
    if (display.value.length === 1 || (display.value.length === 2 && display.value.startsWith('-'))) {
      display.value = '0'
    } else {
      display.value = display.value.slice(0, -1)
    }
  }

  // 正负切换
  const toggleSign = () => {
    const value = parseFloat(display.value)
    display.value = formatDisplay(-value)
  }

  // 百分比
  const percentage = () => {
    const value = parseFloat(display.value)
    display.value = formatDisplay(value / 100)
  }

  // 清空历史
  const clearHistory = () => {
    history.value = []
    lastResult.value = ''
    saveHistory()
  }

  // 当前表达式显示
  const currentExpression = computed(() => {
    if (expression.value) {
      return `${expression.value} ${waitingForOperand.value ? '' : display.value}`
    }
    return ''
  })

  return {
    display,
    expression,
    history,
    lastResult,
    currentExpression,
    inputDigit,
    inputDecimal,
    inputOperator,
    equals,
    clear,
    backspace,
    toggleSign,
    percentage,
    clearHistory,
  }
}
