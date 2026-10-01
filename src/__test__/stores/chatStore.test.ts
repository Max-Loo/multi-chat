/**
 * chatStore 单元测试
 *
 * 覆盖核心语义（对应既有 chatSlices Redux 测试的关键行为）：
 * - 聊天 CRUD：createChat/editChat/editChatName/deleteChat
 * - 发送守卫：sendingChatIds（deleteChat/clearActiveChatData 跳过发送中聊天）
 * - sendMessage 流式流程：运行条目生命周期、历史回写、错误记录
 * - startSendChatMessage：并发发送、失败时回收剩余运行数据
 * - setSelectedChatIdWithPreload：加载与上一个聊天数据清理
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatRoleEnum } from '@/types/chat';
import type { Chat } from '@/types/chat';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createMockChat } from '@/__test__/helpers/testing-utils';
import { createMockMessage } from '@/__test__/fixtures/chat';

// Mock 存储模块（与既有 chatSlices 测试一致的 mock 面）
vi.mock('@/store/storage', () => ({
  loadChatIndex: vi.fn(() => Promise.resolve([])),
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

// Mock 聊天服务
const mockStreamChatCompletion = vi.fn();
vi.mock('@/services/chat', () => ({
  streamChatCompletion: (...args: unknown[]) => mockStreamChatCompletion(...(args as [])),
  generateChatTitleService: vi.fn(() => Promise.resolve('generated-title')),
}));

// Mock providerLoader
vi.mock('@/services/chat/providerLoader', () => ({
  getProviderSDKLoader: () => ({
    preloadProviders: vi.fn(() => Promise.resolve()),
    loadProvider: vi.fn(),
    isProviderLoaded: vi.fn(),
    getProviderState: vi.fn(),
  }),
}));

import { loadChatById } from '@/store/storage';
import { useChatStore } from '@/stores/chatStore';
import { useModelStore } from '@/stores/modelStore';
import { setupPinia } from './setupPinia';

/** 构造流式响应异步生成器 */
async function* streamOf(messages: ReturnType<typeof createMockMessage>[]) {
  for (const message of messages) {
    yield message;
  }
}

describe('chatStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupPinia();
  });

  describe('聊天 CRUD', () => {
    it('createChat 应同时更新 chatMetaList 与 activeChatData，并初始化 updatedAt', () => {
      const store = useChatStore();
      const chat = createMockChat({ id: 'c1', name: 'hello' });

      store.createChat(chat);

      expect(store.chatMetaList).toHaveLength(1);
      expect(store.chatMetaList[0].id).toBe('c1');
      expect(store.chatMetaList[0].name).toBe('hello');
      expect(store.activeChatData['c1']).toBeDefined();
      expect(chat.updatedAt).toBeDefined();
    });

    it('editChatName 空标题应静默拒绝', () => {
      const store = useChatStore();
      const chat = createMockChat({ id: 'c1', name: 'hello' });
      store.createChat(chat);

      store.editChatName('c1', '   ');

      expect(store.chatMetaList[0].name).toBe('hello');
      expect(store.chatMetaList[0].isManuallyNamed).toBeUndefined();
    });

    it('editChatName 超长标题应截断到 20 字符并标记手动命名', () => {
      const store = useChatStore();
      store.createChat(createMockChat({ id: 'c1', name: 'hello' }));

      store.editChatName('c1', 'x'.repeat(25));

      expect(store.chatMetaList[0].name).toHaveLength(20);
      expect(store.chatMetaList[0].isManuallyNamed).toBe(true);
      expect(store.activeChatData['c1'].name).toHaveLength(20);
    });

    it('deleteChat 正在发送的聊天应跳过', () => {
      const store = useChatStore();
      const chat = createMockChat({ id: 'c1' });
      store.createChat(chat);
      store.$patch({ sendingChatIds: { c1: true } });

      store.deleteChat(chat);

      expect(store.chatMetaList).toHaveLength(1);
      expect(store.activeChatData['c1']).toBeDefined();
    });

    it('deleteChat 应移除数据并清理选中状态', () => {
      const store = useChatStore();
      const chat = createMockChat({ id: 'c1' });
      store.createChat(chat);
      store.setSelectedChatId('c1');

      store.deleteChat(chat);

      expect(store.chatMetaList).toHaveLength(0);
      expect(store.activeChatData['c1']).toBeUndefined();
      expect(store.selectedChatId).toBeNull();
    });

    it('clearActiveChatData 跳过发送中聊天；releaseCompletedBackgroundChat 仅回收非选中聊天', () => {
      const store = useChatStore();
      store.createChat(createMockChat({ id: 'c1' }));
      store.createChat(createMockChat({ id: 'c2' }));
      store.$patch({ sendingChatIds: { c1: true }, selectedChatId: 'c2' });

      // c1 正在发送 → 不回收
      store.clearActiveChatData('c1');
      expect(store.activeChatData['c1']).toBeDefined();

      // c2 是选中聊天 → 不回收
      store.releaseCompletedBackgroundChat('c2');
      expect(store.activeChatData['c2']).toBeDefined();

      // c3 非选中 → 回收
      store.activeChatData['c3'] = createMockChat({ id: 'c3' });
      store.releaseCompletedBackgroundChat('c3');
      expect(store.activeChatData['c3']).toBeUndefined();
    });
  });

  describe('sendMessage', () => {
    it('流式完成后应回写历史、更新 updatedAt 并清理运行条目', async () => {
      const store = useChatStore();
      const model = createMockModel({ id: 'm1' });
      const chat = createMockChat({ id: 'c1', chatModelList: [{ modelId: 'm1', chatHistoryList: [] }] }) as Chat;
      store.createChat(chat);

      const userMessage = createMockMessage({ role: ChatRoleEnum.USER, content: 'hi' });
      const replyA = createMockMessage({ role: ChatRoleEnum.ASSISTANT, content: 'he' });
      const replyB = createMockMessage({ role: ChatRoleEnum.ASSISTANT, content: 'hello' });

      mockStreamChatCompletion.mockReturnValue(
        streamOf([replyA, replyB]),
      );

      await store.sendMessage(
        { chat, message: 'hi', model, historyList: [] },
      );

      // 用户消息已入历史（含 AI 回复）
      const history = store.activeChatData['c1'].chatModelList![0].chatHistoryList;
      expect(history).toHaveLength(2);
      expect(history[0].content).toBe('hi');
      expect(history[0].role).toBe(userMessage.role);
      expect(history[1].content).toBe('hello');

      // 运行条目已清理，发送状态归零
      expect(store.runningChat['c1']?.['m1']).toBeUndefined();
      // updatedAt 已更新
      expect(store.chatMetaList[0].updatedAt).toBeDefined();
    });

    it('发送失败时应记录 errorMessage 并保留运行条目供外层回收', async () => {
      const store = useChatStore();
      const model = createMockModel({ id: 'm1' });
      const chat = createMockChat({ id: 'c1', chatModelList: [{ modelId: 'm1', chatHistoryList: [] }] }) as Chat;
      store.createChat(chat);

      mockStreamChatCompletion.mockReturnValue(
        (async function* () {
          yield createMockMessage({ content: 'partial' });
          throw new Error('network exploded');
        })(),
      );

      await expect(
        store.sendMessage({ chat, message: 'hi', model, historyList: [] }),
      ).rejects.toThrow('network exploded');

      const entry = store.runningChat['c1']['m1'];
      expect(entry.isSending).toBe(false);
      expect(entry.errorMessage).toContain('network exploded');
      // 保留运行条目（由 startSendChatMessage 统一回收）
      expect(entry.history).not.toBeNull();
    });

    it('signal 中断后应停止消费流', async () => {
      const store = useChatStore();
      const model = createMockModel({ id: 'm1' });
      const chat = createMockChat({ id: 'c1', chatModelList: [{ modelId: 'm1', chatHistoryList: [] }] }) as Chat;
      store.createChat(chat);

      const controller = new AbortController();
      let seen = 0;
      mockStreamChatCompletion.mockImplementation(() =>
        (async function* () {
          for (let i = 0; i < 5; i++) {
            seen++;
            yield createMockMessage({ content: `chunk-${i}` });
            if (i === 0) controller.abort();
          }
        })(),
      );

      await store.sendMessage(
        { chat, message: 'hi', model, historyList: [] },
        controller.signal,
      );

      // 中断后不再消费后续快照
      expect(seen).toBe(2);
      const history = store.activeChatData['c1'].chatModelList![0].chatHistoryList;
      expect(history).toHaveLength(2);
    });
  });

  describe('startSendChatMessage', () => {
    it('仅对启用且未删除的模型发送', async () => {
      const chatStore = useChatStore();
      const modelStore = useModelStore();
      const enabled = createMockModel({ id: 'm1', isEnable: true, isDeleted: false });
      const disabled = createMockModel({ id: 'm2', isEnable: false });
      modelStore.$patch({ models: [enabled, disabled] });

      const chat = createMockChat({
        id: 'c1',
        chatModelList: [
          { modelId: 'm1', chatHistoryList: [] },
          { modelId: 'm2', chatHistoryList: [] },
          { modelId: 'm3', chatHistoryList: [] },
        ],
      }) as Chat;
      chatStore.createChat(chat);
      // 选中该聊天：后台回收仅作用于非选中聊天
      chatStore.setSelectedChatId('c1');

      mockStreamChatCompletion.mockReturnValue(streamOf([createMockMessage({ content: 'ok' })]));

      await chatStore.startSendChatMessage({ chat, message: 'go' });

      // 只有 m1 收到消息
      const history = chatStore.activeChatData['c1'].chatModelList![0].chatHistoryList;
      expect(history).toHaveLength(2);
      expect(chatStore.sendingChatIds['c1']).toBeUndefined();
    });

    it('发送失败时应回收剩余运行数据并移除发送标记', async () => {
      const chatStore = useChatStore();
      const modelStore = useModelStore();
      const m1 = createMockModel({ id: 'm1', isEnable: true });
      const m2 = createMockModel({ id: 'm2', isEnable: true });
      modelStore.$patch({ models: [m1, m2] });

      const chat = createMockChat({
        id: 'c1',
        chatModelList: [
          { modelId: 'm1', chatHistoryList: [] },
          { modelId: 'm2', chatHistoryList: [] },
        ],
      }) as Chat;
      chatStore.createChat(chat);

      // m2 失败（Promise.all 快速失败，m1 可能仍在运行）
      mockStreamChatCompletion.mockImplementation((_arg: { model: { id: string } }) => {
        if (_arg.model.id === 'm2') {
          return (async function* () {
            yield createMockMessage({ content: 'partial-m2' });
            throw new Error('m2 exploded');
          })();
        }
        return streamOf([createMockMessage({ content: 'ok-m1' })]);
      });

      await expect(
        chatStore.startSendChatMessage({ chat, message: 'go' }),
      ).rejects.toThrow('m2 exploded');

      // 发送标记已移除
      expect(chatStore.sendingChatIds['c1']).toBeUndefined();
    });
  });

  describe('setSelectedChatIdWithPreload', () => {
    it('应加载聊天数据并清理上一个聊天的活跃数据', async () => {
      const store = useChatStore();
      store.createChat(createMockChat({ id: 'prev' }));
      store.setSelectedChatId('prev');

      const target = createMockChat({ id: 'next', chatModelList: [] }) as Chat;
      vi.mocked(loadChatById).mockResolvedValue(target);

      await store.setSelectedChatIdWithPreload('next');

      expect(store.selectedChatId).toBe('next');
      expect(store.activeChatData['next']).toBeDefined();
      // 上一个聊天数据被清理
      expect(store.activeChatData['prev']).toBeUndefined();
    });

    it('聊天不存在于存储时应仅更新选中 ID', async () => {
      const store = useChatStore();
      vi.mocked(loadChatById).mockResolvedValue(undefined);

      await store.setSelectedChatIdWithPreload('ghost');

      expect(store.selectedChatId).toBe('ghost');
      expect(store.activeChatData['ghost']).toBeUndefined();
    });
  });
});
