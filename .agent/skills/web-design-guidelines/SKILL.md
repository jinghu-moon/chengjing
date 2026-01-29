---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  version: "2.0.0"
  updated: "2026-01-29"
  source: "Vercel Web Interface Guidelines (internalized)"
---

# Web Interface Guidelines

Review files for compliance with web interface best practices.

---

## 1. Focus States

- Interactive elements need visible focus: `focus-visible:ring-*` or equivalent
- Never `outline-none` without focus replacement
- Use `:focus-visible` over `:focus` (avoid focus ring on click)
- Group focus with `:focus-within` for compound controls

## 2. Forms

- Inputs need `autocomplete` and meaningful `name`
- Use correct `type` (`email`, `tel`, `url`, `number`) and `inputmode`
- Never block paste (`onPaste` + `preventDefault`)
- Labels clickable (`htmlFor` or wrapping control)
- Disable spellcheck on emails/codes/usernames (`spellCheck={false}`)
- Submit button stays enabled until request starts; spinner during request
- Errors inline next to fields; focus first error on submit
- Placeholders end with `…` and show example pattern
- Warn before navigation with unsaved changes (`beforeunload` or router guard)

## 3. Animation

- Honor `prefers-reduced-motion` (provide reduced variant or disable)
- Animate `transform`/`opacity` only (compositor-friendly)
- Never `transition: all` — list properties explicitly
- Set correct `transform-origin`
- Animations interruptible — respond to user input mid-animation

## 4. Typography

- `…` not `...`
- Curly quotes `"` `"` not straight `"`
- Non-breaking spaces: `10 MB`, `⌘ K`, brand names
- Loading states end with `…`: `"Loading…"`, `"Saving…"`
- `font-variant-numeric: tabular-nums` for number columns
- Use `text-wrap: balance` or `text-pretty` on headings (prevents widows)

## 5. Content Handling

- Text containers handle long content: `truncate`, `line-clamp-*`, or `break-words`
- Flex children need `min-w-0` to allow text truncation
- Handle empty states — don't render broken UI for empty strings/arrays
- Anticipate short, average, and very long user inputs

## 6. Images

- `<img>` needs explicit `width` and `height` (prevents CLS)
- Below-fold images: `loading="lazy"`
- Above-fold critical images: `priority` or `fetchpriority="high"`
- Images need `alt` (or `alt=""` if decorative)
- Decorative icons need `aria-hidden="true"`

## 7. Performance

- Large lists (>50 items): virtualize
- No layout reads in render (`getBoundingClientRect`, `offsetHeight`)
- Batch DOM reads/writes; avoid interleaving
- Prefer uncontrolled inputs; controlled inputs must be cheap per keystroke
- Add `<link rel="preconnect">` for CDN/asset domains
- Critical fonts: `<link rel="preload">` with `font-display: swap`

## 8. Navigation & State

- URL reflects state — filters, tabs, pagination in query params
- Links use `<Link>` / `<a>` (Cmd/Ctrl+click support)
- Deep-link all stateful UI
- Destructive actions need confirmation modal or undo — never immediate

## 9. Touch & Interaction

- `touch-action: manipulation` (prevents double-tap zoom delay)
- `-webkit-tap-highlight-color` set intentionally
- `overscroll-behavior: contain` in modals/drawers/sheets
- During drag: disable text selection, `inert` on dragged elements
- `autoFocus` sparingly — desktop only, single primary input

## 10. Safe Areas & Layout

- Full-bleed layouts need `env(safe-area-inset-*)` for notches
- Avoid unwanted scrollbars: `overflow-x-hidden` on containers
- Flex/grid over JS measurement for layout

## 11. Dark Mode & Theming

- `color-scheme: dark` on `<html>` for dark themes (fixes scrollbar, inputs)
- `<meta name="theme-color">` matches page background
- Native `<select>`: explicit `background-color` and `color` (Windows dark mode)

## 12. Locale & i18n

- Dates/times: use `Intl.DateTimeFormat` not hardcoded formats
- Numbers/currency: use `Intl.NumberFormat`
- Detect language via `Accept-Language` / `navigator.languages`, not IP

## 13. Hydration Safety

- Inputs with `value` need `onChange` (or use `defaultValue` for uncontrolled)
- Date/time rendering: guard against hydration mismatch
- `suppressHydrationWarning` only where truly needed

## 14. Hover & Interactive States

- Buttons/links need `hover:` state (visual feedback)
- Interactive states increase contrast: hover/active/focus more prominent

## 15. Content & Copy

- Active voice: "Install the CLI" not "The CLI will be installed"
- Title Case for headings/buttons (Chicago style)
- Numerals for counts: "8 deployments" not "eight"
- Specific button labels: "Save API Key" not "Continue"
- Error messages include fix/next step, not just problem
- Second person; avoid first person
- `&` over "and" where space-constrained

---

## 16. Anti-patterns 🚫

Flag these issues:

| Anti-pattern | Fix |
|--------------|-----|
| `user-scalable=no` / `maximum-scale=1` | Allow zoom |
| `onPaste` + `preventDefault` | Allow paste |
| `transition: all` | List specific properties |
| `outline-none` without focus-visible | Add focus ring |
| `onClick` navigation without `<Link>` | Use Link/anchor |
| `<div>` / `<span>` with click handler | Use `<button>` |
| Images without dimensions | Add width/height |
| Large arrays `.map()` without virtualization | Virtualize |
| Form inputs without labels | Add `<label>` |
| Icon buttons without `aria-label` | Add aria-label |
| Hardcoded date/number formats | Use `Intl.*` |
| `autoFocus` without justification | Remove or justify |

---

## Output Format

When reviewing files, use this format:

```text
## src/Button.tsx

src/Button.tsx:42 - icon button missing aria-label
src/Button.tsx:18 - input lacks label
src/Button.tsx:55 - animation missing prefers-reduced-motion

## src/Modal.tsx

src/Modal.tsx:12 - missing overscroll-behavior: contain

## src/Card.tsx

✓ pass
```

- State issue + location
- Skip explanation unless fix non-obvious
- No preamble
