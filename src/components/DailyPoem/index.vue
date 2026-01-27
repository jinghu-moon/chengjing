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
  <div v-if="poem" class="daily-poem">
    <div class="poem-content">
      <span class="quote-mark">「</span>
      <span class="poem-text">{{ poem.content }}</span>
      <span class="quote-mark">」</span>
    </div>
    <div class="poem-footer">
      <span class="author-info">─ {{ authorInfo }}</span>
      <div class="action-btns">
        <!-- 收藏按钮（在线模式显示） -->
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
  padding: 12px 24px;
  text-align: center;
  z-index: var(--z-panel);
}

.poem-content {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.quote-mark {
  color: var(--text-tertiary);
  font-size: 20px;
  vertical-align: middle;
}

.poem-text {
  font-weight: 500;
  letter-spacing: 0.5px;
}

.poem-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
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
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
