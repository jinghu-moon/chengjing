---
name: code-understanding
description: "Three operations for AI context injection via README.md. Write (编写文档): analyze code → create README.md for components without one. Update (更新文档): analyze code → update existing README.md. Read (理解): analyze source code (+ cross-reference README if exists) → output structured JSON. Triggers on '编写文档 <path>', '更新文档 <path>', '理解 <path>'. Smart detection: bare '更新 <path>' auto-routes based on README.md existence. Supports Vue 3 components, composables, modules, and TypeScript files."
---

# Code Understanding

## Purpose

README.md = AI Agent's context injection carrier.

```
AI Agent workflow:
  1. Receive user request → modify a component
  2. Read README.md → build mental model
     - Component responsibility and boundaries
     - Interface contracts (props/emits/slots/returns)
     - Constraints and invariants
  3. Read source code → locate modification points
  4. Modify code → respect contracts declared in README
```

README.md quality directly determines whether AI can:
- Understand component boundaries and interface contracts (Interface Schema)
- Respect immutable constraints (Constraints)
- Understand state transition logic (Logic & Behavior)
- Assess change impact scope (Dependencies)
- Learn correct usage and composition patterns (Patterns)

---

## Required Knowledge Skills

When performing `编写文档` or `更新文档`, MUST consult these knowledge skills for accurate analysis:

| Skill | Path | Consult When |
|-------|------|-------------|
| Vue 3 | `.agent/skills/vue/` | Component patterns, Composition API, reactivity |
| Vite | `.agent/skills/vite/` | Build config, plugin usage, env variables |
| Vitest | `.agent/skills/vitest/` | Test patterns, mocking, coverage |
| Vue Best Practices | `.agent/skills/vue-best-practices/` | Typing, props extraction, template safety |
| VueUse | `.agent/skills/vueuse-functions/` | Composable identification, function usage |

**Rule:** Read relevant skill references BEFORE writing/updating README.md to ensure documented patterns align with project conventions.

---

## Trigger

```
Input: "[编写文档|更新文档|理解] <path>"
```

| Trigger | Precondition | Operation | Side Effects |
|---------|-------------|-----------|--------------|
| `编写文档` | README.md MUST NOT exist | Analyze code → Create README.md | Creates file |
| `更新文档` | README.md MUST exist | Analyze code → Update README.md | Modifies file |
| `理解` | — | Analyze code (+ README if exists) → Output structured JSON | NONE (read-only) |

**Smart detection**: If user says `更新 <path>` without specifying operation:
- IF README.md exists → execute `更新文档`
- IF README.md absent → execute `编写文档`

---

## Operation: 编写文档 (Write)

### Precondition
- Target path MUST NOT contain README.md
- IF README.md exists → abort, suggest `更新文档`

### Steps

1. Read all code files at target path
2. Analyze: interfaces, types, dependencies, state logic, constraints
3. Determine complexity tier
4. Generate README.md per `references/readme_template.md`
5. Apply writing rules per `references/writing_style.md`
6. Save to `<path>/README.md`

### Output

```
Created <path>/README.md
Complexity: [Simple|Medium|Complex]
Sections: Metadata / Context / Architecture / Interface / Constraints / Logic / Deps / Patterns
```

---

## Operation: 更新文档 (Update)

### Precondition
- README.md MUST exist at target path
- IF absent → abort, suggest `编写文档`

### Steps

1. Read existing README.md → parse current structure
2. Read all code files at target path
3. Compare: code reality vs README documentation
4. Identify outdated sections (changed interfaces, new constraints, modified logic)
5. Update ONLY outdated sections, preserve accurate content
6. Apply writing rules per `references/writing_style.md`
7. Save updated README.md

### Update Rules

- Preserve structure and formatting style
- MUST NOT regenerate unchanged sections (git-friendly diffs)
- New interface → update Interface Schema section
- Logic changes → update Logic & Behavior section
- Deprecated features → mark as `deprecated` in Patterns
- Complexity tier increase → add missing sections

### Output

```
Updated <path>/README.md
Changes:
  - Interface: Added 2 new props
  - Constraints: Updated validation rule
  - Patterns: Marked Pattern 3 as deprecated
```

---

## Operation: 理解 (Read)

### Precondition
- No precondition (works with or without README.md)

### Steps

1. Read all code files at target path (source code is the ground truth)
2. IF README.md exists → read and cross-reference
3. Analyze: interfaces, types, dependencies, state logic, constraints
4. Output structured JSON

### Output Schema

```json
{
  "path": "src/components/SearchBar",
  "type": "VueComponent | Composable | Module | Class",
  "summary": "Single sentence: core responsibility.",
  "context": {
    "problem": "Users need [specific requirement]",
    "role": "Responsible for [specific duty] in [page/flow]",
    "collaborators": ["ComponentA (provides data)", "ComponentB (consumes events)"]
  },
  "architecture": {
    "files": {
      "index.vue": "Main component: assembles sub-components, manages external interface",
      "composables/useLogic.ts": "Core business logic"
    },
    "data_flow": "index.vue → useLogic() → state → sub-components"
  },
  "interfaces": {
    "props": {},
    "emits": [],
    "returns": {},
    "slots": []
  },
  "params": [
    { "name": "id", "type": "string", "required": true, "default": null, "description": "..." }
  ],
  "constraints": [
    "MUST NOT mutate props directly",
    "MUST emit update:modelValue for v-model contract"
  ],
  "state_logic": [
    "IF mode == 'view' THEN disable all inputs",
    "showSave = (isLoggedIn AND hasEditPerm) OR isAdmin"
  ],
  "dependencies": {
    "internal": ["@/composables/useAuth"],
    "external": ["vue@^3.2"],
    "peer": ["<ThemeProvider> MUST be ancestor"]
  },
  "errors": [
    { "scenario": "id is null", "type": "ValidationError", "behavior": "throw" }
  ],
  "patterns": {
    "basic": "<SearchBar v-model=\"query\" />",
    "advanced": "With slot composition",
    "anti_patterns": ["<SearchBar :query=\"null\" />"]
  },
  "deprecated": []
}
```

### Constraints

- MUST NOT modify files (read-only operation)
- IF source code diverges significantly from README.md → ask user whether to execute `更新文档`
- After output, signal readiness for Q&A about the component

---

## Complexity Tiers

| Tier | Condition | Sections |
|------|-----------|----------|
| Simple | < 100 lines, single file | Metadata + Context + Interface + Constraints + Patterns (basic) |
| Medium | 100–500 lines, 2–5 files | All 8 sections + Architecture diagram |
| Complex | 500+ lines, many files | All 8 sections + Mermaid diagrams + multiple Patterns |

---

## References

- `references/readme_template.md`: README structure template with Vue component context
- `references/writing_style.md`: AI-first writing principles (OpenAI + Anthropic patterns + Vue best practices)
