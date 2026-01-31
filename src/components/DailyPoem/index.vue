<script setup lang="ts">
/**
 * 每日诗词组件
 * 横幅卡片形式展示每日诗词
 */
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { IconRefresh, IconStar, IconSettings, IconPhoto, IconCopy } from '@tabler/icons-vue'
import { useDailyPoem } from './composables/useDailyPoem'
import { useToast } from '../Toast/composables/useToast'
import { useClipboard } from '@vueuse/core'

const PoemManagerDialog = defineAsyncComponent(() => import('./PoemManager.vue'))
const ShareCardDialog = defineAsyncComponent(() => import('./components/ShareCard/index.vue'))

const {
  poem,
  loading,
  isOnlineMode,
  settings,
  authorInfo,
  loadPoem,
  refresh,
  saveCurrentToLocal,
} = useDailyPoem()

const { showToast } = useToast()

// 对话框开关
const isManagerOpen = ref(false)
const isShareCardOpen = ref(false)

// 动效状态
const isStarAnimating = ref(false)

// 复制功能
const { copy, isSupported } = useClipboard()

const handleCopy = async () => {
  if (!poem.value) return
  
  const content = `「${poem.value.content}」\n—— ${poem.value.author} ${poem.value.dynasty ? `〔${poem.value.dynasty}〕` : ''}`
  
  try {
    await copy(content)
    showToast({ type: 'success', message: '已复制到剪贴板' })
  } catch (e) {
    showToast({ type: 'error', message: '复制失败' })
  }
}

// 收藏当前诗词
const handleSave = () => {
  const success = saveCurrentToLocal()
  if (success) {
    showToast({ type: 'success', message: '已收藏到本地' })
    isStarAnimating.value = true
    setTimeout(() => {
      isStarAnimating.value = false
    }, 600)
  } else {
    showToast({ type: 'info', message: '该诗词已存在' })
  }
}

// 刷新频率限制
let lastRefreshTime = 0
const handleRefresh = async () => {
  const now = Date.now()
  if (now - lastRefreshTime < 2000) {
    showToast({ type: 'warning', message: '操作太频繁，请稍后再试' })
    return
  }
  lastRefreshTime = now
  await refresh()
}

// 初始化加载
onMounted(() => {
  loadPoem()
})
const hasFooterContent = computed(() => {
  const hasMeta = (settings.value.showAuthor || (settings.value.showTitle && poem.value?.title))
  const hasBtns = (settings.value.showCollect && isOnlineMode.value) || 
                  settings.value.showRefresh || 
                  settings.value.showCard || 
                  settings.value.showManager
  return hasMeta || hasBtns
  return hasMeta || hasBtns
})

// --- 动画逻辑 ---
// --- 动画逻辑 ---
const onEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = '0'
  // Force reflow
  element.offsetHeight
  element.style.height = `${element.scrollHeight}px`
}

const onAfterEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = 'auto'
}

const onLeave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = `${element.scrollHeight}px`
  // Force reflow
  element.offsetHeight
  element.style.height = '0'
}

</script>

<template>
  <div class="daily-poem">
    <!-- 内容区域 -->
    <Transition name="fade-blur" mode="out-in">
      <!-- 有数据状态 -->
      <div v-if="poem" :key="poem.content" class="content-wrapper">
        <div class="poem-content">
          <span class="quote-mark">「</span>
          <span class="poem-text">{{ poem.content }}</span>
          <span class="quote-mark">」</span>
        </div>
        
        <Transition
          name="collapse"
          @enter="onEnter"
          @after-enter="onAfterEnter"
          @leave="onLeave"
        >
          <div v-if="hasFooterContent" class="footer-wrapper">
            <div class="header-divider"></div>
            
            <div class="poem-footer">
              <div class="footer-left">
                <TransitionGroup name="list-fade">
                  <span v-if="settings.showAuthor" key="author" class="author-name">
                    {{ poem.author }} {{ poem.dynasty ? `〔${poem.dynasty}〕` : '' }}
                  </span>
                  <span v-if="settings.showTitle && poem.title" key="title" class="poem-title">
                    《{{ poem.title }}》
                  </span>
                </TransitionGroup>
              </div>
              
              <TransitionGroup name="list-horizontal" tag="div" class="action-btns-group">
                <!-- 复制按钮 -->
                <button
                  v-if="isSupported && settings.showCopy"
                  key="copy"
                  class="icon-btn"
                  title="复制诗词"
                  @click="handleCopy"
                >
                  <IconCopy :size="15" />
                </button>
                <!-- 收藏按钮 -->
                <button
                  v-if="settings.showCollect && isOnlineMode"
                  key="collect"
                  class="icon-btn"
                  :class="{ 'star-anim': isStarAnimating }"
                  title="收藏到本地"
                  @click="handleSave"
                >
                  <IconStar :size="15" :fill="isStarAnimating ? 'currentColor' : 'none'" />
                </button>
                <!-- 刷新按钮 -->
                <button
                  v-if="settings.showRefresh"
                  key="refresh"
                  class="icon-btn"
                  :class="{ spinning: loading }"
                  title="换一首"
                  @click="handleRefresh"
                >
                  <IconRefresh :size="15" />
                </button>
                <!-- 生成卡片按钮 -->
                <button
                  v-if="settings.showCard"
                  key="card"
                  class="icon-btn"
                  title="生成分享卡片"
                  @click="isShareCardOpen = true"
                >
                  <IconPhoto :size="15" />
                </button>
                <!-- 管理按钮 -->
                <button
                  v-if="settings.showManager"
                  key="manager"
                  class="icon-btn"
                  title="诗词管理"
                  @click="isManagerOpen = true"
                >
                  <IconSettings :size="15" />
                </button>
              </TransitionGroup>
            </div>
          </div>
        </Transition>
      </div>

      <!-- 加载/空状态 -->
      <div v-else class="content-wrapper skeleton" key="skeleton">
        <div class="poem-content">
          <span class="text-placeholder">正在寻觅佳句...</span>
        </div>
        <div class="poem-footer">
          <div class="author-placeholder"></div>
        </div>
      </div>
    </Transition>
  </div>

  <!-- 管理面板 -->
  <PoemManagerDialog v-model="isManagerOpen" />

  <!-- 分享卡片对话框 -->
  <ShareCardDialog
    v-model="isShareCardOpen"
    :poem="poem?.content"
    :author="authorInfo"
    :title="poem?.title"
  />
</template>

<style scoped>
.daily-poem {
  position: fixed;
  bottom: var(--space-8);
  left: 50%;
  transform: translateX(-50%);
  width: fit-content;
  max-width: 680px;
  min-width: 360px; /* 稍微增加最小宽度以容纳 Footer */
  padding: 12px 24px;
  text-align: left;
  z-index: var(--z-panel);
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.poem-content {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
  margin-bottom: 8px;
  position: relative;
  text-align: left;
  width: 100%;
}

.quote-mark {
  color: var(--text-tertiary);
  font-size: 20px;
  vertical-align: middle;
  opacity: 0.6;
}

.poem-text {
  font-weight: 500;
  letter-spacing: 0.5px;
  margin: 0 4px;
}

/* 分割线 */
.header-divider {
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 12px 0 8px;
}

.poem-footer {
  display: flex;
  align-items: flex-end; /* 底部对齐 */
  justify-content: space-between;
  gap: 16px;
  width: 100%;
}

.footer-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  /* gap: 2px; Removed for animation control */
}

.footer-left > span {
  line-height: 1.5;
}

.footer-left > span:last-child {
  margin-bottom: 0;
}

.author-name {
  font-size: 14px;
  font-weight: 600; /* 加粗 */
  color: var(--text-primary);
  opacity: 0.9;
}

.poem-title {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 按钮组容器 */
.action-btns-group {
  display: flex;
  padding: 0; 
  border-radius: 0;
  /* gap: 6px; Removed for animation control */
}

.action-btns-group > .icon-btn {
  margin-left: 6px;
}

.action-btns-group > .icon-btn:first-child {
  margin-left: 0;
}

/* 移除 hover */
/* .action-btns-group:hover {
  background: rgba(0, 0, 0, 0.15);
} */

.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  opacity: 0.8;
}

.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.icon-btn.spinning {
  animation: spin 1s linear infinite;
  color: var(--color-primary); /* 加载时高亮 */
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.star-anim {
  color: #fbbf24 !important; /* amber-400 */
  animation: star-bounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes star-bounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.5); }
  100% { transform: scale(1); }
}

/* 过渡动画 */
.fade-blur-enter-active,
.fade-blur-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-blur-enter-from,
.fade-blur-leave-to {
  opacity: 0;
  filter: blur(8px);
  transform: translateY(4px) scale(0.98);
}

/* 骨架屏样式 */
.skeleton .text-placeholder {
  color: var(--text-tertiary);
  font-size: 14px;
  animation: pulse 2s infinite;
}

.skeleton .author-placeholder {
  width: 60px;
  height: 14px;
  background: var(--bg-hover);
  border-radius: 4px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.4; }
  50% { opacity: 0.8; }
  100% { opacity: 0.4; }
}

/* 高度折叠动画 */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
}

/* 垂直列表动画 (作者/标题) */
.list-fade-enter-active,
.list-fade-leave-active {
  transition-property: opacity, transform, max-height;
  transition-duration: 0.3s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.list-fade-enter-from,
.list-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
  max-height: 0;
  margin-bottom: 0 !important; /* 强制覆盖 */
}

.list-fade-enter-to,
.list-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 24px;
  margin-bottom: 2px;
}

/* 水平列表动画 (按钮组) */
.list-horizontal-enter-active,
.list-horizontal-leave-active {
  transition-property: opacity, transform, max-width, margin-left, padding;
  transition-duration: 0.3s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  white-space: nowrap; /* 防止内容换行 */
}

.list-horizontal-enter-from,
.list-horizontal-leave-to {
  opacity: 0;
  transform: scale(0.8);
  max-width: 0;
  margin-left: 0 !important; /* 强制覆盖，解决卡顿 */
  padding-left: 0;
  padding-right: 0;
}

.list-horizontal-enter-to,
.list-horizontal-leave-from {
  opacity: 1;
  transform: scale(1);
  max-width: 28px;
  margin-left: 6px;
}

/* 列表移动动画 - 需要保持 absolute 以确保平滑排序，但对于进入/离开，我们使用上面的 max-width/height 技巧 */
/* 对于 Vue TransitionGroup，move class 需要在 items 改变位置时生效 */
/* 但如果我们不再使用 position: absolute on leave，move 可能不会生效得很好，除非 content flow 改变触发 */
/* 鉴于我们主要是显隐，而不是排序，我们可以简化掉 absolute */

.list-fade-move,
.list-horizontal-move {
  transition: transform 0.3s ease;
}
</style>
