<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { IconSettings, IconBookmarks, IconDatabase, IconSun, IconMoon } from '@tabler/icons-vue'
import DynamicCalendarIcon from './components/DynamicCalendarIcon.vue'

import Background from './components/Background.vue'
import ClockWeather from './components/ClockWeather.vue'
import Pomodoro from './components/Pomodoro.vue'
import SearchBar from './components/SearchBar.vue'
import ShortcutGrid from './components/ShortcutGrid'
import TodoList from './components/TodoList.vue'

import ToastProvider from './components/Toast/index.vue'
import { DialogProvider } from './components/Dialog'

const SettingsPanel = defineAsyncComponent(() => import('./components/SettingsPanel/index.vue'))
const CalendarPanel = defineAsyncComponent(() => import('./components/CalendarPanel/index.vue'))
const BookmarkPanel = defineAsyncComponent(() => import('./components/BookmarkPanel/index.vue'))
const NotePad = defineAsyncComponent(() => import('./components/NotePad/index.vue'))
const Calculator = defineAsyncComponent(() => import('./components/Calculator.vue'))
const DailyPoem = defineAsyncComponent(() => import('./components/DailyPoem/index.vue'))
const DataBackupPanel = defineAsyncComponent(() => import('./components/DataBackupPanel/index.vue'))

import { useImageGC } from './composables/useImageGC'
import { useSettings } from './composables/useSettings'
import { useTheme } from './composables/useTheme'
import './styles/variables.css'

const { settings } = useSettings()
const { isDark, toggleTheme } = useTheme()
const { scheduleImageGC } = useImageGC()

onMounted(() => {
  scheduleImageGC()
})

const isSettingsOpen = ref(false)
const isCalendarOpen = ref(false)
const isBookmarkOpen = ref(false)
const isDataBackupOpen = ref(false)
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
    <DailyPoem v-if="settings.poemShow" />

    <SettingsPanel v-model:open="isSettingsOpen" />

    <CalendarPanel
      :is-open="isCalendarOpen"
      @update:is-open="isCalendarOpen = $event"
    />

    <BookmarkPanel v-model:open="isBookmarkOpen" />

    <DataBackupPanel v-model:open="isDataBackupOpen" />

    <div class="top-actions" :class="{ hidden: isFocusMode }">
      <button class="icon-btn" title="日历" @click="isCalendarOpen = true">
        <DynamicCalendarIcon />
      </button>
      
      <button class="icon-btn" title="书签管理器" @click="isBookmarkOpen = true">
        <IconBookmarks size="20" />
      </button>

      <button class="icon-btn" title="数据管理" @click="isDataBackupOpen = true">
        <IconDatabase size="20" />
      </button>

      <button class="icon-btn" :title="isDark ? '切换到浅色模式' : '切换到深色模式'" @click="toggleTheme">
        <Transition name="theme-icon" mode="out-in">
          <IconMoon v-if="isDark" :size="20" :key="'moon'" />
          <IconSun v-else :size="20" :key="'sun'" />
        </Transition>
      </button>

      <button class="icon-btn" title="设置" @click="isSettingsOpen = true">
        <IconSettings size="20" />
      </button>
      
    </div>

    <div
      class="container"
      :style="{
        paddingTop: settings.layoutPaddingTop + 'vh',
        gap: settings.layoutGap + 'px',
      }"
    >
      <ClockWeather class="app-component" :class="{ dimmed: isFocusMode }" @open-calendar="isCalendarOpen = true" />

      <Pomodoro class="app-component" :class="{ dimmed: isFocusMode }" />

      <Calculator v-if="settings.calculatorShow" class="app-component" :class="{ dimmed: isFocusMode }" />

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
  min-height: 100vh; /* 确保高度 */
  display: flex;
  flex-direction: column;
  align-items: center;
  align-items: center;
  /* gap: 48px; replaced by inline style */
  animation: fadeIn 0.8s var(--ease-elastic);
  padding: 0 20px 0; /* padding-top replaced by inline style */
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

/* 主题图标切换动画 */
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: all 0.2s var(--ease-smooth);
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}
</style>
