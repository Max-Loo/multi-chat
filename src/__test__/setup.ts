/**
 * Vitest 测试环境设置
 * 
 * 配置全局测试环境、自定义断言和 Mock 策略
 */

import { vi, expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import 'fake-indexeddb/auto';

// 扩展 Vitest 的 expect 断言（@testing-library/jest-dom）
expect.extend(matchers);

// ========================================
// 全局 Polyfill
// ========================================
// jsdom 不提供 ResizeObserver，为所有测试统一注册空 polyfill
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ========================================
// 全局 Mock 配置
// ========================================
// 注意：vi.mock() 必须在文件顶层静态调用（Vitest 限制）
// 这些 Mock 提供默认实现，测试中可通过 createTauriMocks() 覆盖

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
  isTauri: vi.fn(() => false), // 默认返回 false
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
// 
// 辅助函数：创建默认的模拟流生成器（移到外层避免 lint 警告）
async function* createDefaultMockStream() {
  // 默认返回空流
}

// 辅助函数：创建模拟的流式响应结果（移到外层避免 lint 警告）
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

// Mock Vercel AI SDK
// 注意：必须使用 vi.fn().mockImplementation() 提供默认返回值
// 否则 streamText 返回 undefined，导致真实 API 被调用
vi.mock('ai', () => {
  // 递增计数器，确保每次调用生成唯一 ID
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
  createDeepSeek: vi.fn(() => {
    // 返回一个函数，该函数返回一个 mock provider 对象
    // 这个 mock provider 对象需要满足 Vercel AI SDK 的接口
    return vi.fn((modelId: string) => ({
      provider: 'deepseek' as const,
      modelId,
      // 添加其他必要的属性和方法
      specificationVersion: 'v1' as const,
      supportsImageUrls: false,
      supportsUrl: false,
      supportsToolCallStreaming: false,
      supportsToolCalls: false,
      supportsStructuredGeneration: false,
      supportsObjectGeneration: false,
      defaultTemperature: 0.7,
      defaultMaxTokens: 4096,
      // 添加一个 dummy 的 doStream 方法
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      doStream: vi.fn().mockResolvedValue({ stream: [] as any }),
      // 添加 doGenerate 方法以支持 generateText
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      doGenerate: vi.fn().mockResolvedValue({
        text: 'mock generated text',
        usage: { promptTokens: 10, completionTokens: 5 },
        finishReason: 'stop',
        warnings: [],
      }),
    }));
  }),
}));

vi.mock('@ai-sdk/moonshotai', () => ({
  createMoonshotAI: vi.fn(() => {
    return vi.fn((modelId: string) => ({
      provider: 'moonshotai' as const,
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
  }),
}));

vi.mock('zhipu-ai-provider', () => ({
  createZhipu: vi.fn(() => {
    return vi.fn((modelId: string) => ({
      provider: 'zhipu' as const,
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
  }),
}));

// 注意：不全局 mock utils 模块，因为它包含真实的时间戳函数
// 如果需要 mock 时间戳，请在具体测试文件中使用 vi.spyOn
// vi.mock('@/utils/utils', () => ({
//   getCurrentTimestamp: vi.fn(() => 1234567890),
//   getCurrentTimestampMs: vi.fn(() => 1234567890000),
// }));

// ========================================
// 全局 Mock 实例初始化
// ========================================

import { setupCustomAssertions } from './helpers/assertions/setup';
import { createI18nMockReturn, mockI18n } from './helpers/mocks/i18n';
import { createMemoryStorageMock } from './helpers/mocks/storage';
import { createResponsiveMock } from './helpers/mocks/responsive';
import { createTauriCompatModuleMock } from './helpers/mocks/tauriCompat';
import { createToastQueueModuleMock } from './helpers/mocks/toast';

// 将 i18n mock 工厂函数注册到 globalThis，供测试文件中的 vi.mock 工厂使用
// vi.mock 的工厂函数存在 hoisting 限制，无法使用常规 import
// eslint-disable-next-line no-var
var __i18nMock: typeof createI18nMockReturn = createI18nMockReturn;
globalThis.__createI18nMockReturn = __i18nMock;

// 将 mockI18n 封装函数注册到 globalThis，提供带默认翻译键的便捷 mock
// eslint-disable-next-line no-var
var __mockI18nFn: typeof mockI18n = mockI18n;
globalThis.__mockI18n = __mockI18nFn;

// 将内存存储 mock 工厂函数注册到 globalThis，供集成测试的 vi.mock 工厂使用
// eslint-disable-next-line no-var
var __storageMock: typeof createMemoryStorageMock = createMemoryStorageMock;
globalThis.__createMemoryStorageMock = __storageMock;

// 将 useResponsive mock 工厂注册到 globalThis，供组件测试复用
// eslint-disable-next-line no-var
var __responsiveMock = createResponsiveMock;
globalThis.__createResponsiveMock = __responsiveMock;

// 将 tauriCompat 模块 mock 工厂注册到 globalThis，供集成测试复用
// eslint-disable-next-line no-var
var __tauriCompatModuleMock = createTauriCompatModuleMock;
globalThis.__createTauriCompatModuleMock = __tauriCompatModuleMock;

// 将 toast 模块 mock 工厂注册到 globalThis，供测试文件复用
// eslint-disable-next-line no-var
var __toastModuleMock = createToastQueueModuleMock;
globalThis.__createToastQueueModuleMock = __toastModuleMock;

// 初始化全局 Mock 系统（临时禁用）
// setupGlobalMocks({ isTauri: true });

// 扩展自定义断言
setupCustomAssertions();

// ========================================
// 测试环境清理
// ========================================

// 在每个测试后清理所有 Mock 和状态
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ========================================
// 抑制测试中的预期 Unhandled Rejection 警告
// 抑制测试中的预期 Unhandled Rejection 警告
// ========================================
// 在测试错误处理场景时，我们会故意创建被拒绝的 Promise
// 这些 Promise 会被测试代码正确处理，但 Vitest 仍会报告为 "unhandled"
// 添加一个全局处理器来抑制这些预期的警告

if (typeof window !== 'undefined' && 'addEventListener' in window) {
  window.addEventListener('unhandledrejection', (event) => {
    // 抑制测试中预期的错误类型
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorMessage = (event.reason as any)?.message || String(event.reason);
    
    // 错误处理测试中预期的错误消息
    const expectedErrorPatterns = [
      'Network error',
      'Request timeout',
      'API Error',
      'Invalid JSON response',
      'Connection refused',
      'Failed to fetch',
    ];

    // 检查是否是预期的错误
    const isExpectedError = expectedErrorPatterns.some(pattern => 
      errorMessage.includes(pattern)
    );

    if (isExpectedError) {
      // 阻止事件冒泡，避免 Vitest 报告这些错误
      event.preventDefault();
    }
  });
} else if (typeof process !== 'undefined' && 'on' in process) {
  // Node.js 环境
  process.on('unhandledRejection', (reason: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorMessage = (reason as any)?.message || String(reason);
    
    const expectedErrorPatterns = [
      'Network error',
      'Request timeout',
      'API Error',
      'Invalid JSON response',
      'Connection refused',
      'Failed to fetch',
    ];

    const isExpectedError = expectedErrorPatterns.some(pattern => 
      errorMessage.includes(pattern)
    );

    // 不输出预期的错误
    if (!isExpectedError) {
      console.error('Unhandled Rejection:', reason);
    }
  });
}
