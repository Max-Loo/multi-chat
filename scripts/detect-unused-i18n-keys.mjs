#!/usr/bin/env node

/**
 * 检测未使用的国际化翻译 key
 *
 * 此脚本会：
 * 1. 读取 src/locales/en 目录下的所有 JSON 文件，提取所有定义的 key
 * 2. 扫描 src 目录下所有 TypeScript/TSX 文件中的 t() 函数调用
 * 3. 对比并生成未使用 key 的候选列表
 * 4. 按语言文件分组输出报告
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const EN_LOCALE_DIR = path.join(LOCALES_DIR, 'en');
const SRC_DIR = path.join(__dirname, '../src');
const OUTPUT_FILE = path.join(__dirname, '../openspec/changes/remove-unused-i18n-keys/unused-keys-report.json');

/**
 * 递归读取目录下的所有 JSON 文件并提取所有 key
 * @param {string} dir - 目录路径
 * @returns {Object} - 按文件分组的 key 集合
 */
function extractKeysFromLocales(dir) {
  const result = {};

  if (!fs.existsSync(dir)) {
    console.error(`错误: 目录不存在 ${dir}`);
    return result;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (!file.endsWith('.json') || file.startsWith('.')) {
      continue;
    }

    const filePath = path.join(dir, file);
    const fileName = path.basename(file, '.json');

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(content);
      // 提取 key 时添加命名空间前缀（文件名）
      const keys = extractAllKeys(json).map(key => `${fileName}.${key}`);

      result[fileName] = {
        filePath: filePath.replace(__dirname + '/', ''),
        keys: keys,
        count: keys.length
      };

      console.log(`✓ 读取 ${file}: ${keys.length} 个 key`);
    } catch (error) {
      console.warn(`⚠️  无法解析文件 ${file}: ${error.message}`);
    }
  }

  return result;
}

/**
 * 递归提取对象中的所有 key（使用点号表示法）
 * @param {Object} obj - JSON 对象
 * @param {string} prefix - 前缀
 * @returns {Array<string>} - key 列表
 */
function extractAllKeys(obj, prefix = '') {
  const keys = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        // 递归处理嵌套对象
        keys.push(...extractAllKeys(obj[key], fullKey));
      } else {
        // 基本类型 key
        keys.push(fullKey);
      }
    }
  }

  return keys;
}

/**
 * 递归扫描目录下的所有 TypeScript/TSX 文件
 * @param {string} dir - 目录路径
 * @returns {Array<string>} - 文件路径列表
 */
function scanSourceFiles(dir) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // 跳过特定目录
      if (['node_modules', 'dist', '.git', '__tests__', '__mocks__'].includes(entry.name)) {
        continue;
      }
      files.push(...scanSourceFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 从文件内容中提取 t() 函数调用中使用的 key
 * 支持两种形式:
 * 1. t('key') 或 t("key") - 字符串形式
 * 2. t($ => $.namespace.key) - 函数形式（TypeScript 类型安全）
 * @param {string} content - 文件内容
 * @returns {Set<string>} - 使用的 key 集合
 */
function extractUsedKeys(content) {
  const usedKeys = new Set();

  // 模式 1: 匹配 t('key') 或 t("key") 的字符串形式
  const stringPatterns = [
    /t\(['"`]([^'"`]+)['"`]\)/g,
    /t\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  ];

  for (const pattern of stringPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      usedKeys.add(match[1]);
    }
  }

  // 模式 2: 匹配 t($ => $.namespace.key) 的函数形式
  // 这个模式使用正则表达式提取 $. 后面的路径
  const functionPattern = /t\(\$ => \$\.\s*([a-zA-Z0-9_.]+)/g;
  let match;
  while ((match = functionPattern.exec(content)) !== null) {
    usedKeys.add(match[1]);
  }

  return usedKeys;
}

/**
 * 扫描所有源文件并提取使用的 key
 * @param {Array<string>} files - 文件路径列表
 * @returns {Set<string>} - 使用的 key 集合
 */
function scanUsedKeys(files) {
  const usedKeys = new Set();
  let fileCount = 0;

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const keys = extractUsedKeys(content);

      keys.forEach(key => usedKeys.add(key));
      fileCount++;
    } catch (error) {
      console.warn(`⚠️  无法读取文件 ${file}: ${error.message}`);
    }
  }

  console.log(`✓ 扫描了 ${fileCount} 个源文件`);
  console.log(`✓ 找到 ${usedKeys.size} 个使用的 key`);

  return usedKeys;
}

/**
 * 生成未使用 key 的报告
 * @param {Object} localeKeys - 语言文件 key 数据
 * @param {Set<string>} usedKeys - 使用的 key 集合
 * @returns {Object} - 未使用 key 的报告
 */
function generateUnusedKeysReport(localeKeys, usedKeys) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: Object.keys(localeKeys).length,
      totalKeys: 0,
      usedKeys: usedKeys.size,
      unusedKeys: 0
    },
    files: {}
  };

  for (const [fileName, data] of Object.entries(localeKeys)) {
    const unusedKeys = data.keys.filter(key => !usedKeys.has(key));

    report.summary.totalKeys += data.count;
    report.summary.unusedKeys += unusedKeys.length;

    if (unusedKeys.length > 0) {
      report.files[fileName] = {
        filePath: data.filePath,
        totalKeys: data.count,
        unusedKeys: unusedKeys,
        unusedCount: unusedKeys.length
      };

      console.log(`\n${fileName}:`);
      console.log(`  总计: ${data.count} 个 key`);
      console.log(`  未使用: ${unusedKeys.length} 个 key`);
      unusedKeys.forEach(key => console.log(`    - ${key}`));
    } else {
      console.log(`\n${fileName}: 所有 ${data.count} 个 key 都在使用中 ✓`);
    }
  }

  return report;
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始检测未使用的国际化翻译 key...\n');

  try {
    // 1. 提取所有语言文件中的 key
    console.log('步骤 1: 提取语言文件中的 key');
    const localeKeys = extractKeysFromLocales(EN_LOCALE_DIR);

    if (Object.keys(localeKeys).length === 0) {
      console.error('❌ 错误: 没有找到任何语言文件');
      process.exit(1);
    }

    // 2. 扫描源文件
    console.log('\n步骤 2: 扫描源文件中使用的 key');
    const sourceFiles = scanSourceFiles(SRC_DIR);
    const usedKeys = scanUsedKeys(sourceFiles);

    // 3. 生成报告
    console.log('\n步骤 3: 生成未使用 key 报告');
    const report = generateUnusedKeysReport(localeKeys, usedKeys);

    console.log('\n' + '='.repeat(60));
    console.log('📊 报告摘要:');
    console.log(`  语言文件数量: ${report.summary.totalFiles}`);
    console.log(`  总 key 数量: ${report.summary.totalKeys}`);
    console.log(`  使用的 key: ${report.summary.usedKeys}`);
    console.log(`  未使用的 key: ${report.summary.unusedKeys}`);
    console.log('='.repeat(60));

    // 4. 写入报告文件
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\n✅ 报告已保存到: ${OUTPUT_FILE}`);

    if (report.summary.unusedKeys === 0) {
      console.log('\n🎉 太棒了！没有发现未使用的 key！');
    } else {
      console.log(`\n⚠️  发现 ${report.summary.unusedKeys} 个未使用的 key，请查看报告文件了解详情。`);
    }

  } catch (error) {
    console.error('\n❌ 检测失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
