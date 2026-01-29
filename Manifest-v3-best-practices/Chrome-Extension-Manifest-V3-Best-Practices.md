# Chrome Extension Manifest V3 最佳实践

**文档版本**: 1.0 (Draft)  
**基于**: Chrome Developer Documentation (2024-2026)  
**最低支持**: Chrome 88+

---

## 📋 目录

1. [核心原则](#核心原则)
2. [Manifest 文件结构](#manifest-文件结构)
3. [Service Worker 最佳实践](#service-worker-最佳实践)
4. [权限管理](#权限管理)
5. [内容安全策略 (CSP)](#内容安全策略-csp)
6. [网络请求处理](#网络请求处理)
7. [存储与状态管理](#存储与状态管理)
8. [性能优化](#性能优化)
9. [安全性](#安全性)
10. [调试与测试](#调试与测试)
11. [发布与部署](#发布与部署)

---

## 核心原则

### 1. 三大核心变化

**🔹 Service Workers 取代 Background Pages**
- 非持久化，按需运行
- 30秒无活动自动终止
- 不能访问 DOM

**🔹 禁止远程代码执行**
- 所有代码必须打包在扩展内
- 不能使用 `eval()`, `new Function()`, `executeScript()` 执行字符串
- 第三方库必须本地化

**🔹 declarativeNetRequest 取代 webRequest**
- 声明式规则，非阻塞式拦截
- 更好的性能和隐私保护
- 规则限制：静态规则可配置数量，动态+会话规则≤5000

---

## Manifest 文件结构

### 2.1 基础结构

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
    "default_icon": {
      "16": "icons/icon-16.png",
      "32": "icons/icon-32.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    },
    "default_title": "Click to open"
  },
  
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  
  "permissions": [
    "storage",
    "activeTab"
  ],
  
  "host_permissions": [
    "https://example.com/*"
  ],
  
  "content_scripts": [
    {
      "matches": ["https://example.com/*"],
      "js": ["content-script.js"],
      "css": ["content-styles.css"]
    }
  ],
  
  "web_accessible_resources": [
    {
      "resources": ["images/*.png", "fonts/*.woff2"],
      "matches": ["https://example.com/*"]
    }
  ]
}
```

**⚠️ MV3 重要变化：Web Accessible Resources**

MV3 要求 `web_accessible_resources` 必须指定 `matches` 字段：

```json
// ❌ MV2 格式（MV3 不支持）
{
  "web_accessible_resources": ["image.png"]
}

// ✅ MV3 格式
{
  "web_accessible_resources": [
    {
      "resources": ["images/*.png"],
      "matches": ["https://example.com/*"],
      "use_dynamic_url": false  // 可选，默认 false
    }
  ]
}
```

**在 Content Script 中使用：**

```javascript
// content-script.js
const imgURL = chrome.runtime.getURL('images/icon.png');
const img = document.createElement('img');
img.src = imgURL;
document.body.appendChild(img);
```

### 2.2 关键字段说明

| 字段 | 必需 | 说明 |
|------|------|------|
| `manifest_version` | ✅ | 必须为 `3` |
| `name` | ✅ | 扩展名称（最长45字符） |
| `version` | ✅ | 版本号（遵循语义化版本） |
| `action` | ⚠️ | 取代 V2 的 `browser_action` 和 `page_action` |
| `background.service_worker` | ⚠️ | 取代 V2 的 `background.scripts` |
| `background.type` | ❌ | ES Module 时设为 `"module"` |
| `host_permissions` | ❌ | V3 新增，独立于 `permissions` |

---

## Service Worker 最佳实践

### 3.1 基础注册

```javascript
// ✅ CORRECT - background.js (ES Module)
// manifest.json: "background": { "service_worker": "background.js", "type": "module" }

import { handleInstall } from './modules/install.js';
import { handleMessage } from './modules/messaging.js';

chrome.runtime.onInstalled.addListener(handleInstall);
chrome.runtime.onMessage.addListener(handleMessage);
```

```javascript
// ❌ WRONG - 不要这样做
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get('key');
  // ❌ 异步回调中注册事件监听器可能失败
  chrome.tabs.onUpdated.addListener(handleTabUpdate);
});
```

### 3.2 生命周期管理

**Service Worker 终止条件：**
- 30秒无活动
- 单个请求超过5分钟
- fetch() 响应超过30秒

**保持活跃的方法：**

```javascript
// ✅ 使用 chrome.alarms 定期唤醒（最小间隔30秒，Chrome 117+）
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    console.log('Service worker kept alive');
  }
});
```

**Chrome 116+ 生命周期延长 API：**

以下 API 调用会自动延长 Service Worker 生命周期超过 5 分钟：

```javascript
// ✅ permissions.request()
chrome.permissions.request({ permissions: ['downloads'] });

// ✅ desktopCapture.chooseDesktopMedia()
chrome.desktopCapture.chooseDesktopMedia(['screen', 'window']);

// ✅ identity.launchWebAuthFlow()
chrome.identity.launchWebAuthFlow({
  url: authUrl,
  interactive: true
});

// ✅ management.uninstall()
chrome.management.uninstall(extensionId);
```

### 3.3 状态持久化

```javascript
// ❌ WRONG - 全局变量会丢失
let cache = {};

chrome.runtime.onMessage.addListener((msg) => {
  cache[msg.key] = msg.value; // ❌ Service Worker 重启后丢失
});
```

```javascript
// ✅ CORRECT - 使用 chrome.storage
chrome.runtime.onMessage.addListener(async (msg) => {
  await chrome.storage.local.set({ [msg.key]: msg.value });
});

// 读取
const result = await chrome.storage.local.get('key');
```

### 3.4 ES Modules 导入

```javascript
// ✅ 方法 1: 静态导入（推荐）
import { utility } from './utils.js';

// ✅ 方法 2: importScripts（仅非 module 模式）
// background.js (非 module)
importScripts('utils.js', 'config.js');

// ❌ WRONG - 动态导入不支持
const module = await import('./dynamic.js'); // ❌ 不支持
```

### 3.5 Offscreen Documents (Chrome 109+)

**关键特性**：允许在隐藏文档中使用 DOM 和 Web APIs。

**典型用例：**
- 🎵 音频/视频播放
- 🖼️ Canvas 操作和图像处理
- 📄 DOM/HTML 解析
- 🎥 WebRTC
- 📚 使用需要 `window` 或 `document` 的第三方库

**配置：**

```json
{
  "permissions": ["offscreen"],
  "minimum_chrome_version": "109"
}
```

**完整示例：**

```javascript
// background.js - 创建 Offscreen Document
async function setupOffscreen() {
  // Chrome 116+ 可以检查现有上下文
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });
    if (contexts.length > 0) return; // 已存在
  }
  
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['DOM_PARSER'], // 'AUDIO_PLAYBACK', 'CLIPBOARD' 等
    justification: 'Parse and sanitize HTML from external sources'
  });
}

// 使用 Offscreen Document
async function parseHTML(htmlString) {
  await setupOffscreen();
  
  const response = await chrome.runtime.sendMessage({
    type: 'PARSE_HTML',
    data: htmlString
  });
  
  return response.result;
}
```

```html
<!-- offscreen.html -->
<!DOCTYPE html>
<html>
<head>
  <script src="offscreen.js"></script>
</head>
<body></body>
</html>
```

```javascript
// offscreen.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PARSE_HTML') {
    try {
      // 可以使用完整的 DOM APIs
      const parser = new DOMPurify.DOMParser();
      const doc = parser.parseFromString(msg.data, 'text/html');
      
      sendResponse({ 
        result: {
          title: doc.title,
          links: Array.from(doc.querySelectorAll('a')).map(a => a.href)
        }
      });
    } catch (error) {
      sendResponse({ error: error.message });
    }
  }
  return true; // 异步响应
});
```

**何时关闭：**

```javascript
// 用完后关闭以节省资源
await chrome.offscreen.closeDocument();
```

### 3.6 动态注册 Content Scripts (Chrome 96+)

**使用场景：** 根据用户配置或运行时条件动态注册 content scripts。

```json
{
  "permissions": ["scripting"],
  "host_permissions": ["https://*/*"]
}
```

```javascript
// 注册 content script
await chrome.scripting.registerContentScripts([{
  id: "dynamic-script-1",
  matches: ["https://example.com/*"],
  js: ["content.js"],
  runAt: "document_idle",
  persistAcrossSessions: true // Chrome 102+
}]);

// 更新已注册的 script
await chrome.scripting.updateContentScripts([{
  id: "dynamic-script-1",
  matches: ["https://example.com/*", "https://example.org/*"]
}]);

// 获取所有已注册的 scripts
const scripts = await chrome.scripting.getRegisteredContentScripts();

// 注销 content script
await chrome.scripting.unregisterContentScripts({
  ids: ["dynamic-script-1"]
});

// 注销所有
await chrome.scripting.unregisterContentScripts();
```

---

## 权限管理

### 4.1 权限分类

**必需权限 (Required Permissions)**
```json
{
  "permissions": [
    "storage",     // 无警告
    "activeTab",   // 无警告（用户手势触发）
    "tabs"         // ⚠️ 警告："Read your browsing history"
  ]
}
```

**declarativeNetRequest 权限对比**

| 权限 | 警告 | 需要 host_permissions | 说明 |
|------|------|----------------------|------|
| `declarativeNetRequest` | ✅ "Block content on any page" | ❌ | 隐式权限，可用于 allow/allowAllRequests/block 规则 |
| `declarativeNetRequestWithHostAccess` | ❌ | ✅ | 需显式 host permissions，但无额外警告 |
| `declarativeNetRequestFeedback` | ❌ | ❌ | 仅用于调试（未打包扩展） |

**推荐用法：**

```json
{
  // 方案 1: 简单阻止规则，无需 host permissions
  "permissions": ["declarativeNetRequest"],
  
  // 方案 2: 需要 host permissions 的场景
  "permissions": ["declarativeNetRequestWithHostAccess"],
  "host_permissions": ["https://example.com/*"]
}
```

**主机权限 (Host Permissions)**
```json
{
  "host_permissions": [
    "https://example.com/*",
    "https://*.google.com/*"
  ]
}
```

**可选权限 (Optional Permissions)**
```json
{
  "optional_permissions": ["downloads"],
  "optional_host_permissions": ["https://news.ycombinator.com/*"]
}
```

### 4.2 最小权限原则

```javascript
// ✅ GOOD - 使用 activeTab 代替 tabs
{
  "permissions": ["activeTab"],  // 仅在用户交互时访问当前标签
  "action": {
    "default_popup": "popup.html"
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});
```

```javascript
// ❌ BAD - 过度请求权限
{
  "permissions": [
    "tabs",              // ❌ 触发警告
    "<all_urls>",        // ❌ 过于宽泛
    "webRequest",
    "webRequestBlocking" // ❌ MV3 不支持（除企业策略）
  ]
}
```

### 4.3 可选权限请求

```javascript
// ✅ 运行时请求可选权限
async function requestDownloadPermission() {
  const granted = await chrome.permissions.request({
    permissions: ['downloads']
  });
  
  if (granted) {
    chrome.downloads.download({ url: 'https://example.com/file.pdf' });
  } else {
    console.log('User denied permission');
  }
}

// 检查权限
const hasPermission = await chrome.permissions.contains({
  permissions: ['downloads']
});
```

---

## 内容安全策略 (CSP)

### 5.1 默认 CSP

**扩展页面 (extension_pages)**

```
# Chrome 88-120
script-src 'self';
object-src 'self';

# Chrome 121+ (支持 WebAssembly)
script-src 'self' 'wasm-unsafe-eval';
object-src 'self';
```

**沙盒页面 (sandbox)**
```
sandbox allow-scripts allow-forms allow-popups allow-modals;
script-src 'self' 'unsafe-inline' 'unsafe-eval';
child-src 'self';
```

**重要提示**：如果你的扩展需要 WebAssembly，建议在 manifest 中设置：
```json
{
  "minimum_chrome_version": "121"
}
```

### 5.2 自定义 CSP

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'",
    "sandbox": "sandbox allow-scripts; script-src 'self' https://example.com"
  }
}
```

**❌ 禁止的 CSP 值：**
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'unsafe-eval'"  // ❌ 不允许
  }
}
```

### 5.3 沙盒使用场景

```json
// manifest.json
{
  "sandbox": {
    "pages": ["sandbox.html"]
  }
}
```

```javascript
// 主页面与沙盒通信
const iframe = document.createElement('iframe');
iframe.src = chrome.runtime.getURL('sandbox.html');
document.body.appendChild(iframe);

window.addEventListener('message', (event) => {
  if (event.origin === `chrome-extension://${chrome.runtime.id}`) {
    console.log('Received from sandbox:', event.data);
  }
});
```

---

## 网络请求处理

### 6.1 declarativeNetRequest 基础

```json
// manifest.json
{
  "permissions": ["declarativeNetRequest"],
  "host_permissions": ["https://example.com/*"],
  
  "declarative_net_request": {
    "rule_resources": [{
      "id": "ruleset_1",
      "enabled": true,
      "path": "rules.json"
    }]
  }
}
```

```json
// rules.json
[
  {
    "id": 1,
    "priority": 1,
    "action": { "type": "block" },
    "condition": {
      "urlFilter": "||evil.com",
      "resourceTypes": ["main_frame"]
    }
  },
  {
    "id": 2,
    "priority": 1,
    "action": {
      "type": "redirect",
      "redirect": { "url": "https://safe.com" }
    },
    "condition": {
      "urlFilter": "https://old.com/*",
      "resourceTypes": ["main_frame"]
    }
  }
]
```

### 6.2 动态规则

```javascript
// 添加动态规则
const rules = [{
  id: 1,
  priority: 1,
  action: { type: 'block' },
  condition: {
    urlFilter: '*://spam.com/*',
    resourceTypes: ['script']
  }
}];

await chrome.declarativeNetRequest.updateDynamicRules({
  addRules: rules,
  removeRuleIds: [1] // 移除旧规则
});
```

### 6.3 规则限制

```javascript
// 检查可用规则数量
const { staticRuleLimit } = await chrome.declarativeNetRequest.getAvailableStaticRuleCount();
console.log(`Static rule count: ${staticRuleLimit}`);

// 限制：
// - 静态规则：依赖全局配额（通常几万条）
// - 动态规则 + 会话规则：≤ 5000
// - Regex 规则：≤ 1000
```

---

## 存储与状态管理

### 7.1 存储 API 选择

| API | 容量 | 同步 | 用途 |
|-----|------|------|------|
| `chrome.storage.local` | 10MB | ❌ | 本地数据 |
| `chrome.storage.sync` | 100KB | ✅ | 跨设备同步 |
| `chrome.storage.session` | 10MB | ❌ | 会话临时数据（Chrome 102+） |
| `IndexedDB` | 无限* | ❌ | 大量结构化数据 |

```javascript
// ✅ 使用 chrome.storage
await chrome.storage.local.set({ key: 'value' });
const { key } = await chrome.storage.local.get('key');

// ✅ 监听变化
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(`${key} changed from ${oldValue} to ${newValue}`);
  }
});
```

```javascript
// ✅ Session storage (Chrome 102+) - Service Worker 重启不丢失
await chrome.storage.session.set({ tempData: 'value' });
```

### 7.2 避免使用 Web Storage

```javascript
// ❌ WRONG - Service Worker 不支持
localStorage.setItem('key', 'value'); // ❌ localStorage 不可用
sessionStorage.setItem('key', 'value'); // ❌ sessionStorage 不可用

// ✅ CORRECT - 使用 chrome.storage
chrome.storage.local.set({ key: 'value' });
```

---

## 性能优化

### 8.1 代码分割

```javascript
// ✅ 按需加载模块
chrome.action.onClicked.addListener(async () => {
  const { heavyFunction } = await import('./heavy-module.js');
  heavyFunction();
});
```

### 8.2 事件监听优化

```javascript
// ✅ GOOD - 顶层注册
chrome.runtime.onMessage.addListener(handleMessage);

function handleMessage(msg, sender, sendResponse) {
  // 处理逻辑
  return true; // 异步响应
}
```

```javascript
// ❌ BAD - 异步回调中注册
chrome.storage.local.get('config', (result) => {
  chrome.tabs.onUpdated.addListener(() => { // ❌ 可能失败
    // ...
  });
});
```

### 8.3 批量操作

```javascript
// ✅ GOOD - 批量更新
await chrome.storage.local.set({
  key1: 'value1',
  key2: 'value2',
  key3: 'value3'
});

// ❌ BAD - 多次写入
await chrome.storage.local.set({ key1: 'value1' });
await chrome.storage.local.set({ key2: 'value2' });
await chrome.storage.local.set({ key3: 'value3' });
```

---

## 安全性

### 9.1 禁止远程代码

```javascript
// ❌ WRONG - 执行远程代码
fetch('https://cdn.example.com/script.js')
  .then(r => r.text())
  .then(code => eval(code)); // ❌ 严格禁止
```

```javascript
// ✅ CORRECT - 本地化库
// 1. npm install library
// 2. 打包到扩展中
import library from './vendor/library.js';
```

### 9.2 输入验证

```javascript
// ✅ 验证来自 Content Script 的消息
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // 验证发送者
  if (!sender.tab) {
    console.warn('Message not from a tab');
    return;
  }
  
  // 验证数据
  if (typeof msg.data !== 'string' || msg.data.length > 1000) {
    console.warn('Invalid data');
    return;
  }
  
  // 处理消息
  processMessage(msg.data);
});
```

### 9.3 XSS 防护

```javascript
// ❌ WRONG - 容易 XSS
element.innerHTML = userInput;

// ✅ CORRECT - 使用 textContent
element.textContent = userInput;

// ✅ 或使用 sanitize 库
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);
```

---

## 调试与测试

### 10.1 Service Worker 调试

```javascript
// 1. chrome://extensions -> Service worker -> 检查
// 2. 查看 Console 输出
console.log('Service worker started');

// 3. 使用 debugger
chrome.runtime.onInstalled.addListener(() => {
  debugger; // 触发断点
});
```

### 10.2 重新加载扩展

```bash
# 开发中频繁重新加载
chrome://extensions -> 点击 "重新加载" 按钮
```

```javascript
// 或通过 API 编程重载
chrome.runtime.reload();
```

### 10.3 最小 Chrome 版本

```json
{
  "minimum_chrome_version": "102",
  "manifest_version": 3
}
```

---

## 发布与部署

### 11.1 渐进式发布

1. **Beta 测试**
```json
{
  "version": "2.0.0-beta.1"
}
```

2. **分阶段推出**
- 先发布到 5% 用户
- 观察 1-2 天
- 逐步扩大到 100%

### 11.2 权限警告处理

```javascript
// 避免在更新时触发权限警告
// ✅ 使用可选权限逐步引入新功能
{
  "optional_permissions": ["downloads"]
}

// 在用户需要时请求
chrome.permissions.request({ permissions: ['downloads'] });
```

### 11.3 审核准备

**必须说明的权限理由：**
- `tabs`: 为什么需要访问浏览历史
- `<all_urls>`: 为什么需要所有网站权限
- `declarativeNetRequest`: 具体的过滤规则

---

## 附录

### 常见迁移问题

| V2 | V3 | 说明 |
|----|----|------|
| `background.scripts` | `background.service_worker` | 单文件 |
| `background.persistent` | 移除 | Service Worker 非持久化 |
| `browser_action` / `page_action` | `action` | 统一为 action |
| `tabs.executeScript()` | `scripting.executeScript()` | 新 API |
| `webRequestBlocking` | `declarativeNetRequest` | 声明式 |
| `permissions: ["<all_urls>"]` | `host_permissions: ["<all_urls>"]` | 分离 |

### 参考资源

- [Manifest V3 官方文档](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
- [Service Worker 生命周期](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [declarativeNetRequest API](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)
- [Chrome Web Store 发布指南](https://developer.chrome.com/docs/webstore/publish)

---

**最后更新**: 2026-01-29  
**文档状态**: Draft - 待审核
