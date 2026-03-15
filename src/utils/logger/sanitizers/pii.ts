/**
 * 个人信息脱敏器 (PII - Personally Identifiable Information)
 */

/** 邮箱正则 */
const EMAIL_REGEX = /\S+@\S+\.\S+/g;

/** 手机号正则（中国手机号） */
const PHONE_REGEX = /1[3-9]\d{9}/g;

/**
 * 脱敏邮箱
 * @param _email 邮箱地址
 */
export function sanitizeEmail(_email: string): string {
  return '[EMAIL]';
}

/**
 * 脱敏手机号
 * @param _phone 手机号
 */
export function sanitizePhone(_phone: string): string {
  return '[PHONE]';
}

/**
 * 检查字符串是否包含邮箱
 * @param text 待检查文本
 */
export function containsEmail(text: string): boolean {
  return EMAIL_REGEX.test(text);
}

/**
 * 检查字符串是否包含手机号
 * @param text 待检查文本
 */
export function containsPhone(text: string): boolean {
  return PHONE_REGEX.test(text);
}

/**
 * 脱敏字符串中的 PII
 * @param text 原始文本
 */
export function sanitizePiiInString(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // 重置正则的 lastIndex
  EMAIL_REGEX.lastIndex = 0;
  PHONE_REGEX.lastIndex = 0;

  let result = text.replace(EMAIL_REGEX, '[EMAIL]');
  result = result.replace(PHONE_REGEX, '[PHONE]');

  return result;
}

/**
 * 脱敏文件路径（隐藏用户名）
 * @param path 文件路径
 */
export function sanitizePath(path: string): string {
  if (!path || typeof path !== 'string') {
    return path;
  }

  // macOS/Linux: /Users/xxx/... 或 /home/xxx/...
  // Windows: C:\Users\xxx\...
  const userPathPatterns = [
    /^(\/Users\/)[^/]+(\/.*)$/,
    /^(\/home\/)[^/]+(\/.*)$/,
    /^(\/Users)[^/]*(\/.*)$/,
    /^([A-Z]:\\Users\\)[^\\]+(\\.*)$/,
  ];

  for (const pattern of userPathPatterns) {
    if (pattern.test(path)) {
      return path.replace(pattern, '$1...$2');
    }
  }

  return path;
}
