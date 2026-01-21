// src/utils/debounce.ts
export function debounce<T extends (...args: any[]) => any>(fn: T, wait: number = 100) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  let lastThis: any = undefined

  const debounced = function (this: any, ...args: Parameters<T>) {
    lastArgs = args
    lastThis = this

    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      if (lastArgs !== null) {
        fn.apply(lastThis, lastArgs)
      }
      timer = null
      lastArgs = null
      lastThis = undefined
    }, wait)
  } as any // 类型断言避免 TS 抱怨

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    lastArgs = null
    lastThis = undefined
  }

  debounced.flush = () => {
    if (timer && lastArgs !== null) {
      clearTimeout(timer)
      fn.apply(lastThis, lastArgs)
      timer = null
      lastArgs = null
      lastThis = undefined
    }
  }

  return debounced
}
