<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import SelectDropdown from './SelectDropdown.vue'
import { usePosition, type VirtualRect } from '../composables/usePosition'
import { useKeyboardNav } from '../composables/useKeyboardNav'
import { isSelectOption, type OptionItem, type SelectOption } from '../types'

// ==================== 常量定义 ====================
// ==================== 常量定义 ====================
// (已移除未使用的预测尺寸常量)

// ==================== 状态定义 ====================
const isOpen = ref(false)
const options = ref<OptionItem[]>([])
const virtualRect = ref<VirtualRect | null>(null)
const focusedIndex = ref(-1)

let resolvePromise: ((value: string | null) => void) | null = null

const dropdownComponentRef = ref<InstanceType<typeof SelectDropdown> | null>(null)
const dropdownRef = computed(() => dropdownComponentRef.value?.dropdownEl ?? null)
const dropdownScrollRef = computed(() => dropdownComponentRef.value?.scrollEl ?? null)

// ==================== Composables ====================
const {
  dropdownStyle,
  arrowStyle,
  arrowPlacementClass,
  currentPlacement, // [新增]
  throttledUpdatePosition,
  resetCache,
} = usePosition({
  isOpen,
  dropdownRef,
  virtualRect,
  showArrow: ref(false),
})

const { handleKeydown, initFocusedIndex } = useKeyboardNav({
  options: options,
  layout: ref('list'),
  isOpen,
  focusedIndex,
  disabled: ref(false),
  modelValue: ref(''),
  dropdownScrollRef,
  onSelect: (value: string) => {
    const opt = options.value.find(o => isSelectOption(o) && o.value === value)
    if (opt && isSelectOption(opt)) {
      handleSelect(opt)
    }
  },
})

// ==================== 公开方法 ====================

// 【终极 Open】：幽灵测量 + 真实尺寸计算
const open = async (e: MouseEvent, menuOptions: OptionItem[]): Promise<string | null> => {
  e.preventDefault()

  if (resolvePromise) {
    resolvePromise(null)
    resolvePromise = null
  }
  resetCache()

  return new Promise(async resolve => {
    resolvePromise = resolve

    const { clientX: x, clientY: y } = e
    options.value = menuOptions

    // 1. 设置虚拟区域
    virtualRect.value = { left: x, right: x, top: y, bottom: y, width: 0, height: 0 }

    // 2. 打开菜单
    isOpen.value = true
    focusedIndex.value = -1

    // 3. 强制更新一次位置 (避免闪烁)
    await nextTick()
    throttledUpdatePosition()
  })
}

const close = () => {
  isOpen.value = false
  if (resolvePromise) {
    resolvePromise(null)
    resolvePromise = null
  }
}

// ==================== 事件处理 ====================
function handleSelect(option: SelectOption) {
  if (resolvePromise) {
    resolvePromise(option.value)
    resolvePromise = null
  }
  isOpen.value = false
}

const handleClickOutside = (e: MouseEvent) => {
  if (!isOpen.value) return
  const target = e.target as Node
  const dropdownEl = dropdownRef.value
  if (dropdownEl && !dropdownEl.contains(target)) {
    close()
  }
}

const handleGlobalKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value) return
  handleKeydown(e)
}

// ==================== 监听器优化 ====================
watch(isOpen, val => {
  if (val) {
    initFocusedIndex()
    setTimeout(() => {
      window.addEventListener('click', handleClickOutside)
      window.addEventListener('contextmenu', handleClickOutside)
      window.addEventListener('keydown', handleGlobalKeydown)
      window.addEventListener('scroll', close, { capture: true, passive: true })
      window.addEventListener('resize', close)
    }, 0)
  } else {
    window.removeEventListener('click', handleClickOutside)
    window.removeEventListener('contextmenu', handleClickOutside)
    window.removeEventListener('keydown', handleGlobalKeydown)
    window.removeEventListener('scroll', close, { capture: true } as EventListenerOptions)
    window.removeEventListener('resize', close)

    // [优化] 延迟清理数据，避免动画期间掉帧
    setTimeout(() => {
      resetCache()
      focusedIndex.value = -1
    }, 150)
  }
})

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside)
  window.removeEventListener('contextmenu', handleClickOutside)
  window.removeEventListener('keydown', handleGlobalKeydown)
  window.removeEventListener('scroll', close, { capture: true } as EventListenerOptions)
  window.removeEventListener('resize', close)
  throttledUpdatePosition.cancel()

  if (resolvePromise) {
    resolvePromise(null)
    resolvePromise = null
  }
})

defineExpose({ open, close })
</script>

<template>
  <Teleport to="body">
    <Transition name="context-menu">
      <SelectDropdown
        v-if="isOpen"
        ref="dropdownComponentRef"
        dropdown-id="global-context-menu"
        :class="[`placement-${currentPlacement}`]"
        :dropdown-style="dropdownStyle"
        :arrow-style="arrowStyle"
        :arrow-placement-class="arrowPlacementClass"
        :show-arrow="false"
        layout="list"
        :options="options"
        model-value=""
        :focused-index="focusedIndex"
        @select="handleSelect"
        @mouseenter="() => {}"
        @mouseleave="() => {}"
        @update:focused-index="focusedIndex = $event"
      />
    </Transition>
  </Teleport>
</template>

<style scoped>
:deep(.select-dropdown) {
  z-index: 99999 !important;
}

/* ==================== 动画优化 ==================== */

/* 入场：慢进 (Decelerate)，显得有质感 */
.context-menu-enter-active {
  transition:
    opacity 0.2s cubic-bezier(0.23, 1, 0.32, 1),
    transform 0.2s cubic-bezier(0.23, 1, 0.32, 1);
}

/* 离场：快出 (Accelerate)，消除卡顿感 */
.context-menu-leave-active {
  /* ease-in 会让透明度迅速下降 */
  transition:
    opacity 0.1s ease-in,
    transform 0.1s ease-in;
  /* 关键：立即禁用鼠标交互 */
  pointer-events: none;
}

.context-menu-enter-from,
.context-menu-leave-to {
  opacity: 0;
}

/* 根据方向设置动画起点 */
/* 底部弹出 (Bottom-Start/End)：从上方滑入 */
.placement-bottomLeft.context-menu-enter-from,
.placement-bottomRight.context-menu-enter-from,
.placement-bottomLeft.context-menu-leave-to,
.placement-bottomRight.context-menu-leave-to {
  transform: translateY(-8px) scale(0.96);
}

/* 顶部弹出 (Top-Start/End)：从下方滑入 */
.placement-topLeft.context-menu-enter-from,
.placement-topRight.context-menu-enter-from,
.placement-topLeft.context-menu-leave-to,
.placement-topRight.context-menu-leave-to {
  transform: translateY(8px) scale(0.96);
}
</style>
