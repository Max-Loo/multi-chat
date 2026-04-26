/**
 * chatMiddleware 单元测试
 *
 * 测试 Listener Middleware 的触发时机和数据持久化副作用
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { saveChatListMiddleware, resetChatMiddleware } from '@/store/middleware/chatMiddleware';
import { saveChatAndIndex, deleteChatFromStorage } from '@/store/storage';
import chatReducer, {
  createChat,
  deleteChat,
  editChat,
  editChatName,
  startSendChatMessage,
} from '@/store/slices/chatSlices';
import modelReducer from '@/store/slices/modelSlice';
import chatPageReducer from '@/store/slices/chatPageSlices';
import appConfigReducer from '@/store/slices/appConfigSlices';
import type { Chat } from '@/types/chat';
import { ChatRoleEnum } from '@/types/chat';
import modelProviderReducer from '@/store/slices/modelProviderSlice';
import settingPageReducer from '@/store/slices/settingPageSlices';
import modelPageReducer from '@/store/slices/modelPageSlices';
import { createMiddlewareTestStore } from './createMiddlewareTestStore';
import {
  createTestRootState,
  createChatSliceState,
  createAppConfigSliceState,
} from '@/__test__/helpers/mocks';
import type { RootState } from '@/store';

// Mock 存储层
vi.mock('@/store/storage', () => ({
  loadChatIndex: vi.fn().mockResolvedValue([]),
  loadChatById: vi.fn().mockResolvedValue(undefined),
  saveChatAndIndex: vi.fn().mockResolvedValue(undefined),
  deleteChatFromStorage: vi.fn().mockResolvedValue(undefined),
}));

const mockSaveChatAndIndex = vi.mocked(saveChatAndIndex);
const mockDeleteChatFromStorage = vi.mocked(deleteChatFromStorage);

/**
 * 构造满足自动命名条件的 sendMessage.fulfilled action
 */
const createFulfilledAction = (chatId: string, modelId: string) => ({
  type: 'chatModel/sendMessage/fulfilled',
  meta: {
    arg: {
      chat: { id: chatId },
      model: { id: modelId },
    },
  },
});

/**
 * 构造包含指定 chat 状态的 preloadedState
 *
 * 注意：sendMessage.fulfilled reducer 会将 runningChat[chatId][modelId].history
 * push 到 chatHistoryList，然后 delete runningChat 条目。
 * 因此初始 chatHistoryList 长度应为 1（用户消息），history 为有效的助手消息。
 * 这样 reducer push 后 chatHistoryList 长度变为 2，满足自动命名的条件 4。
 */
const createState = (chatOverrides: Partial<Chat> & { id: string }, autoNamingEnabled = true): RootState => {
  const chat: Chat = {
    name: '',
    chatModelList: [
      {
        modelId: 'model-auto',
        chatHistoryList: [
          { id: 'msg-1', role: ChatRoleEnum.USER, content: 'hi', timestamp: 0, modelKey: 'model-auto', finishReason: null },
        ],
      },
    ],
    ...chatOverrides,
  };

  return createTestRootState({
    chat: createChatSliceState({
      chatMetaList: [
        {
          id: chat.id,
          name: chat.name,
          isManuallyNamed: chat.isManuallyNamed,
          modelIds: chat.chatModelList?.map(cm => cm.modelId) ?? [],
          isDeleted: chat.isDeleted,
          updatedAt: chat.updatedAt,
        },
      ],
      activeChatData: {
        [chat.id]: chat,
      },
      sendingChatIds: {},
      selectedChatId: chatOverrides.id,
      runningChat: {
        [chatOverrides.id]: {
          'model-auto': {
            isSending: false,
            history: { id: 'msg-2', role: ChatRoleEnum.ASSISTANT, content: 'hello', timestamp: 0, modelKey: 'model-auto', finishReason: null },
          },
        },
      },
    }),
    appConfig: createAppConfigSliceState({
      language: 'zh',
      autoNamingEnabled,
    }),
  });
};

/**
 * 辅助函数：统计 dispatchedActions 中 chat/generateName/pending 出现次数
 */
const countGenerateNamePending = (actions: Array<{ type: string }>) =>
  actions.filter((a) => a.type === 'chat/generateName/pending').length;

/**
 * 创建包含自动命名 middleware 和 action 跟踪的测试 store
 * 注意：每个用例需要使用不同的 chatId 隔离模块级 generatingTitleChatIds Set
 */
const createAutoNamingStore = (preloadedState: RootState) => {
  // 记录所有经过 middleware 链的 action（包括 listener 内部 dispatch 的）
  const dispatchedActions: Array<{ type: string; [key: string]: unknown }> = [];

  const actionTracker = () => (next: (action: unknown) => unknown) => (action: unknown) => {
    dispatchedActions.push(action as { type: string; [key: string]: unknown });
    return next(action);
  };

  const testStore = configureStore({
    reducer: {
      models: modelReducer,
      chat: chatReducer,
      chatPage: chatPageReducer,
      appConfig: appConfigReducer,
      modelProvider: modelProviderReducer,
      settingPage: settingPageReducer,
      modelPage: modelPageReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(actionTracker)
        .prepend(saveChatListMiddleware.middleware),
  });

  return { store: testStore, dispatchedActions };
};

describe('chatMiddleware', () => {
  let store: ReturnType<typeof createMiddlewareTestStore>;

  // Mock 聊天数据（符合 Chat 接口）
  const mockChat = {
    id: 'chat1',
    name: 'Chat 1',
    chatModelList: [],
  };

  beforeEach(() => {
    store = createMiddlewareTestStore(saveChatListMiddleware.middleware);
  });

  describe('聊天消息发送触发保存', () => {
    it('应该在消息发送成功时触发保存', async () => {
      // 在 activeChatData 中预设聊天数据（middleware 从 state 获取最新聊天数据）
      store.dispatch({ type: 'chat/setActiveChatData', payload: { chatId: 'chat1', chat: mockChat } });

      // Dispatch fulfilled action
      await store.dispatch(
        startSendChatMessage.fulfilled(
          undefined,
          'requestId',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          // Reason: 测试错误处理，需要构造无效输入
          { chat: mockChat as any, message: 'Hello' }
        )
      );

      // 等待异步 effect 完成
      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalledTimes(1);
      });

      expect(mockSaveChatAndIndex).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.any(Array),
      );
    });

    it('应该在消息发送失败时触发保存', async () => {
      const chatId = 'chat-fail';
      const initialChat = { id: chatId, name: 'Chat Fail', chatModelList: [
        {
          modelId: 'model-1',
          chatHistoryList: [],
        },
      ] };

      // 构造完整的 runningChat state，模拟消息发送进行中的状态
      const preloadedState = createTestRootState({
        chat: createChatSliceState({
          chatList: [initialChat],
          selectedChatId: chatId,
          runningChat: {
            [chatId]: {
              'model-1': {
                isSending: true,
                history: { id: 'msg-1', role: ChatRoleEnum.ASSISTANT, content: 'partial response', timestamp: 0, modelKey: 'model-1', finishReason: null },
              },
            },
          },
        }),
      });

      // 创建带 preloadedState 的 store
      const failStore = configureStore({
        reducer: {
          models: modelReducer,
          chat: chatReducer,
          chatPage: chatPageReducer,
          appConfig: appConfigReducer,
          modelProvider: modelProviderReducer,
          settingPage: settingPageReducer,
          modelPage: modelPageReducer,
        },
        preloadedState,
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().prepend(saveChatListMiddleware.middleware),
      });

      await failStore.dispatch(
        startSendChatMessage.rejected(
          new Error('Send failed'),
          'requestId',
          { chat: initialChat as any, message: 'Hello' }
        )
      );

      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalled();
      });
    });
  });

  describe('聊天操作触发保存', () => {
    it('应该在创建聊天时触发保存', async () => {
      const newChat = {
        id: 'chat2',
        name: 'New Chat',
        chatModelList: [],
      };

      await store.dispatch(createChat({ chat: newChat }));

      // 等待异步 effect 完成
      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalledTimes(1);
      });
    });

    it('应该在编辑聊天时触发保存', async () => {
      const updatedChat = { ...mockChat, name: 'Updated Chat' };
      await store.dispatch(editChat({ chat: updatedChat }));

      // 等待异步 effect 完成
      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalledTimes(1);
      });
    });

    it('应该在编辑聊天名称时触发保存', async () => {
      // 在 activeChatData 中预设聊天数据（middleware 从 state.activeChatData 获取）
      store.dispatch({ type: 'chat/setActiveChatData', payload: { chatId: 'chat1', chat: mockChat } });

      await store.dispatch(editChatName({ name: 'New Name', id: 'chat1' }));

      // 等待异步 effect 完成
      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalledTimes(1);
      });
    });

    it('应该在删除聊天时触发保存', async () => {
      await store.dispatch(deleteChat({ chat: mockChat }));

      // 等待异步 effect 完成
      await vi.waitFor(() => {
        expect(mockDeleteChatFromStorage).toHaveBeenCalledTimes(1);
      });

      // 验证参数：deleteChatFromStorage(chatId, index)
      expect(mockDeleteChatFromStorage).toHaveBeenCalledWith('chat1', expect.any(Array));
    });
  });

  describe('不匹配的 action 不触发保存', () => {
    it('应该在非聊天操作时不触发保存', async () => {
      // Dispatch 不相关的 action
      store.dispatch({ type: 'some/other/action' });

      // 等待异步 effect 完成
      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).not.toHaveBeenCalled();
      });
    });
  });

  describe('从 Store 获取最新状态', () => {
    it('应该传递最新的聊天数据给 saveChatAndIndex', async () => {
      // 先创建一个聊天
      const newChat = {
        id: 'chat1',
        name: 'Test Chat',
        chatModelList: [],
      };

      await store.dispatch(createChat({ chat: newChat }));

      // 等待异步 effect 完成
      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalledTimes(1);
      });

      // 验证传递了正确的参数（chatId, chatData, index）
      const [savedChatId, savedChatData] = mockSaveChatAndIndex.mock.calls[0];
      expect(savedChatId).toBe('chat1');
      expect(savedChatData).toEqual(expect.objectContaining({ id: 'chat1' }));
    });
  });

  describe('自动命名触发逻辑', () => {
    it('应该触发 generateChatName 当四个条件全部满足', async () => {
      const chatId = 'auto-chat-001';
      const { store: autoStore, dispatchedActions } = createAutoNamingStore(createState({ id: chatId }, true));

      autoStore.dispatch(createFulfilledAction(chatId, 'model-auto'));

      await vi.waitFor(() => {
        expect(countGenerateNamePending(dispatchedActions)).toBe(1);
      });
    });

    it('应该不触发 当聊天已手动命名', async () => {
      const chatId = 'auto-chat-002';
      const { store: autoStore, dispatchedActions } = createAutoNamingStore(createState({ id: chatId, isManuallyNamed: true }, true));

      autoStore.dispatch(createFulfilledAction(chatId, 'model-auto'));

      await vi.waitFor(() => {
        expect(countGenerateNamePending(dispatchedActions)).toBe(0);
      });
    });

    it('应该不触发 当全局开关关闭', async () => {
      const chatId = 'auto-chat-003';
      const { store: autoStore, dispatchedActions } = createAutoNamingStore(createState({ id: chatId }, false));

      autoStore.dispatch(createFulfilledAction(chatId, 'model-auto'));

      await vi.waitFor(() => {
        expect(countGenerateNamePending(dispatchedActions)).toBe(0);
      });
    });

    it('应该不触发 当标题非空', async () => {
      const chatId = 'auto-chat-004';
      const state = createState({ id: chatId, name: '已有标题' }, true);
      const { store: autoStore, dispatchedActions } = createAutoNamingStore(state);

      autoStore.dispatch(createFulfilledAction(chatId, 'model-auto'));

      await vi.waitFor(() => {
        expect(countGenerateNamePending(dispatchedActions)).toBe(0);
      });
    });

    it('应该不触发 当对话历史长度不等于 2', async () => {
      const chatId = 'auto-chat-005';
      const state = createState({ id: chatId }, true);
      // 初始 chatHistoryList 为 0 条，push 后为 1 条（不等于 2）
      state.chat.activeChatData[chatId]!.chatModelList![0]!.chatHistoryList = [];
      const { store: autoStore, dispatchedActions } = createAutoNamingStore(state);

      autoStore.dispatch(createFulfilledAction(chatId, 'model-auto'));

      await vi.waitFor(() => {
        expect(countGenerateNamePending(dispatchedActions)).toBe(0);
      });
    });

    it('应该正确触发自动命名 当条件全部满足（单次 dispatch）', async () => {
      const chatId = 'auto-chat-006';
      const { store: autoStore, dispatchedActions } = createAutoNamingStore(createState({ id: chatId }, true));

      autoStore.dispatch(createFulfilledAction(chatId, 'model-auto'));

      await vi.waitFor(() => {
        expect(countGenerateNamePending(dispatchedActions)).toBe(1);
      });
    });

    it('应该只触发一次 当同一 chatId 连续 dispatch 两次', async () => {
      const chatId = 'auto-chat-concurrent';
      const state = createState({ id: chatId }, true);

      // 添加第二个模型，确保第二次 dispatch 的 reducer 能找到对应的 runningChat 条目
      // （第一次 fulfilled 会删除 model-auto 的 runningChat 条目）
      state.chat.runningChat[chatId]!['model-auto-2'] = {
        isSending: false,
        history: { id: 'msg-3', role: ChatRoleEnum.ASSISTANT, content: 'world', timestamp: 0, modelKey: 'model-auto-2', finishReason: null },
      };
      state.chat.activeChatData[chatId]!.chatModelList!.push({
        modelId: 'model-auto-2',
        chatHistoryList: [{ id: 'msg-4', role: ChatRoleEnum.USER, content: 'hello', timestamp: 0, modelKey: 'model-auto-2', finishReason: null }],
      });

      const { store: autoStore, dispatchedActions } = createAutoNamingStore(state);

      // 第一次 dispatch — 触发 generateChatName，chatId 加入内存锁
      autoStore.dispatch(createFulfilledAction(chatId, 'model-auto'));
      // 第二次 dispatch — 内存锁已拦截，即使条件满足也不应再次触发
      autoStore.dispatch(createFulfilledAction(chatId, 'model-auto-2'));

      await vi.waitFor(() => {
        // 内存锁防止并发，只触发一次
        expect(countGenerateNamePending(dispatchedActions)).toBe(1);
      });
    });

    it('应该在 fulfilled 后释放内存锁 允许同一 chatId 再次触发', async () => {
      const chatId = 'auto-chat-007';
      const { store: autoStore, dispatchedActions: actions1 } = createAutoNamingStore(createState({ id: chatId }, true));

      // 第一次触发自动命名
      autoStore.dispatch(createFulfilledAction(chatId, 'model-auto'));
      await vi.waitFor(() => {
        expect(countGenerateNamePending(actions1)).toBe(1);
      });

      // 模拟 generateChatName.fulfilled 释放锁
      autoStore.dispatch({
        type: 'chat/generateName/fulfilled',
        payload: { chatId, name: 'New Name' },
        meta: { arg: { chat: { id: chatId } } },
      });
      await vi.waitFor(() => {
        expect(actions1.length).toBeGreaterThanOrEqual(2);
      });

      // 用全新的 store（但共享 generatingTitleChatIds Set）再次触发
      // 新 store 有新的 preloadedState，chatHistoryList 长度为 1，push 后为 2
      const { store: autoStore2, dispatchedActions: actions2 } = createAutoNamingStore(createState({ id: chatId }, true));
      autoStore2.dispatch(createFulfilledAction(chatId, 'model-auto'));
      await vi.waitFor(() => {
        // 锁已释放，应该能再次触发
        expect(countGenerateNamePending(actions2)).toBe(1);
      });
    });

    it('应该在 rejected 后释放内存锁 允许同一 chatId 再次触发', async () => {
      const chatId = 'auto-chat-008';
      const { store: autoStore, dispatchedActions: actions1 } = createAutoNamingStore(createState({ id: chatId }, true));

      // 第一次触发自动命名
      autoStore.dispatch(createFulfilledAction(chatId, 'model-auto'));
      await vi.waitFor(() => {
        expect(countGenerateNamePending(actions1)).toBe(1);
      });

      // 模拟 generateChatName.rejected 释放锁
      autoStore.dispatch({
        type: 'chat/generateName/rejected',
        error: new Error('Network error'),
        meta: { arg: { chat: { id: chatId } } },
      });
      await vi.waitFor(() => {
        expect(actions1.length).toBeGreaterThanOrEqual(2);
      });

      // 用全新的 store 再次触发，锁已释放
      const { store: autoStore2, dispatchedActions: actions2 } = createAutoNamingStore(createState({ id: chatId }, true));
      autoStore2.dispatch(createFulfilledAction(chatId, 'model-auto'));
      await vi.waitFor(() => {
        expect(countGenerateNamePending(actions2)).toBe(1);
      });
    });
  });

<<<<<<< HEAD
  describe('后台聊天发送结束后回收 activeChatData', () => {
    it('应该在 fulfilled 且非当前选中时回收 activeChatData', async () => {
      const chatA = { id: 'bg-chat-a', name: 'Chat A', chatModelList: [] };
      const chatB = { id: 'bg-chat-b', name: 'Chat B', chatModelList: [] };

      // 创建两个聊天
      store.dispatch(createChat({ chat: chatA }));
      store.dispatch(createChat({ chat: chatB }));

      // 选中 chatB（用户已切走）
      store.dispatch({ type: 'chat/setSelectedChatId', payload: 'bg-chat-b' });

      // 发送完成
      await store.dispatch(
        startSendChatMessage.fulfilled(undefined, 'bg-req-1', { chat: chatA, message: 'hi' })
      );

      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalled();
      });

      // chatA 应该被回收
      const state = store.getState().chat;
      expect(state.activeChatData['bg-chat-a']).toBeUndefined();
      // chatB 应该保留
      expect(state.activeChatData['bg-chat-b']).toBeDefined();
    });

    it('应该在 rejected 且非当前选中时回收 activeChatData', async () => {
      const chatA = { id: 'bg-chat-c', name: 'Chat C', chatModelList: [] };

      store.dispatch(createChat({ chat: chatA }));
      store.dispatch({ type: 'chat/setSelectedChatId', payload: 'bg-chat-c' });

      // 将 activeChatData 设回去（reducer rejected 会回写 runningChat）
      store.dispatch({ type: 'chat/setActiveChatData', payload: { chatId: 'bg-chat-c', chat: chatA } });

      // 用户切走
      store.dispatch({ type: 'chat/setSelectedChatId', payload: null });

      await store.dispatch(
        startSendChatMessage.rejected(new Error('fail'), 'bg-req-2', { chat: chatA, message: 'hi' })
      );

      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalled();
      });

      const state = store.getState().chat;
      expect(state.activeChatData['bg-chat-c']).toBeUndefined();
    });

    it('应该在用户已切回时保留 activeChatData', async () => {
      const chatA = { id: 'bg-chat-d', name: 'Chat D', chatModelList: [] };

      store.dispatch(createChat({ chat: chatA }));
      // 当前选中的就是 chatA
      store.dispatch({ type: 'chat/setSelectedChatId', payload: 'bg-chat-d' });

      await store.dispatch(
        startSendChatMessage.fulfilled(undefined, 'bg-req-3', { chat: chatA, message: 'hi' })
      );

      await vi.waitFor(() => {
        expect(mockSaveChatAndIndex).toHaveBeenCalled();
      });

      const state = store.getState().chat;
      expect(state.activeChatData['bg-chat-d']).toBeDefined();
    });
  });

  describe('resetChatMiddleware()', () => {
    it('应该在自动命名触发后清理 generatingTitleChatIds', async () => {
      const chatId = 'reset-test-chat';
      const { store: autoStore, dispatchedActions } = createAutoNamingStore(createState({ id: chatId }, true));

      autoStore.dispatch(createFulfilledAction(chatId, 'model-auto'));
      await vi.waitFor(() => {
        expect(countGenerateNamePending(dispatchedActions)).toBe(1);
      });

      resetChatMiddleware();

      // 重置后，同一 chatId 应能再次触发（内存锁已清理）
      const { store: autoStore2, dispatchedActions: actions2 } = createAutoNamingStore(createState({ id: chatId }, true));
      autoStore2.dispatch(createFulfilledAction(chatId, 'model-auto'));
      await vi.waitFor(() => {
        expect(countGenerateNamePending(actions2)).toBe(1);
      });
    });
  });
});
