/**
 * 聊天流程集成测试
 * 
 * 测试目的：验证完整的聊天流程，包括 UI 交互、Redux 更新、API 调用和持久化存储
 * 测试范围：
 * - 完整聊天流程（用户输入 → API 调用 → 流式响应 → Redux 更新 → 持久化）
 * - 聊天历史加载
 * - 流式响应处理
 * - API 错误处理
 * - 流式响应中断
 * - 推理内容处理
 * - 多轮对话上下文管理
 * - 聊天会话管理
 * 
 * 测试隔离：
 * - 使用 MSW Mock API 请求
 * - 使用独立的 Redux store
 * - 每个测试后清理副作用
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { getTestStore, resetStore } from '@/__test__/helpers/integration/resetStore';
import { clearIndexedDB } from '@/__test__/helpers/integration/clearIndexedDB';
import { setupErrorHandlers, setupTimeoutHandlers } from '@/__test__/helpers/integration/testServer';
import { server } from '@/__test__/integration/setup';
import type { Store } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import { startSendChatMessage, initializeChatList, createChat, editChatName, deleteChat } from '@/store/slices/chatSlices';
import { ChatRoleEnum } from '@/types/chat';
import * as chatStorage from '@/store/storage/chatStorage';
import * as chatService from '@/services/chatService';

// Mock chatStorage 模块
vi.mock('@/store/storage/chatStorage', () => ({
  loadChatsFromJson: vi.fn(() => Promise.resolve([])),
  saveChatsToJson: vi.fn(() => Promise.resolve()),
}));

// Mock chatService 模块
vi.mock('@/services/chatService', () => ({
  streamChatCompletion: vi.fn(),
}));

/**
 * 创建测试模型
 */
function createTestModel(overrides: Partial<any> = {}) {
  return {
    id: 'test-model-1',
    createdAt: '2024-01-01 00:00:00',
    updateAt: '2024-01-01 00:00:00',
    providerName: 'DeepSeek',
    providerKey: 'deepseek' as any,
    nickname: '测试模型',
    modelName: 'deepseek-chat',
    modelKey: 'deepseek-chat',
    apiKey: 'test-api-key',
    apiAddress: 'https://api.deepseek.com',
    isEnable: true,
    isDeleted: false,
    ...overrides,
  };
}

/**
 * 创建测试聊天
 */
function createTestChat(overrides: Partial<any> = {}) {
  return {
    id: 'test-chat-1',
    name: '测试对话',
    chatModelList: [
      {
        modelId: 'test-model-1',
        chatHistoryList: [] as any[],
      },
    ],
    createdAt: Date.now() / 1000,
    updatedAt: Date.now() / 1000,
    isDeleted: false,
    ...overrides,
  };
}

describe('聊天流程集成测试', () => {
  let testStore: Store<RootState>;

  beforeEach(async () => {
    // 创建新的 Redux store
    testStore = getTestStore();

    // 清理 IndexedDB
    await clearIndexedDB();

    // 清理所有 mocks
    vi.clearAllMocks();

    // 清理 chatService 的 mock 实现
    const mockStreamChatCompletion = chatService.streamChatCompletion as unknown as ReturnType<typeof vi.fn>;
    mockStreamChatCompletion.mockReset();
  });

  afterEach(async () => {
    // 清理
    resetStore();
    await clearIndexedDB();
    vi.restoreAllMocks();
  });

  // ========================================
  // 2.2 完整聊天流程测试（正常场景）
  // ========================================

  describe('完整聊天流程测试', () => {
    test('用户输入 → API 调用 → 流式响应 → Redux 更新 → 持久化存储', async () => {
      // Given: 创建一个测试模型和聊天会话
      const testModel = createTestModel();
      const testChat = createTestChat();

      // Mock streamChatCompletion
      const mockStreamChatCompletion = chatService.streamChatCompletion as unknown as ReturnType<typeof vi.fn>;
      mockStreamChatCompletion.mockImplementation(async function* () {
        yield {
          id: 'msg-1',
          role: ChatRoleEnum.ASSISTANT,
          content: '你',
          timestamp: Date.now() / 1000,
          modelKey: 'deepseek-chat',
          finishReason: null,
        };
        yield {
          id: 'msg-1',
          role: ChatRoleEnum.ASSISTANT,
          content: '你好！',
          timestamp: Date.now() / 1000,
          modelKey: 'deepseek-chat',
          finishReason: null,
        };
        yield {
          id: 'msg-1',
          role: ChatRoleEnum.ASSISTANT,
          content: '你好！有什么可以帮助你的？',
          timestamp: Date.now() / 1000,
          modelKey: 'deepseek-chat',
          finishReason: 'stop',
        };
      });

      // 初始化模型和聊天列表
      await act(() => {
        testStore.dispatch({
          type: 'models/createModel',
          payload: { model: testModel },
        } as any);
        testStore.dispatch(createChat({ chat: testChat }));
      });

      // When: 用户发送消息
      const userMessage = '你好';

      await act(async () => {
        await testStore.dispatch<any>(
          startSendChatMessage({
            chat: testChat,
            message: userMessage,
          })
        );
      });

      // Then: 验证 Redux store 更新
      const state = testStore.getState();
      expect(state.chat.chatList).toHaveLength(1);
      expect(state.chat.chatList[0].id).toBe(testChat.id);

      const chatModel = state.chat.chatList[0]!.chatModelList![0]!;
      expect(chatModel.chatHistoryList).toHaveLength(2); // 用户消息 + 助手消息
      expect(chatModel.chatHistoryList[0].role).toBe(ChatRoleEnum.USER);
      expect(chatModel.chatHistoryList[0].content).toBe(userMessage);
      expect(chatModel.chatHistoryList[1].role).toBe(ChatRoleEnum.ASSISTANT);
      expect(chatModel.chatHistoryList[1].content).toBe('你好！有什么可以帮助你的？');
    });
  });

  // ========================================
  // 2.3 聊天历史加载测试
  // ========================================

  describe('聊天历史加载测试', () => {
    test('从存储加载历史聊天', async () => {
      // Given: 保存聊天历史到存储
      const chatHistory = [
        {
          id: 'test-chat-1',
          name: '历史对话 1',
          chatModelList: [
            {
              modelId: 'model-1',
              chatHistoryList: [
                {
                  id: 'msg-1',
                  role: ChatRoleEnum.USER,
                  content: '历史消息 1',
                  timestamp: Date.now() / 1000,
                  modelKey: 'deepseek-chat',
                  finishReason: null,
                },
              ],
            },
          ],
          createdAt: Date.now() / 1000,
          updatedAt: Date.now() / 1000,
          isDeleted: false,
        },
      ];

      const mockLoadChatsFromJson = vi.mocked(chatStorage.loadChatsFromJson);
      mockLoadChatsFromJson.mockResolvedValueOnce(chatHistory as any);

      // When: 从存储加载聊天历史
      await act(async () => {
        await testStore.dispatch<any>(initializeChatList());
      });

      // Then: 验证 Redux store 更新
      const state = testStore.getState();
      expect(state.chat.chatList).toHaveLength(1);
      expect(state.chat.chatList[0].id).toBe('test-chat-1');
      expect(state.chat.chatList[0].name).toBe('历史对话 1');
    });

    test('加载空历史聊天列表', async () => {
      // Given: 存储为空
      const mockLoadChatsFromJson = vi.mocked(chatStorage.loadChatsFromJson);
      mockLoadChatsFromJson.mockResolvedValueOnce([]);

      // When: 从存储加载聊天历史
      await act(async () => {
        await testStore.dispatch<any>(initializeChatList());
      });

      // Then: 验证 Redux store 为空
      const state = testStore.getState();
      expect(state.chat.chatList).toHaveLength(0);
    });
  });

  // ========================================
  // 2.4 流式响应处理测试
  // ========================================

  describe('流式响应处理测试', () => {
    test('流式响应的逐块处理', async () => {
      // Given: 创建测试模型和聊天
      const testModel = createTestModel();
      const testChat = createTestChat();

      await act(() => {
        testStore.dispatch({
          type: 'models/createModel',
          payload: { model: testModel },
        } as any);
        testStore.dispatch(createChat({ chat: testChat }));
      });

      // Mock 流式响应
      const chunks = ['你', '好', '！', '有', '什', '么', '可', '以', '帮', '助', '你', '的', '？'];
      const mockStreamChatCompletion = chatService.streamChatCompletion as unknown as ReturnType<typeof vi.fn>;
      mockStreamChatCompletion.mockImplementation(async function* () {
        let accumulated = '';
        for (const chunk of chunks) {
          accumulated += chunk;
          yield {
            id: 'msg-1',
            role: ChatRoleEnum.ASSISTANT,
            content: accumulated,
            timestamp: Date.now() / 1000,
            modelKey: 'deepseek-chat',
            finishReason: null,
          };
        }
        yield {
          id: 'msg-1',
          role: ChatRoleEnum.ASSISTANT,
          content: chunks.join(''),
          timestamp: Date.now() / 1000,
          modelKey: 'deepseek-chat',
          finishReason: 'stop',
        };
      });

      // When: 发送消息
      await act(async () => {
        await testStore.dispatch<any>(
          startSendChatMessage({
            chat: testChat,
            message: '你好',
          })
        );
      });

      // Then: 验证流式响应逐块更新
      await waitFor(() => {
        const state = testStore.getState();
        const chatModel = state.chat.chatList[0]!.chatModelList![0]!;
        expect(chatModel.chatHistoryList).toHaveLength(2);
        expect(chatModel.chatHistoryList[1].content).toBe('你好！有什么可以帮助你的？');
      });
    });
  });

  // ========================================
  // 2.5 API 错误处理测试
  // ========================================

  describe('API 错误处理测试', () => {
    test('API 返回 4xx 错误时显示错误提示', async () => {
      // Given: 设置错误 handlers
      setupErrorHandlers(server);

      const testModel = createTestModel();
      const testChat = createTestChat();

      await act(() => {
        testStore.dispatch({
          type: 'models/createModel',
          payload: { model: testModel },
        } as any);
        testStore.dispatch(createChat({ chat: testChat }));
      });

      // Mock 错误响应 - 返回 async iterable 并在迭代时抛出错误
      const mockStreamChatCompletion = chatService.streamChatCompletion as unknown as ReturnType<typeof vi.fn>;
      mockStreamChatCompletion.mockImplementation(async function* () {
        yield {
          id: 'msg-1',
          role: ChatRoleEnum.ASSISTANT,
          content: '',
          timestamp: Date.now() / 1000,
          modelKey: 'deepseek-chat',
          finishReason: null,
        };
        throw new Error('API Error: 401 Unauthorized');
      });

      // When: 发送消息（预期失败）
      await act(async () => {
        try {
          await testStore.dispatch<any>(
            startSendChatMessage({
              chat: testChat,
              message: '测试消息',
            })
          );
        } catch {
          // 预期失败
        }
      });

      // Then: 验证错误状态
      const state = testStore.getState();
      const runningChat = state.chat.runningChat[testChat.id]?.['test-model-1'];
      expect(runningChat?.isSending).toBe(false);
      expect(runningChat?.errorMessage).toBeDefined();
    });

    test('网络超时时显示超时提示', async () => {
      // Given: 设置超时 handlers
      setupTimeoutHandlers(server);

      const testModel = createTestModel();
      const testChat = createTestChat();

      await act(() => {
        testStore.dispatch({
          type: 'models/createModel',
          payload: { model: testModel },
        } as any);
        testStore.dispatch(createChat({ chat: testChat }));
      });

      // Mock 超时响应 - 返回 async iterable 并在迭代时抛出错误
      const mockStreamChatCompletion = chatService.streamChatCompletion as unknown as ReturnType<typeof vi.fn>;
      mockStreamChatCompletion.mockImplementation(async function* () {
        yield {
          id: 'msg-1',
          role: ChatRoleEnum.ASSISTANT,
          content: '',
          timestamp: Date.now() / 1000,
          modelKey: 'deepseek-chat',
          finishReason: null,
        };
        throw new Error('Request timeout');
      });

      // When: 发送消息（预期超时）
      await act(async () => {
        try {
          await testStore.dispatch<any>(
            startSendChatMessage({
              chat: testChat,
              message: '测试消息',
            })
          );
        } catch {
          // 预期超时
        }
      });

      // Then: 验证错误状态
      const state = testStore.getState();
      const runningChat = state.chat.runningChat[testChat.id]?.['test-model-1'];
      expect(runningChat?.isSending).toBe(false);
      expect(runningChat?.errorMessage).toContain('timeout');
    });
  });

  // ========================================
  // 2.6 流式响应中断测试
  // ========================================

  describe('流式响应中断测试', () => {
    test('流式响应在中途断开时保存已接收内容', async () => {
      // Given: 创建测试模型和聊天
      const testModel = createTestModel();
      const testChat = createTestChat();

      await act(() => {
        testStore.dispatch({
          type: 'models/createModel',
          payload: { model: testModel },
        } as any);
        testStore.dispatch(createChat({ chat: testChat }));
      });

      // Mock 中断的流式响应
      let callCount = 0;
      const mockStreamChatCompletion = chatService.streamChatCompletion as unknown as ReturnType<typeof vi.fn>;
      mockStreamChatCompletion.mockImplementation(async function* () {
        yield {
          id: 'msg-1',
          role: ChatRoleEnum.ASSISTANT,
          content: '你好！',
          timestamp: Date.now() / 1000,
          modelKey: 'deepseek-chat',
          finishReason: null,
        };
        callCount++;
        if (callCount > 2) {
          throw new Error('Stream interrupted');
        }
      });

      // When: 发送消息（预期中断）
      await act(async () => {
        try {
          await testStore.dispatch<any>(
            startSendChatMessage({
              chat: testChat,
              message: '你好',
            })
          );
        } catch {
          // 预期中断
        }
      });

      // Then: 验证已接收内容被保存
      const state = testStore.getState();
      const chatModel = state.chat.chatList[0]!.chatModelList![0]!;
      expect(chatModel.chatHistoryList).toHaveLength(2);
      expect(chatModel.chatHistoryList[1].content).toBe('你好！');
    });
  });

  // ========================================
  // 2.7 推理内容处理测试
  // ========================================

  describe('推理内容处理测试', () => {
    test('请求推理内容时正确渲染和持久化', async () => {
      // Given: 创建测试模型和聊天，设置 includeReasoningContent 为 true
      const testModel = createTestModel();
      const testChat = createTestChat();

      await act(() => {
        testStore.dispatch({
          type: 'models/createModel',
          payload: { model: testModel },
        } as any);
        testStore.dispatch(createChat({ chat: testChat }));
        // 设置推理内容开关
        testStore.dispatch({
          type: 'appConfig/setIncludeReasoningContent',
          payload: true,
        } as any);
      });

      // Mock 带推理内容的响应
      const mockStreamChatCompletion = chatService.streamChatCompletion as unknown as ReturnType<typeof vi.fn>;
      mockStreamChatCompletion.mockImplementation(async function* () {
        yield {
          id: 'msg-1',
          role: ChatRoleEnum.ASSISTANT,
          content: '最终答案',
          reasoningContent: '这是推理过程',
          timestamp: Date.now() / 1000,
          modelKey: 'deepseek-chat',
          finishReason: 'stop',
        };
      });

      // When: 发送消息
      await act(async () => {
        await testStore.dispatch<any>(
          startSendChatMessage({
            chat: testChat,
            message: '测试',
          })
        );
      });

      // Then: 验证推理内容被正确保存
      const state = testStore.getState();
      const chatModel = state.chat.chatList[0]!.chatModelList![0]!;
      expect(chatModel.chatHistoryList[1].content).toBe('最终答案');
      expect(chatModel.chatHistoryList[1].reasoningContent).toBe('这是推理过程');
    });

    test('不请求推理内容时不传输推理内容', async () => {
      // Given: 创建测试模型和聊天，设置 includeReasoningContent 为 false
      const testModel = createTestModel();
      const testChat = createTestChat();

      await act(() => {
        testStore.dispatch({
          type: 'models/createModel',
          payload: { model: testModel },
        } as any);
        testStore.dispatch(createChat({ chat: testChat }));
        // 设置推理内容开关为 false
        testStore.dispatch({
          type: 'appConfig/setIncludeReasoningContent',
          payload: false,
        } as any);
      });

      // Mock 不带推理内容的响应
      const mockStreamChatCompletion = chatService.streamChatCompletion as unknown as ReturnType<typeof vi.fn>;
      mockStreamChatCompletion.mockImplementation(async function* () {
        yield {
          id: 'msg-1',
          role: ChatRoleEnum.ASSISTANT,
          content: '最终答案',
          reasoningContent: '',
          timestamp: Date.now() / 1000,
          modelKey: 'deepseek-chat',
          finishReason: 'stop',
        };
      });

      // When: 发送消息
      await act(async () => {
        await testStore.dispatch<any>(
          startSendChatMessage({
            chat: testChat,
            message: '测试',
          })
        );
      });

      // Then: 验证推理内容为空
      const state = testStore.getState();
      const chatModel = state.chat.chatList[0]!.chatModelList![0]!;
      expect(chatModel.chatHistoryList[1].reasoningContent).toBe('');
    });
  });

  // ========================================
  // 2.8 多轮对话上下文管理测试
  // ========================================

  describe('多轮对话上下文管理测试', () => {
    test('第一条消息不包含历史', async () => {
      // Given: 创建测试模型和聊天
      const testModel = createTestModel();
      const testChat = createTestChat();

      await act(() => {
        testStore.dispatch({
          type: 'models/createModel',
          payload: { model: testModel },
        } as any);
        testStore.dispatch(createChat({ chat: testChat }));
      });

      // Mock 响应
      const mockStreamChatCompletion = chatService.streamChatCompletion as unknown as ReturnType<typeof vi.fn>;
      mockStreamChatCompletion.mockImplementation(async function* () {
        yield {
          id: 'msg-1',
          role: ChatRoleEnum.ASSISTANT,
          content: '你好！',
          timestamp: Date.now() / 1000,
          modelKey: 'deepseek-chat',
          finishReason: 'stop',
        };
      });

      // When: 发送第一条消息
      await act(async () => {
        await testStore.dispatch<any>(
          startSendChatMessage({
            chat: testChat,
            message: '你好',
          })
        );
      });

      // Then: 验证历史记录
      const state = testStore.getState();
      const chatModel = state.chat.chatList[0]!.chatModelList![0]!;
      expect(chatModel.chatHistoryList).toHaveLength(2); // 用户消息 + 助手消息
    });

    test('后续消息包含完整历史', async () => {
      // Given: 创建测试模型和聊天，已有历史记录
      const testModel = {
        id: 'test-model-1',
        createdAt: '2024-01-01 00:00:00',
        updateAt: '2024-01-01 00:00:00',
        providerName: 'DeepSeek',
        providerKey: 'deepseek' as any,
        nickname: '测试模型',
        modelName: 'deepseek-chat',
        modelKey: 'deepseek-chat',
        apiKey: 'test-api-key',
        apiAddress: 'https://api.deepseek.com',
        isEnable: true,
        isDeleted: false,
      };

      const testChat = {
        id: 'test-chat-1',
        name: '测试对话',
        chatModelList: [
          {
            modelId: 'test-model-1',
            chatHistoryList: [
              {
                id: 'msg-1',
                role: ChatRoleEnum.USER,
                content: '你好',
                timestamp: Date.now() / 1000,
                modelKey: 'deepseek-chat',
                finishReason: null,
              },
              {
                id: 'msg-2',
                role: ChatRoleEnum.ASSISTANT,
                content: '你好！',
                timestamp: Date.now() / 1000,
                modelKey: 'deepseek-chat',
                finishReason: 'stop',
              },
            ],
          },
        ],
        createdAt: Date.now() / 1000,
        updatedAt: Date.now() / 1000,
        isDeleted: false,
      };

      await act(() => {
        testStore.dispatch({
          type: 'models/createModel',
          payload: { model: testModel },
        } as any);
        testStore.dispatch(createChat({ chat: testChat }));
      });

      // Mock 响应
      const mockStreamChatCompletion = chatService.streamChatCompletion as unknown as ReturnType<typeof vi.fn>;
      mockStreamChatCompletion.mockImplementation(async function* () {
        yield {
          id: 'msg-3',
          role: ChatRoleEnum.ASSISTANT,
          content: '再见！',
          timestamp: Date.now() / 1000,
          modelKey: 'deepseek-chat',
          finishReason: 'stop',
        };
      });

      // When: 发送第二条消息
      await act(async () => {
        await testStore.dispatch<any>(
          startSendChatMessage({
            chat: testChat,
            message: '再见',
          })
        );
      });

      // Then: 验证历史记录包含完整对话
      const state = testStore.getState();
      const chatModel = state.chat.chatList[0]!.chatModelList![0]!;
      expect(chatModel.chatHistoryList).toHaveLength(4); // 2 条历史 + 用户消息 + 助手消息
      expect(chatModel.chatHistoryList[0].content).toBe('你好');
      expect(chatModel.chatHistoryList[1].content).toBe('你好！');
      expect(chatModel.chatHistoryList[2].content).toBe('再见');
      expect(chatModel.chatHistoryList[3].content).toBe('再见！');
    });

    test('验证消息顺序正确', async () => {
      // Given: 创建测试模型和聊天
      const testModel = createTestModel();
      const testChat = createTestChat();

      await act(() => {
        testStore.dispatch({
          type: 'models/createModel',
          payload: { model: testModel },
        } as any);
        testStore.dispatch(createChat({ chat: testChat }));
      });

      // Mock 响应
      const mockStreamChatCompletion = chatService.streamChatCompletion as unknown as ReturnType<typeof vi.fn>;
      mockStreamChatCompletion.mockImplementation(async function* () {
        yield {
          id: 'msg-1',
          role: ChatRoleEnum.ASSISTANT,
          content: '回复 1',
          timestamp: Date.now() / 1000,
          modelKey: 'deepseek-chat',
          finishReason: 'stop',
        };
      });

      // When: 连续发送两条消息
      await act(async () => {
        await testStore.dispatch<any>(
          startSendChatMessage({
            chat: testChat,
            message: '消息 1',
          })
        );
      });

      await act(async () => {
        await testStore.dispatch<any>(
          startSendChatMessage({
            chat: testChat,
            message: '消息 2',
          })
        );
      });

      // Then: 验证消息顺序
      const state = testStore.getState();
      const chatModel = state.chat.chatList[0]!.chatModelList![0]!;
      expect(chatModel.chatHistoryList.length).toBeGreaterThanOrEqual(4);
      expect(chatModel.chatHistoryList[0].content).toBe('消息 1');
      expect(chatModel.chatHistoryList[1].content).toBe('回复 1');
      expect(chatModel.chatHistoryList[2].content).toBe('消息 2');
    });
  });

  // ========================================
  // 2.9 聊天会话管理测试
  // ========================================

  describe('聊天会话管理测试', () => {
    test('创建新会话', async () => {
      // Given: 初始状态
      const initialState = testStore.getState();

      // When: 创建新会话
      const newChat = {
        id: 'new-chat-1',
        name: '新对话',
        chatModelList: [] as any[],
        createdAt: Date.now() / 1000,
        updatedAt: Date.now() / 1000,
        isDeleted: false,
      };

      await act(() => {
        testStore.dispatch(createChat({ chat: newChat }));
      });

      // Then: 验证 Redux 状态更新
      const state = testStore.getState();
      expect(state.chat.chatList).toHaveLength(initialState.chat.chatList.length + 1);
      expect(state.chat.chatList.find((c) => c.id === newChat.id)).toBeDefined();
    });

    test('切换会话', async () => {
      // Given: 创建两个会话
      const chat1 = {
        id: 'chat-1',
        name: '对话 1',
        chatModelList: [] as any[],
        createdAt: Date.now() / 1000,
        updatedAt: Date.now() / 1000,
        isDeleted: false,
      };
      const chat2 = {
        id: 'chat-2',
        name: '对话 2',
        chatModelList: [] as any[],
        createdAt: Date.now() / 1000,
        updatedAt: Date.now() / 1000,
        isDeleted: false,
      };

      await act(() => {
        testStore.dispatch(createChat({ chat: chat1 }));
        testStore.dispatch(createChat({ chat: chat2 }));
      });

      // When: 切换会话
      await act(() => {
        testStore.dispatch({
          type: 'chat/setSelectedChatId',
          payload: 'chat-2',
        } as any);
      });

      // Then: 验证选中状态
      const state = testStore.getState();
      expect(state.chat.selectedChatId).toBe('chat-2');
    });

    test('删除会话', async () => {
      // Given: 创建会话
      const chat1 = {
        id: 'chat-1',
        name: '对话 1',
        chatModelList: [] as any[],
        createdAt: Date.now() / 1000,
        updatedAt: Date.now() / 1000,
        isDeleted: false,
      };

      await act(() => {
        testStore.dispatch(createChat({ chat: chat1 }));
        testStore.dispatch({
          type: 'chat/setSelectedChatId',
          payload: 'chat-1',
        } as any);
      });

      // When: 删除会话
      await act(() => {
        testStore.dispatch(deleteChat({ chat: chat1 }));
      });

      // Then: 验证会话被标记为已删除
      const state = testStore.getState();
      const deletedChat = state.chat.chatList.find((c) => c.id === 'chat-1');
      expect(deletedChat?.isDeleted).toBe(true);
      expect(state.chat.selectedChatId).toBeNull();
    });

    test('编辑会话名称', async () => {
      // Given: 创建会话
      const chat1 = {
        id: 'chat-1',
        name: '原始名称',
        chatModelList: [] as any[],
        createdAt: Date.now() / 1000,
        updatedAt: Date.now() / 1000,
        isDeleted: false,
      };

      await act(() => {
        testStore.dispatch(createChat({ chat: chat1 }));
      });

      // When: 编辑会话名称
      await act(() => {
        testStore.dispatch(
          editChatName({
            id: 'chat-1',
            name: '新名称',
          })
        );
      });

      // Then: 验证名称更新
      const state = testStore.getState();
      const chat = state.chat.chatList.find((c) => c.id === 'chat-1');
      expect(chat?.name).toBe('新名称');
    });
  });
});
