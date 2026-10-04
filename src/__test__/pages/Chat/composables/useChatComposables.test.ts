/**
 * useBoard / useIsSending / useChatPageSelectedChat 组合式函数测试
 * （转写自 React pages/Chat/hooks 测试）
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useBoard } from '@/pages/Chat/composables/useBoard';
import { useIsSending } from '@/pages/Chat/composables/useIsSending';
import { useChatStore } from '@/store/chat';
import { createMockChat } from '@/__test__/helpers/mocks/chatSidebar';

describe('useBoard', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  /** 准备一个含多模型聊天的 store */
  function seedChat(modelCount: number): void {
    const chatStore = useChatStore();
    const chat = createMockChat({
      id: 'chat-1',
      chatModelList: Array.from({ length: modelCount }, (_, i) => ({
        modelId: `model-${i}`,
        chatHistoryList: [],
      })),
    });
    chatStore.chatMetaList = [
      { id: chat.id, name: chat.name, modelIds: [], isDeleted: false },
    ];
    chatStore.setActiveChatData({ chatId: chat.id, chat });
    chatStore.setSelectedChatId(chat.id);
  }

  it('应该按 columnCount 切分二维数组', async () => {
    seedChat(5);
    await nextTick();

    const { board } = useBoard(ref(2), ref(false));

    expect(board.value).toHaveLength(3);
    expect(board.value[0]).toHaveLength(2);
    expect(board.value[2]).toHaveLength(1);
  });

  it('单列时 board 应为一维等价', async () => {
    seedChat(3);
    await nextTick();

    const { board } = useBoard(ref(1), ref(false));

    expect(board.value).toHaveLength(3);
    expect(board.value.every((row) => row.length === 1)).toBe(true);
  });

  it('多模型且启用 splitter 时 shouldUseSplitter 为 true', async () => {
    seedChat(2);
    await nextTick();

    const { shouldUseSplitter } = useBoard(ref(2), ref(true));

    expect(shouldUseSplitter.value).toBe(true);
  });

  it('单模型时即使启用 splitter 也为 false', async () => {
    seedChat(1);
    await nextTick();

    const { shouldUseSplitter } = useBoard(ref(2), ref(true));

    expect(shouldUseSplitter.value).toBe(false);
  });
});

describe('useIsSending', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('无选中聊天时为 false', async () => {
    const { isSending } = useIsSending();

    expect(isSending.value).toBe(false);
  });

  it('选中聊天的任一模型发送中即为 true', async () => {
    const chatStore = useChatStore();
    const chat = createMockChat({
      id: 'chat-1',
      chatModelList: [{ modelId: 'm1', chatHistoryList: [] }],
    });
    chatStore.chatMetaList = [
      { id: chat.id, name: chat.name, modelIds: [], isDeleted: false },
    ];
    chatStore.setActiveChatData({ chatId: chat.id, chat });
    chatStore.setSelectedChatId(chat.id);
    chatStore.runningChat = {
      'chat-1': { m1: { isSending: true } as never },
    };

    const { isSending } = useIsSending();

    expect(isSending.value).toBe(true);
  });

  it('运行数据存在但均未发送时为 false', async () => {
    const chatStore = useChatStore();
    const chat = createMockChat({
      id: 'chat-2',
      chatModelList: [{ modelId: 'm1', chatHistoryList: [] }],
    });
    chatStore.chatMetaList = [
      { id: chat.id, name: chat.name, modelIds: [], isDeleted: false },
    ];
    chatStore.setActiveChatData({ chatId: chat.id, chat });
    chatStore.setSelectedChatId(chat.id);
    chatStore.runningChat = {
      'chat-2': { m1: { isSending: false } as never },
    };

    const { isSending } = useIsSending();

    expect(isSending.value).toBe(false);
  });
});
