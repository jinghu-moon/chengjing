import { ref, inject, provide, type Ref } from 'vue'
import type ContextMenu from '@/components/SelectMenu/components/ContextMenu.vue'
import type { OptionItem } from '@/components/SelectMenu'

// Symbol 用于 provide/inject
const CONTEXT_MENU_KEY = Symbol('CONTEXT_MENU')

/**
 * 在 App.vue 中调用此函数来提供 ContextMenu 实例
 * @returns contextMenuRef 用于绑定到 <ContextMenu> 组件
 */
export function provideContextMenu() {
  const contextMenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)
  provide(CONTEXT_MENU_KEY, contextMenuRef)
  return { contextMenuRef }
}

/**
 * 在子组件中调用此函数来使用右键菜单
 * @returns showContextMenu 方法
 */
export function useContextMenu() {
  const contextMenuRef = inject<Ref<InstanceType<typeof ContextMenu> | null>>(CONTEXT_MENU_KEY)

  if (!contextMenuRef) {
    console.warn(
      '[useContextMenu] ContextMenu not provided! Ensure provideContextMenu is called in App.vue and <ContextMenu> is mounted.'
    )
  }

  /**
   * 显示上下文菜单
   * @param e 鼠标事件（通常来自 @contextmenu）
   * @param options 菜单选项
   * @returns Promise<string | null> 用户选择的值，取消返回 null
   */
  const showContextMenu = async (e: MouseEvent, options: OptionItem[]): Promise<string | null> => {
    if (!contextMenuRef?.value) {
      console.warn('[useContextMenu] ContextMenu ref is null')
      return null
    }
    return contextMenuRef.value.open(e, options)
  }

  /**
   * 关闭上下文菜单
   */
  const closeContextMenu = () => {
    contextMenuRef?.value?.close()
  }

  return {
    showContextMenu,
    closeContextMenu,
  }
}

// 导出类型供外部使用
export type { OptionItem }
