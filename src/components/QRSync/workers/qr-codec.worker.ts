/**
 * QR 编解码 Web Worker
 * 将计算密集型操作移至后台线程，保持 UI 流畅
 */

import { encode, decode, MAX_QR_CHARS } from '../utils/qr-codec'
import {
  encrypt,
  decrypt,
  packEncryptedData,
  unpackEncryptedData,
  ERROR_INVALID_PASSWORD
} from '../utils/crypto'
import { encode as encodeQR } from 'uqr'
import type { WorkerRequest, WorkerResponse } from './types'

// Worker 消息处理
self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const request = e.data

  try {
    switch (request.type) {
      case 'encode':
        await handleEncode(request)
        break

      case 'decode':
        await handleDecode(request)
        break

      case 'generateQR':
        handleGenerateQR(request)
        break

      default:
        // @ts-ignore
        sendError(request.id, `未知的请求类型`)
    }
  } catch (error: any) {
    sendError(request.id, error.message || '处理失败')
  }
}

// 处理编码请求
async function handleEncode(request: WorkerRequest & { type: 'encode' }) {
  // 1. 基础编码 (Minify + Serialize)
  const result = encode(request.settings, request.iconConfig, request.mode)

  // 2. 如果包含密码，进行加密处理
  if (request.password) {
    // Encrypt: Gzip -> Encrypt
    const encrypted = await encrypt(result.payload, request.password)
    const packed = packEncryptedData(encrypted)

    // 更新 Payload
    const finalPayload = JSON.stringify({
      v: 1,
      t: Date.now(),
      m: request.mode,
      e: true,
      d: packed
    })

    result.payload = finalPayload
    result.size = finalPayload.length
    // 加密后重新检查大小限制
    // 注意：isOverLimit 在 encode 中已经根据 MAX_QR_CHARS 计算过，但加密后 size 会变，需重新判断
    result.isOverLimit = result.size > MAX_QR_CHARS
  }

  const response: WorkerResponse = {
    type: 'encode',
    id: request.id,
    result
  }

  self.postMessage(response)
}

// 处理解码请求
async function handleDecode(request: WorkerRequest & { type: 'decode' }) {
  let payloadStr = request.payload

  // 1. 尝试解析 JSON 检查是否加密
  try {
    const rawObj = JSON.parse(payloadStr)
    if (rawObj.e === true) {
      // 需要密码
      if (!request.password) {
        sendError(request.id, 'REQUIRED_PASSWORD')
        return
      }

      // 解密流程
      try {
        const encryptedData = unpackEncryptedData(rawObj.d)
        // Decrypt: Decrypt -> Gunzip
        payloadStr = await decrypt(encryptedData, request.password)
      } catch (e: any) {
        if (e.message === ERROR_INVALID_PASSWORD) {
          sendError(request.id, 'INVALID_PASSWORD')
        } else {
          sendError(request.id, 'DECRYPTION_FAILED')
        }
        return
      }
    }
  } catch (e) {
    // 非 JSON 格式或解析失败，交给 decode 处理（它有自己的错误处理）
  }

  // 2. 常规解码 (Un-minify)
  const result = decode(payloadStr)

  const response: WorkerResponse = {
    type: 'decode',
    id: request.id,
    result
  }

  self.postMessage(response)
}

// 处理 QR 矩阵生成请求
function handleGenerateQR(request: WorkerRequest & { type: 'generateQR' }) {
  const qr = encodeQR(request.data, { ecc: request.ecc })

  const response: WorkerResponse = {
    type: 'generateQR',
    id: request.id,
    result: {
      data: qr.data,
      size: qr.size
    }
  }

  self.postMessage(response)
}

// 发送错误响应
function sendError(id: string, error: string) {
  const response: WorkerResponse = {
    type: 'error',
    id,
    error
  }

  self.postMessage(response)
}
