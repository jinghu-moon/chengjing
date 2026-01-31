
/**
 * HSV 转 RGB
 * @param h Hue 0-360
 * @param s Saturation 0-100
 * @param v Value 0-100
 * @returns [r, g, b] 0-255
 */
export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  s /= 100
  v /= 100
  const k = (n: number) => (n + h / 60) % 6
  const f = (n: number) => v - v * s * Math.max(Math.min(k(n), 4 - k(n), 1), 0)
  return [
    Math.round(f(5) * 255),
    Math.round(f(3) * 255),
    Math.round(f(1) * 255)
  ]
}

/**
 * RGB 转 HSV
 * @param r Red 0-255
 * @param g Green 0-255
 * @param b Blue 0-255
 * @returns [h, s, v]
 */
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const v = Math.max(r, g, b)
  const n = v - Math.min(r, g, b)
  const h = n && (v === r ? (g - b) / n : v === g ? 2 + (b - r) / n : 4 + (r - g) / n)
  
  return [
    Math.round(60 * (h < 0 ? h + 6 : h)),
    Math.round(v && (n / v) * 100),
    Math.round(v * 100)
  ]
}

/**
 * Hex 转 RGBA
 * 支持 #RGB, #RGBA, #RRGGBB, #RRGGBBAA
 * @param hex 
 * @returns [r, g, b, a] a is 0-1
 */
export function hexToRgba(hex: string): [number, number, number, number] {
  hex = hex.replace('#', '')
  
  // 处理简写 #RGB, #RGBA
  if (hex.length === 3 || hex.length === 4) {
    hex = hex.split('').map(c => c + c).join('')
  }
  
  if (hex.length === 6) {
    hex += 'FF' // 默认不透明
  }
  
  if (hex.length !== 8) {
    return [0, 0, 0, 1] // Fallback
  }

  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const a = parseInt(hex.substring(6, 8), 16) / 255
  
  return [r, g, b, parseFloat(a.toFixed(2))]
}

/**
 * RGBA 转 Hex
 * @param r 
 * @param g 
 * @param b 
 * @param a 0-1
 * @returns #RRGGBBAA
 */
export function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
  const alpha = Math.round(a * 255)
  return '#' + [r, g, b, alpha].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('').toUpperCase()
}
