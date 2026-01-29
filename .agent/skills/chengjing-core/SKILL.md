---
name: chengjing-core
description: ChengJing Project Core Development Standards. This is the MASTER skill that aggregates Vue, Vite, Vitest, VueUse, Chrome Extension, and Design System. Always refer to this when starting any coding task in this project.
metadata:
  version: "2.0.0"
  updated: "2026-01-29"
---

# ChengJing Development Standards

This skill is the **Central Truth** for the ChengJing project. It aggregates specific domain skills and defines project-specific rules.

## Project Type

**Desktop Chrome Extension** (Manifest V3) - New Tab replacement with glassmorphism UI.

---

## Skilled Extensions (Active)

The following skills are installed and MUST be followed when their respective domains are touched:

| Skill | Context | Action |
|-------|---------|--------|
| `vue` | Vue Files (`.vue`) | Composition API, `<script setup>`, `defineModel` |
| `vite` | Config (`vite.config.ts`) | Optimize build, assets, plugins |
| `vitest` | Testing (`*.test.ts`) | `vi` utils, snapshot, component testing |
| `vue-best-practices` | QA / Refactoring | Type safety, template errors |
| `vueuse-functions` | Composables | Prefer VueUse over custom |
| `chrome-extension` | Extension APIs / Manifest | **MV3, Service Worker, DNR, CSP** |
| `chengjing-design` | Styling / Components | **Nord + Glassmorphism + Design Tokens** |
| `git-commit` | Commit / Release | Chinese commit, `npm run release "msg"` |
| `web-design-guidelines`| UI Review | Accessibility, design consistency |

---

## Core Stack

- **Framework**: Vue 3 + Vite
- **Platform**: Chrome Extension (Manifest V3)
- **UI**: Nord Color + Glassmorphism + CSS Variables
- **Language**: TypeScript (Strict Mode)
- **Testing**: Vitest + @vue/test-utils

---

## Component Template

All new components MUST follow this structure:

```vue
<script setup lang="ts">
// 1. Imports
import { ref, computed } from 'vue'

// 2. Types & Props
interface Props {
  modelValue?: string
  size?: 'sm' | 'md' | 'lg'
}
const props = withDefaults(defineProps<Props>(), {
  size: 'md'
})

// 3. Model & Emits
const model = defineModel<string>()
const emit = defineEmits<{
  submit: []
}>()

// 4. State & Logic
const state = ref('')

// 5. Methods
const handleSubmit = () => emit('submit')
</script>

<template>
  <div class="component-root">
    <slot />
  </div>
</template>

<style scoped>
.component-root {
  /* Use design tokens, never hardcode */
  background: var(--bg-panel-card);
  backdrop-filter: var(--glass-md);
  border: var(--border-glass);
  border-radius: var(--radius-lg);
  padding: var(--comp-padding-square-md);
  transition: var(--transition-fast);
}
</style>
```

---

## Workflow Triggers

| User Request | Action |
|--------------|--------|
| "Refactor this" | `vue-best-practices` + `chengjing-core` |
| "Fix this bug" | `vitest` to reproduce if possible |
| "Check UI" | `web-design-guidelines` + `chengjing-design` |
| "Add extension feature" | `chrome-extension` MV3 best practices |
| "Style this" | `chengjing-design` token reference |
| "Commit" / "Release" | `git-commit` → `npm run release "msg"` |

---

## Naming Conventions

| Category | Convention | Example |
|----------|------------|---------|
| Components | PascalCase | `DailyPoem.vue` |
| Composables | camelCase + use | `useDailyPoem.ts` |
| Stores | camelCase | `poemStore.ts` |
| CSS Classes | kebab-case | `poem-card` |
| Assets | kebab-case | `icon-refresh.svg` |

---

## Key References

| Topic | Reference |
|-------|-----------|
| Design Tokens | `src/styles/variables.css` |
| MV3 Best Practices | `.agent/skills/chrome-extension/Chrome-Extension-Manifest-V3-Best-Practices.md` |
| UI/UX Checklist | `chengjing-design` Section 13 |
