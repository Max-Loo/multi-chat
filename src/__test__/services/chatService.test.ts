/**
 * chatService 单元测试
 *
 * 测试策略：
 * - 使用依赖注入隔离外部依赖（Vercel AI SDK、供应商 SDK）
 * - 重点测试参数传递、消息转换、错误处理等核心逻辑
 * - streamChatCompletion 支持依赖注入来避免真实 HTTP 调用
 *
 * 依赖注入方法：
 * ```typescript
 * const mockStreamText = vi.fn();
 * const mockGenerateId = vi.fn(() => 'test-id');
 * streamChatCompletion(params, {
 *   dependencies: { streamText: mockStreamText, generateId: mockGenerateId }
 * })
 * ```
 *
 * 注意：测试中会有 "Unhandled Rejection" 警告，这是预期的。
 * 这些警告来自测试错误处理场景时故意创建的错误对象（如 createMockAPIError）。
 * 所有 54 个测试都通过了，这些警告不影响功能正确性。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { ChatRoleEnum } from '@/types/chat';
import type { StandardMessage } from '@/types/chat';

// 注意：所有 vi.mock 已在 setup.ts 中全局定义
// 这些 mock 包括：ai 包、@ai-sdk/deepseek、@ai-sdk/moonshotai、zhipu-ai-provider、@/utils/tauriCompat
// 测试文件中使用 vi.mocked() 来配置具体 mock 行为

// 导入 mock 的模块
import { streamText } from 'ai';

// 导入被测试的函数（在所有 mock 之后）
import { buildMessages, getProvider, streamChatCompletion } from '@/services/chatService';

// 导入测试辅助函数
import { createMockStreamResult } from '@/__test__/helpers';

// Mock 时间戳模块
vi.mock('@/utils/utils', () => ({
  getCurrentTimestamp: vi.fn(() => 1234567890),
  getCurrentTimestampMs: vi.fn(() => 1234567890000),
}));

// TODO: 重新实现以使用 MSW 替代 vi.mock
describe('chatService', () => {
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
      ['DeepSeek', ModelProviderKeyEnum.DEEPSEEK],
      ['Moonshot', ModelProviderKeyEnum.MOONSHOTAI],
      ['Zhipu', ModelProviderKeyEnum.ZHIPUAI],
    ])('应该创建 %s provider', (_, providerKey) => {
      const apiKey = 'sk-test';
      const baseURL = 'https://api.test.com';

      const provider = getProvider(providerKey, apiKey, baseURL);

      expect(typeof provider).toBe('function');
      expect(provider.length).toBe(1);

      // 测试 provider 函数可以正常调用
      const model = provider('test-model');
      expect(model).toBeDefined();
      expect(typeof model).toBe('object');
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
      expect(provider.length).toBe(1);

      // 测试 provider 函数可以正常调用
      const model = provider('test-model');
      expect(model).toBeDefined();
      expect(typeof model).toBe('object');
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

  // TODO: 修复 Vitest mock 问题 - Vercel AI SDK 供应商 provider 使用真实实现
  // 问题描述：
  // 1. vi.mock() 可以拦截 createDeepSeek/createMoonshotAI/createZhipu 函数
  // 2. 但这些函数返回的 provider 对象内部仍使用真实的 HTTP 客户端
  // 3. 当 streamText 调用 provider(modelId).doStream() 时，会发起真实 API 请求
  //
  // 根本原因：
  // - ESM 模块加载顺序 + pnpm 虚拟文件系统
  // - 供应商 provider 内部引用了真实的 HTTP 客户端 (@ai-sdk/provider-utils)
  // - Mock 只能拦截函数导出，无法拦截内部模块引用
  //
  // 验证方法：
  // 运行测试时观察 stderr，会看到真实的 API 错误（如 "Authentication Fails"）
  // 这证明了真实 API 被调用了，Mock 未完全生效
  //
  // 解决方案选项：
  // 1. ✅ 推荐：使用 MSW (Mock Service Worker) 拦截 HTTP 请求
  // 2. 重构 chatService，支持依赖注入（传入 streamText 函数）
  // 3. 仅测试 buildMessages 和 getProvider，streamChatCompletion 用集成测试
  // 4. 暂时跳过这些测试（当前方案）
  //
  // 当前状态：
  // - buildMessages 测试：✅ 9/9 通过
  // - getProvider 测试：✅ 6/6 通过
  // - streamChatCompletion 测试：✅ 使用依赖注入，39 个测试通过
  //
  // 解决方案：
  // 使用依赖注入传入 mock 的 streamText 和 generateId 函数
  // 避免直接使用全局 mock（因为 ESM 模块引用问题）
  describe('streamChatCompletion (使用依赖注入)', () => {
    const mockModel = {
      providerKey: ModelProviderKeyEnum.DEEPSEEK,
      modelKey: 'deepseek-chat',
      apiKey: 'sk-test',
      apiAddress: 'https://api.deepseek.com',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: 测试错误处理，需要构造无效输入
    } as any;

    // 创建 mock 函数
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Reason: 测试代码，需要使用 vi.fn() 创建 mock，类型不兼容
    let mockStreamText: any;
    let mockGenerateId: any;

    beforeEach(() => {
      mockStreamText = vi.fn();
      mockGenerateId = vi.fn(() => 'test-generated-id');
    });

    it('debug: streamText should be mocked', () => {
      expect(vi.isMockFunction(streamText)).toBe(true);
    });

    it('应该成功发起流式请求', async () => {
      const mockResult = createMockStreamResult([
        { type: 'text-delta', text: 'Hello' },
        { type: 'text-delta', text: ' World' },
      ]);

      mockStreamText.mockReturnValueOnce(mockResult as any);

      const params = {
        model: mockModel,
        historyList: [],
        message: 'Hi',
      };

      const responses: StandardMessage[] = [];
      for await (const response of streamChatCompletion(params, {
        dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
      })) {
        responses.push(response);
      }

      expect(responses.length).toBeGreaterThan(0);
      expect(responses[0]).toMatchObject({
        role: ChatRoleEnum.ASSISTANT,
        modelKey: 'deepseek-chat',
      });
      expect(mockStreamText).toHaveBeenCalledTimes(1);
    });

    it('应该调用 buildMessages 并传递结果', async () => {
      const mockResult = createMockStreamResult([
        { type: 'text-delta', text: 'Response' },
      ]);

      mockStreamText.mockReturnValueOnce(mockResult as any);

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

      for await (const _ of streamChatCompletion(params, {
        dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
      })) {
        // 消费流
      }

      expect(mockStreamText).toHaveBeenCalledWith(
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
      const mockResult = createMockStreamResult([
        { type: 'text-delta', text: 'Response' },
      ]);

      mockStreamText.mockReturnValueOnce(mockResult as any);

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

      for await (const _ of streamChatCompletion(params, {
        dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
      })) {
        // 消费流
      }

      expect(mockStreamText).toHaveBeenCalledWith(
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
      const mockResult = createMockStreamResult([
        { type: 'text-delta', text: 'Response' },
      ]);

      mockStreamText.mockReturnValueOnce(mockResult as any);

      const conversationId = 'custom-conversation-id';
      const params = {
        model: mockModel,
        historyList: [],
        message: 'Hi',
        conversationId,
      };

      const responses: StandardMessage[] = [];
      for await (const response of streamChatCompletion(params, {
        dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
      })) {
        responses.push(response);
      }

      expect(responses[0].id).toBe(conversationId);
      expect(mockGenerateId).not.toHaveBeenCalled();
    });

    it('应该在没有传入 conversationId 时调用 generateId', async () => {
      const mockResult = createMockStreamResult([
        { type: 'text-delta', text: 'Response' },
      ]);

      mockStreamText.mockReturnValueOnce(mockResult as any);

      const params = {
        model: mockModel,
        historyList: [],
        message: 'Hi',
      };

      const responses: StandardMessage[] = [];
      for await (const response of streamChatCompletion(params, {
        dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
      })) {
        responses.push(response);
      }

      expect(responses[0].id).toBe('test-generated-id');
      expect(mockGenerateId).toHaveBeenCalled();
    });

    it('应该传递 AbortSignal', async () => {
      const mockResult = createMockStreamResult([
        { type: 'text-delta', text: 'Response' },
      ]);

      mockStreamText.mockReturnValueOnce(mockResult as any);

      const abortController = new AbortController();
      const params = {
        model: mockModel,
        historyList: [],
        message: 'Hi',
      };

      for await (const _ of streamChatCompletion(params, {
        dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        signal: abortController.signal,
      })) {
        // 消费流
      }

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({
          abortSignal: abortController.signal,
        })
      );
    });

    it('应该正确传播网络错误', async () => {
      const networkError = new Error('Network error');

      // 创建一个会在 then 方法中抛出错误的 mock 结果
      // 不使用 Promise.reject() 以避免触发 Vitest 的 unhandled rejection 检测
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockResult = {
        [Symbol.asyncIterator]: async function* () {
          yield { type: 'text-delta', text: '' };
        },
        /* eslint-disable unicorn/no-thenable */
        then: async (_: any, errorCallback?: any) => {
          // 调用错误回调（如果提供）
          if (errorCallback) {
            errorCallback(networkError);
          }
          // 返回 resolved Promise 而不是 rejected，避免触发 unhandled rejection
          return Promise.resolve();
        },
        fullStream: {
          [Symbol.asyncIterator]: async function* () {
            yield { type: 'text-delta', text: '' };
          },
        },
      } as any;

      mockStreamText.mockReturnValueOnce(mockResult);

      const params = {
        model: mockModel,
        historyList: [],
        message: 'Hi',
      };

      await expect(async () => {
        for await (const _ of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
          // 消费流
        }
      }).rejects.toThrow('Network error');
    });

    it('应该处理包含 reasoning-delta 的流', async () => {
      const mockResult = createMockStreamResult([
        { type: 'reasoning-delta', text: 'Thinking' },
        { type: 'text-delta', text: 'Response' },
      ]);

      mockStreamText.mockReturnValueOnce(mockResult as any);

      const params = {
        model: mockModel,
        historyList: [],
        message: 'Hi',
      };

      const responses: StandardMessage[] = [];
      for await (const response of streamChatCompletion(params, {
        dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
      })) {
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
      const mockResult = createMockStreamResult([
        { type: 'text-delta', text: 'Response' },
      ]);

      mockStreamText.mockReturnValueOnce(mockResult as any);

      const params = {
        model: mockModel,
        historyList: [],
        message: 'Hi',
      };

      const responses: StandardMessage[] = [];
      for await (const response of streamChatCompletion(params, {
        dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
      })) {
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
        const mockResult = createMockStreamResult([
          { type: 'text-delta', text: 'Response' },
        ]);

        mockStreamText.mockReturnValueOnce(mockResult as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
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
        const mockResult = createMockStreamResult([
          { type: 'text-delta', text: 'Response' },
        ]);

        // Mock response with sensitive headers
        const mockResultWithHeaders = {
          ...mockResult,
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

        mockStreamText.mockReturnValueOnce(mockResultWithHeaders as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
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
        const mockResult = createMockStreamResult([
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

        mockStreamText.mockReturnValueOnce(mockResultWithLargeBody as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
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
        const mockResult = createMockStreamResult([
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

        mockStreamText.mockReturnValueOnce(mockResultWithError as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
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
        const mockResult = createMockStreamResult([
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

        mockStreamText.mockReturnValueOnce(mockResultWithPartialError as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
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
        const mockResult = createMockStreamResult([
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

        mockStreamText.mockReturnValueOnce(mockResultWithMetadata as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
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
        const mockResult = createMockStreamResult([
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

        mockStreamText.mockReturnValueOnce(mockResultWithMetadata as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
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
        const mockResult = createMockStreamResult([
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

        mockStreamText.mockReturnValueOnce(mockResultWithMetadata as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
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
        const mockResult = createMockStreamResult([
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

        mockStreamText.mockReturnValueOnce(mockResultWithMetadata as any);

        const params = {
          model: { ...mockModel, providerKey: ModelProviderKeyEnum.MOONSHOTAI },
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
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
        const mockResult = createMockStreamResult([
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

        mockStreamText.mockReturnValueOnce(mockResultWithMetadata as any);

        const params = {
          model: { ...mockModel, providerKey: ModelProviderKeyEnum.ZHIPUAI },
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
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
        const mockResult = createMockStreamResult([
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

        mockStreamText.mockReturnValueOnce(mockResultWithSources as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Search for AI news',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
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
        const mockResult = createMockStreamResult([
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

        mockStreamText.mockReturnValueOnce(mockResultWithoutSources as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
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

    // ========================================
    // Phase 3: 边界条件测试增强
    // ========================================

    describe('边界条件测试 - AbortSignal 中断', () => {
      it('应该在流式响应开始后被 AbortSignal 中断', async () => {
        const { createMockAbortedStreamResult } = await import('@/__test__/helpers/mocks/aiSdk');
        
        const mockResult = createMockAbortedStreamResult(3);
        mockStreamText.mockReturnValueOnce(mockResult as any);

        const abortController = new AbortController();
        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        // 延迟 10ms 后触发中止
        setTimeout(() => abortController.abort(), 10);

        await expect(async () => {
          for await (const _ of streamChatCompletion(params, {
            dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
            signal: abortController.signal,
          })) {
            // 消费流直到被中断
          }
        }).rejects.toThrow();
      });

      it('应该在 AbortSignal 已经触发时立即拒绝', async () => {
        mockStreamText.mockImplementation(() => {
          throw new Error('The operation was aborted');
        });

        const abortController = new AbortController();
        abortController.abort();

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        await expect(async () => {
          for await (const _ of streamChatCompletion(params, {
            dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
            signal: abortController.signal,
          })) {
            // 消费流
          }
        }).rejects.toThrow();
      });
    });

    describe('边界条件测试 - 网络超时', () => {
      it('应该处理流式请求超时', async () => {
        const { createMockStreamTimeoutResult } = await import('@/__test__/helpers/mocks/aiSdk');
        
        const mockResult = createMockStreamTimeoutResult(2);
        mockStreamText.mockReturnValueOnce(mockResult as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        try {
          const responses: StandardMessage[] = [];
          for await (const response of streamChatCompletion(params, {
            dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
          })) {
            responses.push(response);
          }
          // 应该收到超时前产生的响应
          expect(responses.length).toBeGreaterThanOrEqual(2);
        } catch (error) {
          // 超时应该抛出错误
          expect(error).toBeDefined();
        }
      });

      it('应该在请求开始时超时', async () => {
        const { createMockTimeoutError } = await import('@/__test__/helpers/mocks/aiSdk');
        const timeoutError = createMockTimeoutError();

        // 创建一个会在 then 方法中抛出错误的 mock 结果
        // 不使用 Promise.reject() 以避免触发 Vitest 的 unhandled rejection 检测
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockResult = {
          [Symbol.asyncIterator]: async function* () {
            yield { type: 'text-delta', text: '' };
          },
          /* eslint-disable unicorn/no-thenable */
          then: async (_: any, errorCallback?: any) => {
            // 调用错误回调（如果提供）
            if (errorCallback) {
              errorCallback(timeoutError);
            }
            // 返回 resolved Promise 而不是 rejected，避免触发 unhandled rejection
            return Promise.resolve();
          },
          fullStream: {
            [Symbol.asyncIterator]: async function* () {
              yield { type: 'text-delta', text: '' };
            },
          },
        } as any;

        mockStreamText.mockReturnValueOnce(mockResult);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        await expect(async () => {
          for await (const _ of streamChatCompletion(params, {
            dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
          })) {
            // 消费流
          }
        }).rejects.toThrow('Request timeout');
      });
    });

    describe('边界条件测试 - API 错误码处理', () => {
      it.each([
        [400, 'Bad Request'],
        [401, 'Unauthorized'],
        [403, 'Forbidden'],
        [429, 'Too Many Requests'],
        [500, 'Internal Server Error'],
        [502, 'Bad Gateway'],
        [503, 'Service Unavailable'],
      ])('应该正确处理 HTTP %d 错误 (%s)', async (statusCode, errorMessage) => {
        const { createMockAPIError } = await import('@/__test__/helpers/mocks/aiSdk');
        const apiError = createMockAPIError(statusCode, errorMessage);

        // 创建一个会在 then 方法中抛出错误的 mock 结果
        // 不使用 Promise.reject() 以避免触发 Vitest 的 unhandled rejection 检测
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockResult = {
          [Symbol.asyncIterator]: async function* () {
            yield { type: 'text-delta', text: '' };
          },
          /* eslint-disable unicorn/no-thenable */
          then: async (_: any, errorCallback?: any) => {
            // 调用错误回调（如果提供）
            if (errorCallback) {
              errorCallback(apiError);
            }
            // 返回 resolved Promise 而不是 rejected，避免触发 unhandled rejection
            return Promise.resolve();
          },
          fullStream: {
            [Symbol.asyncIterator]: async function* () {
              yield { type: 'text-delta', text: '' };
            },
          },
        } as any;

        mockStreamText.mockReturnValueOnce(mockResult);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        await expect(async () => {
          for await (const _ of streamChatCompletion(params, {
            dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
          })) {
            // 消费流
          }
        }).rejects.toThrow(`API Error ${statusCode}: ${errorMessage}`);
      });

      it('应该处理无效的 JSON 响应', async () => {
        const error = new Error('Invalid JSON response');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).response = {
          status: 200,
          json: () => Promise.reject(new SyntaxError('Unexpected token')),
        };

        // 创建一个会在 then 方法中抛出错误的 mock 结果
        // 不使用 Promise.reject() 以避免触发 Vitest 的 unhandled rejection 检测
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockResult = {
          [Symbol.asyncIterator]: async function* () {
            yield { type: 'text-delta', text: '' };
          },
          /* eslint-disable unicorn/no-thenable */
          then: async (_: any, errorCallback?: any) => {
            // 调用错误回调（如果提供）
            if (errorCallback) {
              errorCallback(error);
            }
            // 返回 resolved Promise 而不是 rejected，避免触发 unhandled rejection
            return Promise.resolve();
          },
          fullStream: {
            [Symbol.asyncIterator]: async function* () {
              yield { type: 'text-delta', text: '' };
            },
          },
        } as any;

        mockStreamText.mockReturnValueOnce(mockResult);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        await expect(async () => {
          for await (const _ of streamChatCompletion(params, {
            dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
          })) {
            // 消费流
          }
        }).rejects.toThrow('Invalid JSON response');
      });

      it('应该处理网络连接失败', async () => {
        const { createMockAISDKNetworkError } = await import('@/__test__/helpers/mocks/aiSdk');
        const networkError = createMockAISDKNetworkError('Connection refused');

        // 创建一个会在 then 方法中抛出错误的 mock 结果
        // 不使用 Promise.reject() 以避免触发 Vitest 的 unhandled rejection 检测
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockResult = {
          [Symbol.asyncIterator]: async function* () {
            yield { type: 'text-delta', text: '' };
          },
          /* eslint-disable unicorn/no-thenable */
          then: async (_: any, errorCallback?: any) => {
            // 调用错误回调（如果提供）
            if (errorCallback) {
              errorCallback(networkError);
            }
            // 返回 resolved Promise 而不是 rejected，避免触发 unhandled rejection
            return Promise.resolve();
          },
          fullStream: {
            [Symbol.asyncIterator]: async function* () {
              yield { type: 'text-delta', text: '' };
            },
          },
        } as any;

        mockStreamText.mockReturnValueOnce(mockResult);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        await expect(async () => {
          for await (const _ of streamChatCompletion(params, {
            dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
          })) {
            // 消费流
          }
        }).rejects.toThrow('Connection refused');
      });
    });

    describe('边界条件测试 - 敏感信息过滤增强', () => {
      it('应该在响应头中过滤多个敏感字段', async () => {
        const mockResult = createMockStreamResult([
          { type: 'text-delta', text: 'Response' },
        ]);

        const mockResultWithHeaders = {
          ...mockResult,
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
                'authorization': 'Bearer secret-token-1',
                'Authorization': 'Bearer secret-token-2',
                'x-api-key': 'secret-key-1',
                'X-API-Key': 'secret-key-2',
                'x-request-id': 'req-123',
                'x-custom-header': 'custom-value',
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

        mockStreamText.mockReturnValueOnce(mockResultWithHeaders as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
          responses.push(response);
        }

        const lastResponse = responses[responses.length - 1];
        expect(lastResponse.raw).toBeDefined();
        expect(lastResponse.raw).not.toBeNull();
        if (lastResponse.raw) {
          // 验证所有敏感字段都被移除
          expect(lastResponse.raw.response.headers?.['authorization']).toBeUndefined();
          expect(lastResponse.raw.response.headers?.['Authorization']).toBeUndefined();
          expect(lastResponse.raw.response.headers?.['x-api-key']).toBeUndefined();
          expect(lastResponse.raw.response.headers?.['X-API-Key']).toBeUndefined();
          // 验证非敏感字段保留
          expect(lastResponse.raw.response.headers?.['content-type']).toBe('application/json');
          expect(lastResponse.raw.response.headers?.['x-request-id']).toBe('req-123');
          expect(lastResponse.raw.response.headers?.['x-custom-header']).toBe('custom-value');
        }
      });

      it('应该在请求体中过滤大小写混合的敏感字段', async () => {
        const mockResult = createMockStreamResult([
          { type: 'text-delta', text: 'Response' },
        ]);

        const requestBodyWithMixedCase = JSON.stringify({
          model: 'deepseek-chat',
          apiKey: 'secret-1',
          ApiKey: 'secret-2',
          api_key: 'secret-3',
          API_KEY: 'secret-4',
          authorization: 'Bearer secret-5',
          Authorization: 'Bearer secret-6',
          messages: [{ role: 'user', content: 'Hi' }],
        });

        const mockResultWithSensitiveBody = {
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
              body: requestBodyWithMixedCase,
            }),
            providerMetadata: Promise.resolve({}),
            warnings: Promise.resolve([]),
            sources: Promise.resolve([]),
            rawFinishReason: Promise.resolve('stop'),
          })),
        };

        mockStreamText.mockReturnValueOnce(mockResultWithSensitiveBody as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
          responses.push(response);
        }

        const lastResponse = responses[responses.length - 1];
        expect(lastResponse.raw).toBeDefined();
        expect(lastResponse.raw).not.toBeNull();
        if (lastResponse.raw) {
          const parsedBody = JSON.parse(lastResponse.raw.request.body);
          // 验证已知的敏感字段被移除
          expect(parsedBody.apiKey).toBeUndefined();
          expect(parsedBody.api_key).toBeUndefined();
          expect(parsedBody.authorization).toBeUndefined();
          expect(parsedBody.Authorization).toBeUndefined();
          // 验证非敏感字段保留
          expect(parsedBody.model).toBe('deepseek-chat');
          expect(parsedBody.messages).toBeDefined();
        }
      });

      it('应该在请求体恰好为 10KB 时不截断', async () => {
        const mockResult = createMockStreamResult([
          { type: 'text-delta', text: 'Response' },
        ]);

        // 计算一个内容，使得 JSON 序列化后恰好是 10KB
        const jsonStructureLength = '{"model":"deepseek-chat","content":""}'.length;
        const contentSize = 10240 - jsonStructureLength;
        const content = 'x'.repeat(contentSize);
        const requestBody = JSON.stringify({
          model: 'deepseek-chat',
          content,
        });

        const mockResultWithExact10KB = {
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
              body: requestBody,
            }),
            providerMetadata: Promise.resolve({}),
            warnings: Promise.resolve([]),
            sources: Promise.resolve([]),
            rawFinishReason: Promise.resolve('stop'),
          })),
        };

        mockStreamText.mockReturnValueOnce(mockResultWithExact10KB as any);

        const params = {
          model: mockModel,
          historyList: [],
          message: 'Hi',
        };

        const responses: StandardMessage[] = [];
        for await (const response of streamChatCompletion(params, {
          dependencies: { streamText: mockStreamText, generateId: mockGenerateId },
        })) {
          responses.push(response);
        }

        const lastResponse = responses[responses.length - 1];
        expect(lastResponse.raw).toBeDefined();
        expect(lastResponse.raw).not.toBeNull();
        if (lastResponse.raw) {
          // 恰好 10KB 时不应该被截断
          expect(lastResponse.raw.request.body).not.toContain('... (truncated)');
        }
      });
    });
  });
});

// ========================================
// 依赖注入示例测试
// ========================================
// 展示如何使用依赖注入来测试 streamChatCompletion
// 避免真实 HTTP 调用
describe('streamChatCompletion - 依赖注入示例', () => {
  const mockModel = {
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    modelKey: 'deepseek-chat',
    apiKey: 'sk-test',
    apiAddress: 'https://api.deepseek.com',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  it('示例：使用依赖注入测试流式请求', async () => {
    // 1. 创建 mock 函数
    const mockStreamText = vi.fn();
    const mockGenerateId = vi.fn(() => 'test-conversation-id');
    
    // 2. 配置 mock 返回值
    const mockResult = createMockStreamResult([
      { type: 'text-delta', text: 'Hello' },
      { type: 'text-delta', text: ' World' },
    ]);
    mockStreamText.mockReturnValueOnce(mockResult as any);

    // 3. 准备测试参数
    const params = {
      model: mockModel,
      historyList: [],
      message: 'Hi',
    };

    // 4. 调用 streamChatCompletion，传入依赖注入
    const responses: StandardMessage[] = [];
    for await (const response of streamChatCompletion(params, {
      dependencies: { streamText: mockStreamText, generateId: mockGenerateId }
    })) {
      responses.push(response);
    }

    // 5. 验证结果
    expect(responses.length).toBeGreaterThan(0);
    expect(responses[0]).toMatchObject({
      role: ChatRoleEnum.ASSISTANT,
      modelKey: 'deepseek-chat',
      id: 'test-conversation-id',
    });
    
    // 6. 验证 mock 被正确调用
    expect(mockStreamText).toHaveBeenCalledTimes(1);
    expect(mockGenerateId).toHaveBeenCalledTimes(1);
  });
});
