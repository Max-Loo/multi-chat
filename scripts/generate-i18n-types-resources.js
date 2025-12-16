#!/usr/bin/env node

/**
 * 生成 i18n 资源类型声明脚本
 *
 * 此脚本会：
 * 1. 读取 src/locales/en 目录下的所有 JSON 资源文件
 * 2. 解析并合并所有资源对象
 * 3. 生成相应的 TypeScript 类型声明到 src/@types/translationResources.d.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置路径
const LOCALES_DIR = path.join(__dirname, '../src/locales');
const EN_LOCALE_DIR = path.join(LOCALES_DIR, 'en');
const OUTPUT_FILE = path.join(__dirname, '../src/@types/translationResources.d.ts');

/**
 * 将对象转换为 TypeScript 接口定义（内嵌格式）
 * @param {any} obj - 要转换的对象
 * @param {number} indent - 缩进级别
 * @returns {string} TypeScript 接口代码
 */
function objectToInterface(obj, indent = 0) {
  const indentStr = '  '.repeat(indent);
  const lines = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // 递归处理嵌套对象
        lines.push(`${indentStr}${key}: {`);
        const nestedInterface = objectToInterface(value, indent + 1);
        lines.push(nestedInterface);
        lines.push(`${indentStr}};`);
      } else {
        // 基本类型
        lines.push(`${indentStr}${key}: string;`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * 递归读取并合并所有的翻译资源
 * @param {string} dir - 目录路径
 * @returns {Object} 合并后的资源对象
 */
function loadTranslationResources(dir) {
  const resources = {};

  if (!fs.existsSync(dir)) {
    return resources;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 递归处理子目录
      const subResources = loadTranslationResources(filePath);
      if (Object.keys(subResources).length > 0) {
        resources[file] = subResources;
      }
    } else if (file.endsWith('.json') && !file.startsWith('.')) {
      try {
        // 读取 JSON 文件内容
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(content);

        // 使用文件名（不含扩展名）作为键名
        const key = path.basename(file, '.json');
        resources[key] = parsed;
      } catch (error) {
        console.warn(`警告: 无法解析文件 ${file}: ${error.message}`);
      }
    }
  }

  return resources;
}

/**
 * 生成类型声明文件内容
 * @param {any} resources - 资源对象
 * @returns {string} TypeScript 类型声明代码
 */
function generateTypeDeclaration(resources) {
  const header = `// 此文件由 generate-i18n-types-resources.js 脚本自动生成
// 请勿手动编辑此文件
// 生成时间: ${new Date().toLocaleString('zh-CN')}

interface Resources {
  translation: {
`;

  // 生成内嵌的翻译资源结构
  const translationInterface = objectToInterface(resources, 2);

  // 添加结尾
  const footer = `
  };
}

export default Resources;`;

  return header + translationInterface + footer;
}

/**
 * 主函数
 */
function main() {
  console.log('开始生成 i18n 类型声明文件...');

  try {
    // 检查目录是否存在
    if (!fs.existsSync(EN_LOCALE_DIR)) {
      console.error(`错误: 目录不存在 ${EN_LOCALE_DIR}`);
      process.exit(1);
    }

    // 读取所有资源文件
    const resources = loadTranslationResources(EN_LOCALE_DIR);

    if (Object.keys(resources).length === 0) {
      console.error('错误: 没有找到任何资源文件');
      process.exit(1);
    }

    // 生成类型声明
    const typeDeclaration = generateTypeDeclaration(resources);

    // 确保输出目录存在
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(OUTPUT_FILE, typeDeclaration, 'utf8');

    console.log(`✅ 类型声明文件已生成: ${OUTPUT_FILE}`);
    console.log('🎉 生成完成！');

  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// 运行主函数
main();
