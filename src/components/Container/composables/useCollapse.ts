import { ref, computed, inject, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import { CONTAINER_GROUP_KEY } from '../shared/types'
import type { ContainerGroupContext } from '../shared/types'

export interface UseCollapseOptions {
  expanded: Ref<boolean | undefined>
  defaultExpanded: Ref<boolean>
  panelId: string
  onUpdateExpanded?: (value: boolean) => void
}

export interface UseCollapseReturn {
  isExpanded: ReturnType<typeof computed<boolean>>
  toggle: () => void
  expand: () => void
  collapse: () => void
}

export function useCollapse(options: UseCollapseOptions): UseCollapseReturn {
  const { expanded, defaultExpanded, panelId, onUpdateExpanded } = options

  // 注入 Group 上下文（手风琴模式）
  const groupContext = inject<ContainerGroupContext | null>(CONTAINER_GROUP_KEY, null)

  // 内部状态
  const innerExpanded = ref(defaultExpanded.value)

  // v-model:expanded 优先于内部状态
  const isExpanded = computed({
    get() {
      return expanded.value !== undefined ? expanded.value : innerExpanded.value
    },
    set(value: boolean) {
      innerExpanded.value = value
      // 外部 v-model 模式下，通知父组件更新 prop
      if (expanded.value !== undefined) {
        onUpdateExpanded?.(value)
      }
    },
  })

  const toggle = () => {
    const newValue = !isExpanded.value

    // 手风琴模式：展开时通知 Group 关闭其他面板
    if (groupContext?.accordion.value && newValue) {
      groupContext.handlePanelToggle(panelId)
    }

    isExpanded.value = newValue
  }

  const expand = () => {
    if (!isExpanded.value) toggle()
  }

  const collapse = () => {
    if (isExpanded.value) toggle()
  }

  // 注册到 Group（手风琴模式）
  if (groupContext) {
    groupContext.registerPanel(panelId, { collapse })
  }

  onBeforeUnmount(() => {
    groupContext?.unregisterPanel(panelId)
  })

  return { isExpanded, toggle, expand, collapse }
}
