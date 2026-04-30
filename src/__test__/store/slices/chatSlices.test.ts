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
  createLazyStore: vi.fn(() => globalThis.__createMemoryStorageMock()),
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
  clearActiveChatData,
  deleteChat,
  setChatMetaList,
} from '@/store/slices/chatSlices';
import modelReducer, { createModel } from '@/store/slices/modelSlice';
import { loadChatById } from '@/store/storage';
import { streamChatCompletion, generateChatTitleService } from '@/services/chat';

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
      expect(state.chatMetaList).toEqual([]);
    });

    it('应该在 loadChatIndex 抛出异常时正确处理错误', async () => {
      // 设置 mock 使加载抛出异常
      mockLoadChatIndex.mockRejectedValue(new Error('Disk I/O error'));

      const result = await store.dispatch(initializeChatList());

      const state = store.getState().chat;
      expect(state.loading).toBe(false);
      expect(state.initializationError).toContain('Disk I/O error');
      expect(state.chatMetaList).toEqual([]);
      expect(result.type).toBe('chat/initialize/rejected');
    });

    it('应该在 loadChatIndex 抛出非 Error 类型时使用默认错误消息', async () => {
      mockLoadChatIndex.mockRejectedValue('unexpected string');

      const result = await store.dispatch(initializeChatList());

      const state = store.getState().chat;
      expect(state.loading).toBe(false);
      expect(state.initializationError).toBe('Failed to initialize chat data');
      expect(result.type).toBe('chat/initialize/rejected');
    });
  });

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


  describe('sendMessage.pending re-entry', () => {
    it('应该在重复 dispatch pending 时重置 isSending 和 errorMessage', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-1' });
      const arg = { chat, model, message: 'Hello', historyList: [] };

      // 第一次 dispatch pending
      store.dispatch(sendMessage.pending('req-1', arg));

      // 模拟 rejected 留下 errorMessage
      store.dispatch(sendMessage.rejected(new Error('previous error'), 'req-1', arg));

      // 第二次 dispatch pending（re-entry）
      store.dispatch(sendMessage.pending('req-2', arg));

      const state = store.getState().chat;
      const entry = state.runningChat[chat.id][model.id];
      expect(entry.isSending).toBe(true);
      expect(entry.errorMessage).toBe('');
      // history 保留（rejected 不清空 history）
      expect(entry.history).toBeDefined();
    });
  });

  describe('sendMessage.fulfilled appendHistoryToModel 失败', () => {
    it('应该在 activeChatData 不存在时跳过清理 runningChat', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-1' });
      const arg = { chat, model, message: 'Hello', historyList: [] };
      const responseMessage = createMockMessage();

      // 创建聊天
      store.dispatch(createChat({ chat }));

      // 初始化 runningChat
      store.dispatch(sendMessage.pending('req-append-fail', arg));

      // 设置运行中的历史记录
      store.dispatch(pushRunningChatHistory({ chat, model, message: responseMessage }));

      // 从 activeChatData 中移除聊天（模拟 appendHistoryToModel 失败）
      store.dispatch(clearActiveChatData(chat.id));

      // Dispatch fulfilled — appendHistoryToModel 应返回 false
      store.dispatch(sendMessage.fulfilled(undefined, 'req-append-fail', arg));

      const state = store.getState().chat;
      // runningChat 不应被清理（保留错误现场）
      expect(state.runningChat[chat.id][model.id]).toBeDefined();
      expect(state.runningChat[chat.id][model.id].isSending).toBe(false);
    });
  });

  describe('generateChatName.fulfilled 边界分支', () => {
    it('应该在 payload 为 null 时 state 完全不变', () => {
      const chat = createMockChat({ name: 'Original Name' });
      store.dispatch(createChat({ chat }));

      const stateBefore = store.getState().chat;

      store.dispatch(generateChatName.fulfilled(null, 'gen-null', { chat, model: createMockModel(), historyList: [] }));

      const stateAfter = store.getState().chat;
      // chatMetaList 不变
      expect(stateAfter.chatMetaList).toEqual(stateBefore.chatMetaList);
      // activeChatData 不变
      expect(stateAfter.activeChatData[chat.id].name).toBe('Original Name');
    });

    it('应该在 chatId 不在 chatMetaList 中时跳过更新', () => {
      const chat = createMockChat({ name: 'Some Name' });
      store.dispatch(createChat({ chat }));

      const stateBefore = store.getState().chat;

      // 使用不存在的 chatId
      store.dispatch(generateChatName.fulfilled(
        { chatId: 'non-existent-chat', name: 'New Title' },
        'gen-missing',
        { chat, model: createMockModel(), historyList: [] },
      ));

      const stateAfter = store.getState().chat;
      // chatMetaList 不变（不存在的 chatId 不会更新任何条目）
      expect(stateAfter.chatMetaList).toEqual(stateBefore.chatMetaList);
    });

    it('应该在 activeChat 未加载时更新 chatMetaList 但不更新 activeChatData', () => {
      const chat = createMockChat({ name: 'Old Name' });
      store.dispatch(createChat({ chat }));

      // 从 activeChatData 中移除（模拟未加载）
      store.dispatch(clearActiveChatData(chat.id));

      store.dispatch(generateChatName.fulfilled(
        { chatId: chat.id, name: 'Generated Title' },
        'gen-no-active',
        { chat, model: createMockModel(), historyList: [] },
      ));

      const stateAfter = store.getState().chat;
      // chatMetaList 应该更新
      const meta = stateAfter.chatMetaList.find((m: any) => m.id === chat.id);
      expect(meta.name).toBe('Generated Title');
      // activeChatData 不应包含该聊天（更新被跳过）
      expect(stateAfter.activeChatData[chat.id]).toBeUndefined();
    });
  });

  describe('setSelectedChatIdWithPreload.fulfilled 前一个聊天清理', () => {
    it('应该在 previousChatId 存在且未发送时清理 activeChatData', async () => {
      const chatA = createMockChat({ id: 'chat-a' });
      const chatB = createMockChat({ id: 'chat-b' });

      store.dispatch(createChat({ chat: chatA }));
      store.dispatch(createChat({ chat: chatB }));

      // 选中 chatA
      await store.dispatch(setSelectedChatIdWithPreload('chat-a'));
      expect(store.getState().chat.selectedChatId).toBe('chat-a');
      expect(store.getState().chat.activeChatData['chat-a']).toBeDefined();

      // 切换到 chatB（通过 dispatch fulfilled 模拟）
      // 不使用 await dispatch 来避免 async thunk 的 loadChatById 调用
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'chat-b', chatData: chatB },
        'select-req-1',
        'chat-b',
      ));

      const state = store.getState().chat;
      // chatA 的 activeChatData 应被清理（不在 sendingChatIds 中）
      expect(state.activeChatData['chat-a']).toBeUndefined();
      // chatB 的 activeChatData 应被设置
      expect(state.activeChatData['chat-b']).toBeDefined();
      expect(state.selectedChatId).toBe('chat-b');
    });

    it('应该在 previousChatId 正在发送时保留 activeChatData', async () => {
      const chatA = createMockChat({ id: 'chat-a' });
      const chatB = createMockChat({ id: 'chat-b' });

      store.dispatch(createChat({ chat: chatA }));
      store.dispatch(createChat({ chat: chatB }));

      // 选中 chatA
      await store.dispatch(setSelectedChatIdWithPreload('chat-a'));

      // 标记 chatA 正在发送
      store.dispatch({ type: 'chatModel/startSendChatMessage/pending', meta: { arg: { chat: chatA, message: 'test' } } });

      // 切换到 chatB
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'chat-b', chatData: chatB },
        'select-req-2',
        'chat-b',
      ));

      const state = store.getState().chat;
      // chatA 的 activeChatData 应保留（正在发送中）
      expect(state.activeChatData['chat-a']).toBeDefined();
    });

    it('应该在无 previousChatId 时不执行清理', () => {
      const chatB = createMockChat({ id: 'chat-b' });
      store.dispatch(createChat({ chat: chatB }));

      // selectedChatId 初始为 null，无前一个聊天
      expect(store.getState().chat.selectedChatId).toBeNull();

      // 切换到 chatB
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'chat-b', chatData: chatB },
        'select-req-3',
        'chat-b',
      ));

      const state = store.getState().chat;
      expect(state.selectedChatId).toBe('chat-b');
      expect(state.activeChatData['chat-b']).toBeDefined();
    });
  });

  describe('editChatName 超长名称截断', () => {
    it('应该在名称超过 20 个字符时截断为前 20 个字符', () => {
      const chat = createMockChat({ name: 'Short' });
      store.dispatch(createChat({ chat }));

      const longName = '这是一段非常非常非常非常长的聊天名称应该被截断';
      store.dispatch(editChatName({ id: chat.id, name: longName }));

      const state = store.getState().chat;
      // 截断为前 20 个字符
      expect(state.activeChatData[chat.id].name).toBe(longName.slice(0, 20));
      expect(state.activeChatData[chat.id].name!.length).toBe(20);

      // chatMetaList 也应截断
      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      expect(meta.name).toBe(longName.slice(0, 20));
      // 标记为手动命名
      expect(meta.isManuallyNamed).toBe(true);
    });
  });

  describe('deleteChat 正在发送时跳过', () => {
    it('应该在聊天正在发送时跳过删除', () => {
      const chat = createMockChat({ name: 'Active Chat' });
      store.dispatch(createChat({ chat }));

      // 标记为正在发送
      store.dispatch({ type: 'chatModel/startSendChatMessage/pending', meta: { arg: { chat, message: 'test' } } });

      // 尝试删除
      store.dispatch(deleteChat({ chat }));

      const state = store.getState().chat;
      // chatMetaList 不变
      expect(state.chatMetaList).toHaveLength(1);
      // activeChatData 不变
      expect(state.activeChatData[chat.id]).toBeDefined();
    });
  });

  describe('clearActiveChatData 正在发送时跳过', () => {
    it('应该在聊天正在发送时跳过清理', () => {
      const chat = createMockChat({ name: 'Sending Chat' });
      store.dispatch(createChat({ chat }));

      // 标记为正在发送
      store.dispatch({ type: 'chatModel/startSendChatMessage/pending', meta: { arg: { chat, message: 'test' } } });

      // 尝试清理
      store.dispatch(clearActiveChatData(chat.id));

      const state = store.getState().chat;
      // activeChatData 保留
      expect(state.activeChatData[chat.id]).toBeDefined();
    });
  });

  describe('createChat 已有 updatedAt', () => {
    it('应该在 updatedAt 已定义时保留原值', () => {
      const fixedTime = 1700000000;
      const chat = createMockChat({ name: 'Has UpdatedAt', updatedAt: fixedTime });
      store.dispatch(createChat({ chat }));

      const state = store.getState().chat;
      expect(state.activeChatData[chat.id].updatedAt).toBe(fixedTime);
    });
  });

  describe('initializeChatList rejected 无 error.message', () => {
    it('应该在 error.message 为空时使用默认消息', () => {
      store.dispatch(initializeChatList.pending('init-no-msg'));
      // 模拟 action.error 无 message 的情况
      store.dispatch({
        type: 'chat/initialize/rejected',
        payload: undefined,
        meta: { requestId: 'init-no-msg', aborted: false },
        error: { message: '' },
      });

      const state = store.getState().chat;
      expect(state.initializationError).toBe('Failed to initialize file');
    });
  });

  describe('sendMessage.rejected 无 error 对象', () => {
    it('应该在 error 为 undefined 时使用默认空字符串', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-1' });
      const arg = { chat, model, message: 'test', historyList: [] };

      store.dispatch(sendMessage.pending('req-no-error', arg));

      // 模拟 action.error 为 undefined 的情况
      store.dispatch({
        type: 'chatModel/sendMessage/rejected',
        payload: undefined,
        meta: { arg, requestId: 'req-no-error', aborted: false },
        error: undefined as any,
      });

      const state = store.getState().chat;
      expect(state.runningChat[chat.id][model.id].isSending).toBe(false);
      expect(state.runningChat[chat.id][model.id].errorMessage).toBe('');
    });
  });

  describe('sendMessage.fulfilled activeChat 不存在时跳过 updatedAt 更新', () => {
    it('应该在 activeChat 不存在时不更新 updatedAt', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-1' });
      const arg = { chat, model, message: 'Hello', historyList: [] };

      store.dispatch(createChat({ chat }));
      store.dispatch(sendMessage.pending('req-no-active-update', arg));
      // 从 activeChatData 中移除（模拟已清理）
      store.dispatch(clearActiveChatData(chat.id));
      // 此时 activeChatData 中不存在该聊天
      store.dispatch(sendMessage.fulfilled(undefined, 'req-no-active-update', arg));

      const state = store.getState().chat;
      // runningChat 保留（appendHistoryToModel 失败）
      expect(state.runningChat[chat.id][model.id]).toBeDefined();
    });
  });

  describe('appendHistoryToModel 边界路径', () => {
    it('应该在 modelId 不匹配时跳过追加', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const wrongModel = createMockModel({ id: 'non-existent-model' });
      const message = createMockMessage();

      store.dispatch(createChat({ chat }));
      store.dispatch(pushChatHistory({ chat, model: wrongModel, message }));

      const state = store.getState().chat;
      // 不应有任何历史记录被追加
      expect(state.activeChatData[chat.id].chatModelList[0].chatHistoryList).toHaveLength(0);
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

  // ==================== Task 1: NoCoverage — initializeChatList filter ====================

  describe('initializeChatList fulfilled - 过滤已删除聊天', () => {
    it('应该过滤掉 isDeleted 为 true 的条目，保留未删除条目', async () => {
      const activeChat: ChatMeta = { id: 'chat-active', name: 'Active', modelIds: [], isDeleted: false };
      const deletedChat: ChatMeta = { id: 'chat-deleted', name: 'Deleted', modelIds: [], isDeleted: true };

      mockLoadChatIndex.mockResolvedValue([activeChat, deletedChat]);

      await store.dispatch(initializeChatList());

      const state = store.getState().chat;
      expect(state.chatMetaList).toHaveLength(1);
      expect(state.chatMetaList[0]).toEqual(activeChat);
      expect(state.chatMetaList[0].id).toBe('chat-active');
      expect(state.loading).toBe(false);
    });

    it('应该在空列表传入时 chatMetaList 为空数组', async () => {
      mockLoadChatIndex.mockResolvedValue([]);

      await store.dispatch(initializeChatList());

      const state = store.getState().chat;
      expect(state.chatMetaList).toEqual([]);
      expect(state.loading).toBe(false);
    });
  });

  // ==================== Task 2: NoCoverage — setSelectedChatIdWithPreload 预加载 ====================

  describe('setSelectedChatIdWithPreload - 预加载 SDK', () => {
    it('chatModelList 非空且 model 存在时，应该调用 preloadProviders 并传入正确的 providerKey', async () => {
      const model = createMockModel({ id: 'model-preload' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-preload', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      await store.dispatch(setSelectedChatIdWithPreload(chat.id));

      expect(mockPreloadProviders).toHaveBeenCalledTimes(1);
      expect(mockPreloadProviders).toHaveBeenCalledWith([model.providerKey]);
    });

    it('model 不在 models 列表中时，应该跳过 providerKey 提取', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'missing-model', chatHistoryList: [] }],
      });

      store.dispatch(createChat({ chat }));

      await store.dispatch(setSelectedChatIdWithPreload(chat.id));

      expect(mockPreloadProviders).not.toHaveBeenCalled();
    });

    it('providerKeys 为空时，不应该调用 preloadProviders', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'orphan-model', chatHistoryList: [] }],
      });

      store.dispatch(createChat({ chat }));

      await store.dispatch(setSelectedChatIdWithPreload(chat.id));

      expect(mockPreloadProviders).not.toHaveBeenCalled();
    });

    it('预加载抛出异常时，返回值不受影响', async () => {
      const model = createMockModel({ id: 'model-throw' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-throw', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));
      mockPreloadProviders.mockRejectedValue(new Error('preload failed'));

      const result = await store.dispatch(setSelectedChatIdWithPreload(chat.id));

      expect(result.type).toMatch(/fulfilled$/);
      expect(store.getState().chat.selectedChatId).toBe(chat.id);
    });

    // #94 杀死 find 条件变异：多 model 场景验证正确 providerKey
    it('多个 model 时应只预加载聊天引用的 providerKey', async () => {
      const model1 = createMockModel({ id: 'model-pk-a', providerKey: 'PROVIDER_A' as any });
      const model2 = createMockModel({ id: 'model-pk-b', providerKey: 'PROVIDER_B' as any });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-pk-b', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model: model1 }));
      store.dispatch(createModel({ model: model2 }));
      store.dispatch(createChat({ chat }));

      await store.dispatch(setSelectedChatIdWithPreload(chat.id));

      // 真实：find 匹配 model-pk-b → providerKey = PROVIDER_B
      // 变异 find 条件为 true → 返回第一个 model-pk-a → providerKey = PROVIDER_A
      expect(mockPreloadProviders).toHaveBeenCalledWith([model2.providerKey]);
    });

    // #85 杀死解构默认值变异：chatModelList undefined 时触发默认值
    it('chatData.chatModelList 为 undefined 时应跳过预加载', async () => {
      // 陷阱 model：id 为 undefined，匹配变异后 "Stryker was here".modelId (undefined)
      const trapModel = createMockModel({ id: undefined as any, providerKey: 'trap-key' as any });
      store.dispatch(createModel({ model: trapModel }));

      const chatRaw = createMockChat();
      delete (chatRaw as any).chatModelList;
      (loadChatById as any).mockResolvedValue(chatRaw);

      await store.dispatch(setSelectedChatIdWithPreload(chatRaw.id));

      // 真实：chatModelList = []，跳过预加载
      // 变异：chatModelList = ["Stryker was here"]，匹配 trapModel，调用预加载
      expect(mockPreloadProviders).not.toHaveBeenCalled();
    });

    // #97 杀死 if (model) 条件变异：model 未找到时不应触发预加载异常
    it('model 未找到时不应触发预加载异常', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'missing-model-warn', chatHistoryList: [] }],
      });
      store.dispatch(createChat({ chat }));

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await store.dispatch(setSelectedChatIdWithPreload(chat.id));

      // 真实：if (model) 跳过，不触发异常
      // 变异：if (true) 进入块，undefined.providerKey 抛出 TypeError，被 catch 捕获
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    // #105 杀死 catch 块变异：预加载失败应记录 console.warn
    it('预加载失败时应记录 console.warn', async () => {
      const model = createMockModel({ id: 'model-warn-catch' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-warn-catch', chatHistoryList: [] }],
      });
      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      mockPreloadProviders.mockRejectedValue(new Error('preload crashed'));

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await store.dispatch(setSelectedChatIdWithPreload(chat.id));

      // 真实：catch 块记录 console.warn
      // 变异：catch 块替换为 {}，不记录
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to preload provider SDKs:',
        expect.any(Error),
      );

      warnSpy.mockRestore();
    });
  });

  // ==================== Task 3: NoCoverage — generateChatName / startSendChatMessage / setChatMetaList ====================

  describe('generateChatName - autoNamingEnabled 路径', () => {
    it('autoNamingEnabled 为 true 且调用成功时，应返回完整结构', async () => {
      (generateChatTitleService as any).mockResolvedValue('AI Generated Title');

      const chat = createMockChat();
      store.dispatch(createChat({ chat }));

      const result = await store.dispatch(generateChatName({
        chat,
        model: createMockModel(),
        historyList: [],
      }));

      expect(result.payload).toEqual({
        chatId: chat.id,
        name: 'AI Generated Title',
      });
    });

    it('autoNamingEnabled 为 false 时应返回 null', async () => {
      const storeNoAutoName = configureStore({
        reducer: {
          chat: chatReducer,
          models: modelReducer,
          appConfig: (state = { transmitHistoryReasoning: false, language: '', autoNamingEnabled: false }) => state,
        },
      });

      const chat = createMockChat();
      storeNoAutoName.dispatch(createChat({ chat }));

      const result = await (storeNoAutoName.dispatch as typeof store.dispatch)(generateChatName({
        chat,
        model: createMockModel(),
        historyList: [],
      }));

      expect(result.payload).toBeNull();
    });
  });

  describe('startSendChatMessage - NoCoverage 路径', () => {
    it('chatModelList 非空且有匹配 model 时，应该执行发送', async () => {
      const model = createMockModel({ id: 'model-send', isEnable: true, isDeleted: false });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-send', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      (streamChatCompletion as any).mockReturnValue(
        (async function* () { })()
      );

      await store.dispatch(startSendChatMessage({ chat, message: 'hello' }));

      const state = store.getState().chat;
      expect(state.sendingChatIds[chat.id]).toBeUndefined();
    });

    // #120 杀死解构默认值变异：chatModelList undefined 时不应发送
    it('chat.chatModelList 为 undefined 时不应发送消息', async () => {
      const trapModel = createMockModel({ id: undefined as any, providerKey: 'trap' as any });
      store.dispatch(createModel({ model: trapModel }));

      const chat = createMockChat({ chatModelList: undefined as any });
      store.dispatch(createChat({ chat }));

      await store.dispatch(startSendChatMessage({ chat, message: 'hello' }));

      const state = store.getState().chat;
      // 真实：chatModelList = []，不发送
      // 变异：chatModelList = ["Stryker was here"]，匹配 trapModel，触发 sendMessage → runningChat 创建
      expect(state.runningChat[chat.id]).toBeUndefined();
    });
  });

  describe('setChatMetaList', () => {
    it('应该将 chatMetaList 设置为 payload 的内容', () => {
      const metaList: ChatMeta[] = [
        { id: 'chat-1', name: 'Chat 1', modelIds: [] },
        { id: 'chat-2', name: 'Chat 2', modelIds: [] },
      ];

      store.dispatch(setChatMetaList(metaList));

      const state = store.getState().chat;
      expect(state.chatMetaList).toEqual(metaList);
    });

    it('应该是浅拷贝而非引用', () => {
      const metaList: ChatMeta[] = [
        { id: 'chat-1', name: 'Chat 1', modelIds: [] },
      ];

      store.dispatch(setChatMetaList(metaList));

      const state = store.getState().chat;
      expect(state.chatMetaList).not.toBe(metaList);
    });
  });

  // ==================== Task 4: ConditionalExpression — 异步 thunk 条件反向路径 ====================

  describe('setSelectedChatIdWithPreload - 条件分支反向路径', () => {
    it('chatId 为 null 时应返回 { chatId: null }', async () => {
      const result = await store.dispatch(setSelectedChatIdWithPreload(null));

      expect(result.payload).toEqual({ chatId: null });
    });

    it('chatData 已缓存时应跳过 loadChatById', async () => {
      const chat = createMockChat({ chatModelList: [] });
      store.dispatch(createChat({ chat }));

      (loadChatById as any).mockClear();

      await store.dispatch(setSelectedChatIdWithPreload(chat.id));

      expect(loadChatById).not.toHaveBeenCalled();
    });

    it('loaded 为 null 时应返回仅包含 chatId 的结果', async () => {
      (loadChatById as any).mockResolvedValue(undefined);

      const result = await store.dispatch(setSelectedChatIdWithPreload('unknown-chat-id'));

      expect(result.payload).toEqual({ chatId: 'unknown-chat-id' });
      expect(store.getState().chat.activeChatData['unknown-chat-id']).toBeUndefined();
    });

    it('chatModelList 长度为 1 时应执行预加载', async () => {
      const model = createMockModel({ id: 'model-boundary' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-boundary', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      await store.dispatch(setSelectedChatIdWithPreload(chat.id));

      expect(mockPreloadProviders).toHaveBeenCalledTimes(1);
      expect(mockPreloadProviders).toHaveBeenCalledWith([model.providerKey]);
    });
  });

  describe('startSendChatMessage - 条件分支反向路径', () => {
    it('model isDeleted 为 true 时应跳过发送', async () => {
      const model = createMockModel({ id: 'model-deleted', isDeleted: true, isEnable: true });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-deleted', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      await store.dispatch(startSendChatMessage({ chat, message: 'hello' }));

      const state = store.getState().chat;
      expect(state.runningChat[chat.id]).toBeUndefined();
    });

    it('model isEnable 为 false 时应跳过发送', async () => {
      const model = createMockModel({ id: 'model-disabled', isEnable: false, isDeleted: false });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-disabled', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      await store.dispatch(startSendChatMessage({ chat, message: 'hello' }));

      const state = store.getState().chat;
      expect(state.runningChat[chat.id]).toBeUndefined();
    });

    it('model 不存在时应跳过发送', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'non-existent-model-id', chatHistoryList: [] }],
      });

      store.dispatch(createChat({ chat }));

      await store.dispatch(startSendChatMessage({ chat, message: 'hello' }));

      const state = store.getState().chat;
      expect(state.runningChat[chat.id]).toBeUndefined();
    });
  });

  // ==================== Task 5: ConditionalExpression — reducer 内部条件反向路径 ====================

  describe('appendHistoryToModel - 条件反向路径', () => {
    it('message 为 null 时应跳过追加并保留 runningChat', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-null-msg', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-null-msg' });
      const arg = { chat, model, message: 'test', historyList: [] };

      store.dispatch(createChat({ chat }));
      // pending 设置 history 为 null
      store.dispatch(sendMessage.pending('req-null-msg', arg));

      // fulfilled 时 appendHistoryToModel(state, ..., null) 返回 false
      store.dispatch(sendMessage.fulfilled(undefined, 'req-null-msg', arg));

      const state = store.getState().chat;
      expect(state.runningChat[chat.id][model.id]).toBeDefined();
      expect(state.runningChat[chat.id][model.id].isSending).toBe(false);
    });

    it('chatModelList 为 falsy 时应返回 false', () => {
      const model = createMockModel({ id: 'model-no-list' });
      const chat = createMockChat({ chatModelList: undefined as any });
      const message = createMockMessage();

      store.dispatch(createChat({ chat }));
      store.dispatch(pushChatHistory({ chat, model, message }));

      const state = store.getState().chat;
      expect(state.activeChatData[chat.id].chatModelList).toBeUndefined();
    });

    // #161 + #162 杀死 Array.isArray 守卫变异：chatHistoryList 为非数组时初始化
    it('chatHistoryList 为非数组时应先初始化再追加', () => {
      const model = createMockModel({ id: 'model-no-hist' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-no-hist', chatHistoryList: undefined as any }],
      });
      const message = createMockMessage();

      store.dispatch(createChat({ chat }));
      store.dispatch(pushChatHistory({ chat, model, message }));

      const state = store.getState().chat;
      // 真实：L320 进入 if 块初始化 chatHistoryList = []，然后 push
      // #161 变异：if 块体 → {}，chatHistoryList 未初始化，后续 push 抛出异常
      // #162 变异：chatHistoryList = ["Stryker was here"]，push 后长度为 2 而非 1
      expect(state.activeChatData[chat.id].chatModelList[0].chatHistoryList).toEqual([message]);
    });

    // #148 杀死 BooleanLiteral 变异：chatModelList falsy 时 return false → return true
    it('chatModelList 为 falsy 时 sendMessage.fulfilled 不应清理 runningChat', () => {
      const model = createMockModel({ id: 'model-falsy-cml' });
      const chat = createMockChat({ chatModelList: undefined as any });
      const arg = { chat, model, message: 'test', historyList: [] };
      const responseMessage = createMockMessage();

      store.dispatch(createChat({ chat }));
      store.dispatch(sendMessage.pending('req-falsy-cml', arg));
      store.dispatch(pushRunningChatHistory({ chat, model, message: responseMessage }));
      store.dispatch(sendMessage.fulfilled(undefined, 'req-falsy-cml', arg));

      const state = store.getState().chat;
      // 真实：appendHistoryToModel 返回 false → runningChat 保留
      // 变异：return false → return true → runningChat 被删除
      expect(state.runningChat[chat.id][model.id]).toBeDefined();
      expect(state.runningChat[chat.id][model.id].isSending).toBe(false);
    });
  });

  describe('updateMetaInList - metaIdx 为 -1', () => {
    it('chatId 不在 chatMetaList 中时不应更新任何条目', () => {
      const chat = createMockChat();
      store.dispatch(createChat({ chat }));

      const stateBefore = store.getState().chat;

      store.dispatch(generateChatName.fulfilled(
        { chatId: 'non-existent-meta-id', name: 'New Title' },
        'gen-meta-idx',
        { chat, model: createMockModel(), historyList: [] },
      ));

      const state = store.getState().chat;
      expect(state.chatMetaList).toEqual(stateBefore.chatMetaList);
    });
  });

  describe('editChatName - 边界条件', () => {
    it('name 恰好 20 字符时不应截断', () => {
      const chat = createMockChat({ name: 'Original' });
      store.dispatch(createChat({ chat }));

      const name20 = 'a'.repeat(20);
      store.dispatch(editChatName({ id: chat.id, name: name20 }));

      const state = store.getState().chat;
      expect(state.activeChatData[chat.id].name).toBe(name20);
      expect(state.activeChatData[chat.id].name!.length).toBe(20);

      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      expect(meta.name).toBe(name20);
    });
  });

  describe('deleteChat - 条件反向路径', () => {
    it('不在 sendingChatIds 中时应该正常删除并精确验证内容', () => {
      const chat1 = createMockChat({ id: 'chat-del-ok-1', name: 'Chat 1' });
      const chat2 = createMockChat({ id: 'chat-del-ok-2', name: 'Chat 2' });

      store.dispatch(createChat({ chat: chat1 }));
      store.dispatch(createChat({ chat: chat2 }));

      store.dispatch(deleteChat({ chat: chat1 }));

      const state = store.getState().chat;
      expect(state.chatMetaList.find((m: any) => m.id === chat1.id)).toBeUndefined();
      expect(state.activeChatData[chat1.id]).toBeUndefined();
      expect(state.chatMetaList.find((m: any) => m.id === chat2.id)).toBeDefined();
      expect(state.activeChatData[chat2.id]).toBeDefined();
    });

    it('selectedChatId 不匹配时不应该置空 selectedChatId', () => {
      const chatA = createMockChat({ id: 'chat-del-sel-a' });
      const chatB = createMockChat({ id: 'chat-del-sel-b' });

      store.dispatch(createChat({ chat: chatA }));
      store.dispatch(createChat({ chat: chatB }));
      store.dispatch({ type: 'chat/setSelectedChatId', payload: 'chat-del-sel-b' });

      store.dispatch(deleteChat({ chat: chatA }));

      expect(store.getState().chat.selectedChatId).toBe('chat-del-sel-b');
    });
  });

  // ==================== Task 6: 精确化 state 断言 ====================

  describe('精确断言验证', () => {
    it('sendMessage.fulfilled 应正确设置 activeChatData 的完整字段', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-precise', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-precise' });
      const arg = { chat, model, message: 'Hello', historyList: [] };
      const responseMessage = createMockMessage();

      store.dispatch(createChat({ chat }));
      store.dispatch(sendMessage.pending('req-precise-ful', arg));
      store.dispatch(pushRunningChatHistory({ chat, model, message: responseMessage }));
      store.dispatch(sendMessage.fulfilled(undefined, 'req-precise-ful', arg));

      const state = store.getState().chat;
      expect(state.activeChatData[chat.id].chatModelList).toEqual([{
        modelId: 'model-precise',
        chatHistoryList: [responseMessage],
      }]);
      expect(state.activeChatData[chat.id].updatedAt).toEqual(expect.any(Number));
      expect(state.runningChat[chat.id]?.[model.id]).toBeUndefined();
    });

    it('generateChatName.fulfilled 应正确设置 updatedAt', () => {
      const chat = createMockChat({ name: undefined });
      store.dispatch(createChat({ chat }));

      store.dispatch(generateChatName.fulfilled(
        { chatId: chat.id, name: 'Generated Title' },
        'gen-precise-ts',
        { chat, model: createMockModel(), historyList: [] },
      ));

      const state = store.getState().chat;
      expect(state.activeChatData[chat.id].updatedAt).toEqual(expect.any(Number));

      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      expect(meta.updatedAt).toEqual(expect.any(Number));
      expect(meta.name).toBe('Generated Title');
    });

    it('startSendChatMessage.rejected 应清理 sendingChatIds', () => {
      const chat = createMockChat();
      store.dispatch(createChat({ chat }));

      store.dispatch(startSendChatMessage.pending('req-cleanup-send', { chat, message: 'test' }));
      expect(store.getState().chat.sendingChatIds[chat.id]).toBe(true);

      store.dispatch(startSendChatMessage.rejected(new Error('cancelled'), 'req-cleanup-send', { chat, message: 'test' }));

      expect(store.getState().chat.sendingChatIds[chat.id]).toBeUndefined();
    });

    it('setSelectedChatIdWithPreload.fulfilled 应精确设置 activeChatData', () => {
      const chatA = createMockChat({ id: 'chat-precise-a' });
      const chatB = createMockChat({ id: 'chat-precise-b', name: 'Chat B' });

      store.dispatch(createChat({ chat: chatA }));
      store.dispatch(createChat({ chat: chatB }));

      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'chat-precise-a', chatData: chatA },
        'sel-precise-1',
        'chat-precise-a',
      ));

      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'chat-precise-b', chatData: chatB },
        'sel-precise-2',
        'chat-precise-b',
      ));

      const state = store.getState().chat;
      expect(state.activeChatData['chat-precise-a']).toBeUndefined();
      expect(state.activeChatData['chat-precise-b']).toEqual(chatB);
      expect(state.selectedChatId).toBe('chat-precise-b');
    });
  });

});
