/**
 * editAndResendMessage 和 regenerateMessage thunk 集成测试
 *
 * 测试编辑重发和重新生成 AI 回复的完整流程，包括：
 * - 正常流程：commit → stream → updateHistoryContent
 * - 失败回滚：commit → stream 失败 → rollback
 * - extraReducers: pending/fulfilled/rejected 对 sendingChatIds 的管理
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatRoleEnum, StandardMessage } from '@/types/chat';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createMockChat } from '@/__test__/helpers/testing-utils';

// Mock 依赖
const { mockStreamChatCompletion } = vi.hoisted(() => ({
  mockStreamChatCompletion: vi.fn(),
}));

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
  createLazyStore: vi.fn(() => ({})),
  saveToStore: vi.fn(() => Promise.resolve()),
  loadFromStore: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/services/chat', () => ({
  streamChatCompletion: mockStreamChatCompletion,
  generateChatTitleService: vi.fn(),
}));

vi.mock('@/services/chat/providerLoader', () => ({
  getProviderSDKLoader: () => ({
    loadProvider: vi.fn().mockResolvedValue((config: any) => (modelId: string) => ({
      modelId,
      provider: 'mock-provider',
      ...config,
    })),
    isProviderLoaded: vi.fn(),
    getProviderState: vi.fn(),
    preloadProviders: vi.fn(),
  }),
}));

import { configureStore } from '@reduxjs/toolkit';
import chatReducer, {
  createChat,
  editAndResendMessage,
  regenerateMessage,
} from '@/store/slices/chatSlices';
import modelReducer, { createModel } from '@/store/slices/modelSlice';

/**
 * 创建测试用消息
 */
function createTestMessage(overrides: Partial<StandardMessage> & { id: string }): StandardMessage {
  return {
    timestamp: Date.now() / 1000,
    modelKey: 'test-model-key',
    role: ChatRoleEnum.USER,
    content: 'Test content',
    finishReason: 'stop',
    ...overrides,
  };
}

/**
 * 创建异步生成器模拟流式响应
 */
async function* createStreamGenerator(messages: StandardMessage[]) {
  for (const msg of messages) {
    yield msg;
  }
}

describe('editAndResendMessage thunk', () => {
  let store: any;

  const createTestStore = () => {
    return configureStore({
      reducer: {
        chat: chatReducer,
        models: modelReducer,
        appConfig: (state = { transmitHistoryReasoning: false, language: '', autoNamingEnabled: true }) => state,
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore();
  });

  it('应该在 pending 时设置 sendingChatIds', () => {
    const chatId = 'test-chat-1';
    const userMessageId = 'msg-user-1';

    store.dispatch(editAndResendMessage.pending('req-1', {
      chatId,
      userMessageId,
      newContent: 'Edited',
    }));

    expect(store.getState().chat.sendingChatIds[chatId]).toBe(true);
  });

  it('应该在 fulfilled 时清除 sendingChatIds', () => {
    const chatId = 'test-chat-1';

    // 先设置 sending
    store.dispatch(editAndResendMessage.pending('req-1', {
      chatId,
      userMessageId: 'msg-user-1',
      newContent: 'Edited',
    }));
    expect(store.getState().chat.sendingChatIds[chatId]).toBe(true);

    // fulfilled 后清除
    store.dispatch(editAndResendMessage.fulfilled(undefined, 'req-1', {
      chatId,
      userMessageId: 'msg-user-1',
      newContent: 'Edited',
    }));
    expect(store.getState().chat.sendingChatIds[chatId]).toBeUndefined();
  });

  it('应该在 rejected 时回滚编辑并清除 sendingChatIds', () => {
    const chatId = 'test-chat-1';
    const userMsgId = 'msg-user-1';
    const assistantMsgId = 'msg-assistant-1';

    // 准备聊天数据
    const userMsg = createTestMessage({ id: userMsgId, role: ChatRoleEnum.USER, content: 'Hello' });
    const assistantMsg = createTestMessage({ id: assistantMsgId, role: ChatRoleEnum.ASSISTANT, content: 'Hi there' });
    const chat = createMockChat({
      id: chatId,
      chatModelList: [{ modelId: 'model-1', chatHistoryList: [userMsg, assistantMsg] }],
    });
    store.dispatch(createChat({ chat }));

    // 模拟先 commit 了编辑（手动 dispatch commitEdit）
    store.dispatch({ type: 'chat/commitEdit', payload: { chatId, userMessageId: userMsgId, newContent: 'Edited' } });

    // 验证编辑已提交
    const history = store.getState().chat.activeChatData[chatId].chatModelList[0].chatHistoryList;
    expect(history[0].content).toEqual(['Hello', 'Edited']);
    expect(history[1].content).toEqual(['Hi there', '']);

    // rejected 后回滚
    store.dispatch(editAndResendMessage.rejected(new Error('Stream failed'), 'req-1', {
      chatId,
      userMessageId: userMsgId,
      newContent: 'Edited',
    }));

    // 验证回滚
    const state = store.getState().chat;
    expect(state.sendingChatIds[chatId]).toBeUndefined();
    const rolledBack = state.activeChatData[chatId].chatModelList[0].chatHistoryList;
    expect(rolledBack[0].content).toBe('Hello');
    expect(rolledBack[1].content).toBe('Hi there');
  });

  it('应该完成完整的编辑重发流程（commit → stream → updateHistoryContent）', async () => {
    const chatId = 'test-chat-1';
    const userMsgId = 'msg-user-1';
    const assistantMsgId = 'msg-assistant-1';
    const modelId = 'model-1';

    // 准备模型
    const model = createMockModel({ id: modelId });

    // 准备聊天数据
    const userMsg = createTestMessage({ id: userMsgId, role: ChatRoleEnum.USER, content: 'Hello' });
    const assistantMsg = createTestMessage({ id: assistantMsgId, role: ChatRoleEnum.ASSISTANT, content: 'Hi there' });
    const chat = createMockChat({
      id: chatId,
      chatModelList: [{ modelId, chatHistoryList: [userMsg, assistantMsg] }],
    });
    store.dispatch(createChat({ chat }));

    // 设置模型到 store
    store.dispatch(createModel({ model }));

    // Mock streamChatCompletion 返回流式响应
    const streamMessage = createTestMessage({
      id: 'stream-msg',
      role: ChatRoleEnum.ASSISTANT,
      content: 'New AI response',
      reasoningContent: 'Thinking...',
    });
    mockStreamChatCompletion.mockReturnValue(createStreamGenerator([streamMessage]));

    // Dispatch thunk
    await store.dispatch(editAndResendMessage({
      chatId,
      userMessageId: userMsgId,
      newContent: 'Edited message',
    }));

    // 验证最终状态
    const state = store.getState().chat;
    expect(state.sendingChatIds[chatId]).toBeUndefined();

    const history = state.activeChatData[chatId].chatModelList[0].chatHistoryList;
    // 用户消息应该有编辑历史
    expect(Array.isArray(history[0].content)).toBe(true);
    expect(history[0].content).toEqual(['Hello', 'Edited message']);

    // AI 回复应该被更新为新内容
    expect(Array.isArray(history[1].content)).toBe(true);
    expect((history[1].content as string[]).length).toBeGreaterThanOrEqual(2);
  });

  it('应该在聊天不存在时安全退出', async () => {
    const result = await store.dispatch(editAndResendMessage({
      chatId: 'non-existent-chat',
      userMessageId: 'msg-1',
      newContent: 'Edited',
    }));

    // 应该 fulfilled（不抛异常）
    expect(result.type).toBe('chat/editAndResendMessage/fulfilled');
    expect(mockStreamChatCompletion).not.toHaveBeenCalled();
  });
});

describe('regenerateMessage thunk', () => {
  let store: any;

  const createTestStore = () => {
    return configureStore({
      reducer: {
        chat: chatReducer,
        models: modelReducer,
        appConfig: (state = { transmitHistoryReasoning: false, language: '', autoNamingEnabled: true }) => state,
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore();
  });

  it('应该在 pending 时设置 sendingChatIds', () => {
    const chatId = 'test-chat-1';

    store.dispatch(regenerateMessage.pending('req-1', {
      chatId,
      assistantMessageId: 'msg-assistant-1',
    }));

    expect(store.getState().chat.sendingChatIds[chatId]).toBe(true);
  });

  it('应该在 fulfilled 时清除 sendingChatIds', () => {
    const chatId = 'test-chat-1';

    store.dispatch(regenerateMessage.pending('req-1', {
      chatId,
      assistantMessageId: 'msg-assistant-1',
    }));

    store.dispatch(regenerateMessage.fulfilled(undefined, 'req-1', {
      chatId,
      assistantMessageId: 'msg-assistant-1',
    }));

    expect(store.getState().chat.sendingChatIds[chatId]).toBeUndefined();
  });

  it('应该在 rejected 时回滚重新生成并清除 sendingChatIds', () => {
    const chatId = 'test-chat-1';
    const userMsgId = 'msg-user-1';
    const assistantMsgId = 'msg-assistant-1';

    // 准备聊天数据
    const userMsg = createTestMessage({ id: userMsgId, role: ChatRoleEnum.USER, content: 'Hello' });
    const assistantMsg = createTestMessage({ id: assistantMsgId, role: ChatRoleEnum.ASSISTANT, content: 'Hi there' });
    const chat = createMockChat({
      id: chatId,
      chatModelList: [{ modelId: 'model-1', chatHistoryList: [userMsg, assistantMsg] }],
    });
    store.dispatch(createChat({ chat }));

    // 先初始化 runningChat 条目（覆盖策略要求 runningChat 先存在）
    store.dispatch({ type: 'chatModel/editRegenerateInit', payload: { chatId, modelId: 'model-1' } });
    // 再 commit 重新生成
    store.dispatch({ type: 'chat/commitRegenerate', payload: { chatId, assistantMessageId: assistantMsgId } });

    // 验证 commit 已生效（覆盖模式下 string 被覆盖为空字符串）
    const history = store.getState().chat.activeChatData[chatId].chatModelList[0].chatHistoryList;
    expect(history[1].content).toBe('');

    // rejected 后回滚
    store.dispatch(regenerateMessage.rejected(new Error('Stream failed'), 'req-1', {
      chatId,
      assistantMessageId: assistantMsgId,
    }));

    // 验证回滚（从回滚字段恢复旧值）
    const state = store.getState().chat;
    expect(state.sendingChatIds[chatId]).toBeUndefined();
    const rolledBack = state.activeChatData[chatId].chatModelList[0].chatHistoryList;
    expect(rolledBack[1].content).toBe('Hi there');
  });

  it('应该完成完整的重新生成流程（init → commit → stream → updateHistoryContent）', async () => {
    const chatId = 'test-chat-1';
    const userMsgId = 'msg-user-1';
    const assistantMsgId = 'msg-assistant-1';
    const modelId = 'model-1';

    // 准备模型
    const model = createMockModel({ id: modelId });

    // 准备聊天数据
    const userMsg = createTestMessage({ id: userMsgId, role: ChatRoleEnum.USER, content: 'Hello' });
    const assistantMsg = createTestMessage({ id: assistantMsgId, role: ChatRoleEnum.ASSISTANT, content: 'Hi there' });
    const chat = createMockChat({
      id: chatId,
      chatModelList: [{ modelId, chatHistoryList: [userMsg, assistantMsg] }],
    });
    store.dispatch(createChat({ chat }));
    store.dispatch(createModel({ model }));

    // Mock streamChatCompletion
    const streamMessage = createTestMessage({
      id: 'stream-msg',
      role: ChatRoleEnum.ASSISTANT,
      content: 'Regenerated response',
    });
    mockStreamChatCompletion.mockReturnValue(createStreamGenerator([streamMessage]));

    await store.dispatch(regenerateMessage({
      chatId,
      assistantMessageId: assistantMsgId,
    }));

    const state = store.getState().chat;
    expect(state.sendingChatIds[chatId]).toBeUndefined();

    const history = state.activeChatData[chatId].chatModelList[0].chatHistoryList;
    // 覆盖模式下，string content 仍为 string，被替换为新生成的内容
    expect(history[1].content).toBe('Regenerated response');
  });

  it('应该在聊天不存在时安全退出', async () => {
    const result = await store.dispatch(regenerateMessage({
      chatId: 'non-existent-chat',
      assistantMessageId: 'msg-1',
    }));

    expect(result.type).toBe('chat/regenerateMessage/fulfilled');
    expect(mockStreamChatCompletion).not.toHaveBeenCalled();
  });

  it('应该处理流式生成失败并正确回滚', async () => {
    const chatId = 'test-chat-1';
    const userMsgId = 'msg-user-1';
    const assistantMsgId = 'msg-assistant-1';
    const modelId = 'model-1';

    const model = createMockModel({ id: modelId });
    const userMsg = createTestMessage({ id: userMsgId, role: ChatRoleEnum.USER, content: 'Hello' });
    const assistantMsg = createTestMessage({ id: assistantMsgId, role: ChatRoleEnum.ASSISTANT, content: 'Hi there' });
    const chat = createMockChat({
      id: chatId,
      chatModelList: [{ modelId, chatHistoryList: [userMsg, assistantMsg] }],
    });
    store.dispatch(createChat({ chat }));
    store.dispatch(createModel({ model }));

    // Mock streamChatCompletion 抛出错误
    mockStreamChatCompletion.mockImplementation(() => {
      throw new Error('API connection failed');
    });

    const result = await store.dispatch(regenerateMessage({
      chatId,
      assistantMessageId: assistantMsgId,
    }));

    // 应该 rejected
    expect(result.type).toBe('chat/regenerateMessage/rejected');

    // 验证回滚
    const state = store.getState().chat;
    expect(state.sendingChatIds[chatId]).toBeUndefined();
    const history = state.activeChatData[chatId].chatModelList[0].chatHistoryList;
    // AI 回复应恢复为原始内容
    expect(history[1].content).toBe('Hi there');
  });
});
