import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { streamChatCompletion, buildMessages, getProvider } from '@/services/chat';
import { ChatRoleEnum } from '@/types/chat';
import { ModelProviderKeyEnum } from '@/utils/enums';
import type { StandardMessage } from '@/types/chat';
import { createDeepSeekModel } from '@/__test__/helpers/fixtures/model';

// Mock providerLoader 模块
vi.mock('@/services/chat/providerLoader', () => ({
  getProviderSDKLoader: () => ({
    loadProvider: vi.fn().mockResolvedValue((config: Record<string, unknown>) => {
      // Mock 返回一个工厂函数
      return (modelId: string) => ({
        modelId,
        provider: 'mock-provider',
        ...config,
      });
    }),
    isProviderLoaded: vi.fn(),
    getProviderState: vi.fn(),
    preloadProviders: vi.fn().mockResolvedValue(undefined),
  }),
}));

// 使用 vi.hoisted 创建 mock，确保 vi.mock 工厂函数可用
const { mockAIStreamText, mockAIGenerateId } = vi.hoisted(() => ({
  mockAIStreamText: vi.fn(),
  mockAIGenerateId: vi.fn(() => 'default-ai-id'),
}));

vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    streamText: mockAIStreamText,
    generateId: mockAIGenerateId,
  };
});

// ========================================
// Mock Helpers
// ========================================

/**
 * 创建默认的 mock metadata（AI SDK 格式）
 */
function createMockAISDKMetadata() {
  return {
    providerMetadata: Promise.resolve({ provider: 'deepseek' }),
    warnings: Promise.resolve([]),
    sources: Promise.resolve(undefined),
    response: {
      id: 'test-id',
      modelId: 'deepseek-chat',
      timestamp: new Date('2024-01-01T00:00:00.000Z'), // AI SDK 返回 Date 对象
      headers: {
        'content-type': 'application/json',
      },
    },
    request: {
      body: '{"model":"deepseek-chat"}',
    },
    usage: {
      inputTokens: 10,
      outputTokens: 20,
      totalTokens: 30,
    },
    finishReason: 'stop',
    rawFinishReason: 'stop',
  };
}

/**
 * 创建模拟流式结果
 */
function createMockStreamResult(
  events: Array<{ type: string; text?: string }>,
  metadata?: ReturnType<typeof createMockAISDKMetadata>
) {
  const streamGen = (async function* () {
    for (const event of events) {
      yield event;
    }
  })();

  // 模拟 AI SDK 的 PromiseLike 接口
  const mockResult: {
    // eslint-disable-next-line unicorn/no-thenable
    then: (resolve: (value: ReturnType<typeof createMockAISDKMetadata>) => unknown) => Promise<unknown>;
    fullStream: AsyncGenerator<{ type: string; text?: string }, void, unknown>;
    [Symbol.asyncIterator]: () => AsyncIterator<{ type: string; text?: string }>;
  } = {
    // eslint-disable-next-line unicorn/no-thenable
    then: (resolve: (value: ReturnType<typeof createMockAISDKMetadata>) => unknown) =>
      Promise.resolve(metadata || createMockAISDKMetadata()).then(resolve),
    fullStream: streamGen,
    [Symbol.asyncIterator]: () => streamGen[Symbol.asyncIterator](),
  };

  return mockResult;
}

// ========================================
// Test Setup
// ========================================

let mockStreamText: Mock;
let mockGenerateId: Mock;
let dependencies: {
  streamText: Mock;
  generateId: Mock;
};

beforeEach(() => {
  mockStreamText = vi.fn();
  mockGenerateId = vi.fn(() => 'test-conversation-id');

  dependencies = {
    streamText: mockStreamText,
    generateId: mockGenerateId,
  };
});

// ========================================
// Test Cases
// ========================================

describe('index - streamChatCompletion', () => {
  describe('完整流程测试', () => {
    it('应该完成完整的流式聊天流程', async () => {
      // Arrange
      const model = createDeepSeekModel();
      const params = {
        model,
        historyList: [],
        message: 'Hello',
      };

      const events = [
        { type: 'text-delta', text: 'Hello' },
        { type: 'text-delta', text: ' World' },
      ];
      mockStreamText.mockReturnValue(createMockStreamResult(events));

      // Act
      const messages: StandardMessage[] = [];
      for await (const msg of streamChatCompletion(params, { dependencies })) {
        messages.push(msg);
      }

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].role).toBe(ChatRoleEnum.ASSISTANT);
      expect(messages[0].id).toBe('test-conversation-id');
      expect(mockStreamText).toHaveBeenCalledOnce();
    });

    it('应该生成唯一的消息 ID', async () => {
      // Arrange
      const model = createDeepSeekModel();
      const params = {
        model,
        historyList: [],
        message: 'Hello',
      };

      const events = [{ type: 'text-delta', text: 'Hi' }];
      mockStreamText.mockReturnValue(createMockStreamResult(events));
      mockGenerateId.mockReturnValueOnce('id-1').mockReturnValueOnce('id-2');

      // Act
      const messages1: StandardMessage[] = [];
      for await (const msg of streamChatCompletion(params, { dependencies })) {
        messages1.push(msg);
        break; // 只收集第一条
      }

      const messages2: StandardMessage[] = [];
      for await (const msg of streamChatCompletion(params, { dependencies })) {
        messages2.push(msg);
        break;
      }

      // Assert
      expect(messages1[0].id).toBe('id-1');
      expect(messages2[0].id).toBe('id-2');
      expect(mockGenerateId).toHaveBeenCalledTimes(2);
    });

    it('应该生成正确的时间戳（秒级）', async () => {
      // Arrange
      const model = createDeepSeekModel();
      const params = {
        model,
        historyList: [],
        message: 'Hello',
      };

      const events = [{ type: 'text-delta', text: 'Hi' }];
      mockStreamText.mockReturnValue(createMockStreamResult(events));

      const beforeTime = Math.floor(Date.now() / 1000);

      // Act
      const messages: StandardMessage[] = [];
      for await (const msg of streamChatCompletion(params, { dependencies })) {
        messages.push(msg);
        break;
      }

      const afterTime = Math.floor(Date.now() / 1000);

      // Assert
      expect(messages[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(messages[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('应该调用 getProvider 创建正确的 provider', async () => {
      // Arrange
      const model = createDeepSeekModel();
      const params = {
        model,
        historyList: [],
        message: 'Hello',
      };

      const events = [{ type: 'text-delta', text: 'Hi' }];
      mockStreamText.mockReturnValue(createMockStreamResult(events));

      // Act
      const messages: StandardMessage[] = [];
      for await (const msg of streamChatCompletion(params, { dependencies })) {
        messages.push(msg);
        break;
      }

      // Assert
      expect(mockStreamText).toHaveBeenCalledOnce();
      const streamTextCall = mockStreamText.mock.calls[0][0];
      expect(streamTextCall).toBeDefined();
      expect(streamTextCall.model).toBeDefined();
    });

    it('应该调用 buildMessages 构建正确的消息格式', async () => {
      // Arrange
      const model = createDeepSeekModel();
      const historyList: StandardMessage[] = [
        {
          id: '1',
          timestamp: 1000,
          modelKey: 'deepseek-chat',
          finishReason: 'stop',
          role: ChatRoleEnum.USER,
          content: 'Previous message',
        },
      ];
      const params = {
        model,
        historyList,
        message: 'Hello',
      };

      const events = [{ type: 'text-delta', text: 'Hi' }];
      mockStreamText.mockReturnValue(createMockStreamResult(events));

      // Act
      const messages: StandardMessage[] = [];
      for await (const msg of streamChatCompletion(params, { dependencies })) {
        messages.push(msg);
        break;
      }

      // Assert
      expect(mockStreamText).toHaveBeenCalledOnce();
      const streamTextCall = mockStreamText.mock.calls[0][0];
      expect(streamTextCall.messages).toBeDefined();
      expect(streamTextCall.messages.length).toBe(2); // history + current
      expect(streamTextCall.messages[0].role).toBe('user');
      expect(streamTextCall.messages[1].role).toBe('user');
    });

    it('应该处理流式事件并累积内容', async () => {
      // Arrange
      const model = createDeepSeekModel();
      const params = {
        model,
        historyList: [],
        message: 'Hello',
      };

      // 创建包含多个事件的流
      const streamEvents = [
        { type: 'text-delta', text: 'Hello' },
        { type: 'text-delta', text: ' World' },
      ];
      mockStreamText.mockReturnValue(createMockStreamResult(streamEvents));

      // Act
      const messages: StandardMessage[] = [];
      for await (const msg of streamChatCompletion(params, { dependencies })) {
        messages.push(msg);
      }

      // Assert
      expect(messages.length).toBeGreaterThan(1);
      // 第一个消息
      expect(messages[0].content).toBe('Hello');
      // 最后一个消息应该包含完整内容
      const lastMessage = messages[messages.length - 1];
      expect(lastMessage.content).toBe('Hello World');
    });
  });

  describe('元数据收集测试', () => {
    it('应该在成功时收集完整元数据', async () => {
      // Arrange
      const model = createDeepSeekModel();
      const params = {
        model,
        historyList: [],
        message: 'Hello',
      };

      const events = [{ type: 'text-delta', text: 'Hi' }];
      mockStreamText.mockReturnValue(createMockStreamResult(events));

      // Act
      const messages: StandardMessage[] = [];
      for await (const msg of streamChatCompletion(params, { dependencies })) {
        messages.push(msg);
      }

      // Assert
      const finalMessage = messages[messages.length - 1];
      expect(finalMessage.raw).not.toBeNull();
      expect(finalMessage.raw).toHaveProperty('response');
      expect(finalMessage.raw).toHaveProperty('usage');
      expect(finalMessage.raw).toHaveProperty('finishReason');
      expect(finalMessage.usage).toBeDefined();
      expect(finalMessage.usage?.inputTokens).toBe(10);
      expect(finalMessage.usage?.outputTokens).toBe(20);
    });

    it('应该在元数据收集失败时返回降级消息', async () => {
      // Arrange
      const model = createDeepSeekModel();
      const params = {
        model,
        historyList: [],
        message: 'Hello',
      };

      // 模拟元数据收集失败 - 使用 rejected promise
      const events = [{ type: 'text-delta', text: 'Hi' }];
      const streamGen = (async function* () {
        for (const event of events) {
          yield event;
        }
      })();

      // 创建一个会拒绝的 thenable
      // 模拟 AI SDK 的 PromiseLike 接口
      const mockResult = Object.assign(streamGen, {
        // eslint-disable-next-line unicorn/no-thenable
        then: () => Promise.reject(new Error('Metadata collection failed')),
        fullStream: streamGen,
      });

      mockStreamText.mockReturnValue(mockResult);

      // Act
      const messages: StandardMessage[] = [];
      for await (const msg of streamChatCompletion(params, { dependencies })) {
        messages.push(msg);
        break; // 只收集第一条消息
      }

      // Assert - 由于降级方案，应该返回一个 raw 为 null 的消息
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].raw).toBeNull();
    });
  });

  describe('参数和选项测试', () => {
    it('应该支持 AbortSignal 中断请求', async () => {
      // Arrange
      const model = createDeepSeekModel();
      const params = {
        model,
        historyList: [],
        message: 'Hello',
      };
      const abortController = new AbortController();

      const events = [{ type: 'text-delta', text: 'Hi' }];
      mockStreamText.mockReturnValue(createMockStreamResult(events));

      // Act
      abortController.abort();
      const messages: StandardMessage[] = [];
      try {
        for await (const msg of streamChatCompletion(params, {
          signal: abortController.signal,
          dependencies,
        })) {
          messages.push(msg);
        }
      } catch (error) {
        // 预期会抛出 AbortError - 忽略
        expect(error).toBeDefined();
      }

      // Assert
      expect(mockStreamText).toHaveBeenCalledOnce();
      const streamTextCall = mockStreamText.mock.calls[0][0];
      expect(streamTextCall.abortSignal).toBe(abortController.signal);
    });

    it('应该传递 transmitHistoryReasoning 参数', async () => {
      // Arrange
      const model = createDeepSeekModel();
      const params = {
        model,
        historyList: [],
        message: 'Hello',
        transmitHistoryReasoning: true,
      };

      const events = [
        { type: 'text-delta', text: 'Hello' },
        { type: 'reasoning-delta', text: 'Thinking...' },
      ];
      mockStreamText.mockReturnValue(createMockStreamResult(events));

      // Act
      const messages: StandardMessage[] = [];
      for await (const msg of streamChatCompletion(params, { dependencies })) {
        messages.push(msg);
        break;
      }

      // Assert
      expect(mockStreamText).toHaveBeenCalledOnce();
      const streamTextCall = mockStreamText.mock.calls[0][0];
      expect(streamTextCall.messages).toBeDefined();
      // 消息构建应该包含 reasoning 内容的处理
    });

    it('默认 transmitHistoryReasoning=false 时应排除 reasoning 内容', async () => {
      // Arrange
      const model = createDeepSeekModel();
      const historyList: StandardMessage[] = [
        {
          id: '1',
          timestamp: 1000,
          modelKey: 'deepseek-chat',
          finishReason: 'stop',
          role: ChatRoleEnum.ASSISTANT,
          content: 'Previous answer',
          reasoningContent: 'Internal reasoning process',
        },
      ];
      // 不传 transmitHistoryReasoning，使用默认值 false
      const params = {
        model,
        historyList,
        message: 'Follow up',
      };

      const events = [{ type: 'text-delta', text: 'Response' }];
      mockStreamText.mockReturnValue(createMockStreamResult(events));

      // Act
      const messages: StandardMessage[] = [];
      for await (const msg of streamChatCompletion(params, { dependencies })) {
        messages.push(msg);
        break;
      }

      // Assert
      expect(mockStreamText).toHaveBeenCalledOnce();
      const streamTextCall = mockStreamText.mock.calls[0][0];
      const assistantMsg = streamTextCall.messages[0];
      // assistant 消息的 content 应该只有 text 部分，不包含 reasoning
      expect(assistantMsg.content).toEqual(
        expect.not.arrayContaining([
          expect.objectContaining({ type: 'reasoning' }),
        ]),
      );
    });
  });

  describe('默认依赖测试', () => {
    it('不注入 dependencies 时应使用 defaultAISDKDependencies', async () => {
      // Arrange — 使用 ai 模块级别的 mock
      const model = createDeepSeekModel();
      const params = {
        model,
        historyList: [],
        message: 'Hello',
      };

      const events = [{ type: 'text-delta', text: 'Hi' }];
      mockAIStreamText.mockReturnValue(createMockStreamResult(events));

      // Act — 不传 dependencies，触发 defaultAISDKDependencies 路径
      const messages: StandardMessage[] = [];
      for await (const msg of streamChatCompletion(params)) {
        messages.push(msg);
        break;
      }

      // Assert — mockAIStreamText 被调用证明 defaultAISDKDependencies.streamText 可用
      expect(mockAIStreamText).toHaveBeenCalledOnce();
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].role).toBe(ChatRoleEnum.ASSISTANT);
    });
  });

  describe('工具函数导出测试', () => {
    it('应该正确导出 buildMessages 函数', () => {
      const historyList: StandardMessage[] = [
        {
          id: '1',
          timestamp: 1000,
          modelKey: 'deepseek-chat',
          finishReason: 'stop',
          role: ChatRoleEnum.USER,
          content: 'Hello',
        },
      ];

      const messages = buildMessages(historyList, 'World', false);

      expect(messages).toBeDefined();
      expect(messages.length).toBe(2); // history + new message
      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('user');
    });

    it('应该正确导出 getProvider 函数', async () => {
      const provider = await getProvider(
        ModelProviderKeyEnum.DEEPSEEK,
        'sk-test',
        'https://api.deepseek.com'
      );

      expect(provider).toBeDefined();
      expect(typeof provider).toBe('function');
    });
  });
});
