import { VIP_MAP, COMMON_DICT } from './pinyinDict'

/**
 * 获取单个字符的首字母
 * 混合索引策略：先查 VIP Map (O(1))，再查倒排索引 (O(N))
 */
export function getFirstLetter(char: string): string {
  // 1. ASCII 字符及非汉字直接返回 (性能优化)
  if (char < '\u4e00' || char > '\u9fa5') {
    return char.toLowerCase()
  }

  // 2. 🚀 VIP 通道：92% 的高频字在这里瞬间返回
  const vip = VIP_MAP[char]
  if (vip) return vip

  // 3. 🐢 普通通道：剩下的 8% 生僻字查倒排索引
  for (const letter in COMMON_DICT) {
    if (COMMON_DICT[letter].includes(char)) {
      return letter
    }
  }

  // 4. 没找到（特殊符号等），返回原字
  return char
}

/**
 * 将字符串转为首字母拼音
 * 例如："京东商城" -> "jdsc"
 */
export function getPinyinFirstLetters(str: string): string {
  if (!str) return ''
  let result = ''
  // 限制长度，防止处理超长文本导致 Worker 短暂卡顿 (50字通常涵盖了关键信息)
  const len = Math.min(str.length, 50)
  for (let i = 0; i < len; i++) {
    result += getFirstLetter(str[i])
  }
  return result
}
