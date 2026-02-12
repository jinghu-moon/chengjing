import { ref, computed } from 'vue'
import { watchDebounced } from '@vueuse/core'
import type { Engine } from '../types'

const STORAGE_KEY = 'lime-search-engines-v2'
const ENGINE_SELECTED_KEY = 'lime-search-engine'
const GROUP_ORDER_KEY = 'lime-group-order'

/** 默认分组顺序 */
const DEFAULT_GROUP_ORDER = ['search', 'video', 'live', 'shopping', 'dev', 'ai', 'uncategorized']

/** 分组中文标签 */
export const GROUP_LABELS: Record<string, string> = {
  search: '搜索',
  video: '视频',
  live: '直播',
  shopping: '购物',
  dev: '开发',
  ai: 'AI',
  uncategorized: '未分类',
}

/** 内置引擎定义 */
export const DEFAULT_ENGINES: Engine[] = [
  // 搜索
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=%s',
    icon: 'IconBrandGoogle',
    builtin: true,
    group: 'search',
    bang: '!g',
  },
  {
    id: 'baidu',
    name: '百度',
    url: 'https://www.baidu.com/s?wd=%s',
    icon: 'IconPaw',
    builtin: true,
    group: 'search',
    bang: '!bd',
  },
  {
    id: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=%s',
    icon: 'IconBrandBing',
    builtin: true,
    group: 'search',
    bang: '!bi',
  },
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=%s',
    icon: 'IconWorld',
    builtin: true,
    group: 'search',
    bang: '!ddg',
  },

  // 视频
  {
    id: 'bilibili',
    name: 'Bilibili',
    url: 'https://search.bilibili.com/all?keyword=%s',
    icon: 'IconBrandBilibili',
    builtin: true,
    group: 'video',
    bang: '!b',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com/results?search_query=%s',
    icon: 'IconBrandYoutube',
    builtin: true,
    group: 'video',
    bang: '!yt',
  },
  {
    id: 'tiktok',
    name: '抖音',
    url: 'https://www.douyin.com/search/%s',
    icon: 'IconBrandTiktok',
    builtin: true,
    group: 'video',
    bang: '!dy',
  },

  // 直播
  {
    id: 'twitch',
    name: 'Twitch',
    url: 'https://www.twitch.tv/search?term=%s',
    icon: 'IconBrandTwitch',
    builtin: true,
    group: 'live',
    bang: '!tw',
  },
  {
    id: 'douyu',
    name: '斗鱼',
    url: 'https://www.douyu.com/search/%s',
    icon: 'IconWorld',
    builtin: true,
    group: 'live',
    bang: '!dyu',
  },
  {
    id: 'huya',
    name: '虎牙',
    url: 'https://www.huya.com/search?hsk=%s',
    icon: 'IconWorld',
    builtin: true,
    group: 'live',
    bang: '!hy',
  },

  // 购物
  {
    id: 'taobao',
    name: '淘宝',
    url: 'https://s.taobao.com/search?q=%s',
    icon: 'IconWorld',
    builtin: true,
    group: 'shopping',
    bang: '!tb',
  },
  {
    id: 'jd',
    name: '京东',
    url: 'https://search.jd.com/Search?keyword=%s',
    icon: 'IconWorld',
    builtin: true,
    group: 'shopping',
    bang: '!jd',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    url: 'https://www.amazon.com/s?k=%s',
    icon: 'IconBrandAmazon',
    builtin: true,
    group: 'shopping',
    bang: '!az',
  },

  // 开发
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com/search?q=%s',
    icon: 'IconBrandGithub',
    builtin: true,
    group: 'dev',
    bang: '!gh',
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    url: 'https://stackoverflow.com/search?q=%s',
    icon: 'IconBrandStackoverflow',
    builtin: true,
    group: 'dev',
    bang: '!so',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    url: 'https://www.reddit.com/search/?q=%s',
    icon: 'IconBrandReddit',
    builtin: true,
    group: 'dev',
    bang: '!rd',
  },

  // AI & 知识
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chat.openai.com/?q=%s',
    icon: 'IconBrandOpenai',
    builtin: true,
    group: 'ai',
    bang: '!ai',
  },
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    url: 'https://zh.wikipedia.org/wiki/%s',
    icon: 'IconBrandWikipedia',
    builtin: true,
    group: 'ai',
    bang: '!wiki',
  },
]

// ==================== 持久化工具 ====================

function loadEngines(): Engine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ENGINES.map(e => ({ ...e }))
    const parsed = JSON.parse(raw) as Engine[]
    return parsed.length > 0 ? parsed : DEFAULT_ENGINES.map(e => ({ ...e }))
  } catch {
    return DEFAULT_ENGINES.map(e => ({ ...e }))
  }
}

function persistEngines(list: Engine[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}


function loadSelectedId(): string {
  return localStorage.getItem(ENGINE_SELECTED_KEY) ?? DEFAULT_ENGINES[0].id
}

function persistSelectedId(id: string) {
  localStorage.setItem(ENGINE_SELECTED_KEY, id)
}

function loadGroupOrder(): string[] {
  try {
    const raw = localStorage.getItem(GROUP_ORDER_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch { /* 静默降级 */ }
  return [...DEFAULT_GROUP_ORDER]
}

function persistGroupOrder(order: string[]) {
  localStorage.setItem(GROUP_ORDER_KEY, JSON.stringify(order))
}

// 勾选状态不持久化 (会话级)
const checkedEngineIds = ref<Set<string>>(new Set())

// ==================== Composable ====================

/** 全局单例状态 */
const engines = ref<Engine[]>(loadEngines())
const selectedId = ref<string>(loadSelectedId())
const groupOrder = ref<string[]>(loadGroupOrder())

export function useEngines() {
  /** 当前选中引擎（保证始终有值） */
  const currentEngine = computed<Engine>(() => {
    return engines.value.find(e => e.id === selectedId.value) ?? engines.value[0]
  })

  /** 自动持久化引擎列表（节流 500ms，避免拖拽时高频写入） */
  watchDebounced(engines, val => persistEngines(val), { deep: true, debounce: 500 })

  /** 切换当前引擎 */
  function selectEngine(id: string) {
    if (engines.value.some(e => e.id === id)) {
      selectedId.value = id
      persistSelectedId(id)
    }
  }

  /** 添加自定义引擎 */
  function addEngine(engine: Omit<Engine, 'id'>) {
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    engines.value.push({ ...engine, id, builtin: false })
  }

  /** 更新引擎信息 */
  function updateEngine(id: string, partial: Partial<Omit<Engine, 'id'>>) {
    const idx = engines.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      engines.value[idx] = { ...engines.value[idx], ...partial }
    }
  }

  /** 删除引擎（若删除当前选中，自动切换到第一个） */
  function removeEngine(id: string) {
    const idx = engines.value.findIndex(e => e.id === id)
    if (idx === -1) return

    engines.value.splice(idx, 1)

    // 若删除的是当前选中引擎，切换到第一个
    if (selectedId.value === id && engines.value.length > 0) {
      selectEngine(engines.value[0].id)
    }
  }

  /** 重排序 */
  function reorderEngines(newOrder: Engine[]) {
    engines.value = newOrder
  }

  /** 恢复默认内置引擎 */
  function resetEngines() {
    engines.value = DEFAULT_ENGINES.map(e => ({ ...e }))
    // 若当前选中引擎不在默认列表中，切换到第一个
    if (!engines.value.some(e => e.id === selectedId.value)) {
      selectEngine(engines.value[0].id)
    }
  }

  /** 根据 Bang 前缀查找引擎（如 '!g' → Google） */
  function findEngineByBang(bang: string): Engine | undefined {
    const normalized = bang.toLowerCase()
    return engines.value.find(e => e.bang?.toLowerCase() === normalized)
  }

  /** 切换到下一个引擎（Tab 循环） */
  function selectNextEngine() {
    const idx = engines.value.findIndex(e => e.id === selectedId.value)
    const nextIdx = (idx + 1) % engines.value.length
    selectEngine(engines.value[nextIdx].id)
  }

  /** 按 groupOrder 排序的分组引擎列表 */
  const groupedEngines = computed(() => {
    const grouped = new Map<string, Engine[]>()
    for (const e of engines.value) {
      const g = e.group ?? 'uncategorized'
      if (!grouped.has(g)) grouped.set(g, [])
      grouped.get(g)!.push(e)
    }
    return Array.from(grouped.keys())
      .sort((a, b) => groupOrder.value.indexOf(a) - groupOrder.value.indexOf(b))
      .map(key => ({ key, label: GROUP_LABELS[key] ?? key, engines: grouped.get(key)! }))
  })

  return {
    engines,
    currentEngine,
    selectEngine,
    addEngine,
    updateEngine,
    removeEngine,
    reorderEngines,
    resetEngines,
    findEngineByBang,
    selectNextEngine,
    // 分组
    groupOrder,
    groupedEngines,
    /** 移动引擎到指定分组的指定位置（同分组排序 / 跨分组移动） */
    moveEngine: (engineId: string, targetGroup: string, beforeEngineId?: string | null) => {
      const idx = engines.value.findIndex(e => e.id === engineId)
      if (idx === -1) return

      // 修改分组
      const engine = { ...engines.value[idx], group: targetGroup }
      // 先移除
      engines.value.splice(idx, 1)

      if (beforeEngineId) {
        // 插入到目标引擎之前
        const targetIdx = engines.value.findIndex(e => e.id === beforeEngineId)
        if (targetIdx !== -1) {
          engines.value.splice(targetIdx, 0, engine)
        } else {
          engines.value.push(engine)
        }
      } else {
        // 插入到该分组末尾：找到最后一个同分组引擎的位置
        let lastGroupIdx = -1
        for (let i = engines.value.length - 1; i >= 0; i--) {
          if ((engines.value[i].group ?? 'uncategorized') === targetGroup) {
            lastGroupIdx = i
            break
          }
        }
        engines.value.splice(lastGroupIdx + 1, 0, engine)
      }
    },
    /** 移动分组到另一个分组之前 */
    reorderGroup: (fromGroup: string, beforeGroup: string | null) => {
      const fromIdx = groupOrder.value.indexOf(fromGroup)
      if (fromIdx === -1) return

      // 先移除
      groupOrder.value.splice(fromIdx, 1)

      if (beforeGroup) {
        const toIdx = groupOrder.value.indexOf(beforeGroup)
        if (toIdx !== -1) {
          groupOrder.value.splice(toIdx, 0, fromGroup)
        } else {
          groupOrder.value.push(fromGroup)
        }
      } else {
        groupOrder.value.push(fromGroup)
      }
      persistGroupOrder(groupOrder.value)
    },
    // Checkbox 逻辑
    checkedEngineIds,
    toggleCheck: (id: string) => {
      if (checkedEngineIds.value.has(id)) {
        checkedEngineIds.value.delete(id)
      } else {
        checkedEngineIds.value.add(id)
      }
    },
    toggleGroupCheck: (group: string) => {
      const groupEngines = engines.value.filter(e => (e.group ?? 'uncategorized') === group)
      if (groupEngines.length === 0) return

      const allChecked = groupEngines.every(e => checkedEngineIds.value.has(e.id))

      if (allChecked) {
        // 取消全选
        groupEngines.forEach(e => checkedEngineIds.value.delete(e.id))
      } else {
        // 全选
        groupEngines.forEach(e => checkedEngineIds.value.add(e.id))
      }
    },
    clearChecks: () => {
      checkedEngineIds.value.clear()
    }
  }
}
