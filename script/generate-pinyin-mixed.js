// script/generate-pinyin-mixed.js
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pinyin from 'pinyin'

// --- 1. 兼容性修复：处理 pinyin 库在 ESM 中的导出问题 ---
// 如果 pinyin 是对象且有 default 属性，则使用 default，否则直接使用 pinyin
const pyFunc = pinyin.default || pinyin

// --- 构建 __dirname ---
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const RAW_FILE = path.join(__dirname, 'chars.txt')
const OUTPUT_FILE = path.join(__dirname, '../src/utils/pinyinDict.ts')

console.log('正在处理汉字频率表...')

// 2. 读取文件
const content = fs.readFileSync(RAW_FILE, 'utf-8')

// --- 3. 数据清洗修复：跳过文件头部的说明文字 ---
// 真正的频率表通常以 "的" (第一高频字) 开始
// 如果找不到"的"，就从头开始（防止文件已经是清洗过的）
const startMarker = '的'
const startIndex = content.indexOf(startMarker)
const cleanContent = startIndex > -1 ? content.slice(startIndex) : content

console.log(
  startIndex > -1
    ? `✅ 已跳过文件头部说明，从第 ${startIndex} 字符开始解析`
    : '⚠️ 未找到起始标记，全量解析'
)

// 提取汉字
const allChars = cleanContent.match(/[\u4e00-\u9fa5]/g) || []
// 去重
const uniqueChars = Array.from(new Set(allChars))

console.log(`共提取到 ${uniqueChars.length} 个汉字。`)
// 验证：这里应该输出 "的一是在..." 而不是 "常用汉字..."
console.log(`Top 10 (验证): ${uniqueChars.slice(0, 10).join('')}`)

if (uniqueChars[0] !== '的') {
  console.warn('⚠️ 警告：Top 1 不是 "的"，请检查 script/chars.txt 内容是否包含非必要的头部说明文字')
}

// 4. 设定阈值：前 1000 个字走 VIP 通道 (覆盖 92%)
const VIP_LIMIT = 1000

const vipMap = {}
const commonBucket = {}

// 初始化 buckets
for (let i = 97; i <= 122; i++) {
  commonBucket[String.fromCharCode(i)] = []
}

// 5. 开始分流
uniqueChars.forEach((char, index) => {
  // 使用兼容后的 pyFunc
  const pys = pyFunc(char, {
    style: pyFunc.STYLE_FIRST_LETTER,
    heteronym: true,
  })

  const letters = new Set()
  pys.forEach(item => {
    if (item[0] && /^[a-z]$/i.test(item[0])) {
      letters.add(item[0].toLowerCase())
    }
  })

  if (letters.size === 0) return

  if (index < VIP_LIMIT) {
    // === VIP 通道 ===
    vipMap[char] = Array.from(letters)[0]
  } else {
    // === 普通通道 ===
    letters.forEach(letter => {
      if (commonBucket[letter]) {
        commonBucket[letter].push(char)
      }
    })
  }
})

// 6. 生成 TypeScript 代码
let tsCode = `/**
 * 🚀 混合索引拼音字典 (Auto-generated)
 * 数据源：常用汉字频率表 (Top ${VIP_LIMIT} 覆盖率 ~92%)
 */

// 1. 高频字映射 (O(1) 查找)
export const VIP_MAP: Record<string, string> = ${JSON.stringify(vipMap)};

// 2. 低频字倒排索引 (线性扫描)
export const COMMON_DICT: Record<string, string> = {\n`

Object.keys(commonBucket).forEach(key => {
  if (commonBucket[key].length > 0) {
    tsCode += `  ${key}: '${commonBucket[key].join('')}',\n`
  }
})

tsCode += '};\n'

fs.writeFileSync(OUTPUT_FILE, tsCode)
console.log(`✅ 字典生成完毕！写入: ${OUTPUT_FILE}`)
