<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { watch, onBeforeUnmount, computed, ref } from 'vue'
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconEraser,
  IconPhoto,
  IconH1,
  IconH2,
  IconH3,
  IconBold,
  IconItalic,
  IconList,
  IconListNumbers,
  IconCheckbox,
  IconCode,
  IconQuote,
  IconSeparator,
  IconLink,
  IconIndentIncrease,
  IconIndentDecrease,
  IconStrikethrough,
} from '@tabler/icons-vue'
// [自动导入] Tooltip

// [手动引入子组件] 因为 NoteBubbleMenu 不是全局组件，它是编辑器的附属
import NoteBubbleMenu from './NoteBubbleMenu.vue'

import Dropcursor from '@tiptap/extension-dropcursor'
import Highlight from '@tiptap/extension-highlight'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
// [修复] 确保 CustomImage 路径正确 (extensions 位于 NotePad 下)
import { CustomImage } from '../composables/CustomImage'
// [自动导入] useImageUpload

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
// @ts-ignore
import { common, createLowlight } from 'lowlight'

// 创建 lowlight 实例 (common 已包含: js, ts, css, html, json, python, bash, sql 等常用语言)
const lowlight = createLowlight(common)

const props = withDefaults(
  defineProps<{
    modelValue: string
    showToolbar?: boolean
  }>(),
  {
    showToolbar: true,
  }
)

// Bridge for circular dependency between useEditor and useImageUpload
let internalUploadHandler: ((files: FileList | File[]) => Promise<void>) | null = null

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

// 标志位：防止双向绑定死循环
const isLocalUpdate = ref(false)

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    CustomImage.configure({
      allowBase64: true,
      HTMLAttributes: {
        class: 'note-image',
      },
    }),
    Dropcursor.configure({
      color: 'var(--color-primary)',
      width: 2,
    }),
    Highlight.configure({ multicolor: true }),
    Subscript,
    Superscript,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    // Link.configure({
    //   openOnClick: false,
    //   autolink: true,
    //   defaultProtocol: 'https',
    // }),
    StarterKit.configure({
      // 禁用默认 codeBlock，改用 codeBlockLowlight
      codeBlock: false,
      // 禁用默认 dropCursor，因为我们单独配置了它
      dropcursor: false,
      heading: {
        levels: [1, 2, 3],
      },
    }),
    CodeBlockLowlight.configure({
      lowlight,
    }),
    Markdown.configure({
      html: false,
      transformCopiedText: true,
      transformPastedText: true,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'tiptap-editor',
      spellcheck: 'false',
    },
    handleDrop: (_view, event, _slice, moved) => {
      if (!moved && event.dataTransfer?.files?.length) {
        if (internalUploadHandler) internalUploadHandler(event.dataTransfer.files)
        return true
      }
      return false
    },
    handlePaste: (_view, event) => {
      if (event.clipboardData?.files?.length) {
        if (internalUploadHandler) internalUploadHandler(event.clipboardData.files)
        return true
      }
      return false
    },
  },
  onUpdate: ({ editor }) => {
    isLocalUpdate.value = true

    // 在保存前，将图片的 blob: URL 还原为 lime-image:// 协议
    // 遍历文档，收集图片节点的 data-image-id
    const imageIdMap = new Map<string, string>() // blobUrl -> imageId
    editor.state.doc.descendants(node => {
      if (node.type.name === 'image' && node.attrs['data-image-id']) {
        const src = node.attrs.src || ''
        if (src.startsWith('blob:')) {
          imageIdMap.set(src, node.attrs['data-image-id'])
        }
      }
    })

    // 获取 markdown 并还原 blob URL 为协议地址
    let markdown = (editor.storage as any).markdown.getMarkdown()
    for (const [blobUrl, imageId] of imageIdMap) {
      markdown = markdown.replace(blobUrl, `lime-image://${imageId}`)
    }

    emit('update:modelValue', markdown)
  },
})

const { uploadImages, isProcessing, progress } = useImageUpload(editor)
internalUploadHandler = uploadImages

// 监听外部 modelValue 变化，同步到编辑器
watch(
  () => props.modelValue,
  newValue => {
    if (!editor.value) return

    // 如果这次更新是本地防抖产生的（即刚刚 onUpdate 发出去的），则忽略
    if (isLocalUpdate.value) {
      isLocalUpdate.value = false
      return
    }

    const currentMarkdown = (editor.value.storage as any).markdown.getMarkdown()
    if (newValue !== currentMarkdown) {
      editor.value.commands.setContent(newValue)
    }
  }
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const setLink = () => {
  if (!editor.value) return
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('URL:', previousUrl)

  // cancelled
  if (url === null) {
    return
  }

  // empty
  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  // update
  editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const hasFormatting = computed(() => {
  if (!editor.value) return false
  const e = editor.value
  return (
    e.isActive('bold') ||
    e.isActive('italic') ||
    e.isActive('strike') ||
    e.isActive('link') ||
    e.isActive('code') ||
    e.isActive('heading') ||
    e.isActive('blockquote') ||
    e.isActive('codeBlock') ||
    e.isActive('bulletList') ||
    e.isActive('orderedList') ||
    e.isActive('taskList')
  )
})

const triggerImageInput = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = true
  input.onchange = () => {
    if (input.files?.length) {
      uploadImages(input.files)
    }
  }
  input.click()
}
</script>

<template>
  <div class="tiptap-wrapper">
    <div v-if="isProcessing" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">优化图片中... {{ progress.toFixed(0) }}%</div>
    </div>
    <div v-if="editor && showToolbar" class="editor-toolbar">
      <!-- 历史操作 -->
      <div class="toolbar-group">
        <Tooltip content="插入图片">
          <button class="tool-btn" @click="triggerImageInput">
            <IconPhoto size="16" />
          </button>
        </Tooltip>
      </div>
      <div class="divider"></div>

      <div class="toolbar-group">
        <Tooltip content="撤销 (Ctrl+Z)">
          <button
            class="tool-btn"
            :disabled="!editor.can().undo()"
            @click="editor.chain().focus().undo().run()"
          >
            <IconArrowBackUp size="16" />
          </button>
        </Tooltip>
        <Tooltip content="重做 (Ctrl+Y)">
          <button
            class="tool-btn"
            :disabled="!editor.can().redo()"
            @click="editor.chain().focus().redo().run()"
          >
            <IconArrowForwardUp size="16" />
          </button>
        </Tooltip>
      </div>
      <div class="divider"></div>

      <!-- 标题 -->
      <div class="toolbar-group">
        <Tooltip content="一级标题 (Ctrl+Alt+1)">
          <button
            class="tool-btn"
            :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
            @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          >
            <IconH1 size="16" />
          </button>
        </Tooltip>
        <Tooltip content="二级标题 (Ctrl+Alt+2)">
          <button
            class="tool-btn"
            :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
            @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          >
            <IconH2 size="16" />
          </button>
        </Tooltip>
        <Tooltip content="三级标题 (Ctrl+Alt+3)">
          <button
            class="tool-btn"
            :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
            @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          >
            <IconH3 size="16" />
          </button>
        </Tooltip>
      </div>
      <div class="divider"></div>

      <!-- 文本样式 -->
      <div class="toolbar-group">
        <Tooltip content="加粗 (Ctrl+B)">
          <button
            class="tool-btn"
            :class="{ 'is-active': editor.isActive('bold') }"
            @click="editor.chain().focus().toggleBold().run()"
          >
            <IconBold size="16" />
          </button>
        </Tooltip>
        <Tooltip content="斜体 (Ctrl+I)">
          <button
            class="tool-btn"
            :class="{ 'is-active': editor.isActive('italic') }"
            @click="editor.chain().focus().toggleItalic().run()"
          >
            <IconItalic size="16" />
          </button>
        </Tooltip>
        <Tooltip content="删除线 (Ctrl+Shift+S)">
          <button
            class="tool-btn"
            :class="{ 'is-active': editor.isActive('strike') }"
            @click="editor.chain().focus().toggleStrike().run()"
          >
            <IconStrikethrough size="16" />
          </button>
        </Tooltip>
        <Tooltip content="行内代码 (Ctrl+E)">
          <button
            class="tool-btn"
            :class="{ 'is-active': editor.isActive('code') }"
            @click="editor.chain().focus().toggleCode().run()"
          >
            <IconCode size="16" />
          </button>
        </Tooltip>
        <Tooltip content="链接 (Ctrl+K)">
          <button
            class="tool-btn"
            :class="{ 'is-active': editor.isActive('link') }"
            @click="setLink"
          >
            <IconLink size="16" />
          </button>
        </Tooltip>
        <Tooltip content="清除格式">
          <button
            class="tool-btn"
            :disabled="!hasFormatting"
            @click="editor.chain().focus().unsetAllMarks().clearNodes().run()"
          >
            <IconEraser size="16" />
          </button>
        </Tooltip>
      </div>
      <div class="divider"></div>

      <!-- 列表 -->
      <div class="toolbar-group">
        <Tooltip content="无序列表 (Ctrl+Shift+8)">
          <button
            class="tool-btn"
            :class="{ 'is-active': editor.isActive('bulletList') }"
            @click="editor.chain().focus().toggleBulletList().run()"
          >
            <IconList size="16" />
          </button>
        </Tooltip>
        <Tooltip content="有序列表 (Ctrl+Shift+7)">
          <button
            class="tool-btn"
            :class="{ 'is-active': editor.isActive('orderedList') }"
            @click="editor.chain().focus().toggleOrderedList().run()"
          >
            <IconListNumbers size="16" />
          </button>
        </Tooltip>
        <Tooltip content="任务列表 (Ctrl+Shift+9)">
          <button
            class="tool-btn"
            :class="{ 'is-active': editor.isActive('taskList') }"
            @click="editor.chain().focus().toggleTaskList().run()"
          >
            <IconCheckbox size="16" />
          </button>
        </Tooltip>
      </div>
      <div class="divider"></div>

      <!-- 缩进 -->
      <div class="toolbar-group">
        <Tooltip content="增加缩进 (Tab)">
          <button
            class="tool-btn"
            :disabled="!editor.can().sinkListItem('listItem')"
            @click="editor.chain().focus().sinkListItem('listItem').run()"
          >
            <IconIndentIncrease size="16" />
          </button>
        </Tooltip>
        <Tooltip content="减少缩进 (Shift+Tab)">
          <button
            class="tool-btn"
            :disabled="!editor.can().liftListItem('listItem')"
            @click="editor.chain().focus().liftListItem('listItem').run()"
          >
            <IconIndentDecrease size="16" />
          </button>
        </Tooltip>
      </div>
      <div class="divider"></div>

      <!-- 块元素 -->
      <div class="toolbar-group">
        <Tooltip content="引用 (Ctrl+Shift+B)">
          <button
            class="tool-btn"
            :class="{ 'is-active': editor.isActive('blockquote') }"
            @click="editor.chain().focus().toggleBlockquote().run()"
          >
            <IconQuote size="16" />
          </button>
        </Tooltip>
        <Tooltip content="分割线">
          <button class="tool-btn" @click="editor.chain().focus().setHorizontalRule().run()">
            <IconSeparator size="16" />
          </button>
        </Tooltip>
      </div>
    </div>

    <!-- 气泡菜单 -->
    <NoteBubbleMenu v-if="editor && showToolbar" :editor="editor" />

    <EditorContent :editor="editor" class="editor-content-root" />
  </div>
</template>

<style scoped>
.tiptap-wrapper {
  height: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* EditorContent 组件的包裹层 */
.editor-content-root {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 关键：限制高度 */
}

/* Tiptap 实际的可编辑区域 (ProseMirror) */
:deep(.ProseMirror) {
  flex: 1;
  overflow-y: auto;
  /* 关键：允许滚动 */
  outline: none;
  padding: 10px 12px 40px;
  /* 底部加点 padding 方便阅读 */
  height: 100%;
  box-sizing: border-box;
  font-family: var(--font-family-base);
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--text-primary);
}

/* 占位符 */
:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: '快速记录... (# 标题, - 列表, **加粗**)';
  color: var(--text-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

:deep(.ProseMirror p) {
  margin: 0 0 8px 0;
}

:deep(.ProseMirror h1) {
  font-size: 1.4em;
  font-weight: 700;
  margin: 12px 0 8px;
  color: var(--nord6);
  line-height: 1.2;
}

:deep(.ProseMirror h2) {
  font-size: 1.2em;
  font-weight: 600;
  margin: 10px 0 6px;
  color: var(--nord5);
  line-height: 1.3;
}

:deep(.ProseMirror h3) {
  font-size: 1.1em;
  font-weight: 600;
  margin: 8px 0 6px;
  color: var(--nord5);
  line-height: 1.3;
}

:deep(.ProseMirror ul),
:deep(.ProseMirror ol) {
  padding-left: 20px;
  margin: 0 0 8px 0;
}

:deep(.ProseMirror ul) {
  list-style-type: disc;
}

:deep(.ProseMirror ol) {
  list-style-type: decimal;
}

:deep(.ProseMirror li) {
  margin-bottom: 4px;
}

:deep(.ProseMirror li p) {
  margin: 0;
}

:deep(.ProseMirror strong) {
  font-weight: 700;
  color: var(--nord6);
}

:deep(.ProseMirror em) {
  font-style: italic;
}

:deep(.ProseMirror code) {
  background: rgba(0, 0, 0, 0.2);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
}

:deep(.ProseMirror pre) {
  background: var(--bg-panel-dark);
  padding: 12px;
  border-radius: var(--radius-sm);
  margin: 8px 0;
  overflow-x: auto;
}

:deep(.ProseMirror pre code) {
  background: transparent;
  padding: 0;
}

:deep(.ProseMirror blockquote) {
  border-left: 3px solid var(--color-primary);
  margin: 8px 0;
  padding-left: 12px;
  color: var(--text-tertiary);
}

:deep(.ProseMirror a) {
  color: var(--color-primary);
  text-decoration: underline;
  cursor: pointer;
}

:deep(.ProseMirror hr) {
  border: none;
  border-top: 1px solid var(--border-glass);
  margin: 16px 0;
}

:deep(ul[data-type='taskList']) {
  list-style: none;
  padding: 0;
  margin: 0;
}

:deep(ul[data-type='taskList'] li) {
  display: flex;
  margin-bottom: 6px;
  align-items: flex-start;
}

:deep(ul[data-type='taskList'] li label) {
  margin-right: 8px;
  user-select: none;
  cursor: pointer;
  margin-top: 2px;
}

:deep(ul[data-type='taskList'] li div) {
  flex: 1;
}

:deep(ul[data-type='taskList'] li input[type='checkbox']) {
  accent-color: var(--color-primary);
  width: 14px;
  height: 14px;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-divider);
  background: var(--bg-panel-transparent);
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.word-count {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-tertiary);
  padding: 0 4px;
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.tool-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tool-btn:not(:disabled):hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tool-btn.is-active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.divider {
  width: 1px;
  height: 16px;
  background: var(--border-divider);
  margin: 0 4px;
}

/* ================= Syntax Highlighting (Nord Theme) ================= */
:deep(pre) {
  color: var(--nord4);
  font-family: var(--font-family-mono);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  overflow-x: auto;
}

:deep(code) {
  color: inherit;
  padding: 0;
  background: none;
  font-size: 0.8rem;
}

:deep(.hljs-comment),
:deep(.hljs-quote) {
  color: var(--nord3);
}

:deep(.hljs-variable),
:deep(.hljs-template-variable),
:deep(.hljs-tag),
:deep(.hljs-name),
:deep(.hljs-selector-id),
:deep(.hljs-selector-class),
:deep(.hljs-regexp),
:deep(.hljs-deletion) {
  color: var(--nord11);
}

:deep(.hljs-number),
:deep(.hljs-built_in),
:deep(.hljs-builtin-name),
:deep(.hljs-literal),
:deep(.hljs-type),
:deep(.hljs-params),
:deep(.hljs-meta),
:deep(.hljs-link) {
  color: var(--nord12);
}

:deep(.hljs-attribute) {
  color: var(--nord13);
}

:deep(.hljs-string),
:deep(.hljs-symbol),
:deep(.hljs-bullet),
:deep(.hljs-addition) {
  color: var(--nord14);
}

:deep(.hljs-title),
:deep(.hljs-section) {
  color: var(--nord8);
}

:deep(.hljs-keyword),
:deep(.hljs-selector-tag) {
  color: var(--nord9);
}

:deep(.hljs) {
  display: block;
  overflow-x: auto;
  color: var(--nord4);
  padding: 0.5em;
}

:deep(.hljs-emphasis) {
  font-style: italic;
}

:deep(.hljs-strong) {
  font-weight: bold;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  pointer-events: none;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Image Styles */
:deep(.ProseMirror img),
:deep(.note-image) {
  max-width: 100% !important;
  height: auto;
  border-radius: var(--radius-md);
  margin: 12px 0;
  display: block;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.ProseMirror-selectednode.note-image) {
  outline: 2px solid var(--color-primary);
}

/* Image Resizer Handle */
:deep(.image-resizer) {
  display: inline-flex;
  position: relative;
  max-width: 100%;
}
</style>
