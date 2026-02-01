# QRSync 加密导出功能设计方案

## 1. 核心目标
支持用户对导出的配置文件（二维码/JSON）进行加密保护，确保敏感信息（如私人 API Key、个人偏好）在传输过程中的安全性。

## 2. 技术规格 (Technical Specifications)

### 2.1 加密算法
采用 **Web Crypto API** 标准实现，确保基于浏览器的原生安全性和性能。

*   **算法**: `AES-256-GCM` (Authenticated Encryption)
    *   提供机密性（Confidentiality）和完整性（Integrity）校验。
    *   **IV (初始化向量)**: 12 bytes (随机生成)。
    *   **Tag Length**: 128 bits (自动包含)。
*   **密钥派生 (KDF)**: `PBKDF2`
    *   **Hash**: SHA-256
    *   **Salt**: 32 bytes (增强抗彩虹表能力，桌面端推荐)。
    *   **Iterations**: 1,000,000 次 (针对桌面 CPU 算力的极致安全配置)。
    *   **Key Length**: 256 bits。
*   **数据压缩**: `CompressionStream` (Gzip)
    *   **时机**: 加密前对 JSON 字符串进行压缩。
    *   **优势**: 浏览器原生支持，显著减少 Payload 体积（可达 80%），提升二维码可读性。

> [!TIP]
> **选择 PBKDF2 (1M) vs Argon2id 的决策理由**
> 虽然 Argon2id 本质更强，但 PBKDF2 (1M) 在桌面端环境下：
> 1. **零依赖**：无需引入 WASM 胶水代码，保持架构纯净。
> 2. **等效安全**：100万次迭代已将暴力破解成本拉高至国家级安全标准。
> 3. **兼容性**：完全基于 Web Standard，维护成本最低。

### 2.2 数据协议扩展
扩展现有的 `QRSyncPayload` 接口以支持加密数据。

```typescript
/** 二维码数据协议 v2 (支持加密) */
export interface QRSyncPayload {
  v: number              // 协议版本号 (保持为 1 或升级为 2)
  t: number              // 生成时间戳
  m: ExportMode          // 导出模式
  e?: boolean            // [新增] 是否加密 flag
  
  // 数据字段：未加密时为对象，加密时为 Base64 字符串
  d: QRSyncData | string 
}

// 加密后的数据结构 (Base64 解码后)
interface EncryptedData {
  iv: Uint8Array         // 12 bytes
  salt: Uint8Array       // 16 bytes
  cipherText: Uint8Array // 密文
}
```

## 3. 实现架构

### 3.1 模块划分

1.  **`crypto-utils.ts` (Shared/Worker)**
    *   封装 Web Crypto primitive 操作。
    *   `deriveKey(password, salt)`
    *   `encrypt(data, password)` -> `{ cipherText, iv, salt }`
    *   `decrypt(encryptedData, password)` -> `data`

2.  **`qr-codec.worker.ts` (Worker 更新)**
    *   **关键**: PBKDF2 计算量大，**必须**在 Worker 中执行，避免阻塞 UI 线程。
    *   新增 `encrypt` / `decrypt` 消息处理分支。
    *   更新 `encode` / `decode` 流程支持密码参数。

3.  **`useQRSync.ts` (Composable 更新)**
    *   扩展 `encodeAsync` 和 `decodeAsync` 接口，增加 `password` 可选参数。
    *   处理“需要密码”的错误状态（如解码时发现 `e: true` 但未提供密码，抛出特定错误码）。

### 3.2 流程设计

#### 加密导出流程 (Export)
1.  用户在 UI 开启“加密导出”并输入密码。
2.  `QRGenerator` 调用 `useQRSync.encodeAsync(settings, config, mode, password)`。
3.  **[Worker]** **压缩数据 (Minify)**: 将长 Key 映射为短 Key (如 `generalOpenInNewTab` -> `ont`)。
4.  **[Worker]** **序列化**: 将压缩后的对象转为 JSON 字符串。
5.  **[Worker]** **Gzip 压缩**: 使用 `CompressionStream` 对 JSON 字符串进行 Gzip 压缩 -> `Uint8Array`。
    > 注意：必须遵循 "先 Gzip 后加密" 原则，只有明文文本才能被有效压缩。
6.  **[Worker]** 生成随机 Salt (32B) 和 IV (12B)。
7.  **[Worker]** 运行 PBKDF2 (1M 迭代) 派生密钥。
8.  **[Worker]** AES-GCM 加密 **Gzip 后的二进制数据**。
9.  **[Worker]** 拼接 `salt + iv + cipherText` 并转为 Base64。
    > 注意：虽然 Base64 有膨胀，但前置的 Gzip 压缩通常能抵消并大幅减小最终体积（模拟测试显示可减少 ~80%）。
10. **[Worker]** 构建 Payload `{ e: true, d: "Base64..." }`。
11. 返回结果供二维码生成或 JSON 下载。

#### 解密导入流程 (Import)
1.  用户扫描二维码或上传 JSON。
2.  `QRImporter` 调用 `useQRSync.decodeAsync(payload)`。
3.  **[Worker]** 解析 JSON。
4.  **[Worker]** 检查 `e` 字段。
    *   若 `e: true` 且未提供密码 -> 返回错误 `REQUIRED_PASSWORD`。
5.  UI 捕获 `REQUIRED_PASSWORD`，弹出密码输入框。
6.  用户输入密码，重新调用 `decodeAsync(payload, password)`。
7.  **[Worker]** 提取 Salt，重新派生密钥。
8.  **[Worker]** AES-GCM 解密，校验 Tag -> 得到 `Uint8Array` (Gzip 数据)。
    *   解密失败 -> 返回错误 `INVALID_PASSWORD`。
9.  **[Worker]** **Gzip 解压**: 使用 `DecompressionStream` 还原为 JSON 字符串。
10. **[Worker]** 反序列化为对象 (Minified)。
11. **[Worker]** **还原数据 (Un-minify)**: 映射回长 Key。
12. 解密成功 -> 返回原始数据。
13. 继续后续的校验和预览流程。

## 4. 其它考虑

*   **性能**: 加密后的 Base64 字符串会比原始压缩 JSON 略大（~33%）。
    *   **策略**: 检测到 `e: true` 时，`isOverLimit` 的判断阈值应保持不变，这意味着能容纳的配置项更少。
    *   **UI**: 当加密导致超限时，显示提示："加密导致数据膨胀，建议使用 JSON 文件导出或减少配置项"。
*   **兼容性**: 确保 Web Crypto API 在目标浏览器（Chrome/Edge, Firefox, Safari）的 Worker 环境中可用（现代浏览器均支持）。
*   **错误处理**: 明确区分“数据损坏”和“密码错误”。

## 5. 开发计划

1.  [ ] 创建 `src/components/QRSync/utils/crypto.ts` 工具库。
2.  [ ] 更新 `worker` 及其类型定义，支持加解密请求。
3.  [ ] 更新 `qr-codec.ts` 适配新的 Payload 结构。
4.  [ ] 编写 `crypto` 相关单元测试。
5.  [ ] 更新 UI (`QRGenerator`/`QRImporter`) 增加密码交互逻辑。
