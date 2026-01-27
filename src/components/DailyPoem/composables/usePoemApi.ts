import { type Poem, type HitokotoCategory } from '../types'

/** 从 Hitokoto API 获取诗词 */
export const fetchHitokotoPoem = async (categories: HitokotoCategory[]): Promise<Poem | null> => {
  try {
    const params = new URLSearchParams()
    if (categories.length > 0) {
      categories.forEach(c => params.append('c', c))
    } else {
      // 默认推荐
      params.append('c', 'i')
      params.append('c', 'd')
      params.append('c', 'k')
    }
    
    const res = await fetch(`https://v1.hitokoto.cn/?${params.toString()}`)
    const data = await res.json()
    
    if (data && data.hitokoto) {
      return {
        content: data.hitokoto,
        author: data.from_who || '佚名',
        title: data.from || '',
        dynasty: ''
      }
    }
    return null
  } catch (e) {
    console.warn('[DailyPoem] Hitokoto API 请求失败', e)
    return null
  }
}

// SDK 加载状态
let sdkLoaded = false
let sdkLoading = false

const loadJinrishiciSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (sdkLoaded) {
      resolve()
      return
    }
    
    if (sdkLoading) {
      const checkLoaded = setInterval(() => {
        if (sdkLoaded) {
          clearInterval(checkLoaded)
          resolve()
        }
      }, 100)
      return
    }
    
    sdkLoading = true
    
    const script = document.createElement('script')
    script.src = 'https://sdk.jinrishici.com/v2/browser/jinrishici.js'
    script.onload = () => {
      sdkLoaded = true
      sdkLoading = false
      resolve()
    }
    script.onerror = () => {
      sdkLoading = false
      reject(new Error('SDK 加载失败'))
    }
    document.head.appendChild(script)
  })
}

/** 从今日诗词 API 获取 */
export const fetchJinrishiciPoem = async (): Promise<Poem | null> => {
  try {
    await loadJinrishiciSDK()
    
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jinrishici = (window as any).jinrishici
      
      if (!jinrishici || !jinrishici.load) {
        console.warn('[DailyPoem] SDK 未正确加载')
        resolve(null)
        return
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      jinrishici.load((result: any) => {
        if (result && result.data) {
          resolve({
            content: result.data.content,
            author: result.data.origin?.author || '佚名',
            title: result.data.origin?.title,
            dynasty: result.data.origin?.dynasty
          })
        } else {
          resolve(null)
        }
      })
    })
  } catch (error) {
    console.warn('[DailyPoem] API 请求失败', error)
    return null
  }
}
