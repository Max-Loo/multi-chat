/**
 * 统一脱敏管道
 *
 * 按顺序应用所有脱敏器
 */

import { shouldSanitizeField, sanitizeApiKey, isApiKeyLike } from './apiKey';
import {
  shouldSanitizeContent,
  sanitizeContent,
} from './content';
import { sanitizePiiInString, sanitizePath } from './pii';

/**
 * 脱敏单个值
 * @param key 字段名
 * @param value 字段值
 */
function sanitizeValue(key: string, value: unknown): unknown {
  // 处理字符串值
  if (typeof value === 'string') {
    // 1. API Key 脱敏
    if (shouldSanitizeField(key) || isApiKeyLike(value)) {
      return sanitizeApiKey(value);
    }

    // 2. 内容脱敏
    if (shouldSanitizeContent(key)) {
      return sanitizeContent(value);
    }

    // 3. 路径脱敏
    if (key.toLowerCase().includes('path') || key.toLowerCase().includes('file')) {
      return sanitizePath(value);
    }

    // 4. PII 脱敏（字符串中的邮箱、手机号）
    return sanitizePiiInString(value);
  }

  // 处理对象和数组（递归）
  if (typeof value === 'object' && value !== null) {
    return sanitizeObject(value);
  }

  return value;
}

/**
 * 递归脱敏对象
 * @param obj 待脱敏对象
 */
export function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return sanitizeObject(item);
      }
      return item;
    });
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = sanitizeValue(key, value);
  }

  return result;
}

/**
 * 脱敏日志上下文
 * @param context 日志上下文
 */
export function sanitizeContext(
  context: Record<string, unknown>
): Record<string, unknown> {
  return sanitizeObject(context) as Record<string, unknown>;
}

// 导出所有脱敏器
export * from './apiKey';
export * from './content';
export * from './pii';
