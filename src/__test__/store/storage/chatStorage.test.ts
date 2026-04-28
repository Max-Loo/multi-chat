/**
 * 聊天存储测试套件
 *
 * 测试 src/store/storage/chatStorage.ts 模块的功能
 * 覆盖 loadChatIndex、saveChatIndex、loadChatById、saveChatById、saveChatAndIndex、deleteChatFromStorage、migrateOldChatStorage 的所有场景
 */

// 使用 Map 模拟 storeUtils，避免模块级单例和 IndexedDB 初始化时序问题
const storeMap = new Map<string, unknown>();

vi.mock('@/store/storage/storeUtils', () => ({
  saveToStore: vi.fn(async (store: { init: () => Promise<void>; set: (k: string, v: unknown) => Promise<void>; save: () => Promise<void> }, key: string, data: unknown) => {
    await store.init();
    await store.set(key, data);
    await store.save();
  }),
  loadFromStore: vi.fn(async (store: { init: () => Promise<void>; get: (k: string) => Promise<unknown> }, key: string, defaultValue: unknown) => {
    await store.init();
    return (await store.get(key)) ?? defaultValue;
  }),
}));

vi.mock('@/utils/tauriCompat', () => ({
  createLazyStore: vi.fn(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    get: vi.fn((key: string) => Promise.resolve(storeMap.get(key) ?? null)),
    set: vi.fn((key: string, value: unknown) => { storeMap.set(key, value); return Promise.resolve(); }),
    delete: vi.fn((key: string) => { storeMap.delete(key); return Promise.resolve(); }),
    keys: vi.fn(() => Promise.resolve([...storeMap.keys()])),
    save: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
    isSupported: vi.fn().mockReturnValue(true),
  })),
}));

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Chat, ChatMeta } from '@/types/chat';
import {
  loadChatIndex,
  saveChatIndex,
  loadChatById,
  saveChatById,
  saveChatAndIndex,
  deleteChatFromStorage,
  migrateOldChatStorage,
} from '@/store/storage/chatStorage';
describe('聊天存储', () => {

  /** 每个测试前清空 Map 存储，确保测试隔离 */
  beforeEach(() => {
    storeMap.clear();
    vi.clearAllMocks();
  });

  describe('loadChatIndex', () => {
    it('数据不存在时应该返回空数组', async () => {
      const index = await loadChatIndex();

      expect(index).toEqual([]);
    });
  });

  describe('saveChatIndex + loadChatIndex', () => {
    it('应该成功保存并读取索引', async () => {
      const metaList: ChatMeta[] = [
        { id: 'chat-1', name: 'Chat 1', modelIds: ['model-1'], isDeleted: false },
        { id: 'chat-2', name: 'Chat 2', modelIds: ['model-2'], isDeleted: false },
      ];

      await saveChatIndex(metaList);
      const loaded = await loadChatIndex();

      expect(loaded).toEqual(metaList);
    });

    it('应该成功保存空索引', async () => {
      await saveChatIndex([]);
      const loaded = await loadChatIndex();

      expect(loaded).toEqual([]);
    });
  });

  describe('saveChatById + loadChatById', () => {
    it('应该成功保存并读取单个聊天', async () => {
      const chat: Chat = {
        id: 'chat-1',
        name: 'Test Chat 1',
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
        isDeleted: false,
      };

      await saveChatById('chat-1', chat);
      const loaded = await loadChatById('chat-1');

      expect(loaded).toEqual(chat);
    });

    it('不存在时应该返回 undefined', async () => {
      const loaded = await loadChatById('non-existent');

      expect(loaded).toBeUndefined();
    });
  });

  describe('saveChatAndIndex', () => {
    it('应该同时写入聊天数据和更新索引', async () => {
      const chat: Chat = {
        id: 'chat-1',
        name: 'Test Chat',
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
        isDeleted: false,
      };

      await saveChatAndIndex('chat-1', chat, []);

      const loadedChat = await loadChatById('chat-1');
      const loadedIndex = await loadChatIndex();

      expect(loadedChat).toEqual(chat);
      expect(loadedIndex).toHaveLength(1);
      expect(loadedIndex[0].id).toBe('chat-1');
    });

    it('应该在已有索引中更新而非重复添加', async () => {
      const chat: Chat = {
        id: 'chat-1',
        name: 'Updated Chat',
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
        isDeleted: false,
      };

      const existingIndex: ChatMeta[] = [
        { id: 'chat-1', name: 'Old Chat', modelIds: [], isDeleted: false },
      ];

      await saveChatAndIndex('chat-1', chat, existingIndex);

      const loadedIndex = await loadChatIndex();

      expect(loadedIndex).toHaveLength(1);
      expect(loadedIndex[0].name).toBe('Updated Chat');
    });
  });

  describe('deleteChatFromStorage', () => {
    it('应该标记聊天为已删除并更新索引', async () => {
      const chat: Chat = {
        id: 'chat-1',
        name: 'Test Chat',
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
        isDeleted: false,
      };

      // 先保存
      await saveChatAndIndex('chat-1', chat, []);

      // 再删除
      const index = await loadChatIndex();
      await deleteChatFromStorage('chat-1', index);

      // 验证聊天数据被标记为删除
      const loadedChat = await loadChatById('chat-1');
      expect(loadedChat?.isDeleted).toBe(true);

      // 验证索引已更新
      const loadedIndex = await loadChatIndex();
      expect(loadedIndex[0].isDeleted).toBe(true);
    });
  });

  describe('migrateOldChatStorage', () => {
    it('无旧数据时应该初始化空索引', async () => {
      await migrateOldChatStorage();

      const index = await loadChatIndex();
      expect(index).toEqual([]);
    });
  });
});
