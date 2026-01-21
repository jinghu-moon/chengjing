<script setup lang="ts">
/**
 * NotePadEditor.vue
 */
import { ref, computed, defineAsyncComponent, onMounted, onUnmounted } from 'vue'
import {
  IconX,
  IconDownload,
  IconArrowsMinimize,
  IconMarkdown,
  IconFileText,
  IconChevronDown,
  IconFileTypeTxt,
  IconSettings,
} from '@tabler/icons-vue'
// [类型导入] Select 组件类型定义
import type { OptionItem } from '@/components/SelectMenu'
// [自动导入] useSettings, useAsyncWordCount, downloadFile, stripMarkdown, processMarkdownForExport
import dayjs from 'dayjs'

const TipTapEditor = defineAsyncComponent(() => import('./TipTapEditor.vue'))

interface Note {
  id: string
  title: string
  content: string
}

const props = defineProps<{
  note: Note
}>()

const emit = defineEmits<{
  (e: 'update:title', title: string): void
  (e: 'update:content', content: string): void
  (e: 'collapse'): void
  (e: 'export'): void
}>()

const { settings } = useSettings()

const showSettings = ref(false)
const toggleSettings = () => (showSettings.value = !showSettings.value)
const closeSettings = () => (showSettings.value = false)

// Click outside to close settings
const settingsRef = ref<HTMLElement | null>(null)

const handleClickOutside = (e: MouseEvent) => {
  if (showSettings.value && settingsRef.value && !settingsRef.value.contains(e.target as Node)) {
    closeSettings()
  }
}

onMounted(() => window.addEventListener('click', handleClickOutside))
onUnmounted(() => window.removeEventListener('click', handleClickOutside))

// 双向绑定
const noteTitle = computed({
  get: () => props.note.title,
  set: val => emit('update:title', val),
})

const noteContent = computed({
  get: () => props.note.content,
  set: val => emit('update:content', val),
})

// 编辑器模式切换
const toggleEditorMode = () => {
  settings.notePadEditorMode = settings.notePadEditorMode === 'rich' ? 'plain' : 'rich'
}

// Tab 键处理 (纯文本模式)
const handleTab = (e: KeyboardEvent) => {
  const textarea = e.target as HTMLTextAreaElement
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const spaces = '  '
  noteContent.value =
    noteContent.value.substring(0, start) + spaces + noteContent.value.substring(end)
  setTimeout(() => {
    textarea.selectionStart = textarea.selectionEnd = start + spaces.length
  }, 0)
}

// ==================== 字数统计 ====================
const isRichTextMode = computed(() => settings.notePadEditorMode === 'rich')
const { fullStats } = useAsyncWordCount(noteContent, isRichTextMode, 300)

type StatsType =
  | 'words'
  | 'characters'
  | 'charactersWithSpaces'
  | 'lines'
  | 'paragraphs'
  | 'cjk'
  | 'nonCjk'
  | 'cjkAndNonCjk'
const currentStatsType = ref<StatsType>('words')

const statsTypeOptions = computed<OptionItem[]>(() => [
  { label: '字数', value: 'words', type: 'default', checked: currentStatsType.value === 'words' },
  {
    label: '中文 + 非中文',
    value: 'cjkAndNonCjk',
    type: 'default',
    checked: currentStatsType.value === 'cjkAndNonCjk',
  },
  { label: '中文字符', value: 'cjk', type: 'default', checked: currentStatsType.value === 'cjk' },
  {
    label: '非中文单词',
    value: 'nonCjk',
    type: 'default',
    checked: currentStatsType.value === 'nonCjk',
  },
  {
    label: '字符数(不含空格)',
    value: 'characters',
    type: 'default',
    checked: currentStatsType.value === 'characters',
  },
  {
    label: '字符数(含空格)',
    value: 'charactersWithSpaces',
    type: 'default',
    checked: currentStatsType.value === 'charactersWithSpaces',
  },
  { label: '行数', value: 'lines', type: 'default', checked: currentStatsType.value === 'lines' },
  {
    label: '段落数',
    value: 'paragraphs',
    type: 'default',
    checked: currentStatsType.value === 'paragraphs',
  },
])

// ==================== 导出功能 ====================
// 导出格式选项
const exportOptions = computed<OptionItem[]>(() => [
  { label: 'Markdown (*.md)', value: 'md', prefixIcon: IconMarkdown, type: 'default' },
  { label: '纯文本 (*.txt)', value: 'txt', prefixIcon: IconFileTypeTxt, type: 'default' },
])

const handleExportSelect = async (opt: OptionItem) => {
  if (!props.note) return

  const title = props.note.title || '未命名笔记'
  const date = dayjs().format('YYYY-MM-DD')
  const filename = `${title}_${date}`
  const content = props.note.content || ''

  if (opt.value === 'md') {
    // 导出前将 blob 图片转为 base64
    const processedContent = await processMarkdownForExport(content)
    downloadFile(`${filename}.md`, processedContent, 'text/markdown')
  } else if (opt.value === 'txt') {
    // 纯文本导出：尝试去除 Markdown 格式
    const plainText = stripMarkdown(content)
    downloadFile(`${filename}.txt`, plainText, 'text/plain')
  }
}

const displayStats = computed(() => {
  if (!fullStats.value) return { text: '0 字', isCombo: false }
  const stats = fullStats.value
  switch (currentStatsType.value) {
    case 'words':
      return { text: `${stats.total} 字`, isCombo: false }
    case 'cjkAndNonCjk':
      return { text: `${stats.cjk} 中文 + ${stats.nonCjk} 非中文`, isCombo: true }
    case 'cjk':
      return { text: `${stats.cjk} 中文字符`, isCombo: false }
    case 'nonCjk':
      return { text: `${stats.nonCjk} 非中文词`, isCombo: false }
    case 'characters':
      return { text: `${stats.characters} 字符`, isCombo: false }
    case 'charactersWithSpaces':
      return { text: `${stats.charactersWithSpaces} 字符`, isCombo: false }
    case 'lines':
      return { text: `${stats.lines} 行`, isCombo: false }
    case 'paragraphs':
      return { text: `${stats.paragraphs} 段`, isCombo: false }
    default:
      return { text: `${stats.total} 字`, isCombo: false }
  }
})

// 统计下拉菜单无需手动管理状态，Select 组件由自动导入插件处理
// 注册/注销事件 already handled above
</script>

<template>
  <div class="main-area">
    <div class="main-header">
      <input v-model="noteTitle" class="title-input" placeholder="输入标题..." />

      <div class="toolbar">
        <div class="stats-dropdown-wrapper">
          <SelectMenu
            class="ghost no-padding"
            :options="statsTypeOptions"
            :model-value="currentStatsType"
            placement="topCenter"
            :show-arrow="false"
            dropdown-min-width="140px"
            trigger-width="auto"
            @update:model-value="(val: string) => (currentStatsType = val as StatsType)"
          >
            <template #trigger>
              <span class="save-status" style="cursor: pointer">
                {{ displayStats.text }}
                <IconChevronDown :size="12" style="margin-left: 2px; vertical-align: middle" />
              </span>
            </template>
          </SelectMenu>
        </div>
        <span class="save-divider">|</span>
        <span class="save-label">已保存</span>

        <div class="export-dropdown-wrapper">
          <SelectMenu
            class="ghost no-padding"
            :options="exportOptions"
            placement="bottomCenter"
            :show-arrow="false"
            dropdown-min-width="150px"
            trigger-width="auto"
            :model-value="''"
            @update:model-value="
              (val: string) => handleExportSelect(exportOptions.find(o => o.value === val)!)
            "
          >
            <template #trigger>
              <button class="toolbar-btn" title="导出笔记">
                <IconDownload size="18" />
              </button>
            </template>
          </SelectMenu>
        </div>

        <div ref="settingsRef" class="settings-dropdown-wrapper">
          <button class="toolbar-btn" title="图片设置" @click.stop="toggleSettings">
            <IconSettings size="18" />
          </button>
          <div v-if="showSettings" class="settings-panel">
            <div class="setting-row">
              <label>开启图片压缩</label>
              <input v-model="settings.compressImages" type="checkbox" />
            </div>
            <template v-if="settings.compressImages">
              <div class="setting-row">
                <label>最大体积</label>
                <select v-model.number="settings.maxImageSizeMB">
                  <option :value="0.5">0.5MB</option>
                  <option :value="1">1MB</option>
                  <option :value="2">2MB</option>
                  <option :value="5">5MB</option>
                </select>
              </div>
              <div class="setting-row">
                <label>最大宽度</label>
                <select v-model.number="settings.maxImageWidth">
                  <option :value="800">800px</option>
                  <option :value="1200">1200px</option>
                  <option :value="1600">1600px</option>
                  <option :value="1920">1920px</option>
                </select>
              </div>
            </template>
          </div>
        </div>

        <button
          class="toolbar-btn"
          :title="settings.notePadEditorMode === 'rich' ? '切换到轻量模式' : '切换到富文本模式'"
          @click="toggleEditorMode"
        >
          <IconMarkdown v-if="settings.notePadEditorMode === 'rich'" size="18" />
          <IconFileText v-else size="18" />
        </button>

        <button class="toolbar-btn" title="收起为迷你模式" @click="$emit('collapse')">
          <IconArrowsMinimize size="18" />
        </button>
        <button class="close-btn" @click="$emit('collapse')">
          <IconX size="20" />
        </button>
      </div>
    </div>

    <div class="content-wrapper">
      <div class="editor-pane">
        <Suspense>
          <template #default>
            <TipTapEditor v-if="settings.notePadEditorMode === 'rich'" v-model="noteContent" />
            <textarea
              v-else
              v-model="noteContent"
              class="plain-editor"
              placeholder="开始输入..."
              @keydown.tab.prevent="handleTab"
            ></textarea>
          </template>
          <template #fallback>
            <div class="editor-loading">加载编辑器...</div>
          </template>
        </Suspense>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.main-header {
  height: 50px;
  border-bottom: 1px solid var(--border-glass);
  display: flex;
  align-items: center;
  padding: 0 16px;
  justify-content: space-between;
}

.title-input {
  background: transparent;
  border: none;
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--text-primary);
  width: 40%;
  outline: none;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.save-status {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  transition: all 0.15s;
}

.save-status:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.save-divider {
  font-size: var(--text-xs);
  color: var(--text-placeholder);
}

.save-label {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.stats-dropdown-wrapper {
  display: inline-flex;
  align-items: center;
}

.toolbar-btn,
.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.close-btn:hover {
  color: var(--color-danger);
}

.content-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-pane {
  flex: 1;
  height: 100%;
  overflow: hidden;
  min-width: 0;
}

.plain-editor {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  resize: none;
  outline: none;
  color: var(--text-primary);
  font-family: var(--font-family-mono);
  font-size: var(--text-sm);
  line-height: 1.6;
  padding: 12px 16px;
  box-sizing: border-box;
}

.plain-editor::placeholder {
  color: var(--text-placeholder);
}

.editor-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-tertiary);
  font-size: var(--text-xs);
}

.custom-select.no-padding :deep(.select-trigger) {
  padding: 0;
  height: auto;
  border: none;
}

.custom-select.no-padding :deep(.icon-wrapper) {
  display: none;
}

.settings-dropdown-wrapper {
  position: relative;
}

.settings-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: var(--bg-panel);
  border: 1px solid var(--border-divider);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  min-width: 160px;
  z-index: 50;
  box-shadow: var(--shadow-xl);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.setting-row:last-child {
  margin-bottom: 0;
}

.setting-row select {
  background: var(--bg-input);
  border: 1px solid var(--border-divider);
  color: var(--text-primary);
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 11px;
  outline: none;
}

.setting-row input[type='checkbox'] {
  accent-color: var(--color-primary);
}
</style>
