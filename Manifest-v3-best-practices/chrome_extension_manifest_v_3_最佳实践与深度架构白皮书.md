# Chrome Extension Manifest V3 最佳实践（官方规范版）

> 本文档基于 **Chrome 官方扩展文档**（https://developer.chrome.com/docs/extensions）系统整理，仅保留**官方明确说明或可合理推导**的结论，用作：
> - 团队内部 Chrome Extension 开发规范
> - Manifest V3 架构设计参考
> - Chrome Web Store 审核风险规避文档

---

## 1. Manifest V3 的核心设计原则

### 1.1 事件驱动而非持久运行

**建议**：将扩展架构设计为完全事件驱动，不依赖任何常驻后台逻辑。

**原因**：Manifest V3 明确弃用持久化后台页面，所有后台逻辑必须运行在 **Extension Service Worker** 中，其生命周期由浏览器调度。

**来源**：Chrome Extensions Docs – Extension service workers

---

### 1.2 默认安全（Secure by Default）

**建议**：假设扩展代码将接受静态分析与行为审计，避免任何动态或自修改逻辑。

**原因**：Manifest V3 禁止远程托管代码，要求所有可执行逻辑在安装时即固定，以便 Chrome Web Store 审核。

**来源**：Chrome Extensions Docs – Remote hosted code

---

## 2. Service Worker 生命周期与状态管理

### 2.1 不依赖全局内存状态

**建议**：避免在 Service Worker 中使用全局变量作为长期状态来源。

**原因**：Service Worker 可能在空闲时被终止并重新启动，全局内存状态不可靠。

**来源**：Chrome Extensions Docs – Service worker lifecycle

---

### 2.2 使用 Storage API 作为单一可信源

**建议**：将所有关键状态持久化至 `chrome.storage`。

**原因**：官方文档明确指出，Service Worker 不保证持续运行，状态必须可恢复。

**来源**：Chrome Extensions Docs – Persisting state

---

### 2.3 同步注册所有事件监听器

**建议**：在 Service Worker 顶层同步注册所有事件监听器。

**原因**：异步注册可能导致事件在监听器注册前被派发，从而丢失。

**来源**：Chrome Extensions Docs – Migrate to a service worker

---

## 3. 权限声明与最小权限原则

### 3.1 遵循最小权限原则

**建议**：仅声明实现当前功能所必需的最小权限。

**原因**：Chrome 会在安装时向用户展示权限警告，宽泛权限会降低用户信任并增加审核风险。

**来源**：Chrome Extensions Docs – Declare permissions

---

### 3.2 优先使用 activeTab 与 optional_permissions

**建议**：对于临时或用户触发的能力，使用 `activeTab` 或可选权限。

**原因**：官方推荐通过用户交互触发权限授予，避免长期 Host 权限。

**来源**：Chrome Extensions Docs – activeTab

---

## 4. Declarative Net Request（DNR）

### 4.1 理解 DNR 的设计目标

**建议**：将 DNR 视为规则匹配引擎，而非可编程请求拦截器。

**原因**：Manifest V3 废弃阻塞型 `webRequest`，以消除性能与隐私风险。

**来源**：Chrome Extensions Docs – declarativeNetRequest

---

### 4.2 合理划分规则集类型

**建议**：根据规则生命周期选择静态、动态或会话规则集。

**原因**：不同规则集具有不同的持久性与数量限制。

**来源**：Chrome Extensions Docs – Rule resources

---

## 5. 性能与资源管理

### 5.1 接受 Service Worker 的瞬态特性

**建议**：避免任何形式的“保活”尝试。

**原因**：官方明确不鼓励阻止 Worker 休眠，强制保活可能导致审核拒绝。

**来源**：Chrome Extensions Docs – Service worker lifecycle

---

### 5.2 使用 Alarms API 代替计时器

**建议**：将所有定时任务迁移至 `chrome.alarms`。

**原因**：标准计时器在 Worker 休眠时不可靠，而 Alarm 事件可唤醒 Worker。

**来源**：Chrome Extensions Docs – Convert timers to alarms

---

### 5.3 谨慎使用 Offscreen Documents

**建议**：仅在必须访问 DOM 或剪贴板等能力时创建 Offscreen Document，并在完成后立即销毁。

**原因**：Offscreen Document 是完整的渲染上下文，资源开销显著。

**来源**：Chrome Extensions Docs – Offscreen API

---

## 6. 安全与隐私

### 6.1 禁止远程托管或动态执行代码

**建议**：所有 JavaScript 逻辑必须随扩展包发布。

**原因**：Manifest V3 明确禁止加载或执行远程代码。

**来源**：Chrome Extensions Docs – Remote hosted code

---

### 6.2 安全处理 Content Script 通信

**建议**：对来自 Content Script 的消息进行校验与清洗。

**原因**：Content Script 运行在不可信的网页环境中。

**来源**：Chrome Extensions Docs – Security

---

## 7. 官方明确的反模式（Anti-patterns）

### 7.1 Service Worker 保活 Hack

**问题**：通过循环调用 API 阻止 Worker 休眠。

**风险**：违反生命周期设计，可能导致审核拒绝。

**来源**：Chrome Extensions Docs – Service worker lifecycle

---

### 7.2 动态代码注入或执行

**问题**：使用 `eval`、`new Function` 或远程脚本。

**风险**：违反安全模型与 CSP。

**来源**：Chrome Extensions Docs – Content Security Policy

---

### 7.3 使用已废弃的 webRequest 阻塞模式

**问题**：依赖 `webRequestBlocking` 权限。

**风险**：Manifest V3 不再支持。

**来源**：Chrome Extensions Docs – webRequest

---

## 8. 审核导向总结

- 能运行不代表合规
- Manifest V3 强调 **可审计性、可预测性、低资源占用**
- 所有架构决策应以官方文档为依据

---

> 本文档仅包含 Reviewer 审核通过的内容，未能在官方文档中找到依据的实践已被删除。

