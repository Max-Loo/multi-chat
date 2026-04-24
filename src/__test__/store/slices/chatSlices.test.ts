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
import { ChatMeta } from '@/types/chat';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createMockChat } from '@/__test__/helpers/testing-utils';
import { createMockMessage } from '@/__test__/fixtures/chat';

// Mock 依赖 - 必须在导入 slice 之前执行
// 使用 vi.hoisted 确保变量在 vi.mock 之前被定义
const { mockLoadChatIndex } = vi.hoisted(() => ({
  mockLoadChatIndex: vi.fn<() => Promise<ChatMeta[]>>(() => Promise.resolve([])),
}));

// Mock 所有存储相关的模块
vi.mock('@/store/storage', () => ({
  loadChatIndex: mockLoadChatIndex,
  loadChatById: vi.fn(() => Promise.resolve(undefined)),
  saveChatIndex: vi.fn(() => Promise.resolve(undefined)),
  saveChatById: vi.fn(() => Promise.resolve(undefined)),
  saveChatAndIndex: vi.fn(() => Promise.resolve(undefined)),
  deleteChatFromStorage: vi.fn(() => Promise.resolve(undefined)),
  migrateOldChatStorage: vi.fn(() => Promise.resolve(undefined)),
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

vi.mock('@/services/chat', () => ({
  streamChatCompletion: vi.fn(),
  generateChatTitleService: vi.fn(),
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
  releaseCompletedBackgroundChat,
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
    mockLoadChatIndex.mockResolvedValue([]);
    mockPreloadProviders.mockClear();
    store = createTestStore();
  });

  describe('initialState', () => {
    it('应该返回正确的初始状态', () => {
      const state = store.getState().chat;
      expect(state).toEqual({
        chatMetaList: [],
        activeChatData: {},
        sendingChatIds: {},
        loading: false,
        selectedChatId: null,
        error: null,
        initializationError: null,
        runningChat: {},
      });
    });
  });

  // initializeChatList 状态转换测试已被删除：
  // - pending/fulfilled 测试：已被集成测试覆盖
  // - 保留 rejected 测试以覆盖错误分支

  describe('initializeChatList rejected', () => {
    it('应该在 rejected 时恢复 loading 并设置 initializationError', () => {
      // 先设置 loading 状态
      store.dispatch(initializeChatList.pending('init-req'));
      expect(store.getState().chat.loading).toBe(true);

      // 触发 rejected
      store.dispatch(initializeChatList.rejected(new Error('Storage read failed'), 'init-req'));

      const state = store.getState().chat;
      expect(state.loading).toBe(false);
      expect(state.initializationError).toBe('Storage read failed');
      // 聊天列表不应被修改
      expect(state.chatList).toEqual([]);
    });

    it('应该在 loadChatsFromJson 抛出异常时正确处理错误', async () => {
      // 设置 mock 使加载抛出异常
      mockLoadChatsFromJson.mockRejectedValue(new Error('Disk I/O error'));

      const result = await store.dispatch(initializeChatList());

      const state = store.getState().chat;
      expect(state.loading).toBe(false);
      expect(state.initializationError).toContain('Disk I/O error');
      expect(state.chatList).toEqual([]);
      expect(result.type).toBe('chat/initialize/rejected');
    });

    it('应该在 loadChatsFromJson 抛出非 Error 类型时使用默认错误消息', async () => {
      mockLoadChatsFromJson.mockRejectedValue('unexpected string');

      const result = await store.dispatch(initializeChatList());

      const state = store.getState().chat;
      expect(state.loading).toBe(false);
      expect(state.initializationError).toBe('Failed to initialize chat data');
      expect(result.type).toBe('chat/initialize/rejected');
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
      const arg = { chat, model, message, historyList: [] };

      // Dispatch pending action
      store.dispatch(sendMessage.pending('test-req-1', arg));

      // 验证 runningChat 状态
      const state = store.getState().chat;
      expect(state.runningChat[chat.id]?.[model.id]?.isSending).toBe(true);
      expect(state.runningChat[chat.id]?.[model.id]?.errorMessage).toBe('');
    });

    it('应该在 fulfilled 时清理 runningChat 并回写 activeChatData', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-1' });
      const message = 'Hello';
      const arg = { chat, model, message, historyList: [] };
      const responseMessage = createMockMessage();

      // 先创建聊天到 store（会同时写入 chatMetaList 和 activeChatData）
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

      // 验证历史记录被添加到 activeChatData 中
      expect(state.activeChatData[chat.id].chatModelList?.[0].chatHistoryList).toHaveLength(1);
      expect(state.activeChatData[chat.id].chatModelList?.[0].chatHistoryList?.[0]).toEqual(responseMessage);
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
    it('应该在 rejected 时将所有运行中的历史记录回写到 activeChatData', () => {
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

      // 先创建聊天到 store（会同时写入 chatMetaList 和 activeChatData）
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

      // 验证历史记录被回写到 activeChatData 中
      const state = store.getState().chat;
      expect(state.activeChatData[chat.id].chatModelList?.[0].chatHistoryList).toHaveLength(1);
      expect(state.activeChatData[chat.id].chatModelList?.[0].chatHistoryList?.[0]).toEqual(history1);
      expect(state.activeChatData[chat.id].chatModelList?.[1].chatHistoryList).toHaveLength(1);
      expect(state.activeChatData[chat.id].chatModelList?.[1].chatHistoryList?.[0]).toEqual(history2);
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

      // createChat 会同时写入 chatMetaList 和 activeChatData
      store.dispatch(createChat({ chat }));

      // 直接调用 action creator
      store.dispatch(pushChatHistory({ chat, model, message }));

      const state = store.getState().chat;
      // 验证 activeChatData 中的历史记录
      expect(state.activeChatData[chat.id].chatModelList?.[0].chatHistoryList).toHaveLength(1);
      expect(state.activeChatData[chat.id].chatModelList?.[0].chatHistoryList?.[0]).toEqual(message);
    });

    it('应该在聊天不存在于 activeChatData 时不添加消息', () => {
      const model = createMockModel({ id: 'model-1' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const message = createMockMessage();

      // 不创建聊天，直接尝试添加消息（activeChatData 中不存在该聊天）
      store.dispatch(pushChatHistory({ chat, model, message }));

      const state = store.getState().chat;
      // chatMetaList 和 activeChatData 都应该为空
      expect(state.chatMetaList).toHaveLength(0);
      expect(Object.keys(state.activeChatData)).toHaveLength(0);
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
      // 验证 chatMetaList 中的更新
      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      expect(meta.name).toBe('New Name');
      expect(meta.isManuallyNamed).toBe(true);
      // 验证 activeChatData 中的更新
      expect(state.activeChatData[chat.id].name).toBe('New Name');
      expect(state.activeChatData[chat.id].isManuallyNamed).toBe(true);
    });

    it('应该拒绝编辑为空名称（保持原有名称）', () => {
      const chat = createMockChat({ name: 'Old Name' });
      store.dispatch(createChat({ chat }));

      // 尝试编辑为空名称（应该被拒绝）
      store.dispatch(editChatName({ id: chat.id, name: '' }));

      const state = store.getState().chat;
      // 名称应该保持不变
      expect(state.activeChatData[chat.id].name).toBe('Old Name');
      // isManuallyNamed 应该保持 undefined（因为没有更新）
      expect(state.activeChatData[chat.id].isManuallyNamed).toBeUndefined();
    });

    it('应该拒绝编辑为仅空白字符的名称', () => {
      const chat = createMockChat({ name: 'Old Name' });
      store.dispatch(createChat({ chat }));

      // 尝试编辑为仅空白字符（应该被拒绝）
      store.dispatch(editChatName({ id: chat.id, name: '   ' }));

      const state = store.getState().chat;
      // 名称应该保持不变
      expect(state.activeChatData[chat.id].name).toBe('Old Name');
      // isManuallyNamed 应该保持 undefined
      expect(state.activeChatData[chat.id].isManuallyNamed).toBeUndefined();
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
      // 验证 activeChatData 中的更新
      expect(state.activeChatData[chat.id].name).toBe('Generated Title');
      // isManuallyNamed 保持 undefined，允许手动覆盖
      expect(state.activeChatData[chat.id].isManuallyNamed).toBeUndefined();
      // 验证 chatMetaList 中的更新
      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      expect(meta.name).toBe('Generated Title');
    });

    it('应该在失败时不更新聊天名称', () => {
      const chat = createMockChat({ name: undefined });
      store.dispatch(createChat({ chat }));

      // Dispatch fulfilled action with null (失败情况)
      store.dispatch(generateChatName.fulfilled(null, 'generate-req-2', { chat, model: createMockModel(), historyList: [] }));

      const state = store.getState().chat;
      expect(state.activeChatData[chat.id].name).toBeUndefined();
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

  describe('releaseCompletedBackgroundChat', () => {
    it('应该在非当前选中时删除 activeChatData', () => {
      const chatA = createMockChat({ id: 'chat-a' });
      const chatB = createMockChat({ id: 'chat-b' });

      store.dispatch(createChat({ chat: chatA }));
      store.dispatch(createChat({ chat: chatB }));
      store.dispatch({ type: 'chat/setSelectedChatId', payload: 'chat-b' });

      store.dispatch(releaseCompletedBackgroundChat('chat-a'));

      const state = store.getState().chat;
      expect(state.activeChatData['chat-a']).toBeUndefined();
      expect(state.activeChatData['chat-b']).toBeDefined();
    });

    it('应该在当前选中时保留 activeChatData', () => {
      const chatA = createMockChat({ id: 'chat-a' });

      store.dispatch(createChat({ chat: chatA }));
      store.dispatch({ type: 'chat/setSelectedChatId', payload: 'chat-a' });

      store.dispatch(releaseCompletedBackgroundChat('chat-a'));

      const state = store.getState().chat;
      expect(state.activeChatData['chat-a']).toBeDefined();
    });
  });
});
