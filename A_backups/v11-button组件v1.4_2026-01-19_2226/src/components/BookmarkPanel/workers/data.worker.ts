/**
 * 数据处理 Worker
 * 负责 CPU 密集型的书签树扁平化计算，避免阻塞主线程
 */

import { createFlatArrays, type RawSoAData } from '../utils/flatten'

// ============================================
// 消息类型定义
// ============================================

export type DataWorkerInMessage = {
  type: 'FLATTEN'
  tree: chrome.bookmarks.BookmarkTreeNode[]
}

export type DataWorkerOutMessage = {
  type: 'FLATTEN_DONE'
  payload: RawSoAData
}

// ============================================
// Worker 消息处理
// ============================================

self.onmessage = (e: MessageEvent<DataWorkerInMessage>) => {
  const { type, tree } = e.data

  if (type === 'FLATTEN') {
    try {
      console.log('[DataWorker] 开始扁平化计算，节点数:', tree[0]?.children?.length || 0)
      const startTime = performance.now()

      // 1. 执行耗时计算（纯 CPU 密集型）
      const rawData = createFlatArrays(tree)

      const duration = performance.now() - startTime
      console.log(
        `[DataWorker] 扁平化完成，耗时 ${duration.toFixed(2)}ms，共 ${rawData.count} 个节点`
      )

      // 2. 准备零拷贝传输列表
      // TypedArray.buffer 可以直接转移所有权，转移后 Worker 里就不能用了，速度极快
      const transferables: Transferable[] = [
        rawData.indices.buffer,
        rawData.dates.buffer,
        rawData.isFolder.buffer,
      ]

      // 3. 发送回主线程
      const msg: DataWorkerOutMessage = {
        type: 'FLATTEN_DONE',
        payload: rawData,
      }

      self.postMessage(msg, transferables)
    } catch (err) {
      console.error('[DataWorker] 扁平化失败:', err)
      // 可以发送错误消息回主线程
      // self.postMessage({ type: 'ERROR', error: String(err) });
    }
  }
}

// Worker 就绪
console.log('[DataWorker] 已启动，等待任务...')
