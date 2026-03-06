import { streamText as realStreamText, generateId as realGenerateId } from 'ai';
import { Model } from '@/types/model';
import { StandardMessage } from '@/types/chat';
import { ModelProviderKeyEnum } from '@/utils/enums';

/**
 * Vercel AI SDK 依赖接口（用于依赖注入和测试）
 */
export interface AISDKDependencies {
  /** streamText 函数（用于发起流式聊天请求） */
  streamText: typeof realStreamText;
  /** generateId 函数（用于生成唯一标识符） */
  generateId: typeof realGenerateId;
}

/**
 * 聊天服务配置
 */
export interface ChatServiceConfig {
  /** API Key */
  apiKey: string;
  /** API 基础地址（原始 URL，会被标准化） */
  baseURL: string;
  /** 模型标识符 */
  model: string;
  /** 是否允许浏览器环境（Tauri 桌面应用需要） */
  dangerouslyAllowBrowser?: boolean;
  /** 供应商标识符（用于开发环境代理和 URL 标准化） */
  providerKey: ModelProviderKeyEnum;
}

/**
 * 聊天请求参数
 */
export interface ChatRequestParams {
  /** 模型配置 */
  model: Model;
  /** 历史聊天记录 */
  historyList: StandardMessage[];
  /** 最新的用户消息 */
  message: string;
  /** 对话唯一标识（可选，不传则自动生成） */
  conversationId?: string;
  /** 是否在历史消息中传输推理内容（默认 false） */
  includeReasoningContent?: boolean;
  /** 节流间隔（毫秒），用于限制 Redux store 更新频率，默认 50ms，0 表示不节流（仅用于测试） */
  throttleInterval?: number;
}

/**
 * 元数据收集错误类
 * 用于标识元数据收集过程中的错误
 */
export class MetadataCollectionError extends Error {
  /** 字段名（如 'providerMetadata', 'warnings'） */
  field: string;

  /** 原始错误对象 */
  originalError?: unknown;

  /**
   * 创建元数据收集错误实例
   * @param field 出错的字段名
   * @param message 错误消息
   * @param originalError 原始错误对象
   */
  constructor(
    field: string,
    message: string,
    originalError?: unknown
  ) {
    super(`Failed to collect ${field}: ${message}`);
    this.name = 'MetadataCollectionError';
    this.field = field;
    this.originalError = originalError;
  }
}

/**
 * 敏感数据配置接口
 * 用于配置敏感数据的过滤规则
 */
export interface SensitiveDataConfig {
  /** 请求体最大大小（字节） */
  maxBodySize: number;
  /** 需要过滤的敏感 HTTP 头 */
  sensitiveHeaders: string[];
  /** 需要过滤的敏感请求体字段 */
  sensitiveFields: string[];
}

/**
 * 流式处理选项接口
 * 用于配置流式处理行为
 */
export interface ProcessStreamOptions {
  /** 对话唯一标识 */
  conversationId: string;
  /** 消息时间戳（秒级） */
  timestamp: number;
  /** 模型标识符 */
  modelKey: string;
  /** 是否包含推理内容 */
  includeReasoningContent: boolean;
  /** 节流间隔（毫秒），用于限制 Redux store 更新频率，0 表示不节流（仅用于测试） */
  throttleInterval?: number;
}
