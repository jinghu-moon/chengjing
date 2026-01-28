<script setup lang="ts">
/**
 * 每日诗词组件
 * 横幅卡片形式展示每日诗词
 */
import { ref, onMounted, computed } from 'vue'
import { IconRefresh, IconStar, IconSettings, IconPhoto } from '@tabler/icons-vue'
import { useDailyPoem } from './composables/useDailyPoem'
import { useToast } from '../Toast/composables/useToast'
import PoemManagerDialog from './PoemManager.vue'
import ShareCardDialog from './components/ShareCard/index.vue'

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
const onEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = 'auto'
  const height = getComputedStyle(element).height
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
  getComputedStyle(element).height
  requestAnimationFrame(() => {
    element.style.height = '0'
  })
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
  gap: 2px;
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
  /* 移除背景色，保持原始样式 */
  /* background: rgba(0, 0, 0, 0.1); */
  /* backdrop-filter: blur(4px); */
  padding: 0; 
  border-radius: 0;
  gap: 6px; /* 增加间距 */
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
  transition: all 0.3s ease;
}

.list-fade-enter-from,
.list-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 水平列表动画 (按钮组) */
.list-horizontal-enter-active,
.list-horizontal-leave-active {
  transition: all 0.3s ease;
}

.list-horizontal-enter-from,
.list-horizontal-leave-to {
  opacity: 0;
  transform: translateX(4px);
}

/* 确保列表删除时布局平滑 (Vue TransitionGroup 技巧) */
.list-fade-leave-active,
.list-horizontal-leave-active {
  position: absolute;
}

/* 列表移动动画 (FLIP) */
.list-fade-move,
.list-horizontal-move {
  transition: transform 0.3s ease;
}
</style>
