/**
 * export.ts
 * 导出功能工具函数
 */

import { getImageUrl } from './db'

// Helper: Convert Blob URL to Base64
async function blobUrlToBase64(blobUrl: string): Promise<string> {
  try {
    const response = await fetch(blobUrl)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to convert blob to base64:', error)
    return blobUrl // Fallback to original if failed
  }
}

/**
 * 处理 Markdown 内容以供导出
 * 将 lime-image:// 和 blob: URL 转换为 base64
 */
export const processMarkdownForExport = async (markdown: string): Promise<string> => {
  if (!markdown) return ''

  let result = markdown

  // 1. 处理 lime-image:// 协议 URL
  const limeImageRegex = /!\[([^\]]*)\]\((lime-image:\/\/([^)]+))\)/g
  const limeImageMatches: { fullMatch: string; alt: string; imageId: string }[] = []
  let match
  while ((match = limeImageRegex.exec(markdown)) !== null) {
    limeImageMatches.push({ fullMatch: match[0], alt: match[1], imageId: match[3] })
  }

  // 并行获取图片并转换
  await Promise.all(
    limeImageMatches.map(async ({ fullMatch, alt, imageId }) => {
      try {
        const blobUrl = await getImageUrl(imageId)
        if (blobUrl) {
          const base64 = await blobUrlToBase64(blobUrl)
          result = result.replace(fullMatch, `![${alt}](${base64})`)
        }
      } catch (error) {
        console.error(`Failed to export image ${imageId}:`, error)
      }
    })
  )

  // 2. 处理 blob: URL（兼容旧格式）
  const blobUrls = new Set<string>()
  const tempRegex = /!\[.*?\]\((blob:.*?)\)/g
  while ((match = tempRegex.exec(markdown)) !== null) {
    blobUrls.add(match[1])
  }

  const urlMap = new Map<string, string>()
  await Promise.all(
    Array.from(blobUrls).map(async url => {
      const base64 = await blobUrlToBase64(url)
      urlMap.set(url, base64)
    })
  )

  urlMap.forEach((base64, url) => {
    result = result.split(url).join(base64)
  })

  return result
}

/**
 * 将字符串内容导出为文件下载
 * @param filename 文件名（包含后缀）
 * @param content 文件内容
 * @param mimeType MIME类型
 */
export const downloadFile = (
  filename: string,
  content: string,
  mimeType: string = 'text/plain'
) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename

  // 必须添加到 body 才能在 Firefox 中生效
  document.body.appendChild(link)
  link.click()

  // 清理
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 从 Markdown 内容中去除标记，提取纯文本
 * (简单实现，主要去除常见的 MD 符号)
 * @param markdown Markdown 字符串
 */
export const stripMarkdown = (markdown: string): string => {
  if (!markdown) return ''

  let text = markdown

  // 1. 标题 (#, ##, ...)
  text = text.replace(/^#+\s+/gm, '')

  // 2. 粗体/斜体 (**, *, __, _)
  text = text.replace(/(\*\*|__)(.*?)\1/g, '$2')
  text = text.replace(/(\*|_)(.*?)\1/g, '$2')

  // 3. 链接 [text](url) -> text (url) 或只是 text
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')

  // 4. 图片 ![alt](url) -> [图片: alt]
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '[图片: $1]')

  // 5. 代码块 (```...```) -> 保留内容
  text = text.replace(/```[\s\S]*?```/g, match => {
    return match.replace(/^```.*$/gm, '')
  })

  // 6. 行内代码 (`...`)
  text = text.replace(/`([^`]+)`/g, '$1')

  // 7. 列表 (*, -, +)
  text = text.replace(/^[\*\-\+]\s+/gm, '• ')

  // 8. 引用 (>)
  text = text.replace(/^>\s+/gm, '')

  // 9. 分割线 (---, ***)
  text = text.replace(/^[-*_]{3,}\s*$/gm, '-------------------')

  return text.trim()
}
