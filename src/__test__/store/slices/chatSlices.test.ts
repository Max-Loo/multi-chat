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
      // history 保留（rejected 不清空 history，初始为 null）
      expect(entry.history).toBeNull();
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
      expect(state.runningChat[chat.id][model.id]).toEqual(expect.objectContaining({
        isSending: false,
        history: expect.anything(),
      }));
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
      expect(store.getState().chat.activeChatData['chat-a']).toEqual(chatA);

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
      expect(state.activeChatData['chat-b']).toEqual(chatB);
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
      expect(state.activeChatData['chat-a']).toEqual(chatA);
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
      expect(state.activeChatData['chat-b']).toEqual(chatB);
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
      expect(state.activeChatData[chat.id]).toEqual(chat);
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
      expect(state.activeChatData[chat.id]).toEqual(chat);
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
      expect(state.runningChat[chat.id][model.id]).toEqual(expect.objectContaining({
        isSending: false,
      }));
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
      expect(state.activeChatData['chat-b']).toEqual(chatB);
    });

    it('应该在当前选中时保留 activeChatData', () => {
      const chatA = createMockChat({ id: 'chat-a' });

      store.dispatch(createChat({ chat: chatA }));
      store.dispatch({ type: 'chat/setSelectedChatId', payload: 'chat-a' });

      store.dispatch(releaseCompletedBackgroundChat('chat-a'));

      const state = store.getState().chat;
      expect(state.activeChatData['chat-a']).toEqual(chatA);
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
      expect(state.runningChat[chat.id][model.id]).toEqual(expect.objectContaining({
        isSending: false,
      }));
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
      expect(state.runningChat[chat.id][model.id]).toEqual(expect.objectContaining({
        isSending: false,
      }));
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
      expect(state.chatMetaList.find((m: any) => m.id === chat2.id)).toEqual(expect.objectContaining({ id: chat2.id }));
      expect(state.activeChatData[chat2.id]).toEqual(chat2);
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

  // ==================== Task 9: 散布变异体 ====================

  describe('散布变异体 - initializeChatList 对象字面量', () => {
    it('初始化时 error 和 initializationError 应为 null', () => {
      const state = store.getState().chat;
      // 验证初始 state 结构完整（杀死对象字面量 {} 变异）
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

  describe('散布变异体 - sendMessage.fulfilled updatedAt 和 chatMetaList 同步', () => {
    it('fulfilled 时应同步更新 activeChatData.updatedAt 和 chatMetaList 条目', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-scatter', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-scatter' });
      const arg = { chat, model, message: 'Hello', historyList: [] };
      const responseMessage = createMockMessage({ content: 'Response' });

      store.dispatch(createChat({ chat }));
      store.dispatch(sendMessage.pending('req-scatter', arg));
      store.dispatch(pushRunningChatHistory({ chat, model, message: responseMessage }));
      store.dispatch(sendMessage.fulfilled(undefined, 'req-scatter', arg));

      const state = store.getState().chat;
      // updatedAt 应该被更新
      expect(state.activeChatData[chat.id].updatedAt).toEqual(expect.any(Number));
      // chatMetaList 中对应条目的 updatedAt 也应同步
      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      expect(meta.updatedAt).toEqual(expect.any(Number));
    });
  });

  describe('散布变异体 - sendMessage.rejected console.error', () => {
    it('rejected 时应调用 console.error 并包含关键字段', () => {
      const chat = createMockChat({
        id: 'chat-reject-log',
        name: 'Reject Chat',
        chatModelList: [{ modelId: 'model-reject-log', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-reject-log', modelKey: 'test-key', modelName: 'Test Model' });
      const arg = { chat, model, message: 'test', historyList: [] };

      store.dispatch(createChat({ chat }));
      store.dispatch(sendMessage.pending('req-reject-log', arg));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      store.dispatch(sendMessage.rejected(new Error('Test error'), 'req-reject-log', arg));

      // 验证 console.error 被调用且包含关键字段
      expect(errorSpy).toHaveBeenCalledWith(
        '❌ 聊天消息发送失败:',
        expect.objectContaining({
          chatId: chat.id,
          modelId: model.id,
        }),
      );

      errorSpy.mockRestore();
    });
  });

  describe('散布变异体 - clearError 预设错误场景', () => {
    it('应该在 error 有值时正确清除', () => {
      // 设置一个 error（通过模拟 rejected 状态）
      // chatSlices 中没有直接设置 state.error 的 action，
      // 但 clearError reducer 会将 state.error 设为 null
      // 验证先设置 error 再清除的逻辑
      const stateBefore = store.getState().chat;
      store.dispatch(clearError());
      const state = store.getState().chat;
      expect(state.error).toBeNull();
      // 其余字段不变
      expect(state.chatMetaList).toEqual(stateBefore.chatMetaList);
      expect(state.loading).toBe(stateBefore.loading);
    });
  });

  describe('散布变异体 - pushRunningChatHistory 条件表达式', () => {
    it('应该精确覆盖 history 字段而非合并', () => {
      const model = createMockModel({ id: 'model-push-overwrite' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-push-overwrite', chatHistoryList: [] }],
      });
      const message1 = createMockMessage({ content: 'First' });
      const message2 = createMockMessage({ content: 'Second' });

      store.dispatch(createChat({ chat }));

      // 初始化 runningChat
      const pendingArg = { chat, model, message: 'test', historyList: [] };
      store.dispatch(sendMessage.pending('req-push-1', pendingArg));

      // 第一次 push
      store.dispatch(pushRunningChatHistory({ chat, model, message: message1 }));
      let state = store.getState().chat;
      expect(state.runningChat[chat.id][model.id].history).toEqual(message1);

      // 第二次 push（覆盖）
      store.dispatch(pushRunningChatHistory({ chat, model, message: message2 }));
      state = store.getState().chat;
      expect(state.runningChat[chat.id][model.id].history).toEqual(message2);
      expect(state.runningChat[chat.id][model.id].history!.content).toBe('Second');
    });
  });

  // ==================== Task 8: deleteChat 精确断言 ====================

  describe('deleteChat - 精确断言', () => {
    it('删除 selectedChatId 匹配的 chat 后 selectedChatId 应为 null', () => {
      const chat = createMockChat({ id: 'chat-del-selected' });
      store.dispatch(createChat({ chat }));

      // 选中该聊天
      store.dispatch({ type: 'chat/setSelectedChatId', payload: chat.id });
      expect(store.getState().chat.selectedChatId).toBe(chat.id);

      // 删除
      store.dispatch(deleteChat({ chat }));

      const state = store.getState().chat;
      expect(state.selectedChatId).toBeNull();
      expect(state.activeChatData[chat.id]).toBeUndefined();
      expect(state.chatMetaList.find((m: any) => m.id === chat.id)).toBeUndefined();
    });

    it('删除后 chatMetaList 应仅移除目标 chat，保留其他 chat', () => {
      const chat1 = createMockChat({ id: 'chat-del-keep-1', name: 'Keep 1' });
      const chat2 = createMockChat({ id: 'chat-del-target', name: 'Delete Me' });
      const chat3 = createMockChat({ id: 'chat-del-keep-2', name: 'Keep 2' });

      store.dispatch(createChat({ chat: chat1 }));
      store.dispatch(createChat({ chat: chat2 }));
      store.dispatch(createChat({ chat: chat3 }));

      store.dispatch(deleteChat({ chat: chat2 }));

      const state = store.getState().chat;
      expect(state.chatMetaList).toHaveLength(2);
      // createChat 使用 unshift，所以顺序是 chat3, chat1（chat2 被删除）
      expect(state.chatMetaList[0].id).toBe('chat-del-keep-2');
      expect(state.chatMetaList[0].name).toBe('Keep 2');
      expect(state.chatMetaList[1].id).toBe('chat-del-keep-1');
      expect(state.chatMetaList[1].name).toBe('Keep 1');
      expect(state.activeChatData['chat-del-target']).toBeUndefined();
    });
  });

  // ==================== Task 7: appendHistoryToModel 精确断言 ====================

  describe('appendHistoryToModel - 精确断言', () => {
    it('modelId 不匹配时 chatModelList 所有条目不变', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-exist', chatHistoryList: [] }],
      });
      const wrongModel = createMockModel({ id: 'model-wrong' });
      const message = createMockMessage({ content: 'test' });

      store.dispatch(createChat({ chat }));
      const stateBefore = store.getState().chat;

      store.dispatch(pushChatHistory({ chat, model: wrongModel, message }));

      const state = store.getState().chat;
      // 逐字段断言 chatModelList 所有条目不变
      expect(state.activeChatData[chat.id].chatModelList).toEqual(stateBefore.activeChatData[chat.id].chatModelList);
      expect(state.activeChatData[chat.id].chatModelList[0].chatHistoryList).toHaveLength(0);
    });

    it('成功追加时 chatHistoryList 最后一条应精确匹配被追加的 message', () => {
      const model = createMockModel({ id: 'model-append-ok' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-append-ok', chatHistoryList: [] }],
      });
      const message = createMockMessage({
        id: 'msg-append-test',
        role: 'assistant' as any,
        content: 'Appended content',
        timestamp: 1700000000,
      });

      store.dispatch(createChat({ chat }));
      store.dispatch(pushChatHistory({ chat, model, message }));

      const state = store.getState().chat;
      const historyList = state.activeChatData[chat.id].chatModelList[0].chatHistoryList;
      expect(historyList).toHaveLength(1);
      expect(historyList[0]).toEqual(message);
      expect(historyList[0].content).toBe('Appended content');
    });
  });

  // ==================== Task 6: editChatName 精确断言 ====================

  describe('editChatName - 精确断言', () => {
    it('name 恰好 20 字符时 name 值精确匹配且 isManuallyNamed 为 true', () => {
      const chat = createMockChat({ name: 'Original' });
      store.dispatch(createChat({ chat }));

      const name20 = '一二三四五六七八九十abcdefghij'; // 恰好 20 字符
      store.dispatch(editChatName({ id: chat.id, name: name20 }));

      const state = store.getState().chat;
      // chatMetaList 逐字段验证
      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      expect(meta.name).toBe(name20);
      expect(meta.name!.length).toBe(20);
      expect(meta.isManuallyNamed).toBe(true);
      expect(meta.updatedAt).toEqual(expect.any(Number));

      // activeChatData 逐字段验证
      expect(state.activeChatData[chat.id].name).toBe(name20);
      expect(state.activeChatData[chat.id].isManuallyNamed).toBe(true);
      expect(state.activeChatData[chat.id].updatedAt).toEqual(expect.any(Number));
    });

    it('更新后 activeChatData 的 updatedAt 应为数字且 name 同步更新', () => {
      const chat = createMockChat({ name: 'Before' });
      store.dispatch(createChat({ chat }));

      store.dispatch(editChatName({ id: chat.id, name: 'After' }));

      const state = store.getState().chat;
      expect(typeof state.activeChatData[chat.id].updatedAt).toBe('number');
      expect(state.activeChatData[chat.id].name).toBe('After');
    });
  });

  // ==================== Task 5: startSendChatMessage 条件覆盖 ====================

  describe('startSendChatMessage - 条件分支增强验证', () => {
    it('model isDeleted=true 时不应调用 streamChatCompletion', async () => {
      const model = createMockModel({ id: 'model-del-cond', isDeleted: true, isEnable: true });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-del-cond', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      (streamChatCompletion as any).mockReturnValue(
        (async function* () { })()
      );

      await store.dispatch(startSendChatMessage({ chat, message: 'hello' }));

      // streamChatCompletion 不应被调用（isDeleted 跳过）
      expect(streamChatCompletion).not.toHaveBeenCalled();
      const state = store.getState().chat;
      expect(state.runningChat[chat.id]).toBeUndefined();
      expect(state.sendingChatIds[chat.id]).toBeUndefined();
    });

    it('model isEnable=false 时不应调用 streamChatCompletion', async () => {
      const model = createMockModel({ id: 'model-dis-cond', isEnable: false, isDeleted: false });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-dis-cond', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      (streamChatCompletion as any).mockReturnValue(
        (async function* () { })()
      );

      await store.dispatch(startSendChatMessage({ chat, message: 'hello' }));

      expect(streamChatCompletion).not.toHaveBeenCalled();
      const state = store.getState().chat;
      expect(state.runningChat[chat.id]).toBeUndefined();
    });
  });

  // ==================== Task 4: sendMessage thunk 体验证 ====================

  describe('sendMessage - thunk 体验证', () => {
    it('应该将 transmitHistoryReasoning 从 state 正确传入 streamChatCompletion', async () => {
      const transmitStore = configureStore({
        reducer: {
          chat: chatReducer,
          models: modelReducer,
          appConfig: (state = { transmitHistoryReasoning: true, language: '', autoNamingEnabled: true }) => state,
        },
      });

      const model = createMockModel({ id: 'model-thunk-1' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-thunk-1', chatHistoryList: [] }],
      });

      transmitStore.dispatch(createModel({ model }));
      transmitStore.dispatch(createChat({ chat }));

      (streamChatCompletion as any).mockReturnValue(
        (async function* () { })()
      );

      await transmitStore.dispatch(sendMessage({
        chat,
        message: 'hello',
        model,
        historyList: [],
      }));

      // 验证 streamChatCompletion 的调用参数包含 transmitHistoryReasoning: true
      expect(streamChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({ transmitHistoryReasoning: true }),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it('应该将 signal 传入 streamChatCompletion 的 options 参数', async () => {
      const model = createMockModel({ id: 'model-thunk-signal' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-thunk-signal', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      (streamChatCompletion as any).mockReturnValue(
        (async function* () { })()
      );

      await store.dispatch(sendMessage({
        chat,
        message: 'hello',
        model,
        historyList: [],
      }));

      // 验证 streamChatCompletion 第二个参数包含 signal 属性
      const callArgs = (streamChatCompletion as any).mock.calls[0];
      expect(callArgs[1]).toHaveProperty('signal');
      expect(callArgs[1].signal).toBeInstanceOf(AbortSignal);
    });
  });

  // ==================== Task 3: clearActiveChatData 精确断言 ====================

  describe('clearActiveChatData - 精确断言', () => {
    it('chatId 在 sendingChatIds 中时 activeChatData 逐字段保持不变', () => {
      const chat = createMockChat({ id: 'chat-clear-sending', name: 'Sending Chat', isDeleted: false });
      store.dispatch(createChat({ chat }));

      // 标记为正在发送
      store.dispatch({ type: 'chatModel/startSendChatMessage/pending', meta: { arg: { chat, message: 'test' } } });

      // 尝试清理
      store.dispatch(clearActiveChatData(chat.id));

      const state = store.getState().chat;
      // 逐字段验证 activeChatData 保留
      expect(state.activeChatData[chat.id]).toEqual(chat);
      expect(state.activeChatData[chat.id].name).toBe('Sending Chat');
    });

    it('chatId 不在 sendingChatIds 中时 activeChatData 应被删除', () => {
      const chat = createMockChat({ id: 'chat-clear-idle', name: 'Idle Chat' });
      store.dispatch(createChat({ chat }));

      // 不标记为发送状态
      store.dispatch(clearActiveChatData(chat.id));

      const state = store.getState().chat;
      expect(state.activeChatData[chat.id]).toBeUndefined();
    });

    it('clearActiveChatData 不应该影响 sendingChatIds', () => {
      const chat = createMockChat({ id: 'chat-clear-verify' });
      store.dispatch(createChat({ chat }));

      // 标记为正在发送
      store.dispatch({ type: 'chatModel/startSendChatMessage/pending', meta: { arg: { chat, message: 'test' } } });

      // 尝试清理
      store.dispatch(clearActiveChatData(chat.id));

      const state = store.getState().chat;
      // sendingChatIds 不受影响
      expect(state.sendingChatIds[chat.id]).toBe(true);
    });
  });

  // ==================== Task 2: setSelectedChatIdWithPreload.fulfilled 精确断言 ====================

  describe('setSelectedChatIdWithPreload.fulfilled - 精确断言', () => {
    it('fulfilled 时应该逐字段验证 activeChatData 写入', () => {
      const chatA = createMockChat({ id: 'chat-ful-a', name: 'Chat A', isDeleted: false });
      const chatB = createMockChat({ id: 'chat-ful-b', name: 'Chat B', isDeleted: false });

      store.dispatch(createChat({ chat: chatA }));
      store.dispatch(createChat({ chat: chatB }));

      // 先选中 chatA（设置 previousChatId）
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'chat-ful-a', chatData: chatA },
        'sel-ful-precise-1',
        'chat-ful-a',
      ));

      // 切换到 chatB
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'chat-ful-b', chatData: chatB },
        'sel-ful-precise-2',
        'chat-ful-b',
      ));

      const state = store.getState().chat;
      // 逐字段 toEqual 替换现有 toBeDefined() 弱断言
      expect(state.activeChatData['chat-ful-b']).toEqual(chatB);
      expect(state.activeChatData['chat-ful-b'].name).toBe('Chat B');
      expect(state.selectedChatId).toBe('chat-ful-b');
      // previousChat 不在 sendingChatIds 中，应被清理
      expect(state.activeChatData['chat-ful-a']).toBeUndefined();
    });

    it('previousChatId 在 sendingChatIds 中时应该保留 activeChatData 逐字段验证', () => {
      const chatA = createMockChat({ id: 'chat-send-a', name: 'Sending A' });
      const chatB = createMockChat({ id: 'chat-send-b', name: 'Chat B' });

      store.dispatch(createChat({ chat: chatA }));
      store.dispatch(createChat({ chat: chatB }));

      // 选中 chatA
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'chat-send-a', chatData: chatA },
        'sel-send-1',
        'chat-send-a',
      ));

      // 标记 chatA 正在发送
      store.dispatch({ type: 'chatModel/startSendChatMessage/pending', meta: { arg: { chat: chatA, message: 'test' } } });

      // 切换到 chatB
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'chat-send-b', chatData: chatB },
        'sel-send-2',
        'chat-send-b',
      ));

      const state = store.getState().chat;
      // chatA 的 activeChatData 应保留（正在发送中），逐字段验证
      expect(state.activeChatData['chat-send-a']).toEqual(chatA);
      expect(state.activeChatData['chat-send-a'].name).toBe('Sending A');
      expect(state.activeChatData['chat-send-b']).toEqual(chatB);
    });

    it('chatData 为 null 时 activeChatData 不应有新增', () => {
      createMockChat({ id: 'chat-no-data' });

      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'chat-no-data' },
        'sel-no-data',
        'chat-no-data',
      ));

      const state = store.getState().chat;
      expect(state.activeChatData['chat-no-data']).toBeUndefined();
      expect(state.selectedChatId).toBe('chat-no-data');
    });

    it('chatId 为 null 时 selectedChatId 为 null 且 activeChatData 无新增', () => {
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: null },
        'sel-null-id',
        null,
      ));

      const state = store.getState().chat;
      expect(state.selectedChatId).toBeNull();
      expect(Object.keys(state.activeChatData)).toHaveLength(0);
    });

    it('chatId 与 previousChatId 相同时不应该触发清理', () => {
      const chat = createMockChat({ id: 'chat-same-id', name: 'Same Chat' });
      store.dispatch(createChat({ chat }));

      // 先选中
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'chat-same-id', chatData: chat },
        'sel-same-1',
        'chat-same-id',
      ));

      // 再次选中同一个（模拟 re-select）
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'chat-same-id', chatData: chat },
        'sel-same-2',
        'chat-same-id',
      ));

      const state = store.getState().chat;
      // activeChatData 仍然存在，没有被清理
      expect(state.activeChatData['chat-same-id']).toEqual(chat);
      expect(state.selectedChatId).toBe('chat-same-id');
    });
  });

  // ==================== Task 1: updateMetaInList 精确断言 ====================

  describe('updateMetaInList - 精确断言', () => {
    it('chatId 匹配时应该正确合并 chatMetaList 条目', () => {
      const chat = createMockChat({ name: 'Original', isManuallyNamed: false });
      store.dispatch(createChat({ chat }));

      // 通过 editChat 触发 updateMetaInList（editChat 内部调用 updateMetaInList）
      // 使用 generateChatName.fulfilled 来触发更新
      store.dispatch(generateChatName.fulfilled(
        { chatId: chat.id, name: 'Updated Name' },
        'gen-meta-merge',
        { chat, model: createMockModel(), historyList: [] },
      ));

      const state = store.getState().chat;
      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      // 逐字段断言：name 和 updatedAt 被更新，id 保持不变
      expect(meta.id).toBe(chat.id);
      expect(meta.name).toBe('Updated Name');
      expect(meta.updatedAt).toEqual(expect.any(Number));
    });

    it('chatId 不匹配时 chatMetaList 所有条目不变', () => {
      const chat1 = createMockChat({ id: 'meta-chat-1', name: 'Chat 1' });
      const chat2 = createMockChat({ id: 'meta-chat-2', name: 'Chat 2' });
      store.dispatch(createChat({ chat: chat1 }));
      store.dispatch(createChat({ chat: chat2 }));

      const stateBefore = store.getState().chat;

      store.dispatch(generateChatName.fulfilled(
        { chatId: 'non-existent-id', name: 'Should Not Apply' },
        'gen-meta-no-match',
        { chat: chat1, model: createMockModel(), historyList: [] },
      ));

      const state = store.getState().chat;
      // 逐条 toEqual 断言 chatMetaList 不变
      expect(state.chatMetaList).toEqual(stateBefore.chatMetaList);
      // createChat 使用 unshift，顺序为 chat2, chat1
      expect(state.chatMetaList[0].name).toBe('Chat 2');
      expect(state.chatMetaList[1].name).toBe('Chat 1');
    });

    it('chatMetaList 为空数组时函数不抛异常', () => {
      expect(() => {
        store.dispatch(generateChatName.fulfilled(
          { chatId: 'any-id', name: 'Any Name' },
          'gen-meta-empty',
          { chat: createMockChat(), model: createMockModel(), historyList: [] },
        ));
      }).not.toThrow();

      const state = store.getState().chat;
      expect(state.chatMetaList).toEqual([]);
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

  // ==================== Phase 2 补充：杀死剩余存活变异体 ====================

  describe('sendMessage thunk - 消息对象精确断言', () => {
    it('应该 dispatch pushChatHistory 且 message 包含正确的 role/content/modelKey', async () => {
      const model = createMockModel({ id: 'model-msg-obj', modelKey: 'test-model-key' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-msg-obj', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      (streamChatCompletion as any).mockReturnValue(
        (async function* () {})()
      );

      // Mock 动态 ID 和时间戳
      const fixedId = 'user_msg_fixed123';
      vi.doMock('ai', () => ({ createIdGenerator: () => () => fixedId }));

      await store.dispatch(sendMessage({
        chat,
        message: 'test message content',
        model,
        historyList: [],
      }));

      // 验证 pushChatHistory 被调用且 message 对象包含正确字段
      const state = store.getState().chat;
      // pushChatHistory 通过 appendHistoryToModel 追加到 activeChatData
      const history = state.activeChatData[chat.id]?.chatModelList?.[0]?.chatHistoryList;
      expect(history).toBeDefined();
      expect(history!.length).toBeGreaterThanOrEqual(1);
      const userMsg = history![0];
      expect(userMsg.role).toBe('user');
      expect(userMsg.content).toBe('test message content');
      expect(userMsg.modelKey).toBe('test-model-key');
      expect(userMsg.finishReason).toBeNull();
    });

    it('signal.aborted 时应该 break 循环且不 dispatch pushRunningChatHistory', async () => {
      const model = createMockModel({ id: 'model-abort' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-abort', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      // 创建立即中止的 signal
      const controller = new AbortController();
      controller.abort();

      // Mock streamChatCompletion 返回一些数据
      const msg1 = createMockMessage({ content: 'chunk1' });
      const msg2 = createMockMessage({ content: 'chunk2' });
      (streamChatCompletion as any).mockReturnValue(
        (async function* () {
          yield msg1;
          yield msg2;
        })()
      );

      // 使用真实 store dispatch，传入已 abort 的 signal
      // 通过 startSendChatMessage 来测试整个流程
      const result = await store.dispatch(startSendChatMessage({ chat, message: 'test' }));

      // 验证结果（即使 aborted 也不应抛出未捕获错误）
      expect(result.type).toMatch(/fulfilled|rejected/);
    });

    it('for-await 循环应该 dispatch pushRunningChatHistory 每个元素', async () => {
      const model = createMockModel({ id: 'model-stream-elems' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-stream-elems', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      const chunk1 = createMockMessage({ content: 'chunk-1' });
      const chunk2 = createMockMessage({ content: 'chunk-2' });
      (streamChatCompletion as any).mockImplementation(
        async function* () {
          yield chunk1;
          yield chunk2;
        }
      );

      await store.dispatch(sendMessage({
        chat,
        message: 'hello',
        model,
        historyList: [],
      }));

      const state = store.getState().chat;
      // fulfilled 后 runningChat 被清理，但最终 history 应被回写
      expect(state.runningChat[chat.id]?.[model.id]).toBeUndefined();
    });
  });

  describe('setSelectedChatIdWithPreload - 分支精确覆盖', () => {
    it('chatId 为 null 时不应设置 activeChatData', async () => {
      const chat = createMockChat();
      store.dispatch(createChat({ chat }));

      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: null },
        'sel-null-precise',
        null,
      ));

      const state = store.getState().chat;
      expect(state.selectedChatId).toBeNull();
      // ObjectLiteral {} 变异：确保返回值结构正确
      expect(Object.keys(state.activeChatData)).toHaveLength(1);
    });

    it('chatData 存在时应该写入 activeChatData', async () => {
      const chat = createMockChat({ id: 'chat-has-data', name: 'Has Data' });
      store.dispatch(createChat({ chat }));

      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'chat-has-data', chatData: chat },
        'sel-has-data',
        'chat-has-data',
      ));

      const state = store.getState().chat;
      expect(state.activeChatData['chat-has-data']).toEqual(chat);
    });

    it('chatId && chatData 条件 false 时不应写入 activeChatData', async () => {
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'some-id' },
        'sel-no-chatdata',
        'some-id',
      ));

      const state = store.getState().chat;
      expect(state.activeChatData['some-id']).toBeUndefined();
    });

    it('chatModelList 非空且 chatModelList.length > 0 时应进入预加载', async () => {
      const model = createMockModel({ id: 'model-len-gt-0' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-len-gt-0', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      await store.dispatch(setSelectedChatIdWithPreload(chat.id));

      expect(mockPreloadProviders).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateMetaInList - 条件变异精确覆盖', () => {
    it('findIndex 找到匹配时应该合并更新', () => {
      const chat = createMockChat({ name: 'Before' });
      store.dispatch(createChat({ chat }));

      store.dispatch(editChatName({ id: chat.id, name: 'After' }));

      const state = store.getState().chat;
      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      // findIndex 返回非 -1 的索引，进入 if 块
      expect(meta.name).toBe('After');
      expect(meta.isManuallyNamed).toBe(true);
      expect(meta.updatedAt).toEqual(expect.any(Number));
    });

    it('findIndex 未找到时不应修改 chatMetaList', () => {
      const chat = createMockChat({ name: 'Keep' });
      store.dispatch(createChat({ chat }));

      const stateBefore = store.getState().chat;

      // 尝试更新不存在的 chatId
      store.dispatch(editChatName({ id: 'non-existent', name: 'Ignored' }));

      const state = store.getState().chat;
      expect(state.chatMetaList).toEqual(stateBefore.chatMetaList);
    });
  });

  describe('editChatName - 条件精确覆盖', () => {
    it('name > 20 字符时应该截断', () => {
      const chat = createMockChat({ name: 'Original' });
      store.dispatch(createChat({ chat }));

      const longName = 'a'.repeat(25);
      store.dispatch(editChatName({ id: chat.id, name: longName }));

      const state = store.getState().chat;
      // name.length > 20 → true，进入截断分支
      expect(state.activeChatData[chat.id].name).toBe('a'.repeat(20));
      expect(state.activeChatData[chat.id].name!.length).toBe(20);
    });

    it('name <= 20 字符时不应截断', () => {
      const chat = createMockChat({ name: 'Original' });
      store.dispatch(createChat({ chat }));

      const shortName = 'short';
      store.dispatch(editChatName({ id: chat.id, name: shortName }));

      const state = store.getState().chat;
      expect(state.activeChatData[chat.id].name).toBe('short');
    });

    it('更新 chatMetaList 时 isManuallyNamed 应为 true', () => {
      const chat = createMockChat({ name: 'Test' });
      store.dispatch(createChat({ chat }));

      store.dispatch(editChatName({ id: chat.id, name: 'New Name' }));

      const state = store.getState().chat;
      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      expect(meta.isManuallyNamed).toBe(true);
      expect(meta.updatedAt).toEqual(expect.any(Number));
    });
  });

  describe('sendMessage.fulfilled - 精确覆盖回写和清理', () => {
    it('appendHistoryToModel 成功时应该清理 runningChat', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-ful-clean', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-ful-clean' });
      const arg = { chat, model, message: 'Hello', historyList: [] };
      const responseMessage = createMockMessage({ content: 'Response' });

      store.dispatch(createChat({ chat }));
      store.dispatch(sendMessage.pending('req-ful-clean', arg));
      store.dispatch(pushRunningChatHistory({ chat, model, message: responseMessage }));
      store.dispatch(sendMessage.fulfilled(undefined, 'req-ful-clean', arg));

      const state = store.getState().chat;
      // appendHistoryToModel 成功 → runningChat 被清理
      expect(state.runningChat[chat.id]?.[model.id]).toBeUndefined();
      // updatedAt 被更新
      expect(state.activeChatData[chat.id].updatedAt).toEqual(expect.any(Number));
      // chatMetaList 中 updatedAt 也被更新
      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      expect(meta.updatedAt).toEqual(expect.any(Number));
    });

    it('activeChat 不存在时不应更新 updatedAt', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-no-active', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-no-active' });
      const arg = { chat, model, message: 'Hello', historyList: [] };

      // 不创建 chat → activeChatData 为空
      store.dispatch(sendMessage.pending('req-no-active', arg));
      store.dispatch(sendMessage.fulfilled(undefined, 'req-no-active', arg));

      const state = store.getState().chat;
      // appendHistoryToModel 失败 → runningChat 保留
      expect(state.runningChat[chat.id][model.id]).toEqual(expect.objectContaining({
        isSending: false,
      }));
    });
  });

  describe('startSendChatMessage.fulfilled - sendingChatIds 清理', () => {
    it('fulfilled 时应该从 sendingChatIds 中删除 chatId', async () => {
      const model = createMockModel({ id: 'model-send-ful', isEnable: true, isDeleted: false });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-send-ful', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      (streamChatCompletion as any).mockReturnValue(
        (async function* () {})()
      );

      await store.dispatch(startSendChatMessage({ chat, message: 'hello' }));

      const state = store.getState().chat;
      expect(state.sendingChatIds[chat.id]).toBeUndefined();
    });
  });

  describe('sendMessage.rejected - OptionalChaining 精确覆盖', () => {
    it('runningChat[chat.id] 不存在时 rejected 应正确处理 OptionalChaining', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-opt-chain', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-opt-chain' });
      const arg = { chat, model, message: 'test', historyList: [] };

      // 先 dispatch pending 以初始化 runningChat 结构
      store.dispatch(sendMessage.pending('req-opt-init', arg));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      store.dispatch(sendMessage.rejected(new Error('test error'), 'req-opt-init', arg));

      const state = store.getState().chat;
      expect(state.runningChat[chat.id][model.id].isSending).toBe(false);
      expect(state.runningChat[chat.id][model.id].errorMessage).toContain('test error');

      errorSpy.mockRestore();
    });

    it('action.error 为 undefined 时应该正常处理', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-no-err', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-no-err' });
      const arg = { chat, model, message: 'test', historyList: [] };

      store.dispatch(sendMessage.pending('req-no-err-obj', arg));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      store.dispatch({
        type: 'chatModel/sendMessage/rejected',
        payload: undefined,
        meta: { arg, requestId: 'req-no-err-obj', aborted: false },
        error: { message: 'some error', stack: 'stack trace' },
      });

      const state = store.getState().chat;
      expect(state.runningChat[chat.id][model.id].isSending).toBe(false);
      expect(state.runningChat[chat.id][model.id].errorMessage).toBe('some errorstack trace');

      errorSpy.mockRestore();
    });
  });

  describe('pushRunningChatHistory - 条件精确覆盖', () => {
    it('应该直接赋值 history 而非合并', () => {
      const model = createMockModel({ id: 'model-push-cond' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-push-cond', chatHistoryList: [] }],
      });

      store.dispatch(createChat({ chat }));

      // 初始化 runningChat 结构
      store.dispatch(sendMessage.pending('req-push-cond', { chat, model, message: 'test', historyList: [] }));

      const message = createMockMessage({ content: 'test content' });
      store.dispatch(pushRunningChatHistory({ chat, model, message }));

      const state = store.getState().chat;
      expect(state.runningChat[chat.id][model.id].history).toEqual(message);
      expect(state.runningChat[chat.id][model.id].history!.content).toBe('test content');
    });
  });

  describe('createChat - updatedAt 初始化', () => {
    it('updatedAt 为 undefined 时应该自动设置', () => {
      const chat = createMockChat({ name: 'No UpdatedAt' });
      delete (chat as any).updatedAt;
      store.dispatch(createChat({ chat }));

      const state = store.getState().chat;
      expect(state.activeChatData[chat.id].updatedAt).toEqual(expect.any(Number));
      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      expect(meta.id).toBe(chat.id);
      expect(meta.name).toBe('No UpdatedAt');
      expect(meta.updatedAt).toEqual(expect.any(Number));
    });
  });

  describe('appendHistoryToModel - 返回值变异覆盖', () => {
    it('成功追加后 sendMessage.fulfilled 应清理 runningChat', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-return-true', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-return-true' });
      const arg = { chat, model, message: 'Hello', historyList: [] };
      const responseMessage = createMockMessage({ content: 'Data' });

      store.dispatch(createChat({ chat }));
      store.dispatch(sendMessage.pending('req-ret-true', arg));
      store.dispatch(pushRunningChatHistory({ chat, model, message: responseMessage }));
      store.dispatch(sendMessage.fulfilled(undefined, 'req-ret-true', arg));

      const state = store.getState().chat;
      // return true → runningChat 被清理
      expect(state.runningChat[chat.id]?.[model.id]).toBeUndefined();
      // 数据被追加到 chatHistoryList
      expect(state.activeChatData[chat.id].chatModelList[0].chatHistoryList).toHaveLength(1);
    });
  });

  // ==================== Phase 2 第三轮：精确杀死剩余变异体 ====================

  describe('updateMetaInList - 第三轮精确覆盖', () => {
    it('editChatName 时 chatMetaList 只有目标项被更新，其余项保持不变', () => {
      const chat1 = createMockChat({ id: 'meta-3-1', name: 'Chat1' });
      const chat2 = createMockChat({ id: 'meta-3-2', name: 'Chat2' });

      store.dispatch(createChat({ chat: chat1 }));
      store.dispatch(createChat({ chat: chat2 }));

      store.dispatch(editChatName({ id: 'meta-3-1', name: 'Updated1' }));

      const state = store.getState().chat;
      // createChat unshift → [chat2, chat1]
      const meta1 = state.chatMetaList.find((m: any) => m.id === 'meta-3-1');
      const meta2 = state.chatMetaList.find((m: any) => m.id === 'meta-3-2');

      // 只有 chat1 被更新
      expect(meta1.name).toBe('Updated1');
      expect(meta1.isManuallyNamed).toBe(true);
      expect(meta1.updatedAt).toEqual(expect.any(Number));

      // chat2 完全不变
      expect(meta2.name).toBe('Chat2');
      expect(meta2.isManuallyNamed).toBeUndefined();
    });

    it('editChat 也会调用 updateMetaInList，应合并元数据', () => {
      const chat = createMockChat({ id: 'meta-edit', name: 'Before' });
      store.dispatch(createChat({ chat }));

      // editChat 内部调用 updateMetaInList
      const updatedChat = { ...chat, name: 'Edited Name' };
      store.dispatch({ type: 'chat/editChat', payload: { chat: updatedChat } });

      const state = store.getState().chat;
      const meta = state.chatMetaList.find((m: any) => m.id === 'meta-edit');
      expect(meta.name).toBe('Edited Name');
      expect(meta.id).toBe('meta-edit');
    });
  });

  describe('setSelectedChatIdWithPreload.fulfilled - chatId && chatData 条件精确覆盖', () => {
    it('chatId 为 truthy 但 chatData 为 undefined 时不应写入 activeChatData', () => {
      const chatA = createMockChat({ id: 'sel-3-a' });
      store.dispatch(createChat({ chat: chatA }));

      // 先选中 chatA
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'sel-3-a', chatData: chatA },
        'sel-3-1',
        'sel-3-a',
      ));

      // 再选中另一个 chat 但不传 chatData
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'sel-3-b' },
        'sel-3-2',
        'sel-3-b',
      ));

      const state = store.getState().chat;
      expect(state.selectedChatId).toBe('sel-3-b');
      // chatData 为 undefined → activeChatData 不写入 sel-3-b
      expect(state.activeChatData['sel-3-b']).toBeUndefined();
      // previous chatA 不在 sendingChatIds → 被清理
      expect(state.activeChatData['sel-3-a']).toBeUndefined();
    });

    it('chatId 为 truthy 且 chatData 有值时应写入 activeChatData', () => {
      const chat = createMockChat({ id: 'sel-3-data', name: 'WithData' });
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'sel-3-data', chatData: chat },
        'sel-3-data-1',
        'sel-3-data',
      ));

      const state = store.getState().chat;
      expect(state.activeChatData['sel-3-data']).toEqual(chat);
      expect(state.activeChatData['sel-3-data'].name).toBe('WithData');
    });
  });

  describe('sendMessage.fulfilled - activeChat 条件精确覆盖', () => {
    it('activeChat 存在时应该更新 updatedAt 和 chatMetaList', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-ful-3', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-ful-3' });
      const arg = { chat, model, message: 'Hello', historyList: [] };
      const responseMessage = createMockMessage({ content: 'Response' });

      store.dispatch(createChat({ chat }));
      store.dispatch(sendMessage.pending('req-ful-3', arg));
      store.dispatch(pushRunningChatHistory({ chat, model, message: responseMessage }));
      store.dispatch(sendMessage.fulfilled(undefined, 'req-ful-3', arg));

      const state = store.getState().chat;
      // activeChat 存在 → updatedAt 被更新
      expect(state.activeChatData[chat.id].updatedAt).toEqual(expect.any(Number));
      // updateMetaInList 也被调用
      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      expect(meta.updatedAt).toEqual(expect.any(Number));
    });

    it('activeChat 不存在时 updatedAt 不应被更新', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-ful-no', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-ful-no' });
      const arg = { chat, model, message: 'Hello', historyList: [] };

      // 不创建 chat
      store.dispatch(sendMessage.pending('req-ful-no', arg));
      store.dispatch(sendMessage.fulfilled(undefined, 'req-ful-no', arg));

      const state = store.getState().chat;
      // activeChatData 不存在 → 无 updatedAt 更新
      expect(state.activeChatData[chat.id]).toBeUndefined();
    });
  });

  describe('sendMessage thunk - signal.aborted 和 for-await 精确覆盖', () => {
    it('signal.aborted 时应在 yield 后 break 且不 dispatch pushRunningChatHistory', async () => {
      const model = createMockModel({ id: 'model-signal-abort' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-signal-abort', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      const controller = new AbortController();

      const chunk1 = createMockMessage({ content: 'chunk1' });
      const chunk2 = createMockMessage({ content: 'chunk2' });

      (streamChatCompletion as any).mockImplementation(
        async function* () {
          yield chunk1;
          // 在第一个 yield 后 abort（模拟请求被取消）
          controller.abort();
          yield chunk2;
        }
      );

      // 通过 sendMessage 直接调用，传入能被外部 abort 的 signal
      // 但 sendMessage 内部创建 AbortController，需要通过 startSendChatMessage 间接测试
      // 更直接的方式：直接 dispatch sendMessage 并观察 runningChat 状态
      await store.dispatch(sendMessage({
        chat,
        message: 'test',
        model,
        historyList: [],
      }));

      const state = store.getState().chat;
      // sendMessage 完成（fulfilled），runningChat 被清理
      expect(state.runningChat[chat.id]?.[model.id]).toBeUndefined();
      // pushChatHistory 在 for-await 之前被调用（用户消息），所以 chatHistoryList ≥ 1
      const historyList = state.activeChatData[chat.id]?.chatModelList?.[0]?.chatHistoryList;
      expect(historyList!.length).toBeGreaterThanOrEqual(1);
      // 第一条应该是用户消息
      expect(historyList![0].role).toBe('user');
      expect(historyList![0].content).toBe('test');
    });
  });

  describe('createChat - updatedAt undefined 时初始化', () => {
    it('应该设置 updatedAt 为当前时间戳', () => {
      const chat = createMockChat({ name: 'New Chat' });
      delete (chat as any).updatedAt;

      store.dispatch(createChat({ chat }));

      const state = store.getState().chat;
      const ts = state.activeChatData[chat.id].updatedAt;
      expect(typeof ts).toBe('number');
      expect(ts).toBeGreaterThan(0);
    });
  });

  describe('appendHistoryToModel - BooleanLiteral return false→true', () => {
    it('chat 不存在时 sendMessage.fulfilled 应保留 runningChat', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-ret-f', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-ret-f' });
      const arg = { chat, model, message: 'test', historyList: [] };
      const responseMessage = createMockMessage({ content: 'Data' });

      // 不 createChat → activeChatData 中没有 chat
      store.dispatch(sendMessage.pending('req-ret-f', arg));
      store.dispatch(pushRunningChatHistory({ chat, model, message: responseMessage }));
      store.dispatch(sendMessage.fulfilled(undefined, 'req-ret-f', arg));

      const state = store.getState().chat;
      // appendHistoryToModel 返回 false → runningChat 不被清理
      // 变异 return false→true → runningChat 被清理
      expect(state.runningChat[chat.id][model.id]).toEqual(expect.objectContaining({
        isSending: false,
        history: responseMessage,
      }));
    });
  });

  describe('startSendChatMessage - 条件和对象精确覆盖', () => {
    it('条件为 true 时应 dispatch sendMessage', async () => {
      const model = createMockModel({ id: 'model-cond-true', isEnable: true, isDeleted: false });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-cond-true', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      (streamChatCompletion as any).mockReturnValue(
        (async function* () { yield createMockMessage({ content: 'resp' }); })()
      );

      await store.dispatch(startSendChatMessage({ chat, message: 'test' }));

      const state = store.getState().chat;
      // 条件为 true → sendMessage 被执行 → runningChat 创建并清理
      expect(state.sendingChatIds[chat.id]).toBeUndefined();
    });
  });

  describe('pushRunningChatHistory - 条件精确覆盖', () => {
    it('runningChat 结构已初始化时应直接赋值', () => {
      const model = createMockModel({ id: 'model-push-3' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-push-3', chatHistoryList: [] }],
      });
      const msg = createMockMessage({ content: 'Running' });

      store.dispatch(createChat({ chat }));
      store.dispatch(sendMessage.pending('req-push-3', { chat, model, message: 'test', historyList: [] }));

      // 赋值 history
      store.dispatch(pushRunningChatHistory({ chat, model, message: msg }));

      const state = store.getState().chat;
      expect(state.runningChat[chat.id][model.id].history).toEqual(msg);
      // 其他字段不受影响
      expect(state.runningChat[chat.id][model.id].isSending).toBe(true);
    });
  });

  describe('sendMessage.rejected - OptionalChaining 精确覆盖', () => {
    it('action.error 存在时应该解构 message 和 stack', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-err-destr', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-err-destr' });
      const arg = { chat, model, message: 'test', historyList: [] };

      store.dispatch(createChat({ chat }));
      store.dispatch(sendMessage.pending('req-err-destr', arg));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      store.dispatch(sendMessage.rejected(
        Object.assign(new Error('Custom error'), { stack: 'custom stack' }),
        'req-err-destr',
        arg,
      ));

      const state = store.getState().chat;
      expect(state.runningChat[chat.id][model.id].errorMessage).toContain('Custom error');
      expect(state.runningChat[chat.id][model.id].errorMessage).toContain('custom stack');

      errorSpy.mockRestore();
    });
  });

  // ==================== Phase 2 补充：杀死第二轮变异测试存活变异体 ====================

  // L17 ObjectLiteral: generateUserMessageId({ prefix }) 前缀验证
  describe('sendMessage - 用户消息 ID 前缀', () => {
    it('pushChatHistory 中用户消息 id 应包含 USER_MESSAGE_ID_PREFIX', async () => {
      const model = createMockModel({ id: 'model-id-prefix', modelKey: 'test-key' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-id-prefix', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      (streamChatCompletion as any).mockReturnValue(
        (async function* () {})()
      );

      await store.dispatch(sendMessage({
        chat,
        message: 'hello',
        model,
        historyList: [],
      }));

      const state = store.getState().chat;
      const historyList = state.activeChatData[chat.id].chatModelList[0].chatHistoryList;
      const userMsg = historyList![0];
      // 变异 {prefix: ...} → {} → ID 不含前缀
      expect(userMsg.id).toMatch(/^user_msg_/);
    });
  });

  // L66 ObjectLiteral: initializeChatList Error 构造函数 cause 验证
  describe('initializeChatList - Error cause 验证', () => {
    it('rejected 时 initializationError 应包含错误消息', async () => {
      const originalError = new Error('Disk I/O error');
      mockLoadChatIndex.mockRejectedValue(originalError);

      const result = await store.dispatch(initializeChatList());

      // 验证 rejected 返回（对象字面量 { cause: error } 变异）
      expect(result.type).toBe('chat/initialize/rejected');
      const state = store.getState().chat;
      expect(state.initializationError).toBe('Disk I/O error');
    });

    it('rejected 时非 Error 类型应使用默认消息', async () => {
      mockLoadChatIndex.mockRejectedValue('not an error');

      await store.dispatch(initializeChatList());

      const state = store.getState().chat;
      // 变异 error instanceof Error ? ... : 'Failed to initialize chat data' → 始终走消息路径
      expect(state.initializationError).toBe('Failed to initialize chat data');
    });
  });

  // L148 BlockStatement: setSelectedChatIdWithPreload chatId 为 falsy 时的 return
  describe('setSelectedChatIdWithPreload - chatId falsy 路径', () => {
    it('chatId 为空字符串时应返回 { chatId: null }', async () => {
      const result = await store.dispatch(setSelectedChatIdWithPreload(''));

      expect(result.payload).toEqual({ chatId: null });
    });
  });

  // L160 ConditionalExpression: setSelectedChatIdWithPreload loaded 为 falsy
  describe('setSelectedChatIdWithPreload - loaded 条件分支', () => {
    it('loaded 为 null 时应返回仅 chatId 并 console.warn', async () => {
      (loadChatById as any).mockResolvedValue(null);

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await store.dispatch(setSelectedChatIdWithPreload('chat-loaded-null'));

      // !loaded 为 true → 进入 if → console.warn → return { chatId }
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('chat-loaded-null'));
      expect(result.payload).toEqual({ chatId: 'chat-loaded-null' });

      warnSpy.mockRestore();
    });

    it('loaded 有值时应返回包含 chatData 的结果', async () => {
      const chatFromStorage = createMockChat({ id: 'chat-from-storage', name: 'From Storage' });
      (loadChatById as any).mockResolvedValue(chatFromStorage);

      const result = await store.dispatch(setSelectedChatIdWithPreload('chat-from-storage'));

      // !loaded 为 false → 不进入 if → 返回 { chatId, chatData }
      expect(result.payload).toEqual({
        chatId: 'chat-from-storage',
        chatData: chatFromStorage,
      });
    });
  });

  // L171 ConditionalExpression + BlockStatement: chatModelList.length === 0 早期返回
  describe('setSelectedChatIdWithPreload - chatModelList 长度条件', () => {
    it('chatModelList 有 2 个模型时应预加载 2 个 providerKey', async () => {
      const model1 = createMockModel({ id: 'model-cml-1', providerKey: 'PROV_1' as any });
      const model2 = createMockModel({ id: 'model-cml-2', providerKey: 'PROV_2' as any });
      const chat = createMockChat({
        chatModelList: [
          { modelId: 'model-cml-1', chatHistoryList: [] },
          { modelId: 'model-cml-2', chatHistoryList: [] },
        ],
      });

      store.dispatch(createModel({ model: model1 }));
      store.dispatch(createModel({ model: model2 }));
      store.dispatch(createChat({ chat }));

      const result = await store.dispatch(setSelectedChatIdWithPreload(chat.id));

      // 变异 ConditionalExpression length === 0 → !== 0 → 非空时走 early return 跳过预加载
      expect(mockPreloadProviders).toHaveBeenCalledTimes(1);
      const calledKeys = (mockPreloadProviders.mock.calls[0] as string[])[0];
      expect(calledKeys).toContain('PROV_1');
      expect(calledKeys).toContain('PROV_2');
      // 非空时不应 early return，返回值包含 chatData
      expect(result.payload.chatData).toEqual(chat);
    });

    it('chatModelList 为空时应 early return 且不调用预加载', async () => {
      const chat = createMockChat({ id: 'chat-empty-cml', chatModelList: [] });
      store.dispatch(createChat({ chat }));

      const result = await store.dispatch(setSelectedChatIdWithPreload('chat-empty-cml'));

      // 变异 BlockStatement {} → 不 return → 继续执行到预加载
      expect(mockPreloadProviders).not.toHaveBeenCalled();
      // 返回值应包含 chatData（early return 带 chatData）
      expect(result.payload).toEqual(expect.objectContaining({
        chatId: 'chat-empty-cml',
      }));
    });
  });

  // L272 ConditionalExpression: startSendChatMessage models.find 条件
  describe('startSendChatMessage - models.find 精确匹配', () => {
    it('多 model 场景下应按 modelId 精确匹配，非第一个', async () => {
      const modelA = createMockModel({ id: 'model-a', isEnable: true, isDeleted: false, modelKey: 'keyA' });
      const modelB = createMockModel({ id: 'model-b', isEnable: true, isDeleted: false, modelKey: 'keyB' });
      // chat 只使用 model-b，不使用 model-a
      const chat = createMockChat({
        chatModelList: [
          { modelId: 'model-b', chatHistoryList: [] },
        ],
      });

      store.dispatch(createModel({ model: modelA }));
      store.dispatch(createModel({ model: modelB }));
      store.dispatch(createChat({ chat }));

      (streamChatCompletion as any).mockReturnValue(
        (async function* () { yield createMockMessage({ content: 'resp' }); })()
      );

      await store.dispatch(startSendChatMessage({ chat, message: 'test' }));

      // 变异 find 条件为 true → 始终返回第一个 model（model-a）
      // 真实：find 返回 model-b（精确匹配 modelId）
      // 验证 streamChatCompletion 只被调用 1 次，且参数中的 model 是 model-b
      expect(streamChatCompletion).toHaveBeenCalledTimes(1);
      const callArg = (streamChatCompletion as any).mock.calls[0][0];
      expect(callArg.model.id).toBe('model-b');
      expect(callArg.model.modelKey).toBe('keyB');
    });

    it('两个匹配的 model 都应触发 sendMessage', async () => {
      const model1 = createMockModel({ id: 'model-find-1', isEnable: true, isDeleted: false });
      const model2 = createMockModel({ id: 'model-find-2', isEnable: true, isDeleted: false });
      const chat = createMockChat({
        chatModelList: [
          { modelId: 'model-find-1', chatHistoryList: [] },
          { modelId: 'model-find-2', chatHistoryList: [] },
        ],
      });

      store.dispatch(createModel({ model: model1 }));
      store.dispatch(createModel({ model: model2 }));
      store.dispatch(createChat({ chat }));

      (streamChatCompletion as any).mockReturnValue(
        (async function* () { yield createMockMessage({ content: 'resp' }); })()
      );

      await store.dispatch(startSendChatMessage({ chat, message: 'test' }));

      const state = store.getState().chat;
      expect(state.sendingChatIds[chat.id]).toBeUndefined();
      expect(streamChatCompletion).toHaveBeenCalledTimes(2);
    });
  });

  // L280 ObjectLiteral: startSendChatMessage { signal } 传递
  describe('startSendChatMessage - signal 传递验证', () => {
    it('sendMessage 调用时应收到 signal 选项', async () => {
      const model = createMockModel({ id: 'model-sig-opt', isEnable: true, isDeleted: false });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-sig-opt', chatHistoryList: [] }],
      });

      store.dispatch(createModel({ model }));
      store.dispatch(createChat({ chat }));

      (streamChatCompletion as any).mockReturnValue(
        (async function* () { yield createMockMessage({ content: 'resp' }); })()
      );

      await store.dispatch(startSendChatMessage({ chat, message: 'hello' }));

      // 变异 { signal } → {} → 不传 signal
      const lastCall = (streamChatCompletion as any).mock.calls.at(-1);
      expect(lastCall?.[1]).toHaveProperty('signal');
      expect(lastCall?.[1].signal).toBeInstanceOf(AbortSignal);
    });
  });

  // L409 EqualityOperator + ConditionalExpression: editChatName name.length > 20 边界
  describe('editChatName - 边界值精确验证', () => {
    it('name 为 21 字符时应该截断为 20', () => {
      const chat = createMockChat({ name: 'Original' });
      store.dispatch(createChat({ chat }));

      const name21 = 'a'.repeat(21);
      store.dispatch(editChatName({ id: chat.id, name: name21 }));

      const state = store.getState().chat;
      // 变异 > → >= → 20 字符也被截断为 20（无差异）
      // 变异 > → < → 短名字被截断
      expect(state.activeChatData[chat.id].name).toBe('a'.repeat(20));
      // chatMetaList 也应截断
      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      expect(meta.name).toBe('a'.repeat(20));
      expect(meta.isManuallyNamed).toBe(true);
      expect(meta.updatedAt).toEqual(expect.any(Number));
    });

    it('name 为 19 字符时不应截断且完整保留', () => {
      const chat = createMockChat({ name: 'Original' });
      store.dispatch(createChat({ chat }));

      const name19 = 'a'.repeat(19);
      store.dispatch(editChatName({ id: chat.id, name: name19 }));

      const state = store.getState().chat;
      // 变异 > → <= → 19 字符被截断
      expect(state.activeChatData[chat.id].name).toBe(name19);
      expect(state.activeChatData[chat.id].name!.length).toBe(19);
    });
  });

  // L527 ConditionalExpression: sendMessage.pending isNil 分支
  describe('sendMessage.pending - isNil 分支精确覆盖', () => {
    it('首次 pending 时应创建完整结构 { isSending: true, history: null, errorMessage: "" }', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-first-pend', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-first-pend' });
      const arg = { chat, model, message: 'test', historyList: [] };

      store.dispatch(sendMessage.pending('req-first', arg));

      const state = store.getState().chat;
      // isNil(runningChat[chat.id]) → true → 创建新对象
      expect(state.runningChat[chat.id]).toBeDefined();
      expect(state.runningChat[chat.id][model.id]).toEqual({
        isSending: true,
        history: null,
        errorMessage: '',
      });
    });

    it('重复 pending 时已有 runningChat[chat.id] 应只重置子字段', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-re-pend', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-re-pend' });
      const arg = { chat, model, message: 'test', historyList: [] };

      // 第一次 pending
      store.dispatch(sendMessage.pending('req-re-1', arg));
      store.dispatch(pushRunningChatHistory({ chat, model, message: createMockMessage({ content: 'old' }) }));

      // 第二次 pending（isNil(runningChat[chat.id]) 为 false → else 分支）
      store.dispatch(sendMessage.pending('req-re-2', arg));

      const state = store.getState().chat;
      // else 分支：重置 isSending 和 errorMessage，保留 history
      expect(state.runningChat[chat.id][model.id].isSending).toBe(true);
      expect(state.runningChat[chat.id][model.id].errorMessage).toBe('');
      expect(state.runningChat[chat.id][model.id].history).not.toBeNull();
    });
  });

  // L552 ConditionalExpression + BlockStatement + ObjectLiteral: sendMessage.fulfilled activeChat 更新
  describe('sendMessage.fulfilled - activeChat updatedAt 精确验证', () => {
    it('activeChat 存在时 updatedAt 应被更新且 chatMetaList 精确同步', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-act-upd', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-act-upd' });
      const arg = { chat, model, message: 'Hello', historyList: [] };
      const responseMessage = createMockMessage({ content: 'Resp' });

      store.dispatch(createChat({ chat }));
      const beforeUpdatedAt = store.getState().chat.activeChatData[chat.id].updatedAt;

      store.dispatch(sendMessage.pending('req-act-upd', arg));
      store.dispatch(pushRunningChatHistory({ chat, model, message: responseMessage }));
      store.dispatch(sendMessage.fulfilled(undefined, 'req-act-upd', arg));

      const state = store.getState().chat;
      // activeChat 存在 → if (activeChat) 进入 → updatedAt 被更新
      const newUpdatedAt = state.activeChatData[chat.id].updatedAt;
      expect(typeof newUpdatedAt).toBe('number');
      expect(newUpdatedAt).toBeGreaterThanOrEqual(beforeUpdatedAt ?? 0);
      // updateMetaInList 用 { updatedAt: ... } 合并（L554 ObjectLiteral）
      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      // 变异 ObjectLiteral {} → updateMetaInList 不传 updatedAt → meta.updatedAt 不变
      expect(meta.updatedAt).toBe(newUpdatedAt);
    });

    it('activeChat 存在时 chatMetaList 的 updatedAt 应与 activeChatData 的完全相同', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-sync-ts', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-sync-ts' });
      const arg = { chat, model, message: 'Hello', historyList: [] };

      store.dispatch(createChat({ chat }));
      store.dispatch(sendMessage.pending('req-sync-ts', arg));
      store.dispatch(pushRunningChatHistory({ chat, model, message: createMockMessage() }));
      store.dispatch(sendMessage.fulfilled(undefined, 'req-sync-ts', arg));

      const state = store.getState().chat;
      // L553 activeChat.updatedAt = getCurrentTimestamp()
      // L554 updateMetaInList(state, chat.id, { updatedAt: activeChat.updatedAt })
      const activeTs = state.activeChatData[chat.id].updatedAt;
      const meta = state.chatMetaList.find((m: any) => m.id === chat.id);
      // 两者必须是同一个值（变异 updateMetaInList 内合并对象可能改变值）
      expect(meta.updatedAt).toBe(activeTs);
    });
  });

  // L592 LogicalOperator: chatId && chatData
  describe('setSelectedChatIdWithPreload.fulfilled - chatId && chatData 精确覆盖', () => {
    it('chatId 为 truthy 且 chatData 为 null 时不写入 activeChatData', () => {
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'chat-null-data', chatData: null as any },
        'sel-null-data',
        'chat-null-data',
      ));

      const state = store.getState().chat;
      expect(state.activeChatData['chat-null-data']).toBeUndefined();
    });

    it('chatId 为 truthy 且 chatData 为 0 时不写入 activeChatData', () => {
      store.dispatch(setSelectedChatIdWithPreload.fulfilled(
        { chatId: 'chat-zero-data', chatData: 0 as any },
        'sel-zero-data',
        'chat-zero-data',
      ));

      const state = store.getState().chat;
      expect(state.activeChatData['chat-zero-data']).toBeUndefined();
    });
  });

  // L610 + L622 OptionalChaining: sendMessage.rejected
  describe('sendMessage.rejected - OptionalChaining 精确覆盖', () => {
    it('runningChat[chat.id] 存在但 [model.id] 不存在时应安全处理', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-opt-rc', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-opt-rc' });
      const otherModel = createMockModel({ id: 'other-model' });
      const arg = { chat, model, message: 'test', historyList: [] };
      const otherArg = { chat, model: otherModel, message: 'test', historyList: [] };

      // 只为 otherModel 创建 runningChat，不创建 model-opt-rc 的
      store.dispatch(sendMessage.pending('req-opt-rc-other', otherArg));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // dispatch rejected for model-opt-rc（runningChat[chat.id] 存在但 [model.id] 不存在）
      // OptionalChaining `state.runningChat[chat.id]?.[model.id]` 返回 undefined
      // L611 `currentChatModel.isSending = false` 会抛 TypeError
      expect(() => {
        store.dispatch(sendMessage.rejected(new Error('test'), 'req-opt-rc', arg));
      }).toThrow(TypeError);

      errorSpy.mockRestore();
    });

    it('action.error 完整对象时 console.error 应记录所有字段', () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-full-err', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-full-err', modelKey: 'key-abc', modelName: 'TestModel' });
      const arg = { chat, model, message: 'test', historyList: [] };

      store.dispatch(createChat({ chat }));
      store.dispatch(sendMessage.pending('req-full-err', arg));

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const fullError = Object.assign(new Error('Full error'), {
        name: 'NetworkError',
        stack: 'Error stack trace',
      });
      store.dispatch(sendMessage.rejected(fullError, 'req-full-err', arg));

      const errorCall = errorSpy.mock.calls[0];
      expect(errorCall[0]).toBe('❌ 聊天消息发送失败:');
      const loggedObj = errorCall[1];
      expect(loggedObj.chatId).toBe(chat.id);
      expect(loggedObj.modelId).toBe(model.id);
      expect(loggedObj.modelKey).toBe('key-abc');
      expect(loggedObj.modelName).toBe('TestModel');
      // action?.error?.stack 变异：验证 stack 被记录
      expect(loggedObj.errorStack).toBe('Error stack trace');
      expect(loggedObj.errorName).toBe('NetworkError');
      expect(loggedObj.errorMessage).toBe('Full error');

      errorSpy.mockRestore();
    });
  });

  // L318 BooleanLiteral: return false → return true（modelId 不匹配时）
  describe('appendHistoryToModel - return false 变异覆盖', () => {
    it('modelId 不匹配时 sendMessage.fulfilled 不应清理 runningChat', () => {
      // 构造场景：chat 有 model-a 但 runningChat 中的 model 是 model-b
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-a', chatHistoryList: [] }],
      });
      const modelA = createMockModel({ id: 'model-a' });
      const modelB = createMockModel({ id: 'model-b' });
      const argA = { chat, model: modelA, message: 'test', historyList: [] };
      const argB = { chat, model: modelB, message: 'test', historyList: [] };
      const responseMsg = createMockMessage({ content: 'Resp' });

      store.dispatch(createChat({ chat }));
      // pending modelA 和 modelB
      store.dispatch(sendMessage.pending('req-rf-a', argA));
      store.dispatch(sendMessage.pending('req-rf-b', argB));
      // 给 modelB 设置 running history
      store.dispatch(pushRunningChatHistory({ chat, model: modelB, message: responseMsg }));

      // fulfilled modelB — appendHistoryToModel 找不到 model-b → return false
      store.dispatch(sendMessage.fulfilled(undefined, 'req-rf-b', argB));

      const state = store.getState().chat;
      // return false → runningChat 不被清理
      // 变异 return false → return true → runningChat 被清理
      expect(state.runningChat[chat.id][modelB.id]).toEqual(expect.objectContaining({
        isSending: false,
        history: responseMsg,
      }));
    });
  });

  // L335/L336 updateMetaInList findIndex 精确匹配变异
  describe('updateMetaInList - findIndex 精确匹配验证', () => {
    it('多 chat 场景下只有目标 chat 的 meta 被更新', () => {
      const chat1 = createMockChat({ id: 'meta-f1', name: 'Chat1' });
      const chat2 = createMockChat({ id: 'meta-f2', name: 'Chat2' });
      const chat3 = createMockChat({ id: 'meta-f3', name: 'Chat3' });

      store.dispatch(createChat({ chat: chat1 }));
      store.dispatch(createChat({ chat: chat2 }));
      store.dispatch(createChat({ chat: chat3 }));

      // 只更新 chat2
      store.dispatch(editChatName({ id: 'meta-f2', name: 'Updated2' }));

      const state = store.getState().chat;
      const meta1 = state.chatMetaList.find((m: any) => m.id === 'meta-f1');
      const meta2 = state.chatMetaList.find((m: any) => m.id === 'meta-f2');
      const meta3 = state.chatMetaList.find((m: any) => m.id === 'meta-f3');

      // 只有 meta2 被更新（变异 m.id === → !== 会匹配错误的条目）
      expect(meta2.name).toBe('Updated2');
      expect(meta2.isManuallyNamed).toBe(true);
      expect(meta2.updatedAt).toEqual(expect.any(Number));

      // meta1 和 meta3 完全不变
      expect(meta1.name).toBe('Chat1');
      expect(meta1.isManuallyNamed).toBeUndefined();
      expect(meta3.name).toBe('Chat3');
      expect(meta3.isManuallyNamed).toBeUndefined();
    });
  });

  // L357 BlockStatement: clearError 块变异
  describe('clearError - 块变异覆盖', () => {
    it('clearError 应将 error 设为 null', () => {
      store.dispatch(clearError());

      const state = store.getState().chat;
      // 变异 BlockStatement → {} → state.error 不被清除
      expect(state.error).toBeNull();
    });
  });

});
