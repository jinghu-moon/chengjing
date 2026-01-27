/**
 * 换算逻辑 Hook
 * 支持长度、重量、面积、时间、体积、进制、温度、速度、大写数字、汇率转换
 */
import { ref, computed } from 'vue'

// 换算类型
export type ConverterType =
  | 'length'
  | 'weight'
  | 'area'
  | 'time'
  | 'volume'
  | 'radix'
  | 'temperature'
  | 'speed'
  | 'chinese'
  | 'currency'

export interface ConverterCategory {
  type: ConverterType
  label: string
  icon: string
}

// 换算分类列表
export const converterCategories: ConverterCategory[] = [
  { type: 'length', label: '长度转换', icon: 'IconRuler' },
  { type: 'weight', label: '重量转换', icon: 'IconScale' },
  { type: 'area', label: '面积转换', icon: 'IconSquare' },
  { type: 'time', label: '时间转换', icon: 'IconClock' },
  { type: 'volume', label: '体积转换', icon: 'IconCube' },
  { type: 'radix', label: '进制转换', icon: 'IconBinary' },
  { type: 'temperature', label: '温度转换', icon: 'IconTemperature' },
  { type: 'speed', label: '速度转换', icon: 'IconRocket' },
  { type: 'chinese', label: '大写数字', icon: 'IconLanguage' },
  { type: 'currency', label: '汇率转换', icon: 'IconCoin' },
]

// 单位定义
interface UnitDefinition {
  name: string
  symbol: string
  toBase: number // 转换为基准单位的系数
}

// 长度单位（基准：米）
const lengthUnits: UnitDefinition[] = [
  { name: '米', symbol: 'm', toBase: 1 },
  { name: '厘米', symbol: 'cm', toBase: 0.01 },
  { name: '毫米', symbol: 'mm', toBase: 0.001 },
  { name: '千米', symbol: 'km', toBase: 1000 },
  { name: '英寸', symbol: 'in', toBase: 0.0254 },
  { name: '英尺', symbol: 'ft', toBase: 0.3048 },
  { name: '码', symbol: 'yd', toBase: 0.9144 },
  { name: '英里', symbol: 'mi', toBase: 1609.344 },
]

// 重量单位（基准：千克）
const weightUnits: UnitDefinition[] = [
  { name: '千克', symbol: 'kg', toBase: 1 },
  { name: '克', symbol: 'g', toBase: 0.001 },
  { name: '毫克', symbol: 'mg', toBase: 0.000001 },
  { name: '吨', symbol: 't', toBase: 1000 },
  { name: '磅', symbol: 'lb', toBase: 0.453592 },
  { name: '盎司', symbol: 'oz', toBase: 0.0283495 },
  { name: '斤', symbol: '斤', toBase: 0.5 },
  { name: '两', symbol: '两', toBase: 0.05 },
]

// 面积单位（基准：平方米）
const areaUnits: UnitDefinition[] = [
  { name: '平方米', symbol: 'm²', toBase: 1 },
  { name: '平方厘米', symbol: 'cm²', toBase: 0.0001 },
  { name: '平方千米', symbol: 'km²', toBase: 1000000 },
  { name: '公顷', symbol: 'ha', toBase: 10000 },
  { name: '亩', symbol: '亩', toBase: 666.667 },
  { name: '平方英尺', symbol: 'ft²', toBase: 0.092903 },
  { name: '平方英里', symbol: 'mi²', toBase: 2589988.11 },
]

// 时间单位（基准：秒）
const timeUnits: UnitDefinition[] = [
  { name: '秒', symbol: 's', toBase: 1 },
  { name: '分钟', symbol: 'min', toBase: 60 },
  { name: '小时', symbol: 'h', toBase: 3600 },
  { name: '天', symbol: 'd', toBase: 86400 },
  { name: '周', symbol: 'w', toBase: 604800 },
  { name: '毫秒', symbol: 'ms', toBase: 0.001 },
]

// 体积单位（基准：升）
const volumeUnits: UnitDefinition[] = [
  { name: '升', symbol: 'L', toBase: 1 },
  { name: '毫升', symbol: 'mL', toBase: 0.001 },
  { name: '立方米', symbol: 'm³', toBase: 1000 },
  { name: '加仑(美)', symbol: 'gal', toBase: 3.78541 },
  { name: '加仑(英)', symbol: 'gal(UK)', toBase: 4.54609 },
  { name: '品脱', symbol: 'pt', toBase: 0.473176 },
]

// 速度单位（基准：米/秒）
const speedUnits: UnitDefinition[] = [
  { name: '米/秒', symbol: 'm/s', toBase: 1 },
  { name: '千米/时', symbol: 'km/h', toBase: 0.277778 },
  { name: '英里/时', symbol: 'mph', toBase: 0.44704 },
  { name: '节', symbol: 'kn', toBase: 0.514444 },
]

// 汇率（基准：人民币）- 固定汇率
const currencyRates: Record<string, number> = {
  CNY: 1,
  USD: 0.14,
  EUR: 0.13,
  JPY: 21.0,
  GBP: 0.11,
  HKD: 1.09,
  KRW: 187.0,
}

const currencyUnits: UnitDefinition[] = Object.entries(currencyRates).map(([symbol, rate]) => ({
  name: symbol,
  symbol,
  toBase: rate,
}))

// 大写数字映射
const chineseDigits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
const chineseUnits = ['', '拾', '佰', '仟']
const chineseSections = ['', '万', '亿', '兆']

// 数字转大写
const toChineseNumber = (num: number): string => {
  if (num === 0) return '零'
  if (num < 0) return '负' + toChineseNumber(-num)
  if (!isFinite(num)) return '无穷'

  const intPart = Math.floor(num)
  const decPart = num - intPart

  let result = ''

  // 处理整数部分
  const str = intPart.toString()
  const len = str.length
  let zeroFlag = false

  for (let i = 0; i < len; i++) {
    const digit = parseInt(str[i])
    const pos = len - i - 1
    const unitPos = pos % 4
    const sectionPos = Math.floor(pos / 4)

    if (digit === 0) {
      zeroFlag = true
      if (unitPos === 0 && sectionPos > 0) {
        result += chineseSections[sectionPos]
      }
    } else {
      if (zeroFlag) {
        result += '零'
        zeroFlag = false
      }
      result += chineseDigits[digit] + chineseUnits[unitPos]
      if (unitPos === 0 && sectionPos > 0) {
        result += chineseSections[sectionPos]
      }
    }
  }

  // 处理小数部分
  if (decPart > 0) {
    result += '点'
    const decStr = decPart.toFixed(4).slice(2).replace(/0+$/, '')
    for (const d of decStr) {
      result += chineseDigits[parseInt(d)]
    }
  }

  return result || '零'
}

export function useConverter() {
  const activeType = ref<ConverterType>('length')
  const inputValue = ref('')
  const fromUnit = ref(0)
  const toUnit = ref(1)

  // 获取当前类型的单位列表
  const currentUnits = computed((): UnitDefinition[] => {
    switch (activeType.value) {
      case 'length': return lengthUnits
      case 'weight': return weightUnits
      case 'area': return areaUnits
      case 'time': return timeUnits
      case 'volume': return volumeUnits
      case 'speed': return speedUnits
      case 'currency': return currencyUnits
      default: return []
    }
  })

  // 通用单位转换
  const convertUnit = (value: number, from: UnitDefinition, to: UnitDefinition): number => {
    const baseValue = value * from.toBase
    return baseValue / to.toBase
  }

  // 温度转换（特殊处理）
  const convertTemperature = (value: number, fromIdx: number, toIdx: number): number => {
    // 0: 摄氏度, 1: 华氏度, 2: 开尔文
    const toCelsius = [
      (v: number) => v,                    // C -> C
      (v: number) => (v - 32) * 5 / 9,     // F -> C
      (v: number) => v - 273.15,           // K -> C
    ]
    const fromCelsius = [
      (v: number) => v,                    // C -> C
      (v: number) => v * 9 / 5 + 32,       // C -> F
      (v: number) => v + 273.15,           // C -> K
    ]

    const celsius = toCelsius[fromIdx](value)
    return fromCelsius[toIdx](celsius)
  }

  // 进制转换
  const convertRadix = (value: string, fromBase: number, toBase: number): string => {
    try {
      const decimal = parseInt(value, fromBase)
      if (isNaN(decimal)) return 'Error'
      return decimal.toString(toBase).toUpperCase()
    } catch {
      return 'Error'
    }
  }

  // 计算转换结果
  const result = computed((): string => {
    const val = parseFloat(inputValue.value)
    if (isNaN(val) && activeType.value !== 'radix' && activeType.value !== 'chinese') {
      return ''
    }

    switch (activeType.value) {
      case 'temperature': {
        const res = convertTemperature(val, fromUnit.value, toUnit.value)
        return isFinite(res) ? res.toFixed(2) : 'Error'
      }
      case 'radix': {
        const bases = [2, 8, 10, 16]
        return convertRadix(inputValue.value, bases[fromUnit.value], bases[toUnit.value])
      }
      case 'chinese': {
        return toChineseNumber(val)
      }
      default: {
        const units = currentUnits.value
        if (units.length === 0) return ''
        const res = convertUnit(val, units[fromUnit.value], units[toUnit.value])
        return isFinite(res) ? res.toPrecision(8).replace(/\.?0+$/, '') : 'Error'
      }
    }
  })

  // 切换类型时重置
  const setType = (type: ConverterType) => {
    activeType.value = type
    inputValue.value = ''
    fromUnit.value = 0
    toUnit.value = 1
  }

  // 交换单位
  const swapUnits = () => {
    const temp = fromUnit.value
    fromUnit.value = toUnit.value
    toUnit.value = temp
  }

  return {
    activeType,
    inputValue,
    fromUnit,
    toUnit,
    currentUnits,
    result,
    setType,
    swapUnits,
    converterCategories,
    toChineseNumber,
  }
}
