---
name: chengjing-core
description: ChengJing Project Core Development Standards. This is the MASTER skill that aggregates Vue, Vite, Vitest, TDesign Design System, and Best Practices. Always refer to this when starting any coding task in this project.
metadata:
  version: "2.0.0"
  updated: "2026-01-29"
  design_system: "TDesign"
---

# ChengJing Development Standards

This skill is the **Central Truth** for the ChengJing project. It aggregates specific domain skills and defines project-specific rules based on TDesign design system principles.

## Core Philosophy

ChengJing follows TDesign's four core values:

1. **包容 (Inclusiveness)**: Design for diverse scenarios while maintaining flexibility
2. **多元 (Diversity)**: Embrace multiple solutions and continuous content enrichment
3. **进化 (Evolution)**: Keep pace with trends while maintaining core consistency
4. **连接 (Connection)**: Foster interconnectivity between components and users

## Skilled Extensions (Active)

The following skills are installed and MUST be followed when their respective domains are touched:

| Skill | Context | Action |
|-------|---------|--------|
| `vue` | Vue Files (`.vue`) | Use Composition API, `<script setup>`, `defineModel` |
| `vite` | Config (`vite.config.ts`) | Optimize build, handle assets, configure plugins |
| `vitest` | Testing (`*.test.ts`) | Use `vi` utils, snapshot testing, component testing |
| `vue-best-practices` | QA / Refactoring | Check for type safety, template errors, prop extraction |
| `web-design-guidelines`| UI / Review | Verify design consistency, accessibility, and aesthetics |

## Project Specifics

### 1. Core Stack
- **Framework**: Vue 3 + Vite
- **UI Library**: TDesign Vue Next (Primary), TailwindCSS (Utilities)
- **Language**: TypeScript (Strict Mode)
- **Design System**: TDesign
- **Testing**: Vitest + @vue/test-utils

### 2. Component Structure

All new components MUST follow this template:

```vue
<script setup lang="ts">
// ============================================================================
// 1. IMPORTS
// ============================================================================
import { ref, computed } from 'vue'
import type { ComponentProps } from './types'

// ============================================================================
// 2. TYPES & PROPS
// ============================================================================
interface Props {
  modelValue?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'glass' | 'outlined'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  size: 'md',
  variant: 'default',
  disabled: false
})

// ============================================================================
// 3. MODEL & EMITS
// ============================================================================
const model = defineModel<string>()

const emit = defineEmits<{
  submit: []
  change: [value: string]
}>()

// ============================================================================
// 4. STATE & COMPUTED
// ============================================================================
const internalState = ref<string>('')

const computedClass = computed(() => ({
  'component-disabled': props.disabled,
  [`component-size-${props.size}`]: true,
  [`component-variant-${props.variant}`]: true
}))

// ============================================================================
// 5. METHODS
// ============================================================================
const handleSubmit = () => {
  if (props.disabled) return
  emit('submit')
}

// ============================================================================
// 6. LIFECYCLE (if needed)
// ============================================================================
// onMounted(() => {})
</script>

<template>
  <div :class="computedClass" class="component-root">
    <slot />
  </div>
</template>

<style scoped>
/* ============================================================================
   COMPONENT STYLES - ChengJing Design System
   使用设计令牌，禁止硬编码！
   ============================================================================ */

.component-root {
  /* 颜色 */
  color: var(--text-primary);
  background: var(--bg-container);
  
  /* 边框与圆角 */
  border: var(--border);
  border-radius: var(--radius-md);
  
  /* 过渡动效 */
  transition: var(--transition-base);
  
  /* 字体 */
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}

/* 禁用态 */
.component-disabled {
  opacity: var(--disabled-opacity);
  cursor: not-allowed;
  pointer-events: none;
}

/* 尺寸变体 */
.component-size-xs {
  height: var(--comp-height-xs);
  padding: var(--comp-padding-xs);
  font-size: var(--font-size-xs);
}

.component-size-sm {
  height: var(--comp-height-sm);
  padding: var(--comp-padding-sm);
  font-size: var(--font-size-sm);
}

.component-size-md {
  height: var(--comp-height-md);
  padding: var(--comp-padding-md);
  font-size: var(--font-size-base);
}

.component-size-lg {
  height: var(--comp-height-lg);
  padding: var(--comp-padding-lg);
  font-size: var(--font-size-md);
}

.component-size-xl {
  height: var(--comp-height-xl);
  padding: var(--comp-padding-xl);
  font-size: var(--font-size-lg);
}

/* 外观变体 */
.component-variant-default {
  background: var(--bg-container);
  border: var(--border);
}

.component-variant-glass {
  background: var(--bg-card);
  backdrop-filter: var(--glass-md);
  border: var(--border-glass);
  box-shadow: var(--shadow-md);
}

.component-variant-outlined {
  background: transparent;
  border: var(--border);
}

/* 交互状态 */
.component-root:not(.component-disabled):hover {
  background: var(--bg-hover);
  transform: var(--transform-lift);
  box-shadow: var(--shadow-sm);
}

.component-root:not(.component-disabled):active {
  transform: translateY(0);
  background: var(--bg-active);
}

/* 焦点可见性 (无障碍) */
.component-root:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring-offset-shadow), var(--focus-ring);
}

/* 响应式调整 */
@media (min-width: 768px) {
  .component-root {
    /* 平板及以上可以增加间距 */
  }
}
</style>
```

### 3. Design System Integration

ChengJing 基于 **Nord 色彩系统** + **TDesign 设计理念**，形成独特的设计语言。

#### 3.1 Color System (色彩)

**核心原则：永远使用设计令牌，禁止硬编码！**

```css
/* ❌ WRONG - 硬编码颜色 */
color: #5e81ac;
background: #2e3440;

/* ✅ CORRECT - 使用语义化令牌 */
color: var(--color-primary);
background: var(--bg-container);
```

**设计令牌分层架构：**

1. **Layer 1: 原始色板** (Nord Primitives)
   - `--nord0` ~ `--nord15`: 基础色彩常量
   - **用途**: 仅在定义语义令牌时使用，业务代码禁止直接引用

2. **Layer 2: 语义令牌** (Semantic Tokens)
   - 品牌色: `--color-primary` / `--color-primary-hover` / `--color-primary-active`
   - 功能色: `--color-success` / `--color-warning` / `--color-danger` / `--color-info`
   - 文本色: `--text-primary` / `--text-secondary` / `--text-tertiary` / `--text-placeholder`
   - 背景色: `--bg-page` / `--bg-container` / `--bg-card` / `--bg-elevated`
   - 边框色: `--color-border` / `--color-border-light` / `--color-divider`

3. **Layer 3: 组件令牌** (Component Tokens)
   - `--comp-height-{size}`: 组件高度
   - `--comp-padding-{size}`: 组件内边距
   - `--comp-icon-{size}`: 图标尺寸

**常用颜色速查：**

| 用途 | 令牌 | 值 (Nord) |
|------|------|-----------|
| 主色 | `--color-primary` | #5e81ac (Nord10) |
| 成功 | `--color-success` | #a3be8c (Nord14) |
| 警告 | `--color-warning` | #ebcb8b (Nord13) |
| 危险 | `--color-danger` | #bf616a (Nord11) |
| 主文本 | `--text-primary` | Nord6 @ 95% |
| 次文本 | `--text-secondary` | Nord4 @ 75% |
| 页面背景 | `--bg-page` | #1f232a (Nord Base) |
| 容器背景 | `--bg-container` | Nord0 @ 75% |

#### 3.2 Typography (字体)

**设计原则**: 基于 4px 基线网格 + 1.2 黄金比例

**Font Stack:**
```css
font-family: var(--font-family-base);
/* HarmonyOS Sans SC, PingFang SC, -apple-system, ... */

/* 等宽字体 (代码) */
font-family: var(--font-family-mono);
/* Cascadia Code, JetBrains Mono, Fira Code, ... */
```

**Font Scale (字阶) - 基于 rem:**

| 用途 | 令牌 | 尺寸 | 场景 |
|------|------|------|------|
| 展示文本 | `--font-size-display` | 64px | 大屏展示 |
| 特大标题 | `--font-size-3xl` | 32px | 页面主标题 |
| 大标题 | `--font-size-2xl` | 24px | 区块标题 |
| 标题 | `--font-size-xl` | 20px | 卡片标题 |
| 小标题 | `--font-size-lg` | 18px | 列表标题 |
| 强调文本 | `--font-size-md` | 16px | 重要内容 |
| **正文 (默认)** | `--font-size-base` | **14px** | 普通文本 |
| 次要文本 | `--font-size-sm` | 13px | 辅助信息 |
| 辅助信息 | `--font-size-xs` | 12px | 标签/提示 |

**Font Weight (字重):**
```css
--font-weight-regular: 400;    /* 常规 - 正文 */
--font-weight-medium: 500;     /* 中等 - 强调 */
--font-weight-semibold: 600;   /* 半粗 - 小标题 */
--font-weight-bold: 700;       /* 加粗 - 大标题 */
```

**Line Height (行高):**
```css
--line-height-tight: 1.2;   /* 标题 */
--line-height-base: 1.5;    /* 正文 (推荐) */
--line-height-loose: 1.8;   /* 长文本 */
```

**排版示例:**
```css
/* 页面标题 */
.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--text-primary);
}

/* 正文段落 */
.paragraph {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-base);
  color: var(--text-secondary);
}

/* 辅助信息 */
.caption {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  letter-spacing: var(--letter-spacing-wide);
}
```

#### 3.3 Spacing & Layout (布局)

**设计原则**: 4px 基准单位 + 移动优先响应式

**Spacing System (间距系统):**

```css
/* 基础间距 (4px 递增) */
--space-1: 4px    --space-2: 8px    --space-3: 12px
--space-4: 16px   --space-5: 20px   --space-6: 24px
--space-8: 32px   --space-10: 40px  --space-12: 48px

/* 语义化映射 (推荐使用) */
--spacing-xs: var(--space-1);   /* 4px  - 极小间距 */
--spacing-sm: var(--space-2);   /* 8px  - 小间距 */
--spacing-md: var(--space-4);   /* 16px - 中等间距 */
--spacing-lg: var(--space-6);   /* 24px - 大间距 */
--spacing-xl: var(--space-8);   /* 32px - 超大间距 */
```

**Layout Tokens (布局令牌):**

```css
/* 响应式断点 (与 TailwindCSS 一致) */
--breakpoint-xs: 375px;   /* 小手机 */
--breakpoint-sm: 640px;   /* 大手机 */
--breakpoint-md: 768px;   /* 平板 */
--breakpoint-lg: 1024px;  /* 小桌面 */
--breakpoint-xl: 1280px;  /* 桌面 */
--breakpoint-2xl: 1536px; /* 大屏 */

/* 容器宽度 */
--container-xs: 640px;
--container-md: 1024px;
--container-lg: 1280px;
--container-xl: 1536px;
--container-2xl: 1920px;

/* 内容最大宽度 */
--max-width-content: 1200px;
--max-width-prose: 65ch;  /* 长文本最佳阅读宽度 */
```

**Border Radius (圆角):**
```css
--radius-xs: 2px;     /* 极小圆角 */
--radius-sm: 4px;     /* 小圆角 */
--radius-md: 8px;     /* 中等圆角 (常用) */
--radius-lg: 12px;    /* 大圆角 */
--radius-xl: 16px;    /* 超大圆角 */
--radius-2xl: 24px;   /* 特大圆角 */
--radius-full: 9999px;/* 完全圆角 (胶囊/圆形) */
```

**响应式布局示例:**
```css
/* 移动优先 */
.container {
  padding: var(--spacing-md);
  max-width: 100%;
}

/* 平板 */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-lg);
    max-width: var(--container-md);
    margin: 0 auto;
  }
}

/* 桌面 */
@media (min-width: 1280px) {
  .container {
    padding: var(--spacing-xl);
    max-width: var(--container-lg);
  }
}
```

#### 3.4 Motion & Glassmorphism (动效与玻璃态)

**设计原则 (来自 TDesign):**
1. **理解 (Understanding)**: 动效帮助用户理解内容和操作
2. **聚焦 (Focus)**: 动态内容自然吸引注意力
3. **共情 (Empathy)**: 动效创造情感连接

**Transition Standards (过渡标准):**
```css
/* 持续时间 */
--duration-fast: 0.1s;      /* 快速反馈 (按钮点击) */
--duration-normal: 0.2s;    /* 标准过渡 (默认) */
--duration-slow: 0.3s;      /* 缓慢动画 (面板展开) */
--duration-slower: 0.5s;    /* 更慢动画 (页面切换) */

/* 缓动函数 */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);     /* 平滑过渡 (推荐) */
--ease-smooth: cubic-bezier(0.25, 0.8, 0.25, 1); /* 丝滑过渡 */
--ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);/* 弹性动画 */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* 回弹 */

/* 组合动效令牌 (推荐使用) */
--transition-fast: all var(--duration-fast) var(--ease-out);
--transition-base: all var(--duration-normal) var(--ease-in-out);
--transition-slow: all var(--duration-slow) var(--ease-smooth);
```

**Glassmorphism (玻璃态材质系统) - 核心竞争力:**

ChengJing 的玻璃态基于 **r=2 等比模糊阶梯** + **Nord 色系优化**：

```css
/* 模糊阶梯 (指数级递增) */
--blur-xs: 4px;      /* 极轻微隔离 */
--blur-sm: 8px;      /* 柔和隔离 */
--blur-md: 16px;     /* 标准材质 (推荐) */
--blur-lg: 32px;     /* 显著层级 */
--blur-xl: 64px;     /* 深度背景 */
--blur-2xl: 128px;   /* 极致氛围 */

/* 玻璃态调节参数 (针对 Nord 深色系优化) */
--glass-saturate: 150%;    /* 饱和度提升，找回色彩生命力 */
--glass-brightness: 110%;  /* 亮度提升，创造通透感 */

/* 复合材质令牌 (直接用于 backdrop-filter) */
--glass-xs: blur(4px) saturate(150%) brightness(110%);
--glass-sm: blur(8px) saturate(150%) brightness(110%);
--glass-md: blur(16px) saturate(150%) brightness(110%);
--glass-lg: blur(32px) saturate(150%) brightness(110%);
--glass-xl: blur(64px) saturate(150%) brightness(110%);
```

**使用示例:**
```css
/* 标准玻璃卡片 */
.glass-card {
  background: var(--bg-card);                /* 半透明背景 */
  backdrop-filter: var(--glass-md);          /* 16px 模糊 + 色彩增强 */
  border: var(--border-glass);               /* 玻璃态边框 */
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  transition: var(--transition-base);
}

.glass-card:hover {
  transform: var(--transform-lift);          /* 上浮 2px */
  backdrop-filter: var(--glass-lg);          /* 加强模糊 */
  box-shadow: var(--shadow-lg);
}

/* 按钮悬停效果 */
.button {
  transition: var(--transition-fast);
}

.button:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 4px 8px rgb(from var(--nord0) r g b / 0.15);
}

.button:active {
  transform: translateY(0) scale(0.98);
}
```

**阴影系统:**
```css
--shadow-xs: 0 1px 2px rgb(from var(--nord0) r g b / 0.1);
--shadow-sm: 0 2px 4px rgb(from var(--nord0) r g b / 0.2);
--shadow-md: 0 8px 16px rgb(from var(--nord0) r g b / 0.3);  /* 常用 */
--shadow-lg: 0 16px 48px rgb(from var(--nord0) r g b / 0.5);
--shadow-xl: 0 24px 64px rgb(from var(--nord0) r g b / 0.6);
```

#### 3.5 Component Tokens (组件令牌)

**设计原则**: 语义化命名 + 尺寸一致性

```css
/* 组件高度 */
--comp-height-xs: 24px;   /* 小按钮/输入框 */
--comp-height-sm: 32px;   /* 默认按钮 */
--comp-height-md: 36px;   /* 中等输入框 */
--comp-height-lg: 40px;   /* 大按钮 */
--comp-height-xl: 48px;   /* 超大组件 */

/* 组件内边距 */
--comp-padding-xs: 4px 8px;    /* 小组件 */
--comp-padding-sm: 8px 12px;   /* 默认组件 */
--comp-padding-md: 8px 16px;   /* 中等组件 */
--comp-padding-lg: 12px 20px;  /* 大组件 */
--comp-padding-xl: 16px 24px;  /* 超大组件 */

/* 图标尺寸 */
--comp-icon-xs: 14px;
--comp-icon-sm: 16px;
--comp-icon-md: 18px;
--comp-icon-lg: 24px;   /* 常用 */
--comp-icon-xl: 32px;
```

**使用示例:**
```vue
<template>
  <button class="button-md">
    <Icon :size="var(--comp-icon-lg)" />
    <span>按钮文本</span>
  </button>
</template>

<style scoped>
.button-md {
  height: var(--comp-height-lg);
  padding: var(--comp-padding-md);
  border-radius: var(--radius-md);
}
</style>
```

#### 3.6 Dark Mode Support (暗色模式)

ChengJing **默认为深色设计**，基于 Nord 暗色色板。

如需支持浅色模式，在 `<html>` 添加 `theme-light` 类：

```html
<html class="theme-light">
```

**实现方式:**
```typescript
// composables/useDarkMode.ts
import { ref, watch } from 'vue'

export function useDarkMode() {
  const isDark = ref(true) // 默认深色
  
  const toggleDark = () => {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('theme-light')
  }
  
  return { isDark, toggleDark }
}
```

**注意事项:**
- 色彩对比度必须 ≥ 4.5:1 (WCAG 2.0 AA 标准)
- 避免高饱和度颜色 (视觉"抖动"效应)
- 信息层级在两种模式下保持一致

### 4. File Organization

```
src/
├── components/          # Reusable components
│   ├── common/         # Generic UI components
│   ├── layout/         # Layout components
│   └── business/       # Business-specific components
├── composables/        # Composition API functions
│   ├── useDailyPoem.ts
│   └── useDarkMode.ts
├── stores/             # Pinia stores
│   └── poem.ts
├── views/              # Page components
│   └── DailyPoem.vue
├── assets/             # Static assets
│   ├── images/
│   └── styles/
│       ├── variables.css    # TDesign token overrides
│       └── global.css
└── types/              # TypeScript types
    └── index.ts
```

### 5. Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Components | PascalCase | `DailyPoem.vue`, `PoemCard.vue` |
| Composables | camelCase with `use` prefix | `useDailyPoem.ts`, `useTheme.ts` |
| Stores | camelCase | `poemStore.ts`, `userStore.ts` |
| Types/Interfaces | PascalCase | `PoemData`, `ApiResponse` |
| CSS Classes | kebab-case or BEM | `poem-card`, `poem-card__title` |
| Assets | kebab-case | `background-image.png` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRY` |

### 6. TypeScript Standards

```typescript
// ============================================================================
// ALWAYS use strict typing
// ============================================================================

// ✅ CORRECT - Explicit types
interface PoemData {
  title: string
  author: string
  content: string[]
  dynasty?: string
}

const fetchPoem = async (): Promise<PoemData> => {
  // Implementation
}

// ❌ WRONG - Implicit any
const fetchPoem = async () => {
  // TypeScript can't infer return type
}

// ============================================================================
// Use type guards for runtime safety
// ============================================================================

function isPoemData(data: unknown): data is PoemData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'title' in data &&
    'content' in data
  )
}

// ============================================================================
// Prefer type over interface for unions/intersections
// ============================================================================

type Status = 'idle' | 'loading' | 'success' | 'error'
type PoemWithMeta = PoemData & { fetchedAt: Date }
```

### 7. Testing Standards

#### 7.1 Unit Tests (Vitest)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DailyPoem from '@/components/DailyPoem.vue'

describe('DailyPoem', () => {
  it('renders poem data correctly', () => {
    const wrapper = mount(DailyPoem, {
      props: {
        poem: {
          title: '静夜思',
          author: '李白',
          content: ['床前明月光', '疑是地上霜']
        }
      }
    })
    
    expect(wrapper.text()).toContain('静夜思')
    expect(wrapper.text()).toContain('李白')
  })
  
  it('emits event on refresh click', async () => {
    const wrapper = mount(DailyPoem)
    await wrapper.find('[data-testid="refresh-btn"]').trigger('click')
    
    expect(wrapper.emitted('refresh')).toBeTruthy()
  })
})
```

#### 7.2 Accessibility Testing

MUST verify:
- ✅ Keyboard navigation works
- ✅ ARIA labels are present
- ✅ Color contrast meets WCAG 2.0 AA (4.5:1 minimum)
- ✅ Focus indicators are visible

```vue
<template>
  <button
    aria-label="刷新诗词"
    @click="handleRefresh"
    @keydown.enter="handleRefresh"
  >
    <t-icon name="refresh" />
  </button>
</template>
```

### 8. Performance Guidelines

#### 8.1 Code Splitting

```typescript
// ✅ Lazy load route components
const routes = [
  {
    path: '/poem',
    component: () => import('@/views/DailyPoem.vue')
  }
]
```

#### 8.2 Asset Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'tdesign': ['tdesign-vue-next'],
          'vendor': ['vue', 'vue-router', 'pinia']
        }
      }
    }
  }
})
```

#### 8.3 Image Optimization

```vue
<template>
  <!-- Use modern formats with fallback -->
  <picture>
    <source srcset="/image.avif" type="image/avif">
    <source srcset="/image.webp" type="image/webp">
    <img src="/image.jpg" alt="Description" loading="lazy">
  </picture>
</template>
```

### 9. Workflow Triggers

| User Request | Action |
|--------------|--------|
| "Refactor this" | Apply `vue-best-practices` + `chengjing-core` |
| "Fix this bug" | Use `vitest` to reproduce, then fix |
| "Check UI" | Invoke `web-design-guidelines` + verify TDesign compliance |
| "Add component" | Follow component template + TDesign design tokens |
| "Dark mode" | Implement using TDesign dark mode variables |
| "Optimize performance" | Check lazy loading, code splitting, asset optimization |

### 10. Code Review Checklist

Before submitting code, verify:

**Structure:**
- [ ] Follows component template structure
- [ ] Proper separation of concerns (logic, template, styles)
- [ ] TypeScript types are explicit and correct

**Design System:**
- [ ] Uses TDesign design tokens (no hardcoded colors/sizes)
- [ ] Follows TDesign spacing/typography standards
- [ ] Icons from TDesign icon library
- [ ] Dark mode compatible

**Accessibility:**
- [ ] Keyboard navigable
- [ ] ARIA labels present
- [ ] Color contrast ≥ 4.5:1
- [ ] Focus indicators visible

**Performance:**
- [ ] Components lazy-loaded where appropriate
- [ ] Images optimized and lazy-loaded
- [ ] No unnecessary re-renders

**Testing:**
- [ ] Unit tests written and passing
- [ ] Edge cases covered
- [ ] Accessibility tested

**Documentation:**
- [ ] Component props documented
- [ ] Complex logic has comments
- [ ] README updated if needed

### 11. Common Patterns

#### 11.1 Form Handling

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { FormRule } from 'tdesign-vue-next'

interface FormData {
  username: string
  email: string
}

const formData = ref<FormData>({
  username: '',
  email: ''
})

const rules: Record<keyof FormData, FormRule[]> = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 3, message: '用户名至少3个字符' }
  ],
  email: [
    { required: true, message: '请输入邮箱' },
    { email: true, message: '邮箱格式不正确' }
  ]
}

const handleSubmit = () => {
  // Handle form submission
}
</script>

<template>
  <t-form :data="formData" :rules="rules" @submit="handleSubmit">
    <t-form-item label="用户名" name="username">
      <t-input v-model="formData.username" />
    </t-form-item>
    <t-form-item label="邮箱" name="email">
      <t-input v-model="formData.email" type="email" />
    </t-form-item>
    <t-form-item>
      <t-button type="submit" theme="primary">提交</t-button>
    </t-form-item>
  </t-form>
</template>
```

#### 11.2 Loading States

```vue
<script setup lang="ts">
import { ref } from 'vue'

const loading = ref(false)
const data = ref<any>(null)
const error = ref<Error | null>(null)

const fetchData = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('/api/data')
    data.value = await response.json()
  } catch (e) {
    error.value = e as Error
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <t-loading v-if="loading" text="加载中..." />
    <t-alert v-else-if="error" theme="error" :message="error.message" />
    <div v-else-if="data">
      <!-- Render data -->
    </div>
  </div>
</template>
```

#### 11.3 Responsive Design

```vue
<style scoped>
/* Mobile first approach */
.container {
  padding: var(--td-comp-paddingTB-s);
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: var(--td-comp-paddingTB-m);
  }
}

/* Desktop */
@media (min-width: 1440px) {
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--td-comp-paddingTB-l);
  }
}
</style>
```

### 12. Anti-Patterns (Avoid These!)

#### ❌ Hardcoded Values
```css
/* WRONG - 硬编码颜色、尺寸、数值 */
color: #5e81ac;
font-size: 14px;
padding: 16px;
border-radius: 8px;
transition: all 0.2s;
```

#### ✅ Use Design Tokens
```css
/* CORRECT - 使用设计令牌 */
color: var(--color-primary);
font-size: var(--font-size-base);
padding: var(--spacing-md);
border-radius: var(--radius-md);
transition: var(--transition-base);
```

---

#### ❌ 直接使用原始色板
```css
/* WRONG - 业务代码不应直接使用 --nord{N} */
background: var(--nord0);
color: var(--nord10);
border-color: var(--nord3);
```

#### ✅ 使用语义化令牌
```css
/* CORRECT - 使用语义化颜色 */
background: var(--bg-container);
color: var(--color-primary);
border-color: var(--color-border);
```

---

#### ❌ Mixing Logic in Template
```vue
<!-- WRONG - 模板中混杂复杂逻辑 -->
<template>
  <div v-if="user && user.role === 'admin' && !user.disabled && user.permissions.includes('edit')">
    {{ user.name.toUpperCase() + ' - ' + user.department + ' (' + user.email + ')' }}
  </div>
</template>
```

#### ✅ Extract to Computed
```vue
<script setup lang="ts">
const canEdit = computed(() => 
  user.value?.role === 'admin' && 
  !user.value?.disabled && 
  user.value?.permissions.includes('edit')
)

const userDisplayName = computed(() => {
  if (!user.value) return ''
  const { name, department, email } = user.value
  return `${name.toUpperCase()} - ${department} (${email})`
})
</script>

<template>
  <div v-if="canEdit">{{ userDisplayName }}</div>
</template>
```

---

#### ❌ Prop Mutation
```vue
<script setup lang="ts">
const props = defineProps<{ count: number }>()

// WRONG - 直接修改 prop (Vue 会警告)
const increment = () => {
  props.count++ // ❌ Never mutate props!
}
</script>
```

#### ✅ Use v-model or Emit
```vue
<script setup lang="ts">
// 方案 1: 使用 defineModel (Vue 3.4+)
const count = defineModel<number>()

const increment = () => {
  count.value++
}

// 方案 2: 使用 emit
const props = defineProps<{ count: number }>()
const emit = defineEmits<{ 'update:count': [value: number] }>()

const increment = () => {
  emit('update:count', props.count + 1)
}
</script>
```

---

#### ❌ 忘记玻璃态边框
```css
/* WRONG - 玻璃态卡片缺少边框 */
.glass-card {
  background: var(--bg-card);
  backdrop-filter: var(--glass-md);
  /* ❌ 缺少边框，边缘不清晰 */
}
```

#### ✅ 完整的玻璃态组合
```css
/* CORRECT - 完整的玻璃态材质 */
.glass-card {
  background: var(--bg-card);
  backdrop-filter: var(--glass-md);
  border: var(--border-glass);      /* ✅ 必须的玻璃态边框 */
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);     /* ✅ 增强层次感 */
}
```

---

#### ❌ 无障碍性缺失
```vue
<template>
  <!-- WRONG - 缺少键盘导航和 ARIA 标签 -->
  <div @click="handleClick">
    <Icon name="close" />
  </div>
</template>
```

#### ✅ 完整的无障碍支持
```vue
<template>
  <!-- CORRECT - 语义化 + 键盘支持 + ARIA -->
  <button
    aria-label="关闭对话框"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <Icon name="close" />
  </button>
</template>

<style scoped>
button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring-offset-shadow), var(--focus-ring);
}
</style>
```

---

#### ❌ 响应式断点硬编码
```css
/* WRONG - 硬编码断点值 */
@media (min-width: 768px) {
  .container {
    padding: 24px;
  }
}
```

#### ✅ 使用标准断点
```css
/* CORRECT - 使用设计系统断点 */
@media (min-width: 768px) {  /* 可用 --breakpoint-md，但 CSS 变量不能用于媒体查询 */
  .container {
    padding: var(--spacing-lg);  /* ✅ 使用令牌 */
  }
}

/* 或在 TypeScript 中使用 */
import { breakpoints } from '@/styles/tokens'
// breakpoints.md === '768px'
```

### 13. Git Commit Standards

Use conventional commits format:

```
feat(poem): add daily poem component
fix(ui): correct color contrast in dark mode
docs(readme): update installation instructions
style(button): align with TDesign spacing standards
refactor(composable): extract poem fetching logic
test(poem): add unit tests for PoemCard
chore(deps): update TDesign to v1.5.0
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

### 14. Resources

**Core Documentation:**
- **Vue 3 Documentation**: https://vuejs.org/
- **Vite Documentation**: https://vitejs.dev/
- **Vitest Documentation**: https://vitest.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

**Design Systems:**
- **Nord Color Palette**: https://www.nordtheme.com/
- **TDesign Design Principles**: https://tdesign.tencent.com/ (设计理念参考)

**CSS & Performance:**
- **Modern CSS**: https://web.dev/learn/css/
- **Glassmorphism Generator**: https://hype4.academy/tools/glassmorphism-generator
- **CSS Relative Colors**: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/rgb

**Accessibility:**
- **WCAG 2.0 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **A11y Project**: https://www.a11yproject.com/

**ChengJing Project:**
- **Design Variables**: `/src/styles/variables.css`
- **Component Library**: `/src/components/`
- **Development Skill**: This document (`SKILL.md`)

---

## Quick Reference Card

### Most Common Design Tokens

```css
/* ========================================
   颜色 (Colors)
   ======================================== */
/* 品牌色 */
--color-primary: #5e81ac;           /* Nord10 蓝色 */
--color-primary-hover: #81a1c1;     /* Nord9 */

/* 功能色 */
--color-success: #a3be8c;           /* Nord14 绿色 */
--color-warning: #ebcb8b;           /* Nord13 黄色 */
--color-danger: #bf616a;            /* Nord11 红色 */
--color-info: #4c566a;              /* Nord3 灰蓝 */

/* 文本 */
--text-primary: rgba(236, 239, 244, 0.95);   /* 主文本 */
--text-secondary: rgba(216, 222, 233, 0.75); /* 次文本 */
--text-tertiary: rgba(216, 222, 233, 0.45);  /* 三级文本 */

/* 背景 */
--bg-page: #1f232a;                 /* 页面底色 */
--bg-container: rgba(46, 52, 64, 0.75); /* 容器背景 */
--bg-card: rgba(46, 52, 64, 0.3);   /* 卡片背景 */

/* 边框 */
--border: 1px solid rgba(236, 239, 244, 0.15);
--border-glass: 1px solid rgba(255, 255, 255, 0.08);

/* ========================================
   字体 (Typography)
   ======================================== */
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.8125rem;  /* 13px */
--font-size-base: 0.875rem; /* 14px - 默认 */
--font-size-md: 1rem;       /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */

--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

--line-height-tight: 1.2;   /* 标题 */
--line-height-base: 1.5;    /* 正文 */

/* ========================================
   间距 (Spacing)
   ======================================== */
--spacing-xs: 0.25rem;  /* 4px */
--spacing-sm: 0.5rem;   /* 8px */
--spacing-md: 1rem;     /* 16px - 常用 */
--spacing-lg: 1.5rem;   /* 24px */
--spacing-xl: 2rem;     /* 32px */

/* 组件内边距 */
--comp-padding-sm: 8px 12px;
--comp-padding-md: 8px 16px;
--comp-padding-lg: 12px 20px;

/* ========================================
   圆角 (Border Radius)
   ======================================== */
--radius-sm: 4px;
--radius-md: 8px;       /* 常用 */
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;  /* 胶囊/圆形 */

/* ========================================
   玻璃态材质 (Glassmorphism)
   ======================================== */
/* 直接用于 backdrop-filter 属性 */
--glass-sm: blur(8px) saturate(150%) brightness(110%);
--glass-md: blur(16px) saturate(150%) brightness(110%);  /* 推荐 */
--glass-lg: blur(32px) saturate(150%) brightness(110%);

/* 配合使用 */
background: var(--bg-card);
backdrop-filter: var(--glass-md);
border: var(--border-glass);

/* ========================================
   阴影 (Shadows)
   ======================================== */
--shadow-sm: 0 2px 4px rgba(46, 52, 64, 0.2);
--shadow-md: 0 8px 16px rgba(46, 52, 64, 0.3);  /* 常用 */
--shadow-lg: 0 16px 48px rgba(46, 52, 64, 0.5);

/* ========================================
   动效 (Motion)
   ======================================== */
--duration-fast: 0.1s;
--duration-normal: 0.2s;    /* 默认 */
--duration-slow: 0.3s;

--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-smooth: cubic-bezier(0.25, 0.8, 0.25, 1);
--ease-elastic: cubic-bezier(0.34, 1.56, 0.64, 1);

/* 组合令牌 */
--transition-base: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
--transition-fast: all 0.1s ease-out;

/* ========================================
   组件高度 (Component Heights)
   ======================================== */
--comp-height-xs: 1.5rem;   /* 24px */
--comp-height-sm: 2rem;     /* 32px */
--comp-height-md: 2.25rem;  /* 36px */
--comp-height-lg: 2.5rem;   /* 40px */
--comp-height-xl: 3rem;     /* 48px */

/* ========================================
   层级 (Z-Index)
   ======================================== */
--z-dropdown: 100;
--z-sticky: 200;
--z-nav: 300;
--z-overlay: 500;
--z-modal: 600;
--z-tooltip: 800;
--z-max: 9999;
```

### Component Snippet (VS Code)

Trigger: `cj-component`

```vue
<script setup lang="ts">
interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})
</script>

<template>
  <div class="component-root">
    <slot />
  </div>
</template>

<style scoped>
.component-root {
  /* 颜色 */
  color: var(--text-primary);
  background: var(--bg-container);
  
  /* 间距 */
  padding: var(--comp-padding-md);
  
  /* 边框 */
  border: var(--border);
  border-radius: var(--radius-md);
  
  /* 动效 */
  transition: var(--transition-base);
}

.component-root:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
</style>
```

---

**Remember**: When in doubt, consult TDesign documentation and this skill. Consistency is key to maintaining a high-quality codebase.
