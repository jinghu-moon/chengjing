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
  const exportAsBlob = async (element: HTMLElement | null): Promise<Blob | null> => {
    if (!element) return null

    isExporting.value = true
    try {
      // 等待字体加载完成
      await document.fonts.ready

      // 额外等待渲染稳定
      await new Promise(resolve => setTimeout(resolve, 200))

      const blob = await toBlob(element, {
        pixelRatio: 2, // 2x 分辨率
        backgroundColor: '#ffffff',
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
  const exportAsDataUrl = async (element: HTMLElement | null): Promise<string | null> => {
    if (!element) return null

    isExporting.value = true
    try {
      await document.fonts.ready
      await new Promise(resolve => setTimeout(resolve, 200))

      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
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
  const share = async (blob: Blob, title?: string): Promise<boolean> => {
    if (!navigator.share) {
      return false
    }

    try {
      const file = new File([blob], 'poetry_card.png', { type: 'image/png' })
      await navigator.share({
        files: [file],
        title: title || '诗词卡片'
      })
      return true
    } catch (error) {
      // 用户取消分享不算错误
      if ((error as Error).name === 'AbortError') {
        return false
      }
      console.error('[useExportImage] 分享失败:', error)
      return false
    }
  }

  return {
    isExporting,
    exportAsBlob,
    exportAsDataUrl,
    download,
    share
  }
}
