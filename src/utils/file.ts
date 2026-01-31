/**
 * 通用文件处理工具
 */

/**
 * 触发浏览器下载文件
 * @param filename 文件名
 * @param content 文本内容
 * @param type MIME类型，默认 application/json
 */
export function downloadFile(
  filename: string,
  content: string,
  type: string = 'application/json'
) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 读取并解析 JSON 文件
 * @param file 选中的文件
 */
export function readJsonFile<T = any>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    // 基础类型检查
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      // 宽松一点，只警告不报错，或者直接报错
      console.warn('[File] 文件类型可能不匹配:', file.type)
    }

    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const result = e.target?.result
        if (typeof result !== 'string') {
          throw new Error('文件读取结果不是字符串')
        }
        const data = JSON.parse(result)
        resolve(data)
      } catch (err) {
        reject(new Error('JSON 解析失败: 文件格式错误'))
      }
    }

    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file) // 默认 UTF-8
  })
}
