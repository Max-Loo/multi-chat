/**
 * @description 本地生产用户聊天记录的id的时候会用到的前缀
 */
export const USER_MESSAGE_ID_PREFIX = 'user_msg_'


/**
 * 储存在本地存储前增加一个前缀，避免和其他键冲突
 */
export const LOCAL_STORAGE_PREFIX = 'multi-chat-'


/**
 * 当前应用支持的语言
 */
export const SUPPORTED_LANGUAGE_LIST = [
  'zh',
  'en',
]

/**
 * 网络请求配置
 */
export const NETWORK_CONFIG = {
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
 * 缓存配置
 */
export const CACHE_CONFIG = {
  /** 缓存过期时间（24 小时） */
  EXPIRY_TIME_MS: 24 * 60 * 60 * 1000,
  /** 缓存版本（API 结构变更时递增） */
  CACHE_VERSION: 1,
  /** 最大缓存大小（10 MB） */
  MAX_CACHE_SIZE_MB: 10,
} as const;

/**
 * 允许的模型供应商白名单
 */
export const ALLOWED_MODEL_PROVIDERS: readonly string[] = [
  "moonshotai", // Kimi
  "deepseek",
  "zhipuai", // Zhipu
  "zhipuai-coding-plan",
] as const;