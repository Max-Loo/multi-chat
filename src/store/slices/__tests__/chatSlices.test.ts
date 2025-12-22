import { describe, it, expect, vi, beforeEach } from 'vitest';
import chatReducer, {
  clearError,
  clearInitializationError,
  setSelectedChatId,
  clearSelectChatId,
  createChat,
  editChat,
  editChatName,
  deleteChat,
  initializeChatList,
  startSendChatMessage,
  ChatSliceState,
} from '@/store/slices/chatSlices';
import { createMockChat } from '@/__tests__/fixtures/chats';
import { createMockMessage } from '@/__tests__/fixtures/messages';
import { ChatRoleEnum } from '@/types/chat';

// Mock the loadChatList function
vi.mock('@/store/vaults/chatVault', () => ({
  loadChatList: vi.fn(),
}));

// Mock the ModelProviderFactoryCreator
vi.mock('@/lib/factory/modelProviderFactory', () => ({
  ModelProviderFactoryCreator: {
    getFactory: vi.fn().mockReturnValue({
      getModelProvider: vi.fn().mockReturnValue({
        fetchApi: {
          fetch: vi.fn().mockImplementation(async function* () {
            yield { role: ChatRoleEnum.ASSISTANT, content: 'Response' };
          }),
        },
      }),
    }),
  },
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-uuid'),
}));

describe('chatSlice', () => {
  const initialState: ChatSliceState = {
    chatList: [],
    loading: false,
    selectedChatId: null,
    error: null,
    initializationError: null,
    runningChat: {},
  };

  const mockChat = createMockChat({ id: 'chat-1' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初始状态', () => {
    it('应该返回正确的初始状态', () => {
      const result = chatReducer(undefined, { type: 'unknown' });
      expect(result).toEqual(initialState);
    });
  });

  describe('clearError', () => {
    it('应该清除操作错误信息', () => {
      const stateWithError = {
        ...initialState,
        error: 'Some error occurred',
      };
      const result = chatReducer(stateWithError, clearError());
      expect(result.error).toBeNull();
    });
  });

  describe('clearInitializationError', () => {
    it('应该清除初始化错误信息', () => {
      const stateWithError = {
        ...initialState,
        initializationError: 'Initialization failed',
      };
      const result = chatReducer(stateWithError, clearInitializationError());
      expect(result.initializationError).toBeNull();
    });
  });

  describe('setSelectedChatId', () => {
    it('应该设置选中的聊天ID', () => {
      const result = chatReducer(initialState, setSelectedChatId('chat-1'));
      expect(result.selectedChatId).toBe('chat-1');
    });

    it('应该处理null值', () => {
      const stateWithSelected = {
        ...initialState,
        selectedChatId: 'chat-1',
      };
      const result = chatReducer(stateWithSelected, setSelectedChatId(null));
      expect(result.selectedChatId).toBeNull();
    });
  });

  describe('clearSelectChatId', () => {
    it('应该清除选中的聊天ID', () => {
      const stateWithSelected = {
        ...initialState,
        selectedChatId: 'chat-1',
      };
      const result = chatReducer(stateWithSelected, clearSelectChatId());
      expect(result.selectedChatId).toBeNull();
    });
  });

  describe('createChat', () => {
    it('应该添加新聊天到列表', () => {
      const result = chatReducer(initialState, createChat({ chat: mockChat }));

      expect(result.chatList).toHaveLength(1);
      expect(result.chatList[0]).toEqual(mockChat);
    });

    it('应该保持状态不可变性', () => {
      const state = { ...initialState };
      const result = chatReducer(state, createChat({ chat: mockChat }));

      expect(result).not.toBe(state);
      expect(state.chatList).toHaveLength(0);
      expect(result.chatList).toHaveLength(1);
    });
  });

  describe('editChat', () => {
    it('应该编辑现有聊天', () => {
      const originalChat = createMockChat({ id: 'chat-1', name: 'Original Name' });
      const updatedChat = createMockChat({ id: 'chat-1', name: 'Updated Name' });

      const stateWithChat = {
        ...initialState,
        chatList: [originalChat],
      };

      const result = chatReducer(stateWithChat, editChat({ chat: updatedChat }));

      expect(result.chatList).toHaveLength(1);
      expect(result.chatList[0].name).toBe('Updated Name');
    });

    it('应该处理不存在的聊天ID', () => {
      const originalChat = createMockChat({ id: 'chat-1' });
      const nonExistentChat = createMockChat({ id: 'chat-999' });

      const stateWithChat = {
        ...initialState,
        chatList: [originalChat],
      };

      const result = chatReducer(stateWithChat, editChat({ chat: nonExistentChat }));

      expect(result.chatList).toHaveLength(1);
      expect(result.chatList[0]).toEqual(originalChat);
    });
  });

  describe('editChatName', () => {
    it('应该编辑聊天名称', () => {
      const originalChat = createMockChat({ id: 'chat-1', name: 'Original Name' });

      const stateWithChat = {
        ...initialState,
        chatList: [originalChat],
      };

      const result = chatReducer(stateWithChat, editChatName({ id: 'chat-1', name: 'Updated Name' }));

      expect(result.chatList).toHaveLength(1);
      expect(result.chatList[0].name).toBe('Updated Name');
    });

    it('应该处理不存在的聊天ID', () => {
      const originalChat = createMockChat({ id: 'chat-1', name: 'Original Name' });

      const stateWithChat = {
        ...initialState,
        chatList: [originalChat],
      };

      const result = chatReducer(stateWithChat, editChatName({ id: 'chat-999', name: 'Updated Name' }));

      expect(result.chatList).toHaveLength(1);
      expect(result.chatList[0].name).toBe('Original Name');
    });
  });

  describe('deleteChat', () => {
    it('应该标记聊天为已删除而不是真删除', () => {
      const chat = createMockChat({ id: 'chat-1', isDeleted: false });

      const stateWithChat = {
        ...initialState,
        chatList: [chat],
        selectedChatId: 'chat-1',
      };

      const result = chatReducer(stateWithChat, deleteChat({ chat }));

      expect(result.chatList).toHaveLength(1);
      expect(result.chatList[0].isDeleted).toBe(true);
      expect(result.selectedChatId).toBeNull();
    });

    it('应该处理不存在的聊天ID', () => {
      const chat = createMockChat({ id: 'chat-1' });
      const nonExistentChat = createMockChat({ id: 'chat-999' });

      const stateWithChat = {
        ...initialState,
        chatList: [chat],
      };

      const result = chatReducer(stateWithChat, deleteChat({ chat: nonExistentChat }));

      expect(result.chatList).toHaveLength(1);
      expect(result.chatList[0].isDeleted).toBe(false);
    });

    it('应该处理未选中的聊天删除', () => {
      const chat1 = createMockChat({ id: 'chat-1' });
      const chat2 = createMockChat({ id: 'chat-2' });

      const stateWithChats = {
        ...initialState,
        chatList: [chat1, chat2],
        selectedChatId: 'chat-2',
      };

      const result = chatReducer(stateWithChats, deleteChat({ chat: chat1 }));

      expect(result.chatList).toHaveLength(2);
      expect(result.chatList[0].isDeleted).toBe(true);
      expect(result.selectedChatId).toBe('chat-2');
    });
  });

  describe('initializeChatList', () => {
    it('应该处理初始化聊天列表成功', async () => {
      const { loadChatList } = await import('@/store/vaults/chatVault');
      const mockChats = [createMockChat({ id: 'chat-1' }), createMockChat({ id: 'chat-2' })];
      vi.mocked(loadChatList).mockResolvedValue(mockChats);

      const pendingAction = { type: initializeChatList.pending.type };
      const fulfilledAction = {
        type: initializeChatList.fulfilled.type,
        payload: mockChats,
      };

      // 测试pending状态
      let result = chatReducer(initialState, pendingAction);
      expect(result.loading).toBe(true);
      expect(result.initializationError).toBeNull();

      // 测试fulfilled状态
      result = chatReducer(result, fulfilledAction);
      expect(result.loading).toBe(false);
      expect(result.chatList).toEqual(mockChats);
    });

    it('应该处理初始化聊天列表失败', async () => {
      const { loadChatList } = await import('@/store/vaults/chatVault');
      vi.mocked(loadChatList).mockRejectedValue(new Error('Failed to load chats'));

      const pendingAction = { type: initializeChatList.pending.type };
      const rejectedAction = {
        type: initializeChatList.rejected.type,
        error: { message: 'Failed to load chats' },
      };

      // 测试pending状态
      let result = chatReducer(initialState, pendingAction);
      expect(result.loading).toBe(true);
      expect(result.initializationError).toBeNull();

      // 测试rejected状态
      result = chatReducer(result, rejectedAction);
      expect(result.loading).toBe(false);
      expect(result.initializationError).toBe('Failed to load chats');
    });

    it('应该处理没有错误消息的初始化失败', async () => {
      const { loadChatList } = await import('@/store/vaults/chatVault');
      vi.mocked(loadChatList).mockRejectedValue(new Error());

      const rejectedAction = {
        type: initializeChatList.rejected.type,
        error: { message: undefined },
      };

      const result = chatReducer(initialState, rejectedAction);
      expect(result.loading).toBe(false);
      expect(result.initializationError).toBe('Failed to initialize file');
    });
  });

  describe('startSendChatMessage', () => {
    it('应该处理发送消息开始', () => {
      const chat = createMockChat({
        id: 'chat-1',
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });

      const pendingAction = {
        type: startSendChatMessage.pending.type,
        meta: { arg: { chat, message: 'Hello' } },
      };

      const result = chatReducer(initialState, pendingAction);
      // 这个action主要是为了触发sendMessage，本身不改变状态
      expect(result).toEqual(initialState);
    });

    it('应该处理发送消息被拒绝', () => {
      const chat = createMockChat({
        id: 'chat-1',
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });

      // 设置包含runningChat的状态
      const state = {
        ...initialState,
        chatList: [chat],
        runningChat: {
          'chat-1': {
            'model-1': {
              isSending: false,
              history: null,
              errorMessage: undefined,
            },
          },
        },
      };

      const rejectedAction = {
        type: startSendChatMessage.rejected.type,
        meta: { arg: { chat, message: 'Hello' } },
      };

      const result = chatReducer(state, rejectedAction);
      // 这个action将runningChat中的数据回写到chatList中
      expect(result.runningChat).toEqual(state.runningChat);
      // 验证chatList没有被修改（因为history为null）
      expect(result.chatList).toEqual(state.chatList);
    });
  });

  describe('状态不可变性', () => {
    it('应该保持状态不可变性', () => {
      const chat = createMockChat();
      const state = {
        ...initialState,
        chatList: [chat],
        error: 'Some error message', // 添加错误状态以确保有变化
      };

      const newState = chatReducer(state, clearError());

      expect(newState).not.toBe(state);
      expect(state.chatList).toEqual(newState.chatList);
      expect(newState.error).toBeNull();
    });
  });

  describe('边界情况', () => {
    it('应该处理未知action类型', () => {
      const state = {
        ...initialState,
        chatList: [createMockChat()],
      };
      const result = chatReducer(state, { type: 'UNKNOWN_ACTION' });
      expect(result).toBe(state);
    });

    it('应该处理空聊天列表', () => {
      const chat = createMockChat();
      const result = chatReducer(initialState, createChat({ chat }));
      expect(result.chatList).toHaveLength(1);
    });

    it('应该处理多个聊天编辑', () => {
      const chat1 = createMockChat({ id: 'chat-1', name: 'Chat 1' });
      const chat2 = createMockChat({ id: 'chat-2', name: 'Chat 2' });
      const updatedChat1 = createMockChat({ id: 'chat-1', name: 'Updated Chat 1' });

      const stateWithChats = {
        ...initialState,
        chatList: [chat1, chat2],
      };

      const result = chatReducer(stateWithChats, editChat({ chat: updatedChat1 }));

      expect(result.chatList).toHaveLength(2);
      expect(result.chatList[0].name).toBe('Updated Chat 1');
      expect(result.chatList[1].name).toBe('Chat 2');
    });
  });

  describe('错误场景测试', () => {
    it('应该处理initializeChatList的错误场景', () => {
      const state = { ...initialState, loading: true };
      const errorMessage = 'Failed to load chat list';
      const rejectedAction = {
        type: initializeChatList.rejected.type,
        error: { message: errorMessage },
      };

      const result = chatReducer(state, rejectedAction);

      expect(result.loading).toBe(false);
      expect(result.initializationError).toBe(errorMessage);
    });

    it('应该处理initializeChatList错误时没有错误消息的情况', () => {
      const state = { ...initialState, loading: true };
      const rejectedAction = {
        type: initializeChatList.rejected.type,
        error: {},
      };

      const result = chatReducer(state, rejectedAction);

      expect(result.loading).toBe(false);
      expect(result.initializationError).toBe('Failed to initialize file');
    });

    it('应该处理startSendChatMessage被拒绝时runningChat不存在的情况', () => {
      const chat = createMockChat({
        id: 'chat-nonexistent',
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });

      const state = {
        ...initialState,
        chatList: [chat],
        runningChat: {}, // 空的runningChat
      };

      const rejectedAction = {
        type: startSendChatMessage.rejected.type,
        meta: { arg: { chat } },
      };

      const result = chatReducer(state, rejectedAction);

      // 状态应该保持不变
      expect(result).toEqual(state);
    });

    it('应该处理startSendChatMessage被拒绝时chat不在chatList中的情况', () => {
      const chat = createMockChat({
        id: 'chat-removed',
        chatModelList: [{ modelId: 'model-1', chatHistoryList: [] }],
      });

      const state = {
        ...initialState,
        chatList: [], // chatList为空
        runningChat: {
          'chat-removed': {
            'model-1': {
              isSending: false,
              history: createMockMessage({ id: 'msg-1', content: 'test' }),
              errorMessage: undefined,
            },
          },
        },
      };

      const rejectedAction = {
        type: startSendChatMessage.rejected.type,
        meta: { arg: { chat } },
      };

      const result = chatReducer(state, rejectedAction);

      // chatList应该保持为空，因为chat不在列表中
      expect(result.chatList).toEqual([]);
    });

    it('应该正确清除错误状态', () => {
      const state = {
        ...initialState,
        error: 'Some error message',
        initializationError: 'Initialization error',
      };

      const result = chatReducer(state, clearError());

      expect(result.error).toBeNull();
      // clearError只清除error字段，不清除initializationError
      expect(result.initializationError).toBe('Initialization error');
    });

    it('应该正确清除初始化错误状态', () => {
      const state = {
        ...initialState,
        error: 'Some error message',
        initializationError: 'Initialization error',
      };

      const result = chatReducer(state, clearInitializationError());

      expect(result.error).toBe('Some error message');
      expect(result.initializationError).toBeNull();
    });
  });
});