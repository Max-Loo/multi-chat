// 针对每个模型的聊天实例
export interface ChatModel {
  modelId: string;
  chatHistoryList: string[];
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
export const enum ChatRoleEnum {
  // 留给特殊角色
  UNKNOWN = 'unknown',

  USER = 'user',
  SYSTEM = 'system',
  ASSISTANT = 'assistant',
  TOOL = 'tool',
}

// 用户发送的消息的类型
export interface UserMessageRecord {
  // 格式为：user_msg_xxxxx
  id: string;
  // unix 时间戳
  timestamp: number;
  // 使用到的具体模型的 key
  modelKey: string;
  // 角色标识，理论上固定为 user
  role: ChatRoleEnum;
  // 要发送的内容
  content: string;
}


/**
 * @description 统一转换成方便拿来渲染的格式
 */
export interface StandardizedHistoryRecord {
  // 唯一标识的 id
  id: string;
  // 创建这条记录的角色
  role: ChatRoleEnum;
  // 对话的内容，应该为 markdown 格式
  content: string;
}