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

// [新增] 引入 Toast 组件和 Hook
import ToastProvider from './components/Toast/index.vue'
import { useToast } from './components/Toast/composables/useToast'

const SettingsPanel = defineAsyncComponent(() => import('./components/SettingsPanel/index.vue'))
const CalendarPanel = defineAsyncComponent(() => import('./components/CalendarPanel/index.vue'))
const BookmarkPanel = defineAsyncComponent(() => import('./components/BookmarkPanel/index.vue'))
const NotePad = defineAsyncComponent(() => import('./components/NotePad/index.vue'))

import { useImageGC } from './composables/useImageGC'
import './styles/variables.css'

const { scheduleImageGC } = useImageGC()
// [新增] 获取 Toast 实例
const toast = useToast()

onMounted(() => {
  scheduleImageGC()

  // [可选] 初始欢迎语，测试 Toast 是否工作
  // setTimeout(() => {
  //   toast.info('欢迎回来！Lime Tab 已就绪', { title: '系统消息' });
  // }, 1000);
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

// [新增] 测试撤回功能的方法
const testUndo = () => {
  toast.success('文件已移至回收站', {
    title: '删除成功',
    duration: 5000,
    action: {
      label: '撤回',
      onClick: () => {
        toast.info('操作已撤销')
      },
    },
  })
}

// [新增] 测试大量堆叠
const testStack = () => {
  let count = 0
  const timer = setInterval(() => {
    count++
    const types = ['info', 'success', 'warning', 'error'] as const
    const type = types[count % 4]
    toast[type](`堆叠测试消息 #${count}`)
    if (count >= 6) clearInterval(timer)
  }, 300)
}
</script>

<template>
  <div class="app-wrapper">
    <Background :is-focus="isFocusMode" />

    <ToastProvider />

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

    <div v-if="true" class="debug-toast-panel">
      <div class="debug-title">Toast 调试器</div>

      <div class="debug-row">
        <button @click="toast.success('保存成功')">Success</button>
        <button @click="toast.error('连接失败')">Error</button>
        <button @click="toast.warning('电量不足')">Warning</button>
        <button @click="toast.info('新版本可用')">Info</button>
      </div>

      <div class="debug-row">
        <button @click="toast.success('带标题的消息', { title: '操作完成' })">带标题</button>
        <button @click="testUndo">测试撤回</button>
        <button @click="testStack">测试堆叠</button>
      </div>

      <div class="debug-row positions">
        <button title="左上" @click="toast.setPosition('top-left')">↖</button>
        <button title="右上" @click="toast.setPosition('top-right')">↗</button>
        <button title="左下" @click="toast.setPosition('bottom-left')">↙</button>
        <button title="右下" @click="toast.setPosition('bottom-right')">↘</button>
      </div>
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

/* [新增] 调试面板样式 */
.debug-toast-panel {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: opacity 0.3s;
}

/* 鼠标移开变半透明，避免遮挡 */
.debug-toast-panel:hover {
  opacity: 1;
}

.debug-toast-panel:not(:hover) {
  opacity: 0.6;
}

.debug-title {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.debug-row {
  display: flex;
  gap: 8px;
}

.debug-row button {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.debug-row button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.debug-row button:active {
  transform: translateY(1px);
}

.debug-row.positions button {
  width: 30px;
  height: 30px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
</style>
