/**
 * Vercel AI SDK Mock 辅助函数
 *
 * 提供创建模拟 streamText 返回值的工具函数
 */

/**
 * AI SDK 错误类型，扩展 Error 添加网络请求相关属性
 * 替代运行时通过 as any 给 Error 注入额外属性的模式
 */
export interface AIError extends Error {
  statusCode?: number;
  response?: {
    status: number;
    statusText: string;
    json?: () => Promise<unknown>;
  };
  code?: string;
}

/**
 * 创建模拟的流式响应结果
 *
 * streamText 返回的对象结构：
 * - fullStream: AsyncIterable (用于 for await...of 消费流)
 * - 元数据字段: Promise (finishReason, usage, response, request 等)
 *
 * 注意：返回的对象既是 AsyncIterable 又是 Thenable
 *
 * @param streamItems 流式事件数组
 * @param options 可选配置项
 * @param options.streamError 在流中抛出的错误（如果提供）
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
