import { ref, onUnmounted, type Ref } from 'vue'
import type { Shortcut } from '../types'

export function useShortcutDrag(
  shortcuts: Ref<Shortcut[]>,
  settings: any, // 接收 store 中的 settings 对象
  saveData: () => void,
  callbacks: {
    closeFolder: () => void
    openedFolderId: Ref<string | number | null>
  }
) {
  // --- 状态 ---
  const dragTargetFolderId = ref<string | number | null>(null)
  const currentDraggedId = ref<string | number | null>(null)
  const isDraggingOut = ref(false)
  const folderContainerRef = ref<HTMLElement | null>(null)

  // --- 配置 ---
  const draggableGroup = {
    name: 'desktop-apps',
    pull: true,
    put: true,
  }

  // ==========================================
  // 逻辑 A: 桌面图标拖入文件夹 (手动雷达检测)
  // ==========================================
  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!currentDraggedId.value) return

    // 获取鼠标下的元素
    const elements = document.elementsFromPoint(e.clientX, e.clientY)
    const folderElement = elements.find(
      el => el.classList.contains('shortcut-item') && el.getAttribute('data-type') === 'folder'
    )

    if (folderElement) {
      const targetId = folderElement.getAttribute('data-id')
      // 防止自己拖进自己
      if (targetId && String(targetId) !== String(currentDraggedId.value)) {
        dragTargetFolderId.value = targetId
        return
      }
    }
    if (dragTargetFolderId.value) dragTargetFolderId.value = null
  }

  const onStart = (evt: any) => {
    const item = shortcuts.value[evt.oldIndex]
    if (item && item.type === 'app') {
      currentDraggedId.value = item.id
      window.addEventListener('mousemove', handleGlobalMouseMove)
    }
  }

  const onMoveCallback = () => {
    // 如果正在瞄准文件夹，阻止默认排序行为 (视觉上更稳定)
    if (dragTargetFolderId.value) return false
    return true
  }

  const onDragEnd = () => {
    window.removeEventListener('mousemove', handleGlobalMouseMove)

    // 执行合并逻辑
    if (dragTargetFolderId.value && currentDraggedId.value) {
      const folderIndex = shortcuts.value.findIndex(
        i => String(i.id) === String(dragTargetFolderId.value)
      )
      const appIndex = shortcuts.value.findIndex(
        i => String(i.id) === String(currentDraggedId.value)
      )

      if (folderIndex > -1 && appIndex > -1) {
        const appToMove = shortcuts.value[appIndex]
        const targetFolder = shortcuts.value[folderIndex]

        if (!targetFolder.children) targetFolder.children = []
        targetFolder.children.push(appToMove)
        shortcuts.value.splice(appIndex, 1)
      }
    }

    // 重置状态
    dragTargetFolderId.value = null
    currentDraggedId.value = null
    saveData()
  }

  // ==========================================
  // 逻辑 B: 文件夹内拖出检测 (出界检测)
  // ==========================================
  const detectFolderExit = (e: MouseEvent | TouchEvent) => {
    if (isDraggingOut.value) return
    if (!folderContainerRef.value) return

    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      // @ts-ignore
      clientX = e.clientX
      // @ts-ignore
      clientY = e.clientY
    }

    const targetElement = document.elementFromPoint(clientX, clientY)
    if (targetElement) {
      const isInside = folderContainerRef.value.contains(targetElement)
      if (!isInside) {
        isDraggingOut.value = true
      }
    }
  }

  const onFolderDragStart = () => {
    window.addEventListener('mousemove', detectFolderExit)
    window.addEventListener('touchmove', detectFolderExit)
  }

  const onFolderDragEnd = () => {
    // 1. 移除全局监听
    window.removeEventListener('mousemove', detectFolderExit)
    window.removeEventListener('touchmove', detectFolderExit)

    // 2. 如果处于拖出状态
    if (isDraggingOut.value) {
      const currentId = callbacks.openedFolderId.value
      callbacks.closeFolder() // 关闭弹窗

      // 检查空文件夹删除逻辑保持不变...
      if (settings.deleteEmptyFolder && currentId) {
        const index = shortcuts.value.findIndex(item => String(item.id) === String(currentId))
        if (index !== -1) {
          const folder = shortcuts.value[index]
          if (!folder.children || folder.children.length === 0) {
            shortcuts.value.splice(index, 1)
          }
        }
      }

      // 【关键修复】：重置拖出状态！
      // 必须重置，否则下次打开文件夹时，它会因为 CSS class .dragging-out 导致不可见
      isDraggingOut.value = false
    }

    // 3. 无论是拖出还是内部排序，都保存
    saveData()
  }

  // 自动清理全局监听
  onUnmounted(() => {
    window.removeEventListener('mousemove', handleGlobalMouseMove)
    window.removeEventListener('mousemove', detectFolderExit)
    window.removeEventListener('touchmove', detectFolderExit)
  })

  return {
    // 状态
    dragTargetFolderId,
    isDraggingOut,
    folderContainerRef,
    draggableGroup,

    // 方法
    onStart,
    onMoveCallback,
    onDragEnd,
    onFolderDragStart,
    onFolderDragEnd,
  }
}
