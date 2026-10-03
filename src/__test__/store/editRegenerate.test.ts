/**
 * editAndResendMessage 和 regenerateMessage action 集成测试
 *
 * 测试编辑重发和重新生成 AI 回复的完整流程，包括：
 * - 正常流程：commit → stream → updateHistoryContent
 * - 失败回滚：commit → stream 失败 → rollback
 * - 执行期间/结束后 sendingChatIds 的管理
 * - commitEdit / commitRegenerate / rollbackEdit / rollbackRegenerate / editRegenerateInit 原子操作
 *
 * 转写自 Redux editRegenerate 测试（src/__test__/store/slices/editRegenerate.test.ts），行为断言保持一致。
 * 转写差异说明：Redux 的手动 dispatch pending/fulfilled/rejected action 改为通过真实异步 action
 * 配合可控的流式生成器（gate）在执行中途断言状态。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ChatRoleEnum, StandardMessage } from '@/types/chat';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { createMockChat } from '@/__test__/helpers/testing-utils';

// Mock 依赖
const { mockStreamChatCompletion } = vi.hoisted(() => ({
  mockStreamChatCompletion: vi.fn(),
}));

vi.mock('@/store/storage/chatStorage', () => ({
  loadChatIndex: vi.fn(() => Promise.resolve([])),
  saveChatIndex: vi.fn(() => Promise.resolve(undefined)),
  loadChatById: vi.fn(() => Promise.resolve(undefined)),
  saveChatById: vi.fn(() => Promise.resolve(undefined)),
  saveChatAndIndex: vi.fn(() => Promise.resolve(undefined)),
  deleteChatFromStorage: vi.fn(() => Promise.resolve(undefined)),
  migrateOldChatStorage: vi.fn(() => Promise.resolve(undefined)),
  resetChatsStore: vi.fn(),
}));

vi.mock('@/store/storage/modelStorage', () => ({
  loadModelsFromJson: vi.fn(() => Promise.resolve({ models: [], decryptionFailureCount: 0 })),
  saveModelsToJson: vi.fn(() => Promise.resolve(undefined)),
  resetModelsStore: vi.fn(),
}));

vi.mock('@/services/chat', () => ({
  streamChatCompletion: mockStreamChatCompletion,
  generateChatTitleService: vi.fn(),
}));

vi.mock('@/services/chat/providerLoader', () => ({
  getProviderSDKLoader: () => ({
    loadProvider: vi.fn(),
    isProviderLoaded: vi.fn(),
    getProviderState: vi.fn(),
    preloadProviders: vi.fn(),
    resetForTest: vi.fn(),
  }),
}));

// Mock appConfig store 的服务依赖（与 appConfig.test.ts 保持一致）
vi.mock('@/services/global', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/global')>();
  return {
    ...actual,
    getDefaultAppLanguage: vi.fn(),
  };
});

vi.mock('@/services/i18n', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/i18n')>();
  return {
    ...actual,
    changeAppLanguage: vi.fn(),
    tSafely: actual.tSafely,
  };
});

// Mock toastQueue（队列在未 markReady 时会永久等待）
vi.mock('@/services/toast', () => ({
  toastQueue: {
    loading: vi.fn().mockResolvedValue('loading-id'),
    dismiss: vi.fn(),
    success: vi.fn().mockResolvedValue('success-id'),
    error: vi.fn().mockResolvedValue('error-id'),
    warning: vi.fn().mockResolvedValue('warning-id'),
    info: vi.fn().mockResolvedValue('info-id'),
  },
}));

import { useChatStore } from '@/store/chat';
import { useModelsStore } from '@/store/models';

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

describe('chat store - 编辑/重新生成', () => {
  let store: ReturnType<typeof useChatStore>;

  /**
   * 准备聊天与模型数据（聊天包含一轮对话：用户消息 + AI 回复）
   */
  async function setupChatWithHistory(chatId: string, modelId: string) {
    const userMsgId = 'msg-user-1';
    const assistantMsgId = 'msg-assistant-1';
    const model = createMockModel({ id: modelId });
    const userMsg = createTestMessage({ id: userMsgId, role: ChatRoleEnum.USER, content: 'Hello' });
    const assistantMsg = createTestMessage({ id: assistantMsgId, role: ChatRoleEnum.ASSISTANT, content: 'Hi there' });
    const chat = createMockChat({
      id: chatId,
      chatModelList: [{ modelId, chatHistoryList: [userMsg, assistantMsg] }],
    });
    await store.createChat({ chat });
    await useModelsStore().createModel({ model });
    return { chat, model, userMsgId, assistantMsgId };
  }

  beforeEach(() => {
    // 重建 Pinia 实例，确保每个测试拿到全新 store
    setActivePinia(createPinia());
    store = useChatStore();

    vi.clearAllMocks();
  });

  describe('commitEdit / rollbackEdit / commitRegenerate / rollbackRegenerate / editRegenerateInit 原子操作', () => {
    it('commitEdit 应该原子更新用户消息和 AI 回复的 content 数组', async () => {
      const chatId = 'test-chat-1';
      const userMsgId = 'msg-user-1';

      await setupChatWithHistory(chatId, 'model-1');

      // 提交编辑
      const result = store.commitEdit({ chatId, userMessageId: userMsgId, newContent: 'Edited' });

      expect(result).toBe(true);
      // 验证编辑已提交：用户消息和 AI 回复都追加了新版本
      const history = store.activeChatData[chatId].chatModelList![0].chatHistoryList;
      expect(history[0].content).toEqual(['Hello', 'Edited']);
      expect(history[1].content).toEqual(['Hi there', '']);
    });

    it('rollbackEdit 应该恢复用户消息和 AI 回复到编辑前的状态', async () => {
      const chatId = 'test-chat-1';
      const userMsgId = 'msg-user-1';

      await setupChatWithHistory(chatId, 'model-1');

      // 先提交编辑再回滚
      store.commitEdit({ chatId, userMessageId: userMsgId, newContent: 'Edited' });
      const result = store.rollbackEdit({ chatId, userMessageId: userMsgId });

      expect(result).toBe(true);
      const history = store.activeChatData[chatId].chatModelList![0].chatHistoryList;
      expect(history[0].content).toBe('Hello');
      expect(history[1].content).toBe('Hi there');
    });

    it('editRegenerateInit 应该初始化 runningChat 结构且不覆盖已有条目', async () => {
      const chatId = 'test-chat-1';
      const modelId = 'model-1';

      await setupChatWithHistory(chatId, modelId);

      // 初始化 runningChat 结构
      store.editRegenerateInit({ chatId, modelId });

      expect(store.runningChat[chatId][modelId]).toEqual({
        isSending: true,
        history: null,
      });

      // 再次初始化不应覆盖已有条目
      store.pushRunningChatHistory({
        chat: store.activeChatData[chatId],
        model: createMockModel({ id: modelId }),
        message: createTestMessage({ id: 'stream-msg', role: ChatRoleEnum.ASSISTANT, content: 'partial' }),
      });
      store.editRegenerateInit({ chatId, modelId });

      expect(store.runningChat[chatId][modelId].history).not.toBeNull();
    });

    it('commitRegenerate 应该将 AI 回复原地覆盖为空字符串（需先初始化 runningChat）', async () => {
      const chatId = 'test-chat-1';
      const modelId = 'model-1';
      const assistantMsgId = 'msg-assistant-1';

      await setupChatWithHistory(chatId, modelId);

      // 先初始化 runningChat 条目（commitRegenerate 需要 runningChat 先存在）
      store.editRegenerateInit({ chatId, modelId });
      // 再提交重新生成
      const result = store.commitRegenerate({ chatId, assistantMessageId: assistantMsgId });

      expect(result).toBe(true);
      // 验证 commit 已生效（覆盖模式下 string 被覆盖为空字符串）
      const history = store.activeChatData[chatId].chatModelList![0].chatHistoryList;
      expect(history[1].content).toBe('');
    });

    it('rollbackRegenerate 应该从回滚字段恢复 AI 回复的旧值', async () => {
      const chatId = 'test-chat-1';
      const modelId = 'model-1';
      const assistantMsgId = 'msg-assistant-1';

      await setupChatWithHistory(chatId, modelId);

      // init → commit → rollback
      store.editRegenerateInit({ chatId, modelId });
      store.commitRegenerate({ chatId, assistantMessageId: assistantMsgId });
      const result = store.rollbackRegenerate({ chatId, assistantMessageId: assistantMsgId });

      expect(result).toBe(true);
      // 验证回滚（从回滚字段恢复旧值）
      const history = store.activeChatData[chatId].chatModelList![0].chatHistoryList;
      expect(history[1].content).toBe('Hi there');
    });
  });

  describe('editAndResendMessage', () => {
    it('应该在执行期间设置 sendingChatIds', async () => {
      const chatId = 'test-chat-1';

      const { userMsgId } = await setupChatWithHistory(chatId, 'model-1');

      // 使用 gate 控制流式响应，使编辑重发停留在执行中
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      mockStreamChatCompletion.mockImplementation(
        () =>
          // oxlint-disable-next-line require-yield -- gate 挂起的空流生成器
          (async function* () {
            await gate;
          })(),
      );

      const promise = store.editAndResendMessage({
        chatId,
        userMessageId: userMsgId,
        newContent: 'Edited',
      });

      // 执行期间（原 pending）sendingChatIds 包含该聊天
      expect(store.sendingChatIds[chatId]).toBe(true);

      release();
      await promise;
    });

    it('应该在完成后清除 sendingChatIds', async () => {
      const chatId = 'test-chat-1';
      const userMsgId = 'msg-user-1';

      await setupChatWithHistory(chatId, 'model-1');

      mockStreamChatCompletion.mockImplementation(() => createStreamGenerator([]));

      await store.editAndResendMessage({
        chatId,
        userMessageId: userMsgId,
        newContent: 'Edited',
      });

      // 完成后（原 fulfilled）清除
      expect(store.sendingChatIds[chatId]).toBeUndefined();
    });

    it('应该在流式失败时回滚编辑并清除 sendingChatIds', async () => {
      const chatId = 'test-chat-1';
      const userMsgId = 'msg-user-1';

      vi.spyOn(console, 'error').mockImplementation(() => {});

      await setupChatWithHistory(chatId, 'model-1');

      // Mock streamChatCompletion 抛出错误（commit 已生效后被回滚）
      mockStreamChatCompletion.mockImplementation(() => {
        throw new Error('Stream failed');
      });

      await expect(
        store.editAndResendMessage({
          chatId,
          userMessageId: userMsgId,
          newContent: 'Edited',
        }),
      ).rejects.toThrow('Stream failed');

      // 验证回滚与 sendingChatIds 清理
      expect(store.sendingChatIds[chatId]).toBeUndefined();
      const rolledBack = store.activeChatData[chatId].chatModelList![0].chatHistoryList;
      expect(rolledBack[0].content).toBe('Hello');
      expect(rolledBack[1].content).toBe('Hi there');
    });

    it('应该完成完整的编辑重发流程（commit → stream → updateHistoryContent）', async () => {
      const chatId = 'test-chat-1';
      const userMsgId = 'msg-user-1';

      await setupChatWithHistory(chatId, 'model-1');

      // Mock streamChatCompletion 返回流式响应
      const streamMessage = createTestMessage({
        id: 'stream-msg',
        role: ChatRoleEnum.ASSISTANT,
        content: 'New AI response',
        reasoningContent: 'Thinking...',
      });
      mockStreamChatCompletion.mockReturnValue(createStreamGenerator([streamMessage]));

      await store.editAndResendMessage({
        chatId,
        userMessageId: userMsgId,
        newContent: 'Edited message',
      });

      // 验证最终状态
      expect(store.sendingChatIds[chatId]).toBeUndefined();

      const history = store.activeChatData[chatId].chatModelList![0].chatHistoryList;
      // 用户消息应该有编辑历史
      expect(Array.isArray(history[0].content)).toBe(true);
      expect(history[0].content).toEqual(['Hello', 'Edited message']);

      // AI 回复应该被更新为新内容（数组长度至少为 2）
      expect(Array.isArray(history[1].content)).toBe(true);
      expect(history[1].content).toEqual(['Hi there', 'New AI response']);
    });

    it('应该在聊天不存在时安全退出', async () => {
      await expect(
        store.editAndResendMessage({
          chatId: 'non-existent-chat',
          userMessageId: 'msg-1',
          newContent: 'Edited',
        }),
      ).resolves.toBeUndefined();

      // 应该正常完成（不抛异常）且不调用流式服务
      expect(mockStreamChatCompletion).not.toHaveBeenCalled();
    });
  });

  describe('regenerateMessage', () => {
    it('应该在执行期间设置 sendingChatIds', async () => {
      const chatId = 'test-chat-1';
      const assistantMsgId = 'msg-assistant-1';

      await setupChatWithHistory(chatId, 'model-1');

      // 使用 gate 控制流式响应，使重新生成停留在执行中
      let release!: () => void;
      const gate = new Promise<void>((resolve) => (release = resolve));
      mockStreamChatCompletion.mockImplementation(
        () =>
          // oxlint-disable-next-line require-yield -- gate 挂起的空流生成器
          (async function* () {
            await gate;
          })(),
      );

      const promise = store.regenerateMessage({
        chatId,
        assistantMessageId: assistantMsgId,
      });

      // 执行期间（原 pending）sendingChatIds 包含该聊天
      expect(store.sendingChatIds[chatId]).toBe(true);

      release();
      await promise;
    });

    it('应该在完成后清除 sendingChatIds', async () => {
      const chatId = 'test-chat-1';
      const assistantMsgId = 'msg-assistant-1';

      await setupChatWithHistory(chatId, 'model-1');

      mockStreamChatCompletion.mockImplementation(() => createStreamGenerator([]));

      await store.regenerateMessage({
        chatId,
        assistantMessageId: assistantMsgId,
      });

      // 完成后（原 fulfilled）清除
      expect(store.sendingChatIds[chatId]).toBeUndefined();
    });

    it('应该在流式失败时回滚重新生成并清除 sendingChatIds', async () => {
      const chatId = 'test-chat-1';
      const assistantMsgId = 'msg-assistant-1';

      vi.spyOn(console, 'error').mockImplementation(() => {});

      await setupChatWithHistory(chatId, 'model-1');

      // Mock 流式生成器在产出任何数据前失败（init → commit 已生效后被回滚）
      mockStreamChatCompletion.mockImplementation(
        () =>
          // oxlint-disable-next-line require-yield -- 失败流生成器（无产出）
          (async function* () {
            throw new Error('Stream failed');
          })(),
      );

      await expect(
        store.regenerateMessage({
          chatId,
          assistantMessageId: assistantMsgId,
        }),
      ).rejects.toThrow('Stream failed');

      // 验证回滚（从回滚字段恢复旧值）与 sendingChatIds 清理
      expect(store.sendingChatIds[chatId]).toBeUndefined();
      const rolledBack = store.activeChatData[chatId].chatModelList![0].chatHistoryList;
      expect(rolledBack[1].content).toBe('Hi there');
    });

    it('应该完成完整的重新生成流程（init → commit → stream → updateHistoryContent）', async () => {
      const chatId = 'test-chat-1';
      const assistantMsgId = 'msg-assistant-1';

      await setupChatWithHistory(chatId, 'model-1');

      // Mock streamChatCompletion
      const streamMessage = createTestMessage({
        id: 'stream-msg',
        role: ChatRoleEnum.ASSISTANT,
        content: 'Regenerated response',
      });
      mockStreamChatCompletion.mockReturnValue(createStreamGenerator([streamMessage]));

      await store.regenerateMessage({
        chatId,
        assistantMessageId: assistantMsgId,
      });

      expect(store.sendingChatIds[chatId]).toBeUndefined();

      const history = store.activeChatData[chatId].chatModelList![0].chatHistoryList;
      // 覆盖模式下，string content 仍为 string，被替换为新生成的内容
      expect(history[1].content).toBe('Regenerated response');
    });

    it('应该在聊天不存在时安全退出', async () => {
      await expect(
        store.regenerateMessage({
          chatId: 'non-existent-chat',
          assistantMessageId: 'msg-1',
        }),
      ).resolves.toBeUndefined();

      // 应该正常完成（不抛异常）且不调用流式服务
      expect(mockStreamChatCompletion).not.toHaveBeenCalled();
    });

    it('应该处理流式生成失败并正确回滚', async () => {
      const chatId = 'test-chat-1';
      const assistantMsgId = 'msg-assistant-1';

      vi.spyOn(console, 'error').mockImplementation(() => {});

      await setupChatWithHistory(chatId, 'model-1');

      // Mock streamChatCompletion 同步抛出错误
      mockStreamChatCompletion.mockImplementation(() => {
        throw new Error('API connection failed');
      });

      await expect(
        store.regenerateMessage({
          chatId,
          assistantMessageId: assistantMsgId,
        }),
      ).rejects.toThrow('API connection failed');

      // 验证回滚
      expect(store.sendingChatIds[chatId]).toBeUndefined();
      const history = store.activeChatData[chatId].chatModelList![0].chatHistoryList;
      // AI 回复应恢复为原始内容
      expect(history[1].content).toBe('Hi there');
    });
  });
});
