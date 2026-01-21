<script setup lang="ts">
import { ref, computed, onUnmounted, watch, onMounted } from 'vue'
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconRefresh,
  IconFocus2,
  IconX,
  IconSettings,
  IconTrophy,
  IconEdit,
  IconListCheck,
} from '@tabler/icons-vue'
import { useSettings } from '../composables/useSettings'
import SettingSlider from './SettingsPanel/components/SettingSlider.vue'
import SettingSwitch from './SettingsPanel/components/SettingSwitch.vue'

const { settings } = useSettings()

// --- 基础配置计算 ---
const workTimeSeconds = computed(() => settings.pomodoroWorkMinutes * 60)
const breakTimeSeconds = computed(() => settings.pomodoroBreakMinutes * 60)
const originalTitle = document.title

// --- 状态管理 ---
const isExpanded = ref(false)
const timeLeft = ref(workTimeSeconds.value)
const isRunning = ref(false)
const isWorkMode = ref(true)
const isSettingsVisible = ref(false)
const dailyCount = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

// --- 待办事项联动逻辑 ---
interface TodoItem {
  id: number
  text: string
  done: boolean
}
const todoList = ref<TodoItem[]>([])
const isTodoMenuOpen = ref(false)

const loadTodos = () => {
  try {
    const saved = localStorage.getItem('todos')
    if (saved) {
      const allTodos = JSON.parse(saved) as TodoItem[]
      // 只获取未完成的任务
      todoList.value = allTodos.filter(t => !t.done)
    } else {
      todoList.value = []
    }
  } catch (e) {
    console.error('Failed to load todos', e)
    todoList.value = []
  }
}

const selectTodo = (text: string) => {
  settings.pomodoroIntent = text // 自动填入专注目标
  isTodoMenuOpen.value = false // 关闭菜单
}

// 切换待办菜单（互斥逻辑：打开待办时关闭设置）
const toggleTodoMenu = () => {
  if (!isTodoMenuOpen.value) {
    loadTodos()
    isSettingsVisible.value = false
  }
  isTodoMenuOpen.value = !isTodoMenuOpen.value
}

// 切换设置菜单（互斥逻辑：打开设置时关闭待办）
const toggleSettings = () => {
  if (!isSettingsVisible.value) {
    isTodoMenuOpen.value = false
  }
  isSettingsVisible.value = !isSettingsVisible.value
}

// --- 刻度盘逻辑 ---
const totalTicks = 60
const ticks = Array.from({ length: totalTicks })

// 计算当前激活的刻度数量
const activeTickCount = computed(() => {
  const total = isWorkMode.value ? workTimeSeconds.value : breakTimeSeconds.value
  if (total === 0) return 0
  const ratio = (total - timeLeft.value) / total
  return Math.floor(ratio * totalTicks)
})

// 计算刻度旋转角度
const getTickTransform = (index: number) => {
  const degree = (index / totalTicks) * 360
  return `rotate(${degree} 150 150)`
}

// --- 每日统计逻辑 ---
const STATS_KEY = 'lime-pomodoro-stats'

const loadStats = () => {
  const saved = localStorage.getItem(STATS_KEY)
  const todayStr = new Date().toDateString()
  if (saved) {
    const { date, count } = JSON.parse(saved)
    if (date === todayStr) {
      dailyCount.value = count
    } else {
      // 新的一天重置
      dailyCount.value = 0
      saveStats(0)
    }
  } else {
    saveStats(0)
  }
}

const saveStats = (count: number) => {
  localStorage.setItem(STATS_KEY, JSON.stringify({ date: new Date().toDateString(), count }))
}

const incrementStats = () => {
  dailyCount.value++
  saveStats(dailyCount.value)
}

// --- 监听设置变化 ---
watch([() => settings.pomodoroWorkMinutes, () => settings.pomodoroBreakMinutes], () => {
  // 如果未运行，实时更新显示的时间
  if (!isRunning.value) {
    timeLeft.value = isWorkMode.value ? workTimeSeconds.value : breakTimeSeconds.value
  }
})

// --- 辅助函数 ---
const formattedTime = computed(() => {
  const m = Math.floor(timeLeft.value / 60)
    .toString()
    .padStart(2, '0')
  const s = (timeLeft.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const progress = computed(() => {
  const total = isWorkMode.value ? workTimeSeconds.value : breakTimeSeconds.value
  if (total === 0) return 0
  return ((total - timeLeft.value) / total) * 100
})

const updateDocTitle = () => {
  if (isRunning.value) {
    const icon = isWorkMode.value ? '🔥' : '☕'
    const intent = settings.pomodoroIntent ? `[${settings.pomodoroIntent}] ` : ''
    document.title = `${icon} ${intent}${formattedTime.value} - Lime Tab`
  } else {
    document.title = originalTitle
  }
}

// --- 计时器控制 ---
const toggleTimer = () => {
  isRunning.value ? pause() : start()
}

const start = () => {
  if (timer) return
  // 开始时收起所有面板
  isSettingsVisible.value = false
  isTodoMenuOpen.value = false

  isRunning.value = true
  updateDocTitle()

  timer = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
      updateDocTitle()
    } else {
      // 时间到
      pause()

      // 1. 发送通知并统计
      if (isWorkMode.value) {
        incrementStats()
        new Notification('Lime Tab', { body: '专注完成！☕ 该休息了' })
      } else {
        new Notification('Lime Tab', { body: '休息结束！🔥 准备开始工作' })
      }

      // 2. 自动流转逻辑
      if (isWorkMode.value && settings.pomodoroAutoBreak) {
        switchMode(true) // 自动开始休息
      } else if (!isWorkMode.value && settings.pomodoroAutoWork) {
        switchMode(true) // 自动开始下一轮专注
      } else {
        switchMode(false) // 仅切换模式，暂停
      }
    }
  }, 1000)
}

const pause = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  isRunning.value = false
  document.title = originalTitle
}

const reset = () => {
  pause()
  timeLeft.value = isWorkMode.value ? workTimeSeconds.value : breakTimeSeconds.value
  document.title = originalTitle
}

const switchMode = (autoStart = false) => {
  pause()
  isWorkMode.value = !isWorkMode.value
  timeLeft.value = isWorkMode.value ? workTimeSeconds.value : breakTimeSeconds.value
  document.title = originalTitle
  if (autoStart) start()
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  if (!isExpanded.value) document.title = originalTitle
  // 每次进入全屏刷新待办
  if (isExpanded.value) loadTodos()
}

// --- 生命周期 ---
onMounted(() => {
  loadStats()
  loadTodos()
  if (Notification.permission !== 'granted') Notification.requestPermission()
  // 点击外部关闭所有浮窗
  document.addEventListener('click', () => {
    isTodoMenuOpen.value = false
    isSettingsVisible.value = false
  })
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  document.title = originalTitle
})
</script>

<template>
  <div class="pomodoro-wrapper">
    <transition name="fade">
      <div v-if="!isExpanded" class="mini-trigger" title="进入专注模式" @click="toggleExpand">
        <IconFocus2 :size="22" stroke-width="1.5" />
        <span v-if="isRunning" class="mini-time">{{ formattedTime }}</span>
      </div>
    </transition>

    <transition name="zoom">
      <div v-if="isExpanded" class="fullscreen-overlay">
        <div class="bg-progress-line" :style="{ width: progress + '%' }"></div>

        <div class="top-bar">
          <div class="daily-stats">
            <IconTrophy :size="20" stroke-width="1.5" color="#FFD700" />
            <span>Today: {{ dailyCount }}</span>
          </div>
          <div class="close-btn" @click="toggleExpand">
            <IconX :size="32" />
          </div>
        </div>

        <div class="center-content">
          <div class="dial-container">
            <svg class="dial-svg" viewBox="0 0 300 300">
              <g class="ticks">
                <line
                  v-for="(_t, index) in ticks"
                  :key="index"
                  x1="150"
                  y1="10"
                  :x2="150"
                  :y2="index % 5 === 0 ? 17 : 15"
                  :stroke-width="2"
                  :transform="getTickTransform(index)"
                  class="tick-mark"
                  :class="{ active: index < activeTickCount }"
                />
              </g>
            </svg>

            <div class="dial-inner">
              <div class="intent-box" @click.stop>
                <div v-if="isWorkMode" class="input-container">
                  <div class="input-wrapper" :title="settings.pomodoroIntent">
                    <input
                      v-model="settings.pomodoroIntent"
                      type="text"
                      class="intent-input"
                      placeholder="当下要做什么？"
                      maxlength="50"
                    />
                    <IconEdit v-if="!settings.pomodoroIntent" :size="14" class="input-icon" />
                  </div>
                </div>
                <div v-else class="break-tip">☕ 休息一下，放松大脑</div>
              </div>

              <div class="big-timer">{{ formattedTime }}</div>

              <div class="main-control">
                <button class="action-btn" @click="toggleTimer">
                  <IconPlayerPause v-if="isRunning" :size="40" fill="currentColor" />
                  <IconPlayerPlay v-else :size="40" fill="currentColor" class="offset-play" />
                </button>
              </div>

              <div class="sub-actions">
                <button class="icon-btn small" title="重置" @click="reset">
                  <IconRefresh :size="20" />
                </button>

                <button
                  class="icon-btn small"
                  :class="{ active: isTodoMenuOpen }"
                  title="从待办中选择"
                  @click.stop="toggleTodoMenu"
                >
                  <IconListCheck :size="20" />
                </button>

                <button
                  class="icon-btn small"
                  :class="{ active: isSettingsVisible }"
                  title="调整设置"
                  @click.stop="toggleSettings"
                >
                  <IconSettings :size="20" />
                </button>

                <button class="text-btn small" @click="() => switchMode(false)">
                  {{ isWorkMode ? '休息' : '工作' }}
                </button>

                <transition name="slide-down">
                  <div v-if="isTodoMenuOpen" class="todo-menu" @click.stop>
                    <div class="menu-header">选择未完成任务</div>
                    <div v-if="todoList.length > 0" class="menu-list">
                      <div
                        v-for="todo in todoList"
                        :key="todo.id"
                        class="menu-item"
                        @click="selectTodo(todo.text)"
                      >
                        {{ todo.text }}
                      </div>
                    </div>
                    <div v-else class="menu-empty">暂无待办事项</div>
                    <div class="settings-close" @click="isTodoMenuOpen = false">
                      <IconX :size="16" />
                    </div>
                  </div>
                </transition>

                <transition name="slide-down">
                  <div v-if="isSettingsVisible" class="inner-settings-panel" @click.stop>
                    <div class="settings-content">
                      <div class="switch-row">
                        <SettingSwitch
                          v-model="settings.pomodoroAutoBreak"
                          label="自动休息"
                          size="sm"
                        />
                        <SettingSwitch
                          v-model="settings.pomodoroAutoWork"
                          label="自动循环"
                          size="sm"
                        />
                      </div>
                      <div class="divider"></div>
                      <SettingSlider
                        v-model="settings.pomodoroWorkMinutes"
                        label="专注"
                        :min="1"
                        :max="60"
                        unit="min"
                      />
                      <div class="spacer"></div>
                      <SettingSlider
                        v-model="settings.pomodoroBreakMinutes"
                        label="休息"
                        :min="1"
                        :max="30"
                        unit="min"
                      />
                    </div>
                    <div class="settings-close" @click="isSettingsVisible = false">
                      <IconX :size="16" />
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* --- 基础与入口样式 --- */
.pomodoro-wrapper {
  position: absolute;
  top: 130px;
  left: 28px;
  z-index: 50;
}

.mini-trigger {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  height: 40px;
  padding: 0 16px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  color: #fff;
  box-shadow: 0 4px 12px #61afef;
}

.mini-trigger:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.mini-time {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
}

/* --- 全屏覆盖层 --- */
.fullscreen-overlay {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(40px);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  overflow: hidden;
}

/* 底部进度线 */
.bg-progress-line {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  width: 0%;
  background: #007aff;
  box-shadow: 0 0 10px rgba(0, 122, 255, 0.5);
  transition: width 1s linear;
  pointer-events: none;
  z-index: 10;
}

/* 顶部栏 */
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100px;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
  z-index: 20;
}

.daily-stats {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 1px;
}

.close-btn {
  pointer-events: auto;
  cursor: pointer;
  opacity: 0.6;
  transition: 0.2s;
  padding: 10px;
}

.close-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* --- 核心刻度盘 (响应式) --- */
.center-content {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.dial-container {
  position: relative;
  width: 70vmin;
  height: 70vmin;
  max-width: 800px;
  max-height: 800px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.dial-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 刻度样式 */
.tick-mark {
  stroke: rgba(255, 255, 255, 0.15);
  stroke-linecap: round;
  transition: stroke 0.3s ease;
}

.tick-mark.active {
  stroke: #007aff;
  filter: drop-shadow(0 0 4px rgba(0, 122, 255, 0.6));
}

/* 内部内容布局 */
.dial-inner {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4%;
  width: 70%;
  height: 100%;
  justify-content: center;
}

/* 专注目标输入 */
.intent-box {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 30;
  padding: 0 40px;
}

.input-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.2s;
  flex: 1;
  min-width: 0;
  justify-content: center;
}

.input-wrapper:hover {
  opacity: 1;
}

.intent-input {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 24px;
  font-weight: 500;
  text-align: center;
  width: 300px;
  max-width: 50vw;
  outline: none;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  font-family: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.intent-input:focus {
  text-overflow: clip;
}

.intent-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
  font-weight: 400;
  text-align: center;
}

.input-icon {
  color: rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.break-tip {
  font-size: 18px;
  color: #4ecdc4;
  font-weight: 500;
  letter-spacing: 1px;
}

/* 时间显示 */
.big-timer {
  font-size: 14vmin;
  font-size: clamp(60px, 14vmin, 160px);
  font-weight: 500;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -2px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.main-control {
  margin-top: 2%;
}

.action-btn {
  width: 11vmin;
  height: 11vmin;
  min-width: 64px;
  min-height: 64px;
  max-width: 96px;
  max-height: 96px;
  border-radius: 50%;
  background: #fff;
  color: #000;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 10px 30px rgba(255, 255, 255, 0.2);
}

.action-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
}

.action-btn:active {
  transform: scale(0.95);
}

.offset-play {
  margin-left: 4px;
}

/* 底部按钮组 */
.sub-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 4%;
  position: relative;
  justify-content: center;
}

.icon-btn.small {
  width: 42px;
  height: 42px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s;
}

.icon-btn.small:hover,
.icon-btn.small.active {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
}

.text-btn.small {
  height: 42px;
  padding: 0 20px;
  border-radius: 21px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
}

.text-btn.small:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
}

/* --- 嵌入式设置面板 --- */
.inner-settings-panel {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 10px;
  width: 380px;
  background: rgba(40, 40, 40, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  padding: 48px 24px 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  z-index: 100;
  white-space: nowrap;
}

/* --- 待办菜单 --- */
.todo-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 10px;
  width: 280px;
  background: rgba(40, 40, 40, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 6px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-header {
  padding: 8px 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 600;
  text-align: left;
  border-bottom: none;
  margin-bottom: 2px;
  margin-left: 4px;
}

.menu-list {
  max-height: 220px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
}

.menu-list::-webkit-scrollbar {
  width: 4px;
}

.menu-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.menu-item {
  padding: 10px 12px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
  border-radius: 8px;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.15);
}

.menu-empty {
  padding: 20px;
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.settings-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.6);
  z-index: 10;
}

.settings-close:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.switch-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.spacer {
  height: 12px;
}

/* 动画 */
.zoom-enter-active,
.zoom-leave-active {
  transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
}

.zoom-enter-from,
.zoom-leave-to {
  opacity: 0;
  transform: scale(0.95);
  backdrop-filter: blur(0);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translate(-50%, -10px);
}
</style>
