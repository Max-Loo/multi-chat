/**
 * Panel 布局组件测试数据工厂
 *
 * 提供 Grid / Splitter / Detail 等聊天面板组件测试所需的 ChatModel 工厂。
 */
import type { ChatModel } from '@/types/chat';

/**
 * 创建 Mock ChatModel（聊天面板单元格数据）
 * @param id 模型 ID
 * @param overrides 覆盖默认属性
 * @returns Mock ChatModel 对象
 */
export const createMockPanelChatModel = (
  id: string,
  overrides?: Partial<ChatModel>,
): ChatModel => ({
  modelId: id,
  chatHistoryList: [],
  ...overrides,
});

/**
 * 批量创建 Mock ChatModel
 * @param ids 模型 ID 列表
 * @returns ChatModel 数组
 */
export const createMockPanelChatModels = (ids: string[]): ChatModel[] =>
  ids.map((id) => createMockPanelChatModel(id));
