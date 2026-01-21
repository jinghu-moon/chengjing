import { ref, onUnmounted, type Ref } from 'vue'

// ==================== 类型定义 ====================
interface Point {
  x: number
  y: number
}

interface SubmenuBounds {
  top: number
  bottom: number
  left: number
  right: number
}

interface UseSafeTriangleOptions {
  /** 子菜单显示在父菜单的哪一侧 */
  placement: Ref<'left' | 'right'>
  /** 子菜单边界（用于计算三角形） */
  submenuBounds: Ref<SubmenuBounds | null>
  /** 安全区延迟退出时间（ms） */
  exitDelay?: number
}

// ==================== 安全三角算法 ====================

/**
 * 判断点 P 是否在三角形 A-B-C 内
 * 使用叉积法：如果点在三条边的同一侧，则在三角形内
 */
function isPointInTriangle(p: Point, a: Point, b: Point, c: Point): boolean {
  const sign = (p1: Point, p2: Point, p3: Point): number => {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y)
  }

  const d1 = sign(p, a, b)
  const d2 = sign(p, b, c)
  const d3 = sign(p, c, a)

  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0

  return !(hasNeg && hasPos)
}

// ==================== 导出 Composable ====================
export function useSafeTriangle(options: UseSafeTriangleOptions) {
  const { placement, submenuBounds, exitDelay = 100 } = options

  const mousePosition = ref<Point>({ x: 0, y: 0 })
  const isInSafeZone = ref(false)
  let exitTimer: ReturnType<typeof setTimeout> | undefined

  /**
   * 更新鼠标位置
   */
  const updateMousePosition = (e: MouseEvent) => {
    mousePosition.value = { x: e.clientX, y: e.clientY }
  }

  /**
   * 检查当前鼠标是否在安全三角区内
   *
   * 安全三角形定义：
   * - 顶点 A：当前鼠标位置
   * - 顶点 B：子菜单靠近父菜单一侧的上角
   * - 顶点 C：子菜单靠近父菜单一侧的下角
   */
  const checkSafeZone = (): boolean => {
    const bounds = submenuBounds.value
    if (!bounds) return false

    const mouse = mousePosition.value
    const side = placement.value

    // 子菜单靠近父菜单的那一边
    const nearEdgeX = side === 'right' ? bounds.left : bounds.right

    // 三角形的三个顶点
    const pointA: Point = mouse
    const pointB: Point = { x: nearEdgeX, y: bounds.top }
    const pointC: Point = { x: nearEdgeX, y: bounds.bottom }

    return isPointInTriangle(pointA, pointA, pointB, pointC)
  }

  /**
   * 检查是否应该保持子菜单打开
   * 用于 hover 到其他菜单项时的判断
   */
  const shouldKeepSubmenuOpen = (): boolean => {
    if (!submenuBounds.value) return false
    return checkSafeZone()
  }

  /**
   * 开始跟踪鼠标移动
   */
  const startTracking = () => {
    document.addEventListener('mousemove', updateMousePosition)
  }

  /**
   * 停止跟踪鼠标移动
   */
  const stopTracking = () => {
    document.removeEventListener('mousemove', updateMousePosition)
  }

  /**
   * 延迟退出安全区
   */
  const scheduleExit = (callback: () => void) => {
    clearTimeout(exitTimer)
    exitTimer = setTimeout(() => {
      if (!shouldKeepSubmenuOpen()) {
        callback()
      }
    }, exitDelay)
  }

  /**
   * 取消延迟退出
   */
  const cancelExit = () => {
    clearTimeout(exitTimer)
  }

  // 清理
  onUnmounted(() => {
    stopTracking()
    clearTimeout(exitTimer)
  })

  return {
    mousePosition,
    isInSafeZone,
    shouldKeepSubmenuOpen,
    startTracking,
    stopTracking,
    scheduleExit,
    cancelExit,
    updateMousePosition,
  }
}
