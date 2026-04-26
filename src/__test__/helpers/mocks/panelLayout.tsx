/**
 * Panel 布局组件测试 Mock 工厂
 *
 * 提供 Grid 和 Splitter 组件测试所需的 Mock 工厂函数
 */

import type { ChatModel } from '@/types/chat';
import type { ChatSliceState } from '@/store/slices/chatSlices';
import type { ModelSliceState } from '@/store/slices/modelSlice';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';
import { createChatSliceState, createModelSliceState } from '@/__test__/helpers/mocks/testState';

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

/**
 * 创建 Panel 布局测试用的 Redux Store
 *
 * 使用 createTypeSafeTestStore + 工厂函数生成默认值，替代内联默认状态定义。
 * 仅配置 chat 和 models 两个 slice 的 preloadedState，其余 slice 使用默认值。
 * @param overrides 覆盖默认状态
 * @returns 配置好的 Redux store
 */
export const createPanelLayoutStore = (overrides?: {
  chatState?: Partial<ChatSliceState>;
  modelsState?: Partial<ModelSliceState>;
}) => {
  return createTypeSafeTestStore({
    chat: createChatSliceState(overrides?.chatState),
    models: createModelSliceState(overrides?.modelsState),
  });
};

