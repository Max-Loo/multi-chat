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

/**
 * 创建带自定义元数据的模拟流式响应结果
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockStreamResultWithMetadata(options: {
  streamItems?: any[];
  finishReason?: string;
  usage?: { inputTokens: number; outputTokens: number; totalTokens?: number };
  response?: { id: string; modelId: string; timestamp: Date; headers?: Record<string, string> };
  request?: { body: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providerMetadata?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warnings?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sources?: any[];
} = {}) {
  const {
    streamItems = [],
    finishReason = 'stop',
    usage = { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
    response = {
      id: 'resp-123',
      modelId: 'deepseek-chat',
      timestamp: new Date('2024-01-01T00:00:00.000Z'),
      headers: { 'content-type': 'application/json', 'x-request-id': 'req-123' },
    },
    request = { body: '{"model":"deepseek-chat","messages":[]}' },
    providerMetadata = {},
    warnings = [],
    sources = [],
  } = options;

  async function* mockStream() {
    for (const item of streamItems) {
      yield item;
    }
  }

  return {
    // AsyncIterable 接口
    [Symbol.asyncIterator]: mockStream,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, unicorn/no-thenable
    then: (callback: (value: any) => any) => {
      return Promise.resolve({
        finishReason: Promise.resolve(finishReason),
        rawFinishReason: Promise.resolve(finishReason),
        usage: Promise.resolve(usage),
        response: Promise.resolve(response),
        request: Promise.resolve(request),
        providerMetadata: Promise.resolve(providerMetadata),
        warnings: Promise.resolve(warnings),
        sources: Promise.resolve(sources),
        toDataStreamResponse: () => new Response(),
        toTextStreamResponse: () => new Response(),
      }).then(callback);
    },
    fullStream: mockStream(),
  };
}

/**
 * 常用的流式事件类型
 */
export const StreamEventTypes = {
  textDelta: (text: string) => ({ type: 'text-delta', text }),
  reasoningDelta: (text: string) => ({ type: 'reasoning-delta', text }),
} as const;

/**
 * 创建模拟的网络错误
 * @param message 错误消息
 * @param statusCode HTTP 状态码
 * @returns 模拟的网络错误对象
 */
export function createMockAISDKNetworkError(
  message: string,
  statusCode?: number
): AIError {
  const error = new Error(message) as AIError;
  if (statusCode) {
    error.statusCode = statusCode;
    error.response = {
      status: statusCode,
      statusText: message,
    };
  }
  return error;
}

/**
 * 创建模拟的 API 错误响应
 * @param statusCode HTTP 状态码
 * @param errorMessage 错误消息
 * @returns 模拟的 API 错误对象
 */
export function createMockAPIError(
  statusCode: number,
  errorMessage: string
): AIError {
  const error = new Error(`API Error ${statusCode}: ${errorMessage}`) as AIError;
  error.statusCode = statusCode;
  error.response = {
    status: statusCode,
    statusText: errorMessage,
    json: () =>
      Promise.resolve({
        error: {
          message: errorMessage,
          type: 'api_error',
          code: statusCode.toString(),
        },
      }),
  };
  return error;
}

/**
 * 创建模拟的超时错误
 * @returns 模拟的超时错误对象
 */
export function createMockTimeoutError(): AIError {
  const error = new Error('Request timeout') as AIError;
  error.name = 'TimeoutError';
  error.code = 'ETIMEDOUT';
  return error;
}

/**
 * 创建模拟的 AbortSignal 中断错误
 * @returns 模拟的中断错误对象
 */
export function createMockAbortError(): Error {
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  return error;
}

/**
 * 创建在中途被中断的流式响应
 * @param itemsBeforeAbort 中断前产生的项目数
 * @returns 模拟的流式结果
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockAbortedStreamResult(itemsBeforeAbort: number) {
  const abortError = createMockAbortError();

  async function* mockStream() {
    for (let i = 0; i < itemsBeforeAbort; i++) {
      yield { type: 'text-delta', text: `Chunk ${i + 1}` };
    }
    throw abortError;
  }

  return {
    [Symbol.asyncIterator]: mockStream,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, unicorn/no-thenable
    then: (callback: (value: any) => any) => {
      return Promise.resolve({
        finishReason: Promise.resolve('error'),
        rawFinishReason: Promise.resolve('error'),
        usage: Promise.resolve({ inputTokens: 10, outputTokens: itemsBeforeAbort }),
        response: Promise.resolve({
          id: 'resp-aborted',
          modelId: 'deepseek-chat',
          timestamp: new Date('2024-01-01T00:00:00.000Z'),
          headers: {},
        }),
        request: Promise.resolve({
          body: '{"model":"deepseek-chat","messages":[]}',
        }),
        providerMetadata: Promise.resolve({}),
        warnings: Promise.resolve([]),
        sources: Promise.resolve([]),
        toDataStreamResponse: () => new Response(),
        toTextStreamResponse: () => new Response(),
      }).then(callback);
    },
    fullStream: mockStream(),
  };
}

/**
 * 创建模拟的超时流式响应（在流中间超时）
 * @param itemsBeforeTimeout 超时前产生的项目数
 * @returns 模拟的流式结果
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockStreamTimeoutResult(itemsBeforeTimeout: number) {
  const timeoutError = createMockTimeoutError();

  async function* mockStream() {
    for (let i = 0; i < itemsBeforeTimeout; i++) {
      yield { type: 'text-delta', text: `Chunk ${i + 1}` };
    }
    throw timeoutError;
  }

  return {
    [Symbol.asyncIterator]: mockStream,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, unicorn/no-thenable
    then: (callback: (value: any) => any) => {
      return Promise.resolve({
        finishReason: Promise.resolve('error'),
        rawFinishReason: Promise.resolve('error'),
        usage: Promise.resolve({ inputTokens: 10, outputTokens: itemsBeforeTimeout }),
        response: Promise.resolve({
          id: 'resp-timeout',
          modelId: 'deepseek-chat',
          timestamp: new Date('2024-01-01T00:00:00.000Z'),
          headers: {},
        }),
        request: Promise.resolve({
          body: '{"model":"deepseek-chat","messages":[]}',
        }),
        providerMetadata: Promise.resolve({}),
        warnings: Promise.resolve([]),
        sources: Promise.resolve([]),
        toDataStreamResponse: () => new Response(),
        toTextStreamResponse: () => new Response(),
      }).then(callback);
    },
    fullStream: mockStream(),
  };
}
