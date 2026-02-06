import { computed, inject } from 'vue'
import type { Ref } from 'vue'
import { CONTAINER_GROUP_KEY } from '../shared/types'
import type { ContainerGroupContext } from '../shared/types'

export interface UseSelectionOptions {
  selectable: Ref<boolean>
  checked: Ref<boolean | undefined>
  value: Ref<any>
}

export interface UseSelectionReturn {
  isChecked: ReturnType<typeof computed<boolean>>
  isInGroup: ReturnType<typeof computed<boolean>>
  isMultiple: ReturnType<typeof computed<boolean>>
  shouldShowIndicator: ReturnType<typeof computed<boolean>>
  handleSelect: () => void
}

export function useSelection(options: UseSelectionOptions): UseSelectionReturn {
  const { selectable, checked, value } = options

  const groupContext = inject<ContainerGroupContext | null>(CONTAINER_GROUP_KEY, null)

  const isInGroup = computed(() => !!groupContext && value.value !== undefined)

  const isMultiple = computed(() => {
    if (groupContext) return groupContext.multiple.value
    return false
  })

  // DEV 环境互斥警告
  if (import.meta.env.DEV) {
    if (checked.value !== undefined && value.value !== undefined && groupContext) {
      console.warn(
        '[CJ List] checked 与 value 同时传入，Group 模式下 value 优先，checked 将被忽略'
      )
    }
  }

  const isChecked = computed(() => {
    // Group 模式优先
    if (isInGroup.value && groupContext) {
      const mv = groupContext.modelValue.value
      if (Array.isArray(mv)) return mv.includes(value.value)
      return mv === value.value
    }
    // 独立模式
    return !!checked.value
  })

  const shouldShowIndicator = computed(() => {
    if (selectable.value) return true
    return isInGroup.value
  })

  const handleSelect = () => {
    if (isInGroup.value && groupContext) {
      groupContext.handleItemClick(value.value)
    }
    // 独立模式由父组件通过 emit 处理
  }

  return { isChecked, isInGroup, isMultiple, shouldShowIndicator, handleSelect }
}
