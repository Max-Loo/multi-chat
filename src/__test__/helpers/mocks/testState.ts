/**
 * Slice 默认状态工厂函数
 *
 * 为每个 Redux slice 提供类型安全的默认状态工厂函数，
 * 替代分散在各测试文件中的 `{ ... } as any` 模式。
 */

import type { ChatSliceState } from '@/store/slices/chatSlices';
import type { ChatPageSliceState } from '@/store/slices/chatPageSlices';
import type { AppConfigSliceState } from '@/store/slices/appConfigSlices';
import type { ModelProviderSliceState } from '@/store/slices/modelProviderSlice';
import type { SettingPageSliceState } from '@/store/slices/settingPageSlices';
import type { ModelPageSliceState } from '@/store/slices/modelPageSlices';
import type { ModelSliceState } from '@/store/slices/modelSlice';
import type { RootState } from '@/store';
import type { StandardMessage } from '@/types/chat';
// 从统一来源重导出 createMockModel
export { createMockModel } from '@/__test__/helpers/fixtures/model';

/**
 * 创建 Model slice 默认状态
 * @param overrides 要覆盖的状态字段
 */
export const createModelSliceState = (overrides?: Partial<ModelSliceState>): ModelSliceState => ({
  models: [],
  loading: false,
  error: null,
  initializationError: null,
  ...overrides,
});

/**
 * 创建 Chat slice 默认状态
 * @param overrides 要覆盖的状态字段
 */
export const createChatSliceState = (overrides?: Partial<ChatSliceState>): ChatSliceState => ({
  chatMetaList: [],
  activeChatData: {},
  sendingChatIds: {},
  loading: false,
  selectedChatId: null,
  error: null,
  initializationError: null,
  runningChat: {},
  ...overrides,
});

/**
 * 创建 runningChat 嵌套状态的辅助函数
 * @param chatId 聊天 ID
 * @param modelId 模型 ID
 * @param overrides 覆盖 isSending、history 等字段
 * @returns runningChat 的单条嵌套结构
 */
export const createRunningChatEntry = (
  chatId: string,
  modelId: string,
  overrides?: { isSending?: boolean; history?: StandardMessage | null; errorMessage?: string }
): ChatSliceState['runningChat'] => ({
  [chatId]: {
    [modelId]: {
      isSending: false,
      history: null,
      ...overrides,
    },
  },
});

/**
 * 创建 ChatPage slice 默认状态
 * @param overrides 要覆盖的状态字段
 */
export const createChatPageSliceState = (overrides?: Partial<ChatPageSliceState>): ChatPageSliceState => ({
  isSidebarCollapsed: false,
  isShowChatPage: false,
  isDrawerOpen: false,
  ...overrides,
});

/**
 * 创建 AppConfig slice 默认状态
 * @param overrides 要覆盖的状态字段
 */
export const createAppConfigSliceState = (overrides?: Partial<AppConfigSliceState>): AppConfigSliceState => ({
  language: '',
  transmitHistoryReasoning: false,
  autoNamingEnabled: true,
  ...overrides,
});

/**
 * 创建 ModelProvider slice 默认状态
 * @param overrides 要覆盖的状态字段
 */
export const createModelProviderSliceState = (overrides?: Partial<ModelProviderSliceState>): ModelProviderSliceState => ({
  providers: [],
  loading: false,
  error: null,
  lastUpdate: null,
  backgroundRefreshing: false,
  ...overrides,
});

/**
 * 创建 SettingPage slice 默认状态
 * @param overrides 要覆盖的状态字段
 */
export const createSettingPageSliceState = (overrides?: Partial<SettingPageSliceState>): SettingPageSliceState => ({
  isDrawerOpen: false,
  ...overrides,
});

/**
 * 创建 ModelPage slice 默认状态
 * @param overrides 要覆盖的状态字段
 */
export const createModelPageSliceState = (overrides?: Partial<ModelPageSliceState>): ModelPageSliceState => ({
  isDrawerOpen: false,
  ...overrides,
});

/**
 * 创建完整的测试用 RootState
 *
 * 组合所有 slice 的默认值，支持通过 overrides 参数覆盖任意 slice。
 * 类型安全：拼写错误或不存在的 key 会在编译期报错。
 *
 * @param overrides 要覆盖的 slice 状态
 */
export const createTestRootState = (overrides?: Partial<RootState>): RootState => ({
  models: createModelSliceState(),
  chat: createChatSliceState(),
  chatPage: createChatPageSliceState(),
  appConfig: createAppConfigSliceState(),
  modelProvider: createModelProviderSliceState(),
  settingPage: createSettingPageSliceState(),
  modelPage: createModelPageSliceState(),
  ...overrides,
});
