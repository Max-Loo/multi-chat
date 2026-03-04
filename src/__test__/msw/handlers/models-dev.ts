/**
 * models.dev API MSW Handlers
 * 模拟 models.dev API 的各种响应场景
 */

import { http, HttpResponse, delay } from 'msw';
import type { ApiHandlerFactory } from '../types';

/**
 * 模拟的供应商数据
 */
const mockProviders = [
  {
    providerKey: 'deepseek',
    providerName: 'DeepSeek',
    api: 'https://api.deepseek.com/v1',
    models: [
      { modelKey: 'deepseek-chat', modelName: 'DeepSeek Chat' },
      { modelKey: 'deepseek-coder', modelName: 'DeepSeek Coder' },
    ],
  },
  {
    providerKey: 'kimi',
    providerName: 'Moonshot AI',
    api: 'https://api.moonshot.cn/v1',
    models: [
      { modelKey: 'moonshot-v1-8k', modelName: 'Moonshot V1 8K' },
      { modelKey: 'moonshot-v1-32k', modelName: 'Moonshot V1 32K' },
    ],
  },
  {
    providerKey: 'zhipu',
    providerName: 'ZhipuAI',
    api: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { modelKey: 'glm-4', modelName: 'GLM-4' },
      { modelKey: 'glm-4-flash', modelName: 'GLM-4 Flash' },
    ],
  },
];

export const modelsDevHandlers: ApiHandlerFactory = {
  /**
   * 成功场景：返回完整的供应商数据
   * @example
   * server.use(modelsDevHandlers.success());
   * server.use(modelsDevHandlers.success({ delay: 1000 }));
   */
  success: (options?: { delay?: number }) =>
    http.get('https://models.dev/api.json', async () => {
      const { delay: responseDelay = 0 } = options ?? {};

      if (responseDelay > 0) {
        await delay(responseDelay);
      }

      return HttpResponse.json(mockProviders, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
    }),

  /**
   * 网络错误场景：模拟网络连接失败
   * @example
   * server.use(modelsDevHandlers.networkError());
   */
  networkError: () =>
    http.get('https://models.dev/api.json', () => {
      return HttpResponse.error();
    }),

  /**
   * 超时场景：模拟 API 请求超时
   * @example
   * server.use(modelsDevHandlers.timeout({ delay: 30000 }));
   */
  timeout: (options: { delay: number } = { delay: 30000 }) =>
    http.get('https://models.dev/api.json', async () => {
      await delay(options.delay);
      return HttpResponse.json({ error: 'Request timeout' }, { status: 408 });
    }),

  /**
   * 服务器错误场景：模拟 5xx 错误
   * @example
   * server.use(modelsDevHandlers.serverError({ status: 500, message: 'Internal Server Error' }));
   */
  serverError: (
    options: { status: number; message: string } = {
      status: 500,
      message: 'Internal Server Error',
    }
  ) =>
    http.get('https://models.dev/api.json', () => {
      return HttpResponse.json({ error: options.message }, {
        status: options.status,
      });
    }),
};

// 导出 handlers 数组（方便 setupServer 使用）
export const modelsDevHandlersList = [modelsDevHandlers.success()];
