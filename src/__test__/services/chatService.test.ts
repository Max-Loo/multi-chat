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

    // 完整的元数据 Promise（所有字段都是 Promise）
    const resultPromise = Promise.resolve({
      finishReason: Promise.resolve('stop'),
      rawFinishReason: Promise.resolve('stop'),
      usage: Promise.resolve({ inputTokens: 10, outputTokens: 5 }),
      response: Promise.resolve({
        id: 'resp-123',
        modelId: 'deepseek-chat',
        timestamp: new Date('2024-01-01T00:00:00.000Z'),
        headers: { 'content-type': 'application/json', 'x-request-id': 'req-123' },
      }),
      request: Promise.resolve({
        body: '{"model":"deepseek-chat","messages":[]}',
      }),
      providerMetadata: Promise.resolve({}),
      warnings: Promise.resolve([]),
      sources: Promise.resolve([]),
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
          raw: null,
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
          raw: null,
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
          raw: null,
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
          raw: null,
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
          raw: null,
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
          raw: null,
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
          raw: null,
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
          raw: null,
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
          raw: null,
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
          raw: null,
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

    describe('敏感信息过滤', () => {
      it('应该从请求体中移除 API Key', async () => {
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

        const lastResponse = responses[responses.length - 1];
        expect(lastResponse.raw).toBeDefined();
        expect(lastResponse.raw).not.toBeNull();
        if (lastResponse.raw) {
          const requestBody = JSON.parse(lastResponse.raw.request.body);
          expect(requestBody.apiKey).toBeUndefined();
          expect(requestBody.api_key).toBeUndefined();
          expect(requestBody.authorization).toBeUndefined();
          expect(requestBody.Authorization).toBeUndefined();
        }
      });

      it('应该从响应头中移除 Authorization 头', async () => {
        const mockResult = createMockStreamTextResult([
          { type: 'text-delta', text: 'Response' },
        ]);

        // Mock response with sensitive headers
      const mockResultWithHeaders = {
        ...mockResult,
        // eslint-disable-next-line unicorn/no-thenable
  /* eslint-disable unicorn/no-thenable */

        then: (cb: any) => cb(Promise.resolve({
            finishReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 5 },
            response: Promise.resolve({
              id: 'resp-123',
              modelId: 'deepseek-chat',
              timestamp: new Date('2024-01-01T00:00:00.000Z'),
              headers: {
                'content-type': 'application/json',
                'authorization': 'Bearer secret-token',
                'x-api-key': 'secret-key',
                'x-request-id': 'req-123',
              },
            }),
            request: Promise.resolve({
              body: '{"model":"deepseek-chat","messages":[]}',
            }),
            providerMetadata: Promise.resolve({}),
            warnings: Promise.resolve([]),
            sources: Promise.resolve([]),
            rawFinishReason: Promise.resolve('stop'),
          })),
        };

        vi.mocked(streamText).mockReturnValueOnce(mockResultWithHeaders as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params)) {
          responses.push(response);
        }

        const lastResponse = responses[responses.length - 1];
        expect(lastResponse.raw).toBeDefined();
        expect(lastResponse.raw).not.toBeNull();
        if (lastResponse.raw) {
          expect(lastResponse.raw.response.headers).toBeDefined();
          expect(lastResponse.raw.response.headers?.['authorization']).toBeUndefined();
          expect(lastResponse.raw.response.headers?.['Authorization']).toBeUndefined();
          expect(lastResponse.raw.response.headers?.['x-api-key']).toBeUndefined();
          expect(lastResponse.raw.response.headers?.['X-API-Key']).toBeUndefined();
          expect(lastResponse.raw.response.headers?.['x-request-id']).toBe('req-123');
        }
      });

      it('应该在请求体超过 10KB 时截断', async () => {
        const mockResult = createMockStreamTextResult([
          { type: 'text-delta', text: 'Response' },
        ]);

        // Mock request with large body (> 10KB)
        const largeBody = JSON.stringify({
          model: 'deepseek-chat',
          messages: Array(1000).fill({ role: 'user', content: 'x'.repeat(100) }),
        });

        const mockResultWithLargeBody = {
          ...mockResult,
  /* eslint-disable unicorn/no-thenable */

          then: (cb: any) => cb(Promise.resolve({
            finishReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 5 },
            response: Promise.resolve({
              id: 'resp-123',
              modelId: 'deepseek-chat',
              timestamp: new Date('2024-01-01T00:00:00.000Z'),
            }),
            request: Promise.resolve({
              body: largeBody,
            }),
            providerMetadata: Promise.resolve({}),
            warnings: Promise.resolve([]),
            sources: Promise.resolve([]),
            rawFinishReason: Promise.resolve('stop'),
          })),
        };

        vi.mocked(streamText).mockReturnValueOnce(mockResultWithLargeBody as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params)) {
          responses.push(response);
        }

        const lastResponse = responses[responses.length - 1];
        expect(lastResponse.raw).toBeDefined();
        expect(lastResponse.raw).not.toBeNull();
        if (lastResponse.raw) {
          const requestBody = lastResponse.raw.request.body;
          expect(requestBody.length).toBeLessThanOrEqual(10240 + '... (truncated)'.length);
          expect(requestBody).toContain('... (truncated)');
        }
      });
    });

    describe('错误处理', () => {
      it('应该在元数据收集失败时继续 yield 消息内容', async () => {
        const mockResult = createMockStreamTextResult([
          { type: 'text-delta', text: 'Response' },
        ]);

        // Mock metadata collection to throw errors
        const mockResultWithError = {
          ...mockResult,
  /* eslint-disable unicorn/no-thenable */

          then: (cb: any) => cb(Promise.resolve({
            finishReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 5 },
            response: Promise.resolve({
              id: 'resp-123',
              modelId: 'deepseek-chat',
              timestamp: new Date('2024-01-01T00:00:00.000Z'),
            }),
            request: Promise.resolve({
              body: '{"model":"deepseek-chat","messages":[]}',
            }),
            providerMetadata: Promise.reject(new Error('Network error')),
            warnings: Promise.reject(new Error('Failed to fetch warnings')),
            sources: Promise.reject(new Error('Failed to fetch sources')),
            rawFinishReason: Promise.resolve('stop'),
          })),
        };

        vi.mocked(streamText).mockReturnValueOnce(mockResultWithError as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params)) {
          responses.push(response);
        }

        // 应该成功返回消息，即使元数据收集失败
        expect(responses.length).toBeGreaterThan(0);
        const lastResponse = responses[responses.length - 1];

        // 验证消息内容正确
        expect(lastResponse.content).toBe('Response');
        expect(lastResponse.finishReason).toBe('stop');
        expect(lastResponse.usage).toEqual({
          inputTokens: 10,
          outputTokens: 5,
        });

        // 验证 raw 对象包含错误信息
        expect(lastResponse.raw).toBeDefined();
        expect(lastResponse.raw).not.toBeNull();
        if (lastResponse.raw) {
          expect(lastResponse.raw.errors).toBeDefined();
          expect(lastResponse.raw.errors?.length).toBeGreaterThan(0);
          expect(lastResponse.raw.errors?.[0].field).toBe('providerMetadata');
        }
      });

      it('应该在部分元数据收集失败时记录错误但不影响其他元数据', async () => {
        const mockResult = createMockStreamTextResult([
          { type: 'text-delta', text: 'Response' },
        ]);

        // Mock only warnings to fail
        const mockResultWithPartialError = {
          ...mockResult,
  /* eslint-disable unicorn/no-thenable */

          then: (cb: any) => cb(Promise.resolve({
            finishReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 5 },
            response: Promise.resolve({
              id: 'resp-123',
              modelId: 'deepseek-chat',
              timestamp: new Date('2024-01-01T00:00:00.000Z'),
            }),
            request: Promise.resolve({
              body: '{"model":"deepseek-chat","messages":[]}',
            }),
            providerMetadata: Promise.resolve({ deepseek: { version: '2024-01-01' } }),
            warnings: Promise.reject(new Error('Warnings fetch failed')),
            sources: Promise.resolve([]),
            rawFinishReason: Promise.resolve('stop'),
          })),
        };

        vi.mocked(streamText).mockReturnValueOnce(mockResultWithPartialError as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params)) {
          responses.push(response);
        }

        const lastResponse = responses[responses.length - 1];

        // 验证成功的元数据被收集
        expect(lastResponse.raw).toBeDefined();
        expect(lastResponse.raw).not.toBeNull();
        if (lastResponse.raw) {
          expect(lastResponse.raw.providerMetadata).toBeDefined();
          expect(lastResponse.raw.providerMetadata?.deepseek).toBeDefined();

          // 验证错误被记录
          expect(lastResponse.raw.errors).toBeDefined();
          expect(lastResponse.raw.errors?.length).toBe(1);
          expect(lastResponse.raw.errors?.[0].field).toBe('warnings');
        }
      });
    });

    describe('原始数据收集', () => {
      it('应该收集基础元数据（response, request, usage, finishReason）', async () => {
        const mockResult = createMockStreamTextResult([
          { type: 'text-delta', text: 'Response' },
        ]);

        const mockResultWithMetadata = {
          ...mockResult,
  /* eslint-disable unicorn/no-thenable */

          then: (cb: any) => cb(Promise.resolve({
            finishReason: 'stop',
            usage: {
              inputTokens: 100,
              outputTokens: 50,
              totalTokens: 150,
              inputTokenDetails: { cacheReadTokens: 20, cacheWriteTokens: 0, noCacheTokens: 80 },
              outputTokenDetails: { textTokens: 40, reasoningTokens: 10 },
            },
            response: Promise.resolve({
              id: 'resp-123',
              modelId: 'deepseek-chat',
              timestamp: new Date('2024-01-01T00:00:00.000Z'),
              headers: { 'content-type': 'application/json', 'x-request-id': 'req-123' },
            }),
            request: Promise.resolve({
              body: '{"model":"deepseek-chat","messages":[]}',
            }),
            providerMetadata: Promise.resolve({}),
            warnings: Promise.resolve([]),
            sources: Promise.resolve([]),
            rawFinishReason: Promise.resolve('stop'),
          })),
        };

        vi.mocked(streamText).mockReturnValueOnce(mockResultWithMetadata as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params)) {
          responses.push(response);
        }

        const lastResponse = responses[responses.length - 1];
        expect(lastResponse.raw).toBeDefined();
        expect(lastResponse.raw).not.toBeNull();
        if (lastResponse.raw) {
          // 验证 response 元数据
          expect(lastResponse.raw.response.id).toBe('resp-123');
          expect(lastResponse.raw.response.modelId).toBe('deepseek-chat');
          expect(lastResponse.raw.response.timestamp).toBe('2024-01-01T00:00:00.000Z');
          expect(lastResponse.raw.response.headers).toBeDefined();

          // 验证 request 元数据
          expect(lastResponse.raw.request.body).toBeDefined();
          expect(typeof lastResponse.raw.request.body).toBe('string');

          // 验证 usage 元数据
          expect(lastResponse.raw.usage.inputTokens).toBe(100);
          expect(lastResponse.raw.usage.outputTokens).toBe(50);
          expect(lastResponse.raw.usage.totalTokens).toBe(150);
          expect(lastResponse.raw.usage.inputTokenDetails).toBeDefined();
          expect(lastResponse.raw.usage.outputTokenDetails).toBeDefined();

          // 验证 finishReason 元数据
          expect(lastResponse.raw.finishReason.reason).toBe('stop');
          expect(lastResponse.raw.finishReason.rawReason).toBe('stop');
        }
      });

      it('应该正确统计流式事件（textDeltaCount, reasoningDeltaCount, duration）', async () => {
        const mockResult = createMockStreamTextResult([
          { type: 'text-delta', text: 'Hello' },
          { type: 'text-delta', text: ' World' },
          { type: 'reasoning-delta', text: 'Thinking' },
          { type: 'reasoning-delta', text: ' process' },
          { type: 'text-delta', text: '!' },
        ]);

        const mockResultWithMetadata = {
          ...mockResult,
  /* eslint-disable unicorn/no-thenable */

          then: (cb: any) => cb(Promise.resolve({
            finishReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 20 },
            response: Promise.resolve({
              id: 'resp-123',
              modelId: 'deepseek-chat',
              timestamp: new Date('2024-01-01T00:00:00.000Z'),
            }),
            request: Promise.resolve({
              body: '{"model":"deepseek-chat","messages":[]}',
            }),
            providerMetadata: Promise.resolve({}),
            warnings: Promise.resolve([]),
            sources: Promise.resolve([]),
            rawFinishReason: Promise.resolve('stop'),
          })),
        };

        vi.mocked(streamText).mockReturnValueOnce(mockResultWithMetadata as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params)) {
          responses.push(response);
        }

        const lastResponse = responses[responses.length - 1];
        expect(lastResponse.raw).toBeDefined();
        expect(lastResponse.raw).not.toBeNull();
        if (lastResponse.raw) {
          // 验证流式事件统计
          expect(lastResponse.raw.streamStats).toBeDefined();
          expect(lastResponse.raw.streamStats?.textDeltaCount).toBe(3); // 3个 text-delta 事件
          expect(lastResponse.raw.streamStats?.reasoningDeltaCount).toBe(2); // 2个 reasoning-delta 事件
          expect(lastResponse.raw.streamStats?.duration).toBeGreaterThanOrEqual(0); // duration 应该 >= 0
        }
      });

      it('应该收集 DeepSeek 供应商特定元数据', async () => {
        const mockResult = createMockStreamTextResult([
          { type: 'text-delta', text: 'Response' },
        ]);

        const mockResultWithMetadata = {
          ...mockResult,
  /* eslint-disable unicorn/no-thenable */

          then: (cb: any) => cb(Promise.resolve({
            finishReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 5 },
            response: Promise.resolve({
              id: 'resp-deepseek',
              modelId: 'deepseek-chat',
              timestamp: new Date('2024-01-01T00:00:00.000Z'),
            }),
            request: Promise.resolve({
              body: '{}',
            }),
            providerMetadata: Promise.resolve({
              deepseek: { version: '2024-01-01', reasoningTokens: 100 },
            }),
            warnings: Promise.resolve([]),
            sources: Promise.resolve([]),
            rawFinishReason: Promise.resolve('stop'),
          })),
        };

        vi.mocked(streamText).mockReturnValueOnce(mockResultWithMetadata as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params)) {
          responses.push(response);
        }

        const lastResponse = responses[responses.length - 1];
        expect(lastResponse.raw).toBeDefined();
        expect(lastResponse.raw).not.toBeNull();
        if (lastResponse.raw) {
          expect(lastResponse.raw.providerMetadata).toBeDefined();
          expect(lastResponse.raw.providerMetadata?.deepseek).toBeDefined();
          expect(lastResponse.raw.providerMetadata?.deepseek.version).toBe('2024-01-01');
        }
      });

      it('应该收集 MoonshotAI 供应商特定元数据', async () => {
        const mockResult = createMockStreamTextResult([
          { type: 'text-delta', text: 'Response' },
        ]);

        const mockResultWithMetadata = {
          ...mockResult,
  /* eslint-disable unicorn/no-thenable */

          then: (cb: any) => cb(Promise.resolve({
            finishReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 5 },
            response: Promise.resolve({
              id: 'resp-moonshot',
              modelId: 'moonshot-v1-8k',
              timestamp: new Date('2024-01-01T00:00:00.000Z'),
            }),
            request: Promise.resolve({
              body: '{}',
            }),
            providerMetadata: Promise.resolve({
              moonshotai: { apiVersion: 'v2', modelVersion: '1.0' },
            }),
            warnings: Promise.resolve([]),
            sources: Promise.resolve([]),
            rawFinishReason: Promise.resolve('stop'),
          })),
        };

        vi.mocked(streamText).mockReturnValueOnce(mockResultWithMetadata as any);

        const params = {
          model: { ...mockModel, providerKey: ModelProviderKeyEnum.MOONSHOTAI },
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params)) {
          responses.push(response);
        }

        const lastResponse = responses[responses.length - 1];
        expect(lastResponse.raw).toBeDefined();
        expect(lastResponse.raw).not.toBeNull();
        if (lastResponse.raw) {
          expect(lastResponse.raw.providerMetadata).toBeDefined();
          expect(lastResponse.raw.providerMetadata?.moonshotai).toBeDefined();
          expect(lastResponse.raw.providerMetadata?.moonshotai.apiVersion).toBe('v2');
        }
      });

      it('应该收集 Zhipu 供应商特定元数据', async () => {
        const mockResult = createMockStreamTextResult([
          { type: 'text-delta', text: 'Response' },
        ]);

        const mockResultWithMetadata = {
          ...mockResult,
  /* eslint-disable unicorn/no-thenable */

          then: (cb: any) => cb(Promise.resolve({
            finishReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 5 },
            response: Promise.resolve({
              id: 'resp-zhipu',
              modelId: 'glm-web-search',
              timestamp: new Date('2024-01-01T00:00:00.000Z'),
            }),
            request: Promise.resolve({
              body: '{}',
            }),
            providerMetadata: Promise.resolve({
              zhipu: { apiVersion: 'v3', requestType: 'web_search' },
            }),
            warnings: Promise.resolve([]),
            sources: Promise.resolve([]),
            rawFinishReason: Promise.resolve('stop'),
          })),
        };

        vi.mocked(streamText).mockReturnValueOnce(mockResultWithMetadata as any);

        const params = {
          model: { ...mockModel, providerKey: ModelProviderKeyEnum.ZHIPUAI },
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params)) {
          responses.push(response);
        }

        const lastResponse = responses[responses.length - 1];
        expect(lastResponse.raw).toBeDefined();
        expect(lastResponse.raw).not.toBeNull();
        if (lastResponse.raw) {
          expect(lastResponse.raw.providerMetadata).toBeDefined();
          expect(lastResponse.raw.providerMetadata?.zhipu).toBeDefined();
          expect(lastResponse.raw.providerMetadata?.zhipu.apiVersion).toBe('v3');
        }
      });

      it('应该收集 RAG Sources（web search 模型）', async () => {
        const mockResult = createMockStreamTextResult([
          { type: 'text-delta', text: 'Response with sources' },
        ]);

        const mockResultWithSources = {
          ...mockResult,
  /* eslint-disable unicorn/no-thenable */

          then: (cb: any) => cb(Promise.resolve({
            finishReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 5 },
            response: Promise.resolve({
              id: 'resp-123',
              modelId: 'glm-web-search',
              timestamp: new Date('2024-01-01T00:00:00.000Z'),
            }),
            request: Promise.resolve({
              body: '{}',
            }),
            providerMetadata: Promise.resolve({}),
            warnings: Promise.resolve([]),
            sources: Promise.resolve([
              {
                sourceType: 'url' as const,
                id: 'src-1',
                url: 'https://example.com/article1',
                title: 'Example Article 1',
                providerMetadata: { score: 0.95 },
              },
              {
                sourceType: 'url' as const,
                id: 'src-2',
                url: 'https://example.com/article2',
                title: 'Example Article 2',
                providerMetadata: { score: 0.87 },
              },
            ]),
            rawFinishReason: Promise.resolve('stop'),
          })),
        };

        vi.mocked(streamText).mockReturnValueOnce(mockResultWithSources as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Search for AI news',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params)) {
          responses.push(response);
        }

        const lastResponse = responses[responses.length - 1];
        expect(lastResponse.raw).toBeDefined();
        expect(lastResponse.raw).not.toBeNull();
        if (lastResponse.raw) {
          expect(lastResponse.raw.sources).toBeDefined();
          expect(lastResponse.raw.sources?.length).toBe(2);
          expect(lastResponse.raw.sources?.[0].sourceType).toBe('url');
          expect(lastResponse.raw.sources?.[0].id).toBe('src-1');
          expect(lastResponse.raw.sources?.[0].url).toBe('https://example.com/article1');
          expect(lastResponse.raw.sources?.[0].title).toBe('Example Article 1');
          expect(lastResponse.raw.sources?.[0].providerMetadata).toEqual({ score: 0.95 });
        }
      });

      it('应该在无 sources 时设置为 undefined', async () => {
        const mockResult = createMockStreamTextResult([
          { type: 'text-delta', text: 'Response without sources' },
        ]);

        const mockResultWithoutSources = {
          ...mockResult,
  /* eslint-disable unicorn/no-thenable */

          then: (cb: any) => cb(Promise.resolve({
            finishReason: 'stop',
            usage: { inputTokens: 10, outputTokens: 5 },
            response: Promise.resolve({
              id: 'resp-123',
              modelId: 'deepseek-chat',
              timestamp: new Date('2024-01-01T00:00:00.000Z'),
            }),
            request: Promise.resolve({
              body: '{}',
            }),
            providerMetadata: Promise.resolve({}),
            warnings: Promise.resolve([]),
            sources: Promise.resolve([]),
            rawFinishReason: Promise.resolve('stop'),
          })),
        };

        vi.mocked(streamText).mockReturnValueOnce(mockResultWithoutSources as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params)) {
          responses.push(response);
        }

        const lastResponse = responses[responses.length - 1];
        expect(lastResponse.raw).toBeDefined();
        expect(lastResponse.raw).not.toBeNull();
        if (lastResponse.raw) {
          // 空数组应该被转换为 undefined（因为我们过滤并映射）
          expect(lastResponse.raw.sources).toBeUndefined();
        }
      });
    });
  });
});
