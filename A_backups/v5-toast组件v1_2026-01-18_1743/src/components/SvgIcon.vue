<template>
  <component
    :is="activeIcon"
    v-if="activeIcon"
    class="svg-icon"
    :class="[`mode-${type || 'fill'}`]"
    :style="iconStyle"
    aria-hidden="true"
  />
  <span v-else-if="name" class="icon-placeholder" :style="iconStyle"></span>
</template>

<script setup lang="ts">
import { shallowRef, watch, computed, defineAsyncComponent } from 'vue'

const props = defineProps<{
  name: string | null
  size?: string | number
  color?: string
  /**
   * 图标渲染模式
   * - fill: (默认) 填充模式，适用于实心图标 (如 GitHub)
   * - stroke: 描边模式，适用于线性图标 (如 Tabler)
   * - original: 原始模式，保留图标原本的颜色 (如 Bilibili)
   */
  type?: 'fill' | 'stroke' | 'original'
}>()

// 使用 import.meta.glob 静态分析导入所有 SVG
// ?component 参数告诉 vite-svg-loader 将其转换为 Vue 组件
const icons = import.meta.glob('../assets/icons/*.svg', {
  query: '?component',
  import: 'default',
})

const activeIcon = shallowRef<ReturnType<typeof defineAsyncComponent> | null>(null)

watch(
  () => props.name,
  newName => {
    if (!newName) {
      activeIcon.value = null
      return
    }

    // 构造路径 key，注意必须与 glob 匹配的路径格式一致
    const path = `../assets/icons/${newName}.svg`
    const loader = icons[path]

    if (loader) {
      activeIcon.value = defineAsyncComponent({
        loader: loader as any,
      })
    } else {
      console.warn(`[SvgIcon] 图标未找到: ${newName} (路径: ${path})`)
      activeIcon.value = null
    }
  },
  { immediate: true }
)

const iconStyle = computed(() => {
  const s = typeof props.size === 'number' ? `${props.size}px` : props.size || '20px'
  return {
    width: s,
    height: s,
    color: props.type === 'original' ? undefined : props.color || 'currentColor',
    fontSize: s,
  }
})
</script>

<style scoped>
.svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  vertical-align: middle;
  flex-shrink: 0;
}

/* 默认模式 (fill) */
.svg-icon.mode-fill :deep(svg) {
  width: 100%;
  height: 100%;
  fill: currentColor;
  stroke: none;
}

/* 描边模式 (stroke) */
.svg-icon.mode-stroke :deep(svg) {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
}

/* 原始模式 (original) */
.svg-icon.mode-original :deep(svg) {
  width: 100%;
  height: 100%;
}

.icon-placeholder {
  display: inline-block;
  background-color: transparent;
}
</style>
