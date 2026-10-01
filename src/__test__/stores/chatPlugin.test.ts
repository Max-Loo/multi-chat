/**
 * chatPlugin 单元测试
 *
 * 覆盖：action 后持久化（createChat/editChatName/deleteChat）、
 * 自动命名触发条件（对应 chat-auto-naming spec 的核心场景）。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Chat } from '@/types/chat';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createMockChat } from '@/__test__/helpers/testing-utils';
import { createMockMessage } from '@/__test__/fixtures/chat';

const mockLoadChatIndex = vi.fn(() => Promise.resolve([]));
const mockLoadChatById = vi.fn((_id?: string): Promise<Chat | undefined> => Promise.resolve(undefined));
const mockSaveChatAndIndex = vi.fn(() => Promise.resolve(undefined));
const mockDeleteChatFromStorage = vi.fn(() => Promise.resolve(undefined));

vi.mock('@/store/storage', () => ({
  loadChatIndex: (...args: unknown[]) => mockLoadChatIndex(...(args as [])),
  loadChatById: (...args: unknown[]) => mockLoadChatById(...(args as [])),
  saveChatIndex: vi.fn(() => Promise.resolve(undefined)),
  saveChatById: vi.fn(() => Promise.resolve(undefined)),
  saveChatAndIndex: (...args: unknown[]) => mockSaveChatAndIndex(...(args as [])),
  deleteChatFromStorage: (...args: unknown[]) => mockDeleteChatFromStorage(...(args as [])),
  migrateOldChatStorage: vi.fn(() => Promise.resolve(undefined)),
  loadModelsFromJson: vi.fn(() => Promise.resolve([])),
  saveModelsToJson: vi.fn(() => Promise.resolve(undefined)),
  createLazyStore: vi.fn(() => globalThis.__createMemoryStorageMock()),
  saveToStore: vi.fn(() => Promise.resolve()),
  loadFromStore: vi.fn(() => Promise.resolve()),
}));

const mockGenerateChatTitle = vi.fn(() => Promise.resolve('AI 生成的标题'));
const mockStreamChatCompletion = vi.fn();

vi.mock('@/services/chat', () => ({
  streamChatCompletion: (...args: unknown[]) => mockStreamChatCompletion(...(args as [])),
  generateChatTitleService: (...args: unknown[]) => mockGenerateChatTitle(...(args as [])),
}));

vi.mock('@/services/chat/providerLoader', () => ({
  getProviderSDKLoader: () => ({
    preloadProviders: vi.fn(() => Promise.resolve()),
    loadProvider: vi.fn(),
    isProviderLoaded: vi.fn(),
    getProviderState: vi.fn(),
  }),
}));

import { useChatStore } from '@/stores/chatStore';
import { useAppConfigStore } from '@/stores/appConfigStore';
import { setupPinia } from './setupPinia';
import { ChatMeta, ChatRoleEnum } from '@/types/chat';

/** 等待插件异步副作用完成 */
const flushPluginEffects = () => new Promise((resolve) => setTimeout(resolve, 0));

async function* streamOf(messages: ReturnType<typeof createMockMessage>[]) {
  for (const message of messages) {
    yield message;
  }
}

describe('chatPlugin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setupPinia();
  });

  describe('持久化', () => {
    it('createChat 后应保存聊天与索引', async () => {
      const store = useChatStore();

      store.createChat(createMockChat({ id: 'c1' }));
      await flushPluginEffects();

      expect(mockSaveChatAndIndex).toHaveBeenCalledTimes(1);
      expect(mockSaveChatAndIndex).toHaveBeenCalledWith('c1', expect.anything(), []);
    });

    it('editChatName 聊天未加载时应从存储读取并应用重命名后保存', async () => {
      const stored = createMockChat({ id: 'c9', name: 'old-name' });
      mockLoadChatById.mockResolvedValue(stored);

      const store = useChatStore();
      const meta: ChatMeta = {
        id: 'c9',
        name: 'old-name',
        modelIds: [],
        updatedAt: 123,
      };
      store.$patch({ chatMetaList: [meta] });

      // 不将 c9 加入 activeChatData，直接重命名
      store.editChatName('c9', 'renamed');
      await flushPluginEffects();

      expect(mockLoadChatById).toHaveBeenCalledWith('c9');
      expect(mockSaveChatAndIndex).toHaveBeenCalledWith(
        'c9',
        expect.objectContaining({ id: 'c9', name: 'renamed' }),
        [],
      );
    });

    it('deleteChat 后应调用 deleteChatFromStorage', async () => {
      const store = useChatStore();
      const chat = createMockChat({ id: 'c1' });
      store.createChat(chat);
      await flushPluginEffects();
      mockSaveChatAndIndex.mockClear();

      store.deleteChat(chat);
      await flushPluginEffects();

      expect(mockDeleteChatFromStorage).toHaveBeenCalledWith('c1', []);
      // 删除动作本身不再触发 saveChatAndIndex
      expect(mockSaveChatAndIndex).not.toHaveBeenCalled();
    });
  });

  describe('自动命名', () => {
    it('首轮对话完成且未手动命名时应触发标题生成并更新元数据', async () => {
      const chatStore = useChatStore();
      const appConfig = useAppConfigStore();
      appConfig.setAutoNamingEnabled(true);

      const model = createMockModel({ id: 'm1' });
      const chat = createMockChat({
        id: 'c1',
        name: '',
        chatModelList: [{ modelId: 'm1', chatHistoryList: [] }],
      }) as Chat;
      chatStore.createChat(chat);
      await flushPluginEffects();

      mockStreamChatCompletion.mockReturnValue(
        streamOf([createMockMessage({ role: ChatRoleEnum.ASSISTANT, content: '回复' })]),
      );

      await chatStore.sendMessage({ chat, message: '你好', model, historyList: [] });
      await flushPluginEffects();
      await flushPluginEffects();

      // 标题生成服务被调用，元数据被更新
      expect(mockGenerateChatTitle).toHaveBeenCalledTimes(1);
      expect(chatStore.chatMetaList[0].name).toBe('AI 生成的标题');
    });

    it('手动命名过的聊天不应触发标题生成', async () => {
      const chatStore = useChatStore();

      const model = createMockModel({ id: 'm1' });
      const chat = createMockChat({
        id: 'c1',
        name: '',
        isManuallyNamed: true,
        chatModelList: [{ modelId: 'm1', chatHistoryList: [] }],
      }) as Chat;
      chatStore.createChat(chat);
      await flushPluginEffects();

      mockStreamChatCompletion.mockReturnValue(
        streamOf([createMockMessage({ role: ChatRoleEnum.ASSISTANT, content: '回复' })]),
      );

      await chatStore.sendMessage({ chat, message: '你好', model, historyList: [] });
      await flushPluginEffects();

      expect(mockGenerateChatTitle).not.toHaveBeenCalled();
    });

    it('自动命名开关关闭时不应触发标题生成', async () => {
      const chatStore = useChatStore();
      const appConfig = useAppConfigStore();
      appConfig.setAutoNamingEnabled(false);

      const model = createMockModel({ id: 'm1' });
      const chat = createMockChat({
        id: 'c1',
        name: '',
        chatModelList: [{ modelId: 'm1', chatHistoryList: [] }],
      }) as Chat;
      chatStore.createChat(chat);
      await flushPluginEffects();

      mockStreamChatCompletion.mockReturnValue(
        streamOf([createMockMessage({ role: ChatRoleEnum.ASSISTANT, content: '回复' })]),
      );

      await chatStore.sendMessage({ chat, message: '你好', model, historyList: [] });
      await flushPluginEffects();

      expect(mockGenerateChatTitle).not.toHaveBeenCalled();
    });

    it('已有标题的聊天不应触发标题生成', async () => {
      const chatStore = useChatStore();

      const model = createMockModel({ id: 'm1' });
      const chat = createMockChat({
        id: 'c1',
        name: '已有标题',
        chatModelList: [{ modelId: 'm1', chatHistoryList: [] }],
      }) as Chat;
      chatStore.createChat(chat);
      await flushPluginEffects();

      mockStreamChatCompletion.mockReturnValue(
        streamOf([createMockMessage({ role: ChatRoleEnum.ASSISTANT, content: '回复' })]),
      );

      await chatStore.sendMessage({ chat, message: '你好', model, historyList: [] });
      await flushPluginEffects();

      expect(mockGenerateChatTitle).not.toHaveBeenCalled();
    });
  });
});
