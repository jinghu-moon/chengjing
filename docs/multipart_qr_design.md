# Binary QR Protocol Design (Byte Mode First)

## 1. Core Philosophy: "Byte Mode & Unified Headers"
To achieve maximum density and reliability, we strictly use **QR Byte Mode (8-bit)** with a **Verified Binary Header**.

- **NO** JSON wrappers.
- **NO** Base64 encoding.
- **NO** Ambiguity between Encrypted/Compressed data.

**Gain**: ~33% capacity increase vs Base64/JSON. This moves the "Single QR" threshold from ~2KB to ~2.9KB.

---

## 2. Protocol Specification (Unified Binary Header)

Each QR payload starts with a **1-byte Protocol Identifier**.

### 2.1 Protocol Identifiers

| Byte | Type | Content Structure | Description |
| :--- | :--- | :--- | :--- |
| **`0x01`** | **Single (Plain)** | `[0x01] + Gzip(JSON)` | Plain Compressed Data |
| **`0x02`** | **Single (Encrypt)** | `[0x02] + Salt(32) + IV(12) + AesGcm(Gzip(JSON))` | Encrypted Compressed Data |
| **`0xFF`** | **Multipart** | `[0xFF] + [Idx] + [Total] + [ChecksumID] + [Chunk]` | Split Payload |
| **`{`** | **Legacy** | `{"v":1...}` | Backward Compatibility |

### 2.2 Capacity Constants

```typescript
// QR Version 40, ECC L, Byte Mode = 2953 bytes max
const QR_MAX_BYTES = 2953

// 单帧安全阈值 (留 10% 余量)
const SINGLE_FRAME_LIMIT = 2650  // bytes

// 多帧 Header 开销
const MULTIPART_HEADER_SIZE = 7  // bytes

// 单个 Chunk 最大载荷
const CHUNK_PAYLOAD_SIZE = 2643  // = 2650 - 7

// 触发多帧的阈值
const MULTIPART_THRESHOLD = SINGLE_FRAME_LIMIT
```

### 2.3 Multipart Header Layout (7 Bytes)

```
Offset  Size  Field        Description
------  ----  -----------  ----------------------------------
0       1     Magic        固定 0xFF
1       1     Index        帧序号 (1-based, 1~255)
2       1     Total        总帧数 (1~255)
3       4     ChecksumID   CRC32(FullBlob) 前 4 字节
7       N     Chunk        数据分片
```

**设计决策：**
- **Index 从 1 开始**：用户友好，显示 "1/3" 而非 "0/3"
- **最大 255 帧**：单帧 2.6KB × 255 = 663KB，远超实际需求
- **ChecksumID 用 CRC32**：计算快，4字节碰撞概率 1/4B 可接受

### 2.4 Process Flows

#### A. Single Frame (Plain) - `0x01`
1.  **Gen**: `JSON` -> `Gzip` -> `Prepend 0x01`.
2.  **Scan**: Read Byte 0 (`0x01`) -> Drop 1st byte -> Gunzip -> Done.

#### B. Single Frame (Encrypted) - `0x02`
*   **Order**: **Gzip -> Encrypt**. (Crucial: Encrypting random Gzip outputs works; Gzipping random Encrypted outputs fails).
1.  **Gen**: `JSON` -> `Gzip` -> `Encrypt(Key)` -> `Salt + IV + Cipher` -> `Prepend 0x02`.
2.  **Scan**: Read Byte 0 (`0x02`) -> Extract Salt/IV -> Prompt Password -> Decrypt -> Gunzip -> Done.

#### C. Multipart Frame - `0xFF`
Used when total size > Limit.

**Header Structure (7 Bytes):** `[0xFF] [Index] [Total] [ChecksumID(4B)] [PayloadChunk]`

*   **ChecksumID**: `CRC32(FullBlob)` or `SHA256(FullBlob).slice(0,4)`. This acts as both a Session ID and an Integrity Checksum.

1.  **Gen**:
    *   Prepare Full Blob (Plain `0x01...` or Encrypt `0x02...`).
    *   Split Blob into N chunks.
    *   Prepend `0xFF` header to each.
2.  **Scan**:
    *   Read Byte 0 (`0xFF`).
    *   Collect chunks based on ID.
    *   When complete -> Assemble Blob.
    *   **Verify Integrity**: Calculate `CRC32(AssembledBlob)`. If it doesn't match `ChecksumID`, throw "Data Corrupted".
    *   **Recursion**: Feed assembled Blob back to detector (It will start with `0x01` or `0x02`).

### 2.5 Multipart Scan State Management

```typescript
interface MultipartSession {
  checksumId: Uint8Array   // 4 bytes, 用于匹配同一批次
  total: number            // 总帧数
  chunks: Map<number, Uint8Array>  // index -> chunk data
  createdAt: number        // 创建时间戳
}

// 状态管理规则
const SESSION_TIMEOUT_MS = 5 * 60 * 1000  // 5 分钟超时
const MAX_CONCURRENT_SESSIONS = 3          // 最多同时进行 3 个会话
```

**边界条件处理：**

| 场景 | 处理策略 |
|------|----------|
| **重复帧** | 静默忽略，不覆盖已有数据 |
| **乱序扫描** | 正常接收，按 Index 存储 |
| **超时** | 5分钟无新帧，清除会话，提示用户重新开始 |
| **ChecksumID 冲突** | 新会话覆盖旧会话（概率极低） |
| **帧数不匹配** | 以首帧 Total 为准，后续帧 Total 不同则警告 |

---

## 3. Implementation Strategy

### 3.1 Phase 1: The "Single Mode" Optimization (High ROI)
1.  **Refactor Gen**: Update `qr-codec.ts` to output `Uint8Array`.
2.  **Force Byte Mode**: Update QR generation calls to explicit `buffer` input and `{ mode: 'byte' }`.
3.  **Refactor Scan**: Update `qr-codec.worker.ts` to implement the **Protocol Switch** (Switch on first byte).

### 3.2 Phase 2: The "Minimal" Multipart
1.  **Splitter**: Logic to split the *Final Blob* (which already has its `0x01/0x02` header).
2.  **Assembler**: Logic to stitch chunks and return the *Final Blob* for re-processing.

---

## 4. UX Strategy (Manual & Stable)

### 4.1 Generator UI (导出端)

**单帧模式：** 与现有逻辑一致

**多帧模式：**
```
┌─────────────────────────────────┐
│  [QR Code Image]                │
│                                 │
│  ◀ Previous   [ 1 / 3 ]  Next ▶ │
│                                 │
│  ○ ● ○  (进度指示器)            │
│                                 │
│  [下载当前帧] [下载全部(Grid)]   │
└─────────────────────────────────┘
```

### 4.2 Importer UI (导入端)

**多帧扫描状态：**
```
┌─────────────────────────────────┐
│  正在接收多帧数据...            │
│                                 │
│  ████████░░░░  3/5 帧           │
│  已接收: 1, 2, 5                │
│  缺失: 3, 4                     │
│                                 │
│  [重置扫描]                     │
└─────────────────────────────────┘
```

### 4.3 QR Grid Export (归档导出)

**布局规范：**
```typescript
interface GridConfig {
  qrSize: 400          // 单个 QR 尺寸 (px)
  gap: 40              // QR 间距 (px)
  padding: 60          // 画布边距 (px)
  labelHeight: 30      // 序号标签高度 (px)
  maxCols: 3           // 最大列数
}
```

**示例布局 (5帧)：**
```
┌──────────────────────────────────┐
│  ┌─────┐  ┌─────┐  ┌─────┐      │
│  │ QR1 │  │ QR2 │  │ QR3 │      │
│  └──┬──┘  └──┬──┘  └──┬──┘      │
│    1/5      2/5      3/5        │
│                                  │
│  ┌─────┐  ┌─────┐               │
│  │ QR4 │  │ QR5 │               │
│  └──┬──┘  └──┬──┘               │
│    4/5      5/5                 │
│                                  │
│  ChengJing Config | 2026-02-01  │
└──────────────────────────────────┘
```

**文件命名：** `ChengJing_Full_20260201_Grid.png`

## 5. Security & Compression Order
*   **Correct Order**: `JSON` -> **Gzip** (Reduce Redundancy) -> **Encrypt** (Obfuscate) -> **QR**.
*   **Why**: Encryption dramatically increases entropy. Gzipping encrypted data yields 0% compression (or negative). Gzipping *before* encryption maximizes space savings.

---

## 6. Error Handling

### 6.1 错误码定义

```typescript
enum QRErrorCode {
  // 解码错误
  INVALID_PROTOCOL = 'INVALID_PROTOCOL',     // 未知协议标识符
  DECOMPRESS_FAILED = 'DECOMPRESS_FAILED',   // Gzip 解压失败
  DECRYPT_FAILED = 'DECRYPT_FAILED',         // 解密失败 (密码错误)
  JSON_PARSE_FAILED = 'JSON_PARSE_FAILED',   // JSON 解析失败

  // 多帧错误
  CHECKSUM_MISMATCH = 'CHECKSUM_MISMATCH',   // CRC32 校验失败
  SESSION_TIMEOUT = 'SESSION_TIMEOUT',       // 会话超时
  FRAME_CORRUPTED = 'FRAME_CORRUPTED',       // 帧数据损坏
}
```

### 6.2 用户提示映射

| 错误码 | 用户提示 |
|--------|----------|
| `INVALID_PROTOCOL` | "无法识别的二维码格式" |
| `DECOMPRESS_FAILED` | "数据解压失败，二维码可能已损坏" |
| `DECRYPT_FAILED` | "密码错误，请重试" |
| `CHECKSUM_MISMATCH` | "数据校验失败，请重新扫描所有帧" |
| `SESSION_TIMEOUT` | "扫描超时，请重新开始" |

---

## 7. Implementation Checklist

### Phase 1: Binary Protocol (单帧优化)

- [ ] 新增 `utils/binary-codec.ts`
  - [ ] `encodeToBinary()`: JSON → Gzip → 0x01 Header
  - [ ] `decodeFromBinary()`: Protocol Switch 解析
- [ ] 修改 `qr-codec.worker.ts`
  - [ ] 支持 Uint8Array 输入/输出
  - [ ] 实现协议标识符分发
- [ ] 修改 QR 生成调用
  - [x] 使用 `{ mode: 'byte' }` 强制字节模式
- [ ] 向后兼容测试
  - [x] Legacy JSON 格式仍可解析

### Phase 2: Multipart (多帧支持)

- [ ] 新增 `utils/multipart.ts`
  - [x] `splitToChunks()`: Blob → Chunk[]
  - [x] `assembleChunks()`: Chunk[] → Blob
  - [x] `calculateChecksum()`: CRC32 计算
- [ ] 新增 `composables/useMultipartSession.ts`
  - [ ] 会话状态管理
  - [ ] 超时清理逻辑
- [ ] 修改 `QRGenerator.vue`
  - [ ] 多帧导航 UI
  - [ ] Grid 导出功能
- [ ] 修改 `QRImporter.vue`
  - [ ] 多帧进度显示
  - [ ] 重置扫描按钮

### Phase 3: Polish (体验优化)

- [ ] 动态 ECC 选择
- [ ] Crypto 进度反馈
- [ ] 单元测试覆盖
