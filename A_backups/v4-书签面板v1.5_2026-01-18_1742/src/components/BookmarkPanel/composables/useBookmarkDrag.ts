import { ref, onUnmounted } from 'vue'
import type { BookmarkStore } from '../types'

export interface DragState {
  isDragging: boolean
  draggedIndex: number | null
  dropTargetIndex: number | null
  dropPosition: 'before' | 'after' | 'inside' | null
  ghostElement: HTMLElement | null
}

export interface DropEvent {
  draggedIndex: number
  dropTargetIndex?: number
  dropTargetFolderId?: string | null
  position: 'before' | 'after' | 'inside'
}

export function useBookmarkDrag(
  store: BookmarkStore,
  options: { onDrop?: (e: DropEvent) => void } = {}
) {
  // --- Reactive State ---
  const isDragging = ref(false)
  const draggedIndex = ref<number | null>(null)
  const dropTargetIndex = ref<number | null>(null)
  const dropTargetFolderId = ref<string | null>(null)
  const dropPosition = ref<'before' | 'after' | 'inside' | null>(null)

  // --- Internal State ---
  let ghostElement: HTMLElement | null = null
  let offsetX = 0
  let offsetY = 0
  let lastFolderElement: HTMLElement | null = null

  // --- Helpers ---
  const clearFolderHighlight = () => {
    if (lastFolderElement) {
      lastFolderElement.classList.remove('drag-over-folder')
      lastFolderElement = null
    }
  }

  const createGhost = (target: HTMLElement, e: MouseEvent) => {
    const rect = target.getBoundingClientRect()
    offsetX = e.clientX - rect.left
    offsetY = e.clientY - rect.top

    ghostElement = target.cloneNode(true) as HTMLElement
    ghostElement.style.position = 'fixed'
    ghostElement.style.width = `${rect.width}px`
    ghostElement.style.height = `${rect.height}px`
    ghostElement.style.left = `${rect.left}px`
    ghostElement.style.top = `${rect.top}px`
    ghostElement.style.zIndex = '9999'
    ghostElement.style.pointerEvents = 'none' // Critical for dragover detection
    ghostElement.style.opacity = '0.9'
    ghostElement.style.transform = 'scale(1.05) rotate(2deg)'
    ghostElement.style.transition = 'transform 0.1s'
    ghostElement.style.boxShadow = '0 12px 24px rgba(0,0,0,0.3)'
    ghostElement.classList.add('drag-ghost')

    // Clean up ghost classes
    ghostElement.classList.remove(
      'drag-over-before',
      'drag-over-after',
      'drag-over-inside',
      'is-dragging-source'
    )

    document.body.appendChild(ghostElement)
  }

  const updateGhostPosition = (e: MouseEvent) => {
    if (ghostElement) {
      ghostElement.style.left = `${e.clientX - offsetX}px`
      ghostElement.style.top = `${e.clientY - offsetY}px`
    }
  }

  const cleanup = () => {
    if (ghostElement) {
      ghostElement.remove()
      ghostElement = null
    }
    clearFolderHighlight()
    isDragging.value = false
    draggedIndex.value = null
    dropTargetIndex.value = null
    dropTargetFolderId.value = null
    dropPosition.value = null
    document.body.classList.remove('grabbing')

    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  // --- Event Handlers (Bound to Card) ---

  const onDragStart = (e: MouseEvent, index: number) => {
    // Only left click
    if (e.button !== 0) return
    // Ignore clicks on buttons/links inside card if needed (e.g. menu button)
    if ((e.target as HTMLElement).closest('button, a')) return

    e.preventDefault() // Prevent native text selection or image drag

    const target = (e.currentTarget as HTMLElement).closest('.bookmark-card') as HTMLElement
    if (!target) return

    isDragging.value = true
    draggedIndex.value = index

    createGhost(target, e)
    document.body.classList.add('grabbing')

    // Global Listeners
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return

    updateGhostPosition(e)

    // Hit Testing
    // We strictly use elementFromPoint because 'target' in mousemove is unreliable with ghost
    // Ghost has pointer-events: none, so we hit the element below.
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY)
    if (!elementBelow) return

    // Check for Bookmark Card (Grid)
    const card = elementBelow.closest('.bookmark-card') as HTMLElement

    // Check for Folder Tree Item (Sidebar) - Look for `[data-is-folder-node]`
    // Note: elementBelow might be the span title, or toggle, so closest() is needed
    // However, we didn't put a class on the wrapper, we put `data-is-folder-node` on `.node-content` or `.tree-root-item`
    const folderNode = elementBelow.closest('[data-is-folder-node="true"]') as HTMLElement

    if (folderNode) {
      // --- Hovering over Folder Tree ---
      dropTargetIndex.value = null
      dropPosition.value = 'inside' // Always inside for folder tree drop

      const folderId = folderNode.dataset.folderId || null
      dropTargetFolderId.value = folderId

      if (lastFolderElement !== folderNode) {
        clearFolderHighlight()
        folderNode.classList.add('drag-over-folder')
        lastFolderElement = folderNode
      }
    } else if (card && card.dataset.index) {
      // --- Hovering over Grid Card ---
      clearFolderHighlight()
      dropTargetFolderId.value = null

      const index = parseInt(card.dataset.index)

      // Don't drop on self
      if (index === draggedIndex.value) {
        dropTargetIndex.value = null
        dropPosition.value = null
        return
      }

      dropTargetIndex.value = index

      // Calculate Position (Before/After/Inside)
      const rect = card.getBoundingClientRect()
      const relativeY = e.clientY - rect.top

      // Is it a folder?
      const isFolder = store.isFolder[index] === 1

      // Logic: Folder = Top 25% (Before), Bottom 25% (After), Middle 50% (Inside)
      //        File   = Top 50% (Before), Bottom 50% (After)

      if (isFolder) {
        if (relativeY < rect.height * 0.25) dropPosition.value = 'before'
        else if (relativeY > rect.height * 0.75) dropPosition.value = 'after'
        else dropPosition.value = 'inside'
      } else {
        if (relativeY < rect.height * 0.5) dropPosition.value = 'before'
        else dropPosition.value = 'after'
      }
    } else {
      // --- Hovering over nothing valid ---
      clearFolderHighlight()
      dropTargetIndex.value = null
      dropTargetFolderId.value = null
      dropPosition.value = null
    }
  }

  const onMouseUp = () => {
    if (isDragging.value && draggedIndex.value !== null && dropPosition.value) {
      // Case 1: Drop on Folder Tree
      if (dropTargetFolderId.value !== null) {
        options.onDrop?.({
          draggedIndex: draggedIndex.value,
          dropTargetFolderId: dropTargetFolderId.value === 'root' ? null : dropTargetFolderId.value, // Handle 'root' string
          position: 'inside',
        })
      }
      // Case 2: Drop on Grid Item
      else if (dropTargetIndex.value !== null) {
        options.onDrop?.({
          draggedIndex: draggedIndex.value,
          dropTargetIndex: dropTargetIndex.value,
          position: dropPosition.value,
        })
      }
    }
    cleanup()
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    isDragging,
    draggedIndex,
    dropTargetIndex,
    dropTargetFolderId,
    dropPosition,
    onDragStart,
  }
}
