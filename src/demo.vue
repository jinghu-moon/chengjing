<template>
  <div class="demo-page">
    <div class="demo-header">
      <h1>Lime Tab 组件演示</h1>
      <p>全组件交互与视觉效果测试</p>
    </div>

    <div class="demo-grid">
      <!-- ==================== 卡片1-2: Toast 已注释 ==================== -->
      <!-- Toast 示例已隐藏 -->

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

      <!-- ==================== 卡片4-12: Card 基础卡片 ==================== -->
      <section class="demo-section">
        <h2>Card 基础卡片</h2>
        <div class="demo-group">
          <h3>基础用法</h3>
          <Card title="基础卡片">
            <template #icon><IconFolder :size="18" /></template>
            <p>这是一个基础卡片，支持标题、图标和内容。</p>
          </Card>
        </div>
        <div class="demo-group">
          <h3>带操作按钮</h3>
          <Card title="项目设置" :badge="3" badge-type="primary">
            <template #icon><IconSettings :size="18" /></template>
            <template #actions>
              <button class="action-btn" title="编辑"><IconEdit :size="16" /></button>
              <button class="action-btn" title="删除"><IconTrash :size="16" /></button>
            </template>
            <p>卡片支持徽章、操作按钮等功能。</p>
          </Card>
        </div>
        <div class="demo-group">
          <h3>三种尺寸</h3>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <Card title="Small 尺寸" size="sm">
              <p>紧凑布局，适合列表项。</p>
            </Card>
            <Card title="Medium 尺寸" size="md">
              <p>默认尺寸，适合大多数场景。</p>
            </Card>
            <Card title="Large 尺寸" size="lg">
              <p>宽松布局，适合重要内容。</p>
            </Card>
          </div>
        </div>

        <div class="demo-group">
          <h3>带页签的卡片 (紧凑模式)</h3>
          <Card 
            :tabs="demoTabs" 
            v-model:activeTab="activeTab"
          >
            
            <template #tab0>
              <div style="padding: 4px 0;">
                <div>Content 0</div>
                <div>Content 0</div>
                <div>Content 0</div>
              </div>
            </template>

            <template #tab1>
              <div style="padding: 4px 0;">
                <div>Content 1 - Analysis</div>
                <div>Data Visualization</div>
                <div>Chart Area</div>
                <div>Metrics</div>
                <div>(This tab is taller)</div>
              </div>
            </template>

            <template #tab2>
              <div style="padding: 4px 0;">
                <div>Content 2 - Settings</div>
                <div>Configuration</div>
              </div>
            </template>

            <template #tab3>
              <div style="padding: 4px 0;">
                <div>Content 3 - Logs</div>
              </div>
            </template>
          </Card>
        </div>

        <div class="demo-group">
          <h3>配置预设 (Option Cards)</h3>
          <div style="background: var(--bg-panel-secondary); padding: 24px; border-radius: 12px; width: 400px; max-width: 100%;">
            <div style="margin-bottom: 12px; color: var(--text-secondary); font-size: 13px; font-weight: 500;">
              <span style="display: flex; align-items: center; gap: 6px;">
                 📦 配置预设
              </span>
            </div>
            
            <ContainerGroup :columns="1" v-model="selectedCards" gap="12px">

              <List
                size="md"
                selectable
                :value="1"
                title="极简模式"
                subtitle="专注内容，减少干扰"
              >
                <template #extra>
                  <IconTag :size="16" style="color: var(--text-tertiary)" />
                </template>
              </List>

              <List
                size="md"
                selectable
                :value="2"
                title="标准模式"
                subtitle="平衡功能与简洁"
              >
                <template #extra>
                  <IconTag :size="16" style="color: var(--text-tertiary)" />
                </template>
              </List>

              <List
                size="md"
                selectable
                :value="3"
                title="专注模式"
                subtitle="番茄钟 + 待办，高效工作"
              >
                <template #extra>
                  <IconTag :size="16" style="color: var(--text-tertiary)" />
                </template>
              </List>

              <List
                size="md"
                selectable
                :value="4"
                title="层次"
                subtitle="探索更多层级结构"
              >
                <template #extra>
                  <IconTag :size="16" style="color: var(--text-tertiary)" />
                </template>
              </List>

              <Card
                dashed
                clickable
                hoverable
                size="md"
                @click="console.log('Add new preset')"
              >
                <div style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; color: var(--text-secondary);">
                  <component :is="IconPlus" size="18" stroke-width="2" />
                  <span style="font-size: 14px; font-weight: 500;">新建预设</span>
                </div>
              </Card>



            </ContainerGroup>

            <div style="margin-top: 16px; font-size: 13px; color: var(--text-tertiary); text-align: center;">
              当前选择: 模式 {{ selectedCards }}
            </div>
          </div>

          <!-- Advanced Features -->
          <div class="demo-group" style="margin-top: 32px;">
            <h3>高级特性 (Contextual)</h3>
            
            <div class="demo-row" style="align-items: flex-start; gap: 24px;">
              <!-- 1. Cover Card -->
              <div style="flex: 1; min-width: 240px;">
                <h4 style="margin: 0 0 12px 0;">基础交互 (Clickable)</h4>
                <Card 
                  title="每日推荐" 
                  clickable
                  hoverable
                >
                  <template #extra>
                    <IconStar :size="16" />
                  </template>
                  <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.5;">
                    探索山川湖海，感受自然之美。点击卡片查看详情。
                  </div>
                </Card>
              </div>


            </div>

              <!-- List Layout usage -->
              <div style="margin-top: 24px;">
                <h4 style="margin: 0 0 12px 0;">列表模式 (List)</h4>
                <ContainerGroup :columns="2" gap="12px">
                   <List v-bind="listPresets.default" title="GitHub" subtitle="github.com" :icon="IconFolder" />
                   <List v-bind="listPresets.default" title="GitLab" subtitle="gitlab.com" :icon="IconSettings" />
                   <List v-bind="listPresets.default" title="Stack Overflow" subtitle="stackoverflow.com" :icon="IconShare" />
                   <List v-bind="listPresets.default" title="MDN Web Docs" subtitle="developer.mozilla.org" :icon="IconMail" />
                </ContainerGroup>
              </div>

              <!-- Row Layout (Standard) -->
              <p style="margin: 24px 0 8px; color: var(--text-secondary);">Row 横向布局 (layout="row")</p>
              <Card layout="row" title="Row Layout" :icon="IconSettings" bordered hoverable>
                <div style="color: var(--text-secondary); font-size: 14px;">
                  Row 布局将 Header（图标+标题）置于左侧，Body 内容置于右侧。适合较宽的卡片展示。
                </div>
              </Card>

              <!-- Compact Row Layout -->
              <p style="margin: 12px 0 8px; color: var(--text-secondary);">Compact Row (layout="row" size="sm")</p>
              <ContainerGroup :columns="2" gap="12px">
                 <Card layout="row" size="sm" clickable hoverable title="标准 Row" :icon="IconSettings" />
                 <List v-bind="listPresets.default" title="List 预设" subtitle="Boxed Icon | Text Stack" :icon="IconFolder" />
              </ContainerGroup>
              
              <!-- Grid Layout (Internal) -->
              <p style="margin: 16px 0 8px; color: var(--text-secondary);">Grid 网格布局 (Internal Grid)</p>
              <Card layout="grid" :grid-columns="3" bordered>
                <div style="background: var(--bg-input); padding: 16px; border-radius: 8px;">Cell 1</div>
                <div style="background: var(--bg-input); padding: 16px; border-radius: 8px;">Cell 2</div>
                <div style="background: var(--bg-input); padding: 16px; border-radius: 8px;">Cell 3</div>
              </Card>

              <!-- Responsive CardGroup -->
              <p style="margin: 16px 0 8px; color: var(--text-secondary);">Responsive Group (min-width="180px")</p>
              <div style="resize: horizontal; overflow: hidden; border: 1px dashed var(--border-color); padding: 12px; width: 100%;">
                <ContainerGroup :min-width="150" gap="12px">
                  <Card
                    v-for="i in 5"
                    :key="i"
                    :title="`Card ${i}`"
                    hoverable
                    style="background: var(--bg-surface-soft);" 
                  >
                    <div style="height: 40px; display: flex; align-items: center; color: var(--text-tertiary);">Content...</div>
                  </Card>
                </ContainerGroup>
              </div>
              <p style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">* 拖拽浏览器窗口可查看自适应效果</p>

            </div>
          </div>
      </section>


      <!-- ==================== 卡片13: Collapse 折叠面板 ==================== -->
      <section class="demo-section">
        <h2>Collapse 折叠面板</h2>
        
        <!-- v-model 双向绑定 + 控制面板示例 -->
        <div class="demo-group">
          <h3>v-model 双向绑定 + 控制面板</h3>
          <div class="control-bar">
            <button class="demo-btn demo-btn--primary" @click="expandAllPanels">全部展开</button>
            <button class="demo-btn demo-btn--primary" @click="collapseAllPanels">全部收起</button>
            <span class="status-tag" :class="panel1Expanded ? 'is-expanded' : 'is-collapsed'">
              待办: {{ panel1Expanded ? '已展开' : '已收起' }}
            </span>
            <span class="status-tag" :class="panel2Expanded ? 'is-expanded' : 'is-collapsed'">
              高级: {{ panel2Expanded ? '已展开' : '已收起' }}
            </span>
          </div>
          <ContainerGroup :columns="1">
            <Collapse 
              v-model:expanded="panel1Expanded"
              title="待办清单设置"
              @change="(v: boolean) => console.log('待办清单:', v)"
            >
              <template #icon><IconChecklist :size="18" /></template>
              <div class="feature-list">
                <div class="feature-item">✓ 开启待办清单功能</div>
                <div class="feature-item">✓ 默认折叠清单</div>
                <div class="feature-item">✓ 自动保存到本地存储</div>
                <div class="feature-item">✓ 支持标签分类</div>
              </div>
            </Collapse>
            <Collapse 
              v-model:expanded="panel2Expanded"
              title="高级功能"
            >
              <template #icon><IconSettings :size="18" /></template>
              <div class="feature-list">
                <div class="feature-item">✓ 启用快捷键支持</div>
                <div class="feature-item">✓ 自动备份数据</div>
                <div class="feature-item">✓ 番茄钟集成</div>
                <div class="feature-item">✓ 导出为 Markdown</div>
              </div>
            </Collapse>
            <Collapse 
              title="默认展开示例"
              :default-expanded="true"
            >
              <template #icon><IconPalette :size="18" /></template>
              <p style="margin-bottom: 12px;">这个面板默认是展开状态。</p>
              <p>通过设置 <code>:default-expanded="true"</code> 实现。</p>
            </Collapse>
          </ContainerGroup>
        </div>

        <div class="demo-group">
          <h3>基础用法 + 徽章</h3>
          <ContainerGroup :columns="1">
            <Collapse title="未读消息" :badge="5" badge-type="danger">
              <template #icon><IconMail :size="18" /></template>
              <p>您有 5 条未读消息，点击查看详情。</p>
            </Collapse>
            <Collapse title="已完成任务" :badge="12" badge-type="success">
              <template #icon><IconCheck :size="18" /></template>
              <p>本周完成 12 个任务，完成率 94%。</p>
            </Collapse>
          </ContainerGroup>
        </div>
        <div class="demo-group">
          <h3>手风琴模式</h3>
          <ContainerGroup :columns="1" :accordion="true">
            <Collapse title="选项 A" panel-id="acc-1">
              <p>选项 A 的内容，同时只能展开一个面板。</p>
            </Collapse>
            <Collapse title="选项 B" panel-id="acc-2">
              <p>选项 B 的内容。</p>
            </Collapse>
            <Collapse title="选项 C" panel-id="acc-3">
              <p>选项 C 的内容。</p>
            </Collapse>
          </ContainerGroup>
        </div>
      </section>

      <!-- ==================== 卡片14: Collapse 尺寸与动画 ==================== -->
      <section class="demo-section">
        <h2>Collapse 尺寸与动画</h2>
        <div class="demo-group">
          <h3>三种尺寸</h3>
          <ContainerGroup :columns="1">
            <Collapse title="Small 尺寸" size="sm" :show-switch="false">
              <p>紧凑布局，适合侧边栏。</p>
            </Collapse>
            <Collapse title="Medium 尺寸（默认）" size="md" :show-switch="false">
              <p>标准尺寸，适合大多数场景。</p>
            </Collapse>
            <Collapse title="Large 尺寸" size="lg" :show-switch="false">
              <p>宽松布局，适合重要内容。</p>
            </Collapse>
          </ContainerGroup>
        </div>
        <div class="demo-group">
          <h3>动画效果</h3>
          <ContainerGroup :columns="1">
            <Collapse title="Smooth 平滑" collapse-animation="smooth" :show-switch="false">
              <p>流畅自然的过渡效果 ✨</p>
            </Collapse>
            <Collapse title="Bounce 弹跳" collapse-animation="bounce" :show-switch="false">
              <p>有趣的弹跳效果 🎾</p>
            </Collapse>
            <Collapse title="Elastic 弹性" collapse-animation="elastic" :show-switch="false">
              <p>橡皮筋般的弹性效果 🎪</p>
            </Collapse>
          </ContainerGroup>
        </div>
      </section>

      <!-- ==================== 卡片16: Collapse 布局预设 ==================== -->
      <section class="demo-section">
        <h2>Collapse 布局预设</h2>
        <div class="demo-group">
          <h3>5 种标题栏布局</h3>
          <ContainerGroup :columns="1">
            <Collapse
              title="default: 图标(左) | 标题 | 操作(右) | 开关"
              layout="default"
            >
              <template #actions>
                <button class="action-btn" title="编辑"><IconEdit :size="16" /></button>
                <button class="action-btn" title="删除"><IconTrash :size="16" /></button>
              </template>
              <p>默认布局，图标在左侧，操作按钮在右侧。</p>
            </Collapse>
            <Collapse
              title="icon-right: 标题 | 操作(右) | 图标(右) | 开关"
              layout="icon-right"
            >
              <template #actions>
                <button class="action-btn" title="设置"><IconSettings :size="16" /></button>
              </template>
              <p>图标移至右侧，更突出标题内容。</p>
            </Collapse>
            <Collapse
              title="compact: 图标(左) | 标题 | 开关"
              layout="compact"
            >
              <template #actions>
                <button class="action-btn">这个不会显示</button>
              </template>
              <p>紧凑布局，隐藏操作区，适合简洁场景。</p>
            </Collapse>
            <Collapse
              title="actions-left: 图标(左) | 操作 | 标题 | 开关"
              layout="actions-left"
            >
              <template #actions>
                <button class="action-btn" title="收藏"><IconStar :size="16" /></button>
                <button class="action-btn" title="分享"><IconShare :size="16" /></button>
              </template>
              <p>操作按钮在标题前，适合快捷操作场景。</p>
            </Collapse>
            <Collapse
              title="minimal: 标题 | 开关（无图标无操作）"
              layout="minimal"
            >
              <p>极简布局，仅保留标题和开关。</p>
            </Collapse>
          </ContainerGroup>
        </div>
      </section>

      <!-- ==================== 卡片15: Collapse 嵌套面板 ==================== -->
      <section class="demo-section">
        <h2>Collapse 嵌套面板</h2>
        <div class="demo-group">
          <h3>文件目录结构</h3>
          <Collapse title="项目根目录" :default-expanded="true" :show-switch="false">
            <template #icon><IconFolder :size="18" /></template>
            <div class="cj-collapse-nested-container">
              <Collapse title="src" size="sm" :show-switch="false">
                <template #icon><IconFolderOpen :size="16" /></template>
                <div class="cj-collapse-nested-container">
                  <Collapse title="components" size="sm" :show-switch="false">
                    <template #icon><IconFolderOpen :size="16" /></template>
                    <div class="file-list">
                      <div class="file-item">CollapsePanel.vue</div>
                      <div class="file-item">CollapseGroup.vue</div>
                    </div>
                  </Collapse>
                  <Collapse title="styles" size="sm" :show-switch="false">
                    <template #icon><IconFolderOpen :size="16" /></template>
                    <div class="file-list">
                      <div class="file-item">variables.css</div>
                      <div class="file-item">global.css</div>
                    </div>
                  </Collapse>
                </div>
              </Collapse>
              <Collapse title="public" size="sm" :show-switch="false">
                <template #icon><IconFolderOpen :size="16" /></template>
                <div class="file-list">
                  <div class="file-item">favicon.ico</div>
                  <div class="file-item">logo.png</div>
                </div>
              </Collapse>
            </div>
          </Collapse>
        </div>
        <div class="demo-group">
          <h3>邮箱管理器</h3>
          <ContainerGroup :columns="1">
            <Collapse title="收件箱" :badge="15" badge-type="danger" :default-expanded="true" :show-switch="false">
              <template #icon><IconMail :size="18" /></template>
              <div class="cj-collapse-nested-container">
                <Collapse title="星标邮件" :badge="3" badge-type="warning" size="sm" :show-switch="false">
                  <template #icon><IconStar :size="16" /></template>
                  <p>重要会议通知、项目 deadline 提醒...</p>
                </Collapse>
                <Collapse title="团队邮件" :badge="8" badge-type="info" size="sm" :show-switch="false">
                  <template #icon><IconUsers :size="16" /></template>
                  <p>项目进度更新、代码 Review 请求...</p>
                </Collapse>
              </div>
            </Collapse>
            <Collapse title="已发送" :badge="42" badge-type="success" :show-switch="false">
              <template #icon><IconSend :size="18" /></template>
              <p>本月已发送 42 封邮件</p>
            </Collapse>
          </ContainerGroup>
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
import { ref } from 'vue'
import {
  IconEdit,
  IconTrash,
  IconSettings,
  IconStar,
  IconShare,
  IconFolder,
  IconFolderOpen,
  IconMail,
  IconSend,
  IconUsers,
  IconChecklist,
  IconCheck,
  IconPalette,
  IconPlus,
  IconTag,
} from '@tabler/icons-vue'
import ToastProvider from './components/Toast/index.vue'
import { useToast } from './components/Toast/composables/useToast'
import { DialogProvider, useDialog, Dialog, dialogPresets } from './components/Dialog'
// import { Button, ButtonGroup } from './components/Button'
import { Card, Collapse, List, ContainerGroup, listPresets } from './components/Container'

const toast = useToast()
const dialog = useDialog()
// const loading = ref(false)
const customDialogVisible = ref(false)
const formData = ref({ name: '', email: '' })

// Collapse v-model 双向绑定示例
const panel1Expanded = ref(false)
const panel2Expanded = ref(false)

const expandAllPanels = () => {
  panel1Expanded.value = true
  panel2Expanded.value = true
}

const collapseAllPanels = () => {
  panel1Expanded.value = false
  panel2Expanded.value = false
}

// Card Tabs 示例
import type { CardTab } from './components/Container'
const demoTabs = ref<CardTab[]>([
  { label: 'Tab 0', value: 'tab0' },
  { label: 'Tab 1', value: 'tab1' },
  { label: 'Tab 2', value: 'tab2' },
  { label: 'Tab 3', value: 'tab3' },
])
const activeTab = ref('tab0')
const selectedCards = ref([2])

// 已注释 Toast/Button 相关测试函数
/*
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
    // ignore
  }
}

const handleSubmit = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 2000)
}
*/
</script>

<style scoped>
.demo-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 0; /* 减少左右padding，交给grid处理 */
  font-family: var(--font-family-base, system-ui, -apple-system, sans-serif);
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
  background: var(--bg-panel);
  backdrop-filter: var(--glass-sm);
  border: var(--border-glass);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-md);
  
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

/* ================== Collapse 示例专用样式 ================== */
.control-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding: var(--space-3);
  background: var(--bg-panel);
  border-radius: var(--radius-md);
  border: var(--border-glass);
}

.demo-btn {
  padding: var(--comp-padding-md);
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  transition: var(--transition-base);
}

.demo-btn--primary {
  background-color: var(--color-primary);
  color: white;
}

.demo-btn--primary:hover {
  background-color: var(--color-primary-hover);
}

.status-tag {
  display: inline-block;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
}

.status-tag.is-expanded {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

.status-tag.is-collapsed {
  background-color: var(--bg-input);
  color: var(--text-tertiary);
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.feature-item {
  font-size: var(--text-base);
  color: var(--text-secondary);
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.file-item {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  padding: var(--space-1) 0;
}

code {
  background: var(--bg-input);
  padding: 2px 6px;
  border-radius: var(--radius-xs);
  font-family: var(--font-family-mono);
  font-size: var(--text-sm);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background-color: transparent;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: var(--transition-base);
  font-size: 14px;
}

.action-btn:hover {
  background-color: var(--bg-hover);
}

/* 嵌套容器 */
.cj-collapse-nested-container {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
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