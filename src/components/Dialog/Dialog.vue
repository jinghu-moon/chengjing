<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import {
  IconInfoCircle,
  IconCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconHelp,
  IconX,
} from '@tabler/icons-vue'
import { useDialogPosition } from './composables/useDialogPosition'
import type { DialogProps } from './types'
import { Button, buttonPresets } from '@/components/Button'

const props = withDefaults(defineProps<DialogProps>(), {
  modelValue: false,
  type: 'info',
  size: 'medium',
  closable: true,
  closeOnEsc: true,
  confirmOnEnter: true,
  maskClosable: true,
  mask: true,
  showIcon: true,
  okText: '确定',
  cancelText: '取消',
  showConfirmBtn: true,
  showCancelBtn: false,
  loading: false,
  transformOrigin: 'mouse',
  placement: 'center',
  destroyOnClose: false,
  lockScroll: true,
  rootClass: '',
  maskClass: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'before-open': []
  'open': []
  'opened': []
  'before-close': []
  'close': []
  'closed': []
  'positive-click': []
  'negative-click': []
  'mask-click': []
  'esc': []
}>()

// ===== 状态管理 =====
const visible = ref(props.modelValue)
const dialogRef = ref<HTMLElement | null>(null)
const shouldRender = ref(props.modelValue)
const internalLoading = ref(false)

watch(
  () => props.modelValue,
  val => {
    if (val) {
      shouldRender.value = true
      nextTick(() => {
        visible.value = true
      })
    } else {
      visible.value = false
    }
  }
)

// ===== 关闭逻辑 =====
const close = async (action: 'positive' | 'negative' | 'close' = 'close') => {
  // 调用 beforeClose 钩子
  if (props.beforeClose) {
    internalLoading.value = true
    try {
      const result = await props.beforeClose(action)
      if (result === false) {
        internalLoading.value = false
        return // 阻止关闭
      }
    } catch (error) {
      internalLoading.value = false
      return // Promise rejected，阻止关闭
    }
    internalLoading.value = false
  }

  emit('before-close')
  visible.value = false
  emit('update:modelValue', false)
  emit('close')
}

const handleMaskClick = () => {
  emit('mask-click')
  if (props.maskClosable) {
    close('close')
  }
}

const handlePositiveClick = async () => {
  emit('positive-click')
  if (!props.loading && !internalLoading.value) {
    await close('positive')
  }
}

const handleNegativeClick = async () => {
  emit('negative-click')
  await close('negative')
}

// ===== ESC 键处理 =====
const handleEsc = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && visible.value && props.closeOnEsc) {
    emit('esc')
    close('close')
  }
}

// ===== Enter 键处理 =====
const handleEnter = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && visible.value && props.confirmOnEnter && props.showConfirmBtn) {
    e.preventDefault()
    handlePositiveClick()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEsc)
  document.addEventListener('keydown', handleEnter)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEsc)
  document.removeEventListener('keydown', handleEnter)
})

// ===== body 滚动锁定 =====
const lockBodyScroll = () => {
  if (!props.lockScroll) return
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  document.body.style.overflow = 'hidden'
  document.body.style.paddingRight = `${scrollbarWidth}px`
}

const unlockBodyScroll = () => {
  if (!props.lockScroll) return
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
}

watch(visible, (newVal) => {
  if (newVal) {
    lockBodyScroll()
  } else {
    unlockBodyScroll()
  }
})

onUnmounted(() => {
  unlockBodyScroll()
})

// ===== Follow 模式定位 =====
const isFollowMode = computed(() => !!props.triggerRect)

const { dialogStyle, arrowPlacementClass, updatePosition } = useDialogPosition({
  isOpen: visible,
  dialogRef,
  triggerRect: computed(() => props.triggerRect),
  placement: computed(() => props.placement),
})

watch(visible, newVal => {
  if (newVal && isFollowMode.value) {
    nextTick(() => updatePosition())
  }
})

// ===== 样式计算 =====
const sizeMap = {
  small: '400px',
  medium: '600px',
  large: '800px',
}

const containerStyle = computed(() => {
  // 优先使用 width，其次使用 size 预设
  const finalWidth = props.width || sizeMap[props.size]
  const baseStyle = {
    width: typeof finalWidth === 'number' ? `${finalWidth}px` : finalWidth,
  }
  return isFollowMode.value ? { ...dialogStyle.value, ...baseStyle } : baseStyle
})

const layoutClass = computed(() => {
  if (isFollowMode.value) return ''
  return `layout-${props.placement}`
})

// ===== 图标 =====
const iconMap = {
  info: IconInfoCircle,
  success: IconCheck,
  warning: IconAlertTriangle,
  error: IconAlertCircle,
  confirm: IconHelp,
}

const currentIcon = computed(() => iconMap[props.type])

// ===== 动画逻辑 =====
const setAnimationOrigin = (el: Element) => {
  const panel = el as HTMLElement
  if (!panel) return

  // Follow 模式：使用触发元素位置作为动画原点
  if (isFollowMode.value && props.triggerRect) {
    const panelRect = panel.getBoundingClientRect()
    const trigger = props.triggerRect

    const triggerCenterX = trigger.left + trigger.width / 2
    const triggerCenterY = trigger.top + trigger.height / 2
    const panelCenterX = panelRect.left + panelRect.width / 2
    const panelCenterY = panelRect.top + panelRect.height / 2

    const offsetX = triggerCenterX - panelCenterX
    const offsetY = triggerCenterY - panelCenterY
    const slideDirection = panelCenterY < triggerCenterY ? 1 : -1

    panel.style.setProperty('--dialog-origin-x', `${offsetX}px`)
    panel.style.setProperty('--dialog-origin-y', `${offsetY}px`)
    panel.style.setProperty('--dialog-slide-direction', `${slideDirection}`)
    return
  }

  // 鼠标位置模式
  if (props.transformOrigin === 'mouse' && props.mousePosition) {
    const { innerWidth: vw, innerHeight: vh } = window
    const h = panel.offsetHeight

    let centerX = vw / 2
    let centerY = vh / 2

    if (props.placement === 'top') {
      centerY = vh * 0.1 + h / 2
    } else if (props.placement === 'bottom') {
      centerY = vh * 0.95 - h / 2
    }

    panel.style.setProperty('--dialog-origin-x', `${props.mousePosition.x - centerX}px`)
    panel.style.setProperty('--dialog-origin-y', `${props.mousePosition.y - centerY}px`)
  }
}

// ===== Transition 钩子 =====
const onBeforeEnter = (el: Element) => {
  emit('before-open')
  if (isFollowMode.value) {
    requestAnimationFrame(() => setAnimationOrigin(el))
  } else {
    setAnimationOrigin(el)
  }
}

const onAfterEnter = () => {
  emit('open')
  emit('opened')
}

const onBeforeLeave = (el: Element) => {
  setAnimationOrigin(el)
}

const onAfterLeave = () => {
  emit('closed')
  if (props.destroyOnClose) {
    shouldRender.value = false
  }
}

// 暴露 dialogRef 供父组件使用
// 暴露 dialogRef 供父组件使用
defineExpose({
  dialogRef
})

// ===== 高度自适应动画 =====
const dialogContentRef = ref<HTMLElement | null>(null)
const panelHeight = ref<string | number>('auto')
let resizeObserver: ResizeObserver | null = null

const startObserve = () => {
  if (!dialogContentRef.value) return
  resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.borderBoxSize?.[0]) {
        panelHeight.value = `${entry.borderBoxSize[0].blockSize}px`
      } else {
        // Fallback for older browsers
        panelHeight.value = `${entry.contentRect.height}px`
      }
    }
  })
  resizeObserver.observe(dialogContentRef.value)
}

watch(dialogContentRef, (val) => {
  if (val) {
    // 首次挂载时使用 nextTick 确保测量准确
    nextTick(() => startObserve())
  } else {
    resizeObserver?.disconnect()
    panelHeight.value = 'auto'
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="shouldRender" class="dialog-root" :class="[props.rootClass]" :style="{ zIndex: props.zIndex || 2000 }">
      <!-- 遮罩层 -->
      <Transition name="fade">
        <div
          v-if="visible && mask"
          class="dialog-mask"
          :class="[{ transparent: isFollowMode }, props.maskClass]"
          @click="handleMaskClick"
        />
      </Transition>

      <!-- 布局容器 -->
      <div
        class="dialog-wrap"
        :class="[layoutClass, { 'pointer-events-none': !visible }]"
        @click.self="handleMaskClick"
      >
        <!-- 对话框面板 -->
        <Transition
          :name="isFollowMode ? 'zoom-fade' : 'dialog'"
          @before-enter="onBeforeEnter"
          @after-enter="onAfterEnter"
          @before-leave="onBeforeLeave"
          @after-leave="onAfterLeave"
        >
          <div
            v-if="visible"
            ref="dialogRef"
            class="dialog-panel"
            :class="[type, arrowPlacementClass, props.dialogClass]"
            :style="[containerStyle, { height: panelHeight }]"
            role="dialog"
            aria-modal="true"
          >
            <div ref="dialogContentRef" class="dialog-panel-inner">
              <!-- 头部 -->
              <div class="dialog-header" :class="props.headerClass">
                <div class="header-content">
                  <div v-if="showIcon" class="status-icon" :class="type">
                    <component :is="currentIcon" size="22" stroke-width="2" />
                  </div>
                  <div v-if="title || $slots.header" class="title">
                    <slot name="header">{{ title }}</slot>
                  </div>
                </div>

                <button v-if="closable" class="close-btn" @click="handleNegativeClick">
                  <IconX size="18" />
                </button>
              </div>

              <!-- 内容 -->
              <div class="dialog-body" :class="props.contentClass">
                <slot>{{ content }}</slot>
              </div>

              <!-- 底部 -->
              <div v-if="$slots.footer || showConfirmBtn || showCancelBtn" class="dialog-footer" :class="props.footerClass">
                <slot name="footer">
                  <Button
                    v-if="showCancelBtn"
                    v-bind="{ theme: 'default', variant: 'base', ...props.cancelButtonProps }"
                    @click="handleNegativeClick"
                  >
                    {{ cancelText }}
                  </Button>

                  <Button
                    v-if="showConfirmBtn"
                    v-bind="{ ...buttonPresets.primary, ...props.okButtonProps }"
                    :loading="loading || internalLoading"
                    :disabled="loading || internalLoading"
                    @click="handlePositiveClick"
                  >
                    {{ okText }}
                  </Button>
                </slot>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-root {
  position: relative;
}

/* 遮罩层 */
.dialog-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  z-index: -1;
}

.dialog-mask.transparent {
  background: transparent;
  backdrop-filter: none;
}

/* 布局容器 */
.dialog-wrap {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  display: flex;
  padding: 20px;
}

.layout-center {
  align-items: center;
  justify-content: center;
}

.layout-top {
  align-items: flex-start;
  justify-content: center;
  padding-top: 10vh;
}

.layout-bottom {
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 5vh;
}

/* 对话框面板 */
.dialog-panel {
  pointer-events: auto;
  background: var(--bg-panel);
  backdrop-filter: var(--glass-md);
  border: var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-width: 90vw;
  color: var(--text-primary);
  /* 高度过渡动画 */
  transition: height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  will-change: height;
}

.dialog-panel-inner {
  display: flex;
  flex-direction: column;
}

/* 头部 */
.dialog-header {
  padding: 20px 24px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.status-icon {
  display: flex;
  align-items: center;
}

.status-icon.info {
  color: var(--nord8);
}

.status-icon.success {
  color: var(--nord14);
}

.status-icon.warning {
  color: var(--nord13);
}

.status-icon.error {
  color: var(--nord11);
}

.status-icon.confirm {
  color: var(--nord10);
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  transition: all 0.2s;
  padding: 4px;
  border-radius: 4px;
  margin: -4px -4px 0 0;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

/* 内容 */
.dialog-body {
  padding: 8px 24px 24px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* 底部 */
.dialog-footer {
  padding: 16px 24px;
  border-top: var(--border-divider);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: rgba(0, 0, 0, 0.02);
}

/* 遮罩淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Follow 模式动画 */
.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition:
    opacity 0.2s cubic-bezier(0.2, 0, 0.2, 1),
    transform 0.2s cubic-bezier(0.2, 0, 0.2, 1);
}

.zoom-fade-enter-from,
.zoom-fade-leave-to {
  opacity: 0;
  transform: translateY(calc(var(--dialog-slide-direction, -1) * 12px)) scale(0.95);
}

/* 标准对话框动画（鼠标位置原点） */
.dialog-enter-active {
  transition:
    transform 0.4s cubic-bezier(0.33, 1, 0.68, 1),
    opacity 0.4s cubic-bezier(0.33, 1, 0.68, 1);
}

.dialog-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 1, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 1, 1);
}

.dialog-enter-from {
  opacity: 0;
  transform: translate(var(--dialog-origin-x, 0), var(--dialog-origin-y, 0)) scale(0);
}

.dialog-enter-to,
.dialog-leave-from {
  opacity: 1;
  transform: translate(0, 0) scale(1);
}

.dialog-leave-to {
  opacity: 0;
  transform: translate(var(--dialog-origin-x, 0), var(--dialog-origin-y, 0)) scale(0);
}
</style>
