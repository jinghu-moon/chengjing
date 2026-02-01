# 二维码配置同步功能设计文档

> 版本：1.0
> 日期：2026-02-01
> 状态：设计阶段

---

## 1. 背景与前提

### 1.1 项目背景

ChengJing（澄镜）是一款浏览器新标签页扩展，提供个性化的桌面体验，包括：
- 自定义壁纸与布局
- 快捷方式管理
- 番茄钟、待办、便签等效率工具
- 每日诗词等内容模块

用户在精心配置后，往往希望能够：
- 在多台设备间同步配置
- 分享自己的主题风格给他人
- 备份配置以防丢失

### 1.2 现有方案的局限

当前 DataBackup 2.0 提供了文件导入/导出功能，但存在以下不便：
- 需要手动传输 JSON 文件
- 跨设备同步流程繁琐
- 无法快速分享给他人

### 1.3 二维码方案的优势

- **即扫即用**：手机扫码即可保存配置
- **快速分享**：截图或打印即可传播
- **无需后端**：纯前端实现，无服务器依赖

### 1.4 技术前提

- **运行环境**：桌面端浏览器扩展（Chrome/Firefox/Edge）
- **限制条件**：
  - 无法调用摄像头扫码（桌面端限制）
  - 二维码容量有限（约 2-3KB）
  - 需考虑离线场景

---

## 2. 需求分析

### 2.1 核心功能

| 功能 | 描述 | 优先级 |
|------|------|--------|
| 生成二维码 | 将配置数据编码为二维码图片 | P0 |
| 导出图片 | 下载二维码图片 | P0 |
| 复制文本 | 复制编码后的配置文本 | P1 |
| 图片识别 | 上传二维码图片解析配置 | P0 |
| **粘贴图片** | Ctrl+V 粘贴二维码图片识别 | P0 |
| 文本导入 | 粘贴配置文本导入 | P1 |
| 预览确认 | 导入前预览配置差异 | P0 |

### 2.2 导出模式

根据数据量和使用场景，设计两种导出模式：

| 模式 | 包含内容 | 预估大小 | 适用场景 |
|------|---------|---------|---------|
| **主题风格** | 外观布局 + 图标配置 | ~300B | 分享视觉风格 |
| **完整设置** | 全部 Settings + IconConfig | ~800B | 完整配置同步 |

### 2.3 不包含的数据

以下数据因体积过大或隐私原因，不纳入二维码同步：

- **Shortcuts**：包含 Base64 图标，单个可达 10KB+
- **壁纸图片**：体积远超二维码容量
- **用户数据**：待办、笔记、诗词收藏等

---

## 3. 技术选型

### 3.1 二维码生成库

| 库名 | Bundle Size | 特点 | 选择 |
|------|-------------|------|------|
| qrcode | ~45KB | 功能全，最流行 | ❌ 较大 |
| qrcode-generator | ~12KB | 轻量 | ⚪ 备选 |
| **uqr** | **~3KB** | 极轻量，现代 ESM | ✅ 推荐 |

**选择 `uqr`**：
- 体积极小（gzip 后约 3KB）
- 现代 ESM 模块，支持 Tree Shaking
- API 简洁，满足需求

### 3.2 二维码解码库

| 库名 | Bundle Size | 特点 | 选择 |
|------|-------------|------|------|
| jsQR | ~280KB | 纯 JS，较大 | ❌ 太大 |
| qr-scanner | ~16KB | WebWorker 支持 | ⚪ 降级方案 |
| **BarcodeDetector** | **0KB** | 浏览器原生 API | ✅ 优先 |

**选择策略**：优先使用原生 `BarcodeDetector` API，不支持时**动态加载** `qr-scanner`。

```typescript
// 混合架构：原生优先，Worker 降级
async function scanImage(file: File): Promise<string> {
  if ('BarcodeDetector' in window) {
    // 原生 API：0KB，极快
    return await nativeDetect(file)
  }

  // 动态导入：仅在需要时加载，避免增加首屏体积
  const { default: QrScanner } = await import('qr-scanner')
  return await QrScanner.scanImage(file)
}
```

**关键优化**：
- `qr-scanner` 不打包进主包，仅按需加载
- 降级方案使用 Web Worker 运算，避免 UI 卡顿

### 3.3 数据压缩

| 方案 | 压缩率 | 特点 |
|------|--------|------|
| 不压缩 | 0% | 数据量小时可接受 |
| LZ-String | 50-70% | 专为 localStorage 优化 |
| 短键名映射 | 30-50% | 自定义实现，无依赖 |

**选择**：采用**短键名映射**方案，无额外依赖：

```typescript
// 原始
{ "wallpaperBlur": 10, "wallpaperMask": 20 }
// 压缩后
{ "wb": 10, "wm": 20 }
```

### 3.4 数据校验

导入恶意构造的数据可能导致扩展崩溃或 XSS。需在解码阶段增加严格校验。

**校验策略**：
- 使用 `zod` 或手写轻量校验
- 确保数据符合 `QRSyncPayload` 接口
- 数值范围检查（如 `opacity` 不超过 1）

```typescript
// 校验示例
const PayloadSchema = z.object({
  v: z.number().int().min(1),
  t: z.number(),
  m: z.enum(['theme', 'full']),
  d: z.record(z.unknown())
})
```

### 3.5 纠错级别

| 级别 | 容量 | 适用场景 |
|------|------|---------|
| **L (Low)** | 最大 | ✅ 屏幕传输，无污损风险 |
| M | 中等 | 打印场景 |
| H | 最小 | 恶劣环境 |

**选择 L 级别**：屏幕对屏幕传输几乎无污损，优先保证容量。

---

## 4. 数据结构设计

### 4.1 配置数据分类

```typescript
// 主题风格模式 - 仅外观相关
interface ThemePayload {
  // 壁纸
  wallpaperBlur: number
  wallpaperMask: number
  // 布局
  gridRows: number
  gridCols: number
  gridGapX: number
  gridGapY: number
  layoutPaddingTop: number
  layoutGap: number
  desktopPreset: string
  // 搜索栏
  searchBarWidth: number
  searchBarHeight: number
  searchBarRadius: number
  searchBarOpacity: number
  // 图标配置
  iconConfig: IconConfig
}

// 完整设置模式 - 全部配置
interface FullPayload {
  settings: Settings
  iconConfig: IconConfig
}
```

### 4.2 二维码数据协议

```typescript
interface QRSyncPayload {
  v: number           // 协议版本号，用于兼容性处理
  t: number           // 生成时间戳
  m: 'theme' | 'full' // 导出模式
  d: Record<string, any>  // 配置数据（使用短键名）
}
```

### 4.3 短键名映射表

```typescript
const KEY_MAP: Record<string, string> = {
  // Settings
  wallpaperBlur: 'wb',
  wallpaperMask: 'wm',
  gridRows: 'gr',
  gridCols: 'gc',
  gridGapX: 'gx',
  gridGapY: 'gy',
  layoutPaddingTop: 'lpt',
  layoutGap: 'lg',
  desktopPreset: 'dp',
  // ... 其他字段

  // IconConfig
  hideLabel: 'hl',
  boxSize: 'bs',
  iconScale: 'is',
  radius: 'rd',
  opacity: 'op',
  showShadow: 'ss',
}
```

---

## 5. 架构设计

### 5.1 文件结构

```
src/
├── composables/
│   └── useQRSync.ts              # 核心逻辑 Composable
├── components/
│   └── QRSync/
│       ├── index.vue             # 主入口组件
│       ├── QRGenerator.vue       # 二维码生成器
│       ├── QRImporter.vue        # 导入器（图片/文本）
│       └── QRPreview.vue         # 导入预览确认
└── utils/
    └── qr-codec.ts               # 编解码工具函数
```

### 5.2 模块职责

| 模块 | 职责 |
|------|------|
| `useQRSync` | 状态管理、生成/解析逻辑、导入确认 |
| `qr-codec.ts` | 编码压缩、解码解压、校验验证 |
| `QRGenerator` | 模式选择、二维码渲染、下载/复制 |
| `QRImporter` | 文件上传、文本粘贴、图片解码 |
| `QRPreview` | 配置差异对比、确认导入 |

### 5.3 数据流图

```
┌─────────────────────────────────────────────────────────────┐
│                        生成流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  useSettings ──> useQRSync ──> qr-codec ──> uqr            │
│       │              │            │           │             │
│   读取配置      选择模式      编码压缩    生成二维码         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        导入流程                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  图片/文本 ──> BarcodeDetector ──> qr-codec ──> useQRSync  │
│      │              │                  │            │       │
│   用户输入      解码二维码         解压解析     预览确认     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 用户流程

### 6.1 生成二维码

```
┌─────────────────────────────────────────┐
│         数据管理面板                     │
│  ┌───────────────────────────────────┐  │
│  │ 📱 二维码同步                      │  │
│  │                                   │  │
│  │  导出模式：                        │  │
│  │  ○ 主题风格（外观+图标）           │  │
│  │  ● 完整设置（推荐）                │  │
│  │                                   │  │
│  │  预估大小：约 0.8 KB               │  │
│  │                                   │  │
│  │  [生成二维码]                      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────┐
│         二维码展示                       │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │        ┌─────────────┐            │  │
│  │        │             │            │  │
│  │        │   QR Code   │            │  │
│  │        │             │            │  │
│  │        └─────────────┘            │  │
│  │                                   │  │
│  │   [下载图片]  [复制文本]           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 6.1.1 导出 UX 优化

**1. 智能文件名**
```
ChengJing_Config_20260201_Full.png
ChengJing_Theme_20260201.png
```

**2. 二维码白边 (Quiet Zone)**
- 四周保留 10-20px 白边
- 确保扫码器正确识别

**3. 复制图片功能**
```typescript
const copyQR = async () => {
  canvas.toBlob(async (blob) => {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])
  })
}
```

### 6.1.2 容灾兜底

**问题**：完整设置模式下，复杂配置可能超出二维码容量上限。

**解决方案**：
```typescript
const MAX_QR_CHARS = 2000 // 安全阈值

const payloadSize = computed(() => encodedPayload.value.length)
const isOverLimit = computed(() => payloadSize.value > MAX_QR_CHARS)
```

**UI 提示**：
- 超限时显示警告：「配置过大，建议使用文本复制」
- 自动建议切换到「主题风格」模式
- 提供「仅复制文本」按钮作为兜底

### 6.2 导入配置

```
┌─────────────────────────────────────────┐
│         导入配置                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │  [上传二维码图片]                  │  │
│  │                                   │  │
│  │  ─────── 或 ───────               │  │
│  │                                   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │ 粘贴配置文本或图片 (Ctrl+V) │  │  │
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  │  [解析导入]                        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 6.2.1 粘贴图片实现

**场景**：用户从微信/Telegram 复制二维码图片，Ctrl+V 直接识别。

```typescript
// 监听粘贴事件
document.addEventListener('paste', async (e) => {
  const items = e.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        await scanImage(file) // 复用现有识别逻辑
      }
    }
  }
})
```

### 6.3 预览确认

```
┌─────────────────────────────────────────┐
│         预览确认                         │
│  ┌───────────────────────────────────┐  │
│  │  配置来源：2026-02-01 14:30       │  │
│  │  模式：完整设置                    │  │
│  │                                   │  │
│  │  将更新以下配置：                  │  │
│  │  ├─ 壁纸模糊度: 0 → 10            │  │
│  │  ├─ 网格行数: 2 → 3               │  │
│  │  └─ 图标大小: 84 → 72             │  │
│  │                                   │  │
│  │  [取消]  [确认导入]                │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 7. 实现计划

### 7.1 依赖安装

```bash
pnpm add uqr
# qr-scanner 作为可选降级方案，按需安装
```

### 7.2 开发任务

| 阶段 | 任务 | 产出 |
|------|------|------|
| **Phase 1** | 编解码工具 | `qr-codec.ts` |
| **Phase 2** | 核心逻辑 | `useQRSync.ts` |
| **Phase 3** | 生成组件 | `QRGenerator.vue` |
| **Phase 4** | 导入组件 | `QRImporter.vue` |
| **Phase 5** | 预览组件 | `QRPreview.vue` |
| **Phase 6** | 集成测试 | 功能验证 |

---

## 8. 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| 二维码容量不足 | 无法存储完整配置 | 短键名压缩 + 分级导出 + UI 提示降级 |
| BarcodeDetector 兼容性 | 部分浏览器不支持 | 动态加载 qr-scanner + Web Worker |
| 配置版本不兼容 | 导入失败或数据丢失 | 协议版本号 + 兼容性处理 |
| 短键名映射遗漏 | 新字段导出丢失 | 单元测试确保映射完整 |
| 二维码扫描失败 | 用户体验差 | 提供文本复制/粘贴备选 |

---

## 9. 附录

### 9.1 二维码容量参考

| 版本 | 纠错级别 L | 纠错级别 M | 纠错级别 Q | 纠错级别 H |
|------|-----------|-----------|-----------|-----------|
| V10 | 652 字节 | 513 字节 | 364 字节 | 288 字节 |
| V15 | 1,250 字节 | 991 字节 | 703 字节 | 544 字节 |
| V20 | 1,963 字节 | 1,559 字节 | 1,108 字节 | 858 字节 |

### 9.2 浏览器 BarcodeDetector 支持情况

| 浏览器 | 支持状态 |
|--------|---------|
| Chrome 83+ | ✅ 支持 |
| Edge 83+ | ✅ 支持 |
| Firefox | ❌ 不支持 |
| Safari | ❌ 不支持 |

> Firefox/Safari 用户需降级到 qr-scanner 库
