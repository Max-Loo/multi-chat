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
const versionType = args[0] || 'patch'; // 默认为补丁版本更新

// 版本类型验证
const validVersionTypes = ['major', 'minor', 'patch', 'prerelease'];
if (!validVersionTypes.includes(versionType)) {
  console.error(`无效的版本类型: ${versionType}`);
  console.error(`有效类型: ${validVersionTypes.join(', ')}`);
  process.exit(1);
}

// 读取package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// 解析当前版本
const currentVersion = packageJson.version;
console.log(`当前版本: ${currentVersion}`);

// 分割版本号
const versionParts = currentVersion.split('.');
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
let newVersion;
if (versionType === 'prerelease') {
  newVersion = `${major}.${minor}.${patch}-alpha`;
} else {
  newVersion = `${major}.${minor}.${patch}`;
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
