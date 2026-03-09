#!/usr/bin/env node

/**
 * 国际化翻译完整性检查工具
 *
 * 用途：验证所有支持语言的翻译文件具有相同的键值结构，确保不存在遗漏的翻译。
 *
 * 使用方法：
 * - 直接运行：node scripts/check-i18n.js
 * - 使用 npm script：npm run lint:i18n
 * - 显示详细信息：npm run lint:i18n -- --verbose
 *
 * 退出码：
 * - 0：所有翻译完整，无缺失
 * - 1：发现缺失的翻译键值
 * - 2：文件读取错误或其他问题
 *
 * 功能特性：
 * - 以英文为基准语言，比较其他语言的翻译文件
 * - 支持嵌套键值的深度比较
 * - 生成清晰的差异报告
 * - 支持命令行参数（--verbose 显示详细信息）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  localesDir: path.join(__dirname, '../src/locales'),
  referenceLanguage: 'en',
  supportedLanguages: ['en', 'zh', 'fr'],
  verbose: process.argv.includes('--verbose')
};

/**
 * 递归获取对象的所有键路径
 * @param {Object} obj - 要遍历的对象
 * @param {string} prefix - 键前缀
 * @returns {string[]} - 所有键路径数组
 */
function getKeyPaths(obj, prefix = '') {
  const paths = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const currentPath = prefix ? `${prefix}.${key}` : key;

      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        // 递归处理嵌套对象
        paths.push(...getKeyPaths(obj[key], currentPath));
      } else {
        // 添加叶子节点路径
        paths.push(currentPath);
      }
    }
  }

  return paths;
}

/**
 * 根据键路径获取对象中的值
 * @param {Object} obj - 对象
 * @param {string} keyPath - 键路径（如 "autoNaming.title"）
 * @returns {*} - 对应的值
 */
function getValueByPath(obj, keyPath) {
  const keys = keyPath.split('.');
  let value = obj;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }

  return value;
}

/**
 * 读取并解析 JSON 文件
 * @param {string} filePath - 文件路径
 * @returns {Object|null} - 解析后的对象，失败返回 null
 */
function readJSONFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ 读取文件失败: ${filePath}`);
    console.error(`   错误: ${error.message}`);
    return null;
  }
}

/**
 * 获取所有语言目录下的翻译文件列表
 * @returns {string[]} - 翻译文件名数组（不含路径）
 */
function getTranslationFiles() {
  const files = new Set();

  for (const lang of CONFIG.supportedLanguages) {
    const langDir = path.join(CONFIG.localesDir, lang);

    if (fs.existsSync(langDir)) {
      const entries = fs.readdirSync(langDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.json')) {
          files.add(entry.name);
        }
      }
    }
  }

  return Array.from(files).toSorted();
}

/**
 * 检查单个翻译文件的完整性
 * @param {string} fileName - 翻译文件名（如 "common.json"）
 * @returns {Object} - 检查结果
 */
function checkTranslationFile(fileName) {
  const referenceFile = path.join(CONFIG.localesDir, CONFIG.referenceLanguage, fileName);
  const referenceData = readJSONFile(referenceFile);

  if (!referenceData) {
    return {
      fileName,
      success: false,
      error: `无法读取基准语言文件: ${referenceFile}`
    };
  }

  const referenceKeys = getKeyPaths(referenceData);
  const results = {
    fileName,
    referenceKeys: referenceKeys.length,
    languages: {}
  };

  for (const lang of CONFIG.supportedLanguages) {
    if (lang === CONFIG.referenceLanguage) {
      results.languages[lang] = {
        status: 'baseline',
        missingKeys: []
      };
      continue;
    }

    const langFile = path.join(CONFIG.localesDir, lang, fileName);
    const langData = readJSONFile(langFile);

    if (!langData) {
      results.languages[lang] = {
        status: 'error',
        missingKeys: [],
        error: '无法读取文件'
      };
      continue;
    }

    const langKeys = getKeyPaths(langData);
    const missingKeys = referenceKeys.filter(key => !langKeys.includes(key));

    results.languages[lang] = {
      status: missingKeys.length === 0 ? 'complete' : 'incomplete',
      totalKeys: langKeys.length,
      missingKeys: missingKeys,
      missingCount: missingKeys.length
    };

    if (CONFIG.verbose && missingKeys.length > 0) {
      console.log(`\n  ${lang} 缺失的键值:`);
      missingKeys.forEach(key => {
        console.log(`    - ${key}`);
      });
    }
  }

  return results;
}

/**
 * 生成并显示差异报告
 * @param {Object[]} results - 检查结果数组
 * @returns {boolean} - 是否所有翻译都完整
 */
function generateReport(results) {
  console.log('\n📊 国际化翻译完整性检查报告\n');
  console.log(`基准语言: ${CONFIG.referenceLanguage}`);
  console.log(`支持语言: ${CONFIG.supportedLanguages.join(', ')}`);
  console.log(`检查文件: ${results.length} 个\n`);

  let allComplete = true;
  let totalMissing = 0;

  for (const result of results) {
    console.log(`📄 ${result.fileName}`);
    console.log(`   基准键值数量: ${result.referenceKeys}`);

    for (const [lang, langResult] of Object.entries(result.languages)) {
      if (langResult.status === 'baseline') {
        console.log(`   ✓ ${lang}: 基准语言`);
      } else if (langResult.status === 'complete') {
        console.log(`   ✓ ${lang}: 完整 (${langResult.totalKeys} 个键值)`);
      } else if (langResult.status === 'incomplete') {
        console.log(`   ✗ ${lang}: 缺失 ${langResult.missingCount} 个键值`);
        allComplete = false;
        totalMissing += langResult.missingCount;

        if (CONFIG.verbose) {
          langResult.missingKeys.forEach(key => {
            const referenceValue = getValueByPath(
              readJSONFile(path.join(CONFIG.localesDir, CONFIG.referenceLanguage, result.fileName)),
              key
            );
            console.log(`      - ${key}: "${referenceValue}"`);
          });
        }
      } else {
        console.log(`   ❌ ${lang}: 错误 - ${langResult.error}`);
        allComplete = false;
      }
    }

    console.log('');
  }

  // 总结
  console.log('─'.repeat(50));

  if (allComplete) {
    console.log('\n✅ 所有翻译文件完整，无缺失！\n');
  } else {
    console.log(`\n❌ 发现 ${totalMissing} 个缺失的翻译键值\n`);
    console.log('💡 提示:');
    console.log('   - 运行 `npm run lint:i18n -- --verbose` 查看详细信息');
    console.log('   - 请补充缺失的翻译后重新检查\n');
  }

  return allComplete;
}

/**
 * 主函数
 */
function main() {
  if (CONFIG.verbose) {
    console.log('🔍 详细模式已启用\n');
  }

  // 获取所有翻译文件
  const translationFiles = getTranslationFiles();

  if (translationFiles.length === 0) {
    console.error('❌ 未找到任何翻译文件');
    process.exit(2);
  }

  // 检查每个翻译文件
  const results = translationFiles.map(fileName => checkTranslationFile(fileName));

  // 生成报告
  const allComplete = generateReport(results);

  // 退出
  process.exit(allComplete ? 0 : 1);
}

// 运行主函数
main();
