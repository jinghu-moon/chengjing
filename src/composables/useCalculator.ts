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
      // 修改：不再重置 expression 为结果，而是追加当前输入
      // 之前: expression.value = `${formatDisplay(result)} ${operatorSymbols[nextOperator] || nextOperator}`
      // 现在: 
      expression.value += ` ${inputValue} ${operatorSymbols[nextOperator] || nextOperator}`
    } else {
      // 仅更换操作符
      const oldOpSymbol = operatorSymbols[operator.value!] || operator.value!
      // 移除末尾的操作符 ( + 2 spaces usually? logic below handles space)
      // expression 格式总是 "NUM OP NUM OP"
      if (expression.value.endsWith(` ${oldOpSymbol}`)) {
         expression.value = expression.value.slice(0, -(oldOpSymbol.length + 1)) + ` ${operatorSymbols[nextOperator] || nextOperator}`
      } else {
         // Fallback just in case
         expression.value = `${formatDisplay(previousValue.value!)} ${operatorSymbols[nextOperator] || nextOperator}`
      }
    }

    operator.value = nextOperator
    waitingForOperand.value = true
  }

  // 计算结果
  const calculate = (left: number, right: number, op: string): number => {
    switch (op) {
    // 幂运算需特殊处理，视为 binary operator
      case '^': return Math.pow(left, right)
      // Mod (取模)
      case 'mod': return left % right // 注意 JS % 是求余，matches standard calc usually
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
    
    // 如果 expression 已经很长，我们只需追加最后的输入
    // expression 目前是 "1 + 2 *" 形式
    const fullExpression = `${expression.value} ${inputValue}`

    // 记录历史
    const resultStr = formatDisplay(result)
    display.value = resultStr
    addToHistory(fullExpression, resultStr)

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
    if (display.value.length === 1 || (display.value.length === 2 && display.value.startsWith('-')) || display.value === 'Error') {
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

  // ----------- 科学计算功能 (Unary Operations) -----------

  // 通用单目运算执行器
  const executeUnary = (fn: (n: number) => number) => {
    const value = parseFloat(display.value)
    const result = fn(value)
    display.value = formatDisplay(result)
    // 单目运算通常不需要进入 expression 历史（如 Windows 计算器），或者作为当前输入的一部分
    // 这里简单处理：结果作为新输入，但 waitingForOperand 设为 true 以便用户直接输入新数字覆盖? 
    // 不，Windows 计算器 behavior: sin(30) -> 0.5，之后按数字会追加还是覆盖? 通常是覆盖（waitingForOperand = true）
    waitingForOperand.value = true 
  }

  const sin = () => executeUnary(Math.sin)
  const cos = () => executeUnary(Math.cos)
  const tan = () => executeUnary(Math.tan)
  const log = () => executeUnary(Math.log10)
  const ln = () => executeUnary(Math.log)
  const sqrt = () => executeUnary(Math.sqrt)
  const cbrt = () => executeUnary(Math.cbrt) // 立方根
  const square = () => executeUnary(n => n * n)
  const reciprocal = () => executeUnary(n => 1 / n)
  const factorial = () => executeUnary(n => {
    if (n < 0) return NaN
    if (n === 0 || n === 1) return 1
    let r = 1
    for (let i = 2; i <= n; i++) r *= i
    return r
  })
  const exp = () => executeUnary(Math.exp) // e^x
  const abs = () => executeUnary(Math.abs)

  // 常量
  const constantPi = () => {
    display.value = Math.PI.toString()
    waitingForOperand.value = true
  }
  const constantE = () => {
    display.value = Math.E.toString()
    waitingForOperand.value = true
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
    // Scientific
    sin, cos, tan,
    log, ln,
    sqrt, cbrt, square,
    reciprocal, factorial,
    exp, abs,
    constantPi, constantE
  }
}
