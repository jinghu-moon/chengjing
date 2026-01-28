<script setup lang="ts">
/**
 * 每日诗词组件
 * 横幅卡片形式展示每日诗词
 */
import { ref, onMounted } from 'vue'
import { IconRefresh, IconStar, IconSettings } from '@tabler/icons-vue'
import { useDailyPoem } from './composables/useDailyPoem'
import { useToast } from '../Toast/composables/useToast'
import PoemManagerDialog from './PoemManager.vue'

const {
  poem,
  loading,
  isOnlineMode,
  authorInfo,
  loadPoem,
  refresh,
  saveCurrentToLocal,
} = useDailyPoem()

const { showToast } = useToast()

// 管理面板开关
const isManagerOpen = ref(false)

// 收藏当前诗词
const handleSave = () => {
  const success = saveCurrentToLocal()
  if (success) {
    showToast({ type: 'success', message: '已收藏到本地' })
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
        <div class="poem-footer">
          <span class="author-info">─ {{ authorInfo }}</span>
          <div class="action-btns">
            <!-- 收藏按钮 -->
            <button
              v-if="isOnlineMode"
              class="icon-btn"
              title="收藏到本地"
              @click="handleSave"
            >
              <IconStar :size="14" />
            </button>
            <!-- 刷新按钮 -->
            <button
              class="icon-btn"
              :class="{ spinning: loading }"
              title="换一首"
              @click="handleRefresh"
            >
              <IconRefresh :size="14" />
            </button>
            <!-- 管理按钮 -->
            <button
              class="icon-btn"
              title="诗词管理"
              @click="isManagerOpen = true"
            >
              <IconSettings :size="14" />
            </button>
          </div>
        </div>
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
</template>

<style scoped>
.daily-poem {
  position: fixed;
  bottom: var(--space-8);
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  max-width: 600px;
  min-width: 320px; /* 防止内容切换时宽度跳变过大 */
  padding: 12px 24px;
  text-align: center;
  z-index: var(--z-panel);
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.poem-content {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
  margin-bottom: 12px;
  position: relative;
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

.poem-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 24px; /* 固定高度 */
}

.author-info {
  font-size: 13px;
  color: var(--text-secondary);
}

.action-btns {
  display: flex;
  gap: 4px;
}

.icon-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast);
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
</style>
