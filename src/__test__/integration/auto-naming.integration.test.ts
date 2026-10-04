/**
 * 自动命名功能集成测试（Vue 版）
 *
 * 测试目的：验证完整的自动命名流程（触发检测 → 标题生成 → 状态更新 → 持久化）
 * - 新建聊天首次收到 AI 回复后自动生成标题
 * - 全局开关控制
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { Chat, Model } from '@/types/chat';
import { createMockModel } from '@/__test__/helpers/fixtures/model';
import { clearBrowserStorage } from './helpers';

// Mock 流式补全以避免真实 API 调用
vi.mock('@/services/chat', async () => {
  const actual = await vi.importActual<typeof import('@/services/chat')>('@/services/chat');
  return {
    ...actual,
    streamChatCompletion: vi.fn(() => ({
      [Symbol.asyncIterator]: async function* () {
        await new Promise((resolve) => setTimeout(resolve, 50));
        yield { type: 'text-delta', textDelta: '模拟的 AI 回复' };
        await new Promise((resolve) => setTimeout(resolve, 30));
        yield {
          type: 'finish',
          finishReason: 'stop',
          usage: { promptTokens: 10, completionTokens: 5 },
        };
      },
    })),
  };
});

// Mock 聊天存储
vi.mock('@/store/storage/chatStorage', () => ({
  loadChatIndex: vi.fn(() => Promise.resolve([])),
  saveChatIndex: vi.fn(() => Promise.resolve()),
  loadChatById: vi.fn(() => Promise.resolve(undefined)),
  saveChatById: vi.fn(() => Promise.resolve()),
  saveChatAndIndex: vi.fn(() => Promise.resolve()),
  deleteChatFromStorage: vi.fn(() => Promise.resolve()),
  migrateOldChatStorage: vi.fn(() => Promise.resolve()),
}));

// Mock 标题生成服务
vi.mock('@/services/chat/titleGenerator', () => ({
  generateChatTitleService: vi.fn(),
}));

import { generateChatTitleService } from '@/services/chat/titleGenerator';
import { useChatStore } from '@/store/chat';
import { useModelsStore } from '@/store/models';
import { useAppConfigStore } from '@/store/appConfig';

/** 构造测试聊天 */
function makeChat(modelId: string): Chat {
  return {
    id: 'chat-1',
    name: '',
    chatModelList: [{ modelId, chatHistoryList: [] }],
    isDeleted: false,
  } as Chat;
}

describe('自动命名功能集成测试', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await clearBrowserStorage();
    setActivePinia(createPinia());
  });

  it('新建聊天首次收到 AI 回复后应该自动生成标题', async () => {
    // Arrange: 模型 + 新聊天（标题为空）
    const model = createMockModel({ id: 'model-1' }) as Model;
    const modelsStore = useModelsStore();
    modelsStore.models = [model];

    const chatStore = useChatStore();
    const chat = makeChat(model.id);
    await chatStore.createChat({ chat });
    chatStore.setSelectedChatId(chat.id);

    vi.mocked(generateChatTitleService).mockResolvedValue('TypeScript 学习方法');

    // Act: 发送消息并触发 AI 回复
    await chatStore.startSendChatMessage({
      chat,
      message: '如何学习 TypeScript？',
    });

    // Assert: 标题生成并更新到聊天列表
    await vi.waitFor(() => {
      expect(generateChatTitleService).toHaveBeenCalled();
    });
    await vi.waitFor(() => {
      const meta = chatStore.chatMetaList.find((m) => m.id === chat.id);
      expect(meta?.name).toBe('TypeScript 学习方法');
    });
  });

  it('全局开关关闭时不应该触发自动命名', async () => {
    const model = createMockModel({ id: 'model-1' }) as Model;
    const modelsStore = useModelsStore();
    modelsStore.models = [model];

    const appConfigStore = useAppConfigStore();
    appConfigStore.setAutoNamingEnabled(false);

    const chatStore = useChatStore();
    const chat = makeChat(model.id);
    await chatStore.createChat({ chat });
    chatStore.setSelectedChatId(chat.id);

    await chatStore.startSendChatMessage({
      chat,
      message: '如何学习 TypeScript？',
    });

    await new Promise((r) => setTimeout(r, 300));

    expect(generateChatTitleService).not.toHaveBeenCalled();
    const meta = chatStore.chatMetaList.find((m) => m.id === chat.id);
    expect(meta?.name).toBe('');
  });

  it('已有名称的聊天不应该触发自动命名', async () => {
    const model = createMockModel({ id: 'model-1' }) as Model;
    const modelsStore = useModelsStore();
    modelsStore.models = [model];

    const chatStore = useChatStore();
    const chat = { ...makeChat(model.id), name: '手动命名的聊天' };
    await chatStore.createChat({ chat });
    chatStore.setSelectedChatId(chat.id);

    await chatStore.startSendChatMessage({
      chat,
      message: '任意消息',
    });

    await new Promise((r) => setTimeout(r, 300));

    expect(generateChatTitleService).not.toHaveBeenCalled();
    const meta = chatStore.chatMetaList.find((m) => m.id === chat.id);
    expect(meta?.name).toBe('手动命名的聊天');
  });
});
