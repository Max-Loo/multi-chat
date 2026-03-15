/**
 * 内容脱敏器
 */

/** 需要脱敏内容的字段名 */
const CONTENT_FIELD_NAMES = ['content', 'message', 'text', 'body', 'prompt'];

/**
 * 检查字段名是否需要内容脱敏
 * @param fieldName 字段名
 */
export function shouldSanitizeContent(fieldName: string): boolean {
  return CONTENT_FIELD_NAMES.includes(fieldName);
}

/**
 * 计算字符串字节大小
 * @param str 字符串
 */
function getByteSize(str: string): number {
  return new Blob([str]).size;
}

/**
 * 脱敏内容
 * @param value 原始内容
 */
export function sanitizeContent(value: string): string {
  if (!value || typeof value !== 'string') {
    return value;
  }

  const byteSize = getByteSize(value);
  return `[CONTENT: ${byteSize}B]`;
}

/**
 * 脱敏对象中的内容字段（递归）
 * @param obj 待处理对象
 * @param depth 递归深度
 */
export function sanitizeContentRecursive(
  obj: unknown,
  depth: number = 0
): unknown {
  // 防止无限递归
  if (depth > 10) {
    return '[MAX_DEPTH]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeContentRecursive(item, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (shouldSanitizeContent(key) && typeof value === 'string') {
      result[key] = sanitizeContent(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeContentRecursive(value, depth + 1);
    } else {
      result[key] = value;
    }
  }

  return result;
}
