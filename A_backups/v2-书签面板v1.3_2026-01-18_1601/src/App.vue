<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { IconSettings, IconBookmarks } from '@tabler/icons-vue'
import DynamicCalendarIcon from './components/DynamicCalendarIcon.vue'

import Background from './components/Background.vue'
import ClockWeather from './components/ClockWeather.vue'
import Pomodoro from './components/Pomodoro.vue'
import SearchBar from './components/SearchBar.vue'
import ShortcutGrid from './components/ShortcutGrid.vue'
import TodoList from './components/TodoList.vue'
import { defineAsyncComponent } from 'vue'

const SettingsPanel = defineAsyncComponent(() => import('./components/SettingsPanel/index.vue'))
const CalendarPanel = defineAsyncComponent(() => import('./components/CalendarPanel/index.vue'))
const BookmarkPanel = defineAsyncComponent(() => import('./components/BookmarkPanel/index.vue'))
const NotePad = defineAsyncComponent(() => import('./components/NotePad/index.vue'))
import { useSettings } from './composables/useSettings'
import { useImageGC } from './composables/useImageGC'
import './styles/variables.css'

const { settings } = useSettings()
const { scheduleImageGC } = useImageGC()

onMounted(() => {
  scheduleImageGC()
})

const isSettingsOpen = ref(false)
const isCalendarOpen = ref(false)
const isBookmarkOpen = ref(false)
const isFocusMode = ref(false)

const handleFocus = () => {
  isFocusMode.value = true
}

const handleBlur = () => {
  isFocusMode.value = false
}
</script>

<template>
  <Background :is-focus="isFocusMode" />
  <div class="focus-overlay" :class="{ open: isFocusMode }" @click="handleBlur"></div>
  <TodoList class="app-component" :class="{ dimmed: isFocusMode }" />
  <ClockWeather class="app-component transition-all" :class="{ dimmed: isFocusMode }" />
  <Pomodoro class="app-component transition-all" :class="{ dimmed: isFocusMode }" />
  <SettingsPanel v-model:is-open="isSettingsOpen" :class="{ dimmed: isFocusMode }" />
  <CalendarPanel v-model:is-open="isCalendarOpen" />
  <BookmarkPanel v-model:is-open="isBookmarkOpen" />
  <NotePad :class="{ dimmed: isFocusMode }" />

  <div class="top-actions" :class="{ dimmed: isFocusMode }">
    <div class="icon-btn" title="书签" @click="isBookmarkOpen = true">
      <IconBookmarks :size="24" />
    </div>
    <div class="icon-btn" title="日历" @click="isCalendarOpen = true">
      <DynamicCalendarIcon :size="24" />
    </div>
    <div class="icon-btn" title="设置" @click="isSettingsOpen = true">
      <IconSettings :size="24" />
    </div>
  </div>

  <div class="container">
    <SearchBar v-if="settings.showSearchBar" @focus="handleFocus" @blur="handleBlur" />

    <ShortcutGrid class="app-component transition-all" :class="{ dimmed: isFocusMode }" />
  </div>
</template>

<style scoped>
.container {
  position: relative;
  z-index: 1;
  /* [修改] 强制宽度占满屏幕，解除之前 900px 的限制 */
  width: 100vw;
  /* max-width: 900px; <--- 已删除 */

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
  animation: fadeIn 0.8s var(--ease-elastic);

  /* [新增] 防止搜索框或网格太宽时贴到屏幕边缘 */
  padding: 0 20px;
}

.top-actions {
  position: absolute;
  top: 24px;
  right: 28px;
  z-index: 30;
  transition: opacity 0.3s;
  display: flex;
  gap: 12px;
}

.icon-btn {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.app-component {
  transition:
    opacity 0.3s ease,
    pointer-events 0.3s ease;
}

/* 不再隐藏，只是降低不透明度和禁用交互 */
.dimmed {
  opacity: 0.3;
  pointer-events: none;
}

/* 聚焦模式遮罩 - 参考 SettingsPanel 的做法 */
.focus-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  z-index: 80;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.3s ease,
    backdrop-filter 0.3s ease;
}

.focus-overlay.open {
  opacity: 1;
  pointer-events: auto;
}
</style>
