import { ref, onUnmounted } from 'vue'

interface Position {
  x: number
  y: number
}

interface DraggableOptions {
  initialPosition?: Position
  storageKey?: string
  onDragEnd?: (pos: Position) => void
}

export function useDraggableCard(options: DraggableOptions = {}) {
  const position = ref<Position>(options.initialPosition || { x: 24, y: 100 })
  const isDragging = ref(false)
  const dragOffset = ref<Position>({ x: 0, y: 0 })
  const elementSize = ref({ width: 0, height: 0 })

  // 从 Storage 恢复位置
  if (options.storageKey) {
    const savedPos = localStorage.getItem(options.storageKey)
    if (savedPos) {
      try {
        const parsed = JSON.parse(savedPos)
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          position.value = parsed
        }
      } catch (e) {
        console.warn('Failed to parse draggable position', e)
      }
    }
  }

  const onDragStart = (e: MouseEvent) => {
    isDragging.value = true

    // 获取当前卡片实际尺寸
    const target = e.currentTarget as HTMLElement
    // 尝试查找容器 (.mini-notepad) 或直接使用父元素
    const container = (target.closest('.mini-notepad') as HTMLElement) || target.parentElement
    if (container) {
      elementSize.value = {
        width: container.offsetWidth,
        height: container.offsetHeight,
      }
    }

    dragOffset.value = {
      x: e.clientX - position.value.x,
      y: e.clientY - position.value.y,
    }
    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', onDragEnd)
  }

  const onDragMove = (e: MouseEvent) => {
    if (!isDragging.value) return

    // 动态边界检查
    const maxX = window.innerWidth - (elementSize.value.width || 50) // Fallback 防止卡死
    const maxY = window.innerHeight - (elementSize.value.height || 50)

    position.value = {
      x: Math.max(0, Math.min(maxX, e.clientX - dragOffset.value.x)),
      y: Math.max(0, Math.min(maxY, e.clientY - dragOffset.value.y)),
    }
  }

  const onDragEnd = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)

    if (options.storageKey) {
      localStorage.setItem(options.storageKey, JSON.stringify(position.value))
    }
    options.onDragEnd?.(position.value)
  }

  onUnmounted(() => {
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
  })

  return {
    position,
    isDragging,
    onDragStart,
  }
}
