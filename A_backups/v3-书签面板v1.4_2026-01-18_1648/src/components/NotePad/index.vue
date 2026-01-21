<script setup lang="ts">
/**
 * NotePad.vue
 * 便签模块父容器 - 协调三种模式：图标、迷你、展开
 */
// [自动导入] ref, computed, onMounted 等
// [自动导入] useNotes, useSettings, processMarkdownForExport (来自 composables/utils)

// [组件自动导入] NotePadTrigger, MiniNotePad, NotePadSidebar, NotePadEditor
// 无需显式 import，模板中直接使用即可

const { notes, sortedNotes, sortMode, initNotes, createNote, updateNote, deleteNote, togglePin } =
  useNotes()
const { settings } = useSettings()

// ==================== 三态控制 ====================
const isMiniOpen = ref(false)
const isExpanded = ref(false)

// ==================== 迷你模式内容 ====================
const miniContent = ref('')

// ==================== 展开模式状态 ====================
const activeNoteId = ref<string | null>(null)

const activeNote = computed(() => notes.value.find(n => n.id === activeNoteId.value) || null)

// ==================== 初始化 ====================
onMounted(() => {
  initNotes()
  if (notes.value.length > 0) {
    activeNoteId.value = notes.value[0].id
  }
  const savedMini = localStorage.getItem('lime_mini_note')
  if (savedMini) miniContent.value = savedMini

  window.addEventListener('reset-notepad-position', handleResetPosition)
})

const handleResetPosition = () => {
  localStorage.removeItem('lime_note_position')
}

onUnmounted(() => {
  window.removeEventListener('reset-notepad-position', handleResetPosition)
})

// ==================== 迷你便签自动保存 ====================
let saveTimeout: any = null
const saveMiniContent = () => {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    localStorage.setItem('lime_mini_note', miniContent.value)
  }, 1000)
}

watch(miniContent, saveMiniContent)

// ==================== 模式切换 ====================
const openMini = () => {
  isMiniOpen.value = true
}

const closeMini = () => {
  isMiniOpen.value = false
}

const expandNote = () => {
  isExpanded.value = true
  isMiniOpen.value = false

  if (miniContent.value.trim()) {
    if (activeNoteId.value && notes.value.find(n => n.id === activeNoteId.value)) {
      updateNote(activeNoteId.value, { content: miniContent.value })
    } else {
      const firstLine = miniContent.value.split('\n')[0].slice(0, 20) || '快速便签'
      const note = createNote(firstLine, miniContent.value)
      activeNoteId.value = note.id
    }
    saveMiniContent()
  } else if (notes.value.length > 0) {
    if (!activeNoteId.value) {
      activeNoteId.value = notes.value[0].id
    }
  }
}

const collapseNote = () => {
  if (activeNote.value) {
    miniContent.value = activeNote.value.content
    saveMiniContent()
  }
  isExpanded.value = false
  isMiniOpen.value = true
}

// ==================== 笔记操作 ====================
const handleCreate = () => {
  const note = createNote()
  activeNoteId.value = note.id
}

const handleDelete = (id: string) => {
  deleteNote(id)
  if (activeNoteId.value === id) {
    activeNoteId.value = notes.value.length > 0 ? notes.value[0].id : null
  }
}

const handleUpdateTitle = (title: string) => {
  if (activeNote.value) {
    updateNote(activeNote.value.id, { title })
  }
}

const handleUpdateContent = (content: string) => {
  if (activeNote.value) {
    updateNote(activeNote.value.id, { content })
  }
}

// ==================== 导入导出 ====================
const fileInput = ref<HTMLInputElement | null>(null)

const triggerImport = () => {
  fileInput.value?.click()
}

const handleImport = (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = event => {
    const content = event.target?.result as string
    const title = file.name.replace(/\.(md|txt)$/i, '') || '导入的笔记'
    const note = createNote(title, content)
    activeNoteId.value = note.id
  }
  reader.readAsText(file)
  input.value = ''
}

const exportNote = async () => {
  if (!activeNote.value) return

  // 处理图片 URL，转换为 Base64
  const processedContent = await processMarkdownForExport(activeNote.value.content)

  const blob = new Blob([processedContent], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${activeNote.value.title || '笔记'}.md`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="notepad-container" v-bind="$attrs">
    <!-- 图标触发器 -->
    <NotePadTrigger
      :visible="settings.showNotePad && !isMiniOpen && !isExpanded"
      @open="openMini"
    />

    <!-- 迷你模式 -->
    <MiniNotePad
      v-model="miniContent"
      :visible="settings.showNotePad && isMiniOpen && !isExpanded"
      @expand="expandNote"
      @close="closeMini"
    />

    <!-- 展开模式 -->
    <Transition name="fade">
      <div
        v-if="settings.showNotePad && isExpanded"
        class="note-overlay"
        @click.self="collapseNote"
      >
        <div class="note-panel">
          <!-- 侧边栏 -->
          <NotePadSidebar
            :notes="sortedNotes"
            :active-note-id="activeNoteId"
            :sort-mode="sortMode"
            @update:active-note-id="activeNoteId = $event"
            @update:sort-mode="sortMode = $event"
            @create="handleCreate"
            @delete="handleDelete"
            @toggle-pin="togglePin"
            @import="triggerImport"
          />

          <!-- 编辑区域 -->
          <NotePadEditor
            v-if="activeNote"
            :note="activeNote"
            @update:title="handleUpdateTitle"
            @update:content="handleUpdateContent"
            @collapse="collapseNote"
            @export="exportNote"
          />

          <!-- 空状态 -->
          <div v-else class="empty-state">
            <div class="empty-content">
              <h2>选择或创建一个笔记</h2>
              <button class="primary-btn" @click="handleCreate">新建笔记</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 隐藏的文件输入框 -->
    <input
      ref="fileInput"
      type="file"
      accept=".md,.txt"
      style="display: none"
      @change="handleImport"
    />
  </div>
</template>

<style>
@import './styles.css';
</style>
