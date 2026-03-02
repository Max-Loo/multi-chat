/**
 * Redux 状态测试数据工厂
 *
 * 提供创建测试用 Redux state 对象的工厂函数
 */

import type { RootState } from '@/store';
import type { ChatPageSliceState } from '@/store/slices/chatPageSlices';
import type { AppConfigSliceState } from '@/store/slices/appConfigSlices';
import type { ModelProviderSliceState } from '@/store/slices/modelProviderSlice';
import { createMockRemoteProviders } from './modelProvider';

/**
 * 创建 Mock ChatPageState
 * @param overrides 要覆盖的字段
 * @returns ChatPageSliceState 对象
 */
export const createMockChatPageState = (
  overrides?: Partial<ChatPageSliceState>
): ChatPageSliceState => ({
  isSidebarCollapsed: false,
  isShowChatPage: false,
  ...overrides,
});

/**
 * 创建 Mock AppConfigState
 * @param overrides 要覆盖的字段
 * @returns AppConfigSliceState 对象
 */
export const createMockAppConfigState = (
  overrides?: Partial<AppConfigSliceState>
): AppConfigSliceState => ({
  language: 'zh',
  includeReasoningContent: false,
  ...overrides,
});

/**
 * 创建 Mock ModelProviderState
 * @param overrides 要覆盖的字段
 * @returns ModelProviderSliceState 对象
 */
export const createMockModelProviderState = (
  overrides?: Partial<ModelProviderSliceState>
): ModelProviderSliceState => ({
  providers: createMockRemoteProviders(),
  loading: false,
  error: null,
  lastUpdate: new Date().toISOString(),
  ...overrides,
});

/**
 * 创建完整的 Mock RootState
 * @param overrides 要覆盖的字段
 * @returns RootState 对象
 */
export const createMockRootState = (
  overrides?: Partial<RootState>
): RootState => ({
  chat: {
    activeChatId: null,
    chats: {},
    messages: {},
    temporaryMessages: {},
  },
  chatPage: createMockChatPageState(),
  appConfig: createMockAppConfigState(),
  modelProvider: createMockModelProviderState(),
  model: {
    models: [],
    activeModelId: null,
    loading: false,
    error: null,
  },
  ...overrides,
} as RootState);
