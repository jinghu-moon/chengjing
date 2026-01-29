# Chrome Extension 2026：AI 原生架构与 MV3 成熟期最佳实践

## 1. AI 原生架构 (AI-Native Architecture)

在 2026 年，扩展开发最大的范式转移是从“调用远程 API”转向使用浏览器内置的 **On-Device AI (Gemini Nano)**。这不仅消除了服务器成本，还解决了隐私泄露风险。

### 1.1 Prompt API 与本地推理

Chrome 现在通过 Origin Trials 或正式 API 暴露了内置的大语言模型能力（Prompt API, Summarization API）。

- **架构变更**：
  - **Manifest 配置**：需要在 `manifest.json` 中声明 `trial_tokens` 以激活实验性 AI 功能。
  - **本地处理**：不再需要将用户选中的文本发送到 OpenAI/Claude 的服务器。直接在 Service Worker 或 Side Panel 中调用 `window.ai` (或相关命名空间) 进行摘要、重写或分类。
  - **隐私优势**：数据不出本地，这对于通过企业安全审查至关重要。

### 1.2 模型生命周期管理

虽然模型在本地，但加载模型（Model Loading）是资源密集型操作。

- **最佳实践**：不要在每次事件触发时重新初始化模型会话。应在 Service Worker 中保持模型会话的引用，利用 Chrome 116+ 引入的 WebSocket 或长连接保活机制来维持会话上下文，直到任务结束 。

------

## 2. 动态逻辑与用户脚本 (User Scripts API)

直到 2024 年，开发者还在滥用 `scripting.executeScript` 来注入用户自定义代码。2026 年的标准是使用专门的 **User Scripts API** (`chrome.userScripts`)。

### 2.1 UserScripts vs Scripting

- **Scripting API (`chrome.scripting`)**：仅用于扩展**自身**的逻辑注入。代码必须打包在扩展内，受限于 CWS 的静态审核。
- **User Scripts API (`chrome.userScripts`)**：专门用于执行**用户提供**的代码（如 Tampermonkey 类应用）。
  - **安全性**：运行在特殊的沙箱环境中，与扩展核心权限隔离。
  - **执行时机**：支持 `userScripts.execute()` 进行一次性注入，也支持注册持久化脚本。
  - **代码源**：允许执行任意字符串代码（Arbitrary Code），这是 Manifest V3 对“远程代码禁令”的唯一且受控的例外。

### 2.2 2026 年的执行环境 (Execution World)

MV3 引入了 `MAIN` World 注入，这在 2026 年已成为与网页交互的标准方式。

- **ISOLATED World**：扩展的默认环境，无法访问页面的 `window` 变量。用于操作 DOM。
- **MAIN World**：通过 `world: 'MAIN'` 注入。用于读取网页框架的全局变量（如 `window.React`、`window.ReduxStore`）。
  - **警告**：主世界注入极其危险，容易被网页反向探测。仅在必须读取页面 JS 对象时使用 。

------

## 3. Service Worker：成熟期的保活与状态

Service Worker 的“无端终止”问题在 2026 年已得到缓解，但核心原则未变。

### 3.1 合法的“强保活”手段

不再需要使用 "dummy API call" 这种 Hack 手段。Chrome 官方承认了以下保活场景：

- **WebSocket 连接**：只要 WebSocket 处于活跃状态（发送/接收消息），Service Worker 就会保持存活。这对于即时通讯、即时 AI 推理扩展是标准的保活方式 。
- **Offscreen Document 通信**：通过 Offscreen Document 发送的消息会重置闲置计时器 。
- **Native Messaging**：与本地原生应用的长连接可豁免 5 分钟超时限制 。

### 3.2 状态调试 (DevTools Update)

Chrome 132 (2025年1月) 终于在 DevTools 中加入了对 `chrome.storage` 的直接编辑支持。

- **最佳实践**：在开发过程中，不再需要写 `console.log` 来查看存储状态。直接打开 DevTools -> Application 面板 -> Extension Storage 进行查看和修改 。

------

## 4. UI 交互：Side Panel 与 Action 的融合

Popup 逐渐退化为轻量级交互入口，**Side Panel (侧边栏)** 成为复杂应用的主战场。

### 4.1 上下文感知的侧边栏

- **API**：`chrome.sidePanel`
- **模式**：利用 `chrome.sidePanel.setOptions({ tabId, path })` 实现“一页一侧栏”。
- **用户习惯**：用户已习惯侧边栏作为浏览器的“第二屏”。不要试图通过注入 Iframe 到页面内部来模拟侧边栏（这是 MV2 时代的遗毒，容易被页面 CSS 污染且存在安全风险） 。

------

## 5. 2026 迁移检查清单 (Migration Checklist 2026)

如果你的项目是从 2023-2024 年遗留下来的，请重点检查以下“过时”模式：

| **过时模式 (2023 Era)**                     | **2026 推荐架构**                                 | **来源** |
| ------------------------------------------- | ------------------------------------------------- | -------- |
| 使用 `scripting.executeScript` 注入用户代码 | 迁移至 **`chrome.userScripts` API**               |          |
| 通过 `fetch` 调用 OpenAI API                | 优先尝试 **Prompt API (Gemini Nano)** 本地推理    |          |
| 使用 `setInterval` 发送空消息保活           | 使用 **WebSocket** 或 **Alarms API**              |          |
| 在 Content Script 中解析大量 HTML           | 将 HTML 传回 Offscreen Document 使用 `DOMParser`  |          |
| 手动管理 Origin Trial Token                 | 在 `manifest.json` 中使用 **`trial_tokens`** 字段 |          |



## 6. 结论

2026 年的 Chrome 扩展开发已不再是与浏览器限制的“猫鼠游戏”。随着 **User Scripts API** 的补齐和 **Built-in AI** 的引入，MV3 终于兑现了其高性能与高安全的承诺。开发者应专注于如何利用本地推理能力构建更智能、更隐私的 Web 增强工具，而非纠结于进程保活的黑魔法。