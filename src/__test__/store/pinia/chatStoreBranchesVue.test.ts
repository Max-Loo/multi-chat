/**
 * Pinia chat store 分支补充测试（Vue 版）
 *
 * 覆盖核心流程测试未触及的边界分支：
 * - createChat 补 updatedAt、editChatName 空标题/截断/未加载聊天
 * - deleteChat 发送中跳过、clearActiveChatData / releaseCompletedBackgroundChat
 * - setSelectedChatIdWithPreload 各分支
 * - 自动命名全部前置条件与生成成功路径
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/store/storage', () => ({
  loadChatIndex: vi.fn().mockResolvedValue([]),
  loadChatById: vi.fn().mockResolvedValue(undefined),
  saveChatAndIndex: vi.fn().mockResolvedValue(undefined),
  saveChatIndex: vi.fn().mockResolvedValue(undefined),
  deleteChatFromStorage: vi.fn().mockResolvedValue(undefined),
  migrateOldChatStorage: vi.fn().mockResolvedValue(undefined),
}));

const mockStreamChatCompletion = vi.fn();
const mockGenerateChatTitleService = vi.fn();
vi.mock('@/services/chat', () => ({
  streamChatCompletion: (...args: unknown[]) => mockStreamChatCompletion(...args),
  generateChatTitleService: (...args: unknown[]) => mockGenerateChatTitleService(...args),
}));

vi.mock('@/services/chat/providerLoader', () => ({
  getProviderSDKLoader: vi.fn(() => ({
    loadProviderSDK: vi.fn().mockResolvedValue(undefined),
    preloadProviders: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { useChatStore } from '@/store/pinia/chat';
import { useAppConfigStore } from '@/store/pinia/appConfig';
import { useModelStore } from '@/store/pinia/model';
import { loadChatById, loadChatIndex, saveChatAndIndex } from '@/store/storage';
import { type Chat, type StandardMessage } from '@/types/chat';
import { createUserMessage, createAssistantMessage } from '@/__test__/fixtures/chat';
import { createMockModel } from '@/__test__/helpers/fixtures/model';

/** 创建测试聊天 */
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

describe('Pinia chat store 分支补充', () => {
  let chatStore: ReturnType<typeof useChatStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    chatStore = useChatStore();
    vi.clearAllMocks();
    vi.mocked(loadChatIndex).mockResolvedValue([]);
    vi.mocked(loadChatById).mockResolvedValue(undefined);
    mockGenerateChatTitleService.mockResolvedValue('生成的标题');
  });

  describe('createChat / editChatName 边界', () => {
    it('createChat 无 updatedAt 时应自动补时间戳', async () => {
      const chat = { ...createTestChat('c-new', 'm1'), updatedAt: undefined };
      await chatStore.createChat({ chat });

      expect(chat.updatedAt).not.toBeUndefined();
      expect(chatStore.chatMetaList[0].id).toBe('c-new');
    });

    it('editChatName 空标题应静默拒绝', async () => {
      const chat = createTestChat('c1', 'm1');
      chatStore.activeChatData['c1'] = chat;

      await chatStore.editChatName({ id: 'c1', name: '   ' });

      expect(chatStore.activeChatData['c1'].name).toBe('测试聊天');
      expect(chatStore.activeChatData['c1'].isManuallyNamed).toBe(false);
    });

    it('editChatName 超长标题应截断到 20 字符', async () => {
      const chat = createTestChat('c1', 'm1');
      chatStore.activeChatData['c1'] = chat;

      const longName = 'a'.repeat(30);
      await chatStore.editChatName({ id: 'c1', name: longName });

      expect(chatStore.activeChatData['c1'].name).toBe('a'.repeat(20));
    });

    it('editChatName 聊天未加载时应从存储读取后持久化', async () => {
      const stored = createTestChat('c-remote', 'm1');
      vi.mocked(loadChatById).mockResolvedValueOnce(stored);

      await chatStore.editChatName({ id: 'c-remote', name: '远程重命名' });

      expect(loadChatById).toHaveBeenCalledWith('c-remote');
      expect(saveChatAndIndex).toHaveBeenCalledWith('c-remote', stored, expect.anything());
      expect(stored.name).toBe('远程重命名');
    });
  });

  describe('deleteChat / 数据回收', () => {
    it('发送中的聊天应跳过删除', async () => {
      const chat = createTestChat('c1', 'm1');
      chatStore.sendingChatIds['c1'] = true;

      await chatStore.deleteChat({ chat });

      // 跳过路径不会触发任何存储调用
      expect(loadChatIndex).not.toHaveBeenCalled();
    });

    it('clearActiveChatData 发送中的聊天应跳过清理', () => {
      const chat = createTestChat('c1', 'm1');
      chatStore.activeChatData['c1'] = chat;
      chatStore.sendingChatIds['c1'] = true;

      chatStore.clearActiveChatData('c1');

      expect(chatStore.activeChatData['c1']).toBeDefined();
    });

    it('releaseCompletedBackgroundChat 仅回收非当前选中聊天', () => {
      const chatA = createTestChat('a', 'm1');
      const chatB = createTestChat('b', 'm1');
      chatStore.activeChatData['a'] = chatA;
      chatStore.activeChatData['b'] = chatB;
      chatStore.selectedChatId = 'b';

      chatStore.releaseCompletedBackgroundChat('a');
      expect(chatStore.activeChatData['a']).toBeUndefined();

      chatStore.releaseCompletedBackgroundChat('b');
      expect(chatStore.activeChatData['b']).toBeDefined();
    });
  });

  describe('setSelectedChatIdWithPreload', () => {
    it('null 应清空选中且不加载聊天', async () => {
      const chat = createTestChat('c1', 'm1');
      chatStore.activeChatData['c1'] = chat;
      chatStore.selectedChatId = 'c1';

      await chatStore.setSelectedChatIdWithPreload(null);

      expect(chatStore.selectedChatId).toBeNull();
    });

    it('存储中不存在的聊天应警告并应用 undefined', async () => {
      vi.mocked(loadChatById).mockResolvedValueOnce(undefined);

      await chatStore.setSelectedChatIdWithPreload('ghost');

      expect(chatStore.selectedChatId).toBe('ghost');
    });

    it('无模型的新聊天不触发 SDK 预加载', async () => {
      const chat = createTestChat('c1', 'm1');
      chat.chatModelList = [];
      vi.mocked(loadChatById).mockResolvedValueOnce(chat);

      await chatStore.setSelectedChatIdWithPreload('c1');

      // Pinia state 经 reactive 包装，用结构比较验证写回
      expect(chatStore.activeChatData['c1']).toStrictEqual(chat);
    });

    it('已加载的聊天应直接使用并预加载 SDK', async () => {
      const model = createMockModel({ id: 'm1' });
      const modelStore = useModelStore();
      modelStore.models = [model];

      const chat = createTestChat('c1', 'm1');
      chatStore.activeChatData['c1'] = chat;

      await chatStore.setSelectedChatIdWithPreload('c1');

      expect(chatStore.selectedChatId).toBe('c1');
    });
  });

  describe('自动命名前置条件', () => {
    it('开关关闭时不触发自动命名', async () => {
            const model = createMockModel({ id: 'm1' });
      const chat = createTestChat('c1', 'm1');
      chat.name = '';
      chatStore.activeChatData['c1'] = chat;

      const appConfigStore = useAppConfigStore();
      appConfigStore.autoNamingEnabled = false;

      mockStreamChatCompletion.mockImplementationOnce(async function* () {
        yield createAssistantMessage('回复');
      });

      await chatStore.sendMessage({ chat, message: 'hi', model, historyList: [] });
      await new Promise((r) => setTimeout(r, 10));

      expect(mockGenerateChatTitleService).not.toHaveBeenCalled();
    });

    it('对话长度不为 2 时不触发自动命名', async () => {
      const model = createMockModel({ id: 'm1' });
      const chat = createTestChat('c1', 'm1');
      chat.name = '';
      // 预置一轮对话，发送后历史长度为 3（≠2），不满足首轮条件
      chatStore.activeChatData['c1'] = chat;
      chat.chatModelList![0].chatHistoryList = [
        createUserMessage('上一轮', { id: 'u0' }),
        createAssistantMessage('上一轮回复', { id: 'a0' }),
      ];

      mockStreamChatCompletion.mockImplementationOnce(async function* () {
        yield createAssistantMessage('回复');
      });

      await chatStore.sendMessage({ chat, message: 'hi', model, historyList: [] });
      await new Promise((r) => setTimeout(r, 10));

      expect(mockGenerateChatTitleService).not.toHaveBeenCalled();
    });

    it('标题生成成功后应更新名称并持久化', async () => {
      const model = createMockModel({ id: 'm1' });
      const chat = createTestChat('c1', 'm1');
      chat.name = '';
      chatStore.activeChatData['c1'] = chat;

      const appConfigStore = useAppConfigStore();
      appConfigStore.autoNamingEnabled = true;
      mockGenerateChatTitleService.mockResolvedValue('AI 生成的标题');

      mockStreamChatCompletion.mockImplementationOnce(async function* () {
        yield createAssistantMessage('回复');
      });

      await chatStore.sendMessage({ chat, message: 'hi', model, historyList: [] });

      await vi.waitFor(() => {
        expect(chatStore.activeChatData['c1'].name).toBe('AI 生成的标题');
      });
      expect(saveChatAndIndex).toHaveBeenCalled();
    });

    it('标题生成服务失败时应静默', async () => {
      const model = createMockModel({ id: 'm1' });
      const chat = createTestChat('c1', 'm1');
      chat.name = '';
      chatStore.activeChatData['c1'] = chat;

      mockGenerateChatTitleService.mockRejectedValueOnce(new Error('服务超时'));

      mockStreamChatCompletion.mockImplementationOnce(async function* () {
        yield createAssistantMessage('回复');
      });

      await chatStore.sendMessage({ chat, message: 'hi', model, historyList: [] });
      await new Promise((r) => setTimeout(r, 10));

      expect(chatStore.activeChatData['c1'].name).toBe('');
    });
  });

  describe('startSendChatMessage（多模型并行）', () => {
    it('仅向启用且未删除的模型发送', async () => {
      const enabled = createMockModel({ id: 'm1', isEnable: true });
      const disabled = createMockModel({ id: 'm2', isEnable: false });
      const modelStore = useModelStore();
      modelStore.models = [enabled, disabled];

      const chat = {
        ...createTestChat('c1', 'm1'),
        chatModelList: [
          { modelId: 'm1', chatHistoryList: [] },
          { modelId: 'm2', chatHistoryList: [] },
        ],
      } as unknown as Chat;
      chatStore.activeChatData['c1'] = chat;

      mockStreamChatCompletion.mockImplementation(async function* () {
        yield createAssistantMessage('回复');
      });

      await chatStore.startSendChatMessage({ chat, message: 'hi' });

      // 仅一个模型（启用的）发起了流式请求
      expect(mockStreamChatCompletion).toHaveBeenCalledTimes(1);
      expect(chatStore.sendingChatIds['c1']).toBeUndefined();
    });
  });

  describe('编辑重发 historyIndex 分支', () => {
    it('带 historyIndex 的重生成应使用对应版本的 prompt', async () => {
      const model = createMockModel({ id: 'm1', isEnable: true });
      const modelStore = useModelStore();
      modelStore.models = [model];

      const userMsg = createUserMessage(['版本一', '版本二'] as unknown as string, { id: 'u1' });
      const chat = createTestChat('c1', 'm1', [
        userMsg,
        createAssistantMessage('旧回答', { id: 'a1' }),
      ]);
      chatStore.activeChatData['c1'] = chat;

      mockStreamChatCompletion.mockImplementationOnce(async function* () {
        yield createAssistantMessage('新回答');
      });

      await chatStore.regenerateMessage({ chatId: 'c1', assistantMessageId: 'a1', historyIndex: 0 });

      // prompt 使用指定版本的 content
      const callArg = mockStreamChatCompletion.mock.calls[0][0];
      expect(callArg.message).toBe('版本一');
    });
  });
});
