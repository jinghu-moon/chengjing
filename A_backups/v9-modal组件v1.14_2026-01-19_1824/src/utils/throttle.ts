// src/utils/throttle.ts

/**
 * 节流函数 - 在指定时间内最多执行一次
 * @param fn 要节流的函数
 * @param wait 等待时间(毫秒)
 * @param options 配置选项
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number = 100,
  options: {
    leading?: boolean // 是否在开始时立即执行
    trailing?: boolean // 是否在结束时执行
  } = {}
) {
  const { leading = true, trailing = true } = options

  let timer: ReturnType<typeof setTimeout> | null = null
  let lastTime = 0
  let lastArgs: Parameters<T> | null = null
  let lastThis: any = undefined

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now()

    // 如果是第一次调用且不需要立即执行，设置 lastTime
    if (!lastTime && !leading) {
      lastTime = now
    }

    const remaining = wait - (now - lastTime)
    lastArgs = args
    lastThis = this

    // 时间到了，可以执行
    if (remaining <= 0 || remaining > wait) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      lastTime = now
      fn.apply(lastThis, lastArgs)
      lastArgs = null
      lastThis = undefined
    }
    // 还在等待期内，且需要尾部执行
    else if (!timer && trailing) {
      timer = setTimeout(() => {
        lastTime = leading ? Date.now() : 0
        timer = null
        if (lastArgs !== null) {
          fn.apply(lastThis, lastArgs)
          lastArgs = null
          lastThis = undefined
        }
      }, remaining)
    }
  } as any

  // 取消节流
  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    lastTime = 0
    lastArgs = null
    lastThis = undefined
  }

  // 立即执行最后一次调用
  throttled.flush = () => {
    if (timer && lastArgs !== null) {
      clearTimeout(timer)
      timer = null
      lastTime = Date.now()
      fn.apply(lastThis, lastArgs)
      lastArgs = null
      lastThis = undefined
    }
  }

  return throttled
}

/**
 * requestAnimationFrame 节流
 * 适用于动画和视觉更新，与浏览器刷新率同步
 */
export function throttleRaf<T extends (...args: any[]) => any>(fn: T) {
  let rafId: number | null = null
  let lastArgs: Parameters<T> | null = null
  let lastThis: any = undefined

  const throttled = function (this: any, ...args: Parameters<T>) {
    lastArgs = args
    lastThis = this

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs !== null) {
          fn.apply(lastThis, lastArgs)
        }
        rafId = null
        lastArgs = null
        lastThis = undefined
      })
    }
  } as any

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    lastArgs = null
    lastThis = undefined
  }

  return throttled
}
