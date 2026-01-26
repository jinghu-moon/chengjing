  import type { Plugin } from 'vite';
  import * as http from 'http';
  import { watch, type FSWatcher } from 'chokidar';
  import * as path from 'path';
  import * as crypto from 'crypto';

  interface ReloaderOptions {
    port?: number;
    debounce?: number;
    smartReload?: boolean;
    hotReloadCSS?: boolean;
    showNotification?: boolean;
    logLevel?: 'silent' | 'info' | 'verbose';
  }

  interface ReloadMessage {
    type: 'page' | 'extension' | 'css' | 'connected' | 'ping';
    files?: string[];
    message?: string;
    timestamp: number;
  }

  interface NodeError extends Error {
    code?: string;
  }

  interface SSEClient {
    id: string;
    res: http.ServerResponse;
    connectedAt: number;
  }

  // TUI State
  type Step = 'WATCH' | 'BUILD' | 'ANALYZE' | 'SIGNAL' | 'DONE';
  const steps: Step[] = ['WATCH', 'BUILD', 'ANALYZE', 'SIGNAL', 'DONE'];
  
  // ANSI Colors
  const c = {
    dim: '\x1b[2m',
    reset: '\x1b[0m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    gray: '\x1b[90m',
    bold: '\x1b[1m'
  };

  export default function extensionReloader(options: ReloaderOptions = {}): Plugin {
    const {
      port = 8888,
      debounce = 800,
      smartReload = true,
      hotReloadCSS = true,
      showNotification = true,
      logLevel = 'info'
    } = options;

    let server: http.Server | null = null;
    const clients = new Map<string, SSEClient>();
    let manifestWatcher: FSWatcher | null = null;
    let reloadTimer: NodeJS.Timeout | null = null;
    let clientIdCounter = 0;
    let isFirstBuild = true;
    
    // State for TUI
    let currentStep: Step = 'WATCH';
    let messageBuffer: string[] = [];
    let lastBundleSnapshot = new Map<string, string>();
    let changedOutputFiles: Set<string> = new Set();
    let cycleStartTime: number = 0;
    
    // --- TUI Rendering Logic ---
    function clearScreen() {
      process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
    }

    function renderUI() {
      if (logLevel === 'silent') return;
      
      clearScreen();
      
      // Render Header
      const header = steps.map(step => {
        // Removed emojis as requested
        const isCurrent = step === currentStep;
        const style = isCurrent ? c.bold + c.cyan : c.dim;
        const indicator = isCurrent ? `[ ${step} ]` : `[ ${step} ]`;
        
        return `${style}${indicator}${c.reset}`;
      }).join(' ');
      
      console.log(`\n${header}\n${c.dim}${'─'.repeat(60)}${c.reset}\n`);
      
      // Render Messages
      // Show last 10 messages from buffer
      const visibleMessages = messageBuffer.slice(-10);
      visibleMessages.forEach(msg => console.log(msg));
    }

    function updateStatus(step: Step, message?: string) {
      currentStep = step;
      if (message) {
        const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
        const prefix = `${c.dim}[${timestamp}]${c.reset}`;
        messageBuffer.push(`${prefix} ${message}`);
        
        // Memory leak protection
        if (messageBuffer.length > 50) {
          messageBuffer = messageBuffer.slice(-50);
        }
      }
      renderUI();
    }
    
    function finishCycle(msg: string) {
       const duration = Date.now() - cycleStartTime;
       // Only show duration if we actually tracked a start time (not initial build)
       const timeInfo = cycleStartTime > 0 ? ` ${c.yellow}(${duration}ms)${c.reset}` : '';
       updateStatus('DONE', `${msg}${timeInfo}`);
       cycleStartTime = 0;
    }

    // --- Helpers ---

    function getHash(content: string | Buffer): string {
      return crypto.createHash('md5').update(content).digest('hex');
    }

    function broadcastEvent(event: ReloadMessage) {
      const data = JSON.stringify(event);
      clients.forEach((client, id) => {
        try {
          client.res.write(`data: ${data}\n\n`);
        } catch (error) {
          clients.delete(id);
        }
      });
    }

    function startSSEServer() {
      if (server) return;
      
      // Don't log server start in buffer to keep it clean, just start it
      server = http.createServer((req, res) => {
        if (req.url === '/sse' || req.url === '/') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });

          const clientId = `client-${++clientIdCounter}`;
          const client: SSEClient = { id: clientId, res, connectedAt: Date.now() };

          clients.set(clientId, client);
          // Silent connect
          try { res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`); } catch {}

          req.on('close', () => { clients.delete(clientId); });
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      server.listen(port);
      
      // Heartbeat
      setInterval(() => {
        broadcastEvent({ type: 'ping', timestamp: Date.now() });
      }, 30000);
    }
    
    function determineReloadStrategy(files: string[]): ReloadMessage {
      if (!smartReload) return { type: 'page', files, message: '页面已更新', timestamp: Date.now() };

      const fileNames = files.filter(f => !f.endsWith('.map'));
      if (fileNames.length === 0) return { type: 'connected', timestamp: Date.now() };

      const fileBaseNames = fileNames.map(f => path.basename(f).toLowerCase());

      if (fileBaseNames.some(f => f === 'manifest.json' || f.includes('background') || f.includes('service-worker'))) {
        return { type: 'extension', files: fileNames, message: '扩展已重新加载', timestamp: Date.now() };
      }

      if (hotReloadCSS && fileNames.every(f => f.endsWith('.css'))) {
        return { type: 'css', files: fileNames, message: `样式已更新: ${fileNames.map(n => path.basename(n)).join(', ')}`, timestamp: Date.now() };
      }

      return { type: 'page', files: fileNames, message: `已更新: ${fileNames.length}`, timestamp: Date.now() };
    }

    function triggerReload() {
      const files = Array.from(changedOutputFiles);
      if (files.length === 0) return;

      updateStatus('SIGNAL', `触发重载策略分析 (变动文件: ${files.length})`);
      
      const strategy = determineReloadStrategy(files);
      if (strategy.type === 'connected') return;

      const typeColor = {
        'page': c.yellow,
        'extension': c.blue,
        'css': c.green,
        'connected': c.dim,
        'ping': c.dim
      }[strategy.type] || c.reset;

      updateStatus('SIGNAL', `策略: ${typeColor}${strategy.type.toUpperCase()}${c.reset}`);
      files.forEach(f => updateStatus('SIGNAL', `  ${c.dim}- ${f}${c.reset}`));

      if (showNotification) {
        broadcastEvent(strategy);
      } else {
        broadcastEvent({ ...strategy, message: undefined });
      }

      changedOutputFiles.clear();
      
      // Instant feedback, no visual delay
      finishCycle('重载指令已发送');
    }

    function watchManifest() {
      const manifestPath = path.resolve(process.cwd(), 'public/manifest.json');
      manifestWatcher = watch(manifestPath, {
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
      });

      manifestWatcher.on('change', () => {
        changedOutputFiles.add('public/manifest.json');
        if (!reloadTimer) reloadTimer = setTimeout(triggerReload, debounce);
      });
    }

    function cleanup() {
      if (reloadTimer) clearTimeout(reloadTimer);
      if (manifestWatcher) manifestWatcher.close().catch(() => {});
      if (server) server.close();
      clients.forEach(c => { try { c.res.end(); } catch {} });
      clients.clear();
    }

    return {
      name: 'extension-reloader',
      apply: 'build',
      enforce: 'post',

      watchChange(id) {
        if (process.env.WATCH !== 'true') return;
        const relativePath = path.relative(process.cwd(), id);
        if (relativePath.includes('node_modules') || relativePath.includes('.git')) return;
        
        // Reset buffer on new activity if we were in DONE state
        if (currentStep === 'DONE') {
          messageBuffer = [];
        }
        
        cycleStartTime = Date.now();
        updateStatus('WATCH', `检测到源文件变更: ${c.green}${relativePath}${c.reset}`);
      },

      buildStart() {
        if (process.env.WATCH !== 'true') return;
        // Verify start time is set (in case buildStart happens without watchChange, e.g. initial)
        if (cycleStartTime === 0) cycleStartTime = Date.now();
        
        updateStatus('BUILD', 'Vite 增量构建启动...');
        
        if (!server) {
          startSSEServer();
          watchManifest();
          updateStatus('WATCH', '服务已就绪，由于是首次启动，跳过自动重载');
        }
      },

      generateBundle(options, bundle) {
         if (process.env.WATCH !== 'true') return;
         
         const clientCode = generateClientCode(port);
         this.emitFile({ type: 'asset', fileName: 'reloader-client.js', source: clientCode });

         updateStatus('ANALYZE', '正在计算产物 HASH 指纹...');

         const currentSnapshot = new Map<string, string>();
         changedOutputFiles.clear();

         for (const [fileName, chunk] of Object.entries(bundle)) {
           if (fileName.endsWith('.map') || fileName === 'reloader-client.js') continue;

           let hash = '';
           if (chunk.type === 'chunk') {
             const content = chunk.code.replace(/\/\/# sourceMappingURL=.+/g, '').trim();
             hash = getHash(content);
           } else if (chunk.type === 'asset') {
             hash = getHash(chunk.source as string | Buffer);
           }

           currentSnapshot.set(fileName, hash);

           const previousHash = lastBundleSnapshot.get(fileName);
           if (!previousHash || previousHash !== hash) {
             changedOutputFiles.add(fileName);
           }
         }
         
         lastBundleSnapshot = currentSnapshot;
         
         if (changedOutputFiles.size === 0 && !isFirstBuild) {
            updateStatus('ANALYZE', '产物指纹未变 (No Output Change)');
         }
      },

      transformIndexHtml(html) {
        if (process.env.NODE_ENV === 'production') return;
        if (process.env.WATCH !== 'true') return;
        return [{ tag: 'script', injectTo: 'head-prepend', attrs: { src: '/reloader-client.js' } }];
      },

      closeBundle() {
        if (process.env.WATCH !== 'true') return;

        if (isFirstBuild) {
          isFirstBuild = false;
          cycleStartTime = 0; // Reset for next valid cycle
          updateStatus('DONE', '首次构建完成，等待文件变更...');
          return;
        }

        if (reloadTimer) clearTimeout(reloadTimer);
        reloadTimer = setTimeout(() => {
          if (changedOutputFiles.size > 0) {
             triggerReload();
          } else {
             finishCycle('无实质变更，进入空闲状态');
          }
          reloadTimer = null;
        }, 100);
      },
    };
  }

  function generateClientCode(port: number): string {
    return `
  (function() {
    'use strict';
    const RELOADER_URL = 'http://localhost:${port}/sse';
    const RECONNECT_INTERVAL = 2000;
    const STATE_KEY = '_ext_reloader_state';

    class ExtensionReloader {
      constructor() {
        this.es = null;
        this.reconnectTimer = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;

        // 🚀 页面加载时立即尝试恢复状态
        this.restoreState();

        this.connect();
      }

      connect() {
        if (this.es) return;

        this.es = new EventSource(RELOADER_URL);
        
        this.es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (e) { console.error('[Reloader] Parse error', e); }
        };

        this.es.onopen = () => {
          console.log('[Reloader] Connected');
          this.reconnectAttempts = 0;
        };

        this.es.onerror = () => {
          this.es.close();
          this.es = null;
          this.attemptReconnect();
        };
      }

      handleMessage(msg) {
        if (msg.type === 'connected') return;
        if (msg.type === 'ping') return;

        console.log('[Reloader] Signal:', msg.type, msg.files);

        if (msg.message) {
          this.showToast(msg.message);
        }

        switch (msg.type) {
          case 'css':
            this.handleCSSReload(msg.files);
            break;
          case 'extension':
            if (chrome.runtime && chrome.runtime.reload) {
              chrome.runtime.reload();
            } else {
              location.reload();
            }
            break;
          case 'page':
          default:
            this.saveState(); // 💾 保存状态
            setTimeout(() => location.reload(), 200); // Delay for toast visibility
            break;
        }
      }

      handleCSSReload(files) {
        const links = document.querySelectorAll('link[rel="stylesheet"]');
        let updatedCount = 0;
        
        links.forEach(link => {
          const url = new URL(link.href);
          const linkPath = url.pathname.replace(/^\\//, ''); // Remove leading slash
          
          // Match against any changed file
          // files are relative paths like 'assets/index.css'
          const shouldReload = !files || files.some(f => {
            // Remove 'assets/' prefix if present in file path for safer matching against URL
            // because dist URL might be /assets/index.css
            const normalizedFile = f.replace(/^assets\\//, '');
            return linkPath.includes(normalizedFile);
          });

          if (shouldReload) {
            url.searchParams.set('t', Date.now());
            link.href = url.toString();
            updatedCount++;
          }
        });
        
        console.log(\`[Reloader] Reloaded \${updatedCount} CSS files\`);
      }

      saveState() {
        try {
          const state = {
            scroll: { x: window.scrollX, y: window.scrollY },
            path: location.pathname + location.search + location.hash,
            timestamp: Date.now()
          };
          sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
        } catch (e) {
          console.warn('[Reloader] Failed to save state:', e);
        }
      }

      restoreState() {
        try {
          const raw = sessionStorage.getItem(STATE_KEY);
          if (!raw) return;

          const state = JSON.parse(raw);
          // 仅恢复 5 秒内的状态，避免旧数据干扰
          if (Date.now() - state.timestamp > 5000) {
            sessionStorage.removeItem(STATE_KEY);
            return;
          }

          // Vue 渲染需要时间，多次尝试恢复滚动位置
          const restoreScroll = () => {
            if (state.scroll.x !== 0 || state.scroll.y !== 0) {
              window.scrollTo(state.scroll.x, state.scroll.y);
            }
          };

          // 立即尝试
          restoreScroll();
          // 等待 Vue 挂载
          setTimeout(restoreScroll, 100);
          // 最后兜底
          setTimeout(restoreScroll, 300);

          sessionStorage.removeItem(STATE_KEY);
          console.log('[Reloader] State restored');
        } catch (e) {
          console.warn('[Reloader] Failed to restore state:', e);
        }
      }

      attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.warn('[Reloader] Max reconnect attempts reached');
          return;
        }
        
        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
        
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), delay);
      }

      showToast(text) {
        // Prevent duplicates
        if (document.getElementById('reloader-toast')) return;

        const toast = document.createElement('div');
        toast.id = 'reloader-toast';
        toast.textContent = text;
        
        // Mimic Project Tooltip Style
        Object.assign(toast.style, {
          position: 'fixed',
          top: '24px',
          right: '84px', // Aligned near top actions
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(10px)',
          color: 'rgba(255, 255, 255, 0.9)',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '500',
          zIndex: '9999999',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          pointerEvents: 'none',
          opacity: '0',
          transition: 'opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontFamily: 'Inter, system-ui, sans-serif'
        });

        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
          toast.style.opacity = '1';
        });

        // Remove after 2.5s
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 300);
        }, 2500);
      }
    }

    // Start
    new ExtensionReloader();
  })();
  `.trim();
  }