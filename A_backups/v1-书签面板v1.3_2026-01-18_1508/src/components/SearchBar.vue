<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, computed } from 'vue'
import {
  IconBrandGoogle,
  IconPaw,
  IconBrandBing,
  IconBrandBilibili,
  IconSearch,
} from '@tabler/icons-vue'
import { useSettings } from '../composables/useSettings'

const emit = defineEmits(['focus', 'blur'])

const { settings } = useSettings()

interface Engine {
  id: string
  name: string
  url: string
  icon: any
}
const engines = shallowRef<Engine[]>([
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=', icon: IconBrandGoogle },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=', icon: IconPaw },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=', icon: IconBrandBing },
  {
    id: 'bilibili',
    name: 'Bilibili',
    url: 'https://search.bilibili.com/all?keyword=',
    icon: IconBrandBilibili,
  },
])
const currentEngine = ref<Engine>(engines.value[0])
const searchQuery = ref('')
const isDropdownOpen = ref(false)
const searchContainerRef = ref<HTMLElement | null>(null)
const isAnimating = ref(false)

// 样式计算
const containerStyle = computed(() => ({
  width: `${settings.searchBarWidth}%`,
  height: `${settings.searchBarHeight}px`,
  borderRadius: `${settings.searchBarRadius}px`,
  backgroundColor: `rgba(255, 255, 255, ${settings.searchBarOpacity / 100})`,
}))

const triggerStyle = computed(() => {
  const size = Math.min(48, settings.searchBarHeight - 8)
  return {
    height: `${size}px`,
    width: `${size}px`,
    borderRadius: `${settings.searchBarRadius}px`,
  }
})

const selectEngine = (engine: Engine) => {
  currentEngine.value = engine
  isDropdownOpen.value = false
}

const performSearch = () => {
  if (!searchQuery.value.trim()) return
  const targetUrl = currentEngine.value.url + encodeURIComponent(searchQuery.value)

  if (settings.openNewTab) {
    window.open(targetUrl, '_blank')
  } else {
    window.location.href = targetUrl
  }
}

const handleSearchClick = () => {
  if (isAnimating.value) return
  isAnimating.value = true
  performSearch()
  setTimeout(() => {
    isAnimating.value = false
  }, 400)
}

const handleClickOutside = (e: MouseEvent) => {
  if (searchContainerRef.value && !searchContainerRef.value.contains(e.target as Node)) {
    isDropdownOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div class="search-wrapper">
    <div ref="searchContainerRef" class="search-container" :style="containerStyle">
      <div
        class="engine-trigger left"
        :style="triggerStyle"
        @click.stop="isDropdownOpen = !isDropdownOpen"
      >
        <component :is="currentEngine.icon" :size="24" :stroke-width="1.5" />
      </div>
      <div class="engine-dropdown" :class="{ open: isDropdownOpen }">
        <div
          v-for="engine in engines"
          :key="engine.id"
          class="dropdown-item"
          @click="selectEngine(engine)"
        >
          <component :is="engine.icon" :size="20" :stroke-width="1.5" /><span>{{
            engine.name
          }}</span>
        </div>
      </div>

      <input
        v-model="searchQuery"
        type="text"
        class="search-input"
        :class="{ 'no-icon': !settings.showSearchIcon }"
        placeholder="Search..."
        autocomplete="off"
        @keydown.enter="performSearch"
        @focus="emit('focus')"
        @blur="emit('blur')"
      />

      <div
        v-if="settings.showSearchIcon"
        class="engine-trigger right"
        :style="triggerStyle"
        @click="handleSearchClick"
      >
        <IconSearch :size="24" :stroke-width="1.5" :class="{ 'search-icon-active': isAnimating }" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-wrapper {
  position: relative;
  width: 100%;
  z-index: 1000;
  display: flex;
  justify-content: center;
}

.search-container {
  backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  box-shadow: var(--glass-shadow);
  display: flex;
  align-items: center;
  padding: 0 8px;
  transition: all 0.4s var(--ease-elastic);
  min-width: 200px;
}

@keyframes elegant-rotate-scale {
  0% {
    transform: scale(1) rotate(0deg);
  }

  30% {
    transform: scale(1.15) rotate(15deg);
  }

  60% {
    transform: scale(1.15) rotate(-5deg);
  }

  100% {
    transform: scale(1) rotate(0deg);
  }
}

.search-icon-active {
  transform-origin: center;
  animation: elegant-rotate-scale 0.4s ease-in-out forwards;
  color: #fff;
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.5));
}

.search-container:hover {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.engine-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.engine-trigger.left {
  margin-right: 4px;
}

.engine-trigger.right {
  margin-left: 4px;
}

.engine-trigger:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  transform: scale(1.05);
}

.engine-trigger:active {
  transform: scale(0.95);
}

.search-input {
  flex: 1;
  height: 100%;
  border: none;
  background: transparent;
  outline: none;
  font-size: 18px;
  color: #fff;
  padding: 0 8px;
  transition: padding 0.3s;
}

.search-input.no-icon {
  padding-right: 20px;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.engine-dropdown {
  position: absolute;
  top: 120%;
  left: 0;
  width: 160px;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
  visibility: hidden;
  transition: all 0.2s var(--ease-elastic);
  transform-origin: top left;
  z-index: 1001;
}

.engine-dropdown.open {
  opacity: 1;
  transform: translateY(0) scale(1);
  visibility: visible;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #fff;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
