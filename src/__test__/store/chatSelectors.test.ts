/**
 * chatSelectors 组合式选择器单元测试
 *
 * 验证 useSelectedChat、useChatMetaList、useSelectedChatMeta 的输入-输出映射
 * 转写自 Redux selectors 测试，行为断言保持一致
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useChatStore } from '@/store/chat';
import {
  useSelectedChat,
  useChatMetaList,
  useSelectedChatMeta,
} from '@/store/selectors/chatSelectors';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';
import type { ChatMeta } from '@/types/chat';

describe('useSelectedChat', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应该返回匹配的聊天对象（从 activeChatData 获取）', () => {
    const chatStore = useChatStore();
    const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });
    const chat2 = createMockChat({ id: 'chat-2', name: 'Chat 2' });

    chatStore.chatMetaList = [
      { id: 'chat-1', name: 'Chat 1', modelIds: [], isDeleted: false },
      { id: 'chat-2', name: 'Chat 2', modelIds: [], isDeleted: false },
    ] as ChatMeta[];
    chatStore.activeChatData = { 'chat-1': chat1, 'chat-2': chat2 };
    chatStore.selectedChatId = 'chat-1';

    const selectedChat = useSelectedChat();
    const result = selectedChat.value;

    expect(result).toBeDefined();
    expect(result?.id).toBe('chat-1');
    expect(result?.name).toBe('Chat 1');
  });

  it('应该在未选中时返回 undefined', () => {
    const chatStore = useChatStore();
    const chat1 = createMockChat({ id: 'chat-1' });

    chatStore.chatMetaList = [{ id: 'chat-1', name: 'Chat 1', modelIds: [], isDeleted: false }];
    chatStore.activeChatData = { 'chat-1': chat1 };
    chatStore.selectedChatId = null;

    const selectedChat = useSelectedChat();

    expect(selectedChat.value).toBeUndefined();
  });

  it('应该在 activeChatData 中无匹配时返回 undefined', () => {
    const chatStore = useChatStore();

    chatStore.chatMetaList = [{ id: 'chat-99', name: 'Chat 99', modelIds: [], isDeleted: false }];
    chatStore.activeChatData = {};
    chatStore.selectedChatId = 'chat-99';

    const selectedChat = useSelectedChat();

    expect(selectedChat.value).toBeUndefined();
  });

  it('应该在选择变化时更新返回值', () => {
    const chatStore = useChatStore();
    const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });
    const chat2 = createMockChat({ id: 'chat-2', name: 'Chat 2' });

    chatStore.chatMetaList = [
      { id: 'chat-1', name: 'Chat 1', modelIds: [], isDeleted: false },
      { id: 'chat-2', name: 'Chat 2', modelIds: [], isDeleted: false },
    ];
    chatStore.activeChatData = { 'chat-1': chat1, 'chat-2': chat2 };

    chatStore.selectedChatId = 'chat-1';
    const selectedChat = useSelectedChat();
    expect(selectedChat.value?.id).toBe('chat-1');

    chatStore.selectedChatId = 'chat-2';
    expect(selectedChat.value?.id).toBe('chat-2');
  });
});

describe('useChatMetaList', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应该返回活跃聊天元数据列表', () => {
    const chatStore = useChatStore();
    const metaList: ChatMeta[] = [
      { id: 'chat-1', name: 'Chat 1', modelIds: [], isDeleted: false },
      { id: 'chat-2', name: 'Chat 2', modelIds: [], isDeleted: false },
    ];
    chatStore.chatMetaList = metaList;

    const chatMetaList = useChatMetaList();

    expect(chatMetaList.value).toEqual(metaList);
  });
});

describe('useSelectedChatMeta', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应该返回选中聊天的元数据', () => {
    const chatStore = useChatStore();
    const metaList: ChatMeta[] = [
      { id: 'chat-1', name: 'Chat 1', modelIds: [], isDeleted: false },
      { id: 'chat-2', name: 'Chat 2', modelIds: [], isDeleted: false },
    ];
    chatStore.chatMetaList = metaList;
    chatStore.selectedChatId = 'chat-2';

    const selectedChatMeta = useSelectedChatMeta();

    expect(selectedChatMeta.value?.id).toBe('chat-2');
    expect(selectedChatMeta.value?.name).toBe('Chat 2');
  });

  it('应该在未选中时返回 undefined', () => {
    const chatStore = useChatStore();
    chatStore.chatMetaList = [{ id: 'chat-1', name: 'Chat 1', modelIds: [], isDeleted: false }];
    chatStore.selectedChatId = null;

    const selectedChatMeta = useSelectedChatMeta();

    expect(selectedChatMeta.value).toBeUndefined();
  });
});
