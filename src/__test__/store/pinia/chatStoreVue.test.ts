/**
 * Pinia chat store 单元测试（Vue 版）
 *
 * 承接被删除的 Redux 版 chatSlices/editRegenerate 测试的核心行为：
 * - 聊天元数据与选中状态管理
 * - 聊天增删改（含持久化交互）
 * - 发送消息全流程（流式快照写入 runningChat → 回写 activeChatData → 自动命名触发）
 * - 编辑重发与重新生成的提交/回滚（content 为多版本数组语义）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

// Mock 持久化层（隔离 IndexedDB）
vi.mock('@/store/storage', () => ({
  loadChatIndex: vi.fn().mockResolvedValue([]),
  loadChatById: vi.fn().mockResolvedValue(undefined),
  saveChatAndIndex: vi.fn().mockResolvedValue(undefined),
  saveChatIndex: vi.fn().mockResolvedValue(undefined),
  deleteChatFromStorage: vi.fn().mockResolvedValue(undefined),
  migrateOldChatStorage: vi.fn().mockResolvedValue(undefined),
}));

// Mock 流式服务与标题生成（外部 API）
const mockStreamChatCompletion = vi.fn();
vi.mock('@/services/chat', () => ({
  streamChatCompletion: (...args: unknown[]) => mockStreamChatCompletion(...args),
  generateChatTitleService: vi.fn().mockResolvedValue('生成的标题'),
}));

// Mock 供应商 SDK 预加载
vi.mock('@/services/chat/providerLoader', () => ({
  getProviderSDKLoader: vi.fn(() => ({
    loadProviderSDK: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { useChatStore } from '@/store/pinia/chat';
import { useAppConfigStore } from '@/store/pinia/appConfig';
import { useModelStore } from '@/store/pinia/model';
import {
  loadChatIndex,
  saveChatAndIndex,
  deleteChatFromStorage,
} from '@/store/storage';
import { ChatRoleEnum, type Chat } from '@/types/chat';
import { createUserMessage, createAssistantMessage } from '@/__test__/fixtures/chat';
import { createMockModel } from '@/__test__/helpers/fixtures/model';

/**
 * 创建测试聊天（含指定模型与历史）
 */
function createTestChat(chatId: string, modelId: string, history: StandardMessage[] = []): Chat {
  return {
    id: chatId,
    name: '测试聊天',
    createdAt: 1000,
    updatedAt: 1000,
    isManuallyNamed: false,
    chatModelList: [{ modelId, chatHistoryList: history }],
  } as unknown as Chat;
}

/**
 * 创建流式响应 mock（每段 yield 最新完整内容快照，与流协议语义一致）
 */
function mockStreamSnapshot(snapshots: string[]) {
  return mockStreamChatCompletion.mockImplementationOnce(async function* () {
    for (const snapshot of snapshots) {
      yield createAssistantMessage(snapshot);
    }
  });
}

describe('Pinia chat store', () => {
  let chatStore: ReturnType<typeof useChatStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    chatStore = useChatStore();
    vi.clearAllMocks();
    vi.mocked(loadChatIndex).mockResolvedValue([]);
  });

  describe('元数据与选中状态', () => {
    it('setChatMetaList 应复制列表', () => {
      const meta = [{ id: 'c1', name: '聊天1', updatedAt: 1 }] as unknown as ChatMeta[];
      chatStore.setChatMetaList(meta);

      expect(chatStore.chatMetaList).toHaveLength(1);
      expect(chatStore.chatMetaList[0].id).toBe('c1');
    });

    it('setSelectedChatId 应更新选中 ID，支持 null', () => {
      chatStore.setSelectedChatId('c1');
      expect(chatStore.selectedChatId).toBe('c1');

      chatStore.setSelectedChatId(null);
      expect(chatStore.selectedChatId).toBeNull();
    });

    it('clearError / clearInitializationError 应清除错误', () => {
      chatStore.error = 'e';
      chatStore.initializationError = 'ie';
      chatStore.clearError();
      chatStore.clearInitializationError();
      expect(chatStore.error).toBeNull();
      expect(chatStore.initializationError).toBeNull();
    });
  });

  describe('initializeChatList', () => {
    it('应加载索引并过滤已删除聊天', async () => {
      vi.mocked(loadChatIndex).mockResolvedValueOnce([
        { id: 'c1', name: 'a', updatedAt: 1 } as ChatMeta,
        { id: 'c2', name: 'b', updatedAt: 2, isDeleted: true } as ChatMeta,
      ]);

      await chatStore.initializeChatList();

      expect(chatStore.chatMetaList).toHaveLength(1);
      expect(chatStore.chatMetaList[0].id).toBe('c1');
      expect(chatStore.loading).toBe(false);
    });

    it('加载失败时应记录 initializationError', async () => {
      vi.mocked(loadChatIndex).mockRejectedValueOnce(new Error('索引损坏'));

      const result = await chatStore.initializeChatList();

      expect(result).toBeUndefined();
      expect(chatStore.initializationError).toBe('索引损坏');
    });
  });

  describe('聊天增删改（持久化下沉）', () => {
    it('createChat 应更新列表与 activeChatData 并持久化', async () => {
      const chat = createTestChat('c-new', 'm1');
      await chatStore.createChat({ chat });

      expect(chatStore.chatMetaList[0].id).toBe('c-new');
      expect(chatStore.activeChatData['c-new']).toBeDefined();
      expect(saveChatAndIndex).toHaveBeenCalledWith('c-new', chat, expect.anything());
    });

    it('editChatName 应同步更新 meta 与 activeChatData 并标记手动命名', async () => {
      const chat = createTestChat('c1', 'm1');
      chatStore.activeChatData['c1'] = chat;
      chatStore.chatMetaList = [{ id: 'c1', name: '旧名', updatedAt: 1 } as unknown as ChatMeta];

      await chatStore.editChatName({ id: 'c1', name: '新名' });

      expect(chatStore.chatMetaList[0].name).toBe('新名');
      expect(chatStore.activeChatData['c1'].name).toBe('新名');
      expect(chatStore.activeChatData['c1'].isManuallyNamed).toBe(true);
    });

    it('deleteChat 应从列表与 activeChatData 移除并调用存储删除', async () => {
      const chat = createTestChat('c-del', 'm1');
      chatStore.activeChatData['c-del'] = chat;
      chatStore.chatMetaList = [{ id: 'c-del', name: 'x', updatedAt: 1 } as unknown as ChatMeta];
      chatStore.selectedChatId = 'c-del';

      await chatStore.deleteChat({ chat });

      expect(chatStore.chatMetaList).toHaveLength(0);
      expect(chatStore.activeChatData['c-del']).toBeUndefined();
      expect(chatStore.selectedChatId).toBeNull();
      expect(deleteChatFromStorage).toHaveBeenCalled();
    });
  });

  describe('sendMessage 全流程', () => {
    it('流式完成后应回写 activeChatData 并清理 runningChat', async () => {
      const model = createMockModel({ id: 'm1', modelName: '模型A' });
      const chat = createTestChat('c1', 'm1');
      chatStore.activeChatData['c1'] = chat;

      mockStreamSnapshot(['你好', '你好！']);

      await chatStore.sendMessage({ chat, message: 'hi', model, historyList: [] });

      // 用户消息 + AI 回复（最终快照）已写入 activeChatData
      const history = chatStore.activeChatData['c1'].chatModelList![0].chatHistoryList;
      expect(history).toHaveLength(2);
      expect(history[0].role).toBe(ChatRoleEnum.USER);
      expect(history[0].content).toBe('hi');
      expect(history[1].content).toBe('你好！');
      // 临时数据已清理
      expect(chatStore.runningChat['c1']?.['m1']).toBeUndefined();
    });

    it('流式中断（abort）时保留已写入的部分内容', async () => {
      const model = createMockModel({ id: 'm1' });
      const chat = createTestChat('c1', 'm1');
      chatStore.activeChatData['c1'] = chat;

      const controller = new AbortController();
      mockStreamChatCompletion.mockImplementationOnce(async function* () {
        yield createAssistantMessage('部分内容');
        controller.abort();
        yield createAssistantMessage('部分内容+后续');
      });

      await chatStore.sendMessage({ chat, message: 'hi', model, historyList: [] }, { signal: controller.signal });

      const history = chatStore.activeChatData['c1'].chatModelList![0].chatHistoryList;
      // abort 后 break，用户消息仍在
      expect(history.some((m) => m.role === ChatRoleEnum.USER)).toBe(true);
    });

    it('发送失败时应记录 errorMessage 并抛出', async () => {
      const model = createMockModel({ id: 'm1' });
      const chat = createTestChat('c1', 'm1');
      chatStore.activeChatData['c1'] = chat;

      mockStreamChatCompletion.mockImplementationOnce(() => {
        throw new Error('网络错误');
      });

      await expect(
        chatStore.sendMessage({ chat, message: 'hi', model, historyList: [] }),
      ).rejects.toThrow('网络错误');

      expect(chatStore.runningChat['c1']['m1'].isSending).toBe(false);
      expect(chatStore.runningChat['c1']['m1'].errorMessage).toContain('网络错误');
    });

    it('完成后应触发自动命名（标题为空 + 开关开启 + 首轮对话）', async () => {
      const { generateChatTitleService } = await import('@/services/chat');
      const model = createMockModel({ id: 'm1' });
      const chat = createTestChat('c1', 'm1');
      chat.name = '';
      chatStore.activeChatData['c1'] = chat;

      const appConfigStore = useAppConfigStore();
      appConfigStore.autoNamingEnabled = true;

      mockStreamSnapshot(['回复']);

      await chatStore.sendMessage({ chat, message: 'hi', model, historyList: [] });

      // 等待异步自动命名触发
      await vi.waitFor(() => {
        expect(generateChatTitleService).toHaveBeenCalled();
      });
    });

    it('用户已手动命名时不应触发自动命名', async () => {
      const { generateChatTitleService } = await import('@/services/chat');
      const model = createMockModel({ id: 'm1' });
      const chat = createTestChat('c1', 'm1');
      chat.name = '';
      chat.isManuallyNamed = true;
      chatStore.activeChatData['c1'] = chat;

      mockStreamSnapshot(['回复']);

      await chatStore.sendMessage({ chat, message: 'hi', model, historyList: [] });
      await new Promise((r) => setTimeout(r, 10));

      expect(generateChatTitleService).not.toHaveBeenCalled();
    });
  });

  describe('编辑重发与重新生成', () => {
    it('editAndResendMessage 应提交编辑（版本数组）并重发回写', async () => {
      const model = createMockModel({ id: 'm1', isEnable: true });
      const modelStore = useModelStore();
      modelStore.models = [model];

      const chat = createTestChat('c1', 'm1', [
        createUserMessage('旧问题', { id: 'u1' }),
        createAssistantMessage('旧回答', { id: 'a1' }),
      ]);
      chatStore.activeChatData['c1'] = chat;

      const appConfigStore = useAppConfigStore();
      appConfigStore.transmitHistoryReasoning = false;

      mockStreamSnapshot(['新回答']);

      await chatStore.editAndResendMessage({ chatId: 'c1', userMessageId: 'u1', newContent: '新问题' });

      const history = chatStore.activeChatData['c1'].chatModelList![0].chatHistoryList;
      // 用户消息 content 变为版本数组，最新版本为新问题
      expect(history[0].content).toEqual(['旧问题', '新问题']);
      // AI 回复的新版本写入流式结果
      expect(history[1].content).toEqual(['旧回答', '新回答']);
      expect(chatStore.sendingChatIds['c1']).toBeUndefined();
    });

    it('editAndResendMessage 失败时应回滚编辑内容', async () => {
      const model = createMockModel({ id: 'm1', isEnable: true });
      const modelStore = useModelStore();
      modelStore.models = [model];

      const chat = createTestChat('c1', 'm1', [
        createUserMessage('旧问题', { id: 'u1' }),
        createAssistantMessage('旧回答', { id: 'a1' }),
      ]);
      chatStore.activeChatData['c1'] = chat;

      mockStreamChatCompletion.mockImplementationOnce(() => {
        throw new Error('重发失败');
      });

      await expect(
        chatStore.editAndResendMessage({ chatId: 'c1', userMessageId: 'u1', newContent: '新问题' }),
      ).rejects.toThrow('重发失败');

      // 回滚后 content 恢复为字符串旧问题
      expect(chatStore.activeChatData['c1'].chatModelList![0].chatHistoryList[0].content).toBe('旧问题');
    });

    it('regenerateMessage 应提交重生成并回写新内容', async () => {
      const model = createMockModel({ id: 'm1', isEnable: true });
      const modelStore = useModelStore();
      modelStore.models = [model];

      const chat = createTestChat('c1', 'm1', [
        createUserMessage('问题', { id: 'u1' }),
        createAssistantMessage('旧回答', { id: 'a1' }),
      ]);
      chatStore.activeChatData['c1'] = chat;

      mockStreamSnapshot(['新回答内容']);

      await chatStore.regenerateMessage({ chatId: 'c1', assistantMessageId: 'a1' });

      const history = chatStore.activeChatData['c1'].chatModelList![0].chatHistoryList;
      // 重生成为原地覆盖语义：旧内容仅在失败回滚时恢复
      expect(history[1].content).toBe('新回答内容');
      expect(chatStore.sendingChatIds['c1']).toBeUndefined();
    });

    it('regenerateMessage 消息不存在时直接返回', async () => {
      const chat = createTestChat('c1', 'm1', []);
      chatStore.activeChatData['c1'] = chat;

      await chatStore.regenerateMessage({ chatId: 'c1', assistantMessageId: '不存在' });

      expect(mockStreamChatCompletion).not.toHaveBeenCalled();
    });
  });

  describe('updateHistoryContent', () => {
    it('应更新指定位置的消息内容', () => {
      const chat = createTestChat('c1', 'm1', [
        createUserMessage('问题', { id: 'u1' }),
        createAssistantMessage('旧回答', { id: 'a1' }),
      ]);
      chatStore.activeChatData['c1'] = chat;

      chatStore.updateHistoryContent({
        chatId: 'c1',
        modelId: 'm1',
        messageIndex: 1,
        content: '更新后的内容',
      });

      const aiMessage = chatStore.activeChatData['c1'].chatModelList![0].chatHistoryList[1];
      expect(aiMessage.content).toBe('更新后的内容');
    });
  });
});
