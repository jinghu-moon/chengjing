<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  IconPlus,
  IconGripVertical,
  IconPencil,
  IconTrash,
  IconCheck,
  IconX,
  IconRotate,
  IconWorld,
  IconBrandGoogle,
  IconPaw,
  IconBrandBing,
  IconBrandBilibili,
  IconBrandYoutube,
  IconBrandTiktok,
  IconBrandTwitch,
  IconBrandAmazon,
  IconBrandGithub,
  IconBrandStackoverflow,
  IconBrandReddit,
  IconBrandWikipedia,
  IconBrandOpenai,
} from '@tabler/icons-vue'
import type { Engine } from '../types'
import { useEngines, GROUP_LABELS } from '../composables/useEngines'
import { useDragSort } from '../composables/useDragSort'

const {
  addEngine,
  updateEngine,
  removeEngine,
  resetEngines,
  groupedEngines,
  moveEngine,
  reorderGroup,
} = useEngines()

// ==================== 图标映射 ====================
const ICON_MAP: Record<string, any> = {
  IconBrandGoogle, IconPaw, IconBrandBing, IconBrandBilibili,
  IconBrandYoutube, IconBrandTiktok, IconBrandTwitch, IconBrandAmazon,
  IconBrandGithub, IconBrandStackoverflow, IconBrandReddit,
  IconBrandWikipedia, IconBrandOpenai,
}

function resolveIcon(iconName: string) {
  return ICON_MAP[iconName] ?? IconWorld
}

// ==================== 拖拽排序 ====================
const listRef = ref<HTMLElement | null>(null)

const { handlePointerDown } = useDragSort({
  onMoveEngine: moveEngine,
  onReorderGroup: reorderGroup,
})

function onDragPointerDown(e: PointerEvent, type: 'engine' | 'group', id: string, group: string) {
  const el = (e.currentTarget as HTMLElement)
  if (!listRef.value) return
  handlePointerDown(e, { type, id, group }, el, listRef.value)
}

// ==================== 编辑状态 ====================
const editingId = ref<string | null>(null)
const editForm = ref({ name: '', url: '', bang: '', group: 'uncategorized' })
const isAdding = ref(false)

// 可选分组列表
const groupOptions = computed(() =>
  Object.entries(GROUP_LABELS).map(([key, label]) => ({ key, label }))
)

function startEdit(engine: Engine) {
  editingId.value = engine.id
  editForm.value = {
    name: engine.name,
    url: engine.url,
    bang: engine.bang ?? '',
    group: engine.group ?? 'uncategorized',
  }
  isAdding.value = false
}

function startAdd() {
  editingId.value = null
  editForm.value = { name: '', url: '', bang: '', group: 'uncategorized' }
  isAdding.value = true
}

function cancelEdit() {
  editingId.value = null
  isAdding.value = false
  editForm.value = { name: '', url: '', bang: '', group: 'uncategorized' }
}

function saveEdit() {
  const { name, url, bang, group } = editForm.value
  if (!name.trim() || !url.trim()) return

  const bangVal = bang.trim() || undefined

  if (isAdding.value) {
    addEngine({ name: name.trim(), url: url.trim(), icon: 'IconWorld', bang: bangVal, group })
  } else if (editingId.value) {
    updateEngine(editingId.value, { name: name.trim(), url: url.trim(), bang: bangVal, group })
  }

  cancelEdit()
}

function handleRemove(id: string) {
  removeEngine(id)
  if (editingId.value === id) cancelEdit()
}

function handleReset() {
  resetEngines()
  cancelEdit()
}

const isFormValid = computed(() =>
  editForm.value.name.trim().length > 0 && editForm.value.url.trim().length > 0
)
</script>

<template>
  <div class="engine-manager">
    <!-- 顶部标题栏 -->
    <div class="manager-header">
      <span class="manager-title">管理搜索引擎</span>
      <div class="header-actions">
        <button class="btn-icon btn-add" title="添加引擎" @click="startAdd">
          <IconPlus :size="18" :stroke-width="1.5" />
        </button>
      </div>
    </div>

    <!-- 添加表单 -->
    <div v-if="isAdding" class="edit-form">
      <div class="edit-row">
        <input
          v-model="editForm.name"
          class="edit-input name-input"
          placeholder="引擎名称"
          @keydown.enter="saveEdit"
          @keydown.escape="cancelEdit"
        />
        <input
          v-model="editForm.bang"
          class="edit-input bang-input"
          placeholder="!bang"
          @keydown.enter="saveEdit"
          @keydown.escape="cancelEdit"
        />
      </div>
      <input
        v-model="editForm.url"
        class="edit-input url-input"
        placeholder="搜索 URL（用 %s 代替关键词）"
        @keydown.enter="saveEdit"
        @keydown.escape="cancelEdit"
      />
      <div class="edit-row">
        <select v-model="editForm.group" class="edit-select">
          <option v-for="opt in groupOptions" :key="opt.key" :value="opt.key">
            {{ opt.label }}
          </option>
        </select>
        <div class="edit-actions">
          <button class="btn-icon btn-confirm" :disabled="!isFormValid" @click="saveEdit">
            <IconCheck :size="16" :stroke-width="2" />
          </button>
          <button class="btn-icon btn-cancel" @click="cancelEdit">
            <IconX :size="16" :stroke-width="2" />
          </button>
        </div>
      </div>
    </div>

    <!-- 分组引擎列表 -->
    <div ref="listRef" class="engine-list">
      <template v-for="group in groupedEngines" :key="group.key">
        <!-- 分组标题 -->
        <div
          class="group-header"
          :data-drag-type="'group'"
          :data-drag-id="group.key"
          :data-drag-group="group.key"
          @pointerdown="onDragPointerDown($event, 'group', group.key, group.key)"
        >
          <IconGripVertical :size="14" :stroke-width="1.5" class="group-grip" />
          <span class="group-label">{{ group.label }}</span>
          <span class="group-count">{{ group.engines.length }}</span>
        </div>

        <!-- 该分组下的引擎 -->
        <div
          v-for="engine in group.engines"
          :key="engine.id"
          class="engine-item"
          :data-drag-type="'engine'"
          :data-drag-id="engine.id"
          :data-drag-group="group.key"
        >
          <!-- 编辑模式 -->
          <template v-if="editingId === engine.id">
            <div class="drag-handle disabled">
              <IconGripVertical :size="16" :stroke-width="1.5" />
            </div>
            <div class="engine-icon">
              <component :is="resolveIcon(engine.icon)" :size="20" :stroke-width="1.5" />
            </div>
            <div class="edit-form inline">
              <div class="edit-row">
                <input
                  v-model="editForm.name"
                  class="edit-input name-input"
                  placeholder="名称"
                  @keydown.enter="saveEdit"
                  @keydown.escape="cancelEdit"
                />
                <input
                  v-model="editForm.bang"
                  class="edit-input bang-input"
                  placeholder="!bang"
                  @keydown.enter="saveEdit"
                  @keydown.escape="cancelEdit"
                />
              </div>
              <input
                v-model="editForm.url"
                class="edit-input url-input"
                placeholder="https://..."
                @keydown.enter="saveEdit"
                @keydown.escape="cancelEdit"
              />
              <div class="edit-row">
                <select v-model="editForm.group" class="edit-select">
                  <option v-for="opt in groupOptions" :key="opt.key" :value="opt.key">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </div>
            <div class="edit-actions">
              <button class="btn-icon btn-confirm" :disabled="!isFormValid" @click="saveEdit">
                <IconCheck :size="16" :stroke-width="2" />
              </button>
              <button class="btn-icon btn-cancel" @click="cancelEdit">
                <IconX :size="16" :stroke-width="2" />
              </button>
            </div>
          </template>

          <!-- 展示模式 -->
          <template v-else>
            <div
              class="drag-handle"
              @pointerdown="onDragPointerDown($event, 'engine', engine.id, group.key)"
            >
              <IconGripVertical :size="16" :stroke-width="1.5" />
            </div>
            <div class="engine-icon">
              <component :is="resolveIcon(engine.icon)" :size="20" :stroke-width="1.5" />
            </div>
            <div class="engine-info">
              <div class="engine-name-row">
                <span class="engine-name">{{ engine.name }}</span>
                <span v-if="engine.bang" class="engine-bang">{{ engine.bang }}</span>
              </div>
              <span class="engine-url">{{ engine.url }}</span>
            </div>
            <div class="engine-actions">
              <button class="btn-icon" title="编辑" @click="startEdit(engine)">
                <IconPencil :size="15" :stroke-width="1.5" />
              </button>
              <button
                class="btn-icon btn-danger"
                title="删除"
                @click="handleRemove(engine.id)"
              >
                <IconTrash :size="15" :stroke-width="1.5" />
              </button>
            </div>
          </template>
        </div>
      </template>
    </div>

    <!-- 底部操作栏 -->
    <div class="manager-footer">
      <button class="btn-reset" @click="handleReset">
        <IconRotate :size="14" :stroke-width="1.5" />
        <span>恢复默认</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.engine-manager {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 380px;
  max-width: 480px;
}

/* ==================== 顶部标题栏 ==================== */
.manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.manager-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

/* ==================== 引擎列表 ==================== */
.engine-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 400px;
  overflow-y: auto;
}

.engine-list::-webkit-scrollbar {
  width: 4px;
}

.engine-list::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 2px;
}

/* ==================== 分组标题 ==================== */
.group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  margin-top: 4px;
  cursor: grab;
  border-radius: var(--radius-xs, 4px);
  transition: background 0.15s;
  user-select: none;
}

.group-header:first-child {
  margin-top: 0;
}

.group-header:hover {
  background: var(--bg-hover);
}

.group-header:active {
  cursor: grabbing;
}

.group-grip {
  color: var(--text-tertiary);
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}

.group-header:hover .group-grip {
  opacity: 1;
}

.group-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.group-count {
  font-size: 10px;
  color: var(--text-placeholder);
  margin-left: auto;
}

/* ==================== 引擎条目 ==================== */
.engine-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: var(--radius-sm, 6px);
  transition: all 0.15s ease;
  position: relative;
}

.engine-item:hover {
  background: var(--bg-hover);
}

/* ==================== 拖拽手柄 ==================== */
.drag-handle {
  cursor: grab;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: color 0.15s;
}

.drag-handle:hover {
  color: var(--text-secondary);
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle.disabled {
  opacity: 0.2;
  cursor: default;
}

/* ==================== 引擎图标 ==================== */
.engine-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-secondary);
}

/* ==================== 引擎信息 ==================== */
.engine-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.engine-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.engine-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.engine-bang {
  font-size: 10px;
  font-family: var(--font-family-mono, monospace);
  color: var(--color-primary, #88c0d0);
  background: var(--color-primary-alpha, rgba(136, 192, 208, 0.12));
  padding: 1px 5px;
  border-radius: 3px;
  white-space: nowrap;
  flex-shrink: 0;
  line-height: 1.4;
}

.engine-url {
  font-size: 11px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== 操作按钮 ==================== */
.engine-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}

.engine-item:hover .engine-actions {
  opacity: 1;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-xs, 4px);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-icon:active {
  transform: scale(0.92);
}

.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-icon.btn-danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger, #ef4444);
}

.btn-icon.btn-add {
  color: var(--color-primary, #88c0d0);
}

.btn-icon.btn-add:hover {
  background: var(--color-primary-alpha, rgba(136, 192, 208, 0.15));
}

.btn-icon.btn-confirm {
  color: var(--color-success, #a3be8c);
}

.btn-icon.btn-confirm:hover {
  background: rgba(163, 190, 140, 0.15);
}

.btn-icon.btn-cancel {
  color: var(--text-tertiary);
}

/* ==================== 编辑表单 ==================== */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: var(--bg-hover);
  border-radius: var(--radius-sm, 6px);
}

.edit-form.inline {
  flex: 1;
  min-width: 0;
  margin: 0;
  background: transparent;
  padding: 0;
  gap: 2px;
}

.edit-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.edit-input {
  border: 1px solid transparent;
  border-radius: var(--radius-xs, 4px);
  background: rgba(128, 128, 128, 0.1);
  color: var(--text-primary);
  outline: none;
  transition: all 0.15s;
  padding: 0 4px;
}

.edit-input:focus {
  background: var(--bg-panel-dark);
  border-color: var(--color-primary, #88c0d0);
}

.edit-input::placeholder {
  color: var(--text-placeholder);
}

.name-input {
  flex: 1;
  min-width: 0;
  height: 20px;
  font-size: 13px;
  font-weight: 500;
}

.bang-input {
  width: 60px;
  height: 20px;
  font-size: 11px;
  font-family: var(--font-family-mono, monospace);
  color: var(--color-primary);
}

.url-input {
  width: 100%;
  height: 18px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.url-input:focus {
  color: var(--text-primary);
}

.edit-select {
  height: 24px;
  font-size: 12px;
  border: 1px solid transparent;
  border-radius: var(--radius-xs, 4px);
  background: rgba(128, 128, 128, 0.1);
  color: var(--text-primary);
  outline: none;
  padding: 0 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.edit-select:focus {
  border-color: var(--color-primary, #88c0d0);
}

.edit-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  align-items: center;
}

/* ==================== 底部操作栏 ==================== */
.manager-footer {
  display: flex;
  justify-content: center;
  padding-top: 4px;
  border-top: 1px solid var(--border-divider, rgba(255, 255, 255, 0.06));
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  font-size: 12px;
  border-radius: var(--radius-xs, 4px);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-reset:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.btn-reset:active {
  transform: scale(0.96);
}
</style>
