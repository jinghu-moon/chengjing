import { ref, nextTick, onMounted, onBeforeUnmount, type Ref, type CSSProperties } from 'vue'

interface PositionOptions {
  dropdownOffset?: number
  yearMonthMenuWidth?: number
}

export function usePickerPosition(
  inputRef: Ref<HTMLElement | null>,
  dropdownRef: Ref<HTMLElement | null>,
  _yearMonthRef: Ref<HTMLElement | null>,
  isOpen: Ref<boolean>,
  isYearMonthOpen: Ref<boolean>,
  options: PositionOptions = {}
) {
  const { dropdownOffset = 8, yearMonthMenuWidth = 240 } = options

  const dropdownStyle = ref<CSSProperties>({})
  const yearMonthStyle = ref<CSSProperties>({})

  const calculatePosition = async () => {
    await nextTick()

    const inputEl = inputRef.value
    const dropdownEl = dropdownRef.value
    if (!inputEl || !dropdownEl) return

    // 查找触发器容器
    const wrapperEl = inputEl.closest('.todo-wrapper') as HTMLElement
    const rect = wrapperEl?.getBoundingClientRect() || inputEl.getBoundingClientRect()

    // 主面板定位
    dropdownStyle.value = {
      position: 'fixed',
      left: `${rect.right + dropdownOffset}px`,
      bottom: `${window.innerHeight - rect.bottom}px`,
      zIndex: 'var(--z-dropdown)',
    }

    // 年月选择器定位
    if (!isYearMonthOpen.value) return

    const targetEl = dropdownEl.querySelector('.month-year') as HTMLElement
    if (!targetEl) return

    const { left, width, bottom } = targetEl.getBoundingClientRect()

    yearMonthStyle.value = {
      position: 'fixed',
      left: `${left + (width - yearMonthMenuWidth) / 2}px`,
      top: `${bottom + dropdownOffset}px`,
      zIndex: 'var(--z-dropdown)',
    }
  }

  // 监听窗口事件
  const handleResize = () => {
    if (isOpen.value) calculatePosition()
  }

  const handleScroll = () => {
    if (isOpen.value) calculatePosition()
  }

  onMounted(() => {
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('scroll', handleScroll, true)
  })

  return {
    dropdownStyle,
    yearMonthStyle,
    calculatePosition,
  }
}
