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
                placement: 'top',
                mousePosition: { x: $event.clientX, y: $event.clientY }
              })"
            >Top</button>
            <button
              @click="($event) => dialog.confirm({
                title: '底部布局',
                placement: 'bottom',
                mousePosition: { x: $event.clientX, y: $event.clientY }
              })"
            >Bottom</button>
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
        <div class="demo-group">
          <h3>自定义内容 (Slot)</h3>
          <div class="demo-row">
            <button @click="customDialogVisible = true">打开表单对话框</button>
          </div>
        </div>
        <div class="demo-group">
          <h3>尺寸预设 & 预设配置</h3>
          <div class="demo-row">
            <button @click="dialog.open({ ...dialogPresets.confirm, title: '确认删除', content: '确定要删除这条记录吗？' })">
              Confirm 预设
            </button>
            <button @click="dialog.open({ ...dialogPresets.alert, title: '提示', content: '操作成功！' })">
              Alert 预设
            </button>
            <button @click="dialog.open({ ...dialogPresets.danger, title: '危险操作', content: '此操作不可恢复！' })">
              Danger 预设
            </button>
          </div>
          <div class="demo-row" style="margin-top: 8px;">
            <button @click="dialog.open({ title: '小尺寸', content: '400px 宽度', size: 'small' })">
              Small (400px)
            </button>
            <button @click="dialog.open({ title: '中等尺寸', content: '600px 宽度', size: 'medium' })">
              Medium (600px)
            </button>
            <button @click="dialog.open({ title: '大尺寸', content: '800px 宽度', size: 'large' })">
              Large (800px)
            </button>
          </div>
        </div>
      </section>

      <!-- ==================== 卡片4: Button 完整主题 ==================== -->
      <section class="demo-section">
        <h2>Button 完整主题色</h2>
        <div class="demo-group">
          <h3>Base 变体</h3>
          <div class="demo-row">
            <Button theme="default">Default</Button>
            <Button theme="primary">Primary</Button>
            <Button theme="success">Success</Button>
            <Button theme="warning">Warning</Button>
            <Button theme="danger">Danger</Button>
          </div>
        </div>
        <div class="demo-group">
          <h3>Outline 变体</h3>
          <div class="demo-row">
            <Button theme="default" variant="outline">Default</Button>
            <Button theme="primary" variant="outline">Primary</Button>
            <Button theme="success" variant="outline">Success</Button>
            <Button theme="warning" variant="outline">Warning</Button>
            <Button theme="danger" variant="outline">Danger</Button>
          </div>
        </div>
        <div class="demo-group">
          <h3>Text 变体</h3>
          <div class="demo-row">
            <Button theme="default" variant="text">Default</Button>
            <Button theme="primary" variant="text">Primary</Button>
            <Button theme="success" variant="text">Success</Button>
            <Button theme="warning" variant="text">Warning</Button>
            <Button theme="danger" variant="text">Danger</Button>
          </div>
        </div>
      </section>

      <!-- ==================== 卡片5: Button 尺寸形状 ==================== -->
      <section class="demo-section">
        <h2>Button 尺寸与形状</h2>
        <div class="demo-group">
          <h3>三种尺寸</h3>
          <div class="demo-row">
            <Button theme="primary" size="small">Small</Button>
            <Button theme="primary" size="medium">Medium</Button>
            <Button theme="primary" size="large">Large</Button>
          </div>
        </div>
        <div class="demo-group">
          <h3>四种形状</h3>
          <div class="demo-row">
            <Button theme="primary" shape="rectangle">Rectangle</Button>
            <Button theme="primary" shape="round">Round</Button>
            <Button theme="primary" shape="square" :icon="IconSearch" />
            <Button theme="primary" shape="circle" :icon="IconEdit" />
          </div>
        </div>
        <div class="demo-group">
          <h3>Ghost 模式</h3>
          <div class="demo-row" style="background: #667eea; padding: 8px; border-radius: 4px;">
            <Button theme="primary" ghost>Ghost</Button>
            <Button theme="success" ghost variant="outline">Outline</Button>
            <Button theme="danger" ghost variant="dashed">Dashed</Button>
          </div>
        </div>
      </section>

      <!-- ==================== 卡片6: Button 动效 Hover ==================== -->
      <section class="demo-section">
        <h2>Button 动效 - Hover</h2>
        <div class="demo-group">
          <h3>Icon Slide (图标滑入)</h3>
          <div class="demo-row">
            <Button theme="primary" effect="icon-slide" :suffix="ArrowRightIcon">下一步</Button>
            <Button theme="success" effect="icon-slide" :suffix="ArrowRightIcon">继续</Button>
          </div>
        </div>
      </section>

      <!-- ==================== 卡片7: Button 动效 Click ==================== -->
      <section class="demo-section">
        <h2>Button 动效 - Click</h2>
        <div class="demo-group">
          <h3>Ripple (水波纹)</h3>
          <div class="demo-row">
            <Button theme="primary" effect="ripple">Ripple</Button>
            <Button theme="success" effect="ripple">点击我</Button>
          </div>
        </div>
        <div class="demo-group">
          <h3>Sweep (斜向填充)</h3>
          <div class="demo-row">
            <Button theme="primary" effect="sweep">Sweep</Button>
            <Button theme="success" effect="sweep">确认</Button>
          </div>
        </div>
      </section>

      <!-- ==================== 卡片8: Button 动效 Active ==================== -->
      <section class="demo-section">
        <h2>Button 动效 - Active</h2>
        <div class="demo-group">
          <h3>Scale (按压缩放)</h3>
          <div class="demo-row">
            <Button theme="primary" effect="scale">Scale</Button>
            <Button theme="danger" effect="scale">删除</Button>
            <Button theme="success" effect="scale">确认</Button>
          </div>
        </div>
      </section>

      <!-- ==================== 卡片9: Button 图标组合 ==================== -->
      <section class="demo-section">
        <h2>Button 图标组合</h2>
        <div class="demo-group">
          <h3>前置图标</h3>
          <div class="demo-row">
            <Button theme="primary" :icon="IconDeviceFloppy">保存</Button>
            <Button theme="success" :icon="IconSearch">搜索</Button>
            <Button theme="danger" :icon="IconTrash">删除</Button>
          </div>
        </div>
        <div class="demo-group">
          <h3>后置图标</h3>
          <div class="demo-row">
            <Button theme="primary" :suffix="ArrowRightIcon">下一步</Button>
            <Button theme="default" :suffix="ArrowRightIcon">继续</Button>
          </div>
        </div>
        <div class="demo-group">
          <h3>纯图标按钮</h3>
          <div class="demo-row">
            <Button theme="primary" shape="circle" :icon="IconSearch" />
            <Button theme="success" shape="circle" :icon="IconEdit" />
            <Button theme="danger" shape="circle" :icon="IconTrash" />
            <Button theme="default" shape="square" :icon="IconDeviceFloppy" />
          </div>
        </div>
      </section>

      <!-- ==================== 卡片10: Button 状态 ==================== -->
      <section class="demo-section">
        <h2>Button 状态</h2>
        <div class="demo-group">
          <h3>Loading 加载</h3>
          <div class="demo-row">
            <Button theme="primary" :loading="loading" @click="handleSubmit">
              {{ loading ? '提交中...' : '提交' }}
            </Button>
            <Button theme="success" :loading="true">加载中</Button>
          </div>
        </div>
        <div class="demo-group">
          <h3>Disabled 禁用</h3>
          <div class="demo-row">
            <Button theme="primary" disabled>Primary</Button>
            <Button theme="success" disabled>Success</Button>
            <Button theme="danger" disabled>Danger</Button>
          </div>
        </div>
        <div class="demo-group">
          <h3>Block 块级</h3>
          <div style="margin-top: 8px;">
            <Button theme="primary" block>块级按钮 (100% 宽度)</Button>
          </div>
        </div>
      </section>

      <!-- ==================== 卡片11: Button 链接 ==================== -->
      <section class="demo-section">
        <h2>Button 链接与标签</h2>
        <div class="demo-group">
          <h3>链接按钮 (href)</h3>
          <div class="demo-row">
            <Button theme="primary" href="https://github.com" target="_blank">GitHub</Button>
            <Button theme="success" href="#demo" variant="outline">锚点链接</Button>
          </div>
        </div>
        <div class="demo-group">
          <h3>自定义标签</h3>
          <div class="demo-row">
            <Button theme="primary" tag="div">Div 标签</Button>
            <Button theme="default" tag="span">Span 标签</Button>
          </div>
        </div>
      </section>

      <!-- ==================== 卡片12: ButtonGroup ==================== -->
      <section class="demo-section">
        <h2>ButtonGroup 按钮组</h2>
        <div class="demo-group">
          <h3>水平按钮组</h3>
          <div class="demo-row">
            <ButtonGroup>
              <Button>Left</Button>
              <Button>Middle</Button>
              <Button>Right</Button>
            </ButtonGroup>
          </div>
          <div class="demo-row" style="margin-top: 8px;">
            <ButtonGroup theme="primary">
              <Button>选项 1</Button>
              <Button>选项 2</Button>
              <Button>选项 3</Button>
            </ButtonGroup>
          </div>
        </div>
        <div class="demo-group">
          <h3>垂直按钮组</h3>
          <div class="demo-row">
            <ButtonGroup vertical theme="primary">
              <Button :icon="IconEdit">编辑</Button>
              <Button :icon="IconTrash">删除</Button>
              <Button :icon="IconDeviceFloppy">保存</Button>
            </ButtonGroup>
            <ButtonGroup vertical>
              <Button :icon="IconEdit"></Button>
              <Button :icon="IconTrash"></Button>
              <Button :icon="IconDeviceFloppy"></Button>
            </ButtonGroup>
          </div>
        </div>
        <div class="demo-group">
          <h3>不同尺寸</h3>
          <div class="demo-row">
            <ButtonGroup size="small">
              <Button>S1</Button>
              <Button>S2</Button>
              <Button>S3</Button>
            </ButtonGroup>
            <ButtonGroup size="large" theme="success">
              <Button>L1</Button>
              <Button>L2</Button>
            </ButtonGroup>
          </div>
        </div>
      </section>

    </div>

    <ToastProvider />
    <!-- 自定义内容对话框 -->
    <Dialog
      v-model="customDialogVisible"
      title="用户信息"
      type="info"
      :showCancelBtn="true"
      okText="提交"
      cancelText="取消"
      @positive-click="() => { toast.success('表单已提交'); formData = { name: '', email: '' } }"
    >
      <div style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);">姓名</label>
          <input
            v-model="formData.name"
            type="text"
            placeholder="请输入姓名"
            style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary);"
          />
        </div>
        <div>
          <label style="display: block; margin-bottom: 8px; font-size: 14px; color: var(--text-secondary);">邮箱</label>
          <input
            v-model="formData.email"
            type="email"
            placeholder="请输入邮箱"
            style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary);"
          />
        </div>
      </div>
    </Dialog>

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
import { DialogProvider, useDialog, Dialog, dialogPresets } from './components/Dialog'
import { Button, ButtonGroup } from './components/Button'

const toast = useToast()
const dialog = useDialog()
const loading = ref(false)
const customDialogVisible = ref(false)
const formData = ref({ name: '', email: '' })

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