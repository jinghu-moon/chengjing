<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { Editor } from '@tiptap/vue-3'
import { IconCheck, IconX, IconUnlink } from '@tabler/icons-vue'

const props = defineProps<{
  editor: Editor
  initialUrl: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'apply', url: string): void
  (e: 'remove'): void
}>()

const linkUrl = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  linkUrl.value = props.initialUrl || ''
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
})

const applyLink = () => {
  emit('apply', linkUrl.value)
}

const removeLink = () => {
  emit('remove')
}

const cancel = () => {
  emit('close')
}

const onInputKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    applyLink()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    cancel()
  }
}

const isLinkActive = props.editor.isActive('link')
</script>

<template>
  <div class="link-form">
    <input
      ref="inputRef"
      v-model="linkUrl"
      type="text"
      placeholder="输入链接..."
      class="link-input"
      @keydown="onInputKeydown"
      @mousedown.stop
    />

    <button class="menu-btn primary" title="确认" @click="applyLink">
      <IconCheck size="16" />
    </button>

    <button v-if="isLinkActive" class="menu-btn danger" title="移除链接" @click="removeLink">
      <IconUnlink size="16" />
    </button>

    <button class="menu-btn" title="取消" @click="cancel">
      <IconX size="16" />
    </button>
  </div>
</template>

<style scoped>
.link-form {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 2px;
}

.link-input {
  background: var(--bg-input);
  border: var(--border-divider);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: var(--text-xs);
  padding: 4px 8px;
  width: 180px;
  outline: none;
  transition: all 0.2s;
}

.link-input:focus {
  background: var(--bg-active);
  border-color: var(--color-primary);
}

.link-input::placeholder {
  color: var(--text-placeholder);
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

.menu-btn.primary {
  color: var(--color-primary);
}

.menu-btn.primary:hover {
  background: var(--color-primary-bg);
}

.menu-btn.danger:hover {
  color: var(--color-danger);
  background: var(--color-danger-bg);
}
</style>
