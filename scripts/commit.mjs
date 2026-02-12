import { execSync } from 'child_process'
import fs from 'fs'

const style = {
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', bold: '\x1b[1m', dim: '\x1b[2m', reset: '\x1b[0m',
}

const msg = process.argv[2]
if (!msg?.trim()) {
  console.log(`${style.red}✗ 请提供提交信息${style.reset}`)
  console.log(`${style.dim}  用法: npm run commit "feat(SearchBar): 新增多搜组合"${style.reset}`)
  process.exit(1)
}

// 检查是否有变更
const status = execSync('git status --short', { encoding: 'utf8' }).trim()
if (!status) {
  console.log(`${style.green}✓ 工作区干净，无需提交${style.reset}`)
  process.exit(0)
}

// 显示变更
console.log(`${style.cyan}ℹ 变更文件:${style.reset}`)
status.split('\n').forEach(line => {
  const s = line.substring(0, 2)
  const f = line.substring(3)
  const color = s.includes('M') ? style.yellow : s.includes('?') ? style.cyan : s.includes('D') ? style.red : style.green
  console.log(`  ${color}${s} ${f}${style.reset}`)
})

// 暂存并提交（不推送）
execSync('git add .', { stdio: 'inherit' })
fs.writeFileSync('.git/COMMIT_EDITMSG', msg)
execSync('git commit -F .git/COMMIT_EDITMSG', { stdio: 'inherit' })

console.log(`\n${style.green}${style.bold}✓ 已提交: "${msg}"${style.reset}`)
console.log(`${style.dim}  准备推送时运行: npm run release${style.reset}`)
