import { ref, onUnmounted, type Ref, nextTick } from 'vue'
import type { Shortcut } from '@/types'

export function useShortcutDrag(
  shortcuts: Ref<Shortcut[]>,
  settings: any, // 接收 store 中的 settings 对象
  saveData: () => void,
  callbacks: {
    closeFolder: () => void
    openedFolderId: Ref<string | number | null>
  }
) {
  // --- 状态枚举 ---
  type DragState = 'idle' | 'dragging-inside' | 'dragging-outside'

  // --- 核心状态 ---
  const dragState = ref<DragState>('idle')
  const dragTargetFolderId = ref<string | number | null>(null)
  const currentDraggedId = ref<string | number | null>(null)
  
  // 用于 UI 控制（如隐藏弹窗背景），源自 dragState
  const isDraggingOut = ref(false)
  
  const folderContainerRef = ref<HTMLElement | null>(null)
  const mergeTargetId = ref<string | number | null>(null)
  
  // [新增] 桌面落位索引
  const hoverDropIndex = ref<number | null>(null)

  // 拖拽上下文（深拷贝副本，确保数据安全）
  const dragContext = ref<{
    item: Shortcut | null
    sourceIndex: number | null
    folderId: string | number | null
  }>({
    item: null,
    sourceIndex: null,
    folderId: null,
  })

  // --- 配置 ---
  const draggableGroup = {
    name: 'desktop-apps',
    pull: true,
    put: true,
  }

  // ==========================================
  // 逻辑 A: 桌面图标拖入文件夹 / 合并创建文件夹
  // ==========================================
  const handleGlobalMouseMove = (e: MouseEvent) => {
    if (!currentDraggedId.value) return

    // 获取鼠标下的元素
    const elements = document.elementsFromPoint(e.clientX, e.clientY)

    // 检测文件夹
    const folderElement = elements.find(
      el => el.classList.contains('shortcut-item') && el.getAttribute('data-type') === 'folder'
    )
    // 检测普通 app
    const appElement = elements.find(
      el => el.classList.contains('shortcut-item') && el.getAttribute('data-type') === 'app'
    )

    if (folderElement) {
      const targetId = folderElement.getAttribute('data-id')
      if (targetId && String(targetId) !== String(currentDraggedId.value)) {
        dragTargetFolderId.value = targetId
        mergeTargetId.value = null
        return
      }
    } else if (appElement) {
      const targetId = appElement.getAttribute('data-id')
      if (targetId && String(targetId) !== String(currentDraggedId.value)) {
        mergeTargetId.value = targetId
        dragTargetFolderId.value = null
        return
      }
    }

    if (dragTargetFolderId.value) dragTargetFolderId.value = null
    if (mergeTargetId.value) mergeTargetId.value = null
  }

  const onStart = (evt: any) => {
    const item = shortcuts.value[evt.oldIndex]
    if (item && item.type === 'app') {
      currentDraggedId.value = item.id
      window.addEventListener('mousemove', handleGlobalMouseMove)
    }
  }

  const onMoveCallback = () => {
    if (dragTargetFolderId.value || mergeTargetId.value) return false
    return true
  }

  const onDragEnd = () => {
    window.removeEventListener('mousemove', handleGlobalMouseMove)

    // A.1 合并逻辑
    if (mergeTargetId.value && currentDraggedId.value) {
      const sourceIdx = shortcuts.value.findIndex(i => String(i.id) === String(currentDraggedId.value))
      const targetIdx = shortcuts.value.findIndex(i => String(i.id) === String(mergeTargetId.value))

      if (sourceIdx > -1 && targetIdx > -1) {
        const sourceItem = shortcuts.value[sourceIdx]
        const targetItem = shortcuts.value[targetIdx]

        const newFolder: Shortcut = {
          id: `folder-${Date.now()}`,
          type: 'folder',
          name: '新文件夹',
          children: [targetItem, sourceItem],
          folderMode: '2x2',
        }

        if (sourceIdx > targetIdx) {
          shortcuts.value.splice(sourceIdx, 1)
          shortcuts.value.splice(targetIdx, 1, newFolder)
        } else {
          shortcuts.value.splice(targetIdx, 1, newFolder)
          shortcuts.value.splice(sourceIdx, 1)
        }
      }
      resetState()
      saveData()
      return
    }

    // A.2 拖入文件夹逻辑
    if (dragTargetFolderId.value && currentDraggedId.value) {
      const folderIndex = shortcuts.value.findIndex(i => String(i.id) === String(dragTargetFolderId.value))
      const appIndex = shortcuts.value.findIndex(i => String(i.id) === String(currentDraggedId.value))

      if (folderIndex > -1 && appIndex > -1) {
        const appToMove = shortcuts.value[appIndex]
        const targetFolder = shortcuts.value[folderIndex]

        if (!targetFolder.children) targetFolder.children = []
        targetFolder.children.push(appToMove)
        shortcuts.value.splice(appIndex, 1)
      }
    }

    resetState()
    saveData()
  }

  function resetState() {
    dragTargetFolderId.value = null
    mergeTargetId.value = null
    currentDraggedId.value = null
  }

  // ==========================================
  // 逻辑 B: 文件夹内拖出检测 (State Machine)
  // ==========================================
  
  // 监听鼠标位置，判断是否出界 (Update DragState)
  const detectFolderExit = (e: MouseEvent | TouchEvent) => {
    // 只有在 inside 或 outside 状态下才检测，idle 不检测
    if (dragState.value === 'idle') return

    const container = folderContainerRef.value || document.querySelector('.folder-container') || document.querySelector('.folder-modal-dialog')
    if (!container) return

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

    const rect = container.getBoundingClientRect()
    const isOutside =
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom

    if (isOutside) {
        if (dragState.value !== 'dragging-outside') {
            dragState.value = 'dragging-outside'
            isDraggingOut.value = true
        }

        // [新增] 计算落位索引
        const elements = document.elementsFromPoint(clientX, clientY)
        const appElement = elements.find(
          el => el.classList.contains('shortcut-item') && !el.classList.contains('inner-item')
        )

        if (appElement) {
          const targetId = appElement.getAttribute('data-id')
          const targetIndex = shortcuts.value.findIndex(i => String(i.id) === String(targetId))
          if (targetIndex > -1) {
            hoverDropIndex.value = targetIndex
            // console.log('Hover Drop Index:', targetIndex)
          }
        } else {
           // 如果没悬停在任何图标上，且在 Grid 区域内，这比较难判断，
           // 简单起见，如果没有 Target，就保持之前的 Index 或者 null（默认末尾）
           // 这里我们暂不清除，保持最后一次有效悬停，或者根据距离计算（更复杂）
        }

    } else {
        if (dragState.value !== 'dragging-inside') {
             dragState.value = 'dragging-inside'
             isDraggingOut.value = false
             hoverDropIndex.value = null
        }
    }
  }

  // 核心：利用 Sortable Move 事件阻止内部排序
  const onFolderMove = () => {
    // 如果已经在外部，禁止文件夹内部的排序行为 (Visual Freeze)
    if (dragState.value === 'dragging-outside') {
      return false
    }
    return true
  }

  const onFolderDragStart = (evt: any) => {
    const folderId = callbacks.openedFolderId.value
    if (!folderId) return

    const folder = shortcuts.value.find(item => String(item.id) === String(folderId))
    if (!folder || !folder.children) return

    const draggedItem = folder.children[evt.oldIndex]
    if (!draggedItem) return

    // 上下文快照 (Deep Copy)
    dragContext.value = {
      item: JSON.parse(JSON.stringify(draggedItem)),
      sourceIndex: evt.oldIndex,
      folderId: folderId,
    }

    dragState.value = 'dragging-inside'
    isDraggingOut.value = false // 初始在内部

    // 延迟绑定监听，避免初始位置误判
    nextTick(() => {
        window.addEventListener('mousemove', detectFolderExit)
        window.addEventListener('touchmove', detectFolderExit)
    })
  }

  const onFolderDragEnd = (_evt: any) => {
    window.removeEventListener('mousemove', detectFolderExit)
    window.removeEventListener('touchmove', detectFolderExit)

    const finalState = dragState.value
    const context = dragContext.value

    // 只有最终状态是 Outside 时，才执行“移出”逻辑
    // 如果是 Inside，Sortable 已经自动处理了内部排序，我们只需 saveData
    if (finalState === 'dragging-outside' && context.item && context.folderId) {
      const folder = shortcuts.value.find(
        item => String(item.id) === String(context.folderId)
      )

      if (folder && folder.children) {
        // 1. 确实从文件夹移除 (按 ID 查找最稳)
        const itemIndex = folder.children.findIndex(
          child => String(child.id) === String(context.item!.id)
        )
        
        if (itemIndex > -1) {
          folder.children.splice(itemIndex, 1)
        }

        // 2. 添加到桌面
        if (hoverDropIndex.value !== null && hoverDropIndex.value > -1) {
             shortcuts.value.splice(hoverDropIndex.value, 0, context.item)
        } else {
             shortcuts.value.push(context.item)
        }

        // 3. 空文件夹清理
        if (settings.deleteEmptyFolder && folder.children.length === 0) {
          const folderIndex = shortcuts.value.findIndex(
            item => String(item.id) === String(context.folderId)
          )
          if (folderIndex > -1) {
            shortcuts.value.splice(folderIndex, 1)
          }
        }
      }

      callbacks.closeFolder()
    }
    
    // Reset
    dragState.value = 'idle'
    isDraggingOut.value = false
    dragContext.value = {
      item: null,
      sourceIndex: null,
      folderId: null,
    }

    saveData()
  }

  onUnmounted(() => {
    window.removeEventListener('mousemove', handleGlobalMouseMove)
    window.removeEventListener('mousemove', detectFolderExit)
    window.removeEventListener('touchmove', detectFolderExit)
  })

  return {
    dragTargetFolderId,
    mergeTargetId,
    isDraggingOut,
    folderContainerRef,
    draggableGroup,
    
    // Methods
    onStart,
    onMoveCallback,
    onDragEnd,
    onFolderDragStart,
    onFolderDragEnd,
    onFolderMove, // [新增]
  }
}
