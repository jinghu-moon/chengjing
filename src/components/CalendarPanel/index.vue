<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { IconChevronUp, IconChevronDown, IconCalendarEvent, IconX } from '@tabler/icons-vue'
import { useCalendarPanelState } from './composables/useCalendarPanelState'
import YearView from './views/YearView.vue'
import MonthView from './views/MonthView.vue'
import WeekView from './views/WeekView.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['update:isOpen'])

// Global State
const state = useCalendarPanelState()
const { currentView, currentYear, handleYearNav, yearScrollDirection, goToToday, switchView } =
  state

// View Transition Logic
const transitionName = ref('zoom-in')
const zoomOrigin = ref('50% 50%')
const viewOrder = { year: 0, month: 1, week: 2 }
const YEAR_GRID_COLUMNS = 4

// 视图切换动画逻辑
watch(currentView, (newView, oldView) => {
  const newIndex = viewOrder[newView]
  const oldIndex = viewOrder[oldView]

  if (newIndex > oldIndex) {
    transitionName.value = 'zoom-in'
  } else {
    transitionName.value = 'zoom-out'
    if (newView === 'year' && oldView === 'month') {
      // Calculate origin for zoom out to year
      // This is an estimation. For precise zoom out, logic needs
      // the date info that was last active in month view.
      // But we can keep the simplistic math based on current month.
      const m = state.calendar.viewDate.value.month()
      const col = m % YEAR_GRID_COLUMNS
      const row = Math.floor(m / YEAR_GRID_COLUMNS)
      const x = (col * 25 + 12.5).toFixed(2)
      const y = (row * 33.33 + 16.66).toFixed(2)
      zoomOrigin.value = `${x}% ${y}%`
    }
  }
})

// View Glider helper
const viewBtnsRef = ref<HTMLElement[]>([])
const gliderStyle = ref({ width: '0px', transform: 'translateX(0px)', opacity: 0 })

const updateGlider = async () => {
  await nextTick()
  if (!viewBtnsRef.value || viewBtnsRef.value.length === 0) return
  const views = ['year', 'month', 'week']
  const activeIndex = views.indexOf(currentView.value)
  const activeBtn = viewBtnsRef.value[activeIndex]
  if (activeBtn) {
    gliderStyle.value = {
      width: `${activeBtn.offsetWidth}px`,
      transform: `translateX(${activeBtn.offsetLeft}px)`,
      opacity: 1,
    }
  }
}

watch([currentView, () => props.isOpen], () => {
  if (props.isOpen) setTimeout(updateGlider, 50)
})

// Calculate Zoom Origin from child events
const calculateZoomOrigin = (target: EventTarget | null) => {
  if (!target || !(target instanceof HTMLElement)) return '50% 50%'
  const containerSelector = '.main-view'
  const container = target.closest(containerSelector)
  if (!container) return '50% 50%'

  const rect = target.getBoundingClientRect()
  const cRect = container.getBoundingClientRect()
  const x = ((rect.left + rect.width / 2 - cRect.left) / cRect.width) * 100
  const y = ((rect.top + rect.height / 2 - cRect.top) / cRect.height) * 100
  return `${x.toFixed(2)}% ${y.toFixed(2)}%`
}

// Handlers
const onSelectMonth = ({ month, target }: { month: number; target: EventTarget | null }) => {
  zoomOrigin.value = calculateZoomOrigin(target)
  state.calendar.viewDate.value = state.calendar.viewDate.value.month(month)
  switchView('month')
  nextTick(updateGlider)
}
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="calendar-overlay" @click.self="emit('update:isOpen', false)">
      <div class="calendar-container">
        <button class="close-btn" @click="emit('update:isOpen', false)">
          <IconX size="24" />
        </button>

        <!-- Header Section -->
        <div class="header-section">
          <div class="year-info">
            <div
              class="year-title-wrapper"
              @wheel.prevent="currentView === 'year' && handleYearNav(yearScrollDirection)"
            >
              <div class="year-text-container">
                <Transition
                  :name="yearScrollDirection === 'down' ? 'year-scroll-up' : 'year-scroll-down'"
                >
                  <h1 :key="currentYear" class="year-title">{{ currentYear }}年</h1>
                </Transition>
              </div>
              <div v-if="currentView === 'year'" class="year-nav-buttons">
                <button class="icon-btn nav-btn-small" @click="handleYearNav('up')">
                  <IconChevronUp :size="18" />
                </button>
                <button class="icon-btn nav-btn-small" @click="handleYearNav('down')">
                  <IconChevronDown :size="18" />
                </button>
              </div>
            </div>
          </div>

          <div class="controls-right">
            <button class="action-btn" title="回到今天" @click="goToToday">
              <IconCalendarEvent :size="20" />
            </button>
            <div class="view-controls">
              <div class="view-glider" :style="gliderStyle"></div>
              <button
                v-for="view in ['year', 'month', 'week']"
                :key="view"
                ref="viewBtnsRef"
                :class="['view-btn', { active: currentView === view }]"
                @click="switchView(view as any)"
              >
                {{ view === 'year' ? '年' : view === 'month' ? '月' : '周' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Main View Area (Transition Wrapper) -->
        <div class="main-view" :style="{ '--zoom-origin': zoomOrigin }">
          <Transition :name="transitionName">
            <YearView v-if="currentView === 'year'" key="year" @select-month="onSelectMonth" />
            <MonthView v-else-if="currentView === 'month'" key="month" />
            <WeekView v-else key="week" />
          </Transition>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@import url('./styles/common.css');

.calendar-container {
  --zoom-speed: 0.5s;
  --zoom-curve: cubic-bezier(0.4, 0, 0.2, 1);
}

.calendar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--mask-dark);
  backdrop-filter: var(--glass-md);
  z-index: var(--z-modal);
  display: flex;
  justify-content: center;
  align-items: center;
}

.calendar-container {
  position: relative;
  width: 900px;
  height: 85vh;
  background: var(--bg-panel);
  border: var(--border-glass);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 20px;
  transition: all var(--zoom-speed) var(--zoom-curve);
  display: flex;
  flex-direction: column;
  color: var(--text-primary);
  font-family: var(--font-family-base);
}

.close-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  transform: rotate(90deg);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-right: 40px;
}

.year-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  position: relative;
}

.year-text-container {
  position: relative;
  width: 155px;
  height: 50px;
  display: flex;
  align-items: center;
  overflow: hidden;
  font-variant-numeric: tabular-nums;
}

.year-title {
  position: absolute;
  left: 0;
  margin: 0;
  font-size: 42px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s;
  color: var(--text-primary);
  white-space: nowrap;
}

.year-title:hover {
  color: var(--color-primary);
}

.year-nav-buttons {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

.nav-btn-small {
  width: 24px;
  height: 24px;
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
}

.nav-btn-small:hover {
  background: var(--bg-active);
}

/* Animations for Year Title Scroll */
.year-scroll-up-enter-active,
.year-scroll-up-leave-active,
.year-scroll-down-enter-active,
.year-scroll-down-leave-active {
  transition:
    transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94),
    opacity 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.year-scroll-up-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.year-scroll-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.year-scroll-down-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.year-scroll-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.controls-right {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 8px;
  gap: 12px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--bg-input);
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.view-controls {
  display: flex;
  gap: 4px;
  background: var(--bg-input);
  padding: 4px;
  border-radius: 10px;
  position: relative;
  isolation: isolate;
}

.view-glider {
  position: absolute;
  top: 4px;
  left: 0;
  height: calc(100% - 8px);
  background: var(--bg-panel-card);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all var(--zoom-speed) var(--zoom-curve);
  z-index: 1;
  pointer-events: none;
}

.view-btn {
  position: relative;
  z-index: 2;
  padding: 6px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  border-radius: 7px;
  transition: color 0.2s;
  min-width: 44px;
}

.view-btn.active {
  color: var(--color-primary);
}

.main-view {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
