/**
 * QR Worker 通信封装
 * 提供类型安全的 Promise 接口
 */

import { ref } from 'vue'
import type {
  WorkerRequest,
  WorkerResponse
} from '../workers/types'
import type { ExportMode, EncodeResult, DecodeResult } from '../utils/qr-codec'

// Helper for distributed Omit
type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never

// Worker 实例（懒加载单例）
let workerInstance: Worker | null = null
let pendingRequests = new Map<string, {
  resolve: (value: any) => void
  reject: (error: Error) => void
}>()

// 请求 ID 计数器
let requestId = 0

/**
 * 获取或创建 Worker 实例
 */
function getWorker(): Worker {
  if (!workerInstance) {
    // Vite 的 Worker 导入方式
    workerInstance = new Worker(
      new URL('../workers/qr-codec.worker.ts', import.meta.url),
      { type: 'module' }
    )

    // 统一消息处理
    workerInstance.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const response = e.data
      const pending = pendingRequests.get(response.id)

      if (!pending) {
        console.warn('[QR Worker] 收到未知请求的响应:', response.id)
        return
      }

      pendingRequests.delete(response.id)

      if (response.type === 'error') {
        pending.reject(new Error(response.error))
      } else {
        pending.resolve(response.result)
      }
    }

    workerInstance.onerror = (e) => {
      console.error('[QR Worker] Worker 错误:', e)
    }
  }

  return workerInstance
}

/**
 * 发送请求到 Worker
 */
function sendRequest<T>(request: DistributiveOmit<WorkerRequest, 'id'>): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = `qr-${++requestId}`
    // @ts-ignore
    const fullRequest = { ...request, id } as WorkerRequest

    pendingRequests.set(id, { resolve, reject })

    // 超时处理（10秒）
    const timeout = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id)
        reject(new Error('Worker 请求超时'))
      }
    }, 10000)

    // 清理超时
    const originalResolve = resolve
    const originalReject = reject

    pendingRequests.set(id, {
      resolve: (value) => {
        clearTimeout(timeout)
        originalResolve(value)
      },
      reject: (error) => {
        clearTimeout(timeout)
        originalReject(error)
      }
    })

    getWorker().postMessage(fullRequest)
  })
}

/**
 * QR Worker Composable
 */
export function useQRWorker() {
  const isProcessing = ref(false)

  /**
   * 编码配置数据
   */
  async function encodeAsync(
    settings: Record<string, any>,
    iconConfig: Record<string, any>,
    mode: ExportMode,
    password?: string
  ): Promise<EncodeResult> {
    isProcessing.value = true
    try {
      return await sendRequest<EncodeResult>({
        type: 'encode',
        settings,
        iconConfig,
        mode,
        password
      })
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 解码配置数据
   */
  async function decodeAsync(payload: string, password?: string): Promise<DecodeResult> {
    isProcessing.value = true
    try {
      return await sendRequest<DecodeResult>({
        type: 'decode',
        payload,
        password
      })
    } finally {
      isProcessing.value = false
    }
  }

  /**
   * 生成 QR 矩阵
   */
  async function generateQRAsync(
    data: string,
    ecc: 'L' | 'M' | 'Q' | 'H' = 'L'
  ): Promise<{ data: boolean[][]; size: number }> {
    isProcessing.value = true
    try {
      return await sendRequest<{ data: boolean[][]; size: number }>({
        type: 'generateQR',
        data,
        ecc
      })
    } finally {
      isProcessing.value = false
    }
  }

  return {
    isProcessing,
    encodeAsync,
    decodeAsync,
    generateQRAsync
  }
}

/**
 * 终止 Worker（用于清理）
 */
export function terminateQRWorker() {
  if (workerInstance) {
    workerInstance.terminate()
    workerInstance = null
    pendingRequests.clear()
  }
}
