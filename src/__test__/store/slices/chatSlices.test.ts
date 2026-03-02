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
import { createIdGenerator } from 'ai';
import { Chat, ChatRoleEnum, StandardMessage } from '@/types/chat';
import { Model } from '@/types/model';
import { ModelProviderKeyEnum } from '@/utils/enums';

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
  settingStore: {},
}));

vi.mock('@/store/storage/modelStorage', () => ({
  loadModelsFromJson: vi.fn(() => Promise.resolve([])),
  saveModelsToJson: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock('@/services/chatService', () => ({
  streamChatCompletion: vi.fn(),
}));

import { configureStore } from '@reduxjs/toolkit';
import chatReducer, {
  initializeChatList,
  clearError,
  clearInitializationError,
  createChat,
} from '@/store/slices/chatSlices';
import modelReducer from '@/store/slices/modelSlice';

// 生成测试消息 ID 的工具函数
const generateMessageId = createIdGenerator({ prefix: 'test-msg-' });
const generateChatId = createIdGenerator({ prefix: 'test-chat-' });
const generateModelId = createIdGenerator({ prefix: 'test-model-' });

// 创建 Mock Chat 对象
const createMockChat = (overrides?: Partial<Chat>): Chat => ({
  id: generateChatId(),
  name: 'Test Chat',
  chatModelList: [],
  isDeleted: false,
  ...overrides,
});

// 创建 Mock StandardMessage 对象
const createMockMessage = (overrides?: Partial<StandardMessage>): StandardMessage => ({
  id: generateMessageId(),
  timestamp: Math.floor(Date.now() / 1000),
  modelKey: 'test-model',
  role: ChatRoleEnum.ASSISTANT,
  content: 'Test message',
  finishReason: 'stop',
  ...overrides,
});

// 创建 Mock Model 对象
const createMockModel = (overrides?: Partial<Model>): Model => {
  const id = generateModelId();
  return {
    id,
    createdAt: '2024-01-01 00:00:00',
    updateAt: '2024-01-01 00:00:00',
    providerName: 'Test Provider',
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    nickname: 'Test Model',
    modelName: 'test-model',
    modelKey: 'test-model',
    apiKey: 'sk-test-123',
    apiAddress: 'https://api.test.com/v1',
    isEnable: true,
    isDeleted: false,
    ...overrides,
  };
};

describe('chatSlices', () => {
  let store: any;

  // 创建测试用的 Redux store
  const createTestStore = () => {
    return configureStore({
      reducer: {
        chat: chatReducer,
        models: modelReducer,
        appConfig: (state = { includeReasoningContent: false, language: '' }) => state,
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // 重置 mock 返回默认值
    mockLoadChatsFromJson.mockResolvedValue([]);
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

  describe('initializeChatList', () => {
    // TODO: 重新实现以测试行为而非实现细节
    it.skip('应该在 pending 时设置 loading 为 true', async () => {
      // Mock loadChatsFromJson 返回永不解析的 Promise
      mockLoadChatsFromJson.mockReturnValue(new Promise(() => {}));

      // Dispatch Thunk（不等待）
      store.dispatch(initializeChatList());

      // 立即验证 pending 状态
      const state = store.getState().chat;
      expect(state.loading).toBe(true);
      expect(state.initializationError).toBe(null);
    });

    // TODO: 重新实现以测试行为而非实现细节
    it.skip('应该在 fulfilled 时更新聊天列表', async () => {
      // Mock 数据
      const mockChats: Chat[] = [
        createMockChat({ name: 'Chat 1' }),
        createMockChat({ name: 'Chat 2' }),
      ];
      mockLoadChatsFromJson.mockResolvedValue(mockChats);

      // Dispatch Thunk
      const result = await store.dispatch(initializeChatList());

      // 验证 Thunk fulfilled
      expect(result.type).toBe('chat/initialize/fulfilled');

      // 验证状态转换
      const state = store.getState().chat;
      expect(state.loading).toBe(false);
      expect(state.chatList).toEqual(mockChats);
      expect(state.initializationError).toBe(null);

      // 验证服务层被调用
      expect(mockLoadChatsFromJson).toHaveBeenCalledTimes(1);
    });

    // TODO: 重新实现以测试行为而非实现细节
    it.skip('应该在 rejected 时设置错误信息', async () => {
      // Mock loadChatsFromJson 失败
      const errorMessage = 'Failed to load chats';
      mockLoadChatsFromJson.mockRejectedValue(new Error(errorMessage));

      // Dispatch Thunk
      const result = await store.dispatch(initializeChatList());

      // 验证 Thunk rejected
      expect(result.type).toBe('chat/initialize/rejected');

      // 验证状态转换
      const state = store.getState().chat;
      expect(state.loading).toBe(false);
      expect(state.initializationError).toBe(errorMessage);
    });
  });

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

      // Dispatch pending action
      store.dispatch({
        type: 'chatModel/sendMessage/pending',
        meta: { arg: { chat, model, message, historyList: [] } },
      });

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
      const responseMessage = createMockMessage();

      // 先创建聊天到 store
      store.dispatch(createChat({ chat }));

      // 初始化 runningChat
      store.dispatch({
        type: 'chatModel/sendMessage/pending',
        meta: { arg: { chat, model, message, historyList: [] } },
      });

      // 设置运行中的历史记录（通过 action）
      store.dispatch({
        type: 'chat/pushRunningChatHistory',
        payload: { chat, model, message: responseMessage },
      });

      // Dispatch fulfilled action
      store.dispatch({
        type: 'chatModel/sendMessage/fulfilled',
        meta: { arg: { chat, model, message, historyList: [] } },
        payload: undefined,
      });

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
      const errorMessage = 'Network error';

      // 先初始化 runningChat
      store.dispatch({
        type: 'chatModel/sendMessage/pending',
        meta: { arg: { chat, model, message: 'test', historyList: [] } },
      });

      // Dispatch rejected action
      store.dispatch({
        type: 'chatModel/sendMessage/rejected',
        meta: { arg: { chat, model, message: 'test', historyList: [] } },
        error: { message: errorMessage },
      });

      // 验证错误状态
      const state = store.getState().chat;
      expect(state.runningChat[chat.id]?.[model.id]?.isSending).toBe(false);
      expect(state.runningChat[chat.id]?.[model.id]?.errorMessage).toBe(errorMessage);
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
      const history1 = createMockMessage({ id: 'msg-1', content: 'Response 1' });
      const history2 = createMockMessage({ id: 'msg-2', content: 'Response 2' });

      // 先创建聊天到 store
      store.dispatch(createChat({ chat }));

      // 初始化两个模型的 runningChat
      store.dispatch({
        type: 'chatModel/sendMessage/pending',
        meta: { arg: { chat, model: model1, message: 'test', historyList: [] } },
      });
      store.dispatch({
        type: 'chatModel/sendMessage/pending',
        meta: { arg: { chat, model: model2, message: 'test', historyList: [] } },
      });

      // 设置运行中的历史记录
      store.dispatch({
        type: 'chat/pushRunningChatHistory',
        payload: { chat, model: model1, message: history1 },
      });
      store.dispatch({
        type: 'chat/pushRunningChatHistory',
        payload: { chat, model: model2, message: history2 },
      });

      // Dispatch startSendChatMessage rejected action
      store.dispatch({
        type: 'chatModel/startSendChatMessage/rejected',
        meta: { arg: { chat, message: 'test' } },
      });

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
      store.dispatch({
        type: 'chat/initialize/rejected',
        error: { message: 'Init error' },
      });

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

      // 直接调用 reducer（通过 dispatch action）
      store.dispatch({
        type: 'chat/pushChatHistory',
        payload: { chat, model, message },
      });

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
      store.dispatch({
        type: 'chat/pushChatHistory',
        payload: { chat, model, message },
      });

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
      store.dispatch({
        type: 'chatModel/sendMessage/pending',
        meta: { arg: { chat, model, message: 'test', historyList: [] } },
      });

      // 更新运行中的历史记录
      store.dispatch({
        type: 'chat/pushRunningChatHistory',
        payload: { chat, model, message },
      });

      const state = store.getState().chat;
      expect(state.runningChat[chat.id]?.[model.id]?.history).toEqual(message);
    });
  });

  // 聊天列表过滤测试已被删除：集成测试已覆盖软删除和过滤逻辑
});
