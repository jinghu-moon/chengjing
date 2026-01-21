#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import archiver from 'archiver';

// 解析命令行参数
const args = process.argv.slice(2);
const platforms = args.includes('--chrome') ? ['chrome'] :
                  args.includes('--edge') ? ['edge'] :
                  args.includes('--firefox') ? ['firefox'] :
                  args.includes('--all') ? ['chrome', 'edge', 'firefox'] :
                  ['chrome', 'edge', 'firefox'];
const skipBuild = args.includes('--skip-build');

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

async function main() {
  try {
    // 1. 构建（除非跳过）
    if (!skipBuild) {
      console.log('🔨 执行构建...');
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ 构建完成\n');
    }

    // 2. 验证 dist 目录
    if (!fs.existsSync(distDir)) {
      throw new Error('dist 目录不存在，请先执行构建');
    }

    // 3. 读取配置
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const { name, version, geckoId } = pkg;
    const baseManifest = JSON.parse(fs.readFileSync(path.join(distDir, 'manifest.json'), 'utf8'));

    // 4. 创建 releases 目录
    const releaseDir = path.join(rootDir, 'releases', `v${version}`);
    if (!fs.existsSync(releaseDir)) {
      fs.mkdirSync(releaseDir, { recursive: true });
    }

    // 5. 为每个平台打包
    console.log('📦 开始打包...\n');
    for (const platform of platforms) {
      const manifest = adaptManifest(baseManifest, platform, geckoId, name);
      await createZip(platform, manifest, name, version, releaseDir);
    }

    console.log('\n✨ 打包完成！');
  } catch (err) {
    console.error(`\n❌ 打包失败: ${err.message}`);
    process.exit(1);
  }
}

/**
 * 适配 manifest 到不同平台
 */
function adaptManifest(base, platform, geckoId, name) {
  const manifest = JSON.parse(JSON.stringify(base));

  if (platform === 'firefox') {
    // Firefox 特殊处理
    if (manifest.background?.service_worker) {
      manifest.background = {
        scripts: [manifest.background.service_worker],
        type: "module"
      };
    }

    manifest.browser_specific_settings = {
      gecko: {
        id: geckoId || `${name}@example.com`,
        strict_min_version: "109.0"
      }
    };
  } else {
    // Chrome/Edge：移除 Firefox 特定字段
    delete manifest.browser_specific_settings;
  }

  return manifest;
}

/**
 * 创建 zip 归档
 */
function createZip(platform, manifest, name, version, releaseDir) {
  return new Promise((resolve, reject) => {
    const fileName = `${name}-${platform}-v${version}.zip`;
    const outputPath = path.join(releaseDir, fileName);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const size = (archive.pointer() / 1024 / 1024).toFixed(2);
      console.log(`  ✓ ${platform.padEnd(8)} ${fileName} (${size} MB)`);
      resolve();
    });

    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);

    // 添加适配后的 manifest.json
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

    // 添加 dist 目录下的所有文件（排除 manifest.json 和 .map 文件）
    archive.glob('**/*', {
      cwd: distDir,
      ignore: ['manifest.json', '**/*.map', '**/.DS_Store', '**/Thumbs.db']
    });

    archive.finalize();
  });
}

main();
