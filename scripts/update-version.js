#!/usr/bin/env node

/**
 * 版本更新脚本
 * 用于在发布前自动更新版本号
 */

import fs from 'fs'
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径（ES模块中的__dirname替代方案）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取命令行参数
const args = process.argv.slice(2);
const input = args[0] || 'patch'; // 默认为补丁版本更新

// 读取package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 解析当前版本
const currentVersion = packageJson.version;
console.log(`当前版本: ${currentVersion}`);

/**
 * 检查是否为有效的语义化版本号
 * @param {string} version - 版本号字符串
 * @returns {boolean} 是否为有效版本号
 */
const isValidVersion = (version) => {
  // 支持标准版本号 (x.y.z) 和预发布版本号 (x.y.z-alpha, x.y.z-beta.1 等)
  const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*)?$/;
  return versionRegex.test(version);
};

let newVersion;

// 判断输入是版本号还是版本类型
if (isValidVersion(input)) {
  // 直接使用指定的版本号
  newVersion = input;
  console.log(`指定版本: ${newVersion}`);
} else {
  // 按版本类型处理
  const versionType = input;
  const validVersionTypes = ['major', 'minor', 'patch', 'prerelease'];

  if (!validVersionTypes.includes(versionType)) {
    console.error(`无效的版本类型或版本号: ${versionType}`);
    console.error(`有效版本类型: ${validVersionTypes.join(', ')}`);
    console.error(`或直接指定版本号: x.y.z (如 0.3.3)`);
    process.exit(1);
  }

  // 分割版本号
  const versionParts = currentVersion.split('-')[0].split('.'); // 移除预发布后缀后分割
  let major = parseInt(versionParts[0], 10);
  let minor = parseInt(versionParts[1], 10);
  let patch = parseInt(versionParts[2], 10);

  // 根据类型更新版本号
  switch (versionType) {
    case 'major':
      major += 1;
      minor = 0;
      patch = 0;
      break;
    case 'minor':
      minor += 1;
      patch = 0;
      break;
    case 'patch':
      patch += 1;
      break;
    case 'prerelease':
      // 如果是预发布版本，增加补丁号并添加-alpha后缀
      patch += 1;
      break;
  }

  // 构建新版本号
  if (versionType === 'prerelease') {
    newVersion = `${major}.${minor}.${patch}-alpha`;
  } else {
    newVersion = `${major}.${minor}.${patch}`;
  }
}

console.log(`新版本: ${newVersion}`);

// 更新package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// 更新Tauri配置文件
const tauriConfigPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
tauriConfig.version = newVersion;
fs.writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n');

// 更新Cargo.toml
const cargoTomlPath = path.join(__dirname, '../src-tauri/Cargo.toml');
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
// 使用正则表达式替换版本号
cargoToml = cargoToml.replace(/^version = ".*$/m, `version = "${newVersion}"`);
fs.writeFileSync(cargoTomlPath, cargoToml);

console.log('版本更新完成!');
console.log(`已更新以下文件中的版本号:`);
console.log(`- package.json`);
console.log(`- src-tauri/tauri.conf.json`);
console.log(`- src-tauri/Cargo.toml`);
