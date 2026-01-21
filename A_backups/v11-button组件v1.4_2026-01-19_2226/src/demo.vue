<template>
  <div class="demo-page">
    <div class="demo-header">
      <h1>Lime Tab 组件演示</h1>
      <p>全组件交互与视觉效果测试</p>
    </div>

    <div class="demo-grid">
      <!-- ==================== 卡片1: Toast 基础 ==================== -->
      <section class="demo-section">
        <h2>Toast 消息基础</h2>
        <div class="demo-group">
          <h3>消息类型</h3>
          <div class="demo-row">
            <button @click="toast.success('操作成功')">Success</button>
            <button @click="toast.error('操作失败')">Error</button>
            <button @click="toast.warning('注意')">Warning</button>
          </div>
        </div>
        <div class="demo-group">
          <h3>高级交互</h3>
          <div class="demo-row">
            <button @click="toast.info('有新消息', { title: '通知' })">带标题</button>
            <button @click="testUndo">撤回测试</button>
            <button @click="testStack">堆叠测试</button>
          </div>
        </div>
      </section>

      <!-- ==================== 卡片2: Toast 进阶 ==================== -->
      <section class="demo-section">
        <h2>Toast 状态与位置</h2>
        <div class="demo-group">
          <h3>Promise 追踪</h3>
          <div class="demo-row">
            <button @click="testSaveData">保存(2s)</button>
            <button @click="testUploadFail">上传(失败)</button>
          </div>
        </div>
        <div class="demo-group">
          <h3>九宫格位置</h3>
          <div class="positions-grid">
            <button title="左上" @click="toast.setPosition('top-left')">↖</button>
            <button title="上中" @click="toast.setPosition('top-center')">↑</button>
            <button title="右上" @click="toast.setPosition('top-right')">↗</button>
            <button title="左中" @click="toast.setPosition('left-center')">←</button>
            <div class="grid-empty"></div>
            <button title="右中" @click="toast.setPosition('right-center')">→</button>
            <button title="左下" @click="toast.setPosition('bottom-left')">↙</button>
            <button title="下中" @click="toast.setPosition('bottom-center')">↓</button>
            <button title="右下" @click="toast.setPosition('bottom-right')">↘</button>
          </div>
        </div>
      </section>

      <!-- ==================== 卡片3: Dialog ==================== -->
      <section class="demo-section">
        <h2>Dialog 对话框</h2>
        <div class="demo-group">
          <h3>布局演示</h3>
          <div class="demo-row">
            <button
              @click="($event) => dialog.info({
                title: '居中布局',
                content: '标准模态对话框',
                mousePosition: { x: $event.clientX, y: $event.clientY }
              })"
            >Center</button>
            <button
              @click="($event) => dialog.confirm({
                title: '顶部布局',
                layout: 'top',
                mousePosition: { x: $event.clientX, y: $event.clientY }
              })"
            >Top</button>
          </div>
          <div class="demo-row" style="margin-top: 8px;">
            <button
              @click="($event) => dialog.confirm({
                title: '跟随点击',
                content: 'Popconfirm 模式',
                triggerRect: ($event.currentTarget as HTMLElement).getBoundingClientRect(),
                type: 'warning'
              })"
            >Follow Me</button>
          </div>
        </div>
      </section>

      <!-- ==================== 卡片4: Button 动效 ==================== -->
      <section class="demo-section">
        <h2>Button 交互动效</h2>
        <div class="demo-group">
          <h3>Hover (悬停)</h3>
          <div class="demo-row">
            <Button theme="primary" effect="lift">Lift</Button>
            <Button theme="primary" effect="sheen">Sheen</Button>
            <Button theme="primary" effect="icon-slide" :suffix="ArrowRightIcon">Slide</Button>
          </div>
        </div>
        <div class="demo-group">
          <h3>Active (按压)</h3>
          <div class="demo-row">
            <Button theme="primary" effect="scale">Scale</Button>
            <Button theme="danger" effect="scale">Danger</Button>
            <Button theme="success" effect="sweep">Sweep</Button>
          </div>
        </div>
        <div class="demo-group">
          <h3>Click (点击)</h3>
          <div class="demo-row">
            <Button theme="primary" effect="pulse">Pulse</Button>
            <Button theme="danger" effect="shake">Shake</Button>
            <Button theme="success" effect="ripple">Ripple</Button>
          </div>
        </div>
      </section>

      <!-- ==================== 卡片5: Button 视觉 ==================== -->
      <section class="demo-section">
        <h2>Button 视觉体系</h2>
        <div class="demo-group">
          <h3>主题颜色</h3>
          <div class="demo-row">
            <Button theme="primary" size="small">Pri</Button>
            <Button theme="success" size="small">Suc</Button>
            <Button theme="warning" size="small">War</Button>
            <Button theme="danger" size="small">Err</Button>
          </div>
        </div>
        <div class="demo-group">
          <h3>样式变体</h3>
          <div class="demo-row">
            <Button variant="outline" theme="primary">Outline</Button>
            <Button variant="dashed" theme="primary">Dashed</Button>
            <Button variant="text" theme="primary">Text</Button>
          </div>
        </div>
        <div class="demo-group">
          <h3>图标与形状</h3>
          <div class="demo-row">
            <Button :icon="IconSearch" shape="circle" theme="primary" />
            <Button :icon="IconEdit" shape="square" theme="default" />
            <Button theme="primary" :icon="IconDeviceFloppy">保存</Button>
          </div>
        </div>
      </section>

      <!-- ==================== 卡片6: Button 场景 ==================== -->
      <section class="demo-section">
        <h2>Button 实际场景</h2>
        <div class="demo-group">
          <h3>状态反馈</h3>
          <div class="demo-row">
            <Button theme="primary" :loading="loading" @click="handleSubmit">
              {{ loading ? '...' : '提交' }}
            </Button>
            <Button disabled>禁用</Button>
          </div>
          <div style="margin-top: 8px;">
            <Button theme="primary" block>块级按钮 (Block)</Button>
          </div>
        </div>
        <div class="demo-group">
          <h3>按钮组合</h3>
          <div class="demo-row">
            <ButtonGroup>
              <Button>L</Button>
              <Button>M</Button>
              <Button>R</Button>
            </ButtonGroup>
            <ButtonGroup vertical theme="primary">
              <Button :icon="IconEdit"></Button>
              <Button :icon="IconTrash"></Button>
            </ButtonGroup>
          </div>
        </div>
      </section>

      <!-- ==================== 卡片7: 指南 ==================== -->
      <section class="demo-section">
        <h2>效果选择指南</h2>
        <table class="guide-table">
          <thead>
            <tr>
              <th>效果</th>
              <th>场景</th>
              <th>特点</th>
            </tr>
          </thead>
          <tbody>
            <tr><td><code>lift</code></td><td>卡片</td><td>悬浮升起</td></tr>
            <tr><td><code>sheen</code></td><td>付费</td><td>流光吸引</td></tr>
            <tr><td><code>slide</code></td><td>导航</td><td>图标滑入</td></tr>
            <tr><td><code>scale</code></td><td>通用</td><td>物理按压</td></tr>
            <tr><td><code>pulse</code></td><td>重要</td><td>光环扩散</td></tr>
            <tr><td><code>shake</code></td><td>错误</td><td>否定提醒</td></tr>
          </tbody>
        </table>
      </section>
    </div>

    <ToastProvider />
    <DialogProvider />
  </div>
</template>

<script setup lang="ts">
import { ref, h } from 'vue'
import {
  IconDeviceFloppy,
  IconTrash,
  IconEdit,
  IconSearch,
} from '@tabler/icons-vue'
import ToastProvider from './components/Toast/index.vue'
import { useToast } from './components/Toast/composables/useToast'
import { DialogProvider, useDialog } from './components/Dialog'
import { Button, ButtonGroup } from './components/Button'

const toast = useToast()
const dialog = useDialog()
const loading = ref(false)

// 箭头图标组件
const ArrowRightIcon = () =>
  h(
    'svg',
    {
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    },
    [
      h('line', { x1: '5', y1: '12', x2: '19', y2: '12' }),
      h('polyline', { points: '12 5 19 12 12 19' }),
    ]
  )

// 测试方法
const testUndo = () => {
  toast.success('已移至回收站', {
    duration: 5000,
    action: {
      label: '撤回',
      onClick: () => toast.info('操作已撤销'),
    },
  })
}

const testStack = () => {
  let count = 0
  const timer = setInterval(() => {
    count++
    const types = ['info', 'success', 'warning', 'error'] as const
    toast[types[count % 4]](`堆叠消息 #${count}`)
    if (count >= 5) clearInterval(timer)
  }, 250)
}



const testSaveData = async () => {
  await toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
    loading: '保存中...',
    success: '数据已保存',
    error: '保存失败',
  })
}

const testUploadFail = async () => {
  try {
    await toast.promise(
      new Promise((_, reject) => setTimeout(() => reject(new Error('Fail')), 1500)),
      {
        loading: '上传中...',
        success: '完成',
        error: '网络错误,上传失败',
      }
    )
  } catch (e) {
    /* ignore */
  }
}

const handleSubmit = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 2000)
}
</script>

<style scoped>
.demo-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 0; /* 减少左右padding，交给grid处理 */
  font-family: var(--font-family-base, system-ui, -apple-system, sans-serif);

  --text-primary: #2e3440;
  --text-secondary: #4c566a;
  --color-divider: rgba(0, 0, 0, 0.08);
  --bg-hover: rgba(0, 0, 0, 0.04);
}

.demo-header {
  text-align: center;
  margin-bottom: 30px;
  color: white;
  padding: 0 20px;
}

.demo-header h1 {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 15px rgba(0, 0, 0, 0.2);
}

.demo-header p {
  font-size: 16px;
  opacity: 0.9;
  margin: 0;
}

/* ================== 核心布局 ================== */
.demo-grid {
  /* 强制占满宽度，预留少量边距 */
  width: 100%;
  padding: 0 20px;
  box-sizing: border-box; 
  
  /* 瀑布流核心 */
  column-count: 4;
  column-gap: 20px;
}

.demo-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  
  /* 防止卡片被列断开 */
  break-inside: avoid;
  display: inline-block;
  width: 100%;
  margin-bottom: 20px; /* 垂直间距 */
  vertical-align: top;
  box-sizing: border-box;
}

/* ================== 组件内部样式 ================== */
.demo-section h2 {
  font-size: 16px;
  margin: 0 0 12px 0;
  color: var(--text-primary);
  border-bottom: 1px solid var(--color-divider);
  padding-bottom: 8px;
  font-weight: 700;
}

.demo-group {
  margin-bottom: 14px;
}

.demo-group:last-child {
  margin-bottom: 0;
}

.demo-group h3 {
  font-size: 12px;
  margin: 0 0 6px 0;
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.demo-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

/* 普通测试按钮样式 */
.demo-row button:not(.lime-btn) {
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid var(--color-divider);
  background: white;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.demo-row button:not(.lime-btn):hover {
  background: var(--bg-hover);
  border-color: #667eea;
  color: #667eea;
}

/* 九宫格布局 */
.positions-grid {
  display: grid;
  grid-template-columns: repeat(3, 32px);
  grid-template-rows: repeat(3, 32px);
  gap: 4px;
}

.positions-grid button {
  width: 32px;
  height: 32px;
  padding: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.grid-empty {
  width: 32px;
  height: 32px;
}

/* 指南表格 */
.guide-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.guide-table th,
.guide-table td {
  padding: 6px 4px;
  text-align: left;
  border-bottom: 1px solid var(--color-divider);
}

.guide-table th {
  color: var(--text-secondary);
  font-weight: 600;
}

.guide-table td {
  color: var(--text-primary);
}

.guide-table code {
  background: rgba(0,0,0,0.06);
  padding: 1px 4px;
  border-radius: 3px;
  font-family: monospace;
  color: #d0436d;
}

/* ================== 响应式断点 (优先列数) ================== */

/* 宽屏 & 普通笔记本: 强制 4 列 */
@media (min-width: 1201px) {
  .demo-grid {
    column-count: 4;
  }
}

/* 中等屏幕 (平板横屏/小笔记本): 3 列 */
@media (max-width: 1200px) {
  .demo-grid {
    column-count: 3;
  }
}

/* 平板竖屏: 2 列 */
@media (max-width: 850px) {
  .demo-grid {
    column-count: 2;
  }
}

/* 手机: 1 列 */
@media (max-width: 550px) {
  .demo-grid {
    column-count: 1;
  }
  .demo-header h1 {
    font-size: 32px;
  }
}
</style>

<style>
/* 全局样式覆盖 */
body {
  overflow-y: auto !important;
  padding: 0 !important;
  margin: 0 !important;
  height: auto !important;
}
</style>