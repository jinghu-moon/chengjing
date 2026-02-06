# DataSync 数据同步

## 概述

配置导入导出组件，支持三种导出模式（主题/完整/含壁纸）和 AES-256-GCM 加密保护。通过 `useDataSync` composable 统一管理导出序列化、加密打包、导入解析、解密还原的完整流程。

## 目录结构

```
DataSync/
├── index.vue                    # 主组件（CapsuleTabs 切换导出/导入）
├── types.ts                     # 类型定义（SyncData / ImportResult）
├── DataExporter.vue             # 导出面板（模式选择 + 加密 + 下载）
├── DataImporter.vue             # 导入面板（上传 + 解密 + 预览 + 应用）
└── composables/
    └── useDataSync.ts           # 核心逻辑（导出/导入/加密/解密）
```

## 导出模式

| 模式 | 标签 | 内容 | 预估大小 |
|------|------|------|----------|
| `theme` | 主题风格 | 外观配色、图标样式 | < 5 KB |
| `full` | 完整配置 | 布局、组件、所有设置 | ~ 20 KB |
| `wallpaper` | 含壁纸 | 完整配置 + 自定义壁纸 (Base64) | > 100 KB |

## 数据格式 (SyncData)

```ts
interface SyncData {
  v: 1                              // 版本号
  t: number                         // 导出时间戳
  m: 'theme' | 'full' | 'wallpaper' // 导出模式
  d: {
    settings: Record<string, any>   // 全局设置
    iconConfig: Record<string, any> // 图标配置
  }
  wallpaper?: string                // Base64 壁纸（仅 wallpaper 模式）
}
```

加密文件格式：`{ e: true, d: "<base64_packed>" }`

## 导出流程

```
选择模式 → 收集 settings/iconConfig
         → (wallpaper 模式) 读取 IndexedDB 自定义壁纸 → Base64
         → JSON 序列化
         → (加密) AES-256-GCM 加密 → packEncryptedData → 包装
         → 生成文件名 → 触发下载
```

文件命名：`ChengJing_{mode}_{YYYYMMDD}[_Encrypted].json`

## 导入流程

```
上传文件 → JSON 解析
         → 检测加密标记 (e: true)
         → (加密) 弹出密码输入 → unpackEncryptedData → AES 解密
         → 版本校验 (v === 1)
         → 预览信息展示（模式/时间/壁纸）
         → 用户确认 → applyImport (覆盖 settings/iconConfig/壁纸)
```

## 组件说明

### DataExporter 导出面板

- **模式选择**：Grid 卡片布局，active 高亮
- **加密选项**：checkbox 开关 + 密码输入（slide-fade 动画）
- **导出按钮**：禁用条件 = 处理中 || (加密但无密码)

### DataImporter 导入面板

- **Step 1**：拖拽/点击上传区域，支持 `.json` 文件
- **密码弹窗**：检测到加密文件时弹出，支持重试
- **Step 2**：预览卡片（模式/时间/壁纸/版本），确认后覆盖应用

## 外部依赖

| 依赖 | 用途 |
|------|------|
| `useSettings` (全局) | 读写 settings / iconConfig |
| `@/utils/crypto` | AES-256-GCM 加密/解密、pack/unpack |
| `@/utils/db` | IndexedDB 壁纸读写 (getImageUrl/saveImage) |
| `CapsuleTabs` (SettingsPanel) | 导出/导入标签页切换 |
