/**
 * QR Worker 消息类型定义
 */

import type { ExportMode, EncodeResult, DecodeResult } from '../utils/qr-codec'

// ============ 请求消息 ============

export interface EncodeRequest {
  type: 'encode'
  id: string
  settings: Record<string, any>
  iconConfig: Record<string, any>
  mode: ExportMode
  password?: string
}

export interface DecodeRequest {
  type: 'decode'
  id: string
  payload: string
  password?: string
}

export interface GenerateQRRequest {
  type: 'generateQR'
  id: string
  data: string
  ecc: 'L' | 'M' | 'Q' | 'H'
}

export type WorkerRequest = EncodeRequest | DecodeRequest | GenerateQRRequest

// ============ 响应消息 ============

export interface EncodeResponse {
  type: 'encode'
  id: string
  result: EncodeResult
}

export interface DecodeResponse {
  type: 'decode'
  id: string
  result: DecodeResult
}

export interface GenerateQRResponse {
  type: 'generateQR'
  id: string
  result: {
    data: boolean[][]
    size: number
  }
}

export interface ErrorResponse {
  type: 'error'
  id: string
  error: string
}

export type WorkerResponse =
  | EncodeResponse
  | DecodeResponse
  | GenerateQRResponse
  | ErrorResponse
