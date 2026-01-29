# Chrome Extension Manifest V3 Best Practices

> **Purpose**: Technical reference for `chrome-extension` skill.
> **Source**: Synthesized from `Manifest-v3-best-practices/` directory (5 docs).

---

## 0. Manifest Structure Template

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0",
  "description": "Extension description",
  
  "icons": {
    "16": "icons/icon-16.png",
    "32": "icons/icon-32.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  
  "action": {
    "default_popup": "popup.html",
    "default_icon": { "32": "icons/icon-32.png" },
    "default_title": "Click to open"
  },
  
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["https://example.com/*"],
  
  "content_scripts": [{
    "matches": ["https://example.com/*"],
    "js": ["content-script.js"]
  }],
  
  "web_accessible_resources": [{
    "resources": ["images/*.png"],
    "matches": ["https://example.com/*"]
  }]
}
```

### Key Fields

| Field | Required | Notes |
|-------|----------|-------|
| `manifest_version` | ✅ | Must be `3` |
| `name` | ✅ | Max 45 characters |
| `version` | ✅ | Semantic versioning |
| `action` | ⚠️ | Replaces `browser_action` / `page_action` |
| `background.service_worker` | ⚠️ | Replaces `background.scripts` |
| `background.type` | ❌ | Set `"module"` for ES Modules |
| `host_permissions` | ❌ | MV3: Separate from `permissions` |

### web_accessible_resources (MV3 Format)

```javascript
// ❌ MV2 format (not supported)
{ "web_accessible_resources": ["image.png"] }

// ✅ MV3 format (must specify matches)
{
  "web_accessible_resources": [{
    "resources": ["images/*.png"],
    "matches": ["https://example.com/*"]
  }]
}

// Usage in Content Script
const imgURL = chrome.runtime.getURL('images/icon.png');
```

---

## 1. Core Paradigm Shift

| MV2 Thinking | MV3 Thinking |
|--------------|--------------|
| Persistent background page | Event-driven Service Worker |
| Memory persistence | Storage persistence (`chrome.storage`) |
| Blocking webRequest | Declarative declarativeNetRequest |
| Remote code execution allowed | All code must be bundled locally |

---

## 2. Service Worker Lifecycle

### Termination Conditions
- 30 seconds idle
- Single request > 5 minutes
- Fetch response > 30 seconds

### Keep-Alive Methods

```javascript
// ✅ Use Alarms (min 30s, Chrome 117+)
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });

// ✅ WebSocket connection (stays alive while active)
// ✅ Native Messaging (exempt from 5-min timeout)
```

### Golden Rule

```javascript
// ✅ Register all listeners at top-level synchronously
chrome.runtime.onInstalled.addListener(handleInstall);
chrome.runtime.onMessage.addListener(handleMessage);

// ❌ Registering in async callbacks may fail
chrome.storage.local.get('config', () => {
  chrome.tabs.onUpdated.addListener(...); // May not work
});
```

---

## 3. State Persistence

### Storage API Selection

| API | Capacity | Notes |
|-----|----------|-------|
| `chrome.storage.local` | 10MB | Local persistence |
| `chrome.storage.sync` | 100KB | Cross-device sync |
| `chrome.storage.session` | 10MB | Session-level, survives SW restart (Chrome 102+) |

```javascript
// ❌ Not available in Service Worker
localStorage.setItem('key', 'value');

// ✅ Use chrome.storage
await chrome.storage.local.set({ key: 'value' });
```

---

## 4. Offscreen Documents (Chrome 109+)

**Purpose**: Access DOM when Service Worker cannot.

```json
{ "permissions": ["offscreen"] }
```

```javascript
// Create Offscreen Document
await chrome.offscreen.createDocument({
  url: 'offscreen.html',
  reasons: ['DOM_PARSER'], // or 'AUDIO_PLAYBACK', 'CLIPBOARD'
  justification: 'Parse HTML'
});

// Close when done
await chrome.offscreen.closeDocument();
```

---

## 5. Permission Minimization

### Priority Order

```javascript
// ✅ Best: activeTab (no warning, temporary access on user action)
{ "permissions": ["activeTab"] }

// ⚠️ Second: Specific domains
{ "host_permissions": ["https://example.com/*"] }

// ❌ Avoid: All URLs
{ "host_permissions": ["<all_urls>"] } // Triggers scary warning
```

### Optional Permissions

```javascript
// Request at runtime
const granted = await chrome.permissions.request({
  permissions: ['downloads']
});
```

---

## 6. declarativeNetRequest (DNR)

### Permission Comparison

| Permission | Warning | Requires host_permissions |
|------------|---------|---------------------------|
| `declarativeNetRequest` | ⚠️ Yes | ❌ |
| `declarativeNetRequestWithHostAccess` | ✅ No | ✅ Yes |

### Rule Limits

- Static rules: Global quota (tens of thousands)
- Dynamic + Session rules: ≤ 5000
- Regex rules: ≤ 1000

---

## 7. Content Security Policy (CSP)

### Default Values

```
# Chrome 88-120
script-src 'self'; object-src 'self';

# Chrome 121+ (WASM support)
script-src 'self' 'wasm-unsafe-eval'; object-src 'self';
```

### Forbidden

```json
// ❌ Not allowed
{ "content_security_policy": {
    "extension_pages": "script-src 'self' 'unsafe-eval'"
  }
}
```

---

## 8. Script Injection

### Dynamic Registration (Chrome 96+)

```javascript
await chrome.scripting.registerContentScripts([{
  id: "my-script",
  matches: ["https://example.com/*"],
  js: ["content.js"],
  persistAcrossSessions: true
}]);
```

### Execution World

| World | Purpose |
|-------|---------|
| `ISOLATED` | Default, DOM access, no page JS access |
| `MAIN` | Access page `window` object (dangerous) |

---

## 9. Security Guidelines

```javascript
// ❌ Remote code forbidden
fetch('https://cdn.com/script.js')
  .then(r => r.text())
  .then(eval); // Strictly forbidden

// ❌ XSS risk
element.innerHTML = userInput;

// ✅ Safe approach
element.textContent = userInput;
import DOMPurify from './vendor/dompurify.js';
element.innerHTML = DOMPurify.sanitize(userInput);
```

---

## 10. 2026 New Features

### AI-Native Architecture (Gemini Nano)

```javascript
// Local inference, data never leaves device
const result = await window.ai.prompt("Summarize: " + text);
```

### User Scripts API

```javascript
// Execute user-provided code (only legal exception)
await chrome.userScripts.register([{
  id: 'user-script-1',
  matches: ['https://*/*'],
  js: [{ code: userProvidedCode }]
}]);
```

### Side Panel

```javascript
// Replaces complex popup as main UI
chrome.sidePanel.setOptions({
  tabId: tab.id,
  path: 'sidepanel.html'
});
```

---

## 11. MV2 → MV3 Migration Quick Reference

| MV2 | MV3 |
|-----|-----|
| `background.scripts` | `background.service_worker` |
| `background.persistent` | Removed |
| `browser_action` / `page_action` | `action` |
| `tabs.executeScript()` | `scripting.executeScript()` |
| `webRequestBlocking` | `declarativeNetRequest` |
| `permissions: ["<all_urls>"]` | `host_permissions: ["<all_urls>"]` |

---

## 12. Version Compatibility

| Chrome Version | Feature Added |
|----------------|---------------|
| 88 | MV3 Baseline |
| 96 | Dynamic Content Scripts |
| 102 | `storage.session` |
| 109 | Offscreen Documents |
| 116 | SW Lifecycle Improvements |
| 117 | Alarms min 30s |
| 121 | CSP WASM Support |

---

## 13. Message Validation

```javascript
// ✅ Validate messages from Content Script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Verify sender is from a tab
  if (!sender.tab) {
    console.warn('Message not from a tab');
    return;
  }
  
  // Validate data type and length
  if (typeof msg.data !== 'string' || msg.data.length > 1000) {
    console.warn('Invalid data');
    return;
  }
  
  // Process message
  processMessage(msg.data);
});
```

---

## 14. Debugging Tips

### Service Worker Debugging

```javascript
// 1. chrome://extensions -> Service worker -> Inspect
// 2. Use debugger statement
chrome.runtime.onInstalled.addListener(() => {
  debugger; // Triggers breakpoint
});

// 3. Reload extension
chrome.runtime.reload();
```

### DevTools Storage (Chrome 132+)

- Open DevTools → Application → Extension Storage
- View and edit `chrome.storage` directly (no console.log needed)

### Minimum Chrome Version

```json
{
  "minimum_chrome_version": "109"
}
```

---

## 15. Publishing Guidelines

### Staged Rollout

1. **Beta testing**: `"version": "2.0.0-beta.1"`
2. **Gradual rollout**: 5% → 25% → 100%

### Avoid Permission Warnings on Update

```javascript
// Use optional permissions for new features
{ "optional_permissions": ["downloads"] }

// Request when user needs it
chrome.permissions.request({ permissions: ['downloads'] });
```

### Review Preparation

Must explain these permissions in Chrome Web Store description:
- `tabs` - Why access browsing history?
- `<all_urls>` - Why all websites?
- `declarativeNetRequest` - What rules?

---

> **Source**: `Manifest-v3-best-practices/` directory, based on Chrome official documentation.

