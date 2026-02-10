<script setup lang="ts">
import { ref } from 'vue'
import {
  IconPhoto,
  IconRefresh,
  IconLayoutDashboard,
  IconPalette,
  IconApps,
  IconSettings,
  IconSearch,
  IconFocus2,
  IconListCheck,
  IconNotes,
  IconFileText,
  IconMarkdown,
  IconSparkles,
  IconPackage,
} from '@tabler/icons-vue'
import { saveImage, removeImage } from '@/utils/db'
import { useDailyPoem } from '@/components/DailyPoem/composables/useDailyPoem'
import { useTheme } from '@/composables/useTheme'
// [自动导入] useSettings 无需显式导入

import { Collapse, Drawer } from '@/components/Container'
import SettingSlider from './components/SettingSlider.vue'
import SettingSwitch from './components/SettingSwitch.vue'
import LayoutSettingsModal from './components/LayoutSettingsModal.vue'
import CapsuleTabs from './components/CapsuleTabs.vue'
import SelectMenu from '@/components/SelectMenu/index.vue'
import PresetManager from '@/components/DataBackup/PresetManager.vue'
// Select 组件由 unplugin-vue-components 自动导入

const isOpen = defineModel<boolean>('open', { default: false })

const { settings, iconConfig, forceWallpaperUpdate, resetSettings } = useSettings()
const { isDark } = useTheme()

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

const fileInput = ref<HTMLInputElement | null>(null)

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
  <Drawer
    v-model:open="isOpen"
    title="设置"
    width="360px"
    :teleport="false"
  >
    <div class="panel-content">
        <Collapse
          title="配置预设"
          :icon="IconPackage"
          :default-expanded="true"
          size="sm"
          :show-switch="false"
          :show-collapse-icon="true"
        >
          <PresetManager />
        </Collapse>

        <Collapse
          title="番茄钟设置"
          :icon="IconFocus2"
          :default-expanded="true"
          size="sm"
          :show-switch="false"
          :show-collapse-icon="true"
        >
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
        </Collapse>

        <Collapse
          title="待办清单设置"
          :icon="IconListCheck"
          :default-expanded="true"
          size="sm"
          :show-switch="false"
          :show-collapse-icon="true"
        >
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
        </Collapse>

        <Collapse
          title="便签设置"
          :icon="IconNotes"
          :default-expanded="true"
          size="sm"
          :show-switch="false"
          :show-collapse-icon="true"
        >
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
        </Collapse>

        <Collapse
          title="每日诗词设置"
          :icon="IconSparkles"
          :default-expanded="true"
          size="sm"
          :show-switch="false"
          :show-collapse-icon="true"
        >
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
        </Collapse>

        <Collapse
          title="图标风格"
          :icon="IconPalette"
          :default-expanded="true"
          size="sm"
          :show-switch="false"
          :show-collapse-icon="true"
        >
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
        </Collapse>

        <Collapse
          title="搜索框样式"
          :icon="IconSearch"
          :default-expanded="true"
          size="sm"
          :show-switch="false"
          :show-collapse-icon="true"
        >
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
        </Collapse>

        <Collapse
          title="布局与壁纸"
          :icon="IconLayoutDashboard"
          :default-expanded="true"
          size="sm"
          :show-switch="false"
          :show-collapse-icon="true"
        >
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
        </Collapse>

        <Collapse
          title="功能模块"
          :icon="IconApps"
          :default-expanded="true"
          size="sm"
          :show-switch="false"
          :show-collapse-icon="true"
        >
          <SettingSwitch v-model="isDark" label="深色模式" />
          <div class="divider"></div>
          <SettingSwitch v-model="settings.clockShow" label="时钟与日期" />
          <SettingSwitch v-model="settings.shortcutsShow" label="快捷方式网格" />
          <SettingSwitch v-model="settings.calculatorShow" label="计算器" />
          <div class="divider"></div>
          <SettingSwitch v-model="settings.generalOpenInNewTab" label="新标签页打开链接" />
          <SettingSwitch v-model="settings.folderAutoCleanEmpty" label="清空后删除文件夹" />
        </Collapse>

        <div class="danger-zone">
          <button class="text-btn danger" @click="handleReset">
            <IconRefresh :size="16" /> 恢复默认设置
          </button>
        </div>
      </div>
  </Drawer>

  <LayoutSettingsModal :is-open="isLayoutModalOpen" @close="isLayoutModalOpen = false" />
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
