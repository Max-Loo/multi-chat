/**
 * chatService 单元测试
 *
 * 测试策略：
 * - 使用 vi.mock() 隔离外部依赖（Vercel AI SDK、供应商 SDK）
 * - 重点测试参数传递、消息转换、错误处理等核心逻辑
 * - 不测试流式响应的实际消费（由集成测试覆盖）
 *
 * Mock 方法：
 * - ai 包：Mock streamText 和 generateId
 * - 供应商 SDK：Mock createDeepSeek、createMoonshotAI、createZhipu
 * - tauriCompat：Mock getFetchFunc 返回模拟的 fetch 函数
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { ChatRoleEnum } from '@/types/chat';
import type { StandardMessage } from '@/types/chat';
import { buildMessages, getProvider, streamChatCompletion } from '@/services/chatService';
import { streamText, generateId } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { createZhipu } from 'zhipu-ai-provider';

// Mock Vercel AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn(),
  generateId: vi.fn(() => 'mock-generated-id'),
}));

// Mock 供应商 SDK
vi.mock('@ai-sdk/deepseek', () => ({
  createDeepSeek: vi.fn(() => vi.fn()),
}));

vi.mock('@ai-sdk/moonshotai', () => ({
  createMoonshotAI: vi.fn(() => vi.fn()),
}));

vi.mock('zhipu-ai-provider', () => ({
  createZhipu: vi.fn(() => vi.fn()),
}));

// Mock tauriCompat
vi.mock('@/utils/tauriCompat', () => ({
  getFetchFunc: vi.fn(() => vi.fn()),
}));

vi.mock('@/utils/utils', () => ({
  getCurrentTimestamp: vi.fn(() => 1234567890),
}));

// 辅助函数：创建 mock stream（移到文件顶层以避免 lint 警告）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockStream = async function* (items: any[]) {
  for (const item of items) {
    yield item;
  }
};

describe('chatService', () => {
  // 辅助函数：创建完整的 streamText 返回值
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMockStreamTextResult = (streamItems: any[]) => {
    const asyncGen = createMockStream(streamItems);
    const resultPromise = Promise.resolve({
      finishReason: 'stop',
      usage: { inputTokens: 10, outputTokens: 5 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      fullStream: {
        [Symbol.asyncIterator]: () => asyncGen[Symbol.asyncIterator](),
      },
      // Vercel AI SDK 的 thenable 行为（必须保留，不可删除）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line unicorn/no-thenable
      then: (cb: any) => cb(resultPromise),
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('buildMessages', () => {
    it('应该转换 system 消息为 AI SDK 格式（content 为字符串）', () => {
      const historyList: StandardMessage[] = [
        {
          id: '1',
          role: ChatRoleEnum.SYSTEM,
          content: 'You are a helpful assistant',
          timestamp: 1234567890,
          modelKey: 'gpt-4',
          finishReason: null,
          raw: '',
        },
      ];

      const result = buildMessages(historyList, 'Hello', false);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        role: 'system',
        content: 'You are a helpful assistant',
      });
    });

    it('应该转换 user 消息为 AI SDK 格式（content 为 Part 数组）', () => {
      const historyList: StandardMessage[] = [
        {
          id: '1',
          role: ChatRoleEnum.USER,
          content: 'Previous message',
          timestamp: 1234567890,
          modelKey: 'gpt-4',
          finishReason: null,
          raw: '',
        },
      ];

      const result = buildMessages(historyList, 'Hello', false);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        role: 'user',
        content: [{ type: 'text', text: 'Previous message' }],
      });
    });

    it('应该转换 assistant 消息（不含推理内容）', () => {
      const historyList: StandardMessage[] = [
        {
          id: '1',
          role: ChatRoleEnum.ASSISTANT,
          content: 'Assistant response',
          timestamp: 1234567890,
          modelKey: 'gpt-4',
          finishReason: null,
          raw: '',
        },
      ];

      const result = buildMessages(historyList, 'Hello', false);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        role: 'assistant',
        content: [{ type: 'text', text: 'Assistant response' }],
      });
    });

    it('应该转换 assistant 消息（含推理内容，includeReasoningContent=true）', () => {
      const historyList: StandardMessage[] = [
        {
          id: '1',
          role: ChatRoleEnum.ASSISTANT,
          content: 'Assistant response',
          reasoningContent: 'This is my reasoning',
          timestamp: 1234567890,
          modelKey: 'gpt-4',
          finishReason: null,
          raw: '',
        },
      ];

      const result = buildMessages(historyList, 'Hello', true);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        role: 'assistant',
        content: [
          { type: 'text', text: 'Assistant response' },
          { type: 'reasoning', text: 'This is my reasoning' },
        ],
      });
    });

    it('应该处理空推理内容（不添加 reasoning Part）', () => {
      const historyList: StandardMessage[] = [
        {
          id: '1',
          role: ChatRoleEnum.ASSISTANT,
          content: 'Assistant response',
          reasoningContent: '   ',
          timestamp: 1234567890,
          modelKey: 'gpt-4',
          finishReason: null,
          raw: '',
        },
      ];

      const result = buildMessages(historyList, 'Hello', true);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        role: 'assistant',
        content: [{ type: 'text', text: 'Assistant response' }],
      });
    });

    it('应该添加最新的 user 消息到数组末尾', () => {
      const historyList: StandardMessage[] = [
        {
          id: '1',
          role: ChatRoleEnum.SYSTEM,
          content: 'System prompt',
          timestamp: 1234567890,
          modelKey: 'gpt-4',
          finishReason: null,
          raw: '',
        },
      ];

      const result = buildMessages(historyList, 'New message', false);

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({
        role: 'user',
        content: [{ type: 'text', text: 'New message' }],
      });
    });

    it('应该对未知角色抛出错误', () => {
      const historyList: StandardMessage[] = [
        {
          id: '1',
          role: 'unknown' as ChatRoleEnum,
          content: 'Some content',
          timestamp: 1234567890,
          modelKey: 'gpt-4',
          finishReason: null,
          raw: '',
        },
      ];

      expect(() => buildMessages(historyList, 'Hello', false)).toThrow(
        'Unknown role:'
      );
    });

    it('应该处理空历史记录（edge case）', () => {
      const historyList: StandardMessage[] = [];

      const result = buildMessages(historyList, 'First message', false);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        role: 'user',
        content: [{ type: 'text', text: 'First message' }],
      });
    });

    it('应该处理空字符串推理内容', () => {
      const historyList: StandardMessage[] = [
        {
          id: '1',
          role: ChatRoleEnum.ASSISTANT,
          content: 'Assistant response',
          reasoningContent: '',
          timestamp: 1234567890,
          modelKey: 'gpt-4',
          finishReason: null,
          raw: '',
        },
      ];

      const result = buildMessages(historyList, 'Hello', true);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        role: 'assistant',
        content: [{ type: 'text', text: 'Assistant response' }],
      });
    });
  });

  describe('getProvider', () => {
    it.each([
      ['DeepSeek', ModelProviderKeyEnum.DEEPSEEK, createDeepSeek],
      ['Moonshot', ModelProviderKeyEnum.MOONSHOTAI, createMoonshotAI],
      ['Zhipu', ModelProviderKeyEnum.ZHIPUAI, createZhipu],
    ])('应该创建 %s provider', (_, providerKey, sdkFn) => {
      const apiKey = 'sk-test';
      const baseURL = 'https://api.test.com';

      const provider = getProvider(providerKey, apiKey, baseURL);

      expect(typeof provider).toBe('function');
      expect(sdkFn).toHaveBeenCalledWith({
        apiKey,
        baseURL,
        fetch: expect.any(Function),
      });
    });

    it('应该为 ZHIPUAI_CODING_PLAN 创建 Zhipu provider', () => {
      const apiKey = 'sk-test';
      const baseURL = 'https://api.test.com';

      const provider = getProvider(
        ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN,
        apiKey,
        baseURL
      );

      expect(typeof provider).toBe('function');
      expect(createZhipu).toHaveBeenCalledWith({
        apiKey,
        baseURL,
        fetch: expect.any(Function),
      });
    });

    it('应该对不支持的供应商抛出错误', () => {
      const apiKey = 'sk-test';
      const baseURL = 'https://api.test.com';

      expect(() =>
        getProvider('unknown' as ModelProviderKeyEnum, apiKey, baseURL)
      ).toThrow('Unsupported provider: unknown');
    });

    it('应该返回正确的函数类型', () => {
      const provider = getProvider(
        ModelProviderKeyEnum.DEEPSEEK,
        'sk-test',
        'https://api.test.com'
      );

      expect(typeof provider).toBe('function');
      expect(provider.length).toBe(1);
    });
  });

  describe('streamChatCompletion', () => {
    const mockModel = {
      providerKey: ModelProviderKeyEnum.DEEPSEEK,
      modelKey: 'deepseek-chat',
      apiKey: 'sk-test',
      apiAddress: 'https://api.deepseek.com',
    } as any;

    it('应该成功发起流式请求', async () => {
      const mockResult = createMockStreamTextResult([
        { type: 'text-delta', text: 'Hello' },
        { type: 'text-delta', text: ' World' },
      ]);

      vi.mocked(streamText).mockReturnValueOnce(mockResult as any);

      const params = {
        model: mockModel,
        historyList: [],
        message: 'Hi',
      };

      const responses: StandardMessage[] = [];
      for await (const response of streamChatCompletion(params)) {
        responses.push(response);
      }

      expect(responses.length).toBeGreaterThan(0);
      expect(responses[0]).toMatchObject({
        role: ChatRoleEnum.ASSISTANT,
        modelKey: 'deepseek-chat',
      });
    });

    it('应该调用 buildMessages 并传递结果', async () => {
      const mockResult = createMockStreamTextResult([
        { type: 'text-delta', text: 'Response' },
      ]);

      vi.mocked(streamText).mockReturnValueOnce(mockResult as any);

      const historyList: StandardMessage[] = [
        {
          id: '1',
          role: ChatRoleEnum.USER,
          content: 'Previous',
          timestamp: 1234567890,
          modelKey: 'gpt-4',
          finishReason: null,
          raw: '',
        },
      ];

      const params = {
        model: mockModel,
        historyList,
        message: 'New message',
      };

      for await (const _ of streamChatCompletion(params)) {
        // 消费流
      }

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: [{ type: 'text', text: 'Previous' }],
            }),
          ]),
        })
      );
    });

    it('应该传递 includeReasoningContent 参数', async () => {
      const mockResult = createMockStreamTextResult([
        { type: 'text-delta', text: 'Response' },
      ]);

      vi.mocked(streamText).mockReturnValueOnce(mockResult as any);

      const historyList: StandardMessage[] = [
        {
          id: '1',
          role: ChatRoleEnum.ASSISTANT,
          content: 'Response',
          reasoningContent: 'Reasoning',
          timestamp: 1234567890,
          modelKey: 'gpt-4',
          finishReason: null,
          raw: '',
        },
      ];

      const params = {
        model: mockModel,
        historyList,
        message: 'New',
        includeReasoningContent: true,
      };

      for await (const _ of streamChatCompletion(params)) {
        // 消费流
      }

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'assistant',
              content: expect.arrayContaining([
                { type: 'text', text: 'Response' },
                { type: 'reasoning', text: 'Reasoning' },
              ]),
            }),
          ]),
        })
      );
    });

    it('应该使用传入的 conversationId', async () => {
      const mockResult = createMockStreamTextResult([
        { type: 'text-delta', text: 'Response' },
      ]);

      vi.mocked(streamText).mockReturnValueOnce(mockResult as any);

      const conversationId = 'custom-conversation-id';
      const params = {
        model: mockModel,
        historyList: [],
        message: 'Hi',
        conversationId,
      };

      const responses: StandardMessage[] = [];
      for await (const response of streamChatCompletion(params)) {
        responses.push(response);
      }

      expect(responses[0].id).toBe(conversationId);
      expect(generateId).not.toHaveBeenCalled();
    });

    it('应该在没有传入 conversationId 时调用 generateId', async () => {
      const mockResult = createMockStreamTextResult([
        { type: 'text-delta', text: 'Response' },
      ]);

      vi.mocked(streamText).mockReturnValueOnce(mockResult as any);

      const params = {
        model: mockModel,
        historyList: [],
        message: 'Hi',
      };

      const responses: StandardMessage[] = [];
      for await (const response of streamChatCompletion(params)) {
        responses.push(response);
      }

      expect(responses[0].id).toBe('mock-generated-id');
      expect(generateId).toHaveBeenCalled();
    });

    it('应该传递 AbortSignal', async () => {
      const mockResult = createMockStreamTextResult([
        { type: 'text-delta', text: 'Response' },
      ]);

      vi.mocked(streamText).mockReturnValueOnce(mockResult as any);

      const abortController = new AbortController();
      const params = {
        model: mockModel,
        historyList: [],
        message: 'Hi',
      };

      for await (const _ of streamChatCompletion(params, {
        signal: abortController.signal,
      })) {
        // 消费流
      }

      expect(streamText).toHaveBeenCalledWith(
        expect.objectContaining({
          abortSignal: abortController.signal,
        })
      );
    });

    it('应该使用 getFetchFunc 获取 fetch 函数', async () => {
      const mockFetch = vi.fn();
      const { getFetchFunc } = await import('@/utils/tauriCompat');
      vi.mocked(getFetchFunc).mockReturnValueOnce(mockFetch);

      const mockResult = createMockStreamTextResult([
        { type: 'text-delta', text: 'Response' },
      ]);

      vi.mocked(streamText).mockReturnValueOnce(mockResult as any);

      const params = {
        model: mockModel,
        historyList: [],
        message: 'Hi',
      };

      for await (const _ of streamChatCompletion(params)) {
        // 消费流
      }

      expect(getFetchFunc).toHaveBeenCalled();
      expect(createDeepSeek).toHaveBeenCalledWith(
        expect.objectContaining({
          fetch: mockFetch,
        })
      );
    });

    it('应该正确传播网络错误', async () => {
      const networkError = new Error('Network error');

      vi.mocked(streamText).mockImplementationOnce(() => {
        throw networkError;
      });

      const params = {
        model: mockModel,
        historyList: [],
        message: 'Hi',
      };

      await expect(async () => {
        for await (const _ of streamChatCompletion(params)) {
          // 消费流
        }
      }).rejects.toThrow('Network error');
    });

    it('应该处理包含 reasoning-delta 的流', async () => {
      const mockResult = createMockStreamTextResult([
        { type: 'reasoning-delta', text: 'Thinking' },
        { type: 'text-delta', text: 'Response' },
      ]);

      vi.mocked(streamText).mockReturnValueOnce(mockResult as any);

      const params = {
        model: mockModel,
        historyList: [],
        message: 'Hi',
      };

      const responses: StandardMessage[] = [];
      for await (const response of streamChatCompletion(params)) {
        responses.push(response);
      }

      // 应该有 3 个响应：2 个中间响应 + 1 个最终响应
      expect(responses).toHaveLength(3);
      expect(responses[0].reasoningContent).toBe('Thinking');
      expect(responses[1].content).toBe('Response');
      // 最后一个响应包含 finishReason 和 usage
      expect(responses[2].finishReason).toBe('stop');
    });

    it('应该在最终消息中包含 finishReason 和 usage', async () => {
      const mockResult = createMockStreamTextResult([
        { type: 'text-delta', text: 'Response' },
      ]);

      vi.mocked(streamText).mockReturnValueOnce(mockResult as any);

      const params = {
        model: mockModel,
        historyList: [],
        message: 'Hi',
      };

      const responses: StandardMessage[] = [];
      for await (const response of streamChatCompletion(params)) {
        responses.push(response);
      }

      // 最后一个消息应该包含 finishReason 和 usage
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.finishReason).toBe('stop');
      expect(lastResponse.usage).toEqual({
        inputTokens: 10,
        outputTokens: 5,
      });
    });
  });
});
