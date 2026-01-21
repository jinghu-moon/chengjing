<script setup lang="ts">
import { ref, reactive } from 'vue'
import {
  IconX,
  IconPhoto,
  IconRefresh,
  IconDownload,
  IconUpload,
  IconLayoutDashboard,
  IconPalette,
  IconApps,
  IconDatabase,
  IconChevronDown,
  IconSettings,
  IconSearch,
  IconFocus2,
  IconListCheck, // [新增]
  IconNotes, // [新增]
  IconFileText,
  IconMarkdown,
} from '@tabler/icons-vue'
import { saveImage, removeImage } from '@/utils/db'
// [自动导入] useSettings 无需显式导入

import SettingSlider from './components/SettingSlider.vue'
import SettingSwitch from './components/SettingSwitch.vue'
import LayoutSettingsModal from './components/LayoutSettingsModal.vue'
// Select 组件由 unplugin-vue-components 自动导入

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits(['update:isOpen'])
const close = () => {
  emit('update:isOpen', false)
}

const { settings, iconConfig, forceWallpaperUpdate, resetSettings } = useSettings()

// --- JS 折叠动画逻辑 ---
const onEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.width = getComputedStyle(element).width
  element.style.position = 'absolute'
  element.style.visibility = 'hidden'
  element.style.height = 'auto'

  const height = getComputedStyle(element).height

  element.style.width = ''
  element.style.position = ''
  element.style.visibility = ''
  element.style.height = '0'

  // 强制重绘

  getComputedStyle(element).height

  requestAnimationFrame(() => {
    element.style.height = height
  })
}

const onAfterEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = 'auto'
}

const onLeave = (el: Element) => {
  const element = el as HTMLElement
  const height = getComputedStyle(element).height

  element.style.height = height

  // 强制重绘

  getComputedStyle(element).height

  requestAnimationFrame(() => {
    element.style.height = '0'
  })
}

const fileInput = ref<HTMLInputElement | null>(null)
const configInput = ref<HTMLInputElement | null>(null)

// 折叠状态管理
const sectionState = reactive({
  style: true,
  search: true,
  layout: true,
  features: true,
  data: true,
  pomodoro: true,
  todo: true, // [新增]
  notepad: true, // [新增]
})

const toggleSection = (key: keyof typeof sectionState) => {
  sectionState[key] = !sectionState[key]
}

const isLayoutModalOpen = ref(false)
const openLayoutModal = () => {
  isLayoutModalOpen.value = true
}

const layoutOptions = [
  { value: '2x1', label: '2列 x 1行 (横向双格)' },
  { value: '3x1', label: '3列 x 1行 (横向长条)' },
  { value: 'divider' },
  { value: '2x2', label: '2列 x 2行 (标准方形)' },
  { value: '1x2', label: '1列 x 2行 (竖向双格)' },
  { value: '3x2', label: '3列 x 2行 (大号横条)' },
  { value: 'divider' },
  { value: '3x3', label: '3列 x 3行 (巨大方形)' },
  { value: '1x3', label: '1列 x 3行 (竖向长条)' },
  { value: '2x3', label: '2列 x 3行 (大号竖条)' },
]

const triggerUpload = () => {
  fileInput.value?.click()
}
const handleFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file && file.size < 10 * 1024 * 1024) {
    const reader = new FileReader()
    reader.onload = async ev => {
      try {
        const base64Data = ev.target?.result as string
        await saveImage('custom-bg', base64Data)
        localStorage.removeItem('custom-bg')
        if (settings.dailyWallpaper) settings.dailyWallpaper = false
        forceWallpaperUpdate()
      } catch (err) {
        console.error(err)
        alert('存储失败')
      }
    }
    reader.readAsDataURL(file)
  } else {
    alert('图片需小于 10MB')
  }
}

const handleReset = async () => {
  if (!confirm('确定要恢复所有默认设置吗？')) return
  resetSettings()
  localStorage.removeItem('custom-bg')
  try {
    await removeImage('custom-bg')
  } catch (e) {
    console.warn(e)
  }
}

const exportConfig = () => {
  const config = {
    shortcuts: localStorage.getItem('shortcuts'),
    iconConfig: localStorage.getItem('iconConfig'),
    settings: localStorage.getItem('lime-settings'),
  }
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lime-tab-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const triggerImport = () => configInput.value?.click()
const handleImportConfig = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = ev => {
    try {
      const config = JSON.parse(ev.target?.result as string)
      if (config.shortcuts) localStorage.setItem('shortcuts', config.shortcuts)
      if (config.iconConfig) localStorage.setItem('iconConfig', config.iconConfig)
      if (config.settings) localStorage.setItem('lime-settings', config.settings)
      location.reload()
    } catch (err) {
      alert('格式错误')
    }
  }
  reader.readAsText(file)
}

const resetNotePadPos = () => {
  if (confirm('确定要重置便签位置吗？')) {
    window.dispatchEvent(new Event('reset-notepad-position'))
  }
}
</script>

<template>
  <div>
    <div class="settings-overlay" :class="{ open: isOpen }" @click="close"></div>
    <div class="settings-panel" :class="{ open: isOpen }">
      <div class="panel-header">
        <span class="panel-title">设置</span>
        <div class="close-btn" @click="close">
          <IconX :size="24" />
        </div>
      </div>

      <div class="panel-content">
        <div class="section-card" :class="{ collapsed: !sectionState.pomodoro }">
          <div class="card-header" @click="toggleSection('pomodoro')">
            <div class="header-label">
              <IconFocus2 :size="16" stroke-width="2" />
              <span>番茄钟设置</span>
            </div>
            <IconChevronDown :size="18" class="toggle-icon" />
          </div>
          <transition
            name="accordion"
            @enter="onEnter"
            @after-enter="onAfterEnter"
            @leave="onLeave"
          >
            <div v-show="sectionState.pomodoro" class="card-content-wrapper">
              <div class="card-content-inner">
                <SettingSwitch v-model="settings.pomodoroAutoBreak" label="自动进入休息" />
                <SettingSwitch v-model="settings.pomodoroAutoWork" label="自动开始下轮 (循环)" />
                <div class="divider"></div>
                <SettingSlider
                  v-model="settings.pomodoroWorkMinutes"
                  label="专注时长"
                  :min="1"
                  :max="60"
                  unit="分钟"
                />
                <SettingSlider
                  v-model="settings.pomodoroBreakMinutes"
                  label="休息时长"
                  :min="1"
                  :max="30"
                  unit="分钟"
                />
              </div>
            </div>
          </transition>
        </div>

        <div class="section-card" :class="{ collapsed: !sectionState.todo }">
          <div class="card-header" @click="toggleSection('todo')">
            <div class="header-label">
              <IconListCheck :size="16" stroke-width="2" />
              <span>待办清单设置</span>
            </div>
            <IconChevronDown :size="18" class="toggle-icon" />
          </div>
          <transition
            name="accordion"
            @enter="onEnter"
            @after-enter="onAfterEnter"
            @leave="onLeave"
          >
            <div v-show="sectionState.todo" class="card-content-wrapper">
              <div class="card-content-inner">
                <SettingSwitch v-model="settings.showTodo" label="开启待办清单" />
                <transition name="slide-fade">
                  <div v-if="settings.showTodo" class="sub-settings">
                    <SettingSwitch v-model="settings.todoDefaultCollapsed" label="默认折叠清单" />
                    <div class="divider"></div>
                    <SettingSlider
                      v-model="settings.todoWidth"
                      label="面板宽度"
                      :min="280"
                      :max="500"
                      :step="10"
                      unit="px"
                    />
                    <SettingSlider
                      v-model="settings.todoListMaxHeight"
                      label="列表最大高度"
                      :min="200"
                      :max="800"
                      :step="20"
                      unit="px"
                    />
                  </div>
                </transition>
              </div>
            </div>
          </transition>
        </div>

        <div class="section-card" :class="{ collapsed: !sectionState.notepad }">
          <div class="card-header" @click="toggleSection('notepad')">
            <div class="header-label">
              <IconNotes :size="16" stroke-width="2" />
              <span>便签设置</span>
            </div>
            <IconChevronDown :size="18" class="toggle-icon" />
          </div>
          <transition
            name="accordion"
            @enter="onEnter"
            @after-enter="onAfterEnter"
            @leave="onLeave"
          >
            <div v-show="sectionState.notepad" class="card-content-wrapper">
              <div class="card-content-inner">
                <SettingSwitch v-model="settings.showNotePad" label="启用便签功能" />
                <transition name="slide-fade">
                  <div v-if="settings.showNotePad" class="sub-settings">
                    <div class="divider"></div>
                    <div class="control-row">
                      <span>编辑器模式</span>
                      <div class="view-toggles">
                        <button
                          :class="{ active: settings.notePadEditorMode === 'rich' }"
                          title="富文本模式"
                          @click="settings.notePadEditorMode = 'rich'"
                        >
                          <IconMarkdown :size="16" />
                        </button>
                        <button
                          :class="{ active: settings.notePadEditorMode === 'plain' }"
                          title="纯文本模式"
                          @click="settings.notePadEditorMode = 'plain'"
                        >
                          <IconFileText :size="16" />
                        </button>
                      </div>
                    </div>
                    <div class="divider"></div>
                    <SettingSlider
                      v-model="settings.notePadWidth"
                      label="宽度"
                      :min="280"
                      :max="600"
                      :step="10"
                      unit="px"
                    />
                    <SettingSlider
                      v-model="settings.notePadHeight"
                      label="高度"
                      :min="200"
                      :max="800"
                      :step="10"
                      unit="px"
                    />
                    <div class="control-row" style="margin-top: 12px">
                      <span>位置</span>
                      <button class="btn secondary sm" @click="resetNotePadPos">重置位置</button>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </transition>
        </div>

        <div class="section-card" :class="{ collapsed: !sectionState.style }">
          <div class="card-header" @click="toggleSection('style')">
            <div class="header-label">
              <IconPalette :size="16" stroke-width="2" />
              <span>图标风格</span>
            </div>
            <IconChevronDown :size="18" class="toggle-icon" />
          </div>

          <transition
            name="accordion"
            @enter="onEnter"
            @after-enter="onAfterEnter"
            @leave="onLeave"
          >
            <div v-show="sectionState.style" class="card-content-wrapper">
              <div class="card-content-inner">
                <SettingSlider
                  v-model="iconConfig.iconScale"
                  label="图标大小"
                  :min="20"
                  :max="100"
                  unit="%"
                />
                <SettingSlider
                  v-model="iconConfig.boxSize"
                  label="盒子尺寸"
                  :min="48"
                  :max="120"
                  unit="px"
                />
                <SettingSlider
                  v-model="iconConfig.radius"
                  label="圆角半径"
                  :min="0"
                  :max="50"
                  unit="%"
                />
                <SettingSlider
                  v-model="iconConfig.opacity"
                  label="不透明度"
                  :min="0"
                  :max="100"
                  unit="%"
                />
                <div class="divider"></div>
                <SettingSwitch v-model="iconConfig.showShadow" label="显示阴影" />
                <SettingSwitch v-model="iconConfig.hideLabel" label="隐藏图标名称" />
              </div>
            </div>
          </transition>
        </div>

        <div class="section-card" :class="{ collapsed: !sectionState.search }">
          <div class="card-header" @click="toggleSection('search')">
            <div class="header-label">
              <IconSearch :size="16" stroke-width="2" />
              <span>搜索框样式</span>
            </div>
            <IconChevronDown :size="18" class="toggle-icon" />
          </div>

          <transition
            name="accordion"
            @enter="onEnter"
            @after-enter="onAfterEnter"
            @leave="onLeave"
          >
            <div v-show="sectionState.search" class="card-content-wrapper">
              <div class="card-content-inner">
                <SettingSwitch v-model="settings.showSearchBar" label="显示搜索栏" />

                <transition name="slide-fade">
                  <div v-if="settings.showSearchBar" class="sub-settings">
                    <div class="divider"></div>
                    <SettingSwitch v-model="settings.showSearchIcon" label="显示右侧搜索按钮" />
                    <div class="divider"></div>
                    <SettingSlider
                      v-model="settings.searchBarWidth"
                      label="宽度"
                      :min="10"
                      :max="90"
                      unit="%"
                    />
                    <SettingSlider
                      v-model="settings.searchBarHeight"
                      label="高度"
                      :min="40"
                      :max="80"
                      unit="px"
                    />
                    <SettingSlider
                      v-model="settings.searchBarRadius"
                      label="圆角"
                      :min="0"
                      :max="40"
                      unit="px"
                    />
                    <SettingSlider
                      v-model="settings.searchBarOpacity"
                      label="不透明度"
                      :min="0"
                      :max="100"
                      unit="%"
                    />
                  </div>
                </transition>
              </div>
            </div>
          </transition>
        </div>

        <div class="section-card" :class="{ collapsed: !sectionState.layout }">
          <div class="card-header" @click="toggleSection('layout')">
            <div class="header-label">
              <IconLayoutDashboard :size="16" stroke-width="2" />
              <span>布局与壁纸</span>
            </div>
            <IconChevronDown :size="18" class="toggle-icon" />
          </div>

          <transition
            name="accordion"
            @enter="onEnter"
            @after-enter="onAfterEnter"
            @leave="onLeave"
          >
            <div v-show="sectionState.layout" class="card-content-wrapper">
              <div class="card-content-inner">
                <div class="control-row">
                  <span>桌面布局设置</span>
                  <button class="btn secondary sm" @click="openLayoutModal">
                    <IconSettings :size="16" /> 配置
                  </button>
                </div>

                <div class="divider" style="margin: 8px 0"></div>

                <div class="control-row">
                  <span>文件夹预览样式</span>
                  <SelectMenu
                    v-model="settings.folderPreviewMode"
                    :options="layoutOptions"
                    trigger-width="200px"
                    placeholder="选择布局..."
                  />
                </div>

                <SettingSlider
                  v-model="settings.wallpaperBlur"
                  label="壁纸模糊"
                  :min="0"
                  :max="50"
                  unit="px"
                />
                <SettingSlider
                  v-model="settings.wallpaperMask"
                  label="壁纸遮罩"
                  :min="0"
                  :max="90"
                  :step="5"
                  unit="%"
                />
                <SettingSwitch v-model="settings.dailyWallpaper" label="每日 Bing 壁纸" />
                <div class="upload-area" @click="triggerUpload">
                  <IconPhoto :size="20" />
                  <span>上传自定义壁纸</span>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  hidden
                  accept="image/*"
                  @change="handleFileChange"
                />
              </div>
            </div>
          </transition>
        </div>

        <div class="section-card" :class="{ collapsed: !sectionState.features }">
          <div class="card-header" @click="toggleSection('features')">
            <div class="header-label">
              <IconApps :size="16" stroke-width="2" />
              <span>功能模块</span>
            </div>
            <IconChevronDown :size="18" class="toggle-icon" />
          </div>

          <transition
            name="accordion"
            @enter="onEnter"
            @after-enter="onAfterEnter"
            @leave="onLeave"
          >
            <div v-show="sectionState.features" class="card-content-wrapper">
              <div class="card-content-inner">
                <SettingSwitch v-model="settings.showClock" label="时钟与日期" />
                <SettingSwitch v-model="settings.showShortcuts" label="快捷方式网格" />
                <div class="divider"></div>
                <SettingSwitch v-model="settings.openNewTab" label="新标签页打开链接" />
                <SettingSwitch v-model="settings.deleteEmptyFolder" label="清空后删除文件夹" />
              </div>
            </div>
          </transition>
        </div>

        <div class="section-card" :class="{ collapsed: !sectionState.data }">
          <div class="card-header" @click="toggleSection('data')">
            <div class="header-label">
              <IconDatabase :size="16" stroke-width="2" />
              <span>数据管理</span>
            </div>
            <IconChevronDown :size="18" class="toggle-icon" />
          </div>

          <transition
            name="accordion"
            @enter="onEnter"
            @after-enter="onAfterEnter"
            @leave="onLeave"
          >
            <div v-show="sectionState.data" class="card-content-wrapper">
              <div class="card-content-inner">
                <div class="actions-grid">
                  <button class="btn secondary" @click="exportConfig">
                    <IconDownload :size="16" /> 备份配置
                  </button>
                  <button class="btn secondary" @click="triggerImport">
                    <IconUpload :size="16" /> 恢复配置
                  </button>
                </div>
                <input
                  ref="configInput"
                  type="file"
                  hidden
                  accept=".json"
                  @change="handleImportConfig"
                />
              </div>
            </div>
          </transition>
        </div>

        <div class="danger-zone">
          <button class="text-btn danger" @click="handleReset">
            <IconRefresh :size="16" /> 恢复默认设置
          </button>
        </div>
      </div>
    </div>

    <LayoutSettingsModal :is-open="isLayoutModalOpen" @close="isLayoutModalOpen = false" />
  </div>
</template>

<style scoped src="./styles.css"></style>
