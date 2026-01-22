import { exec, execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';
import { promisify } from 'util';

const execAsync = promisify(exec);

// --- 样式定义 ---
const style = {
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
  bold: '\x1b[1m', dim: '\x1b[2m', bgBlue: '\x1b[44m',
  white: '\x1b[37m', reset: '\x1b[0m'
};

const format = {
  error: (text) => `${style.bold}${style.red}✗ ${text}${style.reset}`,
  success: (text) => `${style.bold}${style.green}✓ ${text}${style.reset}`,
  info: (text) => `${style.cyan}ℹ ${text}${style.reset}`,
  section: (text) => `\n${style.bold}${style.bgBlue}${style.white} ${text} ${style.reset}\n`,
  fileStatus: (line) => {
    const status = line.substring(0, 2);
    const filename = line.substring(3);
    if (status.includes('M')) return `${style.yellow}● Modified: ${filename}${style.reset}`;
    if (status.includes('A')) return `${style.green}+ Added: ${filename}${style.reset}`;
    if (status.includes('D')) return `${style.red}- Deleted: ${filename}${style.reset}`;
    if (status.includes('R')) return `${style.magenta}→ Renamed: ${filename}${style.reset}`;
    if (status.includes('?')) return `${style.cyan}? Untracked: ${filename}${style.reset}`;
    return `  ${filename}`;
  }
};

// --- 工具函数 ---
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
  console.log(ok ? format.success(msg) : format.error(msg));
  process.stdout.write('\x1b[?25h');
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(`${style.bold}${style.cyan}${q}${style.reset}`, res));

async function main() {
  try {
    console.log(format.section('🚀 澄镜 (ChengJing) 发布流水线'));
    
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = `v${pkg.version}`;
    console.log(`${format.info('目标版本:')} ${style.bold}${version}`);

    // 1. 构建预检
    startSpinner('执行 npm run build 预检');
    // 注意: npm run build 在有些系统上输出很多，execAsync 会缓冲输出，如果过大可能受限，
    // 但通常 vite build 输出还可以。如果需要实时输出，需要改用 spawn 或 execSync inherit
    try {
      await execAsync('npm run build');
      stopSpinner(true, '项目构建成功');
    } catch (buildErr) {
      stopSpinner(false, '构建失败');
      console.error(buildErr.stdout); // 显示构建错误日志
      console.error(buildErr.stderr);
      process.exit(1);
    }

    // 2. 检查变更
    const { stdout: statusShort } = await execAsync('git status --short');
    if (!statusShort.trim()) {
      console.log(format.success('工作区干净，无需提交。'));
    } else {
      console.log(`\n${style.bold}📂 检测到以下变更:${style.reset}`);
      statusShort.trim().split('\n').forEach(line => console.log(`  ${format.fileStatus(line)}`));
      
      const msg = process.argv[2] || await ask('\n📝 请输入提交信息: ');
      if (!msg.trim()) throw new Error('提交信息不能为空');

      startSpinner('提交更改中');
      await execAsync('git add .');
      // 使用文件避免复杂字符转义问题
      fs.writeFileSync('.git/COMMIT_EDITMSG', msg);
      await execAsync('git commit -F .git/COMMIT_EDITMSG');
      stopSpinner(true, `已提交: "${msg}"`);
    }

    // 3. 推送与冲突处理
    const branch = execSync('git symbolic-ref --short HEAD', { encoding: 'utf8' }).trim();
    startSpinner(`正在推送到远程分支 ${branch}`);
    
    try {
      await execAsync(`git push origin ${branch}`);
      stopSpinner(true, '远程推送成功');
    } catch (pushError) {
      stopSpinner(false, '推送被拒绝');
      const errorMsg = pushError.stderr || '';
      if (errorMsg.includes('Updates were rejected')) {
        console.log(format.info('远程仓库存在本地没有的更改。'));
        const answer = await ask('是否尝试拉取并合并 (git pull --rebase)? (y/n): ');
        if (answer.toLowerCase() === 'y') {
          startSpinner('正在同步远程更改');
          try {
            await execAsync(`git pull --rebase origin ${branch}`);
            // rebase 成功后再次推送
            await execAsync(`git push origin ${branch}`);
            stopSpinner(true, '同步并推送成功');
          } catch (rebaseError) {
            stopSpinner(false, '同步失败');
            console.error(format.error('拉取/合并失败，可能存在冲突。请手动解决冲突后再试。'));
            process.exit(1);
          }
        } else {
          console.log(format.info('已取消推送。'));
          process.exit(0);
        }
      } else {
        throw pushError;
      }
    }

    // 4. Git Tag 处理
    const { stdout: tagsOut } = await execAsync('git tag');
    if (tagsOut.includes(version)) {
      console.log(format.info(`标签 ${version} 已存在，跳过。`));
    } else {
      const confirmTag = await ask(`\n是否创建并推送标签 ${version}? (y/n): `);
      if (confirmTag.toLowerCase() === 'y') {
        startSpinner(`正在处理标签 ${version}`);
        await execAsync(`git tag -a ${version} -m "Release ${version}"`);
        await execAsync(`git push origin ${version}`);
        stopSpinner(true, `标签 ${version} 发布成功`);
      }
    }

    console.log(format.section('✨ 发布完成'));
  } catch (err) {
    stopSpinner(false, `操作失败`);
    console.error(`${style.red}${err.stderr || err.message}${style.reset}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
