<script setup lang="ts">
import { ref, reactive } from 'vue'
import {
  IconX,
  IconPhoto,
  IconRefresh,
  IconLayoutDashboard,
  IconPalette,
  IconApps,
  IconDatabase,
  IconChevronDown,
  IconSettings,
  IconSearch,
  IconFocus2,
  IconListCheck,
  IconNotes,
  IconFileText,
  IconMarkdown,
  IconSparkles,
} from '@tabler/icons-vue'
import { saveImage, removeImage } from '@/utils/db'
import { useDailyPoem } from '@/components/DailyPoem/composables/useDailyPoem'
// [自动导入] useSettings 无需显式导入

import SettingSlider from './components/SettingSlider.vue'
import SettingSwitch from './components/SettingSwitch.vue'
import LayoutSettingsModal from './components/LayoutSettingsModal.vue'
import CapsuleTabs from './components/CapsuleTabs.vue'
import SelectMenu from '@/components/SelectMenu/index.vue'
// Select 组件由 unplugin-vue-components 自动导入

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits(['update:isOpen'])
const close = () => {
  emit('update:isOpen', false)
}

const { settings, iconConfig, forceWallpaperUpdate, resetSettings } = useSettings()

const {
  settings: poemSettings,
  updateSettings: updatePoemSettings,
  isOnlineMode: isPoemOnline,
  setOnlineMode: setPoemOnlineMode
} = useDailyPoem()

// Hitokoto 基础选项
const hitokotoBaseOptions = [
  { label: '诗词', value: 'i' },
  { label: '哲学 (文言文)', value: 'k' },
  { label: '文学', value: 'd' },
  { label: '动画', value: 'a' },
  { label: '影视', value: 'h' },
  { label: '其他', value: 'c' },
]

// API 来源选项
const sourceOptions = [
  { label: '今日诗词 (智能推荐)', value: 'jinrishici' },
  { label: '一言 (Hitokoto)', value: 'hitokoto' },
]

// 动态计算分类选项（Checkbox 状态）
const hitokotoCategoryOptions = computed(() => {
  return hitokotoBaseOptions.map(opt => ({
    ...opt,
    type: 'checkbox' as const,
    checked: poemSettings.value.hitokotoCategories.includes(opt.value as any)
  }))
})

// 处理分类 Checkbox 变化
const handleCategoryCheck = (value: string, checked: boolean) => {
  const currentCats = poemSettings.value.hitokotoCategories
  const val = value as any
  
  let newCats
  if (checked) {
    if (!currentCats.includes(val)) {
      newCats = [...currentCats, val]
    } else {
      newCats = currentCats
    }
  } else {
    newCats = currentCats.filter(c => c !== val)
  }
  
  updatePoemSettings({ hitokotoCategories: newCats })
}


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

// 折叠状态管理
const sectionState = reactive({
  style: true,
  search: true,
  layout: true,
  features: true,
  data: true,
  pomodoro: true,
  todo: true,
  notepad: true,
  dailyPoem: true,
})

const toggleSection = (key: keyof typeof sectionState) => {
  sectionState[key] = !sectionState[key]
}

const isLayoutModalOpen = ref(false)
const openLayoutModal = () => {
  isLayoutModalOpen.value = true
}

// 文件夹大小常用预设
const folderPresets = ['2x2', '2x3', '3x2', '3x3', '4x4']

// 更新文件夹行数
const updateFolderRows = (e: Event) => {
  const rows = (e.target as HTMLInputElement).value
  const cols = settings.folderDefaultMode.split('x')[1]
  settings.folderDefaultMode = `${rows}x${cols}` as any
}

// 更新文件夹列数
const updateFolderCols = (e: Event) => {
  const rows = settings.folderDefaultMode.split('x')[0]
  const cols = (e.target as HTMLInputElement).value
  settings.folderDefaultMode = `${rows}x${cols}` as any
}

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
        if (settings.wallpaperDailyEnabled) settings.wallpaperDailyEnabled = false
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
                <SettingSwitch v-model="settings.todoShow" label="开启待办清单" />
                <transition name="slide-fade">
                  <div v-if="settings.todoShow" class="sub-settings">
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
                <SettingSwitch v-model="settings.notePadShow" label="启用便签功能" />
                <transition name="slide-fade">
                  <div v-if="settings.notePadShow" class="sub-settings">
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

        <div class="section-card" :class="{ collapsed: !sectionState.dailyPoem }">
          <div class="card-header" @click="toggleSection('dailyPoem')">
            <div class="header-label">
              <IconSparkles :size="16" stroke-width="2" />
              <span>每日诗词设置</span>
            </div>
            <IconChevronDown :size="18" class="toggle-icon" />
          </div>
          <transition
            name="accordion"
            @enter="onEnter"
            @after-enter="onAfterEnter"
            @leave="onLeave"
          >
            <div v-show="sectionState.dailyPoem" class="card-content-wrapper">
              <div class="card-content-inner">
                <SettingSwitch v-model="settings.poemShow" label="开启每日诗词" />
                
                <transition name="slide-fade">
                  <div v-if="settings.poemShow" class="sub-settings">
                    <SettingSwitch
                      :model-value="isPoemOnline"
                      label="使用在线 API"
                      @update:model-value="setPoemOnlineMode"
                    />

                    <div class="divider"></div>
                    <SettingSwitch
                      :model-value="poemSettings.showAuthor"
                      label="显示作者"
                      @update:model-value="updatePoemSettings({ showAuthor: $event })"
                    />
                    <SettingSwitch
                      :model-value="poemSettings.showTitle"
                      label="显示标题"
                      @update:model-value="updatePoemSettings({ showTitle: $event })"
                    />
                    
                    <div class="divider"></div>
                    <div class="control-row secondary-label">操作按钮</div>
                    <SettingSwitch
                      :model-value="poemSettings.showCollect"
                      label="收藏按钮"
                      @update:model-value="updatePoemSettings({ showCollect: $event })"
                    />
                    <SettingSwitch
                      :model-value="poemSettings.showCopy"
                      label="复制按钮"
                      @update:model-value="updatePoemSettings({ showCopy: $event })"
                    />
                    <SettingSwitch
                      :model-value="poemSettings.showRefresh"
                      label="刷新按钮"
                      @update:model-value="updatePoemSettings({ showRefresh: $event })"
                    />
                    <SettingSwitch
                      :model-value="poemSettings.showCard"
                      label="卡片生成"
                      @update:model-value="updatePoemSettings({ showCard: $event })"
                    />
                    <SettingSwitch
                      :model-value="poemSettings.showManager"
                      label="管理面板"
                      @update:model-value="updatePoemSettings({ showManager: $event })"
                    />

                    <!-- 扩展配置 -->
                    <transition name="expand">
                      <div v-if="isPoemOnline" class="api-config">
                        <div class="divider"></div>
                        <div class="config-row">
                          <label>API 来源</label>
                          <div class="config-control">
                            <SelectMenu
                              :model-value="poemSettings.source"
                              :options="sourceOptions"
                              trigger-width="100%"
                              :show-arrow="true"
                              @update:model-value="updatePoemSettings({ source: $event as any })"
                            />
                          </div>
                        </div>

                        <!-- 一言分类选择 -->
                        <transition name="expand">
                          <div v-if="poemSettings.source === 'hitokoto'" class="config-row" style="margin-top: 12px">
                            <label>分类筛选</label>
                            <div class="config-control">
                              <SelectMenu
                                model-value=""
                                placeholder="选择分类 (可多选)"
                                :options="hitokotoCategoryOptions"
                                trigger-width="100%"
                                :multiple="true" 
                                :clearable="false"
                                @check="handleCategoryCheck"
                              />
                            </div>
                          </div>
                        </transition>

                        <!-- API 信息 -->
                        <div class="api-info">
                          <div class="api-provider">
                            <span class="label">当前来源：</span>
                            <span class="value">
                              {{ poemSettings.source === 'hitokoto' ? 'Hitokoto 一言' : '今日诗词' }}
                            </span>
                          </div>
                          <div class="api-description">
                            {{ 
                              poemSettings.source === 'hitokoto' 
                                ? '可以获取诗词、哲学、文学等各类名句。' 
                                : '根据时间、地点、天气智能推荐古诗词名句。' 
                            }}
                          </div>
                        </div>
                      </div>
                    </transition>
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
                <SettingSwitch v-model="settings.searchBarShow" label="显示搜索栏" />

                <transition name="slide-fade">
                  <div v-if="settings.searchBarShow" class="sub-settings">
                    <div class="divider"></div>
                    <SettingSwitch v-model="settings.searchBarShowIcon" label="显示右侧搜索按钮" />
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

                <SettingSlider
                  v-model="settings.layoutPaddingTop"
                  label="顶部留白"
                  :min="0"
                  :max="40"
                  unit="vh"
                />
                <SettingSlider
                  v-model="settings.layoutGap"
                  label="组件间距"
                  :min="0"
                  :max="100"
                  :step="4"
                  unit="px"
                />

                <div class="divider" style="margin: 8px 0"></div>

                <div class="setting-sub-group">
                  <span class="sub-label">文件夹默认大小</span>
                  <CapsuleTabs
                    v-model="settings.folderDefaultMode"
                    :items="folderPresets.map(p => ({ label: p, value: p }))"
                    :equal-width="true"
                  />
                  <div class="folder-sliders">
                    <div class="slider-row">
                      <span class="slider-label">行</span>
                      <input
                        type="range"
                        :min="1"
                        :max="5"
                        :value="parseInt(settings.folderDefaultMode.split('x')[0])"
                        @input="updateFolderRows($event)"
                      />
                      <span class="slider-value">{{ settings.folderDefaultMode.split('x')[0] }}</span>
                    </div>
                    <div class="slider-row">
                      <span class="slider-label">列</span>
                      <input
                        type="range"
                        :min="1"
                        :max="5"
                        :value="parseInt(settings.folderDefaultMode.split('x')[1])"
                        @input="updateFolderCols($event)"
                      />
                      <span class="slider-value">{{ settings.folderDefaultMode.split('x')[1] }}</span>
                    </div>
                  </div>
                </div>

                <div class="divider" style="margin: 8px 0"></div>

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
                <SettingSwitch v-model="settings.wallpaperDailyEnabled" label="每日 Bing 壁纸" />
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
                <SettingSwitch v-model="settings.clockShow" label="时钟与日期" />
                <SettingSwitch v-model="settings.shortcutsShow" label="快捷方式网格" />
                <SettingSwitch v-model="settings.calculatorShow" label="计算器" />

                <div class="divider"></div>
                <SettingSwitch v-model="settings.generalOpenInNewTab" label="新标签页打开链接" />
                <SettingSwitch v-model="settings.folderAutoCleanEmpty" label="清空后删除文件夹" />
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

<style scoped>
/* API 配置样式扩展 */
.api-config {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-row label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
  min-width: 60px;
}

.config-control {
  flex: 1;
  min-width: 0;
}

.api-info {
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.api-provider {
  display: flex;
  gap: 6px;
  color: var(--text-primary);
  font-weight: 500;
}

.api-description {
  color: var(--text-tertiary);
  font-size: 12px;
}

/* 展开动画 */
.expand-enter-active,
.expand-leave-active {
  transition: 
    max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    margin 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  max-height: 400px;
  opacity: 1;
  will-change: max-height, opacity, margin;
  transform: translateZ(0);
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  margin-bottom: 0 !important;
}

.secondary-label {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 8px;
  margin-bottom: 4px;
  padding-left: 4px;
}
</style>
