---
name: chrome-extension-development
description: Expert guidelines for Chrome extension development with Manifest V3, covering security, performance, and best practices
metadata:
  version: "2.0.0"
  updated: "2026-01-29"
---

# Chrome Extension Development

Expert guidelines for Chrome extension development with Manifest V3.

> **Key Reference**: `Chrome-Extension-Manifest-V3-Best-Practices.md` in this directory provides technical details.

## Code Style and Structure

- Write clear, modular TypeScript code with proper type definitions
- Follow functional programming patterns; refrain from using classes
- Use descriptive variable names (e.g., `isLoading`, `hasPermission`)
- Structure files logically: `popup`, `background`, `content`, `utils`
- Implement proper error handling and logging
- Document code with JSDoc comments

## Architecture and Best Practices

- **Strictly follow Manifest V3 specifications**
- **Service Worker**: Use for background logic (event-driven, non-persistent)
- **Permissions**: Follow principle of least privilege (`activeTab` > `host_permissions`)
- **Build**: Use Vite/Webpack for hot reload and bundling
- **State**: Use `chrome.storage` instead of `localStorage` (which is unavailable in SW)

## 6 Major Security Rules

1. **No Remote Code**: Do not use `eval()` or remote scripts (CDN). Bundle everything.
2. **CSP**: Configure Content Security Policy correctly (`script-src 'self'`).
3. **XSS Prevention**: Validate all inputs; use `textContent` over `innerHTML`.
4. **Message Validation**: Verify `sender.tab` and usage context in `onMessage`.
5. **Least Privilege**: Only request permissions you absolutely need.
6. **Offscreen Documents**: Use for DOM parsing/audio, not background pages.

## Performance Optimization

- **Lazy Load**: Import modules only when needed in Service Worker.
- **Keep-Alive**: Use `chrome.alarms` for scheduled tasks (min 30s).
- **Storage**: Prefer `chrome.storage.local` (10MB) over `sync` (100KB) for large data.
- **DNR**: Use `declarativeNetRequest` static rules for blocking/redirecting network.

## UI and UX (Manifest V3)

- **Side Panel**: Prefer `chrome.sidePanel` over complex Popups for persistent UI.
- **Action**: Use `chrome.action` (merges browser/page actions).
- **Design**: Follow Material Design or Project Design System (Nord + Glassmorphism).
- **Feedback**: Provide visual feedback for all async operations.

## Testing and Publishing

- **Debug**: Use `chrome://extensions` to inspect Service Workers.
- **Test**: Automated tests with Vitest; manual QA in fresh profile.
- **Publish**: Prepare privacy policy; submit for review with detailed permission justifications.

## Output Expectations

- Provide clear, working code examples (MV3 compliant)
- Include necessary error handling
- Follow security best practices
- Ensure cross-browser compatibility
- Write maintainable and scalable code
