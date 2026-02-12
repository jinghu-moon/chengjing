# README Template: AI Context Injection for Vue Components

README.md is the primary entry point for AI agents to understand a component. This template defines its structure.

## Section Order

Ordered by AI reasoning priority:

| # | Section | AI Purpose |
|---|---------|------------|
| 1 | Metadata | Quickly identify component type and responsibility |
| 2 | Context | Understand why it exists, what problem it solves, its role in the app |
| 3 | Architecture | Understand internal file structure and data flow (multi-file components) |
| 4 | Interface Schema | Understand interface contract (what can and cannot be changed) |
| 5 | Constraints | Avoid breaking changes |
| 6 | Logic & Behavior | Understand state transitions and decision rules |
| 7 | Dependencies | Assess change impact scope |
| 8 | Patterns | Learn correct usage and composition patterns |

---

## Template

```markdown
# [Component/Module Name]

> **Type**: `Component` | `Composable` | `Module` | `Class`
> **Status**: `Stable` | `Experimental` | `Deprecated`
> **Responsibility**: [Single sentence: core responsibility]

## Context

- **Problem**: Users need [specific requirement]
- **Role**: Responsible for [specific duty] in [page/flow]
- **Split status**: ✅ Focused / ⚠️ Consider splitting
- **Collaborators**: Works with `ComponentA` (provides data), `ComponentB` (consumes events)

## Architecture

> Medium/Complex components only

\```
ComponentName/
├── index.vue              # Main component: assembles sub-components, manages external interface
├── components/
│   ├── Header.vue         # Header rendering
│   └── Content.vue        # Content area, receives slots
├── composables/
│   └── useLogic.ts        # Core business logic, state management
└── types.ts               # Type definitions
\```

**Data flow** (Props down, Events up):

\```
index.vue → useLogic() → state
    ↓ props        ↑ emit
Header.vue    Content.vue
\```

**v-model contract** (if applicable):
- Receives `modelValue` prop
- Emits `update:modelValue` event

## Interface Schema

### Props / Parameters

\```typescript
interface Props {
  id: string               // required
  mode: 'edit' | 'view'   // required, default: 'view'
  config?: ConfigOptions   // optional
}
\```

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `string` | ✓ | — | Unique identifier |
| `mode` | `'edit' \| 'view'` | ✓ | `'view'` | Display mode |
| `config` | `ConfigOptions` | — | `{}` | Override defaults |

### Enum Values

IF parameter accepts enumerated values:

| Value | Behavior |
|-------|----------|
| `'edit'` | Enable form inputs, show save button |
| `'view'` | Disable inputs, hide action buttons |

### Returns / Emits

\```typescript
// Composable returns
interface Returns {
  data: Ref<User | null>
  isLoading: Ref<boolean>
  refresh: () => Promise<void>
}

// Component emits
type Emits = {
  save: [payload: { id: string; data: Record<string, any> }]
  cancel: []
}
\```

### Slots (Vue components only)

| Slot | Props | Purpose |
|------|-------|---------|
| `header` | `{ user: User }` | Custom header |
| `default` | `{ items: Item[] }` | Main content |

## Constraints

AI MUST respect when modifying this component:

**Vue reactivity invariants:**
- MUST NOT mutate props directly
- MUST NOT call async functions inside `computed`
- MUST emit `update:modelValue` when internal state changes

**Business rules:**
- SHOULD debounce user input (300ms)

**Performance:**
- SHOULD use `v-memo` for large lists (1000+ items)

### Error Handling

| Scenario | Condition | Behavior |
|----------|-----------|----------|
| Invalid input | `id` is null | Throw `ValidationError` |
| Network fail | timeout > 5s | Retry 3×, then emit `error` |
| No permission | role != 'admin' | Hide action buttons |

## Logic & Behavior

### State Transitions

\```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading : fetch()
    Loading --> Ready : success
    Loading --> Error : fail
    Error --> Loading : retry()
\```

### Decision Rules

- `IF props.mode == 'view' THEN disable all form inputs`
- `IF !session.token THEN throw AuthError, abort render`
- `showActions = mode == 'edit' AND hasPermission`

### Reactivity Strategy

- **Source**: `ref<User | null>(null)` (minimal state)
- **Derived**: `computed(() => user.value?.displayName ?? 'Guest')`
- **Effects**: `watch(userId, fetchUser)` (async side effects)

## Dependencies

| Type | Package | Purpose |
|------|---------|---------|
| Internal | `@/api/user` | Data fetch |
| Internal | `@/utils/format` | Display formatting |
| External | `vue@^3.2` | Reactivity system |
| Peer | `<ThemeProvider>` | MUST be ancestor component |

## Patterns

Common usage patterns. AI references this section to choose correct composition when writing new code.

### Basic Usage

\```vue
<template>
  <UserProfile :id="userId" mode="edit" @save="handleSave" />
</template>

<script setup lang="ts">
import UserProfile from '@/components/UserProfile/index.vue'

const userId = '12345'
const handleSave = (payload: { id: string; data: any }) => {
  console.log('saved', payload)
}
</script>
\```

### With v-model

\```vue
<UserProfile v-model="formData" />
\```

### With Dialog Composition

\```vue
<Dialog v-model="visible" title="Edit User">
  <UserProfile :id="userId" mode="edit" @save="onSave" />
</Dialog>
\```

### Batch Rendering in List

\```vue
<div v-for="user in users" :key="user.id">
  <UserProfile :id="user.id" mode="view" />
</div>
\```

### ❌ Anti-Patterns

\```vue
<!-- ❌ Missing required prop -->
<UserProfile mode="edit" />
// → Error: id is required

<!-- ❌ Mutating prop directly -->
<script setup>
const props = defineProps<{ user: User }>()
props.user.name = 'new name'  // VIOLATES reactivity invariant
</script>

<!-- ❌ null on required prop -->
<UserProfile :id="null" mode="edit" />
// → Throws ValidationError
\```
```

---

## Complexity Tiers

| Tier | Condition | Include |
|------|-----------|---------|
| Simple | < 100 lines, single file | Metadata + Context + Interface + Constraints + Patterns (basic) |
| Medium | 100–500 lines, 2–5 files | All sections + Architecture diagram |
| Complex | 500+ lines, many files | All sections + Mermaid diagrams + multiple Patterns |
