/**
 * 浏览器书签 API 封装
 * 提供对 Chrome Bookmarks API 的类型安全访问
 */

/// <reference types="chrome" />

import type { Bookmark, BookmarkFolder } from '@/components/BookmarkPanel/types'

// Chrome 书签节点类型
export interface ChromeBookmarkNode {
  id: string
  title: string
  url?: string
  parentId?: string
  children?: ChromeBookmarkNode[]
  dateAdded?: number
  index?: number
}

/**
 * 检查是否在扩展环境中
 */
export function isExtensionEnvironment(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.bookmarks
}

/**
 * 获取完整书签树
 */
export async function getBookmarkTree(): Promise<ChromeBookmarkNode[]> {
  if (!isExtensionEnvironment()) {
    console.warn('[BookmarksAPI] Not in extension environment, returning empty')
    return []
  }

  try {
    return await chrome.bookmarks.getTree()
  } catch (error) {
    console.error('[BookmarksAPI] Failed to get bookmark tree:', error)
    return []
  }
}

/**
 * 递归扁平化书签树，提取所有书签（非文件夹）
 */
export function flattenBookmarks(nodes: ChromeBookmarkNode[]): Bookmark[] {
  const bookmarks: Bookmark[] = []

  for (const node of nodes) {
    // 有 url 的是书签，没有的是文件夹
    if (node.url) {
      bookmarks.push({
        id: node.id,
        title: node.title || '未命名书签',
        url: node.url,
        folderId: node.parentId || null,
        dateAdded: node.dateAdded,
      })
    }

    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      bookmarks.push(...flattenBookmarks(node.children))
    }
  }

  return bookmarks
}

/**
 * 递归提取文件夹结构
 */
export function extractFolders(nodes: ChromeBookmarkNode[]): BookmarkFolder[] {
  const folders: BookmarkFolder[] = []

  for (const node of nodes) {
    // 没有 url 的是文件夹
    if (!node.url && node.children) {
      // 跳过根节点（id 为 "0"）
      if (node.id !== '0') {
        folders.push({
          id: node.id,
          title: node.title || '未命名文件夹',
          parentId: node.parentId === '0' ? null : node.parentId || null,
          children: [], // 简化处理，不嵌套
          isExpanded: false,
        })
      }

      // 递归处理子文件夹
      folders.push(...extractFolders(node.children))
    }
  }

  return folders
}

/**
 * 构建文件夹 ID 到名称的映射，用于生成面包屑路径
 */
export function buildFolderMap(nodes: ChromeBookmarkNode[]): Map<string, ChromeBookmarkNode> {
  const map = new Map<string, ChromeBookmarkNode>()

  function traverse(nodeList: ChromeBookmarkNode[]) {
    for (const node of nodeList) {
      map.set(node.id, node)
      if (node.children) {
        traverse(node.children)
      }
    }
  }

  traverse(nodes)
  return map
}

/**
 * 获取文件夹路径（面包屑）
 */
export function getFolderPathFromMap(
  folderId: string | null,
  folderMap: Map<string, ChromeBookmarkNode>
): string[] {
  if (!folderId) return []

  const path: string[] = []
  let currentId: string | undefined = folderId

  while (currentId && currentId !== '0') {
    const node = folderMap.get(currentId)
    if (!node) break

    // 跳过根书签栏/其他书签等系统文件夹
    if (node.title) {
      path.unshift(node.title)
    }

    currentId = node.parentId
  }

  return path
}
