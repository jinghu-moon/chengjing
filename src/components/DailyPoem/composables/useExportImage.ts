/**
 * 图片导出逻辑封装
 * 使用 html-to-image 将 DOM 元素转换为图片
 */
import { ref } from 'vue'
import { toBlob, toPng } from 'html-to-image'

export function useExportImage() {
  const isExporting = ref(false)

  /**
   * 将 DOM 元素导出为 Blob
   */
  const exportAsBlob = async (element: HTMLElement | null, options: { pixelRatio?: number } = {}): Promise<Blob | null> => {
    if (!element) return null

    isExporting.value = true
    try {
      // 等待字体加载完成
      await document.fonts.ready

      // 额外等待渲染稳定
      await new Promise(resolve => setTimeout(resolve, 200))

      const blob = await toBlob(element, {
        pixelRatio: options.pixelRatio || 2, // 默认 2x 分辨率
        cacheBust: true, // 避免缓存问题
        // 过滤掉可能有问题的元素
        filter: (node) => {
          // 排除 script 标签
          if (node.tagName === 'SCRIPT') return false
          return true
        }
      })

      return blob
    } catch (error) {
      console.error('[useExportImage] 导出失败:', error)
      return null
    } finally {
      isExporting.value = false
    }
  }

  /**
   * 将 DOM 元素导出为 Data URL
   */
  const exportAsDataUrl = async (element: HTMLElement | null, options: { pixelRatio?: number } = {}): Promise<string | null> => {
    if (!element) return null

    isExporting.value = true
    try {
      await document.fonts.ready
      await new Promise(resolve => setTimeout(resolve, 200))

      const dataUrl = await toPng(element, {
        pixelRatio: options.pixelRatio || 2,
        cacheBust: true
      })

      return dataUrl
    } catch (error) {
      console.error('[useExportImage] 导出失败:', error)
      return null
    } finally {
      isExporting.value = false
    }
  }

  /**
   * 下载 Blob 为文件
   */
  const download = (blob: Blob, filename?: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `诗词卡片_${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * 调用系统分享 API
   */


  return {
    isExporting,
    exportAsBlob,
    exportAsDataUrl,
    download
  }
}
