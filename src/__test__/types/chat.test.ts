/**
 * chat 类型单元测试
 *
 * 测试策略：
 * - 测试类型守卫函数 `isEnhancedRawResponse()`
 * - 测试格式化函数 `formatRawResponse()`
 * - 测试 `StandardMessageRawResponse` 类型定义
 */

import { describe, it, expect } from 'vitest';
import { isEnhancedRawResponse, formatRawResponse } from '@/types/chat';
import type { StandardMessageRawResponse } from '@/types/chat';

describe('chat types', () => {
  describe('isEnhancedRawResponse', () => {
    it('应该返回 true 对于有效的增强原始响应对象', () => {
      const validRaw: StandardMessageRawResponse = {
        response: {
          id: 'resp-123',
          modelId: 'deepseek-chat',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
        request: {
          body: '{}',
        },
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15,
        },
        finishReason: {
          reason: 'stop',
        },
      };

      expect(isEnhancedRawResponse(validRaw)).toBe(true);
    });

    it('应该返回 false 对于 null', () => {
      expect(isEnhancedRawResponse(null)).toBe(false);
    });

    it('应该返回 false 对于 undefined', () => {
      expect(isEnhancedRawResponse(undefined)).toBe(false);
    });

    it('应该返回 false 对于空字符串', () => {
      expect(isEnhancedRawResponse('')).toBe(false);
    });

    it('应该返回 false 对于缺少 response 字段的对象', () => {
      const invalidRaw = {
        request: { body: '{}' },
        usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
        finishReason: { reason: 'stop' },
      };

      expect(isEnhancedRawResponse(invalidRaw)).toBe(false);
    });

    it('应该正确进行类型推断（TypeScript 类型守卫）', () => {
      const raw = {
        response: {
          id: 'resp-123',
          modelId: 'deepseek-chat',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
        request: {
          body: '{}',
        },
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15,
        },
        finishReason: {
          reason: 'stop',
        },
      };

      if (isEnhancedRawResponse(raw)) {
        // TypeScript 应该将 raw 推断为 StandardMessageRawResponse
        expect(raw.response.id).toBe('resp-123');
        expect(raw.usage.inputTokens).toBe(10);
      } else {
        // 这个分支不应该被执行
        expect(true).toBe(false);
      }
    });
  });

  describe('formatRawResponse', () => {
    it('应该返回"无原始数据"对于 null', () => {
      expect(formatRawResponse(null)).toBe('无原始数据');
    });

    it('应该返回"无原始数据"对于 undefined', () => {
      expect(formatRawResponse(undefined)).toBe('无原始数据');
    });

    it('应该返回格式化的 JSON 字符串对于有效的原始响应', () => {
      const raw: StandardMessageRawResponse = {
        response: {
          id: 'resp-123',
          modelId: 'deepseek-chat',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
        request: {
          body: '{"model":"deepseek-chat"}',
        },
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15,
        },
        finishReason: {
          reason: 'stop',
        },
      };

      const formatted = formatRawResponse(raw);
      expect(formatted).toContain('"id": "resp-123"');
      expect(formatted).toContain('"modelId": "deepseek-chat"');
      expect(formatted).toContain('"inputTokens": 10');
      expect(formatted).toContain('"outputTokens": 5');
    });

    it('应该使用 2 个空格缩进格式化 JSON', () => {
      const raw: StandardMessageRawResponse = {
        response: {
          id: 'resp-123',
          modelId: 'deepseek-chat',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
        request: {
          body: '{}',
        },
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15,
        },
        finishReason: {
          reason: 'stop',
        },
      };

      const formatted = formatRawResponse(raw);
      // 验证包含缩进（2 个空格）
      expect(formatted).toContain('  ');
    });

    it('应该处理包含可选字段的原始响应', () => {
      const rawWithOptional: StandardMessageRawResponse = {
        response: {
          id: 'resp-123',
          modelId: 'deepseek-chat',
          timestamp: '2024-01-01T00:00:00.000Z',
          headers: { 'content-type': 'application/json' },
        },
        request: {
          body: '{}',
        },
        usage: {
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15,
          inputTokenDetails: { cacheReadTokens: 5 },
          outputTokenDetails: { reasoningTokens: 3 },
        },
        finishReason: {
          reason: 'stop',
          rawReason: 'stop',
        },
        providerMetadata: {
          deepseek: { version: '2024-01-01' },
        },
        warnings: [{ code: 'deprecated', message: 'Model is deprecated' }],
        streamStats: {
          textDeltaCount: 5,
          reasoningDeltaCount: 2,
          duration: 1500,
        },
        sources: [
          {
            sourceType: 'url',
            id: 'src-1',
            url: 'https://example.com',
            title: 'Example',
          },
        ],
      };

      const formatted = formatRawResponse(rawWithOptional);
      expect(formatted).toContain('"headers"');
      expect(formatted).toContain('"inputTokenDetails"');
      expect(formatted).toContain('"providerMetadata"');
      expect(formatted).toContain('"warnings"');
      expect(formatted).toContain('"streamStats"');
      expect(formatted).toContain('"sources"');
    });
  });
});
