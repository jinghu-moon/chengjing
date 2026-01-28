// 移除本地依赖，改为定义
// import type { LocalPoem } from '@/composables/useDailyPoem'

// ===== 核心数据类型 =====

/** 本地存储的诗词（带 ID） */
export interface LocalPoem {
  id: string
  content: string
  author: string
  title?: string
  dynasty?: string
  createdAt: number
}

/** 展示用诗词（不含元数据） */
export interface Poem {
  content: string
  author: string
  title?: string
  dynasty?: string
}

export type ApiSource = 'jinrishici' | 'hitokoto'
export type HitokotoCategory = 'a' | 'b' | 'c' | 'd' | 'h' | 'i' | 'k'

export interface DailyPoemSettings {
  online: boolean
  source: ApiSource
  hitokotoCategories: HitokotoCategory[]
  showAuthor: boolean
  showTitle: boolean
  showCollect: boolean
  showRefresh: boolean
  showCard: boolean
  showManager: boolean
}

// ===== 组件 Props 类型 =====

export type ViewMode = 'list' | 'form'

export interface PoemFormData {
  content: string
  author: string
  title: string
  dynasty: string
}

export interface PoemListProps {
  poems: LocalPoem[]
  // totalCount needs to be passed if we want to display it
  totalCount: number
  loading?: boolean
}

export interface PoemFormProps {
  initialData?: PoemFormData
  loading?: boolean
  isEdit?: boolean
}
