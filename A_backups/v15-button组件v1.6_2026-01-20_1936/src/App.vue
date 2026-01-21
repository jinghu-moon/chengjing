<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { IconSettings, IconBookmarks } from '@tabler/icons-vue'
import DynamicCalendarIcon from './components/DynamicCalendarIcon.vue'

import Background from './components/Background.vue'
import ClockWeather from './components/ClockWeather.vue'
import Pomodoro from './components/Pomodoro.vue'
import SearchBar from './components/SearchBar.vue'
import ShortcutGrid from './components/ShortcutGrid.vue'
import TodoList from './components/TodoList.vue'

import ToastProvider from './components/Toast/index.vue'
import { DialogProvider } from './components/Dialog'

const SettingsPanel = defineAsyncComponent(() => import('./components/SettingsPanel/index.vue'))
const CalendarPanel = defineAsyncComponent(() => import('./components/CalendarPanel/index.vue'))
const BookmarkPanel = defineAsyncComponent(() => import('./components/BookmarkPanel/index.vue'))
const NotePad = defineAsyncComponent(() => import('./components/NotePad/index.vue'))

import { useImageGC } from './composables/useImageGC'
import './styles/variables.css'

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
  <div class="app-wrapper">
    <Background :is-focus="isFocusMode" />

    <ToastProvider />
    <DialogProvider />

    <NotePad />
    <TodoList />

    <SettingsPanel
      v-if="isSettingsOpen"
      :is-open="isSettingsOpen"
      @close="isSettingsOpen = false"
    />

    <CalendarPanel
      v-if="isCalendarOpen"
      :is-open="isCalendarOpen"
      @close="isCalendarOpen = false"
    />

    <BookmarkPanel
      v-if="isBookmarkOpen"
      :is-open="isBookmarkOpen"
      @close="isBookmarkOpen = false"
    />

    <div class="top-actions" :class="{ hidden: isFocusMode }">
      <button class="icon-btn" title="日历" @click="isCalendarOpen = true">
        <DynamicCalendarIcon />
      </button>
      <button class="icon-btn" title="书签管理器" @click="isBookmarkOpen = true">
        <IconBookmarks size="20" />
      </button>
      <button class="icon-btn" title="设置" @click="isSettingsOpen = true">
        <IconSettings size="20" />
      </button>
    </div>

    <div class="container">
      <ClockWeather class="app-component" :class="{ dimmed: isFocusMode }" />

      <Pomodoro class="app-component" :class="{ dimmed: isFocusMode }" />

      <SearchBar @focus="handleFocus" @blur="handleBlur" />

      <ShortcutGrid class="app-component transition-all" :class="{ dimmed: isFocusMode }" />
    </div>

  </div>
</template>

<style scoped>
/* 保持原有的 container 样式 */
.container {
  position: relative;
  z-index: 1;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
  animation: fadeIn 0.8s var(--ease-elastic);
  padding: 0 20px;
}

/* ...原有的 .top-actions 等样式保持不变... */
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
  transition: all 0.2s;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.hidden {
  opacity: 0;
  pointer-events: none;
}

.app-component {
  transition:
    opacity 0.5s ease,
    filter 0.5s ease;
}

.dimmed {
  opacity: 0.3;
  filter: blur(2px);
  pointer-events: none;
}
</style>
