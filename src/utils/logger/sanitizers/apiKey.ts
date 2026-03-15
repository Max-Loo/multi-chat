/**
 * API Key 脱敏器
 */

/** 需要脱敏的字段名 */
const SENSITIVE_FIELD_NAMES = [
  'apiKey',
  'api_key',
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'secret',
  'password',
  'credential',
];

/**
 * 检查字段名是否需要脱敏
 * @param fieldName 字段名
 */
export function shouldSanitizeField(fieldName: string): boolean {
  const lowerName = fieldName.toLowerCase();
  return SENSITIVE_FIELD_NAMES.some((name) =>
    lowerName.includes(name.toLowerCase())
  );
}

/**
 * 脱敏 API Key
 * @param value 原始值
 */
export function sanitizeApiKey(value: string): string {
  if (!value || typeof value !== 'string') {
    return value;
  }

  // 如果是加密后的值，不脱敏
  if (value.startsWith('enc:')) {
    return '[ENCRYPTED]';
  }

  // 保留前4后4，中间用 **** 替换
  if (value.length <= 12) {
    return '****';
  }

  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

/**
 * 检查值是否可能是 API Key
 * @param value 待检查的值
 */
export function isApiKeyLike(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  // 常见的 API Key 前缀
  const apiKeyPatterns = [
    /^sk-/, // OpenAI
    /^sk-ant-/, // Anthropic
    /^sk-or-/, // OpenRouter
    /^aiza/, // Google
    /^ghp_/, // GitHub
    /^gho_/, // GitHub OAuth
    /^glpat-/, // GitLab
  ];

  return apiKeyPatterns.some((pattern) => pattern.test(value));
}
