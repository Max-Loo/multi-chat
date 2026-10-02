/**
 * 聊天面板 composables 测试（Vue 版）
 *
 * 迁移自旧版 src/__test__/pages/Chat/hooks/ 下的 useBoard / useIsSending /
 * useSelectedChat 测试，保留核心语义：
 * - useBoard：按 columnCount 切分二维数组、空列表、Splitter 条件
 * - useIsSending：无选中/无运行数据为 false、任一窗口发送为 true
 * - useSelectedChat：有/无选中聊天、缺失 chatModelList
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockPanelChatModel } from '@/__test__/helpers/fixtures/panelLayout';
import { createMockChat } from '@/__test__/helpers/testing-utils';
import type { Chat } from '@/types/chat';
import { ChatRoleEnum } from '@/types/chat';
import type { StandardMessage } from '@/types/chat';

// composables 依赖 Pinia store，chatStore 初始化涉及服务层 → 与 store 测试一致的 mock 面
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
}));
vi.mock('@/services/chat', () => ({
  streamChatCompletion: vi.fn(),
  generateChatTitleService: vi.fn(),
}));
vi.mock('@/services/chat/providerLoader', () => ({
  getProviderSDKLoader: () => ({
    preloadProviders: vi.fn(() => Promise.resolve()),
    loadProvider: vi.fn(),
    isProviderLoaded: vi.fn(),
    getProviderState: vi.fn(),
  }),
}));

import { setupPinia } from '@/__test__/stores/setupPinia';
import { useChatStore } from '@/stores';
import { useBoard } from '@/pages/Chat/composables/useBoard';
import { useIsSending } from '@/pages/Chat/composables/useIsSending';
import { useSelectedChat } from '@/pages/Chat/composables/useSelectedChat';

const CHAT_ID = 'chat-composables-test';

/** 创建带两个模型的测试聊天 */
function createChatWithModels(modelIds: string[]): Chat {
  const chat = createMockChat({
    id: CHAT_ID,
    name: '测试聊天',
    chatModelList: modelIds.map((id) => createMockPanelChatModel(id)),
  });
  return chat;
}

/** 准备选中的聊天到 store */
function seedSelectedChat(chat: Chat) {
  const chatStore = useChatStore();
  chatStore.chatMetaList = [
    {
      id: chat.id,
      name: chat.name,
      modelIds: [],
      isDeleted: false,
    },
  ];
  chatStore.activeChatData = { [chat.id]: chat };
  chatStore.selectedChatId = chat.id;
  return chatStore;
}

describe('useBoard（Vue 版）', () => {
  beforeEach(() => {
    setupPinia();
  });

  it('应该按 columnCount 切分模型列表为二维数组', () => {
    seedSelectedChat(createChatWithModels(['m1', 'm2', 'm3', 'm4', 'm5']));

    const { board } = useBoard(
      () => 2,
      () => false,
    );

    expect(board.value).toHaveLength(3);
    expect(board.value[0].map((m) => m.modelId)).toEqual(['m1', 'm2']);
    expect(board.value[1].map((m) => m.modelId)).toEqual(['m3', 'm4']);
    expect(board.value[2].map((m) => m.modelId)).toEqual(['m5']);
  });

  it('应该返回空数组 当模型列表为空', () => {
    seedSelectedChat(createChatWithModels([]));

    const { board } = useBoard(
      () => 2,
      () => false,
    );

    expect(board.value).toEqual([]);
  });

  it('应该在模型数量等于 columnCount 时正确切分', () => {
    seedSelectedChat(createChatWithModels(['m1', 'm2']));

    const { board } = useBoard(
      () => 2,
      () => false,
    );

    expect(board.value).toHaveLength(1);
    expect(board.value[0]).toHaveLength(2);
  });

  it('应该在 isSplitter=true 且模型数量 > 1 时使用 Splitter 布局', () => {
    seedSelectedChat(createChatWithModels(['m1', 'm2']));

    const { shouldUseSplitter } = useBoard(
      () => 1,
      () => true,
    );

    expect(shouldUseSplitter.value).toBe(true);
  });

  it('应该在 isSplitter=false 时不使用 Splitter 布局', () => {
    seedSelectedChat(createChatWithModels(['m1', 'm2']));

    const { shouldUseSplitter } = useBoard(
      () => 1,
      () => false,
    );

    expect(shouldUseSplitter.value).toBe(false);
  });

  it('应该在模型数量 <= 1 时不使用 Splitter 布局', () => {
    seedSelectedChat(createChatWithModels(['m1']));

    const { shouldUseSplitter } = useBoard(
      () => 1,
      () => true,
    );

    expect(shouldUseSplitter.value).toBe(false);
  });
});

describe('useIsSending（Vue 版）', () => {
  beforeEach(() => {
    setupPinia();
  });

  it('应该返回 false 当无选中聊天', () => {
    const { isSending } = useIsSending();

    expect(isSending.value).toBe(false);
  });

  it('应该返回 false 当选中聊天无运行数据', () => {
    seedSelectedChat(createChatWithModels(['m1']));

    const { isSending } = useIsSending();

    expect(isSending.value).toBe(false);
  });

  it('应该返回 true 当任一窗口正在发送', () => {
    const chatStore = seedSelectedChat(
      createChatWithModels(['m1', 'm2']),
    );
    chatStore.runningChat = {
      [CHAT_ID]: {
        m1: { isSending: false, history: null, errorMessage: '' },
        m2: { isSending: true, history: null, errorMessage: '' },
      },
    };

    const { isSending } = useIsSending();

    expect(isSending.value).toBe(true);
  });

  it('应该返回 false 当所有窗口均未发送', () => {
    const chatStore = seedSelectedChat(
      createChatWithModels(['m1', 'm2']),
    );
    chatStore.runningChat = {
      [CHAT_ID]: {
        m1: { isSending: false, history: null, errorMessage: '' },
        m2: { isSending: false, history: null, errorMessage: '' },
      },
    };

    const { isSending } = useIsSending();

    expect(isSending.value).toBe(false);
  });
});

describe('useSelectedChat（Vue 版）', () => {
  beforeEach(() => {
    setupPinia();
  });

  it('应该返回选中聊天的数据 当有选中聊天', () => {
    const chat = createChatWithModels(['m1']);
    seedSelectedChat(chat);

    const { selectedChat, chatModelList } = useSelectedChat();

    expect(selectedChat.value?.id).toBe(CHAT_ID);
    expect(chatModelList.value).toHaveLength(1);
  });

  it('应该返回 null 和空数组 当无选中聊天', () => {
    const { selectedChat, chatModelList } = useSelectedChat();

    expect(selectedChat.value).toBeNull();
    expect(chatModelList.value).toEqual([]);
  });

  it('应该返回空数组 当 chatModelList 缺失', () => {
    const chat = createMockChat({ id: CHAT_ID, name: '测试' });
    // chatModelList 字段缺失
    delete (chat as Partial<Chat>).chatModelList;
    seedSelectedChat(chat);

    const { chatModelList } = useSelectedChat();

    expect(chatModelList.value).toEqual([]);
  });

  it('应该流式消息不在 useSelectedChat 范围内（回归守卫：与 runningChat 无关）', () => {
    const chatStore = seedSelectedChat(createChatWithModels(['m1']));
    const message: StandardMessage = {
      id: 'msg-1',
      role: ChatRoleEnum.USER,
      content: 'hello',
      timestamp: 1,
      modelKey: 'm',
      finishReason: null,
      raw: null,
    };
    chatStore.runningChat = {
      [CHAT_ID]: { m1: { isSending: true, history: message, errorMessage: '' } },
    };

    const { chatModelList } = useSelectedChat();

    // chatModelList 只反映持久化历史，不含流式临时消息
    expect(chatModelList.value).toHaveLength(1);
  });
});
