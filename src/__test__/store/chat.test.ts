/**
 * chat store 单元测试
 *
 * 测试聊天列表管理、消息发送、多模型并发等核心业务逻辑
 *
 * 转写自 Redux chatSlices 测试（src/__test__/store/slices/chatSlices.test.ts），行为断言保持一致。
 * 转写差异说明：
 * - Redux 的手动 dispatch pending/fulfilled/rejected action 改为通过真实异步 action
 *   （sendMessage / startSendChatMessage 等）配合可控的流式生成器（gate）在执行中途断言状态
 * - action.type 断言改为 rejects/resolves 断言与状态断言
 * - 原通过 dispatch {type: 'chatModel/startSendChatMessage/pending'} 标记"正在发送"的写法，
 *   改为直接对 store.sendingChatIds 赋值（等价于原 pending reducer 的效果）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ChatMeta, Chat, StandardMessage } from '@/types/chat';
import { Model } from '@/types/model';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createMockChat } from '@/__test__/helpers/testing-utils';
import { createMockMessage } from '@/__test__/fixtures/chat';

// Mock 依赖 - 必须在导入 store 之前执行
// 使用 vi.hoisted 确保变量在 vi.mock 之前被定义
const {
  mockLoadChatIndex,
  mockLoadChatById,
  mockSaveChatAndIndex,
  mockDeleteChatFromStorage,
  mockStreamChatCompletion,
  mockGenerateChatTitleService,
  mockPreloadProviders,
} = vi.hoisted(() => ({
  mockLoadChatIndex: vi.fn<() => Promise<ChatMeta[]>>(() => Promise.resolve([])),
  mockLoadChatById: vi.fn<() => Promise<Chat | null | undefined>>(() => Promise.resolve(undefined)),
  mockSaveChatAndIndex: vi.fn(() => Promise.resolve(undefined)),
  mockDeleteChatFromStorage: vi.fn(() => Promise.resolve(undefined)),
  mockStreamChatCompletion: vi.fn(),
  mockGenerateChatTitleService: vi.fn(),
  mockPreloadProviders: vi.fn<(providerKeys: string[]) => Promise<void>>(() => Promise.resolve(undefined)),
}));

// Mock chatStorage 模块（chat store 的持久化副作用依赖）
vi.mock('@/store/storage/chatStorage', () => ({
  loadChatIndex: mockLoadChatIndex,
  saveChatIndex: vi.fn(() => Promise.resolve(undefined)),
  loadChatById: mockLoadChatById,
  saveChatById: vi.fn(() => Promise.resolve(undefined)),
  saveChatAndIndex: mockSaveChatAndIndex,
  deleteChatFromStorage: mockDeleteChatFromStorage,
  migrateOldChatStorage: vi.fn(() => Promise.resolve(undefined)),
  resetChatsStore: vi.fn(),
}));

// Mock modelStorage 模块（models store 的持久化副作用依赖）
vi.mock('@/store/storage/modelStorage', () => ({
  loadModelsFromJson: vi.fn(() => Promise.resolve({ models: [], decryptionFailureCount: 0 })),
  saveModelsToJson: vi.fn(() => Promise.resolve(undefined)),
  resetModelsStore: vi.fn(),
}));

// Mock 聊天服务（流式请求与标题生成）
vi.mock('@/services/chat', () => ({
  streamChatCompletion: mockStreamChatCompletion,
  generateChatTitleService: mockGenerateChatTitleService,
}));

// Mock providerLoader 模块
vi.mock('@/services/chat/providerLoader', () => ({
  getProviderSDKLoader: () => ({
    loadProvider: vi.fn(),
    isProviderLoaded: vi.fn(),
    getProviderState: vi.fn(),
    preloadProviders: mockPreloadProviders,
    resetForTest: vi.fn(),
  }),
}));

// Mock appConfig store 的服务依赖（与 appConfig.test.ts 保持一致）
vi.mock('@/services/global', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/global')>();
  return {
    ...actual,
    getDefaultAppLanguage: vi.fn(),
  };
});

vi.mock('@/services/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/i18n')>();
  return {
    ...actual,
    changeAppLanguage: vi.fn(),
    tSafely: actual.tSafely,
  };
});

// Mock toastQueue（队列在未 markReady 时会永久等待）
vi.mock('@/services/toast', () => ({
  toastQueue: {
    loading: vi.fn().mockResolvedValue('loading-id'),
    dismiss: vi.fn(),
    success: vi.fn().mockResolvedValue('success-id'),
    error: vi.fn().mockResolvedValue('error-id'),
    warning: vi.fn().mockResolvedValue('warning-id'),
    info: vi.fn().mockResolvedValue('info-id'),
  },
}));

import { useChatStore } from '@/store/chat';
import { useModelsStore } from '@/store/models';
import { useAppConfigStore } from '@/store/appConfig';

describe('chat store', () => {
  let store: ReturnType<typeof useChatStore>;

  /**
   * 静默 console.error（全局 afterEach 会自动 restore）
   */
  const silenceConsoleError = () => vi.spyOn(console, 'error').mockImplementation(() => {});

  /**
   * 静默 console.warn（全局 afterEach 会自动 restore）
   */
  const silenceConsoleWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

  /**
   * 在 models store 中注册模型（createModel 会持久化，已 mock）
   */
  async function registerModels(...models: Model[]): Promise<void> {
    const modelsStore = useModelsStore();
    for (const model of models) {
      await modelsStore.createModel({ model });
    }
  }

  /**
   * 创建可控时序的流式响应生成器工厂
   * @param messages 依次 yield 的消息
   * @param gate 所有消息 yield 完后等待的信号（用于在完成前插入状态操作）
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function gatedStream(messages: StandardMessage[], gate?: Promise<void>): any {
    return () =>
      // oxlint-disable-next-line require-yield -- 流式 mock 生成器
      (async function* () {
        for (const msg of messages) {
          yield msg;
        }
        if (gate) {
          await gate;
        }
      })();
  }

  beforeEach(() => {
    // 重建 Pinia 实例，确保每个测试拿到全新 store
    setActivePinia(createPinia());
    store = useChatStore();

    // 重置 mock 返回默认值
    mockLoadChatIndex.mockResolvedValue([]);
    mockLoadChatById.mockResolvedValue(undefined);
    mockSaveChatAndIndex.mockClear();
    mockDeleteChatFromStorage.mockClear();
    mockPreloadProviders.mockReset();
    mockPreloadProviders.mockResolvedValue(undefined);
    mockStreamChatCompletion.mockReset();
    mockGenerateChatTitleService.mockReset();
    localStorage.clear();
  });

  describe('initialState', () => {
    it('应该返回正确的初始状态', () => {
      expect(store.$state).toEqual({
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
    it('应该在加载失败时恢复 loading 并设置 initializationError（聊天列表不被修改）', async () => {
      // 预置一个聊天，验证初始化失败时列表不被修改
      await store.createChat({ chat: createMockChat({ id: 'existing-chat' }) });
      expect(store.chatMetaList).toHaveLength(1);

      // 设置 mock 使加载抛出异常
      mockLoadChatIndex.mockRejectedValue(new Error('Storage read failed'));

      await expect(store.initializeChatList()).rejects.toThrow('Storage read failed');

      expect(store.loading).toBe(false);
      expect(store.initializationError).toBe('Storage read failed');
      // 聊天列表不应被修改
      expect(store.chatMetaList).toHaveLength(1);
    });

    it('应该在 loadChatIndex 抛出异常时正确处理错误', async () => {
      mockLoadChatIndex.mockRejectedValue(new Error('Disk I/O error'));

      await expect(store.initializeChatList()).rejects.toThrow('Disk I/O error');

      expect(store.loading).toBe(false);
      expect(store.initializationError).toContain('Disk I/O error');
      expect(store.chatMetaList).toEqual([]);
    });

    it('应该在 loadChatIndex 抛出非 Error 类型时使用默认错误消息', async () => {
      mockLoadChatIndex.mockRejectedValue('unexpected string');

      await expect(store.initializeChatList()).rejects.toThrow('Failed to initialize chat data');

      expect(store.loading).toBe(false);
      expect(store.initializationError).toBe('Failed to initialize chat data');
      expect(store.chatMetaList).toEqual([]);
    });
  });

  describe('sendMessage 执行过程状态', () => {
    it('应该在发送开始时初始化 runningChat 状态（isSending 为 true，errorMessage 为空）', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-1' });
      await store.createChat({ chat });

      // 使用 gate 控制流式响应，使发送停留在执行中
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      mockStreamChatCompletion.mockImplementation(gatedStream([], gate));

      const promise = store.sendMessage({ chat, message: 'Hello', model, historyList: [] });

      // 发送开始阶段（原 pending）：runningChat 结构已初始化
      expect(store.runningChat[chat.id]?.[model.id]?.isSending).toBe(true);
      expect(store.runningChat[chat.id]?.[model.id]?.errorMessage).toBe('');

      release();
      await promise;
    });

    it('应该在发送完成时清理 runningChat 并回写 activeChatData（原 fulfilled）', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-1' });
      const responseMessage = createMockMessage();

      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([responseMessage]));

      await store.sendMessage({ chat, message: 'Hello', model, historyList: [] });

      // 验证 runningChat 被清理
      expect(store.runningChat[chat.id]?.[model.id]).toBeUndefined();

      // 验证响应消息被回写到 activeChatData（第一条是用户消息，第二条是 AI 回复）
      const historyList = store.activeChatData[chat.id].chatModelList?.[0].chatHistoryList;
      expect(historyList).toHaveLength(2);
      expect(historyList?.[1]).toEqual(responseMessage);
    });

    it('应该在发送失败时设置错误信息（原 rejected）', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-1' });
      await store.createChat({ chat });

      silenceConsoleError();

      mockStreamChatCompletion.mockImplementation(() => {
        throw new Error('Network error');
      });

      await expect(
        store.sendMessage({ chat, message: 'test', model, historyList: [] }),
      ).rejects.toThrow('Network error');

      // 验证错误状态
      const entry = store.runningChat[chat.id]?.[model.id];
      expect(entry?.isSending).toBe(false);
      expect(entry?.errorMessage).toContain('Network error');
    });
  });

  describe('startSendChatMessage rejected 回写', () => {
    it('应该在发送失败时将所有运行中的历史记录回写到 activeChatData', async () => {
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

      // 静默发送失败的预期错误日志
      silenceConsoleError();

      await store.createChat({ chat });
      await registerModels(model1, model2);

      // 选中该聊天，避免发送结束后后台回收 activeChatData
      store.setSelectedChatId(chat.id);

      // 两个模型的流式响应各自持有独立 gate
      let release1!: () => void;
      const gate1 = new Promise<void>((resolve) => (release1 = resolve));
      let release2!: () => void;
      const gate2 = new Promise<void>((resolve) => (release2 = resolve));

      let callIndex = 0;
      mockStreamChatCompletion.mockImplementation(() => {
        callIndex += 1;
        // 调用顺序与 chatModelList 一致：第一次是 model-1，第二次是 model-2
        const isFirst = callIndex === 1;
        const gate = isFirst ? gate1 : gate2;
        const message = isFirst ? history1 : history2;
        return (async function* () {
          yield message;
          await gate;
          if (isFirst) {
            throw new Error('cancelled');
          }
        })();
      });

      const promise = store.startSendChatMessage({ chat, message: 'test' });

      // 等待两个模型的流式数据都到达 runningChat
      await vi.waitFor(() => {
        expect(store.runningChat[chat.id]?.['model-1']?.history).toEqual(history1);
        expect(store.runningChat[chat.id]?.['model-2']?.history).toEqual(history2);
      });

      // 释放 model-1 的流（随后抛出错误），触发 rejected 回写
      release1();
      await expect(promise).rejects.toThrow('cancelled');

      // 验证两个模型的运行中历史都被回写到 activeChatData
      expect(store.activeChatData[chat.id].chatModelList?.[0].chatHistoryList).toContainEqual(history1);
      expect(store.activeChatData[chat.id].chatModelList?.[1].chatHistoryList).toContainEqual(history2);

      // 释放 model-2 的流，避免悬挂的生成器
      release2();
    });
  });

  describe('错误状态清理', () => {
    it('应该清除操作错误信息', () => {
      // clearError 清除的是 state.error，而不是 runningChat 中的 errorMessage
      store.clearError();

      expect(store.error).toBe(null);
      // 其余状态不变
      expect(store.chatMetaList).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.runningChat).toEqual({});
    });

    it('应该清除初始化错误信息', async () => {
      // 先设置一个初始化错误
      mockLoadChatIndex.mockRejectedValue(new Error('Init error'));
      await expect(store.initializeChatList()).rejects.toThrow('Init error');
      expect(store.initializationError).toBe('Init error');

      // 清除错误
      store.clearInitializationError();

      expect(store.initializationError).toBe(null);
    });
  });

  describe('pushChatHistory', () => {
    it('应该向聊天历史记录添加消息', async () => {
      const model = createMockModel({ id: 'model-1' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const message = createMockMessage();

      await store.createChat({ chat });

      store.pushChatHistory({ chat, model, message });

      // 验证 activeChatData 中的历史记录
      const historyList = store.activeChatData[chat.id].chatModelList?.[0].chatHistoryList;
      expect(historyList).toHaveLength(1);
      expect(historyList?.[0]).toEqual(message);
    });

    it('应该在聊天不存在于 activeChatData 时不添加消息', () => {
      silenceConsoleError();

      const model = createMockModel({ id: 'model-1' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const message = createMockMessage();

      // 不创建聊天，直接尝试添加消息（activeChatData 中不存在该聊天）
      store.pushChatHistory({ chat, model, message });

      // chatMetaList 和 activeChatData 都应该为空
      expect(store.chatMetaList).toHaveLength(0);
      expect(Object.keys(store.activeChatData)).toHaveLength(0);
    });
  });

  describe('pushRunningChatHistory', () => {
    it('应该更新运行中的聊天历史记录', async () => {
      const model = createMockModel({ id: 'model-1' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const message = createMockMessage({ content: 'Running message' });

      await store.createChat({ chat });

      // 初始化 runningChat（等价于原 sendMessage.pending）
      store.editRegenerateInit({ chatId: chat.id, modelId: model.id });

      // 更新运行中的历史记录
      store.pushRunningChatHistory({ chat, model, message });

      expect(store.runningChat[chat.id]?.[model.id]?.history).toEqual(message);
    });
  });

  describe('editChatName - 自动命名相关', () => {
    it('应该在编辑聊天名称时设置 isManuallyNamed 为 true', async () => {
      const chat = createMockChat({ name: 'Old Name' });
      await store.createChat({ chat });

      // 编辑聊天名称
      await store.editChatName({ id: chat.id, name: 'New Name' });

      // 验证 chatMetaList 中的更新
      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      expect(meta?.name).toBe('New Name');
      expect(meta?.isManuallyNamed).toBe(true);
      // 验证 activeChatData 中的更新
      expect(store.activeChatData[chat.id].name).toBe('New Name');
      expect(store.activeChatData[chat.id].isManuallyNamed).toBe(true);
    });

    it('应该拒绝编辑为空名称（保持原有名称）', async () => {
      const chat = createMockChat({ name: 'Old Name' });
      await store.createChat({ chat });

      // 尝试编辑为空名称（应该被拒绝）
      await store.editChatName({ id: chat.id, name: '' });

      // 名称应该保持不变
      expect(store.activeChatData[chat.id].name).toBe('Old Name');
      // isManuallyNamed 应该保持 undefined（因为没有更新）
      expect(store.activeChatData[chat.id].isManuallyNamed).toBeUndefined();
    });

    it('应该拒绝编辑为仅空白字符的名称', async () => {
      const chat = createMockChat({ name: 'Old Name' });
      await store.createChat({ chat });

      // 尝试编辑为仅空白字符（应该被拒绝）
      await store.editChatName({ id: chat.id, name: '   ' });

      // 名称应该保持不变
      expect(store.activeChatData[chat.id].name).toBe('Old Name');
      // isManuallyNamed 应该保持 undefined
      expect(store.activeChatData[chat.id].isManuallyNamed).toBeUndefined();
    });
  });

  describe('generateChatName - 自动标题生成', () => {
    it('应该在成功生成标题时更新聊天名称', async () => {
      mockGenerateChatTitleService.mockResolvedValue('Generated Title');

      const chat = createMockChat({ name: undefined });
      await store.createChat({ chat });

      const result = await store.generateChatName({
        chat,
        model: createMockModel(),
        historyList: [],
      });

      // 验证 activeChatData 中的更新
      expect(store.activeChatData[chat.id].name).toBe('Generated Title');
      // isManuallyNamed 保持 undefined，允许手动覆盖
      expect(store.activeChatData[chat.id].isManuallyNamed).toBeUndefined();
      // 验证 chatMetaList 中的更新
      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      expect(meta?.name).toBe('Generated Title');
      // 返回值包含生成的标题
      expect(result).toEqual({ chatId: chat.id, name: 'Generated Title' });
    });

    it('应该在失败时不更新聊天名称', async () => {
      silenceConsoleWarn();
      mockGenerateChatTitleService.mockRejectedValue(new Error('title failed'));

      const chat = createMockChat({ name: undefined });
      await store.createChat({ chat });

      const result = await store.generateChatName({
        chat,
        model: createMockModel(),
        historyList: [],
      });

      // 生成失败返回 null，名称不更新
      expect(result).toBeNull();
      expect(store.activeChatData[chat.id].name).toBeUndefined();
    });

    it('应该在聊天不存在时不抛出错误', async () => {
      mockGenerateChatTitleService.mockResolvedValue('Title');

      const nonExistentChat = createMockChat({ id: 'non-existent-chat' });

      await expect(
        store.generateChatName({
          chat: nonExistentChat,
          model: createMockModel(),
          historyList: [],
        }),
      ).resolves.toEqual({ chatId: 'non-existent-chat', name: 'Title' });
    });
  });

  describe('setSelectedChatIdWithPreload - 预加载机制', () => {
    it('应该在新聊天（无模型）时跳过预加载', async () => {
      const chat = createMockChat({
        chatModelList: [], // 新聊天，没有模型
      });

      await store.createChat({ chat });

      // 切换到新聊天
      await store.setSelectedChatIdWithPreload(chat.id);

      // 验证 selectedChatId 被更新
      expect(store.selectedChatId).toBe(chat.id);

      // 验证 preloadProviders 未被调用（新聊天没有模型）
      expect(mockPreloadProviders).not.toHaveBeenCalled();
    });

    it('应该在聊天不存在时跳过预加载', async () => {
      silenceConsoleWarn();

      const nonExistentChatId = 'non-existent-chat-id';

      // 尝试切换到不存在的聊天
      await store.setSelectedChatIdWithPreload(nonExistentChatId);

      // 验证 preloadProviders 未被调用（聊天不存在）
      expect(mockPreloadProviders).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage 重新发送（re-entry）', () => {
    it('应该在失败后重新发送时重置 isSending 和 errorMessage，history 保留为 null', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-1' });
      await store.createChat({ chat });

      silenceConsoleError();

      // 第一次发送失败，留下错误信息（history 未被写入，保持 null）
      mockStreamChatCompletion.mockImplementation(() => {
        throw new Error('previous error');
      });
      await expect(
        store.sendMessage({ chat, message: 'Hello', model, historyList: [] }),
      ).rejects.toThrow('previous error');

      const entry = () => store.runningChat[chat.id][model.id];
      expect(entry().isSending).toBe(false);
      expect(entry().errorMessage).toContain('previous error');
      expect(entry().history).toBeNull();

      // 第二次发送（re-entry）：重置 isSending 和 errorMessage，history 保留
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      mockStreamChatCompletion.mockImplementation(gatedStream([], gate));

      const second = store.sendMessage({ chat, message: 'Hello', model, historyList: [] });

      expect(entry().isSending).toBe(true);
      expect(entry().errorMessage).toBe('');
      // history 保留（失败不清空 history，初始为 null）
      expect(entry().history).toBeNull();

      release();
      await second;
    });
  });

  describe('sendMessage 回写失败（appendHistoryToModel 失败）', () => {
    it('应该在 activeChatData 不存在时跳过清理 runningChat', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-1' });
      const responseMessage = createMockMessage();

      await store.createChat({ chat });

      // 静默回写失败的预期错误日志
      silenceConsoleError();

      // 流式响应 yield 一条消息后挂起，等待测试中途移除 activeChatData
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      mockStreamChatCompletion.mockImplementation(gatedStream([responseMessage], gate));

      const promise = store.sendMessage({ chat, message: 'Hello', model, historyList: [] });

      // 等待流式数据到达 runningChat
      await vi.waitFor(() => {
        expect(store.runningChat[chat.id]?.[model.id]?.history).toEqual(responseMessage);
      });

      // 从 activeChatData 中移除聊天（模拟 appendHistoryToModel 失败）
      store.clearActiveChatData(chat.id);

      release();
      await promise;

      // runningChat 不应被清理（保留错误现场）
      expect(store.runningChat[chat.id][model.id]).toEqual(
        expect.objectContaining({
          isSending: false,
          history: expect.anything(),
        }),
      );
    });
  });

  describe('generateChatName 边界分支', () => {
    it('应该在生成失败（null）时 state 完全不变', async () => {
      silenceConsoleWarn();
      mockGenerateChatTitleService.mockRejectedValue(new Error('failed'));

      const chat = createMockChat({ name: 'Original Name' });
      await store.createChat({ chat });

      const chatMetaListBefore = JSON.parse(JSON.stringify(store.chatMetaList));

      const result = await store.generateChatName({
        chat,
        model: createMockModel(),
        historyList: [],
      });

      expect(result).toBeNull();
      // chatMetaList 不变
      expect(store.chatMetaList).toEqual(chatMetaListBefore);
      // activeChatData 不变
      expect(store.activeChatData[chat.id].name).toBe('Original Name');
    });

    it('应该在 chatId 不在 chatMetaList 中时跳过更新', async () => {
      mockGenerateChatTitleService.mockResolvedValue('New Title');

      const chat = createMockChat({ name: 'Some Name' });
      await store.createChat({ chat });

      const chatMetaListBefore = JSON.parse(JSON.stringify(store.chatMetaList));

      // 使用不存在的 chatId 调用（chat 对象未注册到 store）
      const unknownChat = createMockChat({ id: 'non-existent-chat' });
      await store.generateChatName({
        chat: unknownChat,
        model: createMockModel(),
        historyList: [],
      });

      // chatMetaList 不变（不存在的 chatId 不会更新任何条目）
      expect(store.chatMetaList).toEqual(chatMetaListBefore);
    });

    it('应该在 activeChat 未加载时更新 chatMetaList 但不更新 activeChatData', async () => {
      mockGenerateChatTitleService.mockResolvedValue('Generated Title');

      const chat = createMockChat({ name: 'Old Name' });
      await store.createChat({ chat });

      // 从 activeChatData 中移除（模拟未加载）
      store.clearActiveChatData(chat.id);

      await store.generateChatName({
        chat,
        model: createMockModel(),
        historyList: [],
      });

      // chatMetaList 应该更新
      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      expect(meta?.name).toBe('Generated Title');
      // activeChatData 不应包含该聊天（更新被跳过）
      expect(store.activeChatData[chat.id]).toBeUndefined();
    });
  });

  describe('setSelectedChatIdWithPreload 前一个聊天清理', () => {
    it('应该在 previousChatId 存在且未发送时清理 activeChatData', async () => {
      const chatA = createMockChat({ id: 'chat-a' });
      const chatB = createMockChat({ id: 'chat-b' });

      await store.createChat({ chat: chatA });
      await store.createChat({ chat: chatB });

      // 选中 chatA
      await store.setSelectedChatIdWithPreload('chat-a');
      expect(store.selectedChatId).toBe('chat-a');
      expect(store.activeChatData['chat-a']).toEqual(chatA);

      // 切换到 chatB（数据已在 activeChatData 缓存中，不触发 loadChatById）
      await store.setSelectedChatIdWithPreload('chat-b');

      // chatA 的 activeChatData 应被清理（不在 sendingChatIds 中）
      expect(store.activeChatData['chat-a']).toBeUndefined();
      // chatB 的 activeChatData 应被设置
      expect(store.activeChatData['chat-b']).toEqual(chatB);
      expect(store.selectedChatId).toBe('chat-b');
    });

    it('应该在 previousChatId 正在发送时保留 activeChatData', async () => {
      const chatA = createMockChat({ id: 'chat-a' });
      const chatB = createMockChat({ id: 'chat-b' });

      await store.createChat({ chat: chatA });
      await store.createChat({ chat: chatB });

      // 选中 chatA
      await store.setSelectedChatIdWithPreload('chat-a');

      // 标记 chatA 正在发送（等价于原 startSendChatMessage.pending）
      store.sendingChatIds['chat-a'] = true;

      // 切换到 chatB
      await store.setSelectedChatIdWithPreload('chat-b');

      // chatA 的 activeChatData 应保留（正在发送中）
      expect(store.activeChatData['chat-a']).toEqual(chatA);
    });

    it('应该在无 previousChatId 时不执行清理', async () => {
      const chatB = createMockChat({ id: 'chat-b' });
      await store.createChat({ chat: chatB });

      // selectedChatId 初始为 null，无前一个聊天
      expect(store.selectedChatId).toBeNull();

      // 切换到 chatB
      await store.setSelectedChatIdWithPreload('chat-b');

      expect(store.selectedChatId).toBe('chat-b');
      expect(store.activeChatData['chat-b']).toEqual(chatB);
    });
  });

  describe('editChatName 超长名称截断', () => {
    it('应该在名称超过 20 个字符时截断为前 20 个字符', async () => {
      const chat = createMockChat({ name: 'Short' });
      await store.createChat({ chat });

      const longName = '这是一段非常非常非常非常长的聊天名称应该被截断';
      await store.editChatName({ id: chat.id, name: longName });

      // 截断为前 20 个字符
      expect(store.activeChatData[chat.id].name).toBe(longName.slice(0, 20));
      expect(store.activeChatData[chat.id].name!.length).toBe(20);

      // chatMetaList 也应截断
      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      expect(meta?.name).toBe(longName.slice(0, 20));
      // 标记为手动命名
      expect(meta?.isManuallyNamed).toBe(true);
    });
  });

  describe('deleteChat 正在发送时跳过', () => {
    it('应该在聊天正在发送时跳过删除', async () => {
      const chat = createMockChat({ name: 'Active Chat' });
      await store.createChat({ chat });

      // 标记为正在发送（等价于原 startSendChatMessage.pending）
      store.sendingChatIds[chat.id] = true;

      // 尝试删除
      await store.deleteChat({ chat });

      // chatMetaList 不变
      expect(store.chatMetaList).toHaveLength(1);
      // activeChatData 不变
      expect(store.activeChatData[chat.id]).toEqual(chat);
    });
  });

  describe('clearActiveChatData 正在发送时跳过', () => {
    it('应该在聊天正在发送时跳过清理', async () => {
      const chat = createMockChat({ name: 'Sending Chat' });
      await store.createChat({ chat });

      // 标记为正在发送
      store.sendingChatIds[chat.id] = true;

      // 尝试清理
      store.clearActiveChatData(chat.id);

      // activeChatData 保留
      expect(store.activeChatData[chat.id]).toEqual(chat);
    });
  });

  describe('createChat 已有 updatedAt', () => {
    it('应该在 updatedAt 已定义时保留原值', async () => {
      const fixedTime = 1700000000;
      const chat = createMockChat({ name: 'Has UpdatedAt', updatedAt: fixedTime });
      await store.createChat({ chat });

      expect(store.activeChatData[chat.id].updatedAt).toBe(fixedTime);
    });
  });

  describe('initializeChatList rejected 默认错误消息', () => {
    it('应该在 rejected 值无有效 message 时使用默认错误消息', async () => {
      // 模拟 rejected 值为不含 message 的普通对象（非 Error 实例）
      mockLoadChatIndex.mockRejectedValue({ message: '' });

      await expect(store.initializeChatList()).rejects.toThrow('Failed to initialize chat data');

      expect(store.initializationError).toBe('Failed to initialize chat data');
    });
  });

  describe('sendMessage rejected 非 Error 对象', () => {
    it('应该在抛出非 Error 值时使用默认空字符串错误信息', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-1' });
      await store.createChat({ chat });

      silenceConsoleError();

      // 抛出非 Error 值（无 message/stack）
      mockStreamChatCompletion.mockImplementation(() => {
        throw 'raw failure';
      });

      await expect(
        store.sendMessage({ chat, message: 'test', model, historyList: [] }),
      ).rejects.toBe('raw failure');

      const entry = store.runningChat[chat.id][model.id];
      expect(entry.isSending).toBe(false);
      expect(entry.errorMessage).toBe('');
    });
  });

  describe('sendMessage 回写时 activeChat 不存在', () => {
    it('应该在 activeChat 不存在时不更新 updatedAt 且跳过清理', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-1' });
      await store.createChat({ chat });

      // 流式响应不产出任何数据后挂起，等待移除 activeChatData
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      mockStreamChatCompletion.mockImplementation(gatedStream([], gate));

      const promise = store.sendMessage({ chat, message: 'Hello', model, historyList: [] });

      // 等待发送进入执行中后移除 activeChatData（模拟已清理）
      await vi.waitFor(() => {
        expect(store.runningChat[chat.id]?.[model.id]?.isSending).toBe(true);
      });
      store.clearActiveChatData(chat.id);

      release();
      await promise;

      // runningChat 保留（appendHistoryToModel 失败），isSending 已复位
      expect(store.runningChat[chat.id][model.id]).toEqual(
        expect.objectContaining({
          isSending: false,
        }),
      );
    });
  });

  describe('appendHistoryToModel 边界路径', () => {
    it('应该在 modelId 不匹配时跳过追加', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });
      const wrongModel = createMockModel({ id: 'non-existent-model' });
      const message = createMockMessage();

      await store.createChat({ chat });
      store.pushChatHistory({ chat, model: wrongModel, message });

      // 不应有任何历史记录被追加
      expect(store.activeChatData[chat.id].chatModelList![0].chatHistoryList).toHaveLength(0);
    });
  });

  describe('releaseCompletedBackgroundChat', () => {
    it('应该在非当前选中时删除 activeChatData', async () => {
      const chatA = createMockChat({ id: 'chat-a' });
      const chatB = createMockChat({ id: 'chat-b' });

      await store.createChat({ chat: chatA });
      await store.createChat({ chat: chatB });
      store.setSelectedChatId('chat-b');

      store.releaseCompletedBackgroundChat('chat-a');

      expect(store.activeChatData['chat-a']).toBeUndefined();
      expect(store.activeChatData['chat-b']).toEqual(chatB);
    });

    it('应该在当前选中时保留 activeChatData', async () => {
      const chatA = createMockChat({ id: 'chat-a' });

      await store.createChat({ chat: chatA });
      store.setSelectedChatId('chat-a');

      store.releaseCompletedBackgroundChat('chat-a');

      expect(store.activeChatData['chat-a']).toEqual(chatA);
    });
  });

  describe('initializeChatList 过滤已删除聊天', () => {
    it('应该过滤掉 isDeleted 为 true 的条目，保留未删除条目', async () => {
      const activeChat: ChatMeta = { id: 'chat-active', name: 'Active', modelIds: [], isDeleted: false };
      const deletedChat: ChatMeta = { id: 'chat-deleted', name: 'Deleted', modelIds: [], isDeleted: true };

      mockLoadChatIndex.mockResolvedValue([activeChat, deletedChat]);

      const result = await store.initializeChatList();

      expect(store.chatMetaList).toHaveLength(1);
      expect(store.chatMetaList[0]).toEqual(activeChat);
      expect(store.chatMetaList[0].id).toBe('chat-active');
      expect(store.loading).toBe(false);
      expect(result).toEqual([activeChat]);
    });

    it('应该在空列表传入时 chatMetaList 为空数组', async () => {
      mockLoadChatIndex.mockResolvedValue([]);

      await store.initializeChatList();

      expect(store.chatMetaList).toEqual([]);
      expect(store.loading).toBe(false);
    });
  });

  describe('setSelectedChatIdWithPreload - 预加载 SDK', () => {
    it('chatModelList 非空且 model 存在时，应该调用 preloadProviders 并传入正确的 providerKey', async () => {
      const model = createMockModel({ id: 'model-preload' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-preload', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      await store.setSelectedChatIdWithPreload(chat.id);

      expect(mockPreloadProviders).toHaveBeenCalledTimes(1);
      expect(mockPreloadProviders).toHaveBeenCalledWith([model.providerKey]);
    });

    it('model 不在 models 列表中时，应该跳过 providerKey 提取', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'missing-model', chatHistoryList: [] }],
      });

      await store.createChat({ chat });

      await store.setSelectedChatIdWithPreload(chat.id);

      expect(mockPreloadProviders).not.toHaveBeenCalled();
    });

    it('providerKeys 为空时，不应该调用 preloadProviders', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'orphan-model', chatHistoryList: [] }],
      });

      await store.createChat({ chat });

      await store.setSelectedChatIdWithPreload(chat.id);

      expect(mockPreloadProviders).not.toHaveBeenCalled();
    });

    it('预加载抛出异常时，选中状态不受影响', async () => {
      silenceConsoleWarn();

      const model = createMockModel({ id: 'model-throw' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-throw', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });
      mockPreloadProviders.mockRejectedValue(new Error('preload failed'));

      await store.setSelectedChatIdWithPreload(chat.id);

      expect(store.selectedChatId).toBe(chat.id);
    });

    it('多个 model 时应只预加载聊天引用的 providerKey', async () => {
      const model1 = createMockModel({ id: 'model-pk-a', providerKey: 'PROVIDER_A' as Model['providerKey'] });
      const model2 = createMockModel({ id: 'model-pk-b', providerKey: 'PROVIDER_B' as Model['providerKey'] });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-pk-b', chatHistoryList: [] }],
      });

      await registerModels(model1, model2);
      await store.createChat({ chat });

      await store.setSelectedChatIdWithPreload(chat.id);

      // 只有聊天引用的 model-pk-b 的 providerKey 被预加载
      expect(mockPreloadProviders).toHaveBeenCalledWith([model2.providerKey]);
    });

    it('chatData.chatModelList 为 undefined 时应跳过预加载', async () => {
      const chatRaw = createMockChat();
      delete (chatRaw as { chatModelList?: unknown }).chatModelList;
      mockLoadChatById.mockResolvedValue(chatRaw);

      await store.setSelectedChatIdWithPreload(chatRaw.id);

      // chatModelList 默认为 []，跳过预加载
      expect(mockPreloadProviders).not.toHaveBeenCalled();
    });

    it('model 未找到时不应触发预加载异常', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'missing-model-warn', chatHistoryList: [] }],
      });
      await store.createChat({ chat });

      const warnSpy = silenceConsoleWarn();

      await store.setSelectedChatIdWithPreload(chat.id);

      // model 未找到时跳过 providerKey 提取，不触发异常
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('预加载失败时应记录 console.warn', async () => {
      const model = createMockModel({ id: 'model-warn-catch' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-warn-catch', chatHistoryList: [] }],
      });
      await registerModels(model);
      await store.createChat({ chat });

      mockPreloadProviders.mockRejectedValue(new Error('preload crashed'));

      const warnSpy = silenceConsoleWarn();

      await store.setSelectedChatIdWithPreload(chat.id);

      // catch 块记录 console.warn
      expect(warnSpy).toHaveBeenCalledWith(
        'Failed to preload provider SDKs:',
        expect.any(Error),
      );
    });
  });

  describe('generateChatName - autoNamingEnabled 路径', () => {
    it('autoNamingEnabled 为 true 且调用成功时，应返回完整结构', async () => {
      mockGenerateChatTitleService.mockResolvedValue('AI Generated Title');

      const chat = createMockChat();
      await store.createChat({ chat });

      const result = await store.generateChatName({
        chat,
        model: createMockModel(),
        historyList: [],
      });

      expect(result).toEqual({
        chatId: chat.id,
        name: 'AI Generated Title',
      });
    });

    it('autoNamingEnabled 为 false 时应返回 null', async () => {
      const appConfigStore = useAppConfigStore();
      appConfigStore.setAutoNamingEnabled(false);

      const chat = createMockChat();
      await store.createChat({ chat });

      const result = await store.generateChatName({
        chat,
        model: createMockModel(),
        historyList: [],
      });

      expect(result).toBeNull();
    });
  });

  describe('startSendChatMessage - 基础路径', () => {
    it('chatModelList 非空且有匹配 model 时，应该执行发送', async () => {
      const model = createMockModel({ id: 'model-send', isEnable: true, isDeleted: false });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-send', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([]));

      await store.startSendChatMessage({ chat, message: 'hello' });

      expect(store.sendingChatIds[chat.id]).toBeUndefined();
    });

    it('chat.chatModelList 为 undefined 时不应发送消息', async () => {
      const chat = createMockChat({ chatModelList: undefined as unknown as undefined });
      await store.createChat({ chat });

      await store.startSendChatMessage({ chat, message: 'hello' });

      // chatModelList 默认为 []，不发送，runningChat 不创建
      expect(store.runningChat[chat.id]).toBeUndefined();
    });
  });

  describe('setChatMetaList', () => {
    it('应该将 chatMetaList 设置为 payload 的内容', () => {
      const metaList: ChatMeta[] = [
        { id: 'chat-1', name: 'Chat 1', modelIds: [] },
        { id: 'chat-2', name: 'Chat 2', modelIds: [] },
      ];

      store.setChatMetaList(metaList);

      expect(store.chatMetaList).toEqual(metaList);
    });

    it('应该是浅拷贝而非引用', () => {
      const metaList: ChatMeta[] = [
        { id: 'chat-1', name: 'Chat 1', modelIds: [] },
      ];

      store.setChatMetaList(metaList);

      expect(store.chatMetaList).not.toBe(metaList);
    });
  });

  describe('setSelectedChatIdWithPreload - 条件分支反向路径', () => {
    it('chatId 为 null 时应清空 selectedChatId 且不写入 activeChatData', async () => {
      await store.setSelectedChatIdWithPreload(null);

      expect(store.selectedChatId).toBeNull();
      expect(Object.keys(store.activeChatData)).toHaveLength(0);
    });

    it('chatData 已缓存时应跳过 loadChatById', async () => {
      const chat = createMockChat({ chatModelList: [] });
      await store.createChat({ chat });

      mockLoadChatById.mockClear();

      await store.setSelectedChatIdWithPreload(chat.id);

      expect(mockLoadChatById).not.toHaveBeenCalled();
    });

    it('loaded 为 null 时应仅设置 selectedChatId 不写入 activeChatData', async () => {
      silenceConsoleWarn();
      mockLoadChatById.mockResolvedValue(undefined);

      await store.setSelectedChatIdWithPreload('unknown-chat-id');

      expect(store.selectedChatId).toBe('unknown-chat-id');
      expect(store.activeChatData['unknown-chat-id']).toBeUndefined();
    });

    it('chatModelList 长度为 1 时应执行预加载', async () => {
      const model = createMockModel({ id: 'model-boundary' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-boundary', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      await store.setSelectedChatIdWithPreload(chat.id);

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

      await registerModels(model);
      await store.createChat({ chat });

      await store.startSendChatMessage({ chat, message: 'hello' });

      expect(store.runningChat[chat.id]).toBeUndefined();
    });

    it('model isEnable 为 false 时应跳过发送', async () => {
      const model = createMockModel({ id: 'model-disabled', isEnable: false, isDeleted: false });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-disabled', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      await store.startSendChatMessage({ chat, message: 'hello' });

      expect(store.runningChat[chat.id]).toBeUndefined();
    });

    it('model 不存在时应跳过发送', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'non-existent-model-id', chatHistoryList: [] }],
      });

      await store.createChat({ chat });

      await store.startSendChatMessage({ chat, message: 'hello' });

      expect(store.runningChat[chat.id]).toBeUndefined();
    });
  });

  describe('appendHistoryToModel - 条件反向路径', () => {
    it('message 为 null 时应跳过追加并保留 runningChat', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-null-msg', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-null-msg' });
      await store.createChat({ chat });

      // 流式响应不产出任何数据（history 保持 null，等价于 appendHistoryToModel(null)）
      mockStreamChatCompletion.mockImplementation(gatedStream([]));

      await store.sendMessage({ chat, message: 'test', model, historyList: [] });

      // history 为 null → append 失败 → runningChat 保留
      expect(store.runningChat[chat.id][model.id]).toEqual(
        expect.objectContaining({
          isSending: false,
        }),
      );
    });

    it('chatModelList 为 falsy 时应返回 false', async () => {
      const model = createMockModel({ id: 'model-no-list' });
      const chat = createMockChat({ chatModelList: undefined as unknown as undefined });
      const message = createMockMessage();

      await store.createChat({ chat });
      store.pushChatHistory({ chat, model, message });

      expect(store.activeChatData[chat.id].chatModelList).toBeUndefined();
    });

    it('chatHistoryList 为非数组时应先初始化再追加', async () => {
      const model = createMockModel({ id: 'model-no-hist' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-no-hist', chatHistoryList: undefined as unknown as StandardMessage[] }],
      });
      const message = createMockMessage();

      await store.createChat({ chat });
      store.pushChatHistory({ chat, model, message });

      // chatHistoryList 被初始化为 [] 然后追加消息
      expect(store.activeChatData[chat.id].chatModelList![0].chatHistoryList).toEqual([message]);
    });

    it('chatModelList 为 falsy 时 sendMessage 完成后不应清理 runningChat', async () => {
      const model = createMockModel({ id: 'model-falsy-cml' });
      const chat = createMockChat({ chatModelList: undefined as unknown as undefined });
      const responseMessage = createMockMessage();

      await store.createChat({ chat });

      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      mockStreamChatCompletion.mockImplementation(gatedStream([responseMessage], gate));

      const promise = store.sendMessage({ chat, message: 'test', model, historyList: [] });

      // 等待流式数据到达 runningChat
      await vi.waitFor(() => {
        expect(store.runningChat[chat.id]?.[model.id]?.history).toEqual(responseMessage);
      });

      release();
      await promise;

      // appendHistoryToModel 返回 false → runningChat 保留
      expect(store.runningChat[chat.id][model.id]).toEqual(
        expect.objectContaining({
          isSending: false,
        }),
      );
    });
  });

  describe('updateMetaInList - metaIdx 为 -1', () => {
    it('chatId 不在 chatMetaList 中时不应更新任何条目', async () => {
      mockGenerateChatTitleService.mockResolvedValue('New Title');

      const chat = createMockChat();
      await store.createChat({ chat });

      const chatMetaListBefore = JSON.parse(JSON.stringify(store.chatMetaList));

      const unknownChat = createMockChat({ id: 'non-existent-meta-id' });
      await store.generateChatName({
        chat: unknownChat,
        model: createMockModel(),
        historyList: [],
      });

      expect(store.chatMetaList).toEqual(chatMetaListBefore);
    });
  });

  describe('editChatName - 边界条件', () => {
    it('name 恰好 20 字符时不应截断', async () => {
      const chat = createMockChat({ name: 'Original' });
      await store.createChat({ chat });

      const name20 = 'a'.repeat(20);
      await store.editChatName({ id: chat.id, name: name20 });

      expect(store.activeChatData[chat.id].name).toBe(name20);
      expect(store.activeChatData[chat.id].name!.length).toBe(20);

      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      expect(meta?.name).toBe(name20);
    });
  });

  describe('deleteChat - 条件反向路径', () => {
    it('不在 sendingChatIds 中时应该正常删除并精确验证内容', async () => {
      const chat1 = createMockChat({ id: 'chat-del-ok-1', name: 'Chat 1' });
      const chat2 = createMockChat({ id: 'chat-del-ok-2', name: 'Chat 2' });

      await store.createChat({ chat: chat1 });
      await store.createChat({ chat: chat2 });

      await store.deleteChat({ chat: chat1 });

      expect(store.chatMetaList.find((m) => m.id === chat1.id)).toBeUndefined();
      expect(store.activeChatData[chat1.id]).toBeUndefined();
      expect(store.chatMetaList.find((m) => m.id === chat2.id)).toEqual(
        expect.objectContaining({ id: chat2.id }),
      );
      expect(store.activeChatData[chat2.id]).toEqual(chat2);
    });

    it('selectedChatId 不匹配时不应该置空 selectedChatId', async () => {
      const chatA = createMockChat({ id: 'chat-del-sel-a' });
      const chatB = createMockChat({ id: 'chat-del-sel-b' });

      await store.createChat({ chat: chatA });
      await store.createChat({ chat: chatB });
      store.setSelectedChatId('chat-del-sel-b');

      await store.deleteChat({ chat: chatA });

      expect(store.selectedChatId).toBe('chat-del-sel-b');
    });
  });

  describe('初始状态结构完整性', () => {
    it('初始化时 error 和 initializationError 应为 null', () => {
      // 验证初始 state 结构完整
      expect(store.chatMetaList).toEqual([]);
      expect(store.activeChatData).toEqual({});
      expect(store.sendingChatIds).toEqual({});
      expect(store.loading).toBe(false);
      expect(store.selectedChatId).toBeNull();
      expect(store.error).toBeNull();
      expect(store.initializationError).toBeNull();
      expect(store.runningChat).toEqual({});
    });
  });

  describe('sendMessage 完成后 updatedAt 和 chatMetaList 同步', () => {
    it('发送完成时应同步更新 activeChatData.updatedAt 和 chatMetaList 条目', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-scatter', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-scatter' });
      const responseMessage = createMockMessage({ content: 'Response' });

      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([responseMessage]));

      await store.sendMessage({ chat, message: 'Hello', model, historyList: [] });

      // updatedAt 应该被更新
      expect(store.activeChatData[chat.id].updatedAt).toEqual(expect.any(Number));
      // chatMetaList 中对应条目的 updatedAt 也应同步
      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      expect(meta?.updatedAt).toEqual(expect.any(Number));
    });
  });

  describe('sendMessage rejected console.error', () => {
    it('发送失败时应调用 console.error 并包含关键字段', async () => {
      const chat = createMockChat({
        id: 'chat-reject-log',
        name: 'Reject Chat',
        chatModelList: [{ modelId: 'model-reject-log', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-reject-log', modelKey: 'test-key', modelName: 'Test Model' });
      await store.createChat({ chat });

      const errorSpy = silenceConsoleError();

      mockStreamChatCompletion.mockImplementation(() => {
        throw new Error('Test error');
      });

      await expect(
        store.sendMessage({ chat, message: 'test', model, historyList: [] }),
      ).rejects.toThrow('Test error');

      // 验证 console.error 被调用且包含关键字段
      expect(errorSpy).toHaveBeenCalledWith(
        '❌ 聊天消息发送失败:',
        expect.objectContaining({
          chatId: chat.id,
          modelId: model.id,
        }),
      );
    });
  });

  describe('clearError 预设错误场景', () => {
    it('应该在 error 有值时正确清除', () => {
      const chatMetaListBefore = JSON.parse(JSON.stringify(store.chatMetaList));
      const loadingBefore = store.loading;

      store.clearError();

      expect(store.error).toBeNull();
      // 其余字段不变
      expect(store.chatMetaList).toEqual(chatMetaListBefore);
      expect(store.loading).toBe(loadingBefore);
    });
  });

  describe('pushRunningChatHistory 条件表达式', () => {
    it('应该精确覆盖 history 字段而非合并', async () => {
      const model = createMockModel({ id: 'model-push-overwrite' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-push-overwrite', chatHistoryList: [] }],
      });
      const message1 = createMockMessage({ content: 'First' });
      const message2 = createMockMessage({ content: 'Second' });

      await store.createChat({ chat });

      // 初始化 runningChat
      store.editRegenerateInit({ chatId: chat.id, modelId: model.id });

      // 第一次 push
      store.pushRunningChatHistory({ chat, model, message: message1 });
      expect(store.runningChat[chat.id][model.id].history).toEqual(message1);

      // 第二次 push（覆盖）
      store.pushRunningChatHistory({ chat, model, message: message2 });
      expect(store.runningChat[chat.id][model.id].history).toEqual(message2);
      expect(store.runningChat[chat.id][model.id].history!.content).toBe('Second');
    });
  });

  describe('deleteChat - 精确断言', () => {
    it('删除 selectedChatId 匹配的 chat 后 selectedChatId 应为 null', async () => {
      const chat = createMockChat({ id: 'chat-del-selected' });
      await store.createChat({ chat });

      // 选中该聊天
      store.setSelectedChatId(chat.id);
      expect(store.selectedChatId).toBe(chat.id);

      // 删除
      await store.deleteChat({ chat });

      expect(store.selectedChatId).toBeNull();
      expect(store.activeChatData[chat.id]).toBeUndefined();
      expect(store.chatMetaList.find((m) => m.id === chat.id)).toBeUndefined();
    });

    it('删除后 chatMetaList 应仅移除目标 chat，保留其他 chat', async () => {
      const chat1 = createMockChat({ id: 'chat-del-keep-1', name: 'Keep 1' });
      const chat2 = createMockChat({ id: 'chat-del-target', name: 'Delete Me' });
      const chat3 = createMockChat({ id: 'chat-del-keep-2', name: 'Keep 2' });

      await store.createChat({ chat: chat1 });
      await store.createChat({ chat: chat2 });
      await store.createChat({ chat: chat3 });

      await store.deleteChat({ chat: chat2 });

      expect(store.chatMetaList).toHaveLength(2);
      // createChat 使用 unshift，所以顺序是 chat3, chat1（chat2 被删除）
      expect(store.chatMetaList[0].id).toBe('chat-del-keep-2');
      expect(store.chatMetaList[0].name).toBe('Keep 2');
      expect(store.chatMetaList[1].id).toBe('chat-del-keep-1');
      expect(store.chatMetaList[1].name).toBe('Keep 1');
      expect(store.activeChatData['chat-del-target']).toBeUndefined();
    });
  });

  describe('appendHistoryToModel - 精确断言', () => {
    it('modelId 不匹配时 chatModelList 所有条目不变', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-exist', chatHistoryList: [] }],
      });
      const wrongModel = createMockModel({ id: 'model-wrong' });
      const message = createMockMessage({ content: 'test' });

      await store.createChat({ chat });
      const chatModelListBefore = JSON.parse(
        JSON.stringify(store.activeChatData[chat.id].chatModelList),
      );

      store.pushChatHistory({ chat, model: wrongModel, message });

      // 逐字段断言 chatModelList 所有条目不变
      expect(store.activeChatData[chat.id].chatModelList).toEqual(chatModelListBefore);
      expect(store.activeChatData[chat.id].chatModelList![0].chatHistoryList).toHaveLength(0);
    });

    it('成功追加时 chatHistoryList 最后一条应精确匹配被追加的 message', async () => {
      const model = createMockModel({ id: 'model-append-ok' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-append-ok', chatHistoryList: [] }],
      });
      const message = createMockMessage({
        id: 'msg-append-test',
        role: 'assistant' as StandardMessage['role'],
        content: 'Appended content',
        timestamp: 1700000000,
      });

      await store.createChat({ chat });
      store.pushChatHistory({ chat, model, message });

      const historyList = store.activeChatData[chat.id].chatModelList![0].chatHistoryList;
      expect(historyList).toHaveLength(1);
      expect(historyList[0]).toEqual(message);
      expect(historyList[0].content).toBe('Appended content');
    });
  });

  describe('editChatName - 精确断言', () => {
    it('name 恰好 20 字符时 name 值精确匹配且 isManuallyNamed 为 true', async () => {
      const chat = createMockChat({ name: 'Original' });
      await store.createChat({ chat });

      const name20 = '一二三四五六七八九十abcdefghij'; // 恰好 20 字符
      await store.editChatName({ id: chat.id, name: name20 });

      // chatMetaList 逐字段验证
      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      expect(meta?.name).toBe(name20);
      expect(meta?.name!.length).toBe(20);
      expect(meta?.isManuallyNamed).toBe(true);
      expect(meta?.updatedAt).toEqual(expect.any(Number));

      // activeChatData 逐字段验证
      expect(store.activeChatData[chat.id].name).toBe(name20);
      expect(store.activeChatData[chat.id].isManuallyNamed).toBe(true);
      expect(store.activeChatData[chat.id].updatedAt).toEqual(expect.any(Number));
    });

    it('更新后 activeChatData 的 updatedAt 应为数字且 name 同步更新', async () => {
      const chat = createMockChat({ name: 'Before' });
      await store.createChat({ chat });

      await store.editChatName({ id: chat.id, name: 'After' });

      expect(typeof store.activeChatData[chat.id].updatedAt).toBe('number');
      expect(store.activeChatData[chat.id].name).toBe('After');
    });
  });

  describe('startSendChatMessage - 条件分支增强验证', () => {
    it('model isDeleted=true 时不应调用 streamChatCompletion', async () => {
      const model = createMockModel({ id: 'model-del-cond', isDeleted: true, isEnable: true });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-del-cond', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([]));

      await store.startSendChatMessage({ chat, message: 'hello' });

      // streamChatCompletion 不应被调用（isDeleted 跳过）
      expect(mockStreamChatCompletion).not.toHaveBeenCalled();
      expect(store.runningChat[chat.id]).toBeUndefined();
      expect(store.sendingChatIds[chat.id]).toBeUndefined();
    });

    it('model isEnable=false 时不应调用 streamChatCompletion', async () => {
      const model = createMockModel({ id: 'model-dis-cond', isEnable: false, isDeleted: false });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-dis-cond', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([]));

      await store.startSendChatMessage({ chat, message: 'hello' });

      expect(mockStreamChatCompletion).not.toHaveBeenCalled();
      expect(store.runningChat[chat.id]).toBeUndefined();
    });
  });

  describe('sendMessage - thunk 体验证', () => {
    it('应该将 transmitHistoryReasoning 从 appConfig store 正确传入 streamChatCompletion', async () => {
      const appConfigStore = useAppConfigStore();
      appConfigStore.setTransmitHistoryReasoning(true);

      const model = createMockModel({ id: 'model-thunk-1' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-thunk-1', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([]));

      const controller = new AbortController();
      await store.sendMessage(
        { chat, message: 'hello', model, historyList: [] },
        { signal: controller.signal },
      );

      // 验证 streamChatCompletion 的调用参数包含 transmitHistoryReasoning: true
      expect(mockStreamChatCompletion).toHaveBeenCalledWith(
        expect.objectContaining({ transmitHistoryReasoning: true }),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it('应该将 signal 传入 streamChatCompletion 的 options 参数', async () => {
      const model = createMockModel({ id: 'model-thunk-signal' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-thunk-signal', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([]));

      const controller = new AbortController();
      await store.sendMessage(
        { chat, message: 'hello', model, historyList: [] },
        { signal: controller.signal },
      );

      // 验证 streamChatCompletion 第二个参数的 signal 与传入的一致
      const callArgs = mockStreamChatCompletion.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('signal');
      expect(callArgs[1].signal).toBe(controller.signal);
    });
  });

  describe('clearActiveChatData - 精确断言', () => {
    it('chatId 在 sendingChatIds 中时 activeChatData 逐字段保持不变', async () => {
      const chat = createMockChat({ id: 'chat-clear-sending', name: 'Sending Chat', isDeleted: false });
      await store.createChat({ chat });

      // 标记为正在发送
      store.sendingChatIds[chat.id] = true;

      // 尝试清理
      store.clearActiveChatData(chat.id);

      // 逐字段验证 activeChatData 保留
      expect(store.activeChatData[chat.id]).toEqual(chat);
      expect(store.activeChatData[chat.id].name).toBe('Sending Chat');
    });

    it('chatId 不在 sendingChatIds 中时 activeChatData 应被删除', async () => {
      const chat = createMockChat({ id: 'chat-clear-idle', name: 'Idle Chat' });
      await store.createChat({ chat });

      // 不标记为发送状态
      store.clearActiveChatData(chat.id);

      expect(store.activeChatData[chat.id]).toBeUndefined();
    });

    it('clearActiveChatData 不应该影响 sendingChatIds', async () => {
      const chat = createMockChat({ id: 'chat-clear-verify' });
      await store.createChat({ chat });

      // 标记为正在发送
      store.sendingChatIds[chat.id] = true;

      // 尝试清理
      store.clearActiveChatData(chat.id);

      // sendingChatIds 不受影响
      expect(store.sendingChatIds[chat.id]).toBe(true);
    });
  });

  describe('setSelectedChatIdWithPreload - 精确断言', () => {
    it('切换聊天时应该逐字段验证 activeChatData 写入', async () => {
      const chatA = createMockChat({ id: 'chat-ful-a', name: 'Chat A', isDeleted: false });
      const chatB = createMockChat({ id: 'chat-ful-b', name: 'Chat B', isDeleted: false });

      await store.createChat({ chat: chatA });
      await store.createChat({ chat: chatB });

      // 先选中 chatA（设置 previousChatId）
      await store.setSelectedChatIdWithPreload('chat-ful-a');

      // 切换到 chatB
      await store.setSelectedChatIdWithPreload('chat-ful-b');

      // 逐字段验证
      expect(store.activeChatData['chat-ful-b']).toEqual(chatB);
      expect(store.activeChatData['chat-ful-b'].name).toBe('Chat B');
      expect(store.selectedChatId).toBe('chat-ful-b');
      // previousChat 不在 sendingChatIds 中，应被清理
      expect(store.activeChatData['chat-ful-a']).toBeUndefined();
    });

    it('previousChatId 在 sendingChatIds 中时应该保留 activeChatData 逐字段验证', async () => {
      const chatA = createMockChat({ id: 'chat-send-a', name: 'Sending A' });
      const chatB = createMockChat({ id: 'chat-send-b', name: 'Chat B' });

      await store.createChat({ chat: chatA });
      await store.createChat({ chat: chatB });

      // 选中 chatA
      await store.setSelectedChatIdWithPreload('chat-send-a');

      // 标记 chatA 正在发送
      store.sendingChatIds['chat-send-a'] = true;

      // 切换到 chatB
      await store.setSelectedChatIdWithPreload('chat-send-b');

      // chatA 的 activeChatData 应保留（正在发送中），逐字段验证
      expect(store.activeChatData['chat-send-a']).toEqual(chatA);
      expect(store.activeChatData['chat-send-a'].name).toBe('Sending A');
      expect(store.activeChatData['chat-send-b']).toEqual(chatB);
    });

    it('chatData 为 null 时 activeChatData 不应有新增', async () => {
      silenceConsoleWarn();
      mockLoadChatById.mockResolvedValue(null);

      await store.setSelectedChatIdWithPreload('chat-no-data');

      expect(store.activeChatData['chat-no-data']).toBeUndefined();
      expect(store.selectedChatId).toBe('chat-no-data');
    });

    it('chatId 为 null 时 selectedChatId 为 null 且 activeChatData 无新增', async () => {
      await store.setSelectedChatIdWithPreload(null);

      expect(store.selectedChatId).toBeNull();
      expect(Object.keys(store.activeChatData)).toHaveLength(0);
    });

    it('chatId 与 previousChatId 相同时不应该触发清理', async () => {
      const chat = createMockChat({ id: 'chat-same-id', name: 'Same Chat' });
      await store.createChat({ chat });

      // 先选中
      await store.setSelectedChatIdWithPreload('chat-same-id');

      // 再次选中同一个（模拟 re-select）
      await store.setSelectedChatIdWithPreload('chat-same-id');

      // activeChatData 仍然存在，没有被清理
      expect(store.activeChatData['chat-same-id']).toEqual(chat);
      expect(store.selectedChatId).toBe('chat-same-id');
    });
  });

  describe('updateMetaInList - 精确断言', () => {
    it('chatId 匹配时应该正确合并 chatMetaList 条目', async () => {
      mockGenerateChatTitleService.mockResolvedValue('Updated Name');

      const chat = createMockChat({ name: 'Original', isManuallyNamed: false });
      await store.createChat({ chat });

      // 通过 generateChatName 触发 updateMetaInList
      await store.generateChatName({
        chat,
        model: createMockModel(),
        historyList: [],
      });

      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      // 逐字段断言：name 和 updatedAt 被更新，id 保持不变
      expect(meta?.id).toBe(chat.id);
      expect(meta?.name).toBe('Updated Name');
      expect(meta?.updatedAt).toEqual(expect.any(Number));
    });

    it('chatId 不匹配时 chatMetaList 所有条目不变', async () => {
      mockGenerateChatTitleService.mockResolvedValue('Should Not Apply');

      const chat1 = createMockChat({ id: 'meta-chat-1', name: 'Chat 1' });
      const chat2 = createMockChat({ id: 'meta-chat-2', name: 'Chat 2' });
      await store.createChat({ chat: chat1 });
      await store.createChat({ chat: chat2 });

      const chatMetaListBefore = JSON.parse(JSON.stringify(store.chatMetaList));

      const unknownChat = createMockChat({ id: 'non-existent-id' });
      await store.generateChatName({
        chat: unknownChat,
        model: createMockModel(),
        historyList: [],
      });

      // 逐条 toEqual 断言 chatMetaList 不变
      expect(store.chatMetaList).toEqual(chatMetaListBefore);
      // createChat 使用 unshift，顺序为 chat2, chat1
      expect(store.chatMetaList[0].name).toBe('Chat 2');
      expect(store.chatMetaList[1].name).toBe('Chat 1');
    });

    it('chatMetaList 为空数组时函数不抛异常', async () => {
      mockGenerateChatTitleService.mockResolvedValue('Any Name');

      const unknownChat = createMockChat({ id: 'any-id' });
      await expect(
        store.generateChatName({
          chat: unknownChat,
          model: createMockModel(),
          historyList: [],
        }),
      ).resolves.toBeDefined();

      expect(store.chatMetaList).toEqual([]);
    });
  });

  describe('精确断言验证', () => {
    it('sendMessage 完成后应正确设置 activeChatData 的完整字段', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-precise', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-precise' });
      const responseMessage = createMockMessage();

      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([responseMessage]));

      await store.sendMessage({ chat, message: 'Hello', model, historyList: [] });

      // chatHistoryList 包含用户消息 + AI 回复
      const historyList = store.activeChatData[chat.id].chatModelList?.[0].chatHistoryList;
      expect(historyList).toHaveLength(2);
      expect(historyList?.[1]).toEqual(responseMessage);
      expect(store.activeChatData[chat.id].updatedAt).toEqual(expect.any(Number));
      expect(store.runningChat[chat.id]?.[model.id]).toBeUndefined();
    });

    it('generateChatName 成功后应正确设置 updatedAt', async () => {
      mockGenerateChatTitleService.mockResolvedValue('Generated Title');

      const chat = createMockChat({ name: undefined });
      await store.createChat({ chat });

      await store.generateChatName({
        chat,
        model: createMockModel(),
        historyList: [],
      });

      expect(store.activeChatData[chat.id].updatedAt).toEqual(expect.any(Number));

      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      expect(meta?.updatedAt).toEqual(expect.any(Number));
      expect(meta?.name).toBe('Generated Title');
    });

    it('startSendChatMessage 应在执行期间设置并在结束后清理 sendingChatIds', async () => {
      const model = createMockModel({ id: 'model-cleanup-send', isEnable: true, isDeleted: false });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-cleanup-send', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      mockStreamChatCompletion.mockImplementation(gatedStream([], gate));

      const promise = store.startSendChatMessage({ chat, message: 'test' });

      // 执行期间 sendingChatIds 包含该聊天（原 pending 效果）
      expect(store.sendingChatIds[chat.id]).toBe(true);

      release();
      await promise;

      // 结束后清理（原 fulfilled 效果）
      expect(store.sendingChatIds[chat.id]).toBeUndefined();
    });

    it('setSelectedChatIdWithPreload 应精确设置 activeChatData', async () => {
      const chatA = createMockChat({ id: 'chat-precise-a' });
      const chatB = createMockChat({ id: 'chat-precise-b', name: 'Chat B' });

      await store.createChat({ chat: chatA });
      await store.createChat({ chat: chatB });

      await store.setSelectedChatIdWithPreload('chat-precise-a');
      await store.setSelectedChatIdWithPreload('chat-precise-b');

      expect(store.activeChatData['chat-precise-a']).toBeUndefined();
      expect(store.activeChatData['chat-precise-b']).toEqual(chatB);
      expect(store.selectedChatId).toBe('chat-precise-b');
    });
  });

  describe('sendMessage - 消息对象精确断言', () => {
    it('发送时应追加包含正确 role/content/modelKey 的用户消息', async () => {
      const model = createMockModel({ id: 'model-msg-obj', modelKey: 'test-model-key' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-msg-obj', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([]));

      await store.sendMessage({ chat, message: 'test message content', model, historyList: [] });

      // 用户消息被追加到 activeChatData，且字段正确
      const history = store.activeChatData[chat.id]?.chatModelList?.[0]?.chatHistoryList;
      expect(history).toBeDefined();
      expect(history!.length).toBeGreaterThanOrEqual(1);
      const userMsg = history![0];
      expect(userMsg.role).toBe('user');
      expect(userMsg.content).toBe('test message content');
      expect(userMsg.modelKey).toBe('test-model-key');
      expect(userMsg.finishReason).toBeNull();
    });

    it('signal.aborted 时应该 break 循环且正常完成不抛出错误', async () => {
      const model = createMockModel({ id: 'model-abort' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-abort', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      // 创建立即中止的 signal
      const controller = new AbortController();
      controller.abort();

      const msg1 = createMockMessage({ content: 'chunk1' });
      const msg2 = createMockMessage({ content: 'chunk2' });
      mockStreamChatCompletion.mockImplementation(gatedStream([msg1, msg2]));

      // 使用已 abort 的 signal 执行完整发送流程，即使 aborted 也不应抛出未捕获错误
      await expect(
        store.startSendChatMessage({ chat, message: 'test' }, { signal: controller.signal }),
      ).resolves.toBeUndefined();
    });

    it('for-await 循环应该处理流式返回的每个元素并在完成后清理 runningChat', async () => {
      const model = createMockModel({ id: 'model-stream-elems' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-stream-elems', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      const chunk1 = createMockMessage({ content: 'chunk-1' });
      const chunk2 = createMockMessage({ content: 'chunk-2' });
      mockStreamChatCompletion.mockImplementation(gatedStream([chunk1, chunk2]));

      await store.sendMessage({ chat, message: 'hello', model, historyList: [] });

      // 完成后 runningChat 被清理，最终 history 被回写
      expect(store.runningChat[chat.id]?.[model.id]).toBeUndefined();
    });
  });

  describe('setSelectedChatIdWithPreload - 分支精确覆盖', () => {
    it('chatId 为 null 时不应设置 activeChatData（已创建的聊天保留）', async () => {
      const chat = createMockChat();
      await store.createChat({ chat });

      await store.setSelectedChatIdWithPreload(null);

      expect(store.selectedChatId).toBeNull();
      // 已创建的聊天数据保留在 activeChatData 中
      expect(Object.keys(store.activeChatData)).toHaveLength(1);
    });

    it('chatData 存在时应该写入 activeChatData', async () => {
      const chat = createMockChat({ id: 'chat-has-data', name: 'Has Data' });
      await store.createChat({ chat });

      await store.setSelectedChatIdWithPreload('chat-has-data');

      expect(store.activeChatData['chat-has-data']).toEqual(chat);
    });

    it('chatData 不存在时不应写入 activeChatData', async () => {
      silenceConsoleWarn();
      mockLoadChatById.mockResolvedValue(undefined);

      await store.setSelectedChatIdWithPreload('some-id');

      expect(store.selectedChatId).toBe('some-id');
      expect(store.activeChatData['some-id']).toBeUndefined();
    });

    it('chatModelList 非空且 chatModelList.length > 0 时应进入预加载', async () => {
      const model = createMockModel({ id: 'model-len-gt-0' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-len-gt-0', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      await store.setSelectedChatIdWithPreload(chat.id);

      expect(mockPreloadProviders).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateMetaInList - 条件变异精确覆盖', () => {
    it('findIndex 找到匹配时应该合并更新', async () => {
      const chat = createMockChat({ name: 'Before' });
      await store.createChat({ chat });

      await store.editChatName({ id: chat.id, name: 'After' });

      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      // findIndex 返回非 -1 的索引，进入 if 块
      expect(meta?.name).toBe('After');
      expect(meta?.isManuallyNamed).toBe(true);
      expect(meta?.updatedAt).toEqual(expect.any(Number));
    });

    it('findIndex 未找到时不应修改 chatMetaList', async () => {
      const chat = createMockChat({ name: 'Keep' });
      await store.createChat({ chat });

      const chatMetaListBefore = JSON.parse(JSON.stringify(store.chatMetaList));

      // 尝试更新不存在的 chatId
      await store.editChatName({ id: 'non-existent', name: 'Ignored' });

      expect(store.chatMetaList).toEqual(chatMetaListBefore);
    });
  });

  describe('editChatName - 条件精确覆盖', () => {
    it('name > 20 字符时应该截断', async () => {
      const chat = createMockChat({ name: 'Original' });
      await store.createChat({ chat });

      const longName = 'a'.repeat(25);
      await store.editChatName({ id: chat.id, name: longName });

      // name.length > 20 → true，进入截断分支
      expect(store.activeChatData[chat.id].name).toBe('a'.repeat(20));
      expect(store.activeChatData[chat.id].name!.length).toBe(20);
    });

    it('name <= 20 字符时不应截断', async () => {
      const chat = createMockChat({ name: 'Original' });
      await store.createChat({ chat });

      const shortName = 'short';
      await store.editChatName({ id: chat.id, name: shortName });

      expect(store.activeChatData[chat.id].name).toBe('short');
    });

    it('更新 chatMetaList 时 isManuallyNamed 应为 true', async () => {
      const chat = createMockChat({ name: 'Test' });
      await store.createChat({ chat });

      await store.editChatName({ id: chat.id, name: 'New Name' });

      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      expect(meta?.isManuallyNamed).toBe(true);
      expect(meta?.updatedAt).toEqual(expect.any(Number));
    });
  });

  describe('sendMessage 完成后的回写和清理', () => {
    it('appendHistoryToModel 成功时应该清理 runningChat', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-ful-clean', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-ful-clean' });
      const responseMessage = createMockMessage({ content: 'Response' });

      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([responseMessage]));

      await store.sendMessage({ chat, message: 'Hello', model, historyList: [] });

      // appendHistoryToModel 成功 → runningChat 被清理
      expect(store.runningChat[chat.id]?.[model.id]).toBeUndefined();
      // updatedAt 被更新
      expect(store.activeChatData[chat.id].updatedAt).toEqual(expect.any(Number));
      // chatMetaList 中 updatedAt 也被更新
      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      expect(meta?.updatedAt).toEqual(expect.any(Number));
    });

    it('activeChat 不存在时不应更新 updatedAt 且 runningChat 保留', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-no-active', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-no-active' });

      // 不创建 chat → activeChatData 为空
      silenceConsoleError();

      mockStreamChatCompletion.mockImplementation(gatedStream([]));

      await store.sendMessage({ chat, message: 'Hello', model, historyList: [] });

      // appendHistoryToModel 失败 → runningChat 保留
      expect(store.runningChat[chat.id][model.id]).toEqual(
        expect.objectContaining({
          isSending: false,
        }),
      );
    });
  });

  describe('startSendChatMessage 完成后 - sendingChatIds 清理', () => {
    it('发送完成后应该从 sendingChatIds 中删除 chatId', async () => {
      const model = createMockModel({ id: 'model-send-ful', isEnable: true, isDeleted: false });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-send-ful', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([]));

      await store.startSendChatMessage({ chat, message: 'hello' });

      expect(store.sendingChatIds[chat.id]).toBeUndefined();
    });
  });

  describe('sendMessage rejected - 错误信息拼接', () => {
    it('抛出的 Error 带 message 和 stack 时应正确拼接错误信息', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-err-destr', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-err-destr' });
      await store.createChat({ chat });

      silenceConsoleError();

      // 抛出带自定义 stack 的 Error
      mockStreamChatCompletion.mockImplementation(() => {
        throw Object.assign(new Error('Custom error'), { stack: 'custom stack' });
      });

      await expect(
        store.sendMessage({ chat, message: 'test', model, historyList: [] }),
      ).rejects.toThrow('Custom error');

      const entry = store.runningChat[chat.id][model.id];
      expect(entry.errorMessage).toContain('Custom error');
      expect(entry.errorMessage).toContain('custom stack');
    });

    it('抛出的 Error 带 message 和 stack 时应完整记录所有字段', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-full-err', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-full-err', modelKey: 'key-abc', modelName: 'TestModel' });
      await store.createChat({ chat });

      const errorSpy = silenceConsoleError();

      mockStreamChatCompletion.mockImplementation(() => {
        throw Object.assign(new Error('Full error'), {
          name: 'NetworkError',
          stack: 'Error stack trace',
        });
      });

      await expect(
        store.sendMessage({ chat, message: 'test', model, historyList: [] }),
      ).rejects.toThrow('Full error');

      const errorCall = errorSpy.mock.calls[0];
      expect(errorCall[0]).toBe('❌ 聊天消息发送失败:');
      const loggedObj = errorCall[1];
      expect(loggedObj.chatId).toBe(chat.id);
      expect(loggedObj.modelId).toBe(model.id);
      expect(loggedObj.modelKey).toBe('key-abc');
      expect(loggedObj.modelName).toBe('TestModel');
      // 验证 stack 被记录
      expect(loggedObj.errorStack).toBe('Error stack trace');
      expect(loggedObj.errorName).toBe('NetworkError');
      expect(loggedObj.errorMessage).toBe('Full error');
    });
  });

  describe('pushRunningChatHistory - 条件精确覆盖', () => {
    it('应该直接赋值 history 而非合并', async () => {
      const model = createMockModel({ id: 'model-push-cond' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-push-cond', chatHistoryList: [] }],
      });

      await store.createChat({ chat });

      // 初始化 runningChat 结构
      store.editRegenerateInit({ chatId: chat.id, modelId: model.id });

      const message = createMockMessage({ content: 'test content' });
      store.pushRunningChatHistory({ chat, model, message });

      expect(store.runningChat[chat.id][model.id].history).toEqual(message);
      expect(store.runningChat[chat.id][model.id].history!.content).toBe('test content');
    });
  });

  describe('createChat - updatedAt 初始化', () => {
    it('updatedAt 为 undefined 时应该自动设置', async () => {
      const chat = createMockChat({ name: 'No UpdatedAt' });
      delete (chat as { updatedAt?: number }).updatedAt;
      await store.createChat({ chat });

      expect(store.activeChatData[chat.id].updatedAt).toEqual(expect.any(Number));
      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      expect(meta?.id).toBe(chat.id);
      expect(meta?.name).toBe('No UpdatedAt');
      expect(meta?.updatedAt).toEqual(expect.any(Number));
    });
  });

  describe('appendHistoryToModel - 成功追加后清理 runningChat', () => {
    it('成功追加后 sendMessage 完成应清理 runningChat', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-return-true', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-return-true' });
      const responseMessage = createMockMessage({ content: 'Data' });

      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([responseMessage]));

      await store.sendMessage({ chat, message: 'Hello', model, historyList: [] });

      // 追加成功 → runningChat 被清理
      expect(store.runningChat[chat.id]?.[model.id]).toBeUndefined();
      // 数据被追加到 chatHistoryList（用户消息 + AI 回复）
      const historyList = store.activeChatData[chat.id].chatModelList![0].chatHistoryList;
      expect(historyList).toHaveLength(2);
      expect(historyList[1]).toEqual(responseMessage);
    });
  });

  describe('updateMetaInList - 只更新目标项', () => {
    it('editChatName 时 chatMetaList 只有目标项被更新，其余项保持不变', async () => {
      const chat1 = createMockChat({ id: 'meta-3-1', name: 'Chat1' });
      const chat2 = createMockChat({ id: 'meta-3-2', name: 'Chat2' });

      await store.createChat({ chat: chat1 });
      await store.createChat({ chat: chat2 });

      await store.editChatName({ id: 'meta-3-1', name: 'Updated1' });

      // createChat unshift → [chat2, chat1]
      const meta1 = store.chatMetaList.find((m) => m.id === 'meta-3-1');
      const meta2 = store.chatMetaList.find((m) => m.id === 'meta-3-2');

      // 只有 chat1 被更新
      expect(meta1?.name).toBe('Updated1');
      expect(meta1?.isManuallyNamed).toBe(true);
      expect(meta1?.updatedAt).toEqual(expect.any(Number));

      // chat2 完全不变
      expect(meta2?.name).toBe('Chat2');
      expect(meta2?.isManuallyNamed).toBeUndefined();
    });

    it('editChat 也会调用 updateMetaInList，应合并元数据', async () => {
      const chat = createMockChat({ id: 'meta-edit', name: 'Before' });
      await store.createChat({ chat });

      // editChat 内部调用 updateMetaInList
      const updatedChat = { ...chat, name: 'Edited Name' };
      await store.editChat({ chat: updatedChat });

      const meta = store.chatMetaList.find((m) => m.id === 'meta-edit');
      expect(meta?.name).toBe('Edited Name');
      expect(meta?.id).toBe('meta-edit');
    });
  });

  describe('setSelectedChatIdWithPreload - chatData 缺失时的目标清理', () => {
    it('chatData 为 undefined 时不应写入 activeChatData 且清理 previous chat', async () => {
      silenceConsoleWarn();

      const chatA = createMockChat({ id: 'sel-3-a' });
      await store.createChat({ chat: chatA });

      // 先选中 chatA
      await store.setSelectedChatIdWithPreload('sel-3-a');

      // 再选中另一个不存在的 chat（loadChatById 返回 undefined）
      mockLoadChatById.mockResolvedValue(undefined);
      await store.setSelectedChatIdWithPreload('sel-3-b');

      expect(store.selectedChatId).toBe('sel-3-b');
      // chatData 为 undefined → activeChatData 不写入 sel-3-b
      expect(store.activeChatData['sel-3-b']).toBeUndefined();
      // previous chatA 不在 sendingChatIds → 被清理
      expect(store.activeChatData['sel-3-a']).toBeUndefined();
    });

    it('chatData 有值时应写入 activeChatData', async () => {
      const chat = createMockChat({ id: 'sel-3-data', name: 'WithData' });
      mockLoadChatById.mockResolvedValue(chat);

      await store.setSelectedChatIdWithPreload('sel-3-data');

      expect(store.activeChatData['sel-3-data']).toEqual(chat);
      expect(store.activeChatData['sel-3-data'].name).toBe('WithData');
    });
  });

  describe('sendMessage 完成后 - activeChat updatedAt 精确验证', () => {
    it('activeChat 存在时应该更新 updatedAt 且 chatMetaList 精确同步', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-ful-3', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-ful-3' });
      const responseMessage = createMockMessage({ content: 'Response' });

      await store.createChat({ chat });
      const beforeUpdatedAt = store.activeChatData[chat.id].updatedAt;

      mockStreamChatCompletion.mockImplementation(gatedStream([responseMessage]));

      await store.sendMessage({ chat, message: 'Hello', model, historyList: [] });

      // activeChat 存在 → updatedAt 被更新
      const newUpdatedAt = store.activeChatData[chat.id].updatedAt;
      expect(typeof newUpdatedAt).toBe('number');
      expect(newUpdatedAt!).toBeGreaterThanOrEqual(beforeUpdatedAt ?? 0);
      // chatMetaList 中对应条目的 updatedAt 也应同步
      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      expect(meta?.updatedAt).toEqual(expect.any(Number));
    });

    it('activeChat 存在时 chatMetaList 的 updatedAt 应与 activeChatData 的完全相同', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-sync-ts', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-sync-ts' });

      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([createMockMessage()]));

      await store.sendMessage({ chat, message: 'Hello', model, historyList: [] });

      // activeChatData 的 updatedAt 与 chatMetaList 的必须是同一个值
      const activeTs = store.activeChatData[chat.id].updatedAt;
      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      expect(meta?.updatedAt).toBe(activeTs);
    });

    it('activeChat 不存在时 updatedAt 不应被更新', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-ful-no', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-ful-no' });

      // 不创建 chat
      silenceConsoleError();

      mockStreamChatCompletion.mockImplementation(gatedStream([]));

      await store.sendMessage({ chat, message: 'Hello', model, historyList: [] });

      // activeChatData 不存在 → 无 updatedAt 更新
      expect(store.activeChatData[chat.id]).toBeUndefined();
    });
  });

  describe('sendMessage - signal.aborted 和 for-await 精确覆盖', () => {
    it('signal.aborted 时应在 yield 后 break 且 history 保留已接收内容', async () => {
      const model = createMockModel({ id: 'model-signal-abort' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-signal-abort', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      const controller = new AbortController();

      const chunk1 = createMockMessage({ content: 'chunk1' });
      const chunk2 = createMockMessage({ content: 'chunk2' });

      // 在第一个 yield 后 abort（模拟请求被取消）
      mockStreamChatCompletion.mockImplementation(
        () =>
          // oxlint-disable-next-line require-yield -- 流式 mock 生成器
          (async function* () {
            yield chunk1;
            controller.abort();
            yield chunk2;
          })(),
      );

      await store.sendMessage(
        { chat, message: 'test', model, historyList: [] },
        { signal: controller.signal },
      );

      // sendMessage 完成，runningChat 被清理
      expect(store.runningChat[chat.id]?.[model.id]).toBeUndefined();
      // pushChatHistory 在 for-await 之前被调用（用户消息），所以 chatHistoryList ≥ 1
      const historyList = store.activeChatData[chat.id]?.chatModelList?.[0]?.chatHistoryList;
      expect(historyList!.length).toBeGreaterThanOrEqual(1);
      // 第一条应该是用户消息
      expect(historyList![0].role).toBe('user');
      expect(historyList![0].content).toBe('test');
    });
  });

  describe('createChat - updatedAt undefined 时初始化', () => {
    it('应该设置 updatedAt 为当前时间戳', async () => {
      const chat = createMockChat({ name: 'New Chat' });
      delete (chat as { updatedAt?: number }).updatedAt;

      await store.createChat({ chat });

      const ts = store.activeChatData[chat.id].updatedAt;
      expect(typeof ts).toBe('number');
      expect(ts!).toBeGreaterThan(0);
    });
  });

  describe('appendHistoryToModel - chat 不存在时保留 runningChat', () => {
    it('chat 不存在时 sendMessage 完成应保留 runningChat', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-ret-f', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-ret-f' });
      const responseMessage = createMockMessage({ content: 'Data' });

      // 不 createChat → activeChatData 中没有 chat
      silenceConsoleError();

      mockStreamChatCompletion.mockImplementation(gatedStream([responseMessage]));

      await store.sendMessage({ chat, message: 'test', model, historyList: [] });

      // appendHistoryToModel 返回 false → runningChat 不被清理
      expect(store.runningChat[chat.id][model.id]).toEqual(
        expect.objectContaining({
          isSending: false,
          history: responseMessage,
        }),
      );
    });
  });

  describe('startSendChatMessage - 条件和对象精确覆盖', () => {
    it('条件为 true 时应执行 sendMessage', async () => {
      const model = createMockModel({ id: 'model-cond-true', isEnable: true, isDeleted: false });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-cond-true', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([createMockMessage({ content: 'resp' })]));

      await store.startSendChatMessage({ chat, message: 'test' });

      // 条件为 true → sendMessage 被执行 → 发送结束后 sendingChatIds 清理
      expect(store.sendingChatIds[chat.id]).toBeUndefined();
    });
  });

  describe('pushRunningChatHistory - 已初始化结构赋值', () => {
    it('runningChat 结构已初始化时应直接赋值', async () => {
      const model = createMockModel({ id: 'model-push-3' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-push-3', chatHistoryList: [] }],
      });
      const msg = createMockMessage({ content: 'Running' });

      await store.createChat({ chat });
      store.editRegenerateInit({ chatId: chat.id, modelId: model.id });

      // 赋值 history
      store.pushRunningChatHistory({ chat, model, message: msg });

      expect(store.runningChat[chat.id][model.id].history).toEqual(msg);
      // 其他字段不受影响
      expect(store.runningChat[chat.id][model.id].isSending).toBe(true);
    });
  });

  describe('sendMessage - 用户消息 ID 前缀', () => {
    it('追加的用户消息 id 应包含 USER_MESSAGE_ID_PREFIX', async () => {
      const model = createMockModel({ id: 'model-id-prefix', modelKey: 'test-key' });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-id-prefix', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([]));

      await store.sendMessage({ chat, message: 'hello', model, historyList: [] });

      const historyList = store.activeChatData[chat.id].chatModelList![0].chatHistoryList;
      const userMsg = historyList[0];
      // 用户消息 ID 含 user_msg_ 前缀
      expect(userMsg.id).toMatch(/^user_msg_/);
    });
  });

  describe('initializeChatList - Error cause 验证', () => {
    it('rejected 时 initializationError 应包含错误消息', async () => {
      mockLoadChatIndex.mockRejectedValue(new Error('Disk I/O error'));

      await expect(store.initializeChatList()).rejects.toThrow('Disk I/O error');

      expect(store.initializationError).toBe('Disk I/O error');
    });

    it('rejected 时非 Error 类型应使用默认消息', async () => {
      mockLoadChatIndex.mockRejectedValue('not an error');

      await expect(store.initializeChatList()).rejects.toThrow('Failed to initialize chat data');

      expect(store.initializationError).toBe('Failed to initialize chat data');
    });
  });

  describe('setSelectedChatIdWithPreload - chatId falsy 路径', () => {
    it('chatId 为空字符串时应安全处理并清空选中状态', async () => {
      await store.setSelectedChatIdWithPreload('');

      // 空字符串视为 falsy → 直接应用空选中状态
      expect(store.selectedChatId).toBe('');
    });
  });

  describe('setSelectedChatIdWithPreload - loaded 条件分支', () => {
    it('loaded 为 null 时应仅设置 selectedChatId 并 console.warn', async () => {
      mockLoadChatById.mockResolvedValue(null);

      const warnSpy = silenceConsoleWarn();

      await store.setSelectedChatIdWithPreload('chat-loaded-null');

      // !loaded 为 true → console.warn → 仅设置 selectedChatId
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('chat-loaded-null'));
      expect(store.activeChatData['chat-loaded-null']).toBeUndefined();

      // 0 等其他 falsy 加载结果同样走 not-found 路径
      mockLoadChatById.mockResolvedValue(0 as unknown as Chat);
      await store.setSelectedChatIdWithPreload('chat-zero-data');
      expect(store.activeChatData['chat-zero-data']).toBeUndefined();
    });

    it('loaded 有值时应写入 activeChatData', async () => {
      const chatFromStorage = createMockChat({ id: 'chat-from-storage', name: 'From Storage' });
      mockLoadChatById.mockResolvedValue(chatFromStorage);

      await store.setSelectedChatIdWithPreload('chat-from-storage');

      // !loaded 为 false → 正常写入 activeChatData
      expect(store.activeChatData['chat-from-storage']).toEqual(chatFromStorage);
      expect(store.selectedChatId).toBe('chat-from-storage');
    });
  });

  describe('setSelectedChatIdWithPreload - chatModelList 长度条件', () => {
    it('chatModelList 有 2 个模型时应预加载 2 个 providerKey', async () => {
      const model1 = createMockModel({ id: 'model-cml-1', providerKey: 'PROV_1' as Model['providerKey'] });
      const model2 = createMockModel({ id: 'model-cml-2', providerKey: 'PROV_2' as Model['providerKey'] });
      const chat = createMockChat({
        chatModelList: [
          { modelId: 'model-cml-1', chatHistoryList: [] },
          { modelId: 'model-cml-2', chatHistoryList: [] },
        ],
      });

      await registerModels(model1, model2);
      await store.createChat({ chat });

      await store.setSelectedChatIdWithPreload(chat.id);

      // 非空 chatModelList 应触发预加载，包含两个 providerKey
      expect(mockPreloadProviders).toHaveBeenCalledTimes(1);
      const calledKeys = mockPreloadProviders.mock.calls[0][0];
      expect(calledKeys).toContain('PROV_1');
      expect(calledKeys).toContain('PROV_2');
      // 选中状态正常应用
      expect(store.selectedChatId).toBe(chat.id);
      expect(store.activeChatData[chat.id]).toEqual(chat);
    });

    it('chatModelList 为空时应跳过预加载', async () => {
      const chat = createMockChat({ id: 'chat-empty-cml', chatModelList: [] });
      await store.createChat({ chat });

      await store.setSelectedChatIdWithPreload('chat-empty-cml');

      // 空 chatModelList 应跳过预加载
      expect(mockPreloadProviders).not.toHaveBeenCalled();
      // 选中状态正常应用
      expect(store.selectedChatId).toBe('chat-empty-cml');
    });
  });

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

      await registerModels(modelA, modelB);
      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([createMockMessage({ content: 'resp' })]));

      await store.startSendChatMessage({ chat, message: 'test' });

      // find 按 modelId 精确匹配返回 model-b
      expect(mockStreamChatCompletion).toHaveBeenCalledTimes(1);
      const callArg = mockStreamChatCompletion.mock.calls[0][0];
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

      await registerModels(model1, model2);
      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([createMockMessage({ content: 'resp' })]));

      await store.startSendChatMessage({ chat, message: 'test' });

      expect(store.sendingChatIds[chat.id]).toBeUndefined();
      expect(mockStreamChatCompletion).toHaveBeenCalledTimes(2);
    });
  });

  describe('startSendChatMessage - signal 传递验证', () => {
    it('sendMessage 调用时收到的 signal 应被传递到 streamChatCompletion', async () => {
      const model = createMockModel({ id: 'model-sig-opt', isEnable: true, isDeleted: false });
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-sig-opt', chatHistoryList: [] }],
      });

      await registerModels(model);
      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([createMockMessage({ content: 'resp' })]));

      const controller = new AbortController();
      await store.startSendChatMessage({ chat, message: 'hello' }, { signal: controller.signal });

      // signal 应被逐层传递到 streamChatCompletion
      const lastCall = mockStreamChatCompletion.mock.calls.at(-1);
      expect(lastCall?.[1]).toHaveProperty('signal');
      expect(lastCall?.[1].signal).toBe(controller.signal);
    });
  });

  describe('editChatName - 边界值精确验证', () => {
    it('name 为 21 字符时应该截断为 20', async () => {
      const chat = createMockChat({ name: 'Original' });
      await store.createChat({ chat });

      const name21 = 'a'.repeat(21);
      await store.editChatName({ id: chat.id, name: name21 });

      expect(store.activeChatData[chat.id].name).toBe('a'.repeat(20));
      // chatMetaList 也应截断
      const meta = store.chatMetaList.find((m) => m.id === chat.id);
      expect(meta?.name).toBe('a'.repeat(20));
      expect(meta?.isManuallyNamed).toBe(true);
      expect(meta?.updatedAt).toEqual(expect.any(Number));
    });

    it('name 为 19 字符时不应截断且完整保留', async () => {
      const chat = createMockChat({ name: 'Original' });
      await store.createChat({ chat });

      const name19 = 'a'.repeat(19);
      await store.editChatName({ id: chat.id, name: name19 });

      expect(store.activeChatData[chat.id].name).toBe(name19);
      expect(store.activeChatData[chat.id].name!.length).toBe(19);
    });
  });

  describe('sendMessage 首次执行 - isNil 分支精确覆盖', () => {
    it('首次发送时应创建完整结构 { isSending: true, history: null, errorMessage: "" }', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-first-pend', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-first-pend' });
      await store.createChat({ chat });

      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      mockStreamChatCompletion.mockImplementation(gatedStream([], gate));

      const promise = store.sendMessage({ chat, message: 'test', model, historyList: [] });

      // isNil(runningChat[chat.id]) → true → 创建新对象
      expect(store.runningChat[chat.id]).toBeDefined();
      expect(store.runningChat[chat.id][model.id]).toEqual({
        isSending: true,
        history: null,
        errorMessage: '',
      });

      release();
      await promise;
    });

    it('条目已存在时重新发送应只重置子字段并保留 history', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-re-pend', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-re-pend' });
      await store.createChat({ chat });

      // 静默回写失败的预期错误日志
      silenceConsoleError();

      // 第一次发送产生流式数据后，在完成前移除 activeChatData 使回写失败（条目保留）
      const oldMessage = createMockMessage({ content: 'old' });
      let release1!: () => void;
      const gate1 = new Promise<void>((resolve) => (release1 = resolve));
      mockStreamChatCompletion.mockImplementation(gatedStream([oldMessage], gate1));

      const first = store.sendMessage({ chat, message: 'test', model, historyList: [] });
      await vi.waitFor(() => {
        expect(store.runningChat[chat.id]?.[model.id]?.history).toEqual(oldMessage);
      });
      store.clearActiveChatData(chat.id);
      release1();
      await first;

      // 第一次发送结束后条目保留（回写失败）
      expect(store.runningChat[chat.id][model.id].history).toEqual(oldMessage);

      // 第二次发送（条目已存在 → else 分支）：重置 isSending 和 errorMessage，保留 history
      let release2!: () => void;
      const gate2 = new Promise<void>((resolve) => (release2 = resolve));
      mockStreamChatCompletion.mockImplementation(gatedStream([], gate2));

      const second = store.sendMessage({ chat, message: 'test', model, historyList: [] });

      expect(store.runningChat[chat.id][model.id].isSending).toBe(true);
      expect(store.runningChat[chat.id][model.id].errorMessage).toBe('');
      expect(store.runningChat[chat.id][model.id].history).not.toBeNull();

      release2();
      await second;
    });
  });

  describe('sendMessage rejected - OptionalChaining 安全处理', () => {
    it('runningChat[chat.id] 存在但 [model.id] 不存在时应安全处理不抛出 TypeError', async () => {
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-opt-rc', chatHistoryList: [] }],
      });
      const model = createMockModel({ id: 'model-opt-rc' });
      const otherModel = createMockModel({ id: 'other-model' });

      await store.createChat({ chat });

      // 只为 otherModel 创建 runningChat 条目，不为 model 创建
      store.editRegenerateInit({ chatId: chat.id, modelId: otherModel.id });

      const errorSpy = silenceConsoleError();

      // 直接触发 rejected 路径（流式失败），model 的条目不存在
      mockStreamChatCompletion.mockImplementation(() => {
        throw new Error('test error');
      });

      // 新实现使用可选链，条目不存在时安全处理而非抛出 TypeError
      await expect(
        store.sendMessage({ chat, message: 'test', model, historyList: [] }),
      ).rejects.toThrow('test error');

      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('appendHistoryToModel - modelId 不匹配时保留 runningChat', () => {
    it('modelId 不匹配时 sendMessage 完成不应清理 runningChat', async () => {
      // 构造场景：chat 有 model-a 但发送的是 model-b
      const chat = createMockChat({
        chatModelList: [{ modelId: 'model-a', chatHistoryList: [] }],
      });
      const modelB = createMockModel({ id: 'model-b' });
      const responseMsg = createMockMessage({ content: 'Resp' });

      await store.createChat({ chat });

      mockStreamChatCompletion.mockImplementation(gatedStream([responseMsg]));

      await store.sendMessage({ chat, message: 'test', model: modelB, historyList: [] });

      // appendHistoryToModel 找不到 model-b → 返回 false → runningChat 不被清理
      expect(store.runningChat[chat.id][modelB.id]).toEqual(
        expect.objectContaining({
          isSending: false,
          history: responseMsg,
        }),
      );
    });
  });

  describe('updateMetaInList - findIndex 精确匹配验证', () => {
    it('多 chat 场景下只有目标 chat 的 meta 被更新', async () => {
      const chat1 = createMockChat({ id: 'meta-f1', name: 'Chat1' });
      const chat2 = createMockChat({ id: 'meta-f2', name: 'Chat2' });
      const chat3 = createMockChat({ id: 'meta-f3', name: 'Chat3' });

      await store.createChat({ chat: chat1 });
      await store.createChat({ chat: chat2 });
      await store.createChat({ chat: chat3 });

      // 只更新 chat2
      await store.editChatName({ id: 'meta-f2', name: 'Updated2' });

      const meta1 = store.chatMetaList.find((m) => m.id === 'meta-f1');
      const meta2 = store.chatMetaList.find((m) => m.id === 'meta-f2');
      const meta3 = store.chatMetaList.find((m) => m.id === 'meta-f3');

      // 只有 meta2 被更新
      expect(meta2?.name).toBe('Updated2');
      expect(meta2?.isManuallyNamed).toBe(true);
      expect(meta2?.updatedAt).toEqual(expect.any(Number));

      // meta1 和 meta3 完全不变
      expect(meta1?.name).toBe('Chat1');
      expect(meta1?.isManuallyNamed).toBeUndefined();
      expect(meta3?.name).toBe('Chat3');
      expect(meta3?.isManuallyNamed).toBeUndefined();
    });
  });

  describe('clearError - 块变异覆盖', () => {
    it('clearError 应将 error 设为 null', () => {
      store.clearError();

      expect(store.error).toBeNull();
    });
  });
});
