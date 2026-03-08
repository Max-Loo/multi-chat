/**
 * 远程模型服务的网络请求配置
 */
export const REMOTE_MODEL_NETWORK_CONFIG = {
  /** 默认请求超时时间（5 秒） */
  DEFAULT_TIMEOUT: 5000,
  /** 默认最大重试次数 */
  DEFAULT_MAX_RETRIES: 2,
  /** 重试延迟基数（毫秒），使用指数退避算法 */
  RETRY_DELAY_BASE: 1000,
  /** API 端点 URL */
  API_ENDPOINT: "https://models.dev/api.json",
} as const;

/**
 * 远程模型服务的缓存配置
 */
export const REMOTE_MODEL_CACHE_CONFIG = {
  /** 缓存过期时间（24 小时） */
  EXPIRY_TIME_MS: 24 * 60 * 60 * 1000,
  /** 缓存版本（API 结构变更时递增） */
  CACHE_VERSION: 1,
  /** 最大缓存大小（10 MB） */
  MAX_CACHE_SIZE_MB: 10,
} as const;

/**
 * 允许的远程模型供应商白名单
 */
export const ALLOWED_REMOTE_MODEL_PROVIDERS: readonly string[] = [
  "moonshotai", // Kimi
  "deepseek",
  "zhipuai", // Zhipu
  "zhipuai-coding-plan",
] as const;
