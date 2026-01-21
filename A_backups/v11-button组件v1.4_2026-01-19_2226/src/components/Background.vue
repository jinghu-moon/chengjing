<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { getImageUrl } from '../utils/db'
import { useSettings } from '../composables/useSettings'

const props = defineProps<{ isFocus: boolean }>()

const { settings, wallpaperTrigger } = useSettings()

const wallpaperUrl = ref('')
const defaultWallpaper =
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
const bingDailyUrl = 'https://bing.img.run/1920x1080.php'

const loadWallpaper = async () => {
  if (settings.dailyWallpaper) {
    wallpaperUrl.value = `${bingDailyUrl}?t=${new Date().getDate()}`
  } else {
    try {
      const dbImage = await getImageUrl('custom-bg')
      if (dbImage) {
        wallpaperUrl.value = dbImage
      } else {
        const legacySaved = localStorage.getItem('custom-bg')
        wallpaperUrl.value = legacySaved || defaultWallpaper
      }
    } catch (e) {
      console.error('Failed to load wallpaper from DB', e)
      wallpaperUrl.value = defaultWallpaper
    }
  }
}

// 计算壁纸样式（处理模糊、缩放、变暗）
const bgStyle = computed(() => {
  const blurAmount = props.isFocus ? 30 : settings.wallpaperBlur || 0

  // 聚焦或模糊时稍微放大，防止边缘露白
  let scale = 1
  if (props.isFocus) scale = 1.1
  else if (blurAmount > 0) scale = 1.05

  // 聚焦模式下，背景本身变暗一点，配合遮罩效果更好
  const brightness = props.isFocus ? 0.8 : 1

  const filterParts = []
  if (blurAmount > 0) filterParts.push(`blur(${blurAmount}px)`)
  if (brightness < 1) filterParts.push(`brightness(${brightness})`)

  return {
    backgroundImage: `url(${wallpaperUrl.value})`,
    filter: filterParts.length > 0 ? filterParts.join(' ') : 'none',
    transform: `scale(${scale})`,
  }
})

// 计算遮罩样式
const maskStyle = computed(() => {
  // 聚焦模式时隐藏此遮罩，交由 App.vue 的聚焦层接管
  if (props.isFocus) return { opacity: 0 }

  // 将 0-100 的数值转换为 0-1 的透明度
  return { opacity: (settings.wallpaperMask || 0) / 100 }
})

onMounted(() => {
  loadWallpaper()
  watch(wallpaperTrigger, () => loadWallpaper())
})
</script>

<template>
  <div id="wallpaper" :style="bgStyle"></div>

  <div id="wallpaper-mask" :style="maskStyle"></div>
</template>

<style scoped>
#wallpaper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: -2;
  transition:
    filter 0.6s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  background-color: #333;
}

#wallpaper-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  z-index: -2;
  /* 层级同壁纸，但在DOM后，所以会盖在壁纸上 */
  pointer-events: none;
  /* 允许点击穿透 */
  transition: opacity 0.3s ease;
}
</style>
