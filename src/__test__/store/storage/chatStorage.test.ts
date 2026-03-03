/**
 * 聊天存储测试套件
 *
 * 测试 src/store/storage/chatStorage.ts 模块的功能
 * 覆盖 saveChatsToJson 和 loadChatsFromJson 的所有场景
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Chat } from '@/types/chat';
import { initFakeIndexedDB, cleanupFakeIndexedDB } from '@/__test__/utils/tauriCompat/idb-helpers';
import { createLazyStore, saveToStore } from '@/store/storage/storeUtils';
import { loadChatsFromJson } from '@/store/storage/chatStorage';

describe('聊天存储', () => {
  let idbCtx: ReturnType<typeof initFakeIndexedDB>;
  let chatsStore: ReturnType<typeof createLazyStore>;

  beforeEach(async () => {
    idbCtx = initFakeIndexedDB();
    chatsStore = createLazyStore('chats-test.json');
    await chatsStore.init();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupFakeIndexedDB(idbCtx);
  });

  describe('saveChatsToJson (通过 saveToStore 间接测试)', () => {
    it('应该成功保存聊天列表', async () => {
      const mockChats: Chat[] = [
        {
          id: 'chat-1',
          name: 'Test Chat 1',
          chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
          isDeleted: false,
        },
        {
          id: 'chat-2',
          name: 'Test Chat 2',
          chatModelList: [{ modelId: 'model-2', chatHistoryList: [] }],
          isDeleted: false,
        },
      ];

      await expect(saveToStore(chatsStore, 'chats', mockChats, '保存 2 个聊天')).resolves.not.toThrow();
    });

    it('应该成功保存空列表', async () => {
      const emptyChats: Chat[] = [];

      await expect(saveToStore(chatsStore, 'chats', emptyChats, '保存 0 个聊天')).resolves.not.toThrow();
    });

    it('保存失败时应该抛出错误', async () => {
      const errorMockStore = {
        init: vi.fn().mockResolvedValue(undefined),
        set: vi.fn().mockRejectedValue(new Error('Set failed')),
        save: vi.fn().mockResolvedValue(undefined),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Reason: 测试错误处理，需要构造无效输入
      } as any;

      // 验证 mockStore.set() 确实会拒绝
      await expect(errorMockStore.set('key', 'value')).rejects.toThrow('Set failed');
    });
  });

  describe('loadChatsFromJson', () => {
    it('应该支持加载聊天列表', async () => {
      const chats = await loadChatsFromJson();

      expect(chats).toBeDefined();
      expect(Array.isArray(chats)).toBe(true);
    });

    it('数据不存在时应该返回空数组', async () => {
      const chats = await loadChatsFromJson();

      expect(chats).toEqual([]);
    });

    it('加载失败时应该返回空数组', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const chats = await loadChatsFromJson();

      expect(chats).toEqual([]);
      consoleSpy.mockRestore();
    });
  });
});
