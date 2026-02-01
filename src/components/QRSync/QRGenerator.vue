<script setup lang="ts">
/**
 * QR 二维码生成器组件
 * 支持模式选择、二维码渲染、下载/复制功能、SVG 导出、样式自定义
 *
 * 使用 Web Worker 进行 QR 矩阵生成，保持 UI 流畅
 */
import { ref, computed, watch, onMounted } from 'vue'
import { encode as encodeQR } from 'uqr'
import { useQRSync } from './composables/useQRSync'
import { useQRWorker } from './composables/useQRWorker'
import { useToast } from '@/components/Toast/composables/useToast'
import { useDialog } from '@/components/Dialog/composables/useDialog'
import { useSettings } from '@/composables/useSettings'
import { useQRRenderer } from './composables/useQRRenderer'
import { encode } from './utils/qr-codec'
import Button from '@/components/Button/Button.vue'
import ExportSelector from './components/ExportSelector.vue'
import { IconDownload, IconCopy, IconQrcode, IconAlertTriangle, IconSettings, IconFileExport, IconLock } from '@tabler/icons-vue'

const { showToast } = useToast()
const { open: openDialog } = useDialog()
const { settings, iconConfig } = useSettings()
const { generateQRAsync } = useQRWorker()

const {
  exportMode,
  encryptionPassword,
  encodeResult,
  getPayload,
  generateFileName,
  MAX_QR_CHARS
} = useQRSync()

const {
  renderFormat,
  styleConfig,
  formatOptions,
  renderQRToSVG,
  downloadSVG
} = useQRRenderer()

// 是否显示样式设置
const showStyleSettings = ref(false)

// Canvas 引用
const canvasRef = ref<HTMLCanvasElement | null>(null)
const imageSize = ref<string>('0 KB')

// 复用离屏 Canvas
let offCanvas: HTMLCanvasElement | null = null

// 二维码配置
const QR_SIZE = 512 // 增加分辨率以支持高密度二维码
const QUIET_ZONE = 24
const TOTAL_SIZE = QR_SIZE + QUIET_ZONE * 2

// 模式选项
const modeOptions = [
  { value: 'theme', label: '主题风格', desc: '外观 + 图标配置' },
  { value: 'full', label: '完整设置', desc: '全部配置项' },
  { value: 'custom', label: '自定义', desc: '选择性导出' }
] as const

// 自定义导出数据
const customExportData = ref<{
  settings: Record<string, any>
  iconConfig: Record<string, any>
} | null>(null)

// 渲染状态
const isRendering = ref(false)

// 渲染二维码 (异步 Worker)
async function renderQR() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')!
  const payload = getActivePayload()

  // 清空画布（使用配置的背景色）
  ctx.fillStyle = styleConfig.value.backgroundColor
  ctx.fillRect(0, 0, TOTAL_SIZE, TOTAL_SIZE)

  if (activeIsOverLimit.value) {
    // 超限时显示警告
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(QUIET_ZONE, QUIET_ZONE, QR_SIZE, QR_SIZE)
    ctx.fillStyle = '#999'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('数据过大', TOTAL_SIZE / 2, TOTAL_SIZE / 2)
    return
  }

  isRendering.value = true

  try {
    // 生成二维码矩阵（Worker 异步处理）
    const ecc = styleConfig.value.showLogo ? 'H' : 'L'
    const qr = await generateQRAsync(payload, ecc)
    const moduleCount = qr.size

    // 使用离屏 Canvas 进行 1:1 渲染
    if (!offCanvas) {
      offCanvas = document.createElement('canvas')
    }
    if (offCanvas.width !== moduleCount) {
      offCanvas.width = moduleCount
      offCanvas.height = moduleCount
    }

    const offCtx = offCanvas.getContext('2d')!

    if (offCtx) {
      // 清空离屏画布
      offCtx.clearRect(0, 0, moduleCount, moduleCount)
      // 使用配置的前景色
      offCtx.fillStyle = styleConfig.value.foregroundColor

      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (!qr.data[row][col]) continue

          // 跳过 Logo 区域
          if (styleConfig.value.showLogo && isInLogoArea(row, col, moduleCount)) {
            continue
          }

          offCtx.fillRect(col, row, 1, 1)
        }
      }

      // 绘制放大后的图像
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(offCanvas, QUIET_ZONE, QUIET_ZONE, QR_SIZE, QR_SIZE)

      // 绘制 Logo
      if (styleConfig.value.showLogo) {
        drawLogo(ctx)
      }

      // 计算生成图片的大小
      canvas.toBlob((blob) => {
        if (blob) {
           imageSize.value = (blob.size / 1024).toFixed(2) + ' KB'
        }
      }, 'image/png')
    }
  } catch (e) {
    console.error('[QR Render] Worker 生成失败:', e)
    // 降级：使用同步方式
    const ecc = styleConfig.value.showLogo ? 'H' : 'L'
    renderQRSync(payload, ecc, ctx)
  } finally {
    isRendering.value = false
  }
}

// Logo 区域检测
function isInLogoArea(row: number, col: number, moduleCount: number): boolean {
  const logoModules = Math.ceil(moduleCount * styleConfig.value.logoScale)
  const start = Math.floor((moduleCount - logoModules) / 2)
  const end = start + logoModules
  return row >= start && row < end && col >= start && col < end
}

// 绘制 Logo
function drawLogo(ctx: CanvasRenderingContext2D) {
  const logoSize = QR_SIZE * styleConfig.value.logoScale
  const x = QUIET_ZONE + (QR_SIZE - logoSize) / 2
  const y = QUIET_ZONE + (QR_SIZE - logoSize) / 2

  // 白色背景
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(x, y, logoSize, logoSize, 8)
  ctx.fill()

  // 绘制文字 Logo
  ctx.fillStyle = '#5E81AC'
  ctx.font = `600 ${logoSize * 0.5}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('澄', x + logoSize / 2, y + logoSize / 2)
}

// 同步渲染 QR（Worker 失败时的降级方案）
function renderQRSync(payload: string, ecc: 'L' | 'H', ctx: CanvasRenderingContext2D) {
  const qr = encodeQR(payload, { ecc })
  const moduleCount = qr.size

  if (!offCanvas) {
    offCanvas = document.createElement('canvas')
  }
  offCanvas.width = moduleCount
  offCanvas.height = moduleCount

  const offCtx = offCanvas.getContext('2d')!
  offCtx.clearRect(0, 0, moduleCount, moduleCount)
  offCtx.fillStyle = styleConfig.value.foregroundColor

  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!qr.data[row][col]) continue
      if (styleConfig.value.showLogo && isInLogoArea(row, col, moduleCount)) continue
      offCtx.fillRect(col, row, 1, 1)
    }
  }

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(offCanvas, QUIET_ZONE, QUIET_ZONE, QR_SIZE, QR_SIZE)

  if (styleConfig.value.showLogo) {
    drawLogo(ctx)
  }
}

// 打开自定义导出选择器
async function openExportSelector() {
  openDialog({
    title: '选择导出项',
    size: 'medium',
    showConfirmBtn: true,
    showCancelBtn: true,
    okText: '生成二维码',
    component: ExportSelector,
    componentProps: {
      settings: { ...settings },
      iconConfig: { ...iconConfig },
      onConfirm: (data: { settings: Record<string, any>; iconConfig: Record<string, any> }) => {
        customExportData.value = data
        renderQR()
      }
    }
  })
}

// 自定义模式的编码结果
const customEncodeResult = computed(() => {
  if (!customExportData.value) return null
  return encode(
    customExportData.value.settings,
    customExportData.value.iconConfig,
    'custom'
  )
})

// 当前有效的编码结果（根据模式选择）
const activeEncodeResult = computed(() => {
  if (exportMode.value === 'custom' && customEncodeResult.value) {
    return customEncodeResult.value
  }
  return encodeResult.value
})

// 当前有效的 payload
function getActivePayload(): string {
  if (exportMode.value === 'custom' && customEncodeResult.value) {
    return customEncodeResult.value.payload
  }
  return getPayload()
}

// 当前是否超限
const activeIsOverLimit = computed(() => {
  return activeEncodeResult.value.isOverLimit
})

// 当前 payload 大小
const activePayloadSizeKB = computed(() => {
  return (activeEncodeResult.value.size / 1024).toFixed(2)
})

// 监听变化重新渲染
watch([encodeResult, exportMode, styleConfig, customExportData], () => {
  renderQR()
}, { immediate: false, deep: true })

onMounted(() => {
  renderQR()
})

// 加密逻辑
const showPasswordInput = ref(false)

function toggleEncryption(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) {
    showPasswordInput.value = true
    // Auto focus logic if needed
  } else {
    encryptionPassword.value = ''
    showPasswordInput.value = false
  }
}

const passwordStrength = computed(() => {
  const pwd = encryptionPassword.value
  if (!pwd) return 0
  // Simple check: length based + char variety could be added
  let score = Math.min(pwd.length * 10, 60)
  if (/[A-Z]/.test(pwd)) score += 10
  if (/[a-z]/.test(pwd)) score += 10
  if (/[0-9]/.test(pwd)) score += 10
  if (/[^A-Za-z0-9]/.test(pwd)) score += 10
  return Math.min(score, 100)
})

const strengthColor = computed(() => {
  const score = passwordStrength.value
  if (score < 40) return 'var(--color-danger)'
  if (score < 80) return 'var(--color-warning)'
  return 'var(--color-success)'
})

// 下载图片
async function downloadQR() {
  if (activeIsOverLimit.value) return

  try {
    // SVG 格式
    if (renderFormat.value === 'svg') {
      const svgString = renderQRToSVG({
        data: getActivePayload(),
        size: QR_SIZE,
        quietZone: QUIET_ZONE,
        style: styleConfig.value
      })
      downloadSVG(svgString, generateFileName())
      showToast({ type: 'success', message: 'SVG 已下载' })
      return
    }

    // PNG 格式
    const canvas = canvasRef.value
    if (!canvas) return

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('转换失败')), 'image/png')
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = generateFileName()
    a.click()
    URL.revokeObjectURL(url)

    showToast({ type: 'success', message: '二维码已下载' })
  } catch (e) {
    showToast({ type: 'error', message: '下载失败' })
  }
}

// 复制图片到剪贴板
async function copyQRImage() {
  const canvas = canvasRef.value
  if (!canvas || activeIsOverLimit.value) return

  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('转换失败')), 'image/png')
    })

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ])

    showToast({ type: 'success', message: '已复制到剪贴板' })
  } catch (e) {
    showToast({ type: 'error', message: '复制失败，请尝试下载' })
  }
}

// 复制文本
async function copyText() {
  try {
    await navigator.clipboard.writeText(getActivePayload())
    showToast({ type: 'success', message: '配置文本已复制' })
  } catch (e) {
    showToast({ type: 'error', message: '复制失败' })
  }
}

// 导出 JSON 文件
function exportJSON() {
  const payload = getActivePayload()
  const blob = new Blob([payload], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = generateFileName().replace(/\.(png|svg)$/, '.json')
  a.click()
  URL.revokeObjectURL(url)
  showToast({ type: 'success', message: 'JSON 已导出' })
}

// 容量百分比
const capacityPercent = computed(() => {
  return Math.min(100, Math.round((activeEncodeResult.value.size / MAX_QR_CHARS) * 100))
})
</script>

<template>
  <div class="qr-generator">
    <!-- 模式选择 -->
    <div class="mode-selector">
      <label
        v-for="opt in modeOptions"
        :key="opt.value"
        class="mode-option"
        :class="{ active: exportMode === opt.value }"
        @click="opt.value === 'custom' && openExportSelector()"
      >
        <input
          type="radio"
          :value="opt.value"
          v-model="exportMode"
          class="sr-only"
          @click.stop
        >
        <span class="mode-label">{{ opt.label }}</span>
        <span class="mode-desc">{{ opt.desc }}</span>
      </label>
    </div>

    <!-- 加密设置 -->
    <div class="style-panel" style="margin-top: 0">
      <div class="style-row">
        <span class="style-label">
          <IconLock :size="14" style="margin-right: 4px; vertical-align: middle" />
          加密保护
        </span>
        <label class="switch">
          <input type="checkbox" :checked="!!encryptionPassword" @change="toggleEncryption">
          <span class="slider"></span>
        </label>
      </div>

      <div v-if="!!encryptionPassword || showPasswordInput" class="password-container">
        <input 
          type="password" 
          v-model="encryptionPassword" 
          placeholder="请输入导出密码"
          class="password-input"
        >
        <div class="password-strength" v-if="encryptionPassword">
          <div class="strength-bar" :style="{ width: passwordStrength + '%', background: strengthColor }"></div>
        </div>
      </div>
    </div>

    <!-- 样式设置切换 -->
    <button class="style-toggle" @click="showStyleSettings = !showStyleSettings">
      <IconSettings :size="16" />
      <span>样式设置</span>
    </button>

    <!-- 样式设置面板 -->
    <div v-if="showStyleSettings" class="style-panel">
      <!-- 导出格式 -->
      <div class="style-row">
        <span class="style-label">导出格式</span>
        <div class="style-options">
          <label
            v-for="opt in formatOptions"
            :key="opt.value"
            class="style-option"
            :class="{ active: renderFormat === opt.value }"
          >
            <input type="radio" :value="opt.value" v-model="renderFormat" class="sr-only">
            <span>{{ opt.label }}</span>
          </label>
        </div>
      </div>

      <!-- 显示 Logo -->
      <div class="style-row">
        <span class="style-label">显示 Logo</span>
        <label class="switch">
          <input type="checkbox" v-model="styleConfig.showLogo">
          <span class="slider"></span>
        </label>
      </div>

      <!-- 前景色 -->
      <div class="style-row">
        <span class="style-label">前景色</span>
        <input type="color" v-model="styleConfig.foregroundColor" class="color-input">
      </div>
    </div>

    <!-- 二维码展示 -->
    <div class="qr-display">
      <canvas
        ref="canvasRef"
        :width="TOTAL_SIZE"
        :height="TOTAL_SIZE"
        class="qr-canvas"
      />

      <!-- 容量指示 -->
      <div class="capacity-bar">
        <div
          class="capacity-fill"
          :class="{ warning: capacityPercent > 80, danger: activeIsOverLimit }"
          :style="{ width: `${capacityPercent}%` }"
        />
      </div>

      <div class="capacity-text">
        <span>配置数据: {{ activePayloadSizeKB }} KB</span>
        <span class="divider">|</span>
        <span>图片大小: {{ imageSize }}</span>
        <span v-if="activeIsOverLimit" class="warning-text">
          <IconAlertTriangle :size="14" />
          超出容量限制
        </span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions">
      <Button
        variant="outline"
        :disabled="activeIsOverLimit"
        @click="downloadQR"
      >
        <IconDownload :size="16" />
        下载图片
      </Button>

      <Button
        variant="outline"
        :disabled="activeIsOverLimit"
        @click="copyQRImage"
      >
        <IconCopy :size="16" />
        复制图片
      </Button>

      <Button
        variant="text"
        @click="copyText"
        title="复制配置文本（备用方案）"
      >
        <IconQrcode :size="16" />
        复制文本
      </Button>

      <Button
        variant="text"
        @click="exportJSON"
        title="导出为 JSON 文件（无容量限制）"
      >
        <IconFileExport :size="16" />
        导出 JSON
      </Button>
    </div>

    <!-- 超限提示 -->
    <div v-if="activeIsOverLimit" class="overlimit-tip">
      <IconAlertTriangle :size="16" />
      <span>配置数据过大，建议切换到「主题风格」模式或使用「复制文本」</span>
    </div>
  </div>
</template>

<style scoped>
.qr-generator {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 模式选择器 */
.mode-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.mode-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  border-radius: 8px;
  background: var(--bg-input);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-option:hover {
  background: var(--bg-hover-card);
}

.mode-option.active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.mode-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.mode-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 样式设置切换按钮 */
.style-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.style-toggle:hover {
  background: var(--bg-hover-card);
  color: var(--text-primary);
}

/* 样式设置面板 */
.style-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--bg-input);
  border-radius: 8px;
}

.password-container {
  margin-top: 8px;
  animation: slideDown 0.2s ease-out;
}

.password-input {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-canvas);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.password-input:focus {
  border-color: var(--color-primary);
}

.password-strength {
  margin-top: 6px;
  height: 3px;
  background: var(--bg-modifier-hover);
  border-radius: 2px;
  overflow: hidden;
}

.strength-bar {
  height: 100%;
  transition: all 0.3s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.style-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.style-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.style-options {
  display: flex;
  gap: 8px;
}

.style-option {
  padding: 4px 10px;
  background: var(--bg-panel);
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.style-option.active {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.color-input {
  width: 32px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 开关样式 */
.switch {
  position: relative;
  width: 36px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  background: var(--bg-panel);
  border-radius: 10px;
  cursor: pointer;
  transition: 0.2s;
}

.slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  left: 2px;
  bottom: 2px;
  background: white;
  border-radius: 50%;
  transition: 0.2s;
}

.switch input:checked + .slider {
  background: var(--color-primary);
}

.switch input:checked + .slider::before {
  transform: translateX(16px);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

/* 二维码展示 */
.qr-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.qr-canvas {
  max-width: 280px;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 容量指示条 */
.capacity-bar {
  width: 200px;
  height: 4px;
  background: var(--bg-input);
  border-radius: 2px;
  overflow: hidden;
}

.capacity-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s, background 0.3s;
}

.capacity-fill.warning {
  background: var(--color-warning);
}

.capacity-fill.danger {
  background: var(--color-danger);
}

.capacity-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.warning-text {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-danger);
}

/* 操作按钮 */
.actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* 超限提示 */
.overlimit-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--color-warning-bg);
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-warning);
}
</style>
