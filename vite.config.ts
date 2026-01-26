import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { crx } from '@crxjs/vite-plugin'
// @ts-ignore
import manifest from './src/manifest.json'

// ===== 环境变量 =====
const isDev = process.env.NODE_ENV === 'development'

console.log('[Vite Config] Mode:', process.env.NODE_ENV)
console.log('[Vite Config] using @crxjs/vite-plugin')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    svgLoader({
      svgoConfig: {
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                // 保留 viewBox，否则 CSS 大小控制会失效
                removeViewBox: false,
              },
            },
          },
          // 移除 width/height 属性，让组件的 CSS 控制大小
          'removeDimensions',
        ],
      },
    }),
    // 🚀 CRXJS: 核心扩展插件
    crx({ manifest }),
    
    // 自动导入 Vue API (ref, reactive, computed 等) 和项目内函数
    AutoImport({
      imports: ['vue'],
      dts: 'src/auto-imports.d.ts',
      dirs: [
        'src/composables',
        'src/utils',
      ],
      vueTemplate: true,
    }),
    // 自动导入组件
    Components({
      dirs: ['src/components'],
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 🚀 CRXJS 开发服务器配置
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
    cors: true, // 允许扩展跨域访问
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // 开发时生成 sourcemap，生产环境可关闭
    sourcemap: isDev,
    rollupOptions: {
      output: {
        // 生产环境分包优化
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
             if (id.includes('@tiptap') || id.includes('prosemirror') || id.includes('tiptap-markdown')) {
               return 'vendor-editor'
             }
             if (id.includes('lowlight')) {
               return 'vendor-highlight'
             }
             if (id.includes('dayjs') || id.includes('chinese-days')) {
               return 'vendor-date'
             }
             if (id.includes('vue') || id.includes('@vue')) {
               return 'vendor-core'
             }
          }
        },
      },
    },
    // 兼容 Chrome 扩展的目标环境
    target: 'esnext',
  },
})
