import { describe, it, expect } from 'vitest';
import { useExistingChatList } from '@/hooks/useExistingChatList';
import { renderHookWithProviders } from '@/__test__/helpers/render/redux';
import { createChatSliceState } from '@/__test__/helpers/mocks/testState';
import type { ChatMeta } from '@/types/chat';

/**
 * 创建 Mock ChatMeta 对象
 * @param overrides 要覆盖的字段
 * @returns ChatMeta 对象
 */
const createMockChatMeta = (overrides?: Partial<ChatMeta>): ChatMeta => ({
  id: 'test-meta-id',
  modelIds: [],
  ...overrides,
});

describe('useExistingChatList', () => {

  describe('获取聊天列表测试', () => {
    it('应返回完整的元数据数组', () => {
      const meta1 = createMockChatMeta({ id: 'chat-1' });
      const meta2 = createMockChatMeta({ id: 'chat-2' });
      const meta3 = createMockChatMeta({ id: 'chat-3' });

      const { result } = renderHookWithProviders(() => useExistingChatList(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [meta1, meta2, meta3],
            selectedChatId: null,
          }),
        },
      });

      expect(result.current).toHaveLength(3);
      expect(result.current).toEqual([meta1, meta2, meta3]);
    });

    it('chatMetaList 已过滤 isDeleted，应直接返回列表内容', () => {
      // chatMetaList 在加载时已过滤掉 isDeleted 的条目
      const meta1 = createMockChatMeta({ id: 'chat-1' });
      const meta3 = createMockChatMeta({ id: 'chat-3' });

      const { result } = renderHookWithProviders(() => useExistingChatList(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [meta1, meta3],
            selectedChatId: null,
          }),
        },
      });

      expect(result.current).toHaveLength(2);
      expect(result.current).toEqual([meta1, meta3]);
    });

    it('应保留聊天顺序', () => {
      const meta1 = createMockChatMeta({ id: 'chat-1' });
      const meta2 = createMockChatMeta({ id: 'chat-2' });
      const meta3 = createMockChatMeta({ id: 'chat-3' });

      const { result } = renderHookWithProviders(() => useExistingChatList(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [meta1, meta2, meta3],
            selectedChatId: null,
          }),
        },
      });

      expect(result.current[0].id).toBe('chat-1');
      expect(result.current[1].id).toBe('chat-2');
      expect(result.current[2].id).toBe('chat-3');
    });
  });

  describe('空列表测试', () => {
    it('应返回空数组', () => {
      const { result } = renderHookWithProviders(() => useExistingChatList(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [],
            selectedChatId: null,
          }),
        },
      });

      expect(result.current).toEqual([]);
      expect(result.current).toHaveLength(0);
    });

    it('当所有聊天都已删除时 chatMetaList 为空，应返回空数组', () => {
      // chatMetaList 在加载时已过滤掉已删除的聊天
      const { result } = renderHookWithProviders(() => useExistingChatList(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [],
            selectedChatId: null,
          }),
        },
      });

      expect(result.current).toEqual([]);
      expect(result.current).toHaveLength(0);
    });
  });

  describe('Memoization 测试', () => {
    it('应在 chatMetaList 不变时返回相同的引用', () => {
      const meta1 = createMockChatMeta({ id: 'chat-1' });

      const { result, rerender } = renderHookWithProviders(() => useExistingChatList(), {
        preloadedState: {
          chat: createChatSliceState({
            chatMetaList: [meta1],
            selectedChatId: null,
          }),
        },
      });

      const firstResult = result.current;

      rerender();

      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });
  });
});
