/**
 * MSW Handlers 单元测试
 * 验证 handlers 正确拦截请求并返回预期响应
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { server } from './setup';
import { deepSeekHandlers } from './handlers/deepseek';
import { kimiHandlers } from './handlers/kimi';
import { zhipuHandlers } from './handlers/zhipu';
import { modelsDevHandlers } from './handlers/models-dev';

describe('MSW Handlers', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('deepSeekHandlers', () => {
    it('应该成功返回流式响应', async () => {
      server.use(deepSeekHandlers.success());

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/event-stream');
    });

    it('应该返回网络错误', async () => {
      server.use(deepSeekHandlers.networkError());

      await expect(
        fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
        })
      ).rejects.toThrow();
    });

    it('应该返回超时错误', async () => {
      server.use(deepSeekHandlers.timeout({ delay: 100 }));

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
      });

      expect(response.status).toBe(408);
    });

    it('应该返回服务器错误', async () => {
      server.use(deepSeekHandlers.serverError({ status: 500, message: 'Internal Server Error' }));

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
      });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal Server Error');
    });
  });

  describe('kimiHandlers', () => {
    it('应该成功返回流式响应', async () => {
      server.use(kimiHandlers.success());

      const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/event-stream');
    });

    it('应该返回网络错误', async () => {
      server.use(kimiHandlers.networkError());

      await expect(
        fetch('https://api.moonshot.cn/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
        })
      ).rejects.toThrow();
    });
  });

  describe('zhipuHandlers', () => {
    it('应该成功返回流式响应', async () => {
      server.use(zhipuHandlers.success());

      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/event-stream');
    });

    it('应该返回网络错误', async () => {
      server.use(zhipuHandlers.networkError());

      await expect(
        fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
        })
      ).rejects.toThrow();
    });
  });

  describe('modelsDevHandlers', () => {
    it('应该成功返回供应商数据', async () => {
      server.use(modelsDevHandlers.success());

      const response = await fetch('https://models.dev/api.json');
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('providerKey');
      expect(data[0]).toHaveProperty('providerName');
      expect(data[0]).toHaveProperty('models');
    });

    it('应该返回网络错误', async () => {
      server.use(modelsDevHandlers.networkError());

      await expect(
        fetch('https://models.dev/api.json')
      ).rejects.toThrow();
    });

    it('应该返回超时错误', async () => {
      server.use(modelsDevHandlers.timeout({ delay: 100 }));

      const response = await fetch('https://models.dev/api.json');
      expect(response.status).toBe(408);
    });

    it('应该返回服务器错误', async () => {
      server.use(modelsDevHandlers.serverError({ status: 503, message: 'Service Unavailable' }));

      const response = await fetch('https://models.dev/api.json');
      expect(response.status).toBe(503);

      const data = await response.json();
      expect(data.error).toBe('Service Unavailable');
    });
  });
});
