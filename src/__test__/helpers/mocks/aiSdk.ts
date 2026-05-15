/**
 * Vercel AI SDK Mock 辅助函数
 *
 * 提供创建模拟 streamText 返回值和 AI SDK provider mock 的工具函数
 */

import { vi } from 'vitest';

/**
 * 创建模拟的 streamText 返回值
 *
 * 返回对象同时实现 AsyncIterable 和 Thenable 接口，可配合 `for await...of` 消费流，
 * 也可通过 `await result` 获取元数据（finishReason、usage、response 等）。
 *
 * @param streamItems - 流式事件数组，如 `[{ type: 'text-delta', text: 'Hello' }]`
 * @param options - 可选配置
 * @param options.streamError - 在流中抛出的错误，传入后 `await result` 会 reject
 * @returns 模拟的 streamText 返回对象
 *
 * @example
 * ```typescript
 * // 基本使用：模拟流式文本响应
 * const mockResult = createMockStreamResult([
 *   { type: 'text-delta', text: 'Hello' },
 *   { type: 'text-delta', text: ' World' },
 * ]);
 * mockStreamText.mockReturnValueOnce(mockResult as any);
 *
 * // 消费流
 * for await (const event of mockResult.fullStream) {
 *   console.log(event);
 * }
 *
 * // 获取元数据
 * const metadata = await mockResult;
 * expect(metadata.finishReason).resolves.toBe('stop');
 * ```
 *
 * @example
 * ```typescript
 * // 模拟流中途出错
 * const errorResult = createMockStreamResult(
 *   [{ type: 'text-delta', text: 'partial' }],
 *   { streamError: new Error('Stream aborted') }
 * );
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockStreamResult(
  streamItems: any[] = [],
  options?: { streamError?: Error }
) {
  // 创建异步生成器（模拟 fullStream）
  async function* mockStream() {
    // 先产生一些输出，避免 SDK 抛出 "No output generated" 错误
    if (streamItems.length === 0 && options?.streamError) {
      // 如果没有输出但有错误，先产生一个空的 text-delta
      yield { type: 'text-delta', text: '' };
    }
    for (const item of streamItems) {
      yield item;
    }
  }

  // 返回的对象需要同时满足：
  // 1. 是 AsyncIterable（有 Symbol.asyncIterator）
  // 2. 是 Thenable（有 then 方法）
  return {
    // AsyncIterable 接口
    [Symbol.asyncIterator]: mockStream,

    // Thenable 接口 - 用于 await 获取元数据
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, unicorn/no-thenable
    then: (callback: (value: any) => any, errorCallback?: (reason: any) => any) => {
      // 如果提供了 streamError，返回 rejected Promise
      if (options?.streamError) {
        return Promise.reject(options.streamError);
      }

      return Promise.resolve({
        finishReason: Promise.resolve('stop'),
        rawFinishReason: Promise.resolve('stop'),
        usage: Promise.resolve({
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15,
        }),
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
        // 其他可能的方法
        toDataStreamResponse: () => new Response(),
        toTextStreamResponse: () => new Response(),
      }).then(callback, errorCallback);
    },

    // fullStream 属性 - 用于 for await...of 消费
    // 必须是一个具有 Symbol.asyncIterator 方法的对象
    fullStream: {
      [Symbol.asyncIterator]: mockStream,
    },
  };
}

/**
 * 创建 AI SDK provider mock 对象
 *
 * 返回一个 `vi.fn()`，调用时生成带有标准 AI SDK LanguageModel 属性的 mock 对象。
 * 统一 deepseek/moonshotai/zhipu 等多种 provider 的 mock 逻辑。
 *
 * @param providerName - provider 标识名称（如 `'deepseek'`、`'moonshotai'`、`'zhipu'`）
 * @returns `vi.fn()` 工厂，接收 modelId 返回 mock LanguageModel 对象
 *
 * @example
 * ```typescript
 * const mockDeepSeek = createMockAIProvider('deepseek');
 * const model = mockDeepSeek('deepseek-chat');
 * // model = { provider: 'deepseek', modelId: 'deepseek-chat', doStream: vi.fn(), ... }
 *
 * // 配合 provider factory 使用
 * vi.mocked(createDeepSeek).mockImplementation(() => mockDeepSeek);
 * ```
 */
export function createMockAIProvider(providerName: string) {
  return vi.fn((modelId: string) => ({
    provider: providerName as typeof providerName,
    modelId,
    specificationVersion: 'v1' as const,
    supportsImageUrls: false,
    supportsUrl: false,
    supportsToolCallStreaming: false,
    supportsToolCalls: false,
    supportsStructuredGeneration: false,
    supportsObjectGeneration: false,
    defaultTemperature: 0.7,
    defaultMaxTokens: 4096,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doStream: vi.fn().mockResolvedValue({ stream: [] as any }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doGenerate: vi.fn().mockResolvedValue({
      text: 'mock generated text',
      usage: { promptTokens: 10, completionTokens: 5 },
      finishReason: 'stop',
      warnings: [],
    }),
  }));
}
