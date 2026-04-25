/**
 * 全局 Mock 层
 *
 * 包含所有 vi.mock() 调用和辅助函数，供单元测试使用
 * 注意：vi.mock() 必须在文件顶层静态调用（Vitest 限制）
 */

import { vi } from 'vitest';

// ========================================
// 辅助函数
// ========================================

// 创建默认的模拟流生成器
async function* createDefaultMockStream() {
  // 默认返回空流
}

// 创建模拟的流式响应结果
function createDefaultMockStreamResult() {
  return {
    // AsyncIterable 接口
    [Symbol.asyncIterator]: createDefaultMockStream,

    // Thenable 接口 - 用于 await 获取元数据
    // eslint-disable-next-line unicorn/no-thenable
    then: (callback: (value: unknown) => unknown) => {
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
        toDataStreamResponse: () => new Response(),
        toTextStreamResponse: () => new Response(),
      }).then(callback);
    },

    // fullStream 属性
    fullStream: {
      [Symbol.asyncIterator]: createDefaultMockStream,
    },
  };
}

/**
 * 创建 AI SDK provider mock 对象
 * 统一 deepseek/moonshotai/zhipu 三种 provider 的 mock 逻辑
 */
function createMockAIProvider(providerName: string) {
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

// ========================================
// 全局 Mock 配置
// ========================================

// Mock storeUtils 以防止存储模块初始化时触发真实的 IndexedDB
// 必须在最前面 Mock，因为其他存储模块依赖它
vi.mock('@/store/storage/storeUtils', () => ({
  createLazyStore: vi.fn(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    keys: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
  })),
  saveToStore: vi.fn().mockResolvedValue(undefined),
  loadFromStore: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/utils/tauriCompat/shell', () => ({
  shell: {
    open: vi.fn().mockResolvedValue(undefined),
  },
  Command: {
    create: vi.fn().mockReturnValue({
      execute: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
      isSupported: vi.fn().mockReturnValue(true),
    }),
  },
}));

vi.mock('@/utils/tauriCompat/os', () => ({
  locale: vi.fn().mockResolvedValue('zh-CN'),
  platform: vi.fn().mockResolvedValue('darwin'),
}));

vi.mock('@/utils/tauriCompat/http', () => ({
  fetch: vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
  }),
  getFetchFunc: vi.fn().mockReturnValue(
    vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    })
  ),
}));

vi.mock('@/utils/tauriCompat/store', () => ({
  createLazyStore: vi.fn().mockReturnValue({
    init: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    keys: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    isSupported: vi.fn().mockReturnValue(true),
  }),
}));

// Mock env 模块（必须在桶模块 mock 之前，因为 importOriginal 会触发 keyring/keyringMigration 加载 env）
vi.mock('@/utils/tauriCompat/env', () => ({
  isTauri: vi.fn(() => false),
  isTestEnvironment: vi.fn(() => true),
  getPBKDF2Iterations: vi.fn(() => 1000),
  PBKDF2_ALGORITHM: 'SHA-256' as const,
  DERIVED_KEY_LENGTH: 256,
}));

// Mock @/utils/tauriCompat 桶模块
// 使用 importOriginal 保留真实导出（如 keyring），仅覆盖需要 mock 的模块
vi.mock('@/utils/tauriCompat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/tauriCompat')>();
  return {
    ...actual,
    Command: { create: vi.fn() },
    shell: { open: vi.fn() },
    locale: vi.fn(),
    fetch: vi.fn(),
    getFetchFunc: vi.fn(),
    createLazyStore: vi.fn(),
  };
});

// ========================================
// Vercel AI SDK 全局 Mock
// ========================================
// 注意：保留全局 mock 以支持其他测试
// streamChatCompletion 测试使用依赖注入来覆盖这些 mock

// Mock Vercel AI SDK
vi.mock('ai', () => {
  let _idCounter = 0;
  let _genCounter = 0;

  return {
    streamText: vi.fn().mockImplementation(() => createDefaultMockStreamResult()),
    generateText: vi.fn().mockResolvedValue({
      text: 'mock generated text',
      usage: { promptTokens: 10, completionTokens: 5 },
      finishReason: 'stop',
      warnings: [],
    }),
    generateId: vi.fn(() => `mock-generated-id-${++_idCounter}`),
    createIdGenerator: vi.fn((options?: { prefix?: string }) => {
      const prefix = options?.prefix ?? '';
      return () => `${prefix}${++_genCounter}`;
    }),
  };
});

vi.mock('@ai-sdk/deepseek', () => ({
  createDeepSeek: vi.fn(() => createMockAIProvider('deepseek')),
}));

vi.mock('@ai-sdk/moonshotai', () => ({
  createMoonshotAI: vi.fn(() => createMockAIProvider('moonshotai')),
}));

vi.mock('zhipu-ai-provider', () => ({
  createZhipu: vi.fn(() => createMockAIProvider('zhipu')),
}));

// 全局 mock Skeleton 组件，消除多个测试文件的重复定义
vi.mock('@/components/ui/skeleton', async () => {
  const { createElement } = await import('react');
  return {
    Skeleton: ({ className, variant, style }: Record<string, unknown>) =>
      createElement('div', { 'data-testid': 'skeleton-item', className, 'data-variant': variant, style }),
  };
});
