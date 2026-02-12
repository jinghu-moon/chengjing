# 澄镜 (ChengJing) - AI 协作指南

## 项目概述

Chrome/Firefox 新标签页扩展，基于 Vue 3 + TypeScript + Vite + CRXJS 构建。
采用 Glassmorphism 设计语言和 Nord 色彩系统。

## Skills 配置

### 可调用 Skills

#### 变更日志 (changelog)
**触发词**: `记录变更`、`记一下`、`log`、`changelog`、`变更日志`

遵循规范: `.agent/skills/changelog/SKILL.md`

以功能为粒度记录变更，输出到 `change-log.txt`。支持查看、合并（同日期/跨日期）、清空。

#### Git 提交 (git-commit)
**触发词**: `提交`、`commit`、`release`

遵循规范: `.agent/skills/git-commit/SKILL.md`

**changelog 联动**:
- 触发时自动检测 `change-log.txt`，默认基于日志生成 commit message（Enter=确认 / n=跳过）
- 多 scope 按文件数排序推荐，单键选择
- 支持 brief（默认）/ verbose（`详细提交`，附文件列表，上限 15 条）两种输出模式
- 提交成功后提示清空日志

输出格式:
```bash
npm run release "<type>(<scope>): <中文描述>"
```

#### 代码理解 (code-understanding)
**触发词**: `编写文档 <路径>`、`更新文档 <路径>`、`理解 <路径>`

遵循规范: `.agent/skills/code-understanding/SKILL.md`

三种操作模式:

| 操作 | 前提条件 | 行为 | 副作用 |
|------|---------|------|--------|
| 编写文档 | README.md 不存在 | 分析代码 → 创建 README.md | 创建文件 |
| 更新文档 | README.md 已存在 | 分析代码 → 更新 README.md | 修改文件 |
| 理解 | — | 分析源码（+ 交叉参考 README） → 输出 JSON | 只读 |

智能检测: 若只说"更新 \<路径\>"不指定操作:
- README 存在 → 执行"更新文档"
- README 不存在 → 执行"编写文档"

README.md 核心作用: 不是人类文档，是 AI Agent 的上下文注入载体。包含 Context / Architecture / Interface Schema / Constraints / State Logic / Dependencies / Patterns。复杂度自适应: Simple (< 100 行) / Medium (100-500 行) / Complex (500+ 行)。

#### 上下文工程 (context-zh)
**触发词**: `省token`、`压缩上下文`、`优化上下文`、`太长了`、`为什么忘了`

遵循规范: `.agent/skills/context-zh/SKILL.md`

中文触发词转换层，映射到 context-engineering-fundamentals 插件。

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
