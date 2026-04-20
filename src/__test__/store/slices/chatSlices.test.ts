/**
 * chatSlices 单元测试
 *
 * 测试聊天列表管理、消息发送、多模型并发等核心业务逻辑
 *
 * 删除的冗余测试（已被集成测试覆盖）：
 * - 聊天管理 reducers (6 tests)：创建、编辑、删除聊天已被 chat-flow.integration.test.ts 覆盖
 * - 选中聊天管理 (2 tests)：设置/清除选中 ID 已被集成测试覆盖
 * - 聊天列表过滤 (1 test)：软删除和过滤逻辑已被集成测试覆盖
 *
 * 保留的关键测试：
 * - 错误处理：pending/fulfilled/rejected 状态转换
 * - 内部 reducer 逻辑：pushChatHistory、pushRunningChatHistory
 * - 复杂场景：多模型并发时的错误回写
 * - 边缘情况：聊天不存在时的处理
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Chat } from '@/types/chat';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createMockChat } from '@/__test__/helpers/testing-utils';
import { createMockMessage } from '@/__test__/fixtures/chat';

// Mock 依赖 - 必须在导入 slice 之前执行
// 使用 vi.hoisted 确保变量在 vi.mock 之前被定义
const { mockLoadChatsFromJson } = vi.hoisted(() => ({
  mockLoadChatsFromJson: vi.fn<() => Promise<Chat[]>>(() => Promise.resolve([])),
}));

// Mock 所有存储相关的模块
vi.mock('@/store/storage', () => ({
  loadChatsFromJson: mockLoadChatsFromJson,
  saveChatsToJson: vi.fn(() => Promise.resolve(undefined)),
  loadModelsFromJson: vi.fn(() => Promise.resolve([])),
  saveModelsToJson: vi.fn(() => Promise.resolve(undefined)),
  createLazyStore: vi.fn(() => ({})),
  saveToStore: vi.fn(() => Promise.resolve()),
  loadFromStore: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/store/storage/modelStorage', () => ({
  loadModelsFromJson: vi.fn(() => Promise.resolve([])),
  saveModelsToJson: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock('@/services/chatService', () => ({
  streamChatCompletion: vi.fn(),
}));

// Mock providerLoader 模块
const mockPreloadProviders = vi.fn<() => Promise<void>>(() => Promise.resolve());
vi.mock('@/services/chat/providerLoader', () => ({
  getProviderSDKLoader: () => ({
    loadProvider: vi.fn().mockResolvedValue((config: any) => (modelId: string) => ({
      modelId,
      provider: 'mock-provider',
      ...config,
    })),
    isProviderLoaded: vi.fn(),
    getProviderState: vi.fn(),
    preloadProviders: mockPreloadProviders,
  }),
}));

import { configureStore } from '@reduxjs/toolkit';
import chatReducer, {
  clearError,
  clearInitializationError,
  createChat,
  editChatName,
  setSelectedChatIdWithPreload,
  sendMessage,
  pushRunningChatHistory,
  pushChatHistory,
  initializeChatList,
  generateChatName,
  startSendChatMessage,
} from '@/store/slices/chatSlices';
import modelReducer from '@/store/slices/modelSlice';

describe('chatSlices', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: Redux Toolkit 严格类型系统限制
  let store: any;

  // 创建测试用的 Redux store
  const createTestStore = () => {
    return configureStore({
      reducer: {
        chat: chatReducer,
        models: modelReducer,
        appConfig: (state = { transmitHistoryReasoning: false, language: '', autoNamingEnabled: true }) => state,
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // 重置 mock 返回默认值
    mockLoadChatsFromJson.mockResolvedValue([]);
    mockPreloadProviders.mockClear();
    store = createTestStore();
  });

  describe('initialState', () => {
    it('应该返回正确的初始状态', () => {
      const state = store.getState().chat;
      expect(state).toEqual({
        chatList: [],
        loading: false,
        selectedChatId: null,
        error: null,
        initializationError: null,
        runningChat: {},
      });
    });
  });

  // initializeChatList 状态转换测试已被删除：
  // - pending/fulfilled/rejected 测试（3 个）：已被集成测试覆盖
  // - 这些测试验证 Redux Toolkit 自动生成的状态转换，属于内部实现
  // - 集成测试 app-loading.integration.test.ts 已覆盖用户可见行为

  // 聊天管理 reducers 测试已被删除：已被 chat-flow.integration.test.ts 覆盖
  // - 创建新聊天：集成测试覆盖 "创建新会话"
  // - 编辑聊天名称：集成测试覆盖 "编辑会话名称"
  // - 软删除聊天：集成测试覆盖 "删除会话"
  // - 删除选中的聊天：集成测试覆盖 "删除会话" 并验证 selectedChatId

  // 选中聊天管理测试已被删除：已被集成测试覆盖

  describe('sendMessage async thunk actions', () => {
    it('应该在 pending 时初始化 runningChat 状态', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-1' });
      const message = 'Hello';
      const arg = { chat, model, message, historyList: [] };

      // Dispatch pending action
      store.dispatch(sendMessage.pending('test-req-1', arg));

      // 验证 runningChat 状态
      const state = store.getState().chat;
      expect(state.runningChat[chat.id]?.[model.id]?.isSending).toBe(true);
      expect(state.runningChat[chat.id]?.[model.id]?.errorMessage).toBe('');
    });

    it('应该在 fulfilled 时清理 runningChat', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-1' });
      const message = 'Hello';
      const arg = { chat, model, message, historyList: [] };
      const responseMessage = createMockMessage();

      // 先创建聊天到 store
      store.dispatch(createChat({ chat }));

      // 初始化 runningChat
      store.dispatch(sendMessage.pending('test-req-2', arg));

      // 设置运行中的历史记录（通过 action creator）
      store.dispatch(pushRunningChatHistory({ chat, model, message: responseMessage }));

      // Dispatch fulfilled action
      store.dispatch(sendMessage.fulfilled(undefined, 'test-req-2', arg));

      // 验证 runningChat 被清理
      const state = store.getState().chat;
      expect(state.runningChat[chat.id]?.[model.id]).toBeUndefined();

      // 验证历史记录被添加到聊天中
      expect(state.chatList[0].chatModelList?.[0].chatHistoryList).toHaveLength(1);
      expect(state.chatList[0].chatModelList?.[0].chatHistoryList?.[0]).toEqual(responseMessage);
    });

    it('应该在 rejected 时设置错误信息', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-1' });
      const arg = { chat, model, message: 'test', historyList: [] };
      const error = new Error('Network error');

      // 先初始化 runningChat
      store.dispatch(sendMessage.pending('test-req-3', arg));

      // Dispatch rejected action
      store.dispatch(sendMessage.rejected(error, 'test-req-3', arg));

      // 验证错误状态
      const state = store.getState().chat;
      expect(state.runningChat[chat.id]?.[model.id]?.isSending).toBe(false);
      expect(state.runningChat[chat.id]?.[model.id]?.errorMessage).toContain('Network error');
    });
  });

  describe('startSendChatMessage rejected reducer', () => {
    it('应该在 rejected 时将所有运行中的历史记录回写到聊天历史', () => {
      const chat = createMockChat({
        chatModelList: [
          { modelId: 'model-1', chatHistoryList: [] },
          { modelId: 'model-2', chatHistoryList: [] },
        ],
      });
      const model1 = createMockModel({ id: 'model-1' });
      const model2 = createMockModel({ id: 'model-2' });
      const history1 = createMockMessage({ content: 'Response 1' });
      const history2 = createMockMessage({ content: 'Response 2' });

      // 先创建聊天到 store
      store.dispatch(createChat({ chat }));

      // 初始化两个模型的 runningChat
      store.dispatch(sendMessage.pending('test-req-4', { chat, model: model1, message: 'test', historyList: [] }));
      store.dispatch(sendMessage.pending('test-req-5', { chat, model: model2, message: 'test', historyList: [] }));

      // 设置运行中的历史记录
      store.dispatch(pushRunningChatHistory({ chat, model: model1, message: history1 }));
      store.dispatch(pushRunningChatHistory({ chat, model: model2, message: history2 }));

      // Dispatch startSendChatMessage rejected action
      const startArg = { chat, message: 'test' };
      store.dispatch(startSendChatMessage.rejected(new Error('cancelled'), 'test-req-6', startArg));

      // 验证历史记录被回写到聊天历史中
      const state = store.getState().chat;
      expect(state.chatList[0].chatModelList?.[0].chatHistoryList).toHaveLength(1);
      expect(state.chatList[0].chatModelList?.[0].chatHistoryList?.[0]).toEqual(history1);
      expect(state.chatList[0].chatModelList?.[1].chatHistoryList).toHaveLength(1);
      expect(state.chatList[0].chatModelList?.[1].chatHistoryList?.[0]).toEqual(history2);
    });
  });

  describe('错误状态清理', () => {
    it('应该清除操作错误信息', () => {
      // clearError 清除的是 state.error，而不是 runningChat 中的 errorMessage
      // 由于 chatSlices 没有设置 state.error 的逻辑，我们只测试 reducer 的功能
      const initialState = store.getState().chat;

      // dispatch clearError
      store.dispatch(clearError());

      const state = store.getState().chat;
      expect(state.error).toBe(null);
      expect(state).toEqual(initialState); // 状态应该不变
    });

    it('应该清除初始化错误信息', () => {
      // 先设置一个初始化错误
      store.dispatch(initializeChatList.rejected(new Error('Init error'), 'test-req-init'));

      // 验证错误已设置
      expect(store.getState().chat.initializationError).toBe('Init error');

      // 清除错误
      store.dispatch(clearInitializationError());

      const state = store.getState().chat;
      expect(state.initializationError).toBe(null);
    });
  });

  describe('pushChatHistory', () => {
    // 保留测试：验证内部 reducer 逻辑
    it('应该向聊天历史记录添加消息', () => {
      const model = createMockModel({ id: 'model-1' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const message = createMockMessage();

      store.dispatch(createChat({ chat }));

      // 直接调用 action creator
      store.dispatch(pushChatHistory({ chat, model, message }));

      const state = store.getState().chat;
      expect(state.chatList[0].chatModelList?.[0].chatHistoryList).toHaveLength(1);
      expect(state.chatList[0].chatModelList?.[0].chatHistoryList?.[0]).toEqual(message);
    });

    it('应该在聊天不存在时不添加消息', () => {
      const model = createMockModel({ id: 'model-1' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const message = createMockMessage();

      // 不创建聊天，直接尝试添加消息
      store.dispatch(pushChatHistory({ chat, model, message }));

      const state = store.getState().chat;
      expect(state.chatList).toHaveLength(0); // 聊天列表为空
    });
  });

  describe('pushRunningChatHistory', () => {
    it('应该更新运行中的聊天历史记录', () => {
      const model = createMockModel({ id: 'model-1' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const message = createMockMessage({ content: 'Running message' });

      // 先初始化 runningChat（通过 dispatch pending action）
      const pendingArg = { chat, model, message: 'test', historyList: [] };
      store.dispatch(sendMessage.pending('test-req-running', pendingArg));

      // 更新运行中的历史记录
      store.dispatch(pushRunningChatHistory({ chat, model, message }));

      const state = store.getState().chat;
      expect(state.runningChat[chat.id]?.[model.id]?.history).toEqual(message);
    });
  });

  describe('editChatName - 自动命名相关', () => {
    it('应该在编辑聊天名称时设置 isManuallyNamed 为 true', () => {
      const chat = createMockChat({ name: 'Old Name' });
      store.dispatch(createChat({ chat }));

      // 编辑聊天名称
      store.dispatch(editChatName({ id: chat.id, name: 'New Name' }));

      const state = store.getState().chat;
      expect(state.chatList[0].name).toBe('New Name');
      expect(state.chatList[0].isManuallyNamed).toBe(true);
    });

    it('应该拒绝编辑为空名称（保持原有名称）', () => {
      const chat = createMockChat({ name: 'Old Name' });
      store.dispatch(createChat({ chat }));

      // 尝试编辑为空名称（应该被拒绝）
      store.dispatch(editChatName({ id: chat.id, name: '' }));

      const state = store.getState().chat;
      // 名称应该保持不变
      expect(state.chatList[0].name).toBe('Old Name');
      // isManuallyNamed 应该保持 undefined（因为没有更新）
      expect(state.chatList[0].isManuallyNamed).toBeUndefined();
    });

    it('应该拒绝编辑为仅空白字符的名称', () => {
      const chat = createMockChat({ name: 'Old Name' });
      store.dispatch(createChat({ chat }));

      // 尝试编辑为仅空白字符（应该被拒绝）
      store.dispatch(editChatName({ id: chat.id, name: '   ' }));

      const state = store.getState().chat;
      // 名称应该保持不变
      expect(state.chatList[0].name).toBe('Old Name');
      // isManuallyNamed 应该保持 undefined
      expect(state.chatList[0].isManuallyNamed).toBeUndefined();
    });
  });

  describe('generateChatName - 自动标题生成', () => {
    it('应该在成功生成标题时更新聊天名称', () => {
      const chat = createMockChat({ name: undefined });
      store.dispatch(createChat({ chat }));

      // Dispatch fulfilled action with generated title
      store.dispatch(generateChatName.fulfilled(
        { chatId: chat.id, name: 'Generated Title' },
        'generate-req-1',
        { chat, model: createMockModel(), historyList: [] },
      ));

      const state = store.getState().chat;
      expect(state.chatList[0].name).toBe('Generated Title');
      expect(state.chatList[0].isManuallyNamed).toBeUndefined(); // 保持 undefined，允许手动覆盖
    });

    it('应该在失败时不更新聊天名称', () => {
      const chat = createMockChat({ name: undefined });
      store.dispatch(createChat({ chat }));

      // Dispatch fulfilled action with null (失败情况)
      store.dispatch(generateChatName.fulfilled(null, 'generate-req-2', { chat, model: createMockModel(), historyList: [] }));

      const state = store.getState().chat;
      expect(state.chatList[0].name).toBeUndefined();
    });

    it('应该在聊天不存在时不抛出错误', () => {
      // Dispatch fulfilled action for non-existent chat
      expect(() => {
        store.dispatch(generateChatName.fulfilled(
          { chatId: 'non-existent-chat', name: 'Title' },
          'generate-req-3',
          { chat: createMockChat(), model: createMockModel(), historyList: [] },
        ));
      }).not.toThrow();
    });
  });

  describe('setSelectedChatIdWithPreload - 预加载机制', () => {
    it('应该在新聊天（无模型）时跳过预加载', async () => {
      const chat = createMockChat({
        chatModelList: [], // 新聊天，没有模型
      });

      // 添加聊天到 store
      store.dispatch(createChat({ chat }));

      // 切换到新聊天
      await store.dispatch(setSelectedChatIdWithPreload(chat.id));

      // 验证 selectedChatId 被更新
      expect(store.getState().chat.selectedChatId).toBe(chat.id);

      // 验证 preloadProviders 未被调用（新聊天没有模型）
      expect(mockPreloadProviders).not.toHaveBeenCalled();
    });

    it('应该在聊天不存在时跳过预加载', async () => {
      const nonExistentChatId = 'non-existent-chat-id';

      // 尝试切换到不存在的聊天
      await store.dispatch(setSelectedChatIdWithPreload(nonExistentChatId));

      // 验证 preloadProviders 未被调用（聊天不存在）
      expect(mockPreloadProviders).not.toHaveBeenCalled();
    });
  });

  // 聊天列表过滤测试已被删除：集成测试已覆盖软删除和过滤逻辑
});
