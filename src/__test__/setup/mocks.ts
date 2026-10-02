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
}));

vi.mock('@/utils/tauriCompat/os', () => ({
  locale: vi.fn().mockResolvedValue('zh-CN'),
}));

vi.mock('@/utils/tauriCompat/store', () => ({
  createLazyStore: vi.fn(() => globalThis.__createMemoryStorageMock()),
}));

// Mock env 模块（必须在桶模块 mock 之前，因为 importOriginal 会触发 keyring/keyringMigration 加载 env）
vi.mock('@/utils/tauriCompat/env', () => ({
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
    shell: { open: vi.fn() },
    locale: vi.fn(),
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
// class/style 经由 attrs 自动透传到根 div（inheritAttrs 默认行为）
// 同时提供具名导出 Skeleton（对应真实模块 export { default as Skeleton }）
vi.mock('@/components/ui/skeleton', async () => {
  const { defineComponent, h } = await import('vue');
  const SkeletonMock = defineComponent({
    name: 'Skeleton',
    props: {
      variant: { type: String, default: 'text' },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-testid': 'skeleton-item',
          'data-variant': props.variant,
        });
    },
  });
  return { default: SkeletonMock, Skeleton: SkeletonMock };
});
