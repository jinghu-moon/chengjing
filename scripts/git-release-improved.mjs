import { exec } from 'child_process';
import fs from 'fs';
import readline from 'readline';
import { promisify } from 'util';

const execAsync = promisify(exec);
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = `v${pkg.version}`;

// --- UI 工具 ---
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let timer;
const startSpinner = (msg) => {
  let i = 0;
  process.stdout.write('\x1b[?25l');
  timer = setInterval(() => {
    process.stdout.write(`\r\x1b[36m${frames[i++ % frames.length]}\x1b[0m ${msg}...`);
  }, 80);
};
const stopSpinner = (ok = true, msg = '') => {
  clearInterval(timer);
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  console.log(ok ? `\x1b[32m✔\x1b[0m ${msg}` : `\x1b[31m✖\x1b[0m ${msg}`);
  process.stdout.write('\x1b[?25h');
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

async function run() {
  console.log(`\n\x1b[1m\x1b[34m[手动发布流水线] 目标版本: ${version}\x1b[0m\n`);

  try {
    // 1. 构建预检（在 git add 之前）
    startSpinner('正在执行 npm run build 预检');
    await execAsync('npm run build');
    stopSpinner(true, '项目构建成功，代码状态良好');

    // 2. 检查工作区状态
    const { stdout: status } = await execAsync('git status --porcelain');
    if (!status.trim()) {
      console.log('\n✨ 工作区干净，无需发布');
      process.exit(0);
    }

    // 3. 显示变更并确认
    console.log('\n📝 检测到以下变更：');
    console.log(status);
    const msg = process.argv[2] || await ask('\n请输入本次 Commit 说明: ');
    if (!msg.trim()) {
      console.log('❌ 已取消');
      process.exit(0);
    }

    // 4. Git 流程
    startSpinner('正在暂存文件');
    await execAsync('git add .');
    stopSpinner(true, '文件已暂存');

    startSpinner('正在提交更改');
    try {
      // 使用文件避免引号转义问题
      fs.writeFileSync('.git/COMMIT_EDITMSG', msg);
      await execAsync('git commit -F .git/COMMIT_EDITMSG');
      stopSpinner(true, '提交成功');
    } catch (err) {
      if (err.message.includes('nothing to commit')) {
        stopSpinner(true, '无需提交（已是最新）');
      } else {
        stopSpinner(false, '提交失败');
        throw err;
      }
    }

    // 5. 推送到远程
    startSpinner('正在推送至 GitHub');
    const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD');
    const branch = branchOut.trim();
    await execAsync(`git push origin ${branch}`);
    stopSpinner(true, `已推送至 origin/${branch}`);

    // 6. 处理 Tag
    startSpinner(`正在处理 Git Tag ${version}`);
    const { stdout: tagsOut } = await execAsync('git tag');
    const tagList = tagsOut.split('\n').map(t => t.trim()).filter(Boolean);

    if (tagList.includes(version)) {
      stopSpinner(true, `标签 ${version} 已存在，跳过创建`);
    } else {
      await execAsync(`git tag -a ${version} -m "Release ${version}: ${msg}"`);
      await execAsync(`git push origin ${version}`);
      stopSpinner(true, `标签 ${version} 已创建并推送`);
    }

    console.log(`\n\x1b[42m\x1b[30m DONE \x1b[0m 版本 ${version} 发布完成！\n`);
  } catch (err) {
    stopSpinner(false, `发布失败: ${err.message}`);
    console.log(`\n\x1b[31m[错误详情]:\x1b[0m\n${err.stderr || err.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

run();
