<script setup lang="ts">
import { ref, computed, toRef, watch } from 'vue'
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

// 动态引入 Button 组件 (假设项目中已有，如果没有则使用原生 button)
// 这里临时使用原生 button 配合样式，或者如果确认有 Button 组件改用之
// 暂时使用原生 button 以减少依赖假设

const props = withDefaults(defineProps<DialogProps>(), {
  modelValue: false,
  type: 'info',
  width: '480px',
  layout: 'center',
  mask: true,
  maskClosable: true,
  showClose: true,
  okText: '确定',
  cancelText: '取消',
  showConfirmBtn: true,
  showCancelBtn: false, // 默认仅展示确定，confirm 类型除外
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'ok'): void
  (e: 'cancel'): void
  (e: 'close'): void
  (e: 'afterClose'): void
}>()

// --- 状态管理 ---
const visible = ref(props.modelValue)
const dialogRef = ref<HTMLElement | null>(null)

watch(
  () => props.modelValue,
  val => {
    visible.value = val
  }
)

const close = () => {
  visible.value = false
  emit('update:modelValue', false)
  emit('close')
  // afterClose 在 transition 结束处理，这里简化
  setTimeout(() => emit('afterClose'), 300)
}

const handleMaskClick = () => {
  if (props.maskClosable) {
    emit('cancel')
    close()
  }
}

const handleOk = () => {
  emit('ok')
}

const handleCancel = () => {
  emit('cancel')
  close()
}

// --- Follow Trigger 逻辑 ---
// 判断是否处于 Follow Trigger 模式
const isFollowMode = computed(() => !!props.triggerRect)

// 如果是 Follow Mode，我们需要计算位置
const { dialogStyle, arrowPlacementClass } = useDialogPosition({
  isOpen: visible,
  dialogRef,
  triggerRect: toRef(props, 'triggerRect'),
  // @ts-ignore: PropType optional vs required handling
  placement: toRef(props, 'placement'),
})

// 计算最终样式
const containerStyle = computed(() => {
  if (isFollowMode.value) {
    return {
      ...dialogStyle.value,
      width: typeof props.width === 'number' ? `${props.width}px` : props.width,
    }
  }
  return {
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
  }
})

// 计算 Layout Class (仅非 Follow Mode 生效)
const layoutClass = computed(() => {
  if (isFollowMode.value) return '' // Follow 模式通过 style 定位
  return `layout-${props.layout}`
})

// 图标映射
const iconMap = {
  info: IconInfoCircle,
  success: IconCheck,
  warning: IconAlertTriangle,
  error: IconAlertCircle,
  confirm: IconHelp,
}

const currentIcon = computed(() => iconMap[props.type] || IconInfoCircle)

// --- Animation Logic (Mouse Origin) ---
const setAnimationOrigin = (el: Element) => {
  const panel = el as HTMLElement
  if (!panel || !props.mousePosition) return

  const { innerWidth: vw, innerHeight: vh } = window
  const h = panel.offsetHeight

  let centerX = vw / 2
  let centerY = vh / 2

  if (props.layout === 'top') {
    centerY = vh * 0.1 + h / 2
  } else if (props.layout === 'bottom') {
    centerY = vh * 0.95 - h / 2
  }

  panel.style.setProperty('--dialog-origin-x', `${props.mousePosition.x - centerX}px`)
  panel.style.setProperty('--dialog-origin-y', `${props.mousePosition.y - centerY}px`)
}

const onBeforeEnter = (el: Element) => {
  if (!isFollowMode.value) setAnimationOrigin(el)
}

const onEnter = (el: Element, done: () => void) => {
  if (isFollowMode.value) {
    done()
    return
  }
  el.addEventListener('transitionend', done, { once: true })
  setTimeout(done, 400)
}

const onLeave = (el: Element, done: () => void) => {
  if (isFollowMode.value) {
    done()
    return
  }
  setAnimationOrigin(el)
  const onEnd = () => {
    emit('close')
    done()
  }
  el.addEventListener('transitionend', onEnd, { once: true })
  setTimeout(onEnd, 300)
}
</script>

<template>
  <Teleport to="body">
    <div class="dialog-root" :style="{ zIndex: props.zIndex || 2000 }">
      <!-- 1. 遮罩层 -->
      <Transition name="fade">
        <div
          v-if="visible && props.mask"
          class="dialog-mask"
          :class="{ transparent: isFollowMode }"
          @click="handleMaskClick"
        ></div>
      </Transition>

      <!-- 2. 布局容器/定位层 -->
      <div
        class="dialog-wrap"
        :class="[layoutClass, { 'pointer-events-none': !visible }]"
        @click.self="handleMaskClick"
      >
        <!-- 3. 对话框实体 -->
        <Transition
          :name="isFollowMode ? 'zoom-fade' : 'dialog'"
          @before-enter="onBeforeEnter"
          @enter="onEnter"
          @leave="onLeave"
        >
          <div
            v-if="visible"
            ref="dialogRef"
            class="dialog-panel"
            :class="[props.type, arrowPlacementClass]"
            :style="containerStyle"
            role="dialog"
            aria-modal="true"
          >
            <!-- 头部 -->
            <div class="dialog-header">
              <div class="header-content">
                <div class="status-icon" :class="props.type">
                  <component :is="currentIcon" size="22" stroke-width="2" />
                </div>
                <div v-if="title || $slots.header" class="title">
                  <slot name="header">{{ title }}</slot>
                </div>
              </div>

              <button v-if="showClose" class="close-btn" @click="handleCancel">
                <IconX size="18" />
              </button>
            </div>

            <!-- 内容 -->
            <div class="dialog-body">
              <slot>{{ content }}</slot>
            </div>

            <!-- 底部 -->
            <div v-if="$slots.footer || showConfirmBtn || showCancelBtn" class="dialog-footer">
              <slot name="footer">
                <button v-if="showCancelBtn" class="btn btn-ghost" @click="handleCancel">
                  {{ cancelText }}
                </button>

                <button
                  v-if="showConfirmBtn"
                  class="btn btn-primary"
                  :class="{ loading: loading }"
                  :disabled="loading"
                  @click="handleOk"
                >
                  <span v-if="loading" class="spinner"></span>
                  {{ okText }}
                </button>
              </slot>
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

/* --- Mask --- */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  /* 默认遮罩：使用半透明黑 */
  background: var(--mask-dark, rgba(0, 0, 0, 0.45));
  backdrop-filter: blur(2px);
  z-index: -1;
  /* z-index 由 root 控制，这里相对 root 为 -1 即可? 
     不，root 本身没有层级上下文可能不行。
     但在 setup 中 root.zIndex 设为了 2000。
     为了稳妥，我们在 dialog-wrap 上设 z-index。
  */
}

/* Follow Mode 下遮罩透明，但仍阻挡点击外部 (或视需求改为 pointer-events: none 允许点击) 
   这里设计为透明遮罩，点击自动关闭，符合 Popover 习惯 */
.dialog-mask.transparent {
  background: transparent;
  backdrop-filter: none;
}

/* --- Wrapper for Layout --- */
.dialog-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  /* 在 mask 之上 */
  pointer-events: none;
  /* 默认穿透，Panel 自身开启 */

  display: flex;
  padding: 20px;
}

/* 布局策略 */
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

/* --- Panel --- */
.dialog-panel {
  pointer-events: auto;
  background: var(--bg-panel);
  backdrop-filter: var(--blur-lg);
  border: var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);

  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* 默认宽度，可被 style 覆盖 */
  max-width: 90vw;

  color: var(--text-primary);
}

/* --- Header --- */
.dialog-header {
  padding: 20px 24px 12px;
  display: flex;
  align-items: flex-start;
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

/* 状态图标颜色 */
.status-icon {
  display: flex;
  align-items: center;
}

.status-icon.info {
  color: var(--nord8, #88c0d0);
}

.status-icon.success {
  color: var(--nord14, #a3be8c);
}

.status-icon.warning {
  color: var(--nord13, #ebcb8b);
}

.status-icon.error {
  color: var(--nord11, #bf616a);
}

.status-icon.confirm {
  color: var(--nord10, #5e81ac);
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  transition: all 0.2s;
  padding: 4px;
  border-radius: 4px;
  margin-right: -4px;
  margin-top: -4px;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

/* --- Body --- */
.dialog-body {
  padding: 8px 24px 24px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* --- Footer --- */
.dialog-footer {
  padding: 16px 24px;
  border-top: var(--border-divider);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: rgba(0, 0, 0, 0.02);
}

/* --- Internal Buttons (Simple Implementation) --- */
.btn {
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-ghost {
  background: transparent;
  border: 1px solid var(--border-glass);
  color: var(--text-primary);
}

.btn-ghost:hover {
  background: var(--bg-hover);
}

.btn-primary {
  background: var(--color-primary);
  border: 1px solid transparent;
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-primary:active {
  transform: translateY(1px);
}

.btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Loading Spinner */
.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* --- Transitions --- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 标准 Dialog 缩放动画 */
.dialog-scale-enter-active,
.dialog-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dialog-scale-enter-from,
.dialog-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* Follow Mode 动画 (更轻快) */
.zoom-fade-enter-active,
.zoom-fade-leave-active {
  transition:
    opacity 0.2s,
    transform 0.2s;
}

.zoom-fade-enter-from,
.zoom-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* === Dialog Mouse Origin Animation === */

/* 进入动画 */
.dialog-panel.dialog-enter-from {
  opacity: 0;
  transform: translate(var(--dialog-origin-x, 0px), var(--dialog-origin-y, 0px)) scale(0);
}

.dialog-panel.dialog-enter-to {
  opacity: 1;
  transform: translate(0, 0) scale(1);
}

.dialog-panel.dialog-enter-active {
  transition:
    transform 400ms cubic-bezier(0.33, 1, 0.68, 1),
    opacity 400ms cubic-bezier(0.33, 1, 0.68, 1);
  will-change: transform, opacity;
}

/* 离开动画 */
.dialog-panel.dialog-leave-from {
  opacity: 1;
  transform: translate(0, 0) scale(1);
}

.dialog-panel.dialog-leave-to {
  opacity: 0;
  transform: translate(var(--dialog-origin-x, 0px), var(--dialog-origin-y, 0px)) scale(0);
}

.dialog-panel.dialog-leave-active {
  transition:
    transform 300ms cubic-bezier(0.4, 0, 1, 1),
    opacity 300ms cubic-bezier(0.4, 0, 1, 1);
  will-change: transform, opacity;
}
</style>
