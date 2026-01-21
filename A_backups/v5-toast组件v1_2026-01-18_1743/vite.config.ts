import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

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
    // 自动导入 Vue API (ref, reactive, computed 等) 和项目内函数
    AutoImport({
      imports: ['vue'],
      dts: 'src/auto-imports.d.ts',
      // ✅ 自动扫描目录，导入导出的函数
      dirs: [
        'src/composables', // 自动导入所有 hooks (useSettings, useCalendar 等)
        'src/utils', // 自动导入工具函数 (throttle, positioning 等)
      ],
      vueTemplate: true, // 支持在 Vue 模板中使用自动导入的函数
    }),
    // 自动导入组件
    Components({
      dirs: ['src/components'],
      dts: 'src/components.d.ts',
    }),
    // 复制 manifest.json 到 dist（Chrome 扩展必需）
    viteStaticCopy({
      targets: [{ src: 'src/manifest.json', dest: '.' }],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 显示压缩后的大小
    reportCompressedSize: true,
    // 使用 esbuild 压缩（默认，速度更快）
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // 确保打包后的文件名不带 hash，方便 manifest 引用（可选，但在插件开发中推荐）
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('@tiptap') ||
              id.includes('prosemirror') ||
              id.includes('tiptap-markdown')
            ) {
              return 'vendor-editor'
            }
            // lowlight 代码高亮单独分包
            if (id.includes('lowlight')) {
              return 'vendor-highlight'
            }
            if (id.includes('dayjs') || id.includes('chinese-days')) {
              return 'vendor-date'
            }
            if (id.includes('vue') || id.includes('@vue')) {
              return 'vendor-core'
            }
            if (id.includes('@tabler/icons-vue')) {
              return 'vendor-icons'
            }
            // 虚拟滚动单独分包
            if (id.includes('@tanstack/vue-virtual')) {
              return 'vendor-virtual'
            }
          }
        },
      },
    },
  },
})
