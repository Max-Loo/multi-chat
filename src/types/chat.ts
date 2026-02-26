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
  // 被序列化后的原始响应数据的字符串
  raw?: string | null;
}