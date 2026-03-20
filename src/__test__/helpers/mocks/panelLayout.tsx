/**
 * Panel 布局组件测试 Mock 工厂
 *
 * 提供 Grid 和 Splitter 组件测试所需的 Mock 工厂函数
 */

import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import React from 'react';
import chatReducer from '@/store/slices/chatSlices';
import modelReducer from '@/store/slices/modelSlice';
import type { ChatModel } from '@/types/chat';
import type { ChatSliceState } from '@/store/slices/chatSlices';
import type { ModelSliceState } from '@/store/slices/modelSlice';

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
 * @param overrides 覆盖默认状态
 * @returns 配置好的 Redux store
 */
export const createPanelLayoutStore = (overrides?: {
  chatState?: Partial<ChatSliceState>;
  modelsState?: Partial<ModelSliceState>;
}) => {
  const defaultChatState: ChatSliceState = {
    chatList: [],
    selectedChatId: null,
    loading: false,
    error: null,
    initializationError: null,
    runningChat: {},
  };

  const defaultModelsState: ModelSliceState = {
    models: [],
    loading: false,
    error: null,
    initializationError: null,
  };

  return configureStore({
    reducer: {
      chat: chatReducer,
      models: modelReducer,
    },
    preloadedState: {
      chat: {
        ...defaultChatState,
        ...overrides?.chatState,
      },
      models: {
        ...defaultModelsState,
        ...overrides?.modelsState,
      },
    },
  });
};

/**
 * 创建 Panel 布局测试的 Wrapper 组件
 * @param store Redux store 实例
 * @returns React Wrapper 组件
 */
export const createPanelLayoutWrapper = (
  store: ReturnType<typeof createPanelLayoutStore>
) => {
  return function PanelLayoutWrapper({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <Provider store={store}>{children}</Provider>;
  };
};
