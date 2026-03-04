/**
 * DeepSeek API MSW Handlers
 * 模拟 DeepSeek API 的各种响应场景
 */

import { http, HttpResponse, delay } from 'msw';
import type { StreamOptions, ApiHandlerFactory } from '../types';

/**
 * 创建默认流式响应
 * @param text 响应文本
 * @returns ReadableStream
 */
const createDefaultStream = (text: string): ReadableStream => {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      // 模拟逐字返回
      const words = text.split('');
      for (const word of words) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'text-delta', text: word })}\n\n`
          )
        );
        await delay(10); // 模拟网络延迟
      }
      controller.close();
    },
  });
};

export const deepSeekHandlers: ApiHandlerFactory = {
  /**
   * 成功场景：返回流式响应
   * @example
   * server.use(deepSeekHandlers.success({ response: customStream }));
   * server.use(deepSeekHandlers.success({ delay: 1000 }));
   */
  success: (options: StreamOptions = {}) =>
    http.post('https://api.deepseek.com/v1/chat/completions', async () => {
      const { response, delay: responseDelay = 0 } = options;

      if (responseDelay > 0) {
        await delay(responseDelay);
      }

      const stream = response ?? createDefaultStream('你好！我是 DeepSeek。');

      return new HttpResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });
    }),

  /**
   * 网络错误场景：模拟网络连接失败
   * @example
   * server.use(deepSeekHandlers.networkError());
   */
  networkError: () =>
    http.post('https://api.deepseek.com/v1/chat/completions', () => {
      return HttpResponse.error();
    }),

  /**
   * 超时场景：模拟 API 请求超时
   * @example
   * server.use(deepSeekHandlers.timeout({ delay: 30000 }));
   */
  timeout: (options: { delay: number } = { delay: 30000 }) =>
    http.post('https://api.deepseek.com/v1/chat/completions', async () => {
      await delay(options.delay);
      return HttpResponse.json({ error: 'Request timeout' }, { status: 408 });
    }),

  /**
   * 服务器错误场景：模拟 5xx 错误
   * @example
   * server.use(deepSeekHandlers.serverError({ status: 500, message: 'Internal Server Error' }));
   */
  serverError: (
    options: { status: number; message: string } = {
      status: 500,
      message: 'Internal Server Error',
    }
  ) =>
    http.post('https://api.deepseek.com/v1/chat/completions', () => {
      return HttpResponse.json({ error: options.message }, {
        status: options.status,
      });
    }),
};

// 导出 handlers 数组（方便 setupServer 使用）
export const deepSeekHandlersList = [deepSeekHandlers.success()];
