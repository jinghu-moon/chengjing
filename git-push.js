#!/usr/bin/env node

// GitHub 推送脚本 (Node.js ES Module)
// 用法: node git-push.js [commit message]

import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';

// 文本样式定义
const style = {
  // 颜色
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // 背景色
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  
  // 样式
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  
  reset: '\x1b[0m'
};

// 组合样式函数
const format = {
  error: (text) => `${style.bold}${style.red}✗ ${text}${style.reset}`,
  success: (text) => `${style.bold}${style.green}✓ ${text}${style.reset}`,
  warning: (text) => `${style.bold}${style.yellow}⚠ ${text}${style.reset}`,
  info: (text) => `${style.cyan}ℹ ${text}${style.reset}`,
  title: (text) => `${style.bold}${style.magenta}${text}${style.reset}`,
  highlight: (text) => `${style.bold}${style.cyan}${text}${style.reset}`,
  section: (text) => `\n${style.bold}${style.bgBlue}${style.white} ${text} ${style.reset}\n`,
  fileStatus: {
    modified: (text) => `${style.yellow}● ${text}${style.reset}`,
    added: (text) => `${style.green}+ ${text}${style.reset}`,
    deleted: (text) => `${style.red}- ${text}${style.reset}`,
    untracked: (text) => `${style.cyan}? ${text}${style.reset}`,
    renamed: (text) => `${style.magenta}→ ${text}${style.reset}`
  }
};

// 分隔线
const separator = () => console.log(`${style.dim}${'─'.repeat(60)}${style.reset}`);

// 执行命令并返回输出
function exec(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    if (options.ignoreError) {
      return null;
    }
    throw error;
  }
}

// 检查是否是 Git 仓库
function isGitRepo() {
  return fs.existsSync('.git');
}

// 获取用户输入
function getUserInput(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(`${style.bold}${style.cyan}${prompt}${style.reset}`, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// 格式化文件状态显示
function formatFileStatus(line) {
  if (!line || line.length < 3) return line;
  
  const status = line.substring(0, 2);
  const filename = line.substring(3);
  
  // 根据状态码返回格式化的文本
  if (status.includes('M')) {
    return format.fileStatus.modified(`Modified: ${filename}`);
  } else if (status.includes('A')) {
    return format.fileStatus.added(`Added: ${filename}`);
  } else if (status.includes('D')) {
    return format.fileStatus.deleted(`Deleted: ${filename}`);
  } else if (status.includes('R')) {
    return format.fileStatus.renamed(`Renamed: ${filename}`);
  } else if (status.includes('?')) {
    return format.fileStatus.untracked(`Untracked: ${filename}`);
  }
  
  return `  ${filename}`;
}

// 主函数
async function main() {
  try {
    // 显示标题
    console.log(format.section('🚀 GitHub 推送工具'));
    
    // 检查是否是 git 仓库
    if (!isGitRepo()) {
      console.error(format.error('当前目录不是 Git 仓库'));
      process.exit(1);
    }

    // 获取提交信息
    let commitMsg = process.argv.slice(2).join(' ');
    if (!commitMsg) {
      commitMsg = await getUserInput('📝 请输入提交信息: ');
    }

    if (!commitMsg.trim()) {
      console.error(format.error('提交信息不能为空'));
      process.exit(1);
    }

    separator();

    // 检查是否有更改
    const statusShort = exec('git status --short', { silent: true });
    if (!statusShort || statusShort.trim() === '') {
      console.log(format.warning('没有检测到更改'));
      process.exit(0);
    }

    // 显示有改动的文件
    console.log(format.title('\n📂 检测到以下文件有改动:'));
    console.log('');
    
    const files = statusShort.trim().split('\n');
    const fileCount = files.length;
    
    files.forEach(file => {
      console.log(`  ${formatFileStatus(file)}`);
    });
    
    console.log('');
    console.log(format.info(`共 ${style.bold}${fileCount}${style.reset}${style.cyan} 个文件${style.reset}`));
    separator();

    // 添加所有更改
    console.log(format.highlight('\n▶ 正在添加文件...'));
    exec('git add .');
    console.log(format.success('文件添加完成'));

    // 提交更改
    console.log(format.highlight('\n▶ 正在提交更改...'));
    exec(`git commit -m "${commitMsg}"`, { silent: true });
    console.log(format.success(`提交完成: ${style.dim}"${commitMsg}"${style.reset}`));

    // 获取当前分支
    const branch = exec('git symbolic-ref --short HEAD', { silent: true }).trim();
    console.log(format.info(`当前分支: ${format.highlight(branch)}`));

    separator();

    // 推送到远程仓库
    console.log(format.highlight('\n▶ 正在推送到远程仓库...'));
    exec(`git push origin ${branch}`);

    console.log('');
    console.log(format.success(`成功推送到 GitHub! (${branch})`));
    console.log(format.section('✨ 完成'));
    
  } catch (error) {
    console.error('\n' + format.error(`操作失败: ${error.message}`));
    separator();
    process.exit(1);
  }
}

main();