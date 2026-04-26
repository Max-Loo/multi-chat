/**
 * 全局 Mock 层
 *
 * 包含所有 vi.mock() 调用，供单元测试使用
 * 注意：vi.mock() 必须在文件顶层静态调用（Vitest 限制）
 */

import { vi } from 'vitest';
import { createMockStreamResult, createMockAIProvider } from '@/__test__/helpers/mocks/aiSdk';

// ========================================
// 全局 Mock 配置
// ========================================

// Mock storeUtils 以防止存储模块初始化时触发真实的 IndexedDB
// 必须在最前面 Mock，因为其他存储模块依赖它
vi.mock('@/store/storage/storeUtils', () => ({
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
  createLazyStore: vi.fn(() => globalThis.__createMemoryStorageMock()),
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
    streamText: vi.fn().mockImplementation(() => createMockStreamResult()),
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
