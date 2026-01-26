# Chrome Extension 智能热更新 (Smart HMR) 循环原理

本文档详细说明了基于 **产物分析 (Output Analysis)** 的智能热更新循环。

## 🔄 热更新生命周期循环

整个热更新流程是一个无限循环，分为 5 个核心阶段：

```mermaid
graph TD
    %% 阶段定义
    Start((🚀 启动)) --> Watch[👁️ 监听模式]
    
    subgraph Cycle [♾️ 热更新循环]
        direction TB
        Watch -- "1. 文件修改" --> Build[⚡ Vite 增量构建]
        Build -- "2. 生成产物" --> Analyze{🔍 产物分析\n(对比 Hash 指纹)}
        
        Analyze -- "JS Hash 变更" --> StrategyPage[策略: 📄 PAGE]
        Analyze -- "仅 CSS Hash 变更" --> StrategyCSS[策略: 🎨 CSS]
        Analyze -- "Manifest 变更" --> StrategyExt[策略: 🧩 EXTENSION]
        Analyze -- "无实质变更" --> Ignore[👻 忽略]
        
        StrategyPage --> Signal[📡 SSE 广播信号]
        StrategyCSS --> Signal
        StrategyExt --> Signal
        
        Signal -- "ws: 8888" --> Client[🖥️ 客户端 (浏览器)]
        
        Client -- "location.reload()" --> PageReload[页面刷新]
        Client -- "Replace <link>" --> HotCSS[样式热替]
        Client -- "runtime.reload()" --> ExtReload[扩展重启]
        
        PageReload --> Reconnect[🔌 重新连接]
        HotCSS --> Reconnect
        ExtReload --> Reconnect
    end
    
    Reconnect --> Watch
```

## 核心五步详解

### 1. 监听 (Watch)
*   **输入**：开发者修改 `src/App.vue`。
*   **动作**：Vite 监听到文件变动，触发构建。

### 2. 构建 (Build)
*   **动作**：Vite 将 `.vue` 编译为 `dist/assets/index.js` 和 `dist/assets/index.css`。
*   **特点**：此时还不知道具体变了什么，只知道有新文件生成。

### 3. 分析 (Analyze) ✨ **核心黑科技**
*   **动作**：`reloader.ts` 插件拦截 `generateBundle` 钩子。
*   **逻辑**：
    *   计算新产物的 **MD5 指纹**（剔除 SourceMap 干扰）。
    *   对比上一次构建的指纹快照。
*   **判定**：
    *   如果只有 `index.css` 指纹变了 -> **CSS 策略**。
    *   如果 `index.js` 指纹变了 -> **PAGE 策略**。

### 4. 广播 (Signal)
*   **动作**：Server 通过 SSE (Server-Sent Events) 向浏览器推送 JSON 指令。
*   **指令**：`{ type: 'css', files: ['index.css'] }`

### 5. 执行 (Action)
*   **CSS 策略**：客户端找到 `<link>` 标签，修改 `href` 加上时间戳，浏览器在**不刷新页面**的情况下重新加载样式。
*   **PAGE 策略**：执行 `location.reload()`。
*   **连接恢复**：执行完动作后，SSE 客户端自动重连，进入下一轮等待。
