# DataBackup 数据备份

## 概述

数据备份与恢复面板，集成历史快照时间轴、配置预设管理和数据同步（DataSync）三大功能板块。通过 `useHistory` 实现设置变更的自动快照保存，支持恢复、锁定、手动保存等操作。

## 目录结构

```
DataBackup/
├── index.vue                # 主组件（板块编排容器）
├── HistoryTimeline.vue      # 历史时间轴（快照列表 + 恢复/删除/锁定）
├── PresetManager.vue        # 配置预设管理（系统/用户预设 + CRUD）
└── SettingsDiffViewer.vue   # 设置差异对比查看器（细粒度导入）
```

## 组件说明

### index.vue 主组件

板块编排容器，组合 HistoryTimeline 和 DataSync 两个功能区域。`onMounted` 时通过 `useHistory().initAutoSaveWatcher()` 启动设置变更的自动快照监听。

### HistoryTimeline 历史时间轴

垂直时间轴展示配置快照历史，支持四种触发类型的视觉区分：

| 触发类型 | 标签 | 圆点颜色 | 说明 |
|----------|------|----------|------|
| `manual` | 手动 | primary | 用户主动保存 |
| `auto` | 自动 | muted | 设置变更自动触发 |
| `restore_point` | 恢复点 | warning | 恢复操作前自动创建 |
| `preset_apply` | 预设 | success | 应用预设时自动创建 |

**操作功能：**
- **恢复**：恢复到指定快照（自动创建恢复点）
- **锁定/解锁**：锁定的快照不会被自动清理
- **删除**：需先解锁才能删除
- **手动保存**：立即创建当前配置快照

### PresetManager 配置预设管理

竖向卡片布局的预设管理器，分为系统预设和用户预设两组：

- **系统预设**：内置不可删除，点击应用
- **用户预设**：支持新建（保存当前配置）、应用、删除
- **Radio 指示器**：当前激活预设高亮显示
- **新建面板**：内联表单（名称 + 描述），slideDown 动画展开

### SettingsDiffViewer 设置差异对比

细粒度配置导入的核心组件，按分类展示当前值与备份值的差异：

- **分类分组**：通过 `settings-meta` 工具按类别（外观/布局/组件等）分组
- **差异高亮**：有差异的项目高亮显示，支持勾选/取消
- **批量操作**：全选差异 / 清空选择
- **Grid 表格**：`checkbox | 名称 | 当前值 → 备份值` 五列布局
- **暴露方法**：`getSelectedKeys()` / `selectAllDiff()` / `clearSelection()`

## 外部依赖

| 依赖 | 用途 |
|------|------|
| `useHistory` (全局 composable) | 快照 CRUD、自动保存监听、恢复/锁定 |
| `usePresets` (全局 composable) | 预设 CRUD、应用预设 |
| `settings-meta` (工具) | 设置项元数据（分类/标签/格式化） |
| `Dialog` (组件) | 恢复/删除确认弹窗 |
| `Button` (组件) | 操作按钮 |
