<script setup lang="ts">
import { computed } from 'vue'
import { Editor } from '@tiptap/vue-3'
import {
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconCode,
  IconLink,
  IconUnlink,
  IconH1,
  IconH2,
  IconH3,
  IconList,
  IconListNumbers,
  IconCheckbox,
  IconHighlight,
  IconSuperscript,
  IconSubscript,
  IconArrowBarToUp,
  IconArrowBarToDown,
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconTrash,
} from '@tabler/icons-vue'

const props = defineProps<{
  editor: Editor
}>()

const emit = defineEmits<{
  (e: 'edit-link'): void
}>()

// ==================== 上下文检测 ====================
// 检测是否选中了图片
const isImageActive = computed(() => props.editor.isActive('image'))
const imageAlign = computed(() => {
  if (props.editor.isActive('image', { align: 'left' })) return 'left'
  if (props.editor.isActive('image', { align: 'right' })) return 'right'
  return 'center'
})

// 检测是否选中了块级元素 (图片、代码块等)
const isBlockActive = computed(() => {
  return (
    props.editor.isActive('image') ||
    props.editor.isActive('codeBlock') ||
    props.editor.isActive('table')
  )
})

const isInHeading = computed(() => props.editor.isActive('heading'))

const currentHeadingLevel = computed(() => {
  for (const level of [1, 2, 3]) {
    if (props.editor.isActive('heading', { level })) return level
  }
  return 0
})

const isInList = computed(() => {
  return (
    props.editor.isActive('bulletList') ||
    props.editor.isActive('orderedList') ||
    props.editor.isActive('taskList')
  )
})

const currentListType = computed(() => {
  if (props.editor.isActive('bulletList')) return 'bullet'
  if (props.editor.isActive('orderedList')) return 'ordered'
  if (props.editor.isActive('taskList')) return 'task'
  return null
})

const isLinkActive = computed(() => props.editor.isActive('link'))

// ==================== 动作 ====================
// 设置图片对齐
const setImageAlign = (align: 'left' | 'center' | 'right') => {
  props.editor.chain().focus().updateAttributes('image', { align }).run()
}

// 删除选中内容 (图片)
const deleteSelection = () => {
  props.editor.chain().focus().deleteSelection().run()
}

// 在当前选区/节点上方插入段落
const insertParagraphAbove = () => {
  const { state } = props.editor
  const { from } = state.selection
  // 在当前选区开始位置插入一个空段落
  props.editor.chain().insertContentAt(from, { type: 'paragraph' }).focus(from).run()
}

// 在当前选区/节点下方插入段落
const insertParagraphBelow = () => {
  const { state } = props.editor
  const { to } = state.selection
  // 在当前选区结束位置插入一个空段落
  // 注意：to 位置是在节点结束后，所以插入内容会自然在下一行
  props.editor
    .chain()
    .insertContentAt(to, { type: 'paragraph' })
    .focus(to + 1)
    .run()
}

const toggleBold = () => props.editor.chain().focus().toggleBold().run()
const toggleItalic = () => props.editor.chain().focus().toggleItalic().run()
const toggleStrike = () => props.editor.chain().focus().toggleStrike().run()
const toggleCode = () => props.editor.chain().focus().toggleCode().run()
const toggleHighlight = () => props.editor.chain().focus().toggleHighlight().run()
const toggleSuperscript = () => props.editor.chain().focus().toggleSuperscript().run()
const toggleSubscript = () => props.editor.chain().focus().toggleSubscript().run()

const setHeading = (level: 1 | 2 | 3) => {
  props.editor.chain().focus().toggleHeading({ level }).run()
}

const setListType = (type: 'bullet' | 'ordered' | 'task') => {
  const chain = props.editor.chain().focus()

  if (props.editor.isActive('bulletList')) {
    chain.toggleBulletList()
  } else if (props.editor.isActive('orderedList')) {
    chain.toggleOrderedList()
  } else if (props.editor.isActive('taskList')) {
    chain.toggleTaskList()
  }

  if (type === 'bullet') {
    chain.toggleBulletList().run()
  } else if (type === 'ordered') {
    chain.toggleOrderedList().run()
  } else if (type === 'task') {
    chain.toggleTaskList().run()
  }
}

const removeLink = () => {
  props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
}
</script>

<template>
  <div class="menu-toolbar">
    <!-- 图片操作 (仅在选中图片时显示) -->
    <template v-if="isImageActive">
      <button
        class="menu-btn"
        :class="{ 'is-active': imageAlign === 'left' }"
        title="左对齐"
        @click="setImageAlign('left')"
      >
        <IconAlignLeft size="16" />
      </button>
      <button
        class="menu-btn"
        :class="{ 'is-active': imageAlign === 'center' }"
        title="居中"
        @click="setImageAlign('center')"
      >
        <IconAlignCenter size="16" />
      </button>
      <button
        class="menu-btn"
        :class="{ 'is-active': imageAlign === 'right' }"
        title="右对齐"
        @click="setImageAlign('right')"
      >
        <IconAlignRight size="16" />
      </button>
      <button class="menu-btn danger" title="删除图片" @click="deleteSelection">
        <IconTrash size="16" />
      </button>
      <div class="divider"></div>
    </template>

    <!-- 块级操作 (仅在选中块时显示) -->
    <template v-if="isBlockActive">
      <button class="menu-btn" title="在上方插入段落" @click="insertParagraphAbove">
        <IconArrowBarToUp size="16" />
      </button>
      <button class="menu-btn" title="在下方插入段落" @click="insertParagraphBelow">
        <IconArrowBarToDown size="16" />
      </button>
      <div class="divider"></div>
    </template>

    <!-- 标题切换 -->
    <template v-if="isInHeading">
      <button
        class="menu-btn"
        :class="{ 'is-active': currentHeadingLevel === 1 }"
        title="一级标题"
        @click="setHeading(1)"
      >
        <IconH1 size="16" />
      </button>
      <button
        class="menu-btn"
        :class="{ 'is-active': currentHeadingLevel === 2 }"
        title="二级标题"
        @click="setHeading(2)"
      >
        <IconH2 size="16" />
      </button>
      <button
        class="menu-btn"
        :class="{ 'is-active': currentHeadingLevel === 3 }"
        title="三级标题"
        @click="setHeading(3)"
      >
        <IconH3 size="16" />
      </button>
      <div class="divider"></div>
    </template>

    <!-- 列表切换 -->
    <template v-if="isInList">
      <button
        class="menu-btn"
        :class="{ 'is-active': currentListType === 'bullet' }"
        title="无序列表"
        @click="setListType('bullet')"
      >
        <IconList size="16" />
      </button>
      <button
        class="menu-btn"
        :class="{ 'is-active': currentListType === 'ordered' }"
        title="有序列表"
        @click="setListType('ordered')"
      >
        <IconListNumbers size="16" />
      </button>
      <button
        class="menu-btn"
        :class="{ 'is-active': currentListType === 'task' }"
        title="任务列表"
        @click="setListType('task')"
      >
        <IconCheckbox size="16" />
      </button>
      <div class="divider"></div>
    </template>

    <!-- 基础格式 (仅当不是图片时显示) -->
    <template v-if="!isImageActive">
      <button
        class="menu-btn"
        :class="{ 'is-active': editor.isActive('bold') }"
        title="加粗 (Ctrl+B)"
        @click="toggleBold"
      >
        <IconBold size="16" />
      </button>
      <button
        class="menu-btn"
        :class="{ 'is-active': editor.isActive('italic') }"
        title="斜体 (Ctrl+I)"
        @click="toggleItalic"
      >
        <IconItalic size="16" />
      </button>
      <button
        class="menu-btn"
        :class="{ 'is-active': editor.isActive('strike') }"
        title="删除线"
        @click="toggleStrike"
      >
        <IconStrikethrough size="16" />
      </button>

      <button
        class="menu-btn"
        :class="{ 'is-active': editor.isActive('highlight') }"
        title="高亮"
        @click="toggleHighlight"
      >
        <IconHighlight size="16" />
      </button>
      <button
        class="menu-btn"
        :class="{ 'is-active': editor.isActive('superscript') }"
        title="上标"
        @click="toggleSuperscript"
      >
        <IconSuperscript size="16" />
      </button>
      <button
        class="menu-btn"
        :class="{ 'is-active': editor.isActive('subscript') }"
        title="下标"
        @click="toggleSubscript"
      >
        <IconSubscript size="16" />
      </button>

      <div class="divider"></div>

      <button
        class="menu-btn"
        :class="{ 'is-active': editor.isActive('code') }"
        title="行内代码"
        @click="toggleCode"
      >
        <IconCode size="16" />
      </button>

      <button
        class="menu-btn"
        :class="{ 'is-active': isLinkActive }"
        title="链接 (Ctrl+K)"
        @click="emit('edit-link')"
      >
        <IconLink size="16" />
      </button>

      <button v-if="isLinkActive" class="menu-btn danger" title="移除链接" @click="removeLink">
        <IconUnlink size="16" />
      </button>
    </template>
  </div>
</template>

<style scoped>
.menu-toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
}

.menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.menu-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.menu-btn.is-active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.menu-btn.danger:hover {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}

.divider {
  width: 1px;
  height: 16px;
  background: var(--border-divider);
  margin: 0 4px;
}
</style>
