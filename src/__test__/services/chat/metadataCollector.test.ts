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

    // Task 7.1: warning 有 code 和 message
    it('应该提取有 code 和 message 的 warning', async () => {
      const metadata = createMockMetadata({
        warnings: Promise.resolve([
          { code: 'rate_limit', message: 'Too many requests' },
        ]),
      });
      const result = await collectWarnings(metadata);
      expect(result).toEqual([
        { code: 'rate_limit', message: 'Too many requests' },
      ]);
    });

    // Task 7.2: warning 无 code 但有 type
    it('应该在无 code 时使用 type 作为 code', async () => {
      const metadata = createMockMetadata({
        warnings: Promise.resolve([
          { type: 'safety', feature: 'streaming', details: 'flagged' },
        ]),
      });
      const result = await collectWarnings(metadata);
      expect(result[0].code).toBe('safety');
    });

    // Task 7.3: warning 无 message 需拼接
    it('应该在无 message 时拼接 type: feature (details)', async () => {
      const metadata = createMockMetadata({
        warnings: Promise.resolve([
          { type: 'safety', feature: 'streaming', details: 'flagged' },
        ]),
      });
      const result = await collectWarnings(metadata);
      expect(result[0].message).toBe('safety: streaming (flagged)');
    });

    // Task 7.3 补充: warning 无 message 且无 details
    it('应该在无 message 且无 details 时拼接 type: feature', async () => {
      const metadata = createMockMetadata({
        warnings: Promise.resolve([
          { type: 'warning', feature: 'streaming' },
        ]),
      });
      const result = await collectWarnings(metadata);
      expect(result[0].message).toBe('warning: streaming');
    });

    // Task 7.4: warnings 为空/undefined 时返回空数组
    it('应该在 warnings 为 undefined 时返回空数组', async () => {
      const metadata = createMockMetadata({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        warnings: Promise.resolve(undefined as any),
      });
      const result = await collectWarnings(metadata);
      expect(result).toEqual([]);
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

    // Task 6.1: 仅保留 url 类型来源
    it('应该仅保留 sourceType 为 url 的来源', async () => {
      const mockSources = [
        { sourceType: 'url', id: '1', url: 'https://example.com' },
        { sourceType: 'file', id: '2', url: 'file:///path' },
        { sourceType: 'url', id: '3', url: 'https://other.com', title: 'Other' },
      ];
      const metadata = createMockMetadata({
        sources: Promise.resolve(mockSources),
      });
      const result = await collectSources(metadata);
      expect(result).toHaveLength(2);
      expect(result?.[0].sourceType).toBe('url');
      expect(result?.[1].sourceType).toBe('url');
    });

    // Task 6.2: 过滤后空数组返回 undefined
    it('应该在所有 source 都不是 url 类型时返回 undefined', async () => {
      const mockSources = [
        { sourceType: 'file', id: '1', url: 'file:///path' },
        { sourceType: 'text', id: '2', url: 'text://content' },
      ];
      const metadata = createMockMetadata({
        sources: Promise.resolve(mockSources),
      });
      const result = await collectSources(metadata);
      expect(result).toBeUndefined();
    });

    // Task 6.3: 非空数组保留
    it('应该在有 url 类型来源时保留过滤后的数组', async () => {
      const mockSources = [
        { sourceType: 'url', id: '1', url: 'https://example.com', title: 'Example', providerMetadata: { foo: 'bar' } },
      ];
      const metadata = createMockMetadata({
        sources: Promise.resolve(mockSources),
      });
      const result = await collectSources(metadata);
      expect(result).toEqual([
        { sourceType: 'url', id: '1', url: 'https://example.com', title: 'Example', providerMetadata: { foo: 'bar' } },
      ]);
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

    // Task 5.1: 四个敏感 header 逐一移除（含大小写变体）
    it('应该逐一移除四个敏感 header（含大小写变体）', () => {
      const metadata = createMockMetadata({
        response: {
          id: 'test-id',
          modelId: 'deepseek-chat',
          timestamp: new Date('2024-01-01T00:00:00Z'),
          headers: {
            'authorization': 'Bearer secret1',
            'Authorization': 'Bearer secret2',
            'x-api-key': 'key1',
            'X-API-Key': 'key2',
            'content-type': 'application/json',
          },
        },
      });
      const result = collectResponseMetadata(metadata);
      expect(result.headers).not.toHaveProperty('authorization');
      expect(result.headers).not.toHaveProperty('Authorization');
      expect(result.headers).not.toHaveProperty('x-api-key');
      expect(result.headers).not.toHaveProperty('X-API-Key');
      expect(result.headers).toHaveProperty('content-type', 'application/json');
    });

    // Task 5.2: 非敏感 header 保留
    it('应该保留非敏感 header', () => {
      const metadata = createMockMetadata({
        response: {
          id: 'test-id',
          modelId: 'deepseek-chat',
          timestamp: new Date('2024-01-01T00:00:00Z'),
          headers: {
            'content-type': 'application/json',
            'x-request-id': 'req-123',
            'x-rate-limit': '100',
          },
        },
      });
      const result = collectResponseMetadata(metadata);
      expect(result.headers).toEqual({
        'content-type': 'application/json',
        'x-request-id': 'req-123',
        'x-rate-limit': '100',
      });
    });

    // Task 5.3: 精确化无 headers 测试
    it('应该在无 headers 时返回 headers 为 undefined', () => {
      const metadata = createMockMetadata({
        response: {
          id: 'test-id',
          modelId: 'deepseek-chat',
          timestamp: new Date('2024-01-01T00:00:00Z'),
          headers: undefined,
        },
      });
      const result = collectResponseMetadata(metadata);
      expect(result.headers).toBeUndefined();
    });

    // Task 5.4: timestamp 为非 Date 值时使用 new Date().toISOString()
    it('应该在 timestamp 为非 Date 值时使用当前时间', () => {
      const beforeTime = new Date().toISOString();
      const metadata = createMockMetadata({
        response: {
          id: 'test-id',
          modelId: 'deepseek-chat',
          timestamp: 'not-a-date' as unknown as Date,
        },
      });
      const result = collectResponseMetadata(metadata);
      const afterTime = new Date().toISOString();
      expect(result.timestamp >= beforeTime).toBe(true);
      expect(result.timestamp <= afterTime).toBe(true);
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

    // Task 2.1: body 为 undefined 时返回默认空对象字符串
    it('应该在 body 为 undefined 时返回 "{}"', () => {
      const metadata = createMockMetadata({
        request: { body: undefined },
      });
      const result = collectRequestMetadata(metadata);
      expect(result.body).toBe('{}');
    });

    // Task 2.2: body 为 string 时直接返回（不做 JSON 解析）
    it('应该在 body 为 string 时直接返回原始字符串', () => {
      const metadata = createMockMetadata({
        request: { body: 'raw string' },
      });
      const result = collectRequestMetadata(metadata);
      expect(result.body).toBe('raw string');
    });

    // Task 2.3: body 为 object 时序列化
    it('应该在 body 为 object 时序列化为 JSON 字符串', () => {
      const metadata = createMockMetadata({
        request: { body: { model: 'gpt-4', prompt: 'test' } },
      });
      const result = collectRequestMetadata(metadata);
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody).toEqual({ model: 'gpt-4', prompt: 'test' });
    });

    // Task 3.1: 四个敏感字段全部被删除
    it('应该删除全部四个敏感字段（apiKey/api_key/authorization/Authorization）', () => {
      const metadata = createMockMetadata({
        request: {
          body: JSON.stringify({
            apiKey: 'sk-123',
            api_key: 'sk-456',
            authorization: 'Bearer t1',
            Authorization: 'Bearer t2',
            model: 'gpt-4',
          }),
        },
      });
      const result = collectRequestMetadata(metadata);
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody.apiKey).toBeUndefined();
      expect(parsedBody.api_key).toBeUndefined();
      expect(parsedBody.authorization).toBeUndefined();
      expect(parsedBody.Authorization).toBeUndefined();
    });

    // Task 3.2: 非敏感字段保留
    it('应该保留非敏感字段', () => {
      const metadata = createMockMetadata({
        request: {
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'hi' }],
            temperature: 0.7,
          }),
        },
      });
      const result = collectRequestMetadata(metadata);
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody.model).toBe('gpt-4');
      expect(parsedBody.messages).toEqual([{ role: 'user', content: 'hi' }]);
      expect(parsedBody.temperature).toBe(0.7);
    });

    // Task 3.3: 精确化已有脱敏测试 - 逐字段验证
    it('应该逐字段验证脱敏：每个敏感字段独立验证存在/不存在', () => {
      const metadata = createMockMetadata({
        request: {
          body: JSON.stringify({
            apiKey: 'secret',
            safe1: 'value1',
            api_key: 'secret2',
            safe2: 'value2',
            authorization: 'Bearer x',
            safe3: 'value3',
            Authorization: 'Bearer y',
            safe4: 'value4',
          }),
        },
      });
      const result = collectRequestMetadata(metadata);
      const parsedBody = JSON.parse(result.body);
      // 敏感字段不存在
      expect('apiKey' in parsedBody).toBe(false);
      expect('api_key' in parsedBody).toBe(false);
      expect('authorization' in parsedBody).toBe(false);
      expect('Authorization' in parsedBody).toBe(false);
      // 非敏感字段存在
      expect('safe1' in parsedBody).toBe(true);
      expect('safe2' in parsedBody).toBe(true);
      expect('safe3' in parsedBody).toBe(true);
      expect('safe4' in parsedBody).toBe(true);
    });

    // Task 4.1: 超过 10240 字符截断
    it('应该在超过 10240 字符时截断并以 "... (truncated)" 结尾', () => {
      const longValue = 'a'.repeat(10241);
      const metadata = createMockMetadata({
        request: { body: longValue },
      });
      const result = collectRequestMetadata(metadata);
      expect(result.body.endsWith('... (truncated)')).toBe(true);
      expect(result.body.length).toBe(10240 + '... (truncated)'.length);
    });

    // Task 4.2: 恰好 10240 字符不截断
    it('应该在恰好 10240 字符时不截断', () => {
      const exactBody = 'x'.repeat(10240);
      const metadata = createMockMetadata({
        request: { body: exactBody },
      });
      const result = collectRequestMetadata(metadata);
      expect(result.body).toBe(exactBody);
      expect(result.body).not.toContain('... (truncated)');
    });
  });

  // Phase 2: 敏感字段 falsy 值处理（杀变异体 ID:94,96,98,100）
  describe('collectRequestMetadata - 敏感字段 falsy 值处理', () => {
    it('应该保留 falsy 值的敏感字段（空字符串、0、false、null）', () => {
      const metadata = createMockMetadata({
        request: {
          body: JSON.stringify({
            apiKey: '',
            api_key: 0,
            authorization: false,
            Authorization: null,
            model: 'gpt-4',
          }),
        },
      });
      const result = collectRequestMetadata(metadata);
      const parsedBody = JSON.parse(result.body);
      // falsy 敏感字段应保留（原始行为），变异体 if(true) 会错误删除
      expect(parsedBody.apiKey).toBe('');
      expect(parsedBody.api_key).toBe(0);
      expect(parsedBody.authorization).toBe(false);
      expect(parsedBody.Authorization).toBeNull();
      expect(parsedBody.model).toBe('gpt-4');
    });

    it('应该保留空字符串的单一 falsy 敏感字段', () => {
      const metadata = createMockMetadata({
        request: {
          body: JSON.stringify({ apiKey: '', model: 'gpt-4' }),
        },
      });
      const result = collectRequestMetadata(metadata);
      const parsedBody = JSON.parse(result.body);
      expect('apiKey' in parsedBody).toBe(true);
      expect(parsedBody.apiKey).toBe('');
    });

    it('应该在 truthy 和 falsy 混合时正确区分处理', () => {
      const metadata = createMockMetadata({
        request: {
          body: JSON.stringify({
            apiKey: 'secret',
            api_key: '',
            model: 'gpt-4',
          }),
        },
      });
      const result = collectRequestMetadata(metadata);
      const parsedBody = JSON.parse(result.body);
      // truthy 的 apiKey 应被删除
      expect('apiKey' in parsedBody).toBe(false);
      // falsy 的 api_key 应保留
      expect('api_key' in parsedBody).toBe(true);
      expect(parsedBody.api_key).toBe('');
      expect(parsedBody.model).toBe('gpt-4');
    });
  });

  // Phase 2: requestBody 安全检查（杀变异体 ID:83,84,88 + 覆盖 ID:91）
  describe('collectRequestMetadata - requestBody 安全检查', () => {
    it('应该在 body 为字符串 "undefined" 时重置为 "{}"', () => {
      const metadata = createMockMetadata({
        request: { body: 'undefined' },
      });
      const result = collectRequestMetadata(metadata);
      expect(result.body).toBe('{}');
    });

    it('应该正确序列化 object 类型 body 且不触发安全网误判', () => {
      const metadata = createMockMetadata({
        request: { body: { some: 'object', nested: { value: 42 } } },
      });
      const result = collectRequestMetadata(metadata);
      const parsedBody = JSON.parse(result.body);
      expect(parsedBody).toEqual({ some: 'object', nested: { value: 42 } });
    });
  });

  // Phase 2: warning message 非字符串（杀变异体 ID:28,30）
  describe('collectWarnings - warning message 非字符串处理', () => {
    it('应该在 message 为数字时走 fallback 拼接路径', async () => {
      const metadata = createMockMetadata({
        warnings: Promise.resolve([
          { code: 'rate_limit', message: 123 },
        ]),
      });
      const result = await collectWarnings(metadata);
      // message 不是 string，走 fallback 拼接路径，不等于 123
      expect(result[0].message).not.toBe(123);
      expect(typeof result[0].message).toBe('string');
    });

    it('应该在 message 为 null 时走 fallback 拼接路径', async () => {
      const metadata = createMockMetadata({
        warnings: Promise.resolve([
          { type: 'test', feature: 'feat', message: null },
        ]),
      });
      const result = await collectWarnings(metadata);
      // message 是 null（非 string），走 fallback
      expect(result[0].message).toBe('test: feat');
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

    // Task 8.1: usage 为 undefined 时默认值为 0（已由上方测试覆盖）

    // Task 8.2: usage 部分字段缺失时使用默认值
    it('应该在 usage 部分字段缺失时使用默认值', () => {
      const metadata = createMockMetadata({
        usage: {
          inputTokens: 100,
        },
      });
      const result = collectUsageMetadata(metadata);
      expect(result.inputTokens).toBe(100);
      expect(result.outputTokens).toBe(0);
      expect(result.totalTokens).toBe(0);
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

    // Task 10.4: collectFinishReasonMetadata 失败包装为 MetadataCollectionError
    it('应该在收集完成原因失败时抛出 MetadataCollectionError', async () => {
      const metadata = createMockMetadata({
        finishReason: Promise.reject(new Error('Finish reason error')),
      });
      await expect(collectFinishReasonMetadata(metadata)).rejects.toThrow(MetadataCollectionError);
      await expect(collectFinishReasonMetadata(metadata)).rejects.toThrow('Failed to collect finishReason');
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

      // 创建 mock StreamResult（需要实现 PromiseLike + AsyncIterable 双重接口）
      // oxlint-disable-next-line unicorn/no-thenable -- 测试需要模拟 PromiseLike 接口
      const mockStreamResult: {
        then: <T>(onfulfilled?: (value: StreamResultMetadata) => T | PromiseLike<T>) => Promise<T>;
        [Symbol.asyncIterator]: () => AsyncIterator<unknown>;
      } = {
        // oxlint-disable-next-line unicorn/no-thenable -- 测试需要模拟 PromiseLike 接口
        then: <T>(onfulfilled?: (value: StreamResultMetadata) => T | PromiseLike<T>) =>
          Promise.resolve(metadata).then(onfulfilled),
        [Symbol.asyncIterator]: async function* () {},
      };

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

      // oxlint-disable-next-line unicorn/no-thenable -- 测试需要模拟 PromiseLike 接口
      const mockStreamResult: {
        then: <T>(onfulfilled?: (value: StreamResultMetadata) => T | PromiseLike<T>) => Promise<T>;
        [Symbol.asyncIterator]: () => AsyncIterator<unknown>;
      } = {
        // oxlint-disable-next-line unicorn/no-thenable -- 测试需要模拟 PromiseLike 接口
        then: <T>(onfulfilled?: (value: StreamResultMetadata) => T | PromiseLike<T>) =>
          Promise.resolve(metadata).then(onfulfilled),
        [Symbol.asyncIterator]: async function* () {},
      };

      await expect(collectAllMetadata(mockStreamResult)).rejects.toThrow(MetadataCollectionError);
    });
  });
});
