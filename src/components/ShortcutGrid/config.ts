import type { Shortcut } from '../../types'

export const defaultShortcuts: Shortcut[] = [
  { id: 1, type: 'app', name: 'Bilibili', url: 'https://www.bilibili.com', color: '#FB7299' },
  {
    id: 2,
    type: 'app',
    name: 'GitHub',
    url: 'https://github.com',
    color: '#181717',
    inverted: true,
  },
  {
    id: 3,
    type: 'folder',
    name: '社交媒体',
    color: 'rgba(255,255,255,0.15)',
    children: [
      { id: 31, type: 'app', name: 'YouTube', url: 'https://www.youtube.com', color: '#FF0000' },
      { id: 32, type: 'app', name: '知乎', url: 'https://www.zhihu.com', color: '#0084FF' },
      { id: 33, type: 'app', name: 'ChatGPT', url: 'https://chat.openai.com', color: '#74AA9C' },
      { id: 34, type: 'app', name: 'Vue', url: 'https://vuejs.org', color: '#42B883' },
    ],
  },
  { id: 4, type: 'app', name: 'Google', url: 'https://google.com', color: '#4285F4' },
  { id: 5, type: 'app', name: 'Gmail', url: 'https://mail.google.com', color: '#EA4335' },
]

export const randomColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']

export const getRandomColor = () => randomColors.sort(() => Math.random() - 0.5)[0]
