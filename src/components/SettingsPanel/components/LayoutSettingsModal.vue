<script setup lang="ts">
import { ref } from 'vue'
import { IconX, IconArrowsMinimize, IconArrowsMaximize } from '@tabler/icons-vue'
import LayoutSelector from './LayoutSelector.vue'
import SettingSlider from './SettingSlider.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits(['close'])

const { settings } = useSettings()

// 控制自定义区域是否展开
const isCustomExpanded = ref(true)

const updateDesktopLayout = (layout: { rows: number; cols: number }) => {
  settings.layoutGridRows = layout.rows
  settings.layoutGridCols = layout.cols
}

const handleToggleCustom = (shouldExpand: boolean) => {
  isCustomExpanded.value = shouldExpand
  if (shouldExpand) {
    settings.layoutPreset = 'custom'
  }
}

const close = () => {
  emit('close')
}
</script>

<template>
  <transition name="modal-slide">
    <div v-if="isOpen" class="modal-overlay" @click.self="close">
      <div class="modal-box layout-modal">
        <div class="modal-header">
          <span class="modal-title">桌面布局设置</span>
          <div class="close-btn sm" @click="close">
            <IconX :size="20" />
          </div>
        </div>

        <div class="modal-body layout-body">
          <!-- 网格选择器和自定义参数 -->
          <div class="setting-group">
            <div class="group-label">网格大小</div>
            <LayoutSelector
              :rows="settings.layoutGridRows"
              :cols="settings.layoutGridCols"
              :is-custom-expanded="isCustomExpanded"
              @update:layout="updateDesktopLayout"
              @toggle-custom="handleToggleCustom"
            />
          </div>

          <transition name="expand">
            <div v-if="isCustomExpanded" class="custom-sliders-wrapper">
              <div class="custom-sliders-inner">
                <div class="divider"></div>
                <div class="control-group">
                  <SettingSlider
                    v-model="settings.layoutGridRows"
                    label="行数"
                    :min="1"
                    :max="10"
                    unit="行"
                  />
                  <SettingSlider
                    v-model="settings.layoutGridCols"
                    label="列数"
                    :min="2"
                    :max="12"
                    unit="列"
                  />
                </div>
                <div class="control-group mt-2">
                  <SettingSlider
                    v-model="settings.layoutGridGapX"
                    label="列间距"
                    :min="0"
                    :max="100"
                    :step="4"
                    unit="px"
                  />
                  <SettingSlider
                    v-model="settings.layoutGridGapY"
                    label="行间距"
                    :min="0"
                    :max="100"
                    :step="4"
                    unit="px"
                  />
                  <SettingSlider
                    v-model="settings.folderInnerSpacing"
                    label="文件夹内部间距"
                    :min="2"
                    :max="20"
                    :step="1"
                    unit="px"
                  />
                </div>
              </div>
            </div>
          </transition>

          <!-- 大文件夹显示策略 -->
          <div class="setting-group">
            <div class="group-label">大文件夹显示策略</div>
            <div class="strategy-cards">
              <div
                class="strategy-card"
                :class="{ active: settings.folderCompressLarge }"
                @click="settings.folderCompressLarge = true"
              >
                <div class="radio-circle">
                  <div class="inner-dot"></div>
                </div>
                <div class="card-icon">
                  <IconArrowsMinimize :size="24" />
                </div>
                <div class="card-info">
                  <span class="title">自动压缩</span>
                  <span class="desc">保持布局整齐。</span>
                </div>
              </div>

              <div
                class="strategy-card"
                :class="{ active: !settings.folderCompressLarge }"
                @click="settings.folderCompressLarge = false"
              >
                <div class="radio-circle">
                  <div class="inner-dot"></div>
                </div>
                <div class="card-icon">
                  <IconArrowsMaximize :size="24" />
                </div>
                <div class="card-info">
                  <span class="title">保持原样</span>
                  <span class="desc">空间不足自动换页。</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="primary-btn full" @click="close">完成</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-right: 396px;
  background: rgba(0, 0, 0, 0.1);
}

@media (max-width: 850px) {
  .modal-overlay {
    justify-content: center;
    padding-right: 0;
    background: rgba(0, 0, 0, 0.5);
  }
}

.modal-box.layout-modal {
  width: 440px;
  background: rgba(30, 30, 30, 0.85);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.modal-header {
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #fff;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: rotate(90deg);
}

.close-btn.sm {
  width: 28px;
  height: 28px;
}

.modal-body.layout-body {
  padding: 24px;
  padding-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.group-label {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 预设卡片 */
.preset-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.preset-card {
  padding: 12px 8px;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.preset-card.active {
  background: rgba(0, 122, 255, 0.15);
  border-color: #007aff;
}

.preset-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
}

.preset-card.active .preset-label {
  color: #007aff;
  font-weight: 500;
}

/* 文件夹模式选择器 */
.folder-mode-selector {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mode-chip {
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.2s;
}

.mode-chip:hover {
  background: rgba(255, 255, 255, 0.08);
}

.mode-chip.active {
  background: rgba(0, 122, 255, 0.15);
  border-color: #007aff;
  color: #007aff;
  font-weight: 500;
}

.hint-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: -4px;
}

/* 自定义滑块区域样式 */
.custom-sliders-wrapper {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  margin-top: -10px;
  overflow: hidden;
}

.custom-sliders-inner {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mt-2 {
  margin-top: 8px;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 12px;
}

/* 策略卡片 */
.strategy-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.strategy-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.strategy-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.strategy-card.active {
  background: rgba(0, 122, 255, 0.1);
  border-color: #007aff;
}

.radio-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.strategy-card.active .radio-circle {
  border-color: #007aff;
}

.inner-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #007aff;
  opacity: 0;
  transform: scale(0);
  transition: all 0.2s;
}

.strategy-card.active .inner-dot {
  opacity: 1;
  transform: scale(1);
}

.card-icon {
  color: rgba(255, 255, 255, 0.6);
}

.strategy-card.active .card-icon {
  color: #007aff;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-info .title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.card-info .desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.4;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: flex-end;
}

.primary-btn.full {
  width: 100%;
  height: 40px;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: 0.2s;
}

.primary-btn.full:hover {
  background: #006add;
}

/* 展开动画 */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  max-height: 400px;
  opacity: 1;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

/* 入场动画 */
.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

.modal-slide-enter-from,
.modal-slide-leave-to {
  opacity: 0;
}

.modal-slide-enter-from .modal-box {
  transform: translateX(30px) scale(0.95);
}

.modal-slide-leave-to .modal-box {
  transform: translateX(30px) scale(0.95);
}

.modal-box {
  transform: translateX(0) scale(1);
  transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}
</style>
