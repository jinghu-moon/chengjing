import type { InjectionKey, Ref } from 'vue'
import type { Settings, IconConfig, Shortcut } from '@/types'

export interface GridState {
  settings: Settings
  iconConfig: IconConfig
  dragTargetFolderId: Ref<string | number | null>
  mergeTargetId: Ref<string | number | null>
  previewFolderId: Ref<string | number | null>
  previewChildren: Ref<Shortcut[] | null>
  openShortcut: (url?: string) => void
  openFolder: (item: Shortcut) => void
  showContextMenu: (e: MouseEvent, item: Shortcut) => void
}

export const GridStateKey: InjectionKey<GridState> = Symbol('GridState')
