import imageCompression from 'browser-image-compression'

export interface ImageProcessResult {
  blob: Blob
  info: {
    originalSize: number
    compressedSize: number
    compressed: boolean
  }
}

export interface CompressionOptions {
  enabled: boolean
  maxSizeMB: number
  maxWidthOrHeight: number
  onProgress?: (progress: number) => void
}

/**
 * Process image with optional compression using Web Worker
 */
export async function processImageWithWorker(
  file: File,
  options: CompressionOptions
): Promise<ImageProcessResult> {
  // If compression is disabled, return original file
  if (!options.enabled) {
    return {
      blob: file,
      info: {
        originalSize: file.size,
        compressedSize: file.size,
        compressed: false,
      },
    }
  }

  const compressionConfig = {
    maxSizeMB: options.maxSizeMB || 1,
    maxWidthOrHeight: options.maxWidthOrHeight || 1200,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.8,
    onProgress: options.onProgress,
  }

  try {
    const compressedBlob = await imageCompression(file, compressionConfig)

    return {
      blob: compressedBlob,
      info: {
        originalSize: file.size,
        compressedSize: compressedBlob.size,
        compressed: true,
      },
    }
  } catch (error) {
    console.warn('Image compression failed, using original file:', error)
    // Fallback to original file on failure
    return {
      blob: file,
      info: {
        originalSize: file.size,
        compressedSize: file.size,
        compressed: false,
      },
    }
  }
}
