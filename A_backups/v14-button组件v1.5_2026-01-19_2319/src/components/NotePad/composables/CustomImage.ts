import { mergeAttributes } from '@tiptap/core'
import Image from '@tiptap/extension-image'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ImageNodeView from '../components/ImageNodeView.vue'

export const CustomImage = Image.extend({
  name: 'image',

  addAttributes() {
    return {
      ...this.parent?.(),
      // Add data-image-id attribute to store the UUID
      'data-image-id': {
        default: null,
      },
      // Width for resizing
      width: {
        default: null,
      },
      // Height (less used but good to have)
      height: {
        default: null,
      },
      // Alignment
      align: {
        default: 'center',
      },
    }
  },

  // 注册 Vue Node View
  addNodeView() {
    return VueNodeViewRenderer(ImageNodeView)
  },

  // 虽然有 Node View，但 renderHTML 依然用于 outputMarkdown (如果使用了 html: true)
  // 或者在某些无法加载 JS 的场景。
  // Tiptap 会优先使用 Node View 渲染编辑器 DOM，但 getHTML() 可能还是走这里。
  // 不过对于 markdown 转换，通常走 node.attrs。
  renderHTML({ HTMLAttributes }) {
    const { src } = HTMLAttributes

    // 拦截 lime-image:// 协议，避免浏览器直接请求导致 ERR_UNKNOWN_URL_SCHEME
    if (typeof src === 'string' && src.startsWith('lime-image://')) {
      return [
        'img',
        mergeAttributes(this.options.HTMLAttributes, {
          ...HTMLAttributes,
          src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
          'data-image-id': HTMLAttributes['data-image-id'] || src.replace('lime-image://', ''),
        }),
      ]
    }

    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)]
  },
})
