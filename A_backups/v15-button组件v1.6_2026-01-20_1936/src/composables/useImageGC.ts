import { useNotes } from './useNotes'
import { getAllImageIds, deleteImage } from '../utils/db'

export function useImageGC() {
  const { notes } = useNotes()

  const checkAndCleanOrphanImages = async () => {
    try {
      // 1. 获取数据库中所有已存的图片 ID
      const allStoredKeys = await getAllImageIds()
      if (allStoredKeys.length === 0) return

      // 2. 正则提取所有笔记中当前引用的 ID
      const usedKeys = new Set<string>()
      // 匹配 data-image-id="img_..." 或 lime-image://img_...
      const idRegex = /data-image-id=["']([^"']+)["']|lime-image:\/\/([a-zA-Z0-9_]+)/g

      notes.value.forEach(note => {
        let match
        // 重置 regex lastIndex 确保从头查找
        const content = note.content || ''
        idRegex.lastIndex = 0

        // 使用简单的 while 循环配合全局正则
        while ((match = idRegex.exec(content)) !== null) {
          // match[1] 是 data-image-id 捕获组，match[2] 是协议捕获组
          const id = match[1] || match[2]
          if (id) usedKeys.add(id)
        }
      })

      // 3. 计算孤儿图片 (在存储中但未在笔记中使用)
      const orphanedKeys = allStoredKeys.filter(key => !usedKeys.has(key))

      // 4. 执行清理
      if (orphanedKeys.length > 0) {
        console.log(`[GC] 发现 ${orphanedKeys.length} 张孤儿图片，正在清理...`)
        await Promise.all(orphanedKeys.map(key => deleteImage(key)))
        console.log(`[GC] 清理完成，释放了 ${orphanedKeys.length} 个文件`)
      } else {
        console.log('[GC] 扫描完成，未发现孤儿图片')
      }
      // 5. 更新最后清理时间
      localStorage.setItem('last_image_gc_ts', Date.now().toString())
    } catch (error) {
      console.error('[GC] 自动清理失败:', error)
    }
  }

  const scheduleImageGC = () => {
    // 检查冷却时间 (24小时)
    const lastRun = localStorage.getItem('last_image_gc_ts')
    if (lastRun && Date.now() - parseInt(lastRun) < 24 * 60 * 60 * 1000) {
      // 冷却中，直接跳过
      return
    }

    // 缩短启动延迟到 3秒，因为有了冷却检查，不用担心频繁执行影响性能
    // 相反，较短的延迟能增加在新标签页快速关闭前 Catch 到执行机会的概率
    setTimeout(() => {
      console.log('[GC] 冷却结束，准备执行自动清理...')
      if ('requestIdleCallback' in window) {
        ;(window as any).requestIdleCallback(() => checkAndCleanOrphanImages(), { timeout: 30000 })
      } else {
        checkAndCleanOrphanImages()
      }
    }, 3000)
  }

  return { scheduleImageGC }
}
