/**
 * chatExport.ts 单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Chat, ChatMeta } from '@/types/chat';
import { exportAllChats, exportDeletedChats } from '@/services/chatExport';

// Mock chatStorage because 单元测试需隔离存储层实现
vi.mock('@/store/storage/chatStorage', () => ({
  loadChatIndex: vi.fn(),
  loadChatById: vi.fn(),
}));

// Mock package.json version because 测试环境需固定版本号
vi.mock('../../../../package.json', () => ({
  version: '1.0.0-test',
}));

import { loadChatIndex, loadChatById } from '@/store/storage/chatStorage';

/**
 * 创建模拟聊天元数据
 */
function createMockChatMeta(overrides: Partial<ChatMeta> = {}): ChatMeta {
  return {
    id: 'chat-1',
    modelIds: ['model-1'],
    ...overrides,
  };
}

/**
 * 创建模拟聊天对象
 */
function createMockChat(overrides: Partial<Chat> = {}): Chat {
  return {
    id: 'chat-1',
    ...overrides,
  };
}

describe('chatExport.ts 服务测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadAllChats', () => {
    // loadAllChats 是内部函数，通过 exportAllChats 间接测试
    // 设置所有聊天为活跃状态，使过滤不影响加载逻辑的验证

    it('应该返回全部聊天 当索引中的聊天均加载成功', async () => {
      const metas = [
        createMockChatMeta({ id: 'chat-1' }),
        createMockChatMeta({ id: 'chat-2' }),
        createMockChatMeta({ id: 'chat-3' }),
      ];
      vi.mocked(loadChatIndex).mockResolvedValue(metas);
      vi.mocked(loadChatById)
        .mockResolvedValueOnce(createMockChat({ id: 'chat-1' }))
        .mockResolvedValueOnce(createMockChat({ id: 'chat-2' }))
        .mockResolvedValueOnce(createMockChat({ id: 'chat-3' }));

      const result = await exportAllChats();

      expect(result.chats).toHaveLength(3);
      expect(result.chats.map(c => c.id)).toEqual(['chat-1', 'chat-2', 'chat-3']);
    });

    it('应该仅返回成功加载的聊天 当部分加载返回 undefined', async () => {
      const metas = [
        createMockChatMeta({ id: 'chat-1' }),
        createMockChatMeta({ id: 'chat-2' }),
        createMockChatMeta({ id: 'chat-3' }),
      ];
      vi.mocked(loadChatIndex).mockResolvedValue(metas);
      vi.mocked(loadChatById)
        .mockResolvedValueOnce(createMockChat({ id: 'chat-1' }))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(createMockChat({ id: 'chat-3' }));

      const result = await exportAllChats();

      expect(result.chats).toHaveLength(2);
      expect(result.chats.map(c => c.id)).toEqual(['chat-1', 'chat-3']);
    });

    it('应该返回空数组 当索引为空', async () => {
      vi.mocked(loadChatIndex).mockResolvedValue([]);

      const result = await exportAllChats();

      expect(result.chats).toEqual([]);
    });
  });

  describe('exportAllChats', () => {
    it('应该仅返回活跃聊天 当存储中包含已删除聊天', async () => {
      const metas = [
        createMockChatMeta({ id: 'chat-1' }),
        createMockChatMeta({ id: 'chat-2' }),
        createMockChatMeta({ id: 'chat-3' }),
      ];
      vi.mocked(loadChatIndex).mockResolvedValue(metas);
      vi.mocked(loadChatById)
        .mockResolvedValueOnce(createMockChat({ id: 'chat-1' }))
        .mockResolvedValueOnce(createMockChat({ id: 'chat-2', isDeleted: true }))
        .mockResolvedValueOnce(createMockChat({ id: 'chat-3' }));

      const result = await exportAllChats();

      expect(result.chats).toHaveLength(2);
      expect(result.chats.map(c => c.id)).toEqual(['chat-1', 'chat-3']);
      expect(result.chats.every(c => c.isDeleted !== true)).toBe(true);
    });

    it('应该返回全部聊天 当所有聊天均未删除', async () => {
      const metas = [
        createMockChatMeta({ id: 'chat-1' }),
        createMockChatMeta({ id: 'chat-2' }),
      ];
      vi.mocked(loadChatIndex).mockResolvedValue(metas);
      vi.mocked(loadChatById)
        .mockResolvedValueOnce(createMockChat({ id: 'chat-1' }))
        .mockResolvedValueOnce(createMockChat({ id: 'chat-2' }));

      const result = await exportAllChats();

      expect(result.chats).toHaveLength(2);
    });

    it('应该返回空 chats 数组 当所有聊天均已删除', async () => {
      const metas = [
        createMockChatMeta({ id: 'chat-1' }),
        createMockChatMeta({ id: 'chat-2' }),
      ];
      vi.mocked(loadChatIndex).mockResolvedValue(metas);
      vi.mocked(loadChatById)
        .mockResolvedValueOnce(createMockChat({ id: 'chat-1', isDeleted: true }))
        .mockResolvedValueOnce(createMockChat({ id: 'chat-2', isDeleted: true }));

      const result = await exportAllChats();

      expect(result.chats).toEqual([]);
    });

    it('应该返回正确格式 当存储为空', async () => {
      vi.mocked(loadChatIndex).mockResolvedValue([]);

      const result = await exportAllChats();

      expect(result.chats).toEqual([]);
      expect(result.exportedAt).toBeDefined();
      expect(result.version).toBeDefined();
    });
  });

  describe('exportDeletedChats', () => {
    it('应该仅返回已删除聊天 当存储中包含混合数据', async () => {
      const metas = [
        createMockChatMeta({ id: 'chat-1' }),
        createMockChatMeta({ id: 'chat-2' }),
        createMockChatMeta({ id: 'chat-3' }),
      ];
      vi.mocked(loadChatIndex).mockResolvedValue(metas);
      vi.mocked(loadChatById)
        .mockResolvedValueOnce(createMockChat({ id: 'chat-1' }))
        .mockResolvedValueOnce(createMockChat({ id: 'chat-2', isDeleted: true }))
        .mockResolvedValueOnce(createMockChat({ id: 'chat-3', isDeleted: true }));

      const result = await exportDeletedChats();

      expect(result.chats).toHaveLength(2);
      expect(result.chats.map(c => c.id)).toEqual(['chat-2', 'chat-3']);
      expect(result.chats.every(c => c.isDeleted === true)).toBe(true);
    });

    it('应该返回空 chats 数组 当无已删除聊天', async () => {
      const metas = [
        createMockChatMeta({ id: 'chat-1' }),
        createMockChatMeta({ id: 'chat-2' }),
      ];
      vi.mocked(loadChatIndex).mockResolvedValue(metas);
      vi.mocked(loadChatById)
        .mockResolvedValueOnce(createMockChat({ id: 'chat-1' }))
        .mockResolvedValueOnce(createMockChat({ id: 'chat-2' }));

      const result = await exportDeletedChats();

      expect(result.chats).toEqual([]);
    });
  });

  describe('导出格式校验', () => {
    it('应该返回正确格式 当验证 exportedAt、version、chats 字段', async () => {
      vi.mocked(loadChatIndex).mockResolvedValue([
        createMockChatMeta({ id: 'chat-1' }),
      ]);
      vi.mocked(loadChatById).mockResolvedValueOnce(
        createMockChat({ id: 'chat-1' }),
      );

      const result = await exportAllChats();

      // exportedAt 应为 ISO 8601 格式
      expect(result.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      // version 应为非空字符串
      expect(typeof result.version).toBe('string');
      expect(result.version.length).toBeGreaterThan(0);
      // chats 应为数组
      expect(Array.isArray(result.chats)).toBe(true);
    });
  });
});
