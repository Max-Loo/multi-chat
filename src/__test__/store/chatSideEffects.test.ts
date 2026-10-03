/**
 * chat store 副作用测试（自动标题生成与聊天持久化）
 *
 * 转写自 Redux middleware 测试（src/__test__/store/middleware/chatMiddleware.test.ts），
 * 原 Listener Middleware 的副作用已并入 useChatStore（action 完成后直接调用持久化/标题生成逻辑），
 * 行为断言保持一致。
 *
 * 转写对照说明：
 * - 原 "dispatch X action 后 middleware 应该保存" → "调用 store.x() 方法后应调用 mock 的保存函数"
 * - 原监听 sendMessage.fulfilled 触发自动命名 → 调用 store.sendMessage(...) 完成后断言
 *   generateChatTitleService 被调用（generateChatName 的服务调用等价于原 chat/generateName/pending action）
 * - 原模块级 generatingTitleChatIds 锁 → Pinia store 实例内锁（每个 createPinia() 实例隔离），
 *   resetChatMiddleware() → store.resetChatStore()
 * - 原 "generateChatName fulfilled 无 chat.id 时不清除锁" 为 Redux action meta 的实现细节，
 *   Pinia 实现中锁由 try/finally 无条件释放，该场景已由 fulfilled/rejected 释放锁用例覆盖
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { Chat, ChatMeta, ChatModel, ChatRoleEnum, StandardMessage } from '@/types/chat';
import { createMockModel } from '@/__test__/helpers/fixtures/model';

// Mock 存储层 - 必须在导入 store 之前执行
const { mockLoadChatIndex, mockLoadChatById, mockSaveChatAndIndex, mockDeleteChatFromStorage } = vi.hoisted(() => ({
  mockLoadChatIndex: vi.fn<() => Promise<ChatMeta[]>>(() => Promise.resolve([])),
  mockLoadChatById: vi.fn<(chatId: string) => Promise<Chat | undefined>>(() => Promise.resolve(undefined)),
  mockSaveChatAndIndex: vi.fn<(chatId: string, chat: Chat, index: ChatMeta[]) => Promise<void>>(
    () => Promise.resolve(undefined)
  ),
  mockDeleteChatFromStorage: vi.fn<(chatId: string, index: ChatMeta[]) => Promise<void>>(
    () => Promise.resolve(undefined)
  ),
}));

// Mock 聊天服务（流式响应与标题生成）
const { mockStreamChatCompletion, mockGenerateChatTitleService } = vi.hoisted(() => ({
  mockStreamChatCompletion: vi.fn(),
  mockGenerateChatTitleService: vi.fn(),
}));

vi.mock('@/store/storage/chatStorage', () => ({
  loadChatIndex: mockLoadChatIndex,
  loadChatById: mockLoadChatById,
  saveChatAndIndex: mockSaveChatAndIndex,
  deleteChatFromStorage: mockDeleteChatFromStorage,
}));

// chat store 的依赖图经由 storage/index 引入 modelStorage，一并 mock 隔离加密/密钥依赖
vi.mock('@/store/storage/modelStorage', () => ({
  loadModelsFromJson: vi.fn(() => Promise.resolve({ models: [], decryptionFailureCount: 0 })),
  saveModelsToJson: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock('@/services/chat', () => ({
  streamChatCompletion: mockStreamChatCompletion,
  generateChatTitleService: mockGenerateChatTitleService,
}));

vi.mock('@/services/i18n', () => ({
  changeAppLanguage: vi.fn(() => Promise.resolve({ success: true })),
  tSafely: (_key: string, fallback: string) => fallback,
}));

vi.mock('@/services/toast', () => ({
  toastQueue: {
    loading: vi.fn(() => Promise.resolve('loading-id')),
    dismiss: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

import { useChatStore } from '@/store/chat';
import { useAppConfigStore } from '@/store/appConfig';
import { useModelsStore } from '@/store/models';

/**
 * 构造 StandardMessage 测试消息
 */
const createMessage = (id: string, role: ChatRoleEnum, content: string): StandardMessage => ({
  id,
  role,
  content,
  timestamp: 0,
  modelKey: 'model-auto',
  finishReason: null,
});

/**
 * 构造符合 Chat 接口的测试聊天数据
 */
const createChatData = (id: string, name = '', chatModelList: ChatModel[] = []): Chat => ({
  id,
  name,
  chatModelList,
});

/**
 * 构造默认的流式响应 mock（返回单条助手消息后结束）
 */
const mockDefaultStream = () => {
  mockStreamChatCompletion.mockImplementation(() =>
    // oxlint-disable-next-line require-yield -- 失败流生成器（无产出）
    (async function* () {
      yield createMessage('assistant-1', ChatRoleEnum.ASSISTANT, 'hello');
    })()
  );
};

describe('chat store 副作用（转写自 chatMiddleware）', () => {
  beforeEach(() => {
    // 全新 Pinia 实例：state 与 store 内部锁（generatingTitleChatIds）随之隔离
    setActivePinia(createPinia());

    // 重置存储层 mock
    mockLoadChatIndex.mockClear().mockResolvedValue([]);
    mockLoadChatById.mockClear().mockResolvedValue(undefined);
    mockSaveChatAndIndex.mockClear().mockResolvedValue(undefined);
    mockDeleteChatFromStorage.mockClear().mockResolvedValue(undefined);

    // 重置聊天服务 mock
    mockGenerateChatTitleService.mockClear().mockResolvedValue('Generated Title');
    mockDefaultStream();
  });

  describe('聊天消息发送触发保存', () => {
    it('应该在消息发送成功时触发保存', async () => {
      const store = useChatStore();
      const model = createMockModel({ id: 'model-auto', modelKey: 'model-auto' });
      useModelsStore().models.push(model);

      const chat = createChatData('chat1', 'Chat 1', [{ modelId: 'model-auto', chatHistoryList: [] }]);
      store.setActiveChatData({ chatId: 'chat1', chat });

      await store.startSendChatMessage({ chat, message: 'Hello' });

      // 等价断言：原 startSendChatMessage.fulfilled 监听器调用 saveChatAndIndex(chatId, chatData, index)
      expect(mockSaveChatAndIndex).toHaveBeenCalledTimes(1);
      expect(mockSaveChatAndIndex).toHaveBeenCalledWith(
        'chat1',
        expect.any(Object),
        expect.any(Array),
      );
    });

    it('应该在消息发送失败时触发保存', async () => {
      const store = useChatStore();
      const model = createMockModel({ id: 'model-auto', modelKey: 'model-auto' });
      useModelsStore().models.push(model);

      const chat = createChatData('chat-fail', 'Chat Fail', [{ modelId: 'model-auto', chatHistoryList: [] }]);
      store.setActiveChatData({ chatId: 'chat-fail', chat });

      // 模拟流式发送失败（原 startSendChatMessage.rejected 场景）
      mockStreamChatCompletion.mockImplementationOnce(() =>
        // oxlint-disable-next-line require-yield -- 失败流生成器（无产出）
        (async function* () {
          throw new Error('Send failed');
        })()
      );

      await expect(store.startSendChatMessage({ chat, message: 'Hello' })).rejects.toThrow('Send failed');

      // rejected 后 finally 中仍应持久化
      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalled();
      });
    });
  });

  describe('聊天操作触发保存', () => {
    it('应该在创建聊天时触发保存', async () => {
      const store = useChatStore();
      const newChat = createChatData('chat2', 'New Chat');

      await store.createChat({ chat: newChat });

      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalledTimes(1);
      });
    });

    it('应该在编辑聊天时触发保存', async () => {
      const store = useChatStore();
      const updatedChat = createChatData('chat1', 'Updated Chat');

      await store.editChat({ chat: updatedChat });

      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalledTimes(1);
      });
    });

    it('应该在编辑聊天名称时触发保存', async () => {
      const store = useChatStore();
      // 在 activeChatData 中预设聊天数据（从 activeChatData 获取持久化数据）
      const chat = createChatData('chat1', 'Chat 1');
      store.setActiveChatData({ chatId: 'chat1', chat });

      await store.editChatName({ name: 'New Name', id: 'chat1' });

      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalledTimes(1);
      });
    });

    it('应该在删除聊天时触发保存', async () => {
      const store = useChatStore();
      const chat = createChatData('chat1', 'Chat 1');

      await store.deleteChat({ chat });

      await vi.waitFor(() => {
        expect(mockDeleteChatFromStorage).toHaveBeenCalledTimes(1);
      });

      // 验证参数：deleteChatFromStorage(chatId, index)
      expect(mockDeleteChatFromStorage).toHaveBeenCalledWith('chat1', expect.any(Array));
    });
  });

  describe('非聊天操作不触发保存', () => {
    it('应该在非聊天操作时不触发保存', async () => {
      const store = useChatStore();

      // 调用不触发持久化的同步方法（等价于原 "dispatch 不相关 action"）
      store.setActiveChatData({ chatId: 'chat1', chat: createChatData('chat1', 'Chat 1') });
      store.setSelectedChatId('chat1');

      // 等待微任务与宏任务刷新，确保没有异步副作用
      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(mockSaveChatAndIndex).not.toHaveBeenCalled();
      expect(mockDeleteChatFromStorage).not.toHaveBeenCalled();
    });
  });

  describe('从 Store 获取最新状态', () => {
    it('应该传递最新的聊天数据给 saveChatAndIndex', async () => {
      const store = useChatStore();

      const newChat = createChatData('chat1', 'Test Chat');
      await store.createChat({ chat: newChat });

      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalledTimes(1);
      });

      // 验证传递了正确的参数（chatId, chatData, index）
      const [savedChatId, savedChatData] = mockSaveChatAndIndex.mock.calls[0];
      expect(savedChatId).toBe('chat1');
      expect(savedChatData).toEqual(expect.objectContaining({ id: 'chat1' }));
    });
  });

  describe('自动命名触发逻辑', () => {
    it('应该在四个条件全部满足时触发自动命名', async () => {
      const store = useChatStore();
      const chat = createChatData('auto-chat-001', '', [{ modelId: 'model-auto', chatHistoryList: [] }]);
      store.setActiveChatData({ chatId: chat.id, chat });
      // 默认 autoNamingEnabled 为 true，无需额外设置

      await store.sendMessage({
        chat,
        message: 'hi',
        model: createMockModel({ id: 'model-auto', modelKey: 'model-auto' }),
        historyList: [],
      });

      // 等价断言：原 generateChatName/pending action 出现 1 次
      expect(mockGenerateChatTitleService).toHaveBeenCalledTimes(1);
      // 标题生成成功后更新聊天名并持久化
      expect(store.activeChatData['auto-chat-001']?.name).toBe('Generated Title');
      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalled();
      });
    });

    it('应该不触发 当聊天已手动命名', async () => {
      const store = useChatStore();
      const chat = createChatData('auto-chat-002', '', [{ modelId: 'model-auto', chatHistoryList: [] }]);
      chat.isManuallyNamed = true;
      store.setActiveChatData({ chatId: chat.id, chat });

      await store.sendMessage({
        chat,
        message: 'hi',
        model: createMockModel({ id: 'model-auto', modelKey: 'model-auto' }),
        historyList: [],
      });

      expect(mockGenerateChatTitleService).not.toHaveBeenCalled();
    });

    it('应该不触发 当全局开关关闭', async () => {
      const store = useChatStore();
      useAppConfigStore().setAutoNamingEnabled(false);

      const chat = createChatData('auto-chat-003', '', [{ modelId: 'model-auto', chatHistoryList: [] }]);
      store.setActiveChatData({ chatId: chat.id, chat });

      await store.sendMessage({
        chat,
        message: 'hi',
        model: createMockModel({ id: 'model-auto', modelKey: 'model-auto' }),
        historyList: [],
      });

      expect(mockGenerateChatTitleService).not.toHaveBeenCalled();
    });

    it('应该不触发 当标题非空', async () => {
      const store = useChatStore();
      const chat = createChatData('auto-chat-004', '已有标题', [{ modelId: 'model-auto', chatHistoryList: [] }]);
      store.setActiveChatData({ chatId: chat.id, chat });

      await store.sendMessage({
        chat,
        message: 'hi',
        model: createMockModel({ id: 'model-auto', modelKey: 'model-auto' }),
        historyList: [],
      });

      expect(mockGenerateChatTitleService).not.toHaveBeenCalled();
    });

    it('应该不触发 当对话历史长度不等于 2', async () => {
      const store = useChatStore();
      // 初始历史 1 条，sendMessage 追加用户消息 + 助手回复后为 3 条（不等于 2）
      const chat = createChatData('auto-chat-005', '', [
        { modelId: 'model-auto', chatHistoryList: [createMessage('msg-0', ChatRoleEnum.USER, 'earlier')] },
      ]);
      store.setActiveChatData({ chatId: chat.id, chat });

      await store.sendMessage({
        chat,
        message: 'hi',
        model: createMockModel({ id: 'model-auto', modelKey: 'model-auto' }),
        historyList: [],
      });

      expect(mockGenerateChatTitleService).not.toHaveBeenCalled();
    });

    it('应该正确触发自动命名 当条件全部满足（单次发送）', async () => {
      const store = useChatStore();
      const chat = createChatData('auto-chat-006', '', [{ modelId: 'model-auto', chatHistoryList: [] }]);
      store.setActiveChatData({ chatId: chat.id, chat });

      await store.sendMessage({
        chat,
        message: 'hi',
        model: createMockModel({ id: 'model-auto', modelKey: 'model-auto' }),
        historyList: [],
      });

      // 单次发送只触发一次
      expect(mockGenerateChatTitleService).toHaveBeenCalledTimes(1);
    });

    it('应该只触发一次 当同一 chatId 并发发送两个模型', async () => {
      const store = useChatStore();
      const chat = createChatData('auto-chat-concurrent', '', [
        { modelId: 'model-auto', chatHistoryList: [] },
        { modelId: 'model-auto-2', chatHistoryList: [] },
      ]);
      store.setActiveChatData({ chatId: chat.id, chat });

      // 标题生成服务挂起，模拟生成进行中（锁被持有）
      const titleResolvers: Array<(value: string) => void> = [];
      mockGenerateChatTitleService.mockImplementation(
        () => new Promise<string>((resolve) => titleResolvers.push(resolve))
      );

      // 并发发送（等价于原连续 dispatch 两次 fulfilled action）
      const p1 = store.sendMessage({
        chat,
        message: 'hi',
        model: createMockModel({ id: 'model-auto', modelKey: 'model-auto' }),
        historyList: [],
      });
      const p2 = store.sendMessage({
        chat,
        message: 'hi',
        model: createMockModel({ id: 'model-auto-2', modelKey: 'model-auto-2' }),
        historyList: [],
      });

      // 第一次发送触发标题生成
      await vi.waitFor(() => {
        expect(mockGenerateChatTitleService).toHaveBeenCalledTimes(1);
      });

      // 刷新微任务让第二次发送到达锁检查
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // 内存锁已拦截，即使条件满足也不应再次触发
      expect(mockGenerateChatTitleService).toHaveBeenCalledTimes(1);

      // 释放挂起的标题生成，收尾
      titleResolvers.forEach((resolve) => resolve('Generated Title'));
      await Promise.all([p1, p2]);

      expect(mockGenerateChatTitleService).toHaveBeenCalledTimes(1);
    });

    it('应该在生成成功后释放内存锁 允许同一 chatId 再次触发', async () => {
      const store = useChatStore();
      const chat = createChatData('auto-chat-007', '', [{ modelId: 'model-auto', chatHistoryList: [] }]);
      store.setActiveChatData({ chatId: chat.id, chat });
      const model = createMockModel({ id: 'model-auto', modelKey: 'model-auto' });

      // 第一次发送触发自动命名，完成后锁释放
      await store.sendMessage({ chat, message: 'hi', model, historyList: [] });
      expect(mockGenerateChatTitleService).toHaveBeenCalledTimes(1);

      // 重置历史与标题，模拟同一聊天再次满足全部条件
      chat.chatModelList![0].chatHistoryList = [];
      chat.name = '';

      await store.sendMessage({ chat, message: 'hi again', model, historyList: [] });

      // 锁已释放，应该能再次触发
      expect(mockGenerateChatTitleService).toHaveBeenCalledTimes(2);
    });

    it('应该在生成失败后释放内存锁 允许同一 chatId 再次触发', async () => {
      const store = useChatStore();
      const chat = createChatData('auto-chat-008', '', [{ modelId: 'model-auto', chatHistoryList: [] }]);
      store.setActiveChatData({ chatId: chat.id, chat });
      const model = createMockModel({ id: 'model-auto', modelKey: 'model-auto' });

      // 第一次标题生成失败（generateChatName 内部静默捕获，finally 释放锁）
      mockGenerateChatTitleService.mockRejectedValueOnce(new Error('Network error'));
      await store.sendMessage({ chat, message: 'hi', model, historyList: [] });
      expect(mockGenerateChatTitleService).toHaveBeenCalledTimes(1);

      // 重置历史与标题后再次发送，锁已释放
      chat.chatModelList![0].chatHistoryList = [];
      chat.name = '';

      await store.sendMessage({ chat, message: 'hi again', model, historyList: [] });

      expect(mockGenerateChatTitleService).toHaveBeenCalledTimes(2);
    });
  });

  describe('后台聊天发送结束后回收 activeChatData', () => {
    it('应该在发送成功且非当前选中时回收 activeChatData', async () => {
      const store = useChatStore();
      const model = createMockModel({ id: 'model-auto', modelKey: 'model-auto' });
      useModelsStore().models.push(model);

      const chatA = createChatData('bg-chat-a', 'Chat A', [{ modelId: 'model-auto', chatHistoryList: [] }]);
      const chatB = createChatData('bg-chat-b', 'Chat B');

      // 创建两个聊天
      await store.createChat({ chat: chatA });
      await store.createChat({ chat: chatB });

      // 选中 chatB（用户已切走）
      store.setSelectedChatId('bg-chat-b');

      // 发送完成
      await store.startSendChatMessage({ chat: chatA, message: 'hi' });

      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalled();
      });

      // chatA 应该被回收
      expect(store.activeChatData['bg-chat-a']).toBeUndefined();
      // chatB 应该保留
      expect(store.activeChatData['bg-chat-b']).toBeDefined();
    });

    it('应该在发送失败且非当前选中时回收 activeChatData', async () => {
      const store = useChatStore();
      const model = createMockModel({ id: 'model-auto', modelKey: 'model-auto' });
      useModelsStore().models.push(model);

      const chatA = createChatData('bg-chat-c', 'Chat C', [{ modelId: 'model-auto', chatHistoryList: [] }]);
      await store.createChat({ chat: chatA });
      store.setSelectedChatId(null);

      // 模拟发送失败
      mockStreamChatCompletion.mockImplementationOnce(() =>
        // oxlint-disable-next-line require-yield -- 失败流生成器（无产出）
        (async function* () {
          throw new Error('fail');
        })()
      );

      await expect(store.startSendChatMessage({ chat: chatA, message: 'hi' })).rejects.toThrow('fail');

      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalled();
      });

      // 失败后同样回收
      expect(store.activeChatData['bg-chat-c']).toBeUndefined();
    });

    it('应该在用户已切回时保留 activeChatData', async () => {
      const store = useChatStore();
      const model = createMockModel({ id: 'model-auto', modelKey: 'model-auto' });
      useModelsStore().models.push(model);

      const chatA = createChatData('bg-chat-d', 'Chat D', [{ modelId: 'model-auto', chatHistoryList: [] }]);
      await store.createChat({ chat: chatA });
      // 当前选中的就是 chatA
      store.setSelectedChatId('bg-chat-d');

      await store.startSendChatMessage({ chat: chatA, message: 'hi' });

      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalled();
      });

      expect(store.activeChatData['bg-chat-d']).toBeDefined();
    });
  });

  describe('自动命名边界路径', () => {
    it('应该在 activeChatData 无聊天数据时不触发自动命名', async () => {
      const store = useChatStore();
      // 不调用 setActiveChatData，activeChatData 中无该聊天
      const chat = createChatData('auto-chat-noexist', '', [{ modelId: 'model-auto', chatHistoryList: [] }]);

      await store.sendMessage({
        chat,
        message: 'hi',
        model: createMockModel({ id: 'model-auto', modelKey: 'model-auto' }),
        historyList: [],
      });

      expect(mockGenerateChatTitleService).not.toHaveBeenCalled();
    });
  });

  describe('editChatName 存储路径', () => {
    it('应该在 activeChatData 无聊天时从存储加载并保存', async () => {
      const store = useChatStore();
      const storedChat = createChatData('chat-storage-1', 'Stored Chat');
      storedChat.isManuallyNamed = false;
      mockLoadChatById.mockResolvedValueOnce(storedChat);

      // 预设索引元数据（聊天数据未加载）
      store.setChatMetaList([
        { id: 'chat-storage-1', name: 'Stored Chat', isManuallyNamed: false, modelIds: [] },
      ]);

      await store.editChatName({ id: 'chat-storage-1', name: 'New Name' });

      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalled();
      });

      // 从存储加载的聊天被应用重命名后持久化
      const [savedChatId, savedChatData] = mockSaveChatAndIndex.mock.calls[0];
      expect(savedChatId).toBe('chat-storage-1');
      expect(savedChatData).toMatchObject({ name: 'New Name', isManuallyNamed: true });
    });

    it('应该在存储也无聊天时跳过保存', async () => {
      const store = useChatStore();
      mockLoadChatById.mockResolvedValueOnce(undefined);

      store.setChatMetaList([
        { id: 'chat-missing', name: 'Missing', isManuallyNamed: false, modelIds: [] },
      ]);

      await store.editChatName({ id: 'chat-missing', name: 'New Name' });

      // 等待异步链完成
      await new Promise((resolve) => setTimeout(resolve, 50));

      // 不应调用 saveChatAndIndex（chatData 为 undefined）
      expect(mockSaveChatAndIndex).not.toHaveBeenCalled();
    });
  });

  describe('resetChatStore()（原 resetChatMiddleware）', () => {
    it('应该在自动命名触发后清理标题生成锁', async () => {
      const store = useChatStore();
      const chat = createChatData('reset-test-chat', '', [
        { modelId: 'model-auto', chatHistoryList: [] },
        { modelId: 'model-auto-2', chatHistoryList: [] },
      ]);
      store.setActiveChatData({ chatId: chat.id, chat });

      // 标题生成服务挂起，模拟生成进行中（锁被持有）
      const titleResolvers: Array<(value: string) => void> = [];
      mockGenerateChatTitleService.mockImplementation(
        () => new Promise<string>((resolve) => titleResolvers.push(resolve))
      );

      const p1 = store.sendMessage({
        chat,
        message: 'hi',
        model: createMockModel({ id: 'model-auto', modelKey: 'model-auto' }),
        historyList: [],
      });
      await vi.waitFor(() => {
        expect(mockGenerateChatTitleService).toHaveBeenCalledTimes(1);
      });

      // 重置 store 内部锁（原 resetChatMiddleware）
      store.resetChatStore();

      // 重置后，同一 chatId 应能再次触发（锁已清理）
      const p2 = store.sendMessage({
        chat,
        message: 'hi',
        model: createMockModel({ id: 'model-auto-2', modelKey: 'model-auto-2' }),
        historyList: [],
      });
      await vi.waitFor(() => {
        expect(mockGenerateChatTitleService).toHaveBeenCalledTimes(2);
      });

      // 收尾：释放挂起的生成
      titleResolvers.forEach((resolve) => resolve('Generated Title'));
      await Promise.allSettled([p1, p2]);
    });
  });
});
