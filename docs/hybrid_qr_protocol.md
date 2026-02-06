# Hybrid Binary QR Protocol Design

## 1. 背景与目标
**背景**：
当前 QR 同步协议依赖 JSON 字符串。若需同步桌面壁纸（图片），使用 Base64 编码会导致体积膨胀 33%，严重浪费有限的二维码容量。

**目标**：
实现 **"Hybrid Structure" (混合结构)**，允许在同一个 QR Payload 中混合存储 **JSON 配置数据** 和 **原始二进制图片数据 (Raw Bytes)**，实现 0% 体积膨胀。

## 2. 前提条件
1.  **Byte Mode Only**：全链路强制使用 QR Byte Mode (8-bit)。
2.  **WebP Compression**：图片必须预处理为 WebP 格式以减小体积。
3.  **Multipart Support**：底层必须支持多帧分片（已在 Phase 2 完成）。

## 3. 理论架构

### 3.1 混合 Payload 结构
我们将 Payload 分为三部分：**协议头**、**JSON 区**、**二进制附件区**。

```
offset: 0       1       3                       N
      ┌───────┬───────┬───────────────────────┬──────────────────────────┐
      │ Header│ JSON  │      JSON Data        │    Binary Attachment     │
      │ (0x03)│ Len   │      (Gzipped)        │      (Raw WebP Bytes)    │
      └───────┴───────┴───────────────────────┴──────────────────────────┘
      1 Byte   2 Bytes       Var Length               Var Length
```

*   **Header**: `0x03` (表明这是 Hybrid 协议)。
*   **JSON Len**: 2字节无符号整数 (大端序)，表示 JSON 数据的长度。
*   **JSON Data**: 配置数据的 Gzip 压缩流。
*   **Binary Attachment**: 剩余所有字节即为图片数据。

### 3.2 逻辑流程

#### 编码 (Encoding)
1.  准备图片：Resize -> WebP -> `Uint8Array`。
2.  准备配置：`settings` 对象，将 `wallpaperImage` 字段设为 null 或占位符。
3.  序列化配置：JSON Stringify -> Gzip -> `jsonBytes`。
4.  构建 Buffer：
    *   写入 `0x03`。
    *   写入 `jsonBytes.length` (2 bytes)。
    *   写入 `jsonBytes`。
    *   写入 `imageBytes`。
5.  输出：`Uint8Array` 交给 Worker 进行 Multipart 分片。

#### 解码 (Decoding)
1.  Worker 接收并重组多帧数据 -> `fullBlob`。
2.  读取 Header：如果是 `0x03`：
3.  解析长度：读取 offset 1-2，得到 `jsonLen`。
4.  提取 JSON：切片 offset 3 到 `3 + jsonLen` -> Gunzip -> Parse JSON -> 得到 `settings`。
5.  提取图片：切片 `3 + jsonLen` 到 结尾 -> 得到 `imageBlob`。
6.  合并：将 `imageBlob` 转为 ObjectURL 或 Base64 (仅在内存中)，赋值给 `settings.wallpaperImage`。
7.  返回前端。

## 4. 关键代码实现 (伪代码)

### 4.1 协议常量
```typescript
// src/components/QRSync/utils/binary-codec.ts
export enum ProtocolHeader {
  PLAIN = 0x01,
  ENCRYPTED = 0x02,
  HYBRID = 0x03,  // [NEW] Hybrid Mode
  MULTIPART = 0xFF
}
```

### 4.2 编码器 (Encoder)
```typescript
export function encodeHybrid(
  jsonStr: string, 
  attachment: Uint8Array
): Uint8Array {
  // 1. Compress JSON
  const jsonBytes = gzipSync(strToU8(jsonStr));
  const jsonLen = jsonBytes.length;

  if (jsonLen > 65535) throw new Error("JSON too large");

  // 2. Allocate Buffer
  const totalLen = 1 + 2 + jsonLen + attachment.length;
  const buffer = new Uint8Array(totalLen);
  const view = new DataView(buffer.buffer);

  // 3. Write
  buffer[0] = ProtocolHeader.HYBRID;
  view.setUint16(1, jsonLen, false); // Big Endian
  buffer.set(jsonBytes, 3);
  buffer.set(attachment, 3 + jsonLen);

  return buffer;
}
```

### 4.3 解码器 (Decoder)
```typescript
export function decodeHybrid(data: Uint8Array): HybridResult {
  const view = new DataView(data.buffer, data.byteOffset);
  
  // 1. Read JSON Length
  const jsonLen = view.getUint16(1, false);

  // 2. Extract JSON
  const jsonBytes = data.subarray(3, 3 + jsonLen);
  const jsonStr = strFromU8(gunzipSync(jsonBytes));

  // 3. Extract Attachment
  const attachment = data.subarray(3 + jsonLen);

  return {
    json: jsonStr,
    attachment: attachment
  };
}
```

## 5. 优势总结
1.  **极致压缩**：图片数据 0 overhead。
2.  **结构清晰**：Header 分离，解析极其快速。
3.  **向后兼容**：新协议 `0x03` 与旧协议互不冲突。
