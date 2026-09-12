import { streamText as realStreamText, generateId as realGenerateId } from 'ai';
import { Model } from '@/types/model';
import { StandardMessage } from '@/types/chat';

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
  transmitHistoryReasoning?: boolean;
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
  /** 节流间隔（毫秒），用于限制 Redux store 更新频率，0 表示不节流（仅用于测试） */
  throttleInterval?: number;
}
