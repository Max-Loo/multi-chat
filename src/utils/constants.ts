/**
 * 语言配置接口
 */
export interface LanguageConfig {
  code: string;
  label: string;
  flag?: string;
}

/**
 * 语言配置数组（唯一数据源）
 */
export const LANGUAGE_CONFIGS: readonly LanguageConfig[] = [
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
] as const;

/**
 * @description 本地生产用户聊天记录的id的时候会用到的前缀
 */
export const USER_MESSAGE_ID_PREFIX = "user_msg_";

/**
 * 储存在本地存储前增加一个前缀，避免和其他键冲突
 */
export const LOCAL_STORAGE_PREFIX = "multi-chat-";

/**
 * 当前应用支持的语言（从 LANGUAGE_CONFIGS 派生）
 */
export const SUPPORTED_LANGUAGE_LIST = LANGUAGE_CONFIGS.map((c) => c.code);

/**
 * 支持的语言集合（用于 O(1) 查找）
 */
export const SUPPORTED_LANGUAGE_SET = new Set(SUPPORTED_LANGUAGE_LIST);

/**
 * 支持的语言映射表（用于 O(1) 查找语言配置）
 */
export const SUPPORTED_LANGUAGE_MAP = new Map(
  LANGUAGE_CONFIGS.map((c) => [c.code, c]),
);

/**
 * 根据语言代码获取语言配置
 * @param code 语言代码
 * @returns 语言配置对象，如果未找到则返回 undefined
 */
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGE_MAP.get(code);
}

/**
 * 语言代码迁移映射表
 * 用于处理应用升级后语言代码变更的自动迁移
 */
export const LANGUAGE_MIGRATION_MAP: Record<string, string> = {
  "zh-CN": "zh",
} as const;

/**
 * 本地存储键名：是否在历史消息中传输推理内容
 */
export const LOCAL_STORAGE_TRANSMIT_HISTORY_REASONING_KEY =
  LOCAL_STORAGE_PREFIX + "transmit-history-reasoning";

/**
 * 本地存储键名：是否启用自动命名功能
 */
export const LOCAL_STORAGE_AUTO_NAMING_ENABLED_KEY =
  LOCAL_STORAGE_PREFIX + "auto-naming-enabled";

/**
 * 本地存储键名：主题偏好
 */
export const LOCAL_STORAGE_THEME_KEY = LOCAL_STORAGE_PREFIX + "theme";

/**
 * 判断是否应启用暗色模式
 * @param savedTheme 用户设置的主题值（light/dark/system），null 表示未设置
 * @param prefersDark 系统是否偏好暗色模式
 */
export function resolveIsDark(savedTheme: string | null, prefersDark: boolean): boolean {
  return savedTheme === "dark" ||
    (!savedTheme && prefersDark) ||
    (savedTheme === "system" && prefersDark);
}
