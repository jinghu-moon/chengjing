import { ref, watch, computed } from 'vue'

export interface Note {
  id: string
  title: string
  content: string // Markdown content
  updatedAt: number
  createdAt: number
  isPinned?: boolean
}

export type SortMode = 'updated' | 'created' | 'title'

const notes = ref<Note[]>([])
const sortMode = ref<SortMode>('updated')
const isInitialized = ref(false)

export function useNotes() {
  const initNotes = () => {
    if (isInitialized.value) return
    const saved = localStorage.getItem('lime_notes')
    if (saved) {
      try {
        notes.value = JSON.parse(saved)
      } catch (e) {
        notes.value = []
      }
    }

    // 如果没有笔记，创建一个默认的
    if (notes.value.length === 0) {
      createNote(
        '欢迎使用便签',
        '# Hello Nord\n\n这是一个支持 **Markdown** 预览的笔记组件。\n\n- [x] 支持实时预览\n- [ ] 支持代码高亮\n\n```javascript\nconst hello = "world";\n```'
      )
    }

    isInitialized.value = true
  }

  watch(
    notes,
    newVal => {
      localStorage.setItem('lime_notes', JSON.stringify(newVal))
    },
    { deep: true }
  )

  // 排序逻辑
  const sortedNotes = computed(() => {
    return [...notes.value].sort((a, b) => {
      // 1. 置顶优先
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1

      // 2. 排序规则
      switch (sortMode.value) {
        case 'created':
          // 创建时间降序
          return (b.createdAt || 0) - (a.createdAt || 0)
        case 'title':
          // 标题 A-Z
          return (a.title || '').localeCompare(b.title || '')
        case 'updated':
        default:
          // 更新时间降序
          return b.updatedAt - a.updatedAt
      }
    })
  })

  const createNote = (title = '无标题笔记', content = '') => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title,
      content,
      updatedAt: Date.now(),
      createdAt: Date.now(),
      isPinned: false,
    }
    notes.value.unshift(newNote)
    return newNote
  }

  const updateNote = (id: string, updates: Partial<Note>) => {
    const index = notes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notes.value[index] = {
        ...notes.value[index],
        ...updates,
        updatedAt: Date.now(),
      }
    }
  }

  const togglePin = (id: string) => {
    const note = notes.value.find(n => n.id === id)
    if (note) {
      updateNote(id, { isPinned: !note.isPinned })
    }
  }

  const deleteNote = (id: string) => {
    const index = notes.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notes.value.splice(index, 1)
    }
  }

  const getNote = (id: string) => notes.value.find(n => n.id === id)

  return {
    notes,
    sortedNotes,
    sortMode,
    initNotes,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    getNote,
  }
}
