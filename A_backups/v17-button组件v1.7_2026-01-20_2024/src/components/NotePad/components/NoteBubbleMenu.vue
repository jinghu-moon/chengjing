<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Editor } from '@tiptap/vue-3'
// [修复] 引用路径修正为 ../composables
import { useBubbleMenuPosition } from '../composables/useBubbleMenuPosition'
// [自动导入] BubbleToolbar, BubbleLinkForm 由 unplugin 处理 (但这是子组件目录下的，如果是显式引用也可以保留)
// 这里我们保持显式引用，因为它们位于 ./BubbleMenu/ 目录下，并非标准 components 根目录，自动导入可能扫不到
import BubbleToolbar from './BubbleMenu/BubbleToolbar.vue'
import BubbleLinkForm from './BubbleMenu/BubbleLinkForm.vue'

const props = defineProps<{
  editor: Editor
}>()

// ==================== 状态管理 ====================
const tooltipRef = ref<HTMLElement | null>(null)
const showLinkInput = ref(false) // 是否显示链接输入框

// ==================== 定位逻辑 ====================
const {
  isOpen,
  actualPlacement,
  tooltipStyle,
  arrowStyle,
  updatePosition,
  getBaseDirection,
  handleMouseDown,
} = useBubbleMenuPosition({
  editor: props.editor,
  tooltipRef,
  isEditingLink: showLinkInput,
})

const baseDirection = computed(() => getBaseDirection(actualPlacement.value))

// ==================== 链接编辑逻辑 ====================
const currentLinkUrl = ref('')

const startEditLink = () => {
  const previousUrl = props.editor.getAttributes('link').href
  currentLinkUrl.value = previousUrl || ''
  showLinkInput.value = true

  // 等待 DOM 更新后重新计算位置 (因为表单可能比工具栏窄或宽)
  nextTick(() => updatePosition())
}

const applyLink = (url: string) => {
  if (url.trim()) {
    props.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  } else {
    removeLink()
  }
  showLinkInput.value = false
}

const removeLink = () => {
  props.editor.chain().focus().extendMarkRange('link').unsetLink().run()
  showLinkInput.value = false
}

const closeLinkInput = () => {
  showLinkInput.value = false
  props.editor.chain().focus().run()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="tooltip-fade">
      <div
        v-if="isOpen"
        ref="tooltipRef"
        class="note-bubble-menu"
        :class="[`placement-${actualPlacement}`]"
        :style="tooltipStyle"
        tabindex="0"
        @mousedown="handleMouseDown"
      >
        <div class="tooltip-arrow" :class="[`arrow-${baseDirection}`]" :style="arrowStyle" />

        <!-- 工具栏模式 -->
        <BubbleToolbar v-if="!showLinkInput" :editor="editor" @edit-link="startEditLink" />

        <!-- 链接编辑模式 -->
        <BubbleLinkForm
          v-else
          :editor="editor"
          :initial-url="currentLinkUrl"
          @apply="applyLink"
          @remove="removeLink"
          @close="closeLinkInput"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.note-bubble-menu {
  position: fixed;
  z-index: 9999;
  padding: 4px;
  background: var(--bg-panel-dark, rgba(30, 34, 44, 0.95));
  backdrop-filter: blur(var(--blur-md, 12px));
  -webkit-backdrop-filter: blur(var(--blur-md, 12px));
  border: var(--border-glass, 1px solid rgba(255, 255, 255, 0.08));
  border-radius: var(--radius-md, 8px);
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.2));
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  outline: none;
}

/* ========== 箭头 ========== */
.tooltip-arrow {
  position: absolute;
  width: 8px;
  height: 8px;
  pointer-events: none;
  transform: translateX(-50%);
}

.tooltip-arrow::before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--bg-panel-dark, rgba(30, 34, 44, 0.95));
  border: var(--border-glass, 1px solid rgba(255, 255, 255, 0.08));
  transform: rotate(45deg);
  box-sizing: border-box;
  border-radius: 2px;
}

.arrow-top {
  bottom: -4px;
  left: 50%;
}

.arrow-top::before {
  border-top-color: transparent !important;
  border-left-color: transparent !important;
}

.arrow-bottom {
  top: -4px;
  left: 50%;
}

.arrow-bottom::before {
  border-bottom-color: transparent !important;
  border-right-color: transparent !important;
}

.arrow-left {
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
}

.arrow-left::before {
  transform: rotate(135deg);
  border-bottom-color: transparent !important;
  border-right-color: transparent !important;
}

.arrow-right {
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
}

.arrow-right::before {
  transform: rotate(135deg);
  border-top-color: transparent !important;
  border-left-color: transparent !important;
}

/* ========== 动画 ========== */
.tooltip-fade-enter-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tooltip-fade-leave-active {
  transition:
    opacity 0.1s ease,
    transform 0.1s ease;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
}

.placement-top.tooltip-fade-enter-from,
.placement-top-start.tooltip-fade-enter-from,
.placement-top-end.tooltip-fade-enter-from,
.placement-top.tooltip-fade-leave-to,
.placement-top-start.tooltip-fade-leave-to,
.placement-top-end.tooltip-fade-leave-to {
  transform: translateY(6px);
}

.placement-bottom.tooltip-fade-enter-from,
.placement-bottom-start.tooltip-fade-enter-from,
.placement-bottom-end.tooltip-fade-enter-from,
.placement-bottom.tooltip-fade-leave-to,
.placement-bottom-start.tooltip-fade-leave-to,
.placement-bottom-end.tooltip-fade-leave-to {
  transform: translateY(-6px);
}

.placement-left.tooltip-fade-enter-from,
.placement-left-start.tooltip-fade-enter-from,
.placement-left-end.tooltip-fade-enter-from,
.placement-left.tooltip-fade-leave-to,
.placement-left-start.tooltip-fade-leave-to,
.placement-left-end.tooltip-fade-leave-to {
  transform: translateX(6px);
}

.placement-right.tooltip-fade-enter-from,
.placement-right-start.tooltip-fade-enter-from,
.placement-right-end.tooltip-fade-enter-from,
.placement-right.tooltip-fade-leave-to,
.placement-right-start.tooltip-fade-leave-to,
.placement-right-end.tooltip-fade-leave-to {
  transform: translateX(-6px);
}
</style>
