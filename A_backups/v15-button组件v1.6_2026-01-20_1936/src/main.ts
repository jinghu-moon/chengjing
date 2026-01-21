import { createApp } from 'vue'
import './styles/variables.css'
import './styles/drag.css'
import './styles/index.css'
import './assets/font/HarmonyOS_Sans_SC/result.css'
import App from './App.vue'
import Demo from './demo.vue'

// 开发模式下支持通过 URL 参数切换到 Demo 页面
// 访问 http://localhost:5173/?demo 即可查看组件演示
const isDemoMode = import.meta.env.DEV && window.location.search.includes('demo')

createApp(isDemoMode ? Demo : App).mount('#app')
