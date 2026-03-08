import { describe, it, expect } from 'vitest';
import {
  collectAllMetadata,
  collectProviderMetadata,
  collectWarnings,
  collectSources,
  collectResponseMetadata,
  collectRequestMetadata,
  collectUsageMetadata,
  collectFinishReasonMetadata,
  collectStreamStats,
} from '@/services/chat/metadataCollector';
import { MetadataCollectionError } from '@/services/chat/types';

// 创建 mock StreamResultMetadata
function createMockMetadata(overrides?: Partial<StreamResultMetadata>): StreamResultMetadata {
  return {
    providerMetadata: Promise.resolve({ deepseek: { model: 'deepseek-chat' } }),
    warnings: Promise.resolve([]),
    sources: Promise.resolve([]),
    response: {
      id: 'test-id',
      modelId: 'deepseek-chat',
      timestamp: new Date('2024-01-01T00:00:00Z'),
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer secret', // 应该被过滤
      },
    },
    request: {
      body: JSON.stringify({ apiKey: 'secret', message: 'Hello' }),
    },
    usage: {
      inputTokens: 10,
      outputTokens: 20,
      totalTokens: 30,
    },
    finishReason: Promise.resolve('stop'),
    rawFinishReason: Promise.resolve('stop'),
    ...overrides,
  };
}

type StreamResultMetadata = {
  providerMetadata: Promise<Record<string, Record<string, unknown>>>;
  warnings: Promise<Array<unknown>>;
  sources: Promise<Array<unknown>>;
  response: { id: string; modelId: string; timestamp: Date; headers?: Record<string, unknown> };
  request: { body: unknown };
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number; inputTokenDetails?: object; outputTokenDetails?: object; raw?: object };
  finishReason?: Promise<string | null>;
  rawFinishReason?: Promise<string | null>;
};

describe('metadataCollector', () => {
  describe('collectProviderMetadata', () => {
    it('应该正常收集 provider metadata', async () => {
      const metadata = createMockMetadata({
        providerMetadata: Promise.resolve({ deepseek: { model: 'deepseek-chat' } }),
      });
      const result = await collectProviderMetadata(metadata);
      expect(result).toEqual({ deepseek: { model: 'deepseek-chat' } });
    });

    it('应该在收集失败时抛出 MetadataCollectionError', async () => {
      const metadata = createMockMetadata({
        providerMetadata: Promise.reject(new Error('Network error')),
      });
      await expect(collectProviderMetadata(metadata)).rejects.toThrow(MetadataCollectionError);
      await expect(collectProviderMetadata(metadata)).rejects.toThrow('Failed to collect providerMetadata');
    });
  });

  describe('collectWarnings', () => {
    it('应该正常收集 warnings', async () => {
      const mockWarnings = [
        { code: 'deprecated', message: 'This feature is deprecated' },
        { type: 'warning', feature: 'streaming', details: 'Use with caution' },
      ];
      const metadata = createMockMetadata({
        warnings: Promise.resolve(mockWarnings),
      });
      const result = await collectWarnings(metadata);
      expect(result).toEqual([
        { code: 'deprecated', message: 'This feature is deprecated' },
        { code: 'warning', message: 'warning: streaming (Use with caution)' },
      ]);
    });

    it('应该处理空 warnings', async () => {
      const metadata = createMockMetadata({
        warnings: Promise.resolve([]),
      });
      const result = await collectWarnings(metadata);
      expect(result).toEqual([]);
    });

    it('应该在收集失败时抛出 MetadataCollectionError', async () => {
      const metadata = createMockMetadata({
        warnings: Promise.reject(new Error('Collection error')),
      });
      await expect(collectWarnings(metadata)).rejects.toThrow(MetadataCollectionError);
    });
  });

  describe('collectSources', () => {
    it('应该正常收集 sources（仅 url 类型）', async () => {
      const mockSources = [
        { sourceType: 'url', id: '1', url: 'https://example.com', title: 'Example' },
        { sourceType: 'file', id: '2', url: 'file:///path' }, // 应该被过滤
      ];
      const metadata = createMockMetadata({
        sources: Promise.resolve(mockSources),
      });
      const result = await collectSources(metadata);
      expect(result).toEqual([
        { sourceType: 'url', id: '1', url: 'https://example.com', title: 'Example' },
      ]);
    });

    it('应该将空数组转换为 undefined', async () => {
      const metadata = createMockMetadata({
        sources: Promise.resolve([]),
      });
      const result = await collectSources(metadata);
      expect(result).toBeUndefined();
    });

    it('应该在收集失败时抛出 MetadataCollectionError', async () => {
      const metadata = createMockMetadata({
        sources: Promise.reject(new Error('Collection error')),
      });
      await expect(collectSources(metadata)).rejects.toThrow(MetadataCollectionError);
    });
  });

  describe('collectResponseMetadata', () => {
    it('应该收集响应元数据并过滤敏感 headers', () => {
      const metadata = createMockMetadata({
        response: {
          id: 'test-id',
          modelId: 'deepseek-chat',
          timestamp: new Date('2024-01-01T00:00:00Z'),
          headers: {
            'content-type': 'application/json',
            'authorization': 'Bearer secret', // 应该被过滤
            'x-api-key': 'secret-key', // 应该被过滤
            'x-rate-limit': '100',
          },
        },
      });
      const result = collectResponseMetadata(metadata);
      expect(result).toEqual({
        id: 'test-id',
        modelId: 'deepseek-chat',
        timestamp: '2024-01-01T00:00:00.000Z',
        headers: {
          'content-type': 'application/json',
          'x-rate-limit': '100',
        },
      });
    });

    it('应该处理无 headers 的情况', () => {
      const metadata = createMockMetadata({
        response: {
          id: 'test-id',
          modelId: 'deepseek-chat',
          timestamp: new Date('2024-01-01T00:00:00Z'),
        },
      });
      const result = collectResponseMetadata(metadata);
      expect(result.headers).toBeUndefined();
    });
  });

  describe('collectRequestMetadata', () => {
    it('应该收集请求元数据并脱敏敏感字段', () => {
      const metadata = createMockMetadata({
        request: {
          body: JSON.stringify({
            apiKey: 'secret-key',
            api_key: 'another-secret',
            message: 'Hello',
            authorization: 'Bearer token',
            Authorization: 'Bearer token2',
          }),
        },
      });
      const result = collectRequestMetadata(metadata);
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody).toEqual({
        message: 'Hello',
      });
      expect(parsedBody.apiKey).toBeUndefined();
      expect(parsedBody.api_key).toBeUndefined();
      expect(parsedBody.authorization).toBeUndefined();
      expect(parsedBody.Authorization).toBeUndefined();
    });

    it('应该截断过大的请求体（>10KB）', () => {
      const largeBody = 'x'.repeat(10241); // > 10KB
      const metadata = createMockMetadata({
        request: { body: largeBody },
      });
      const result = collectRequestMetadata(metadata);
      expect(result.body.length).toBe(10240 + '... (truncated)'.length);
      expect(result.body).toContain('... (truncated)');
    });

    it('应该处理非 JSON 请求体', () => {
      const metadata = createMockMetadata({
        request: { body: 'plain text body' },
      });
      const result = collectRequestMetadata(metadata);
      expect(result.body).toBe('plain text body');
    });
  });

  describe('collectUsageMetadata', () => {
    it('应该收集 usage 元数据', () => {
      const metadata = createMockMetadata({
        usage: {
          inputTokens: 100,
          outputTokens: 200,
          totalTokens: 300,
          inputTokenDetails: { cacheReadTokens: 10 },
          outputTokenDetails: { reasoningTokens: 20 },
          raw: { promptTokens: 100 },
        },
      });
      const result = collectUsageMetadata(metadata);
      expect(result).toEqual({
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        inputTokenDetails: { cacheReadTokens: 10 },
        outputTokenDetails: { reasoningTokens: 20 },
        raw: { promptTokens: 100 },
      });
    });

    it('应该处理 undefined usage', () => {
      const metadata = createMockMetadata({
        usage: undefined,
      });
      const result = collectUsageMetadata(metadata);
      expect(result).toEqual({
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        inputTokenDetails: undefined,
        outputTokenDetails: undefined,
        raw: undefined,
      });
    });
  });

  describe('collectFinishReasonMetadata', () => {
    it('应该收集完成原因元数据', async () => {
      const metadata = createMockMetadata({
        finishReason: Promise.resolve('stop'),
        rawFinishReason: Promise.resolve('stop'),
      });
      const result = await collectFinishReasonMetadata(metadata);
      expect(result).toEqual({
        reason: 'stop',
        rawReason: 'stop',
      });
    });

    it('应该将 null finishReason 转换为 other', async () => {
      const metadata = createMockMetadata({
        finishReason: Promise.resolve(null),
        rawFinishReason: Promise.resolve(null),
      });
      const result = await collectFinishReasonMetadata(metadata);
      expect(result).toEqual({
        reason: 'other',
        rawReason: undefined,
      });
    });

    it('应该处理 undefined finishReason', async () => {
      const metadata = createMockMetadata({
        finishReason: undefined,
        rawFinishReason: undefined,
      });
      const result = await collectFinishReasonMetadata(metadata);
      expect(result).toEqual({
        reason: 'other',
        rawReason: undefined,
      });
    });
  });

  describe('collectStreamStats', () => {
    it('应该返回默认流式统计值', () => {
      const metadata = createMockMetadata();
      const result = collectStreamStats(metadata);
      expect(result).toEqual({
        textDeltaCount: 0,
        reasoningDeltaCount: 0,
        duration: 0,
      });
    });
  });

  describe('collectAllMetadata', () => {
    it('应该并行收集所有元数据', async () => {
      const metadata = createMockMetadata({
        providerMetadata: Promise.resolve({ deepseek: { model: 'deepseek-chat' } }),
        warnings: Promise.resolve([{ code: 'test', message: 'Test warning' }]),
        sources: Promise.resolve([{ sourceType: 'url', id: '1', url: 'https://example.com' }]),
      });

      // 创建 mock StreamResult
      const mockStreamResult = Promise.resolve(metadata) as any;
      mockStreamResult[Symbol.asyncIterator] = async function* () {};

      const result = await collectAllMetadata(mockStreamResult);

      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('request');
      expect(result).toHaveProperty('usage');
      expect(result).toHaveProperty('finishReason');
      expect(result).toHaveProperty('providerMetadata', { deepseek: { model: 'deepseek-chat' } });
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('sources');
      expect(result).toHaveProperty('streamStats');
    });

    it('应该在任一异步元数据收集失败时抛出错误', async () => {
      const metadata = createMockMetadata({
        providerMetadata: Promise.reject(new Error('Provider error')),
      });

      const mockStreamResult = Promise.resolve(metadata) as any;
      mockStreamResult[Symbol.asyncIterator] = async function* () {};

      await expect(collectAllMetadata(mockStreamResult)).rejects.toThrow(MetadataCollectionError);
    });
  });
});
