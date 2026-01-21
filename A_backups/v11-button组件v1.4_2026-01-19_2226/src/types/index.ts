export interface Shortcut {
  id: number | string
  type: 'app' | 'folder'
  name: string
  url?: string
  children?: Shortcut[]
  iconBase64?: string
  color?: string
  filled?: boolean
  inverted?: boolean
}
