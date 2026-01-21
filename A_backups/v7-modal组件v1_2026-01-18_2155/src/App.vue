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
import { DialogProvider, useDialog } from './components/Dialog'

const SettingsPanel = defineAsyncComponent(() => import('./components/SettingsPanel/index.vue'))
const CalendarPanel = defineAsyncComponent(() => import('./components/CalendarPanel/index.vue'))
const BookmarkPanel = defineAsyncComponent(() => import('./components/BookmarkPanel/index.vue'))
const NotePad = defineAsyncComponent(() => import('./components/NotePad/index.vue'))

import { useImageGC } from './composables/useImageGC'
import './styles/variables.css'

const { scheduleImageGC } = useImageGC()
// [新增] 获取 Toast 实例
const toast = useToast()
const dialog = useDialog()

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

// ==================== Promise 状态跟踪示例 ====================

// 模拟导出配置文件（成功）
const testExportConfig = async () => {
  await toast.promise(
    // 模拟异步操作：2秒后成功
    new Promise(resolve => setTimeout(resolve, 2000)),
    {
      loading: '正在导出配置文件...',
      success: '配置文件导出成功！',
      error: '导出失败，请重试',
    }
  )
}

// 模拟保存数据（成功）
const testSaveData = async () => {
  await toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
    loading: '保存中...',
    success: '数据保存成功',
    error: '保存失败',
  })
}

// 模拟上传文件（失败）
const testUploadFail = async () => {
  try {
    await toast.promise(
      // 模拟异步操作：1.5秒后失败
      new Promise((_, reject) => setTimeout(() => reject(new Error('网络错误')), 1500)),
      {
        loading: '上传中...',
        success: '上传完成',
        error: '上传失败，请检查网络',
      }
    )
  } catch (error) {
    // Promise 会抛出错误，可以在这里处理
    console.error('上传失败:', error)
  }
}

// 模拟随机成功/失败
const testRandom = async () => {
  const willSucceed = Math.random() > 0.5

  try {
    await toast.promise(
      new Promise((resolve, reject) => {
        setTimeout(() => {
          willSucceed ? resolve('成功') : reject(new Error('失败'))
        }, 1500)
      }),
      {
        loading: '处理中...',
        success: '操作成功',
        error: '操作失败',
      }
    )
  } catch (error) {
    // 处理失败情况
  }
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

      <!-- Dialog 调试 -->
      <div class="debug-separator"></div>
      <div class="debug-subtitle">Dialog 调试</div>
      <div class="debug-row">
        <button
          @click="
            ($event: MouseEvent) => {
              console.log('👆 Click Center', { x: $event.clientX, y: $event.clientY })
              dialog.info({
                title: '普通对话框',
                content: '这是一个居中的模态对话框',
                mousePosition: { x: $event.clientX, y: $event.clientY },
              })
            }
          "
        >
          Center
        </button>
        <button
          @click="
            ($event: MouseEvent) => {
              console.log('👆 Click Top', { x: $event.clientX, y: $event.clientY })
              dialog.confirm({
                title: 'Top Dialog',
                content: '顶部布局',
                layout: 'top',
                mousePosition: { x: $event.clientX, y: $event.clientY },
              })
            }
          "
        >
          Top
        </button>
        <button
          @click="
            ($event: MouseEvent) =>
              dialog.info({
                title: 'Bottom Dialog',
                content: '底部布局',
                layout: 'bottom',
                mousePosition: { x: $event.clientX, y: $event.clientY },
              })
          "
        >
          Bottom
        </button>
        <button
          @click="
            $event =>
              dialog.confirm({
                title: 'Follow Trigger',
                content: '跟随点击位置 (Popconfirm)',
                triggerRect: ($event.currentTarget as HTMLElement).getBoundingClientRect(),
                type: 'warning',
              })
          "
        >
          Follow Me
        </button>
      </div>

      <!-- Promise 状态跟踪示例 -->
      <div class="debug-separator"></div>
      <div class="debug-subtitle">Promise 状态跟踪</div>

      <div class="debug-row">
        <button @click="testExportConfig">导出配置</button>
        <button @click="testSaveData">保存数据</button>
      </div>

      <div class="debug-row">
        <button @click="testUploadFail">上传失败</button>
        <button @click="testRandom">随机结果</button>
      </div>

      <!-- 关闭按钮位置示例 -->
      <div class="debug-separator"></div>
      <div class="debug-subtitle">关闭按钮位置</div>

      <div class="debug-row">
        <button @click="toast.success('无按钮', { closeButtonPosition: 'center-right' })">
          居中
        </button>
        <button @click="toast.success('有按钮', { action: { label: '撤回', onClick: () => {} } })">
          自动上
        </button>
      </div>

      <!-- Toast 位置选择 -->
      <div class="debug-separator"></div>
      <div class="debug-subtitle">Toast 位置</div>

      <div class="debug-row positions-grid">
        <button title="左上" @click="toast.setPosition('top-left')">↖</button>
        <button title="上中" @click="toast.setPosition('top-center')">↑</button>
        <button title="右上" @click="toast.setPosition('top-right')">↗</button>
        <button title="左中" @click="toast.setPosition('left-center')">←</button>
        <div class="grid-empty"></div>
        <button title="右中" @click="toast.setPosition('right-center')">→</button>
        <button title="左下" @click="toast.setPosition('bottom-left')">↙</button>
        <button title="下中" @click="toast.setPosition('bottom-center')">↓</button>
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

.debug-separator {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 4px 0;
}

.debug-subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
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

.debug-row.positions-grid {
  display: grid;
  grid-template-columns: repeat(3, 30px);
  grid-template-rows: repeat(3, 30px);
  gap: 6px;
}

.debug-row.positions-grid button {
  width: 30px;
  height: 30px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.debug-row.positions-grid .grid-empty {
  width: 30px;
  height: 30px;
}
</style>
