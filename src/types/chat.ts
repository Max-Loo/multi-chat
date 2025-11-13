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
}