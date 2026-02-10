---
name: chengjing-design
description: ChengJing Design System Reference. Based on project's src/styles/variables.css. Use when creating components or making styling decisions.
metadata:
  version: "4.3.0"
  updated: "2026-02-10"
  source_of_truth: "src/styles/variables.css"
---

# ChengJing Design System

> **Core Principle**: `src/styles/variables.css` is the ONLY source of truth.

---

## 1. Color System

### Brand & Functional Colors

Each functional color supports **6 states**: base / hover / active / focus / disabled / light

| Usage | Variable | Description |
|-------|----------|-------------|
| **Primary** | `--color-primary` | Brand blue |
| Hover | `--color-primary-hover` | Hover state |
| Active | `--color-primary-active` | Press state |
| Focus | `--color-primary-focus` | Keyboard focus background |
| Disabled | `--color-primary-disabled` | Disabled state |
| Light | `--color-primary-light` | Lightest background |
| Alpha | `--color-primary-alpha` | 20% transparency |
| **Success** | `--color-success` | Green |
| **Warning** | `--color-warning` | Orange/Yellow |
| **Danger** | `--color-danger` | Red |
| **Info** | `--color-info` | Gray |
| **Relax** | `--color-relax` | Cyan |
| **Purple** | `--color-purple` | Festival/celebration |
| Purple BG | `--color-purple-bg` | 20% |
| **Orange** | `--color-orange` | Lieu day/makeup work |
| Orange BG | `--color-orange-bg` | 20% |

> All functional colors (success/warning/danger/info) follow the same 6-state pattern:
> `--color-{name}`, `-hover`, `-active`, `-focus`, `-disabled`, `-light`, `-bg`

### Interactive Element Colors

| Usage | Variable | Description |
|-------|----------|-------------|
| Button text | `--btn-text-color` | Text on colored buttons |
| Control indicator | `--control-indicator` | Switch dots, slider thumbs |

### Text Colors

| Usage | Variable | Opacity |
|-------|----------|---------|
| Primary | `--text-primary` | 95% |
| Secondary | `--text-secondary` | 75% |
| Tertiary | `--text-tertiary` | 45% |
| Placeholder | `--text-placeholder` | 30% |
| Heading | `--text-heading` | Full |
| Heading sub | `--text-heading-sub` | Slightly muted |

### Semantic Text Colors

| Usage | Variable | Description |
|-------|----------|-------------|
| Brand text | `--text-color-brand` | Brand-colored text |
| Link text | `--text-color-link` | Hyperlink color |
| Anti text | `--text-color-anti` | Text on colored backgrounds |

### Background Colors

| Usage | Variable |
|-------|----------|
| Panel | `--bg-panel` |
| Card | `--bg-panel-card` |
| Hover | `--bg-hover` |
| Active | `--bg-active` |
| Select | `--bg-container-select` |
| Input | `--bg-input` |
| Page | `--bg-page` |
| Tag | `--bg-tag` |

### Border Colors

| Usage | Variable |
|-------|----------|
| Glass border | `--color-border-glass` |
| Divider | `--color-divider` |
| Strong border | `--color-border-strong` |

### Scrollbar

| Usage | Variable |
|-------|----------|
| Thumb | `--scrollbar-thumb` |
| Thumb hover | `--scrollbar-thumb-hover` |

### Code Syntax Highlighting

| Usage | Variable |
|-------|----------|
| Foreground | `--code-foreground` |
| Comment | `--code-comment` |
| Keyword | `--code-keyword` |
| Function | `--code-function` |
| String | `--code-string` |
| Variable | `--code-variable` |
| Number | `--code-number` |
| Attribute | `--code-attribute` |
| Inline code | `--code-inline` |

---

## 2. Glass System ✨

**Core Formula**: `blur + saturate(150%) + brightness(110%)`

| Token | Blur | Usage |
|-------|------|-------|
| `--glass-xs` | 4px | Subtle |
| `--glass-sm` | 8px | Soft |
| `--glass-md` | 16px | **Standard** ✓ |
| `--glass-lg` | 32px | Prominent |
| `--glass-xl` | 64px | Deep |

---

## 3. Shadow System

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | 0 1px 2px | Subtle |
| `--shadow-sm` | 0 2px 4px | Light |
| `--shadow-md` | 0 8px 16px | **Standard** ✓ |
| `--shadow-lg` | 0 16px 48px | Elevated |
| `--shadow-xl` | 0 24px 64px | Modal |

---

## 4. Spacing System

### Base Spacing

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |

### Semantic Spacing

| Token | Maps To |
|-------|---------|
| `--spacing-xs` | 4px |
| `--spacing-sm` | 8px |
| `--spacing-md` | 16px |
| `--spacing-lg` | 24px |
| `--spacing-xl` | 32px |

---

## 5. Component Tokens

### Component Height

| Token | Value | Usage |
|-------|-------|-------|
| `--height-xs` | 24px | Small button |
| `--height-sm` | 32px | Default button |
| `--height-md` | 36px | Input |
| `--height-lg` | 40px | Large button |
| `--height-xl` | 48px | Extra large |

### Component Padding - Asymmetric (Buttons/Tags)

| Token | Value |
|-------|-------|
| `--comp-padding-xs` | 4px 8px |
| `--comp-padding-sm` | 8px 12px |
| `--comp-padding-md` | 8px 16px |
| `--comp-padding-lg` | 12px 20px |
| `--comp-padding-xl` | 16px 24px |

### Component Padding - Uniform (Cards/Panels)

| Token | Value |
|-------|-------|
| `--comp-padding-square-xs` | 4px |
| `--comp-padding-square-sm` | 8px |
| `--comp-padding-square-md` | 12px |
| `--comp-padding-square-lg` | 16px |
| `--comp-padding-square-xl` | 24px |

---

## 6. Typography

### Font Size

| Token | Value | Usage |
|-------|-------|-------|
| `--text-xs` | 12px | Helper |
| `--text-sm` | 13px | Secondary |
| `--text-base` | 14px | **Body** ✓ |
| `--text-md` | 16px | Emphasis |
| `--text-lg` | 18px | Subtitle |
| `--text-xl` | 20px | Title |
| `--text-2xl` | 24px | Heading |
| `--text-huge` | 64px | Display |

### Font Weight

| Token | Value |
|-------|-------|
| `--weight-regular` | 400 |
| `--weight-medium` | 500 |
| `--weight-semibold` | 600 |
| `--weight-bold` | 700 |

### Line Height

| Token | Value | Usage |
|-------|-------|-------|
| `--line-tight` | 1.2 | Headings |
| `--line-normal` | 1.5 | Body |
| `--line-loose` | 1.8 | Long text |

### Letter Spacing

| Token | Value |
|-------|-------|
| `--letter-spacing-tight` | -0.02em |
| `--letter-spacing-normal` | 0 |
| `--letter-spacing-wide` | 0.05em |

### Font Shorthand (Composites)

Usage: `font: var(--font-body-md);`

| Token | Weight | Size | Line Height | Usage |
|-------|--------|------|-------------|-------|
| `--font-body-sm` | 400 | 13px | 1.5 | Secondary text |
| `--font-body-md` | 400 | 14px | 1.5 | **Default body** ✓ |
| `--font-body-lg` | 400 | 16px | 1.5 | Large body |
| `--font-title-sm` | 600 | 14px | 1.2 | Small title |
| `--font-title-md` | 600 | 16px | 1.2 | Medium title |
| `--font-title-lg` | 600 | 20px | 1.2 | Large title |
| `--font-headline` | 700 | 24px | 1.2 | Page heading |
| `--font-display` | 700 | 64px | 1.2 | Display text |

---

## 7. Animation

### Duration

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 0.2s | Micro-interaction |
| `--duration-normal` | 0.3s | Standard |
| `--duration-slow` | 0.5s | Large animation |

### Easing

| Token | Usage |
|-------|-------|
| `--ease-linear` | Linear |
| `--ease-in` | Accelerate |
| `--ease-out` | Decelerate |
| `--ease-in-out` | Smooth |
| `--ease-smooth` | Silky (default) |
| `--ease-elastic` | Bouncy |
| `--ease-bounce` | Spring back |

### Transition Composites

| Token | Usage |
|-------|-------|
| `--transition-fast` | Quick transition |
| `--transition-base` | Standard transition |
| `--transition-slow` | Slow transition |
| `--transition-color` | Color only |

---

## 8. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | 2px | Tiny |
| `--radius-sm` | 4px | Button |
| `--radius-md` | 8px | Card |
| `--radius-ml` | 12px | Medium-large |
| `--radius-lg` | 16px | Panel |
| `--radius-xl` | 24px | Large panel |
| `--radius-full` | 9999px | Pill |

---

## 9. Z-Index Layers

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | 1 | Base |
| `--z-nav` | 20 | Navigation |
| `--z-float` | 50 | Floating |
| `--z-widget` | 100 | Widget |
| `--z-panel` | 200 | Panel |
| `--z-dropdown` | 300 | Dropdown |
| `--z-modal` | 500 | Modal |
| `--z-tooltip` | 800 | Tooltip |
| `--z-overlay` | 900 | Overlay |
| `--z-max` | 9999 | Maximum |

---

## 10. Accessibility

| Token | Usage |
|-------|-------|
| `--focus-ring` | Focus ring |
| `--focus-ring-offset-shadow` | Focus offset |
| `--disabled-opacity` | Disabled state (0.5) |

---

## 11. Common Patterns

### Glass Card

```css
.glass-card {
  background: var(--bg-panel-card);
  backdrop-filter: var(--glass-md);
  border: var(--border-glass);
  border-radius: var(--radius-lg);
  padding: var(--comp-padding-square-lg);
}
```

### Button

```css
.button {
  height: var(--height-md);
  padding: var(--comp-padding-md);
  transition: var(--transition-fast);
}
.button:hover {
  transform: var(--btn-hover-lift);
  box-shadow: var(--btn-hover-shadow);
}
```

### Focus Visible

```css
.input:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring-offset-shadow), var(--focus-ring);
}
```

---

## 12. Do's and Don'ts

### ✅ Do

- Always use CSS variables
- Glass panels: start with `--glass-md`
- Buttons: use `--comp-padding-*`
- Cards: use `--comp-padding-square-*`

### ❌ Don't

- Hardcode color values
- Use `--nord*` directly (use semantic vars)
- Mix px and rem
- Create new z-index values

---

## 13. UI/UX Checklist

### Accessibility

- [ ] Contrast ≥ 4.5:1 (text vs background)
- [ ] Focus visible (keyboard Tab shows ring)
- [ ] Click area ≥ 32×32px minimum
- [ ] Semantic HTML (`<button>`, `<a>`)
- [ ] ARIA labels on icon buttons

### Visual Design

- [ ] Colors consistent (semantic vars only)
- [ ] Spacing follows 4px grid
- [ ] Border radius uniform (same level = same radius)
- [ ] Shadow matches z-index (higher = larger shadow)
- [ ] Glass: blur + saturate + brightness

### Interaction Feedback

- [ ] Hover state (color/shadow/position change)
- [ ] Active state (press feedback)
- [ ] Disabled state (`--disabled-opacity` + no pointer)
- [ ] Loading state (spinner for long ops)
- [ ] Animation ≤ 0.5s (avoid user waiting)

### Anti-patterns 🚫

| Problem | Fix |
|---------|-----|
| Icon button no text | Add `aria-label` or tooltip |
| Color only distinction | Add icon/text helper |
| Form no validation | Add error text + red border |
| Modal no close | Add X button + ESC close |
| Link/button mixed | Navigation = link, action = button |
| Too many layers | Flatten, max 3 levels |

---

> **Remember**: This document serves `src/styles/variables.css`.
