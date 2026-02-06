/**
 * DataSync 加密工具库
 * 提供基于 Web Crypto API 的 AES-256-GCM 加密和 PBKDF2 密钥派生
 * 包含 Gzip 压缩支持以优化 Payload 体积
 */

// ============ 常量定义 ============

// 桌面端高安全配置
export const PBKDF2_ITERATIONS = 1_000_000
export const SALT_LENGTH = 32
export const IV_LENGTH = 12
export const KEY_LENGTH = 256

// 错误信息
export const ERROR_INVALID_PASSWORD = 'INVALID_PASSWORD'
export const ERROR_DECRYPTION_FAILED = 'DECRYPTION_FAILED'

// ============ 核心接口 ============

/**
 * 加密结果
 */
export interface EncryptedData {
  salt: Uint8Array
  iv: Uint8Array
  cipherText: Uint8Array
}

// ============ 压缩工具 (Gzip) ============

/**
 * Gzip 压缩
 * @param data JSON 字符串
 */
export async function compressData(data: string): Promise<Uint8Array> {
  const stream = new Blob([data]).stream()
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(compressedStream).arrayBuffer())
}

/**
 * Gzip 解压
 * @param data 压缩后的二进制数据
 */
export async function decompressData(data: Uint8Array): Promise<string> {
  // @ts-expect-error Type mismatch with BlobPart in some TS configs
  const stream = new Blob([data]).stream()
  const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'))
  return await new Response(decompressedStream).text()
}

// ============ 密码学工具 ============

/**
 * 生成随机 Salt
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
}

/**
 * 生成随机 IV
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH))
}

/**
 * 从密码派生 AES-GCM 密钥 (PBKDF2)
 * @param password 用户密码
 * @param salt 盐值
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      // @ts-expect-error BufferSource compatibility
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * 加密数据
 * 流程: Gzip压缩 -> 派生密钥 -> AES-GCM加密
 */
export async function encrypt(data: string, password: string): Promise<EncryptedData> {
  // 1. Gzip 压缩
  const compressed = await compressData(data)

  // 2. 准备加密参数
  const salt = generateSalt()
  const iv = generateIV()
  const key = await deriveKey(password, salt)

  // 3. 执行加密
  const cipherBuffer = await crypto.subtle.encrypt(
    // @ts-expect-error BufferSource compatibility
    { name: 'AES-GCM', iv: iv },
    key,
    compressed
  )

  return {
    salt,
    iv,
    cipherText: new Uint8Array(cipherBuffer)
  }
}

/**
 * 解密数据
 * 流程: 派生密钥 -> AES-GCM解密 -> Gzip解压
 */
export async function decrypt(encrypted: EncryptedData, password: string): Promise<string> {
  try {
    // 1. 派生密钥
    const key = await deriveKey(password, encrypted.salt)

    // 2. 执行解密
    const decryptedBuffer = await crypto.subtle.decrypt(
      // @ts-expect-error BufferSource compatibility
      { name: 'AES-GCM', iv: encrypted.iv },
      key,
      encrypted.cipherText
    )

    // 3. Gzip 解压
    const decryptedData = new Uint8Array(decryptedBuffer)
    return await decompressData(decryptedData)
  } catch (e: any) {
    console.error('Decryption failed:', e)
    // 区分由密码错误导致的解密失败 (OperationError)
    if (e.name === 'OperationError') {
      throw new Error(ERROR_INVALID_PASSWORD)
    }
    throw new Error(ERROR_DECRYPTION_FAILED)
  }
}

// ============ 数据转换工具 ============

/**
 * 将加密结果打包为 Base64 字符串
 * 格式: base64(salt + iv + cipherText)
 */
export function packEncryptedData(data: EncryptedData): string {
  const totalLength = data.salt.length + data.iv.length + data.cipherText.length
  const merged = new Uint8Array(totalLength)

  merged.set(data.salt, 0)
  merged.set(data.iv, data.salt.length)
  merged.set(data.cipherText, data.salt.length + data.iv.length)

  return arrayBufferToBase64(merged)
}

/**
 * 解析 Base64 字符串为加密数据对象
 */
export function unpackEncryptedData(base64Str: string): EncryptedData {
  const buffer = base64ToArrayBuffer(base64Str)
  const array = new Uint8Array(buffer)

  // 校验长度
  if (array.length < SALT_LENGTH + IV_LENGTH) {
    throw new Error('Invalid encrypted data length')
  }

  const salt = array.slice(0, SALT_LENGTH)
  const iv = array.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const cipherText = array.slice(SALT_LENGTH + IV_LENGTH)

  return { salt, iv, cipherText }
}

// Helper: ArrayBuffer <-> Base64
function arrayBufferToBase64(buffer: Uint8Array): string {
  let binary = ''
  const len = buffer.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}
