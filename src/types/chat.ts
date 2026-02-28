// 针对每个模型的聊天实例
export interface ChatModel {
  modelId: string;
  chatHistoryList: StandardMessage[];
}

// 每个聊天实体的类型
export interface Chat {
  id: string;
  // 聊天的命名
  name?: string;
  // 具体每个模型的聊天实例
  chatModelList?: ChatModel[];
  // 标识是否已经删除，不执行真删除
  isDeleted?: boolean;
}

// 聊天角色枚举值
export enum ChatRoleEnum {
  // 留给特殊角色
  UNKNOWN = 'unknown',
  USER = 'user',
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
  TOOL = 'tool',
  DEVELOPER = 'developer'
}

/**
 * @description 原始响应数据的结构化格式
 */
export interface StandardMessageRawResponse {
  /** 响应元数据 */
  response: {
    /** 供应商返回的响应 ID */
    id: string;
    /** 实际使用的模型标识符 */
    modelId: string;
    /** 供应商返回的响应时间戳（ISO 8601 格式） */
    timestamp: string;
    /** HTTP 响应头（用于调试、速率限制追踪） */
    headers?: Record<string, string>;
  };

  /** 请求元数据 */
  request: {
    /** 发送给供应商的请求体（JSON 字符串，已过滤敏感信息） */
    body: string;
  };

  /** Token 使用详细信息 */
  usage: {
    /** 输入 token 数量 */
    inputTokens: number;
    /** 输出 token 数量 */
    outputTokens: number;
    /** 总 token 数量 */
    totalTokens: number;
    /** 输入 token 详细信息 */
    inputTokenDetails?: {
      /** 缓存读取的 token 数 */
      cacheReadTokens?: number;
      /** 缓存写入的 token 数 */
      cacheWriteTokens?: number;
      /** 未缓存的 token 数 */
      noCacheTokens?: number;
    };
    /** 输出 token 详细信息 */
    outputTokenDetails?: {
      /** 文本生成的 token 数 */
      textTokens?: number;
      /** 推理过程的 token 数（如 DeepSeek-R1） */
      reasoningTokens?: number;
    };
    /** 供应商原始的 usage 数据（未标准化字段） */
    raw?: Record<string, unknown>;
  };

  /** 完成原因 */
  finishReason: {
    /** 标准化原因 */
    reason: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other';
    /** 供应商原始的完成原因 */
    rawReason?: string;
  };

  /** 供应商特定元数据 */
  providerMetadata?: {
    /** 供应商名称（如 'deepseek'、'moonshotai'、'zhipu'） */
    [providerName: string]: Record<string, unknown>;
  };

  /** 警告信息 */
  warnings?: Array<{
    /** 警告代码 */
    code?: string;
    /** 警告消息 */
    message: string;
  }>;

  /** 流式事件统计（用于性能分析） */
  streamStats?: {
    /** 接收到的文本增量事件数 */
    textDeltaCount: number;
    /** 接收到的推理增量事件数 */
    reasoningDeltaCount: number;
    /** 总耗时（毫秒） */
    duration: number;
  };

  /** RAG 来源信息（用于 web search RAG 模型） */
  sources?: Array<{
    /** 来源类型 */
    sourceType: 'url';
    /** 来源 ID */
    id: string;
    /** 来源 URL */
    url: string;
    /** 来源标题 */
    title?: string;
    /** 供应商特定的元数据 */
    providerMetadata?: Record<string, unknown>;
  }>;

  /** 错误信息（元数据收集过程中的错误） */
  errors?: Array<{
    /** 错误字段 */
    field: string;
    /** 错误消息 */
    message: string;
  }>;
}

/**
 * @description 将不同服务商返回的消息转换成统一的格式
 */
export interface StandardMessage {
  // 唯一标识，不同类型的id应该有不同的前缀标识
  id: string;
  // unix 时间戳，以秒为单位
  timestamp: number;
  // 使用到的具体模型的 key
  modelKey: string;
  // 角色标识
  role: ChatRoleEnum;
  // 发送或者接收的内容
  content: string;
  // thinking / reasoning 模式下，思考的内容
  reasoningContent?: string;
  // 本次对话结束的原因
  finishReason: string | null;
  /**
   * @description 本次对话的 token 消耗量
   * BREAKING CHANGE: 字段名从 `tokensUsage` 改为 `usage`
   * 内部字段从 `prompt/completion` 改为 `inputTokens/outputTokens`
   * 与 Vercel AI SDK 的 usage 对象保持一致，消除字段映射逻辑
   */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  /**
   * @description 原始响应数据（结构化对象）
   * BREAKING CHANGE: 从 `string | null` 改为 `StandardMessageRawResponse | null`
   */
  raw?: StandardMessageRawResponse | null;
}

/**
 * @description 类型守卫：判断 raw 是否为新的结构化格式
 * @param raw 待判断的 raw 值
 * @returns 是否为增强的原始响应格式
 */
export function isEnhancedRawResponse(raw: unknown): raw is StandardMessageRawResponse {
  return typeof raw === 'object' && raw !== null && 'response' in raw;
}

/**
 * @description 格式化原始响应数据为人类可读的格式
 * @param raw 原始响应数据
 * @returns 格式化后的 JSON 字符串或"无原始数据"提示
 */
export function formatRawResponse(raw: StandardMessageRawResponse | null | undefined): string {
  if (!raw) return '无原始数据';
  return JSON.stringify(raw, null, 2);
}