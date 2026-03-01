/**
 * chatSlices 单元测试
 * 
 * 测试聊天列表管理、消息发送、多模型并发等核心业务逻辑
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import chatReducer, {
  initializeChatList,
  clearError,
  clearInitializationError,
  setSelectedChatId,
  clearSelectChatId,
  createChat,
  editChat,
  editChatName,
  deleteChat,
} from '@/store/slices/chatSlices';
import modelReducer from '@/store/slices/modelSlice';
import { loadChatsFromJson } from '@/store/storage';
import { Chat, ChatRoleEnum, StandardMessage } from '@/types/chat';
import { Model } from '@/types/model';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { createIdGenerator } from 'ai';

// Mock 依赖
vi.mock('@/store/storage', () => ({
  loadChatsFromJson: vi.fn(),
}));

vi.mock('@/services/chatService', () => ({
  streamChatCompletion: vi.fn(),
}));

const mockLoadChatsFromJson = vi.mocked(loadChatsFromJson);

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
    it('应该在 pending 时设置 loading 为 true', async () => {
      // Mock loadChatsFromJson 返回永不解析的 Promise
      mockLoadChatsFromJson.mockReturnValue(new Promise(() => {}));

      // Dispatch Thunk（不等待）
      store.dispatch(initializeChatList());

      // 立即验证 pending 状态
      const state = store.getState().chat;
      expect(state.loading).toBe(true);
      expect(state.initializationError).toBe(null);
    });

    it('应该在 fulfilled 时更新聊天列表', async () => {
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

    it('应该在 rejected 时设置错误信息', async () => {
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

  describe('聊天管理 reducers', () => {
    it('应该创建新聊天', () => {
      const newChat = createMockChat({ name: 'New Chat' });

      store.dispatch(createChat({ chat: newChat }));

      const state = store.getState().chat;
      expect(state.chatList).toHaveLength(1);
      expect(state.chatList[0]).toEqual(newChat);
    });

    it('应该编辑聊天', () => {
      const chat = createMockChat({ name: 'Old Name' });
      store.dispatch(createChat({ chat }));

      const updatedChat = { ...chat, name: 'New Name' };
      store.dispatch(editChat({ chat: updatedChat }));

      const state = store.getState().chat;
      expect(state.chatList[0].name).toBe('New Name');
    });

    it('应该编辑聊天名称', () => {
      const chat = createMockChat({ name: 'Old Name' });
      store.dispatch(createChat({ chat }));

      store.dispatch(editChatName({ id: chat.id, name: 'New Name' }));

      const state = store.getState().chat;
      expect(state.chatList[0].name).toBe('New Name');
    });

    it('应该软删除聊天（设置 isDeleted 标记）', () => {
      const chat = createMockChat();
      store.dispatch(createChat({ chat }));

      store.dispatch(deleteChat({ chat }));

      const state = store.getState().chat;
      expect(state.chatList).toHaveLength(1); // 数组长度不变
      expect(state.chatList[0].isDeleted).toBe(true); // 标记为已删除
    });

    it('应该在删除选中的聊天时将 selectedChatId 设置为 null', () => {
      const chat = createMockChat();
      store.dispatch(createChat({ chat }));
      store.dispatch(setSelectedChatId(chat.id));

      expect(store.getState().chat.selectedChatId).toBe(chat.id);

      store.dispatch(deleteChat({ chat }));

      expect(store.getState().chat.selectedChatId).toBe(null);
    });

    it('应该在删除未选中的聊天时保持 selectedChatId 不变', () => {
      const chat1 = createMockChat();
      const chat2 = createMockChat();
      store.dispatch(createChat({ chat: chat1 }));
      store.dispatch(createChat({ chat: chat2 }));
      store.dispatch(setSelectedChatId(chat1.id));

      store.dispatch(deleteChat({ chat: chat2 }));

      expect(store.getState().chat.selectedChatId).toBe(chat1.id);
    });
  });

  describe('选中聊天管理', () => {
    it('应该设置选中的聊天 ID', () => {
      const chatId = 'test-chat-id';
      store.dispatch(setSelectedChatId(chatId));

      const state = store.getState().chat;
      expect(state.selectedChatId).toBe(chatId);
    });

    it('应该清除选中的聊天 ID', () => {
      store.dispatch(setSelectedChatId('test-chat-id'));
      expect(store.getState().chat.selectedChatId).toBe('test-chat-id');

      store.dispatch(clearSelectChatId());

      expect(store.getState().chat.selectedChatId).toBe(null);
    });
  });

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

  describe('聊天列表过滤', () => {
    it('应该只返回未删除的聊天列表', () => {
      const chat1 = createMockChat({ id: 'chat-1', isDeleted: false });
      const chat2 = createMockChat({ id: 'chat-2', isDeleted: true });
      const chat3 = createMockChat({ id: 'chat-3', isDeleted: false });

      store.dispatch(createChat({ chat: chat1 }));
      store.dispatch(createChat({ chat: chat2 }));
      store.dispatch(createChat({ chat: chat3 }));

      const state = store.getState().chat;
      const activeChats = state.chatList.filter((c: Chat) => !c.isDeleted);

      expect(activeChats).toHaveLength(2);
      expect(activeChats.map((c: Chat) => c.id)).toEqual(['chat-1', 'chat-3']);
    });
  });
});
