# 数据备份 V1.2 实现计划

> 版本：1.2
> 状态：设计阶段
> 创建日期：2026-01-31

## 1. 功能概述

V1.2 在 V1.1 智能合并的基础上，增加**设置项细粒度控制**能力：

| 功能 | V1.0 | V1.1 | V1.2 |
|------|------|------|------|
| 全量导出 | ✅ | ✅ | ✅ |
| 覆盖恢复 | ✅ | ✅ | ✅ |
| 数据合并 | ❌ | ✅ | ✅ |
| 设置差异预览 | ❌ | 仅显示数量 | **逐项对比** |
| 选择性导入设置 | ❌ | 全选/全不选 | **逐项勾选** |

### 1.1 核心需求

1. **设置差异可视化**
   - 以表格形式展示每个配置项的「当前值 vs 备份值」
   - 高亮显示有差异的项
   - 支持按分类折叠/展开

2. **选择性导入**
   - 用户可勾选需要导入的配置项
   - 提供「全选/全不选/仅选差异项」快捷操作
   - 实时预览勾选后的最终配置

3. **配置项分类**
   - 将 40+ 个设置项按功能分组，提升可读性
   - 分类：显示控制、布局参数、搜索栏、番茄钟、便签、图标样式等

---

## 2. 架构设计

### 2.1 模块划分

```
src/
├── utils/
│   ├── backup-diff.ts          # [扩展] 增加 settings 逐项对比
│   └── settings-metadata.ts    # [新增] 设置项元数据（分类、标签、类型）
├── composables/
│   └── useDataBackup.ts        # [扩展] 增加 performSelectiveSettingsRestore
└── components/
    └── DataBackup/
        ├── index.vue           # 主入口
        ├── SettingsDiffTable.vue   # [新增] 设置差异表格组件
        └── SettingsDiffRow.vue     # [新增] 单行差异展示
```

### 2.2 数据流

```
┌─────────────────────────────────────────────────────────────┐
│                      用户选择备份文件                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  analyzeBackup() 生成 DiffResult                            │
│  - poems/todos/notes: 同 V1.1                               │
│  - settings: 扩展为 SettingsDiffItem[]                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  SettingsDiffTable 渲染差异表格                              │
│  - 按分类分组显示                                            │
│  - 用户勾选需要导入的项                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  performSelectiveSettingsRestore(selectedKeys)              │
│  - 仅写入用户选中的配置项                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 核心数据结构

### 3.1 设置项元数据

```typescript
// src/utils/settings-metadata.ts

export interface SettingMeta {
  key: string
  label: string           // 中文标签
  category: SettingCategory
  type: 'boolean' | 'number' | 'string' | 'select'
  options?: { value: any; label: string }[]  // select 类型的选项
}

export type SettingCategory =
  | 'display'      // 显示控制
  | 'layout'       // 布局参数
  | 'searchBar'    // 搜索栏
  | 'pomodoro'     // 番茄钟
  | 'notePad'      // 便签
  | 'todo'         // 待办
  | 'folder'       // 文件夹
  | 'wallpaper'    // 壁纸
  | 'icon'         // 图标样式

export const SETTING_CATEGORIES: Record<SettingCategory, string> = {
  display: '显示控制',
  layout: '布局参数',
  searchBar: '搜索栏',
  pomodoro: '番茄钟',
  notePad: '便签',
  todo: '待办事项',
  folder: '文件夹',
  wallpaper: '壁纸',
  icon: '图标样式'
}

// 完整的设置项元数据映射
export const SETTINGS_META: SettingMeta[] = [
  // 显示控制
  { key: 'showClock', label: '显示时钟', category: 'display', type: 'boolean' },
  { key: 'showShortcuts', label: '显示快捷方式', category: 'display', type: 'boolean' },
  { key: 'showTodo', label: '显示待办', category: 'display', type: 'boolean' },
  { key: 'showNotePad', label: '显示便签', category: 'display', type: 'boolean' },
  { key: 'showSearchBar', label: '显示搜索栏', category: 'display', type: 'boolean' },
  { key: 'showCalculator', label: '显示计算器', category: 'display', type: 'boolean' },
  { key: 'showDailyPoem', label: '显示每日诗词', category: 'display', type: 'boolean' },
  // ... 其他配置项
]
```

### 3.2 扩展的差异结果

```typescript
// src/utils/backup-diff.ts 扩展

export interface SettingDiffItem {
  key: string
  label: string
  category: SettingCategory
  currentValue: any
  backupValue: any
  hasDiff: boolean
}

export interface DiffResultV2 extends DiffResult {
  settingsDetailed: SettingDiffItem[]  // V1.2 新增
}
```

---

## 4. UI 设计

### 4.1 设置差异表格

```
┌─────────────────────────────────────────────────────────────┐
│  设置项对比                                    [全选] [清空]  │
├─────────────────────────────────────────────────────────────┤
│  ▼ 显示控制 (3 项差异)                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ☑ 显示时钟      │  true   │  false  │  ← 有差异高亮     ││
│  │ ☐ 显示待办      │  true   │  true   │                   ││
│  │ ☑ 显示便签      │  false  │  true   │  ← 有差异高亮     ││
│  └─────────────────────────────────────────────────────────┘│
│  ▶ 布局参数 (0 项差异)  [折叠状态]                           │
│  ▼ 番茄钟 (1 项差异)                                         │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ☑ 工作时长      │  25 分钟 │  30 分钟 │  ← 有差异高亮    ││
│  │ ☐ 休息时长      │  5 分钟  │  5 分钟  │                  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 4.2 交互流程

```
Step 1: 选择文件 → 解析校验
           │
           ▼
Step 2: 差异预览面板
        ├── 数据统计 (poems/todos/notes) - 同 V1.1
        └── 设置差异表格 - V1.2 新增
           │
           ▼
Step 3: 用户勾选 → 确认导入
           │
           ▼
Step 4: 结果报告
```

---

## 5. 第三方库评估

### 5.1 候选库

| 库名 | 用途 | 包大小 | 评估 |
|------|------|--------|------|
| `deepmerge` | 深度对象合并 | 1.2KB | ❌ 设置为扁平结构，无需深度合并 |
| `deep-equal` | 深度相等比较 | 2.1KB | ❌ JSON.stringify 比较足够 |
| `diff-merge` | 3-way merge | 15KB | ❌ 过于复杂，不需要 3-way |
| `Mergely` | 交互式 diff UI | 200KB+ | ❌ 太重，且为文本 diff |

### 5.2 结论

**推荐：原生 JavaScript 实现**

理由：
1. Settings/IconConfig 均为**扁平键值对**，无深层嵌套
2. 比较逻辑简单：`JSON.stringify(a) !== JSON.stringify(b)`
3. 合并逻辑简单：`Object.assign(target, selectedKeys)`
4. 避免引入额外依赖，保持包体积最小化

---

## 6. 实现清单

### Phase 1: 元数据层 (Day 1)

- [ ] 创建 `src/utils/settings-metadata.ts`
- [ ] 定义所有设置项的元数据（key, label, category, type）
- [ ] 导出分类常量和元数据查询函数

### Phase 2: Diff 引擎扩展 (Day 1)

- [ ] 扩展 `backup-diff.ts` 的 `diffSettings` 函数
- [ ] 返回 `SettingDiffItem[]` 而非简单的 `diffKeys`
- [ ] 添加单元测试

### Phase 3: UI 组件 (Day 2)

- [ ] 创建 `SettingsDiffTable.vue` 组件
- [ ] 实现分类折叠/展开
- [ ] 实现勾选状态管理
- [ ] 实现「全选/清空/仅选差异」快捷操作

### Phase 4: 恢复逻辑 (Day 2)

- [ ] 在 `useDataBackup.ts` 添加 `performSelectiveSettingsRestore`
- [ ] 仅写入用户选中的配置项
- [ ] 保持现有的安全快照机制

### Phase 5: 集成测试 (Day 3)

- [ ] 端到端测试：导出 → 修改设置 → 导入部分设置
- [ ] 边界测试：空备份、版本不匹配、大数据量
- [ ] UI 测试：键盘导航、响应式布局

---

## 7. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 设置项过多导致 UI 臃肿 | 用户体验差 | 默认折叠无差异分类，仅展开有差异项 |
| 新增设置项未同步元数据 | 显示为「未知配置」 | 添加 fallback 显示，CI 检查元数据完整性 |
| 部分导入导致配置不一致 | 功能异常 | 添加「推荐组合」提示，如布局参数建议一起导入 |

---

## 8. 后续迭代 (V1.3+)

- **配置预设**：保存/加载用户自定义配置预设
- **云同步**：通过 Chrome Sync API 同步配置
- **配置历史**：本地保存最近 N 次配置快照，支持回溯
