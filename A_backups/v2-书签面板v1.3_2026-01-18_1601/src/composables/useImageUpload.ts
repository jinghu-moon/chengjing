import { ref, type Ref } from 'vue'
import { type Editor } from '@tiptap/vue-3'
import { saveImage, getImageUrl } from '../utils/db'
import { processImageWithWorker } from '../utils/imageProcessor'
import { useSettings } from './useSettings'

export function useImageUpload(editor: Ref<Editor | undefined>) {
  const { settings } = useSettings()
  const isProcessing = ref(false)
  const progress = ref(0)

  const uploadImages = async (files: FileList | File[]) => {
    if (!editor.value) return
    isProcessing.value = true
    progress.value = 0

    const fileList = Array.isArray(files) ? files : Array.from(files)
    let completedCount = 0

    for (const file of fileList) {
      if (!file.type.startsWith('image/')) continue

      try {
        // 1. Process/Compress Image
        const result = await processImageWithWorker(file, {
          enabled: settings.compressImages,
          maxSizeMB: settings.maxImageSizeMB,
          maxWidthOrHeight: settings.maxImageWidth,
          onProgress: p => {
            // Calculate overall progress if needed, for now just show current file progress
            // In a multi-file scenario, this simple progress might jump around, but acceptable for MVP
            progress.value = p
          },
        })

        // 2. Generate Unique ID
        const imageId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

        // 3. Save to IndexedDB
        await saveImage(imageId, result.blob)

        // 4. 获取 blob URL 用于即时显示
        const displayUrl = await getImageUrl(imageId)

        if (displayUrl) {
          // 5. 插入编辑器：使用 blob URL 即时显示，data-image-id 用于导出还原
          editor.value
            .chain()
            .focus()
            .insertContent({
              type: 'image',
              attrs: {
                src: displayUrl, // 即时显示用 blob URL
                'data-image-id': imageId, // 导出时根据此 ID 还原为 lime-image://
              },
            })
            .run()

          // Log savings if compressed
          if (result.info.compressed) {
            const saved = ((result.info.originalSize - result.info.compressedSize) / 1024).toFixed(
              0
            )
            console.log(`[Image] Optimize: ${saved}KB saved (${file.name})`)
          }
        }
      } catch (error) {
        console.error('Failed to upload image:', error)
      } finally {
        completedCount++
        progress.value = (completedCount / fileList.length) * 100
      }
    }

    isProcessing.value = false
    progress.value = 0
  }

  return {
    uploadImages,
    isProcessing,
    progress,
  }
}
