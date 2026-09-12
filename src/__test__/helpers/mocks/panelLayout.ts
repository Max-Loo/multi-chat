/**
 * Panel 布局组件测试 Mock 工厂
 *
 * 提供 Panel 系组件测试所需的 Mock 工厂函数
 */

import type { ChatModel } from '@/types/chat';

/**
 * 创建 Mock ChatModel（聊天模型实例）
 * @param id 模型 ID
 * @param overrides 覆盖默认属性
 * @returns Mock ChatModel 对象
 */
export const createMockPanelChatModel = (
  id: string,
  overrides?: Partial<ChatModel>
): ChatModel => ({
  modelId: id,
  chatHistoryList: [],
  ...overrides,
});
