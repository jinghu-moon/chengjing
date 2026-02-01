
import { describe, it, expect } from 'vitest'
import { encode, decode, validate, PROTOCOL_VERSION } from './qr-codec'

// Mock Data
const mockSettings = {
  generalOpenInNewTab: true,
  todoShow: true,
  todoWidth: 300,
  wallpaperBlur: 10,
  layoutGridRows: 4
}

const mockIconConfig = {
  hideLabel: false,
  boxSize: 80,
  iconScale: 60
}

describe('QR Codec', () => {
  
  describe('encode', () => {
    it('should encode full mode correctly', () => {
      const result = encode(mockSettings, mockIconConfig, 'full')
      
      expect(result.size).toBeGreaterThan(0)
      expect(result.isOverLimit).toBe(false)
      
      const payload = JSON.parse(result.payload)
      expect(payload.v).toBe(PROTOCOL_VERSION)
      expect(payload.m).toBe('full')
      expect(payload.t).toBeTypeOf('number')
      
      // 验证压缩健
      expect(payload.d.s).toHaveProperty('ont', true) // generalOpenInNewTab -> ont
      expect(payload.d.s).toHaveProperty('st', true)  // todoShow -> st
      expect(payload.d.i).toHaveProperty('hl', false) // hideLabel -> hl
    })

    it('should encode theme mode correctly (filtering)', () => {
      const result = encode(mockSettings, mockIconConfig, 'theme')
      const payload = JSON.parse(result.payload)

      expect(payload.m).toBe('theme')

      // 主题模式应该包含 wallpaperBlur (wb)
      expect(payload.d.s).toHaveProperty('wb', 10)

      // 主题模式不应该包含 todoShow (st)
      expect(payload.d.s).not.toHaveProperty('st')
    })

    it('should encode custom mode correctly', () => {
      const customSettings = { wallpaperBlur: 15, layoutGridRows: 3 }
      const customIcon = { boxSize: 90 }
      const result = encode(customSettings, customIcon, 'custom')
      const payload = JSON.parse(result.payload)

      expect(payload.m).toBe('custom')
      expect(payload.d.s).toHaveProperty('wb', 15)
      expect(payload.d.s).toHaveProperty('gr', 3)
      expect(payload.d.i).toHaveProperty('bs', 90)
      // 不应包含未传入的字段
      expect(Object.keys(payload.d.s)).toHaveLength(2)
    })

    it('should detect over limit correctly', () => {
      // 构造大数据
      const largeSettings: Record<string, any> = {}
      for (let i = 0; i < 100; i++) {
        largeSettings[`field_${i}`] = 'x'.repeat(50)
      }

      const result = encode(largeSettings, mockIconConfig, 'full')
      expect(result.isOverLimit).toBe(true)
      expect(result.size).toBeGreaterThan(2000)
    })

    it('should handle empty data', () => {
      const result = encode({}, {}, 'full')

      expect(result.size).toBeGreaterThan(0)
      expect(result.payload.length).toBeGreaterThan(0)

      const payload = JSON.parse(result.payload)
      expect(payload.d.s).toEqual({})
      expect(payload.d.i).toEqual({})
    })
  })

  describe('decode', () => {
    it('should decode valid payload correctly', () => {
      const { payload } = encode(mockSettings, mockIconConfig, 'full')
      const result = decode(payload)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      
      const decodedSettings = result.data!.d.settings
      const decodedIcon = result.data!.d.iconConfig
      
      expect(decodedSettings.generalOpenInNewTab).toBe(true)
      expect(decodedSettings.todoWidth).toBe(300)
      expect(decodedIcon.boxSize).toBe(80)
    })

    it('should handle invalid JSON', () => {
      const result = decode('{ invalid json }')
      expect(result.success).toBe(false)
      expect(result.error).toContain('无效的 JSON 格式')
    })

    it('should sanitize invalid fields', () => {
      // 构造恶意数据
      const maliciousPayload = {
        v: 1,
        t: Date.now(),
        m: 'full',
        d: {
          s: {
            ont: 'should be boolean', // 类型错误
            unknown_key: 123,         // 未知字段
            tw: 99999                 // 超出范围 (max 800)
          },
          i: {}
        }
      }

      const result = decode(JSON.stringify(maliciousPayload))

      expect(result.success).toBe(true)
      const settings = result.data!.d.settings

      // 错误的字段应该被过滤掉
      expect(settings).not.toHaveProperty('generalOpenInNewTab')
      expect(settings).not.toHaveProperty('unknown_key')
      expect(settings).not.toHaveProperty('todoWidth')
    })

    it('should accept boundary values', () => {
      const boundaryPayload = {
        v: 1,
        t: Date.now(),
        m: 'full',
        d: {
          s: {
            tw: 100,   // todoWidth min
            wb: 50,    // wallpaperBlur max
            gr: 1      // layoutGridRows min
          },
          i: {
            bs: 40,    // boxSize min
            op: 100    // opacity max
          }
        }
      }

      const result = decode(JSON.stringify(boundaryPayload))
      expect(result.success).toBe(true)

      const { settings, iconConfig } = result.data!.d
      expect(settings.todoWidth).toBe(100)
      expect(settings.wallpaperBlur).toBe(50)
      expect(iconConfig.boxSize).toBe(40)
      expect(iconConfig.opacity).toBe(100)
    })

    it('should reject out-of-boundary values', () => {
      const outOfBoundPayload = {
        v: 1,
        t: Date.now(),
        m: 'full',
        d: {
          s: {
            tw: 99,    // todoWidth < min(100)
            wb: 51     // wallpaperBlur > max(50)
          },
          i: {
            bs: 39     // boxSize < min(40)
          }
        }
      }

      const result = decode(JSON.stringify(outOfBoundPayload))
      expect(result.success).toBe(true)

      const { settings, iconConfig } = result.data!.d
      // 超出边界的值应被过滤
      expect(settings).not.toHaveProperty('todoWidth')
      expect(settings).not.toHaveProperty('wallpaperBlur')
      expect(iconConfig).not.toHaveProperty('boxSize')
    })

    it('should validate enum values', () => {
      const enumPayload = {
        v: 1,
        t: Date.now(),
        m: 'full',
        d: {
          s: {
            dp: 'compact',      // 有效枚举
            fpm: 'invalid',     // 无效枚举
            npem: 'markdown'    // 有效枚举
          },
          i: {}
        }
      }

      const result = decode(JSON.stringify(enumPayload))
      expect(result.success).toBe(true)

      const { settings } = result.data!.d
      expect(settings.layoutPreset).toBe('compact')
      expect(settings.notePadEditorMode).toBe('markdown')
      expect(settings).not.toHaveProperty('folderPreviewMode')
    })
  })

  describe('validate', () => {
    it('should fail on missing timestamp', () => {
      const payload = { v: 1, m: 'full', d: {} }
      const res = validate(payload)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('时间戳')
    })

    it('should fail on invalid version', () => {
      const payload = { v: 0, t: 123, m: 'full', d: {} }
      const res = validate(payload)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('版本')
    })

    it('should fail on invalid mode', () => {
      const payload = { v: 1, t: 123, m: 'invalid', d: {} }
      const res = validate(payload)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('模式')
    })

    it('should accept custom mode', () => {
      const payload = { v: 1, t: 123, m: 'custom', d: {} }
      const res = validate(payload)
      expect(res.valid).toBe(true)
    })

    it('should fail on missing data object', () => {
      const payload = { v: 1, t: 123, m: 'full' }
      const res = validate(payload)
      expect(res.valid).toBe(false)
      expect(res.error).toContain('数据')
    })
  })

  describe('round-trip', () => {
    it('should preserve data through encode → decode cycle', () => {
      const originalSettings = {
        generalOpenInNewTab: true,
        todoShow: false,
        todoWidth: 350,
        wallpaperBlur: 25,
        layoutPreset: 'spacious',
        weatherCity: '北京'
      }
      const originalIcon = {
        hideLabel: true,
        boxSize: 100,
        iconScale: 75,
        opacity: 80
      }

      // encode
      const { payload } = encode(originalSettings, originalIcon, 'full')

      // decode
      const result = decode(payload)
      expect(result.success).toBe(true)

      const { settings, iconConfig } = result.data!.d

      // 验证数据一致性
      expect(settings.generalOpenInNewTab).toBe(originalSettings.generalOpenInNewTab)
      expect(settings.todoShow).toBe(originalSettings.todoShow)
      expect(settings.todoWidth).toBe(originalSettings.todoWidth)
      expect(settings.wallpaperBlur).toBe(originalSettings.wallpaperBlur)
      expect(settings.layoutPreset).toBe(originalSettings.layoutPreset)
      expect(settings.weatherCity).toBe(originalSettings.weatherCity)

      expect(iconConfig.hideLabel).toBe(originalIcon.hideLabel)
      expect(iconConfig.boxSize).toBe(originalIcon.boxSize)
      expect(iconConfig.iconScale).toBe(originalIcon.iconScale)
      expect(iconConfig.opacity).toBe(originalIcon.opacity)
    })

    it('should preserve data in theme mode', () => {
      const settings = {
        wallpaperBlur: 30,
        layoutGridRows: 5,
        searchBarWidth: 60,
        todoShow: true  // 不在 theme 模式中
      }

      const { payload } = encode(settings, {}, 'theme')
      const result = decode(payload)

      expect(result.success).toBe(true)
      const decoded = result.data!.d.settings

      // theme 模式包含的字段
      expect(decoded.wallpaperBlur).toBe(30)
      expect(decoded.layoutGridRows).toBe(5)
      expect(decoded.searchBarWidth).toBe(60)

      // theme 模式不包含的字段
      expect(decoded).not.toHaveProperty('todoShow')
    })
  })
})
