# 澄镜 (ChengJing) - AI 协作指南

## 项目概述

Chrome/Firefox 新标签页扩展，基于 Vue 3 + TypeScript + Vite + CRXJS 构建。
采用 Glassmorphism 设计语言和 Nord 色彩系统。

## Skills 配置

### 可调用 Skills

#### Git 提交 (git-commit)
**触发词**: `提交`、`commit`、`release`

遵循规范: `.agent/skills/git-commit/SKILL.md`

输出格式:
```bash
npm run release "<type>(<scope>): <中文描述>"
```

### 知识库 Skills (按需查阅)

| Skill | 路径 | 用途 |
|-------|------|------|
| Vue 3 | `.agent/skills/vue/` | Vue 组件开发参考 |
| Vite | `.agent/skills/vite/` | 构建配置参考 |
| Vitest | `.agent/skills/vitest/` | 单元测试参考 |
| VueUse | `.agent/skills/vueuse-functions/` | Composables 参考 |
| Vue 最佳实践 | `.agent/skills/vue-best-practices/` | 代码规范 |
| Chrome 扩展 | `.agent/skills/chrome-extension/` | MV3 开发参考 |
| 设计规范 | `.agent/skills/chengjing-design/` | 项目设计系统 |
| 核心架构 | `.agent/skills/chengjing-core/` | 项目架构文档 |

## 开发规范

### 代码风格
- 使用 `<script setup lang="ts">` 语法
- Composables 命名: `use<Feature>.ts`
- 组件命名: PascalCase
- CSS: 使用 `variables.css` 中的 Design Tokens，禁止硬编码颜色

### 目录结构
```
src/components/<ComponentName>/
├── index.vue          # 主组件
├── components/        # 子组件
├── composables/       # 逻辑复用
├── types.ts           # 类型定义
└── workers/           # Web Worker (可选)
```

## 常用命令

```bash
npm run dev           # 开发模式
npm run build         # 生产构建
npm run release "msg" # 提交并发布
npm run test          # 运行测试
```
