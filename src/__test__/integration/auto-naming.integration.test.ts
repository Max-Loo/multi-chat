/**
 * 自动命名功能集成测试
 *
 * 测试目的：验证完整的自动命名流程，包括触发条件检测、标题生成、状态更新和持久化
 *
 * 测试范围：
 * - 新建聊天首次收到 AI 回复后自动生成标题
 * - 用户手动命名后不再触发自动命名
 * - 全局开关控制
 * - 多模型竞态条件处理
 * - 持久化到 chats.json
 *
 * 测试隔离：
 * - Mock generateChatTitleService
 * - 使用独立的 Redux store
 * - 每个测试后清理副作用
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { getTestStore, resetStore } from '@/__test__/helpers/integration/resetStore';
import { clearIndexedDB } from '@/__test__/helpers/integration/clearIndexedDB';
import type { AppDispatch } from '@/store';
import {
  startSendChatMessage,
  createChat,
  editChatName,
  setSelectedChatId,
} from '@/store/slices/chatSlices';
import { setAutoNamingEnabled } from '@/store/slices/appConfigSlices';
import { createModel as createModelAction } from '@/store/slices/modelSlice';
import { createDeepSeekModel } from '@/__test__/helpers/fixtures/model';
import * as chatStorage from '@/store/storage/chatStorage';

// Mock streamChatCompletion 以避免真实的 API 调用
vi.mock('@/services/chat', async () => {
  const actual = await vi.importActual<typeof import('@/services/chat')>('@/services/chat');
  return {
    ...actual,
    streamChatCompletion: vi.fn(() => ({
      [Symbol.asyncIterator]: async function* () {
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 100));
        yield {
          type: 'text-delta',
          textDelta: '模拟的 AI 回复',
        };
        await new Promise(resolve => setTimeout(resolve, 50));
        yield {
          type: 'finish',
          finishReason: 'stop',
          usage: { promptTokens: 10, completionTokens: 5 },
        };
      },
    })),
  };
});

// Mock chatStorage 模块
vi.mock('@/store/storage/chatStorage', () => ({
  loadChatIndex: vi.fn(() => Promise.resolve([])),
  saveChatIndex: vi.fn(() => Promise.resolve()),
  loadChatById: vi.fn(() => Promise.resolve(undefined)),
  saveChatById: vi.fn(() => Promise.resolve()),
  saveChatAndIndex: vi.fn(() => Promise.resolve()),
  deleteChatFromStorage: vi.fn(() => Promise.resolve()),
  migrateOldChatStorage: vi.fn(() => Promise.resolve()),
}));

// Mock generateChatTitleService
vi.mock('@/services/chat/titleGenerator', () => ({
  generateChatTitleService: vi.fn(),
}));

import { generateChatTitleService } from '@/services/chat/titleGenerator';

describe('自动命名功能集成测试', () => {
  let store: ReturnType<typeof getTestStore>;

  beforeEach(async () => {
    await clearIndexedDB();
    store = getTestStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetStore();
  });

  test('场景 1：新建聊天首次收到 AI 回复后应该自动生成标题', async () => {
    // Arrange: 创建新聊天（标题为空）
    const model = createDeepSeekModel();
    const chat = {
      id: 'chat-1',
      name: undefined,
      chatModelList: [{ modelId: model.id, chatHistoryList: [] }],
      isDeleted: false,
    };

    // 将模型添加到 Redux store（这样 startSendChatMessage 才能找到它）
    store.dispatch(createModelAction({ model }));

    store.dispatch(createChat({ chat }));

    // 设置 selectedChatId 防止 releaseCompletedBackgroundChat 清除数据
    store.dispatch(setSelectedChatId(chat.id));

    // Mock generateChatTitleService 返回标题
    vi.mocked(generateChatTitleService).mockResolvedValue('TypeScript 学习方法');

    // Act: 发送消息并触发 AI 回复
    await act(async () => {
      await (store.dispatch as AppDispatch)(startSendChatMessage({
        chat,
        message: '如何学习 TypeScript？',
      }));
    });

    // Assert: 等待标题生成完成并验证
    await waitFor(() => {
      const state = store.getState();
      const updatedChat = state.chat.activeChatData[chat.id];
      expect(updatedChat?.name).toBe('TypeScript 学习方法');
    });

    const state = store.getState();
    const updatedChat = state.chat.activeChatData[chat.id];
    expect(updatedChat?.isManuallyNamed).toBeUndefined(); // 允许手动覆盖

    // 验证持久化被调用
    expect(chatStorage.saveChatAndIndex).toHaveBeenCalled();
  });

  test('场景 2：用户手动命名后不再触发自动命名', async () => {
    // Arrange: 创建聊天并手动设置标题
    const model = createDeepSeekModel();
    const chat = {
      id: 'chat-2',
      name: '我的手动标题',
      chatModelList: [{ modelId: model.id, chatHistoryList: [] }],
      isDeleted: false,
    };

    // 将模型添加到 Redux store
    store.dispatch(createModelAction({ model }));

    store.dispatch(createChat({ chat }));

    // 手动编辑标题
    store.dispatch(editChatName({ id: chat.id, name: '我的手动标题' }));

    // 设置 selectedChatId 防止 releaseCompletedBackgroundChat 清除数据
    store.dispatch(setSelectedChatId(chat.id));

    // 验证 isManuallyNamed 已设置
    let state = store.getState();
    let updatedChat = state.chat.chatMetaList.find((c: { id: string }) => c.id === chat.id);
    expect(updatedChat?.isManuallyNamed).toBe(true);

    // Mock generateChatTitleService（不应该被调用）
    vi.mocked(generateChatTitleService).mockResolvedValue('自动生成的标题');

    // Act: 发送消息
    await act(async () => {
      await (store.dispatch as AppDispatch)(startSendChatMessage({
        chat,
        message: '再次提问',
      }));
    });

    // 等待消息处理完成
    await waitFor(() => {
      const s = store.getState();
      const chatData = s.chat.activeChatData[chat.id];
      expect(chatData?.chatModelList?.[0]?.chatHistoryList?.length).toBeGreaterThan(0);
    });

    // Assert: 验证 generateChatTitleService 未被调用
    expect(generateChatTitleService).not.toHaveBeenCalled();

    // 验证标题保持手动设置的值
    state = store.getState();
    updatedChat = state.chat.chatMetaList.find((item: { id: string }) => item.id === chat.id);
    expect(updatedChat?.name).toBe('我的手动标题');
    expect(updatedChat?.isManuallyNamed).toBe(true);
  });

  test('场景 3：全局开关关闭时不触发自动命名', async () => {
    // Arrange: 关闭全局开关
    store.dispatch(setAutoNamingEnabled(false));

    const model = createDeepSeekModel();
    const chat = {
      id: 'chat-3',
      name: undefined,
      chatModelList: [{ modelId: model.id, chatHistoryList: [] }],
      isDeleted: false,
    };

    // 将模型添加到 Redux store
    store.dispatch(createModelAction({ model }));

    store.dispatch(createChat({ chat }));

    // 设置 selectedChatId 防止 releaseCompletedBackgroundChat 清除数据
    store.dispatch(setSelectedChatId(chat.id));

    // Mock generateChatTitleService（不应该被调用）
    vi.mocked(generateChatTitleService).mockResolvedValue('不应该生成的标题');

    // Act: 发送消息
    await act(async () => {
      await (store.dispatch as AppDispatch)(startSendChatMessage({
        chat,
        message: '测试问题',
      }));
    });

    // 等待消息处理完成
    await waitFor(() => {
      const s = store.getState();
      const chatData = s.chat.activeChatData[chat.id];
      expect(chatData?.chatModelList?.[0]?.chatHistoryList?.length).toBeGreaterThan(0);
    });

    // Assert: 验证 generateChatTitleService 未被调用
    expect(generateChatTitleService).not.toHaveBeenCalled();

    // 验证标题仍然为空
    const state = store.getState();
    const updatedChat = state.chat.chatMetaList.find((c: { id: string }) => c.id === chat.id);
    expect(updatedChat?.name).toBeUndefined();
  });

  test('场景 4：多模型竞态条件 - 只应该生成一次标题', async () => {
    // Arrange: 创建新聊天
    const model1 = createDeepSeekModel({ id: 'model-1' });
    const model2 = createDeepSeekModel({ id: 'model-2' });
    const chat = {
      id: 'chat-4',
      name: undefined,
      chatModelList: [
        { modelId: model1.id, chatHistoryList: [] },
        { modelId: model2.id, chatHistoryList: [] },
      ],
      isDeleted: false,
    };

    // 将两个模型都添加到 Redux store
    store.dispatch(createModelAction({ model: model1 }));
    store.dispatch(createModelAction({ model: model2 }));

    store.dispatch(createChat({ chat }));

    // Mock generateChatTitleService - 返回不同的标题
    let callCount = 0;
    vi.mocked(generateChatTitleService).mockImplementation(async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 50)); // 模拟延迟
      return `模型 ${callCount} 生成的标题`;
    });

    // Act: 两个模型几乎同时完成
    await act(async () => {
      const promises = [
        (store.dispatch as AppDispatch)(startSendChatMessage({
          chat,
          message: '测试问题',
        })),
      ];
      await Promise.all(promises);
    });

    // 等待所有异步操作完成
    await waitFor(() => {
      expect(callCount).toBeGreaterThan(0);
    }, { timeout: 2000 });

    // Assert: 验证只生成了一次标题（通过内存锁机制）
    expect(callCount).toBe(1);

    // 等待标题被更新到 Redux store
    await waitFor(() => {
      const state = store.getState();
      const updatedChat = state.chat.chatMetaList.find((c: { id: string }) => c.id === chat.id);
      expect(updatedChat?.name).toBeTruthy();
    }, { timeout: 1000 });
  });
});
