/// <reference types="vite/client" />

declare module '@crxjs/vite-plugin' {
  import type { PluginOption } from 'vite'
  import type { ManifestV3Export } from '@crxjs/vite-plugin/dist/index.d.ts'
  
  export const crx: (options: { manifest: ManifestV3Export }) => PluginOption
  
  export const defineManifest: (manifest: ManifestV3Export) => ManifestV3Export
}
