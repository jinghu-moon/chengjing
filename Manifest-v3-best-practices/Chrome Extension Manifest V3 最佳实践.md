# Chrome Extension Manifest V3 最佳实践

**适用版本**：Manifest V3  
**基准来源**：Chrome Developers Official Documentation (developer.chrome.com)  
**文档目标**：提供基于官方标准的工程化指导，规避审核风险，确保长期稳定性。

---

## 1. 核心架构与设计哲学

Manifest V3 (MV3) 的核心转变在于**隐私、安全与性能**。开发者必须摒弃 MV2 中"常驻后台"的思维模式。

### 1.1 Service Worker 架构 (取代 Background Pages)

MV3 强制使用 Service Worker 替代原有的 Background Page。Service Worker 是短暂运行的事件驱动环境。

> **最佳实践**：**假定 Service Worker 会随时终止，不可依赖内存中的全局变量持久化数据。**
>
> **原因**：Service Worker 在不使用时会终止（闲置约 30 秒后），并在需要处理事件时重启。重启后，全局变量将重置。
>
> **来源**：[Chrome Docs > Concepts > Service Workers > Lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)

> **最佳实践**：**所有事件监听器必须在 Service Worker 的顶层（Top-level）同步注册。**
>
> **原因**：由于 Service Worker 是按需唤醒的，如果监听器注册在异步函数（如 `await` 之后）或嵌套在其他事件中，Chrome 在唤醒 Worker 时可能无法及时发现并分发事件，导致功能失效。
>
> **来源**：[Chrome Docs > Concepts > Service Workers > Events](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/events)

### 1.2 禁止远程代码执行 (Remotely Hosted Code)

MV3 严格禁止执行未经扩展包打包的代码。

> **最佳实践**：**所有业务逻辑代码必须打包在 CRX/ZIP 包内。禁止从服务器下载 JS 并通过 `eval()`、`new Function()` 或 `<script>` 标签执行。**
>
> **原因**：为了确保扩展程序的安全性及可审核性，Chrome Web Store 策略禁止加载远程代码。这包括 CDN 上的库或动态获取的配置代码。
>
> **来源**：[Chrome Docs > Improve security > Remote hosted code](https://developer.chrome.com/docs/extensions/develop/migrate/improve-security#remote-hosted-code)

---

## 2. 状态管理与存储

由于 Service Worker 的非持久性，状态管理必须从"内存优先"转向"存储优先"。

> **最佳实践**：**使用 `chrome.storage` API 进行状态持久化，而非 `window.localStorage`。**
>
> **原因**：Service Worker 环境中无法访问 `window` 对象，因此无法使用 `localStorage`。`chrome.storage` 是专为扩展设计的异步存储 API，且支持跨设备同步（`storage.sync`）。
>
> **来源**：[Chrome Docs > Reference > API > Storage](https://developer.chrome.com/docs/extensions/reference/api/storage)

> **最佳实践**：**利用 `chrome.storage.session` 存储会话级敏感数据（如解密后的密钥）。**
>
> **原因**：`chrome.storage.session` 数据仅在浏览器会话期间保留，且不会同步到云端，也不会写入磁盘。这不仅解决了 Service Worker 内存重置问题，还比写入磁盘更安全。
>
> **来源**：[Chrome Docs > Reference > API > Storage > StorageArea (session)](https://developer.chrome.com/docs/extensions/reference/api/storage#type-StorageArea)

---

## 3. 网络请求处理 (Declarative Net Request)

MV3 用 `declarativeNetRequest` (DNR) 取代了阻塞式的 `webRequest` API（除企业策略扩展外）。

### 3.1 规则优先

> **最佳实践**：**优先使用静态规则集 (Static Rulesets) 处理通用的拦截和修改逻辑。**
>
> **原因**：静态规则在扩展安装/更新时加载，执行效率更高，且不占用动态规则的配额。
>
> **来源**：[Chrome Docs > Reference > API > DeclarativeNetRequest](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)

### 3.2 动态与会话规则

> **最佳实践**：**仅在需要根据用户运行时配置更改行为时，使用动态规则 (Dynamic Rules) 或会话规则 (Session Rules)。**
>
> **原因**：动态规则和会话规则有严格的数量限制（通常为 5000 条安全规则）。会话规则在浏览器关闭后自动清除，适合临时性的拦截需求。
>
> **来源**：[Chrome Docs > Reference > API > DeclarativeNetRequest > Rule Limits](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#rule-limits)

### 3.3 调试

> **最佳实践**：**使用 `chrome.declarativeNetRequest.testMatchOutcome` API 进行规则测试。**
>
> **原因**：该 API 允许在不产生实际网络请求的情况下，检查特定 URL 是否会被当前的规则集拦截或修改，是调试 DNR 规则的官方推荐方式。
>
> **来源**：[Chrome Docs > Reference > API > DeclarativeNetRequest > testMatchOutcome](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#method-testMatchOutcome)

---

## 4. DOM 访问与 Offscreen Documents

Service Worker 无法访问 DOM。如果扩展需要解析 HTML、处理音频或与剪贴板交互，必须改变策略。

> **最佳实践**：**使用 `chrome.offscreen` API 创建离屏文档来执行 DOM 相关任务。**
>
> **原因**：`offscreen` API 允许创建一个隐藏的 HTML 文档来运行需要 DOM 环境的代码（如 `DOMParser`）。
>
> **来源**：[Chrome Docs > Reference > API > Offscreen](https://developer.chrome.com/docs/extensions/reference/api/offscreen)

> **最佳实践**：**最小化 Offscreen Document 的生命周期，用完即关。**
>
> **原因**：离屏文档会占用系统资源。官方建议通过 `reasons` 参数明确用途，并在任务完成后通过 `closeDocument()` 关闭它，不要将其作为持久后台页面使用。
>
> **来源**：[Chrome Docs > Reference > API > Offscreen > closeDocument](https://developer.chrome.com/docs/extensions/reference/api/offscreen#method-closeDocument)

---

## 5. 权限与安全性 (Permissions & Security)

MV3 强调最小权限原则（Least Privilege）。

### 5.1 Host Permissions 分离

> **最佳实践**：**在 `manifest.json` 中将主机权限单独声明在 `host_permissions` 字段，而非 `permissions` 字段。**
>
> **原因**：MV3 规范明确要求将主机匹配模式（如 `https://*.google.com/`）与 API 权限（如 `storage`）分开，以便用户更清晰地审查扩展请求的权限。
>
> **来源**：[Chrome Docs > Reference > Manifest > Host permissions](https://developer.chrome.com/docs/extensions/reference/manifest/host-permissions)

### 5.2 避免 `<all_urls>`

> **最佳实践**：**尽可能避免请求 `<all_urls>` 或宽泛的主机权限，优先使用 `activeTab` 权限。**
>
> **原因**：`activeTab` 仅在用户主动点击扩展图标或快捷键时，临时授予扩展对当前标签页的访问权限。这不仅提高了安全性，还能在安装时避免向用户显示可怕的"读取所有网站数据"警告。
>
> **来源**：[Chrome Docs > Reference > Manifest > ActiveTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)

### 5.3 内容安全策略 (CSP)

> **最佳实践**：**确保 `content_security_policy` 符合 MV3 的严格要求，即 `script-src` 必须允许 `'self'` 且禁止 `'unsafe-eval'`。**
>
> **原因**：MV3 的默认 CSP 非常严格，以防止跨站脚本攻击 (XSS)。任何依赖 `eval()` 或远程脚本的代码都会导致扩展报错。
>
> **来源**：[Chrome Docs > Reference > Manifest > Content Security Policy](https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy)

---

## 6. 脚本注入 (Scripting)

> **最佳实践**：**使用 `chrome.scripting.executeScript` 替代 MV2 的 `tabs.executeScript`，并优先注入文件而非代码字符串。**
>
> **原因**：`chrome.scripting` API 提供了更细粒度的控制，支持动态注入 CSS 和 JS。注入文件（`files: ['script.js']`）比注入函数或字符串更易于维护和调试，且受 CSP 限制更少。
>
> **来源**：[Chrome Docs > Reference > API > Scripting](https://developer.chrome.com/docs/extensions/reference/api/scripting)

---

## 7. 性能优化

> **最佳实践**：**在 Service Worker 中使用 ES Modules (`"type": "module"` in manifest) 并按需 `import`。**
>
> **原因**：MV3 支持将 Service Worker 声明为模块。这允许开发者使用标准的 `import/export` 语法拆分代码，仅加载当前事件处理所需的模块，从而缩短启动时间。
>
> **来源**：[Chrome Docs > Concepts > Service Workers > Basics > Import scripts](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/basics#import-scripts)

> **最佳实践**：**使用 `chrome.alarms` 处理定时任务，而非 `setTimeout` 或 `setInterval`。**
>
> **原因**：由于 Service Worker 可能会在定时器触发前终止，`setTimeout` 是不可靠的。`chrome.alarms` 由浏览器系统级管理，可以唤醒已休眠的 Service Worker 执行任务。
>
> **来源**：[Chrome Docs > Reference > API > Alarms](https://developer.chrome.com/docs/extensions/reference/api/alarms)

---

**修订历史**
*   v1.0: 基于 Chrome Extension Manifest V3 官方文档编写，严格排除非官方建议。