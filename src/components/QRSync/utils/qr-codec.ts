/**
 * QR 二维码编解码工具
 * 用于配置数据的压缩、编码、解码、校验
 */

// ============ 类型定义 ============

/** 导出模式 */
export type ExportMode = 'theme' | 'full' | 'custom'

/** 二维码数据协议 */
export interface QRSyncPayload {
  v: number              // 协议版本号
  t: number              // 生成时间戳
  m: ExportMode          // 导出模式
  d: Record<string, any> // 配置数据（短键名）
}

/** 编码结果 */
export interface EncodeResult {
  payload: string        // JSON 字符串
  size: number           // 字符数
  isOverLimit: boolean   // 是否超限
}

/** 解码结果 */
export interface DecodeResult {
  success: boolean
  data?: QRSyncPayload
  error?: string
}

// ============ 常量 ============

/** 协议版本 */
export const PROTOCOL_VERSION = 1

/** 二维码容量安全阈值 */
export const MAX_QR_CHARS = 2000

// ============ 短键名映射 ============

/** Settings 键名映射 (长 -> 短) */
const SETTINGS_KEY_MAP: Record<string, string> = {
  // General
  generalOpenInNewTab: 'ont',

  // Clock
  clockShow: 'sc',

  // Shortcuts
  shortcutsShow: 'ss',

  // Todo
  todoShow: 'st',
  todoDefaultCollapsed: 'tdc',
  todoWidth: 'tw',
  todoListMaxHeight: 'tlmh',

  // Wallpaper
  wallpaperDailyEnabled: 'dw',
  wallpaperBlur: 'wb',
  wallpaperMask: 'wm',

  // Folder
  folderAutoCleanEmpty: 'def',
  folderPreviewMode: 'fpm',
  folderInnerSpacing: 'fis',
  folderCompressLarge: 'clf',
  folderDefaultMode: 'dfm',
  folderSmartSuggestion: 'esfs',

  // Layout
  layoutPreset: 'dp',
  layoutGridRows: 'gr',
  layoutGridCols: 'gc',
  layoutGridGapX: 'gx',
  layoutGridGapY: 'gy',
  layoutPaddingTop: 'lpt',
  layoutGap: 'lg',

  // SearchBar
  searchBarShow: 'sb',
  searchBarShowIcon: 'si',
  searchBarWidth: 'sbw',
  searchBarHeight: 'sbh',
  searchBarRadius: 'sbr',
  searchBarOpacity: 'sbo',

  // NotePad
  notePadShow: 'sn',
  notePadWidth: 'npw',
  notePadHeight: 'nph',
  notePadEditorMode: 'npem',
  notePadImageCompress: 'ci',
  notePadImageMaxSizeMB: 'mis',
  notePadImageMaxWidth: 'miw',

  // Weather
  weatherAutoLocation: 'wal',
  weatherCity: 'wc',

  // Pomodoro
  pomodoroWorkMinutes: 'pwm',
  pomodoroBreakMinutes: 'pbm',
  pomodoroAutoBreak: 'pab',
  pomodoroAutoWork: 'paw',
  pomodoroIntent: 'pi',
  
  // Calculator
  calculatorShow: 'sca',

  // Poem
  poemShow: 'sdp',
  poemFetchOnline: 'dpo',
}

/** IconConfig 键名映射 (长 -> 短) */
const ICON_KEY_MAP: Record<string, string> = {
  hideLabel: 'hl',
  boxSize: 'bs',
  iconScale: 'is',
  radius: 'rd',
  opacity: 'op',
  showShadow: 'shw'
}

/** 主题模式包含的 Settings 键 */
const THEME_KEYS = [
  'wallpaperBlur', 'wallpaperMask',
  'layoutGridRows', 'layoutGridCols', 'layoutGridGapX', 'layoutGridGapY',
  'layoutPaddingTop', 'layoutGap', 'layoutPreset',
  'searchBarWidth', 'searchBarHeight', 'searchBarRadius', 'searchBarOpacity'
]

/** 生成反向映射 (短 -> 长) */
const createReverseMap = (map: Record<string, string>) =>
  Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k]))

const SETTINGS_REVERSE_MAP = createReverseMap(SETTINGS_KEY_MAP)
const ICON_REVERSE_MAP = createReverseMap(ICON_KEY_MAP)

// ============ 安全校验 Schema ============

/** 字段类型定义 */
type FieldType = 'boolean' | 'number' | 'string'

/** 字段校验规则 */
interface FieldSchema {
  type: FieldType
  min?: number        // 数值最小值
  max?: number        // 数值最大值
  maxLength?: number  // 字符串最大长度
  enum?: string[]     // 枚举值白名单
}

/** Settings 字段 Schema (白名单 + 类型 + 范围) */
const SETTINGS_SCHEMA: Record<string, FieldSchema> = {
  // General
  generalOpenInNewTab: { type: 'boolean' },

  // Clock
  clockShow: { type: 'boolean' },

  // Shortcuts
  shortcutsShow: { type: 'boolean' },

  // Todo
  todoShow: { type: 'boolean' },
  todoDefaultCollapsed: { type: 'boolean' },
  todoWidth: { type: 'number', min: 100, max: 800 },
  todoListMaxHeight: { type: 'number', min: 100, max: 1000 },

  // Wallpaper
  wallpaperDailyEnabled: { type: 'boolean' },
  wallpaperBlur: { type: 'number', min: 0, max: 50 },
  wallpaperMask: { type: 'number', min: 0, max: 100 },

  // Folder
  folderAutoCleanEmpty: { type: 'boolean' },
  folderPreviewMode: { type: 'string', enum: ['2x2', '3x3', 'list'] },
  folderInnerSpacing: { type: 'number', min: 0, max: 50 },
  folderCompressLarge: { type: 'boolean' },
  folderDefaultMode: { type: 'string', enum: ['2x2', '3x3', 'list'] },
  folderSmartSuggestion: { type: 'boolean' },

  // Layout
  layoutPreset: { type: 'string', enum: ['compact', 'standard', 'spacious', 'custom'] },
  layoutGridRows: { type: 'number', min: 1, max: 10 },
  layoutGridCols: { type: 'number', min: 1, max: 20 },
  layoutGridGapX: { type: 'number', min: 0, max: 200 },
  layoutGridGapY: { type: 'number', min: 0, max: 200 },
  layoutPaddingTop: { type: 'number', min: 0, max: 500 },
  layoutGap: { type: 'number', min: 0, max: 200 },

  // SearchBar
  searchBarShow: { type: 'boolean' },
  searchBarShowIcon: { type: 'boolean' },
  searchBarWidth: { type: 'number', min: 10, max: 100 },
  searchBarHeight: { type: 'number', min: 20, max: 200 },
  searchBarRadius: { type: 'number', min: 0, max: 100 },
  searchBarOpacity: { type: 'number', min: 0, max: 100 },

  // NotePad
  notePadShow: { type: 'boolean' },
  notePadWidth: { type: 'number', min: 100, max: 800 },
  notePadHeight: { type: 'number', min: 100, max: 800 },
  notePadEditorMode: { type: 'string', enum: ['rich', 'markdown', 'plain'] },
  notePadImageCompress: { type: 'boolean' },
  notePadImageMaxSizeMB: { type: 'number', min: 0.1, max: 10 },
  notePadImageMaxWidth: { type: 'number', min: 100, max: 4000 },

  // Weather
  weatherAutoLocation: { type: 'boolean' },
  weatherCity: { type: 'string', maxLength: 50 },

  // Pomodoro
  pomodoroWorkMinutes: { type: 'number', min: 1, max: 120 },
  pomodoroBreakMinutes: { type: 'number', min: 1, max: 60 },
  pomodoroAutoBreak: { type: 'boolean' },
  pomodoroAutoWork: { type: 'boolean' },
  pomodoroIntent: { type: 'string', maxLength: 100 },

  // Calculator
  calculatorShow: { type: 'boolean' },

  // Poem
  poemShow: { type: 'boolean' },
  poemFetchOnline: { type: 'boolean' },
}

/** IconConfig 字段 Schema */
const ICON_SCHEMA: Record<string, FieldSchema> = {
  hideLabel: { type: 'boolean' },
  boxSize: { type: 'number', min: 40, max: 200 },
  iconScale: { type: 'number', min: 20, max: 100 },
  radius: { type: 'number', min: 0, max: 50 },
  opacity: { type: 'number', min: 0, max: 100 },
  showShadow: { type: 'boolean' }
}

// ============ 安全净化函数 ============

/** 净化结果 */
interface SanitizeResult {
  data: Record<string, any>
  dropped: string[]  // 被丢弃的字段
}

/**
 * 校验单个字段值
 * @returns 校验通过返回 true，否则返回 false
 */
function validateField(value: any, schema: FieldSchema): boolean {
  // Layer 2: 类型校验
  if (typeof value !== schema.type) {
    return false
  }

  // Layer 3: 范围校验
  if (schema.type === 'number') {
    if (schema.min !== undefined && value < schema.min) return false
    if (schema.max !== undefined && value > schema.max) return false
  }

  if (schema.type === 'string') {
    if (schema.maxLength !== undefined && value.length > schema.maxLength) return false
    if (schema.enum && !schema.enum.includes(value)) return false
  }

  return true
}

/**
 * 净化配置对象 (三层安检)
 * Layer 1: 白名单过滤 - 只保留 schema 中定义的字段
 * Layer 2: 类型校验 - 确保值类型正确
 * Layer 3: 范围校验 - 确保数值在合理范围内
 */
function sanitize(
  input: Record<string, any>,
  schema: Record<string, FieldSchema>
): SanitizeResult {
  const data: Record<string, any> = {}
  const dropped: string[] = []

  for (const [key, value] of Object.entries(input)) {
    // Layer 1: 白名单检查
    const fieldSchema = schema[key]
    if (!fieldSchema) {
      dropped.push(`${key} (未知字段)`)
      continue
    }

    // Layer 2 & 3: 类型和范围校验
    if (!validateField(value, fieldSchema)) {
      dropped.push(`${key} (校验失败)`)
      continue
    }

    // 通过所有检查，保留字段
    data[key] = value
  }

  return { data, dropped }
}

// ============ 压缩/解压函数 ============

/** 压缩对象键名 (长 -> 短) */
function compressKeys(
  obj: Record<string, any>,
  keyMap: Record<string, string>
): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const shortKey = keyMap[key] || key
    result[shortKey] = value
  }
  return result
}

/** 解压对象键名 (短 -> 长) */
function decompressKeys(
  obj: Record<string, any>,
  reverseMap: Record<string, string>
): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const longKey = reverseMap[key] || key
    result[longKey] = value
  }
  return result
}

// ============ 编码函数 ============

/**
 * 编码配置数据为 QR 字符串
 */
export function encode(
  settings: Record<string, any>,
  iconConfig: Record<string, any>,
  mode: ExportMode = 'full'
): EncodeResult {
  console.group('[QR Encode] 开始编码')
  console.log('模式:', mode)
  console.log('原始 settings 字段数:', Object.keys(settings).length)
  console.log('原始 iconConfig 字段数:', Object.keys(iconConfig).length)

  // 1. 根据模式筛选数据
  let settingsToEncode = settings
  if (mode === 'theme') {
    settingsToEncode = Object.fromEntries(
      Object.entries(settings).filter(([k]) => THEME_KEYS.includes(k))
    )
    console.log('主题模式筛选后字段数:', Object.keys(settingsToEncode).length)
  }

  // 2. 压缩键名
  const compressedSettings = compressKeys(settingsToEncode, SETTINGS_KEY_MAP)
  const compressedIcon = compressKeys(iconConfig, ICON_KEY_MAP)
  console.log('压缩后 settings:', compressedSettings)
  console.log('压缩后 iconConfig:', compressedIcon)

  // 3. 构建 payload
  const payload: QRSyncPayload = {
    v: PROTOCOL_VERSION,
    t: Date.now(),
    m: mode,
    d: {
      s: compressedSettings,
      i: compressedIcon
    }
  }

  // 4. 序列化
  const jsonStr = JSON.stringify(payload)

  const result = {
    payload: jsonStr,
    size: jsonStr.length,
    isOverLimit: jsonStr.length > MAX_QR_CHARS
  }

  console.log('编码结果大小:', result.size, '字符')
  console.log('是否超限:', result.isOverLimit, `(阈值: ${MAX_QR_CHARS})`)
  console.log('完整 payload:', jsonStr)
  console.groupEnd()

  return result
}

// ============ 解码函数 ============

/**
 * 解码 QR 字符串为配置数据
 */
export function decode(jsonStr: string): DecodeResult {
  console.group('[QR Decode] 开始解码')
  console.log('输入字符串长度:', jsonStr.length)
  console.log('输入内容前100字符:', jsonStr.substring(0, 100))

  try {
    // 1. 解析 JSON
    const payload = JSON.parse(jsonStr) as QRSyncPayload
    console.log('JSON 解析成功')
    console.log('协议版本:', payload.v)
    console.log('时间戳:', payload.t, new Date(payload.t).toLocaleString())
    console.log('模式:', payload.m)

    // 2. 基础校验
    const validation = validate(payload)
    if (!validation.valid) {
      console.error('校验失败:', validation.error)
      console.groupEnd()
      return { success: false, error: validation.error }
    }
    console.log('基础校验通过')

    // 3. 解压键名
    const { s, i } = payload.d as { s: Record<string, any>; i: Record<string, any> }
    console.log('压缩数据 s 字段数:', s ? Object.keys(s).length : 0)
    console.log('压缩数据 i 字段数:', i ? Object.keys(i).length : 0)

    const rawSettings = decompressKeys(s || {}, SETTINGS_REVERSE_MAP)
    const rawIconConfig = decompressKeys(i || {}, ICON_REVERSE_MAP)
    console.log('解压后 settings:', rawSettings)
    console.log('解压后 iconConfig:', rawIconConfig)

    // 4. 安全净化 (三层安检)
    const settingsResult = sanitize(rawSettings, SETTINGS_SCHEMA)
    const iconResult = sanitize(rawIconConfig, ICON_SCHEMA)

    console.log('净化后 settings 字段数:', Object.keys(settingsResult.data).length)
    console.log('净化后 iconConfig 字段数:', Object.keys(iconResult.data).length)

    // 记录被丢弃的字段 (用于调试)
    const allDropped = [...settingsResult.dropped, ...iconResult.dropped]
    if (allDropped.length > 0) {
      console.warn('已丢弃不安全字段:', allDropped)
    }

    payload.d = {
      settings: settingsResult.data,
      iconConfig: iconResult.data
    }

    console.log('解码成功')
    console.groupEnd()
    return { success: true, data: payload }
  } catch (e: any) {
    console.error('解码异常:', e.message || e)
    console.groupEnd()
    return { success: false, error: '无效的 JSON 格式' }
  }
}

// ============ 校验函数 ============

interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * 校验 payload 数据结构
 */
export function validate(payload: any): ValidationResult {
  // 版本号
  if (typeof payload.v !== 'number' || payload.v < 1) {
    return { valid: false, error: '无效的协议版本' }
  }

  // 时间戳
  if (typeof payload.t !== 'number') {
    return { valid: false, error: '缺少时间戳' }
  }

  // 模式
  if (!['theme', 'full', 'custom'].includes(payload.m)) {
    return { valid: false, error: '无效的导出模式' }
  }

  // 数据对象
  if (!payload.d || typeof payload.d !== 'object') {
    return { valid: false, error: '缺少配置数据' }
  }

  return { valid: true }
}
