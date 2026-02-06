# Implementation Plan - Hybrid Binary QR Protocol

This plan implements the **Hybrid Binary Protocol** to support syncing Desktop Wallpaper (Raw WebP) alongside Settings, with 0% Base64 overhead. It also includes Multipart support.

## Goal Description
Sync custom wallpaper images via QR code by attaching raw binary data to the payload, bypassing Base64 encoding.

## User Review Required
> [!IMPORTANT]
> **Protocol Change**: Introduction of `0x03` (Hybrid) header.
> **Scope**: Only applies to QR Export. JSON Export remains standard Base64.

## Proposed Changes

### 1. Protocol & Codec (Logic Layer)

#### [MODIFY] [src/components/QRSync/utils/binary-codec.ts](file:///d:/100_Projects/110_Daily/ChengJing/src/components/QRSync/utils/binary-codec.ts)
- Add `ProtocolHeader.HYBRID (0x03)`.
- Implement `encodeHybrid(jsonStr: string, attachment: Uint8Array): Uint8Array`.
- Implement `decodeHybrid(data: Uint8Array): { json: string, attachment?: Uint8Array }`.

#### [MODIFY] [src/components/QRSync/workers/qr-codec.worker.ts](file:///d:/100_Projects/110_Daily/ChengJing/src/components/QRSync/workers/qr-codec.worker.ts)
- Update `handleEncode` to support `attachment` parameter.
- Update `handleDecode` to handle `0x03` header and return attachment.

#### [NEW] [src/components/QRSync/utils/image-compressor.ts](file:///d:/100_Projects/110_Daily/ChengJing/src/components/QRSync/utils/image-compressor.ts)
- `compressWallpaper(blob: Blob): Promise<Uint8Array>`
  - Resize to max 800px.
  - Compress to WebP (quality 0.6).
  - Return Uint8Array.

### 2. Data Flow (Composable Layer)

#### [MODIFY] [src/components/QRSync/composables/useQRSync.ts](file:///d:/100_Projects/110_Daily/ChengJing/src/components/QRSync/composables/useQRSync.ts)
- **Export**:
  - Check `settings.wallpaperDailyEnabled`. If false, fetch `custom-bg` from DB.
  - If image exists, compress it.
  - Pass attachment to `encodeAsync`.
- **Import**:
  - Receive `attachment` from `decodeAsync`.
  - If present, save to DB (`saveImage('custom-bg', blob)`).
  - Trigger `forceWallpaperUpdate`.

### 3. UI Layer

#### [MODIFY] [src/components/QRSync/QRGenerator.vue](file:///d:/100_Projects/110_Daily/ChengJing/src/components/QRSync/QRGenerator.vue)
- Add "Include Wallpaper" toggle (only visible if using custom wallpaper).
- Show Multipart UI/Navigation.

#### [MODIFY] [src/components/QRSync/QRImporter.vue](file:///d:/100_Projects/110_Daily/ChengJing/src/components/QRSync/QRImporter.vue)
- Show "Wallpaper included" indicator in preview.

## Verification Plan
1.  **Unit Tests**:
    -   Test `encodeHybrid` / `decodeHybrid` with mock binary data.
    -   Test `image-compressor` (mocking Canvas).
2.  **Manual Verification**:
    -   Set custom wallpaper.
    -   Generate QR (Hybrid).
    -   Scan on another device/browser.
    -   Verify wallpaper updates.
