/**
 * Vitest 测试环境设置
 * 
 * 配置全局测试环境、自定义断言和 Mock 策略
 */

import { vi, expect, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import 'fake-indexeddb/auto';

// 扩展 Vitest 的 expect 断言（@testing-library/jest-dom）
expect.extend(matchers);

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
  settingStore: {
    init: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    save: vi.fn().mockResolvedValue(undefined),
  },
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

// Mock env 模块
vi.mock('@/utils/tauriCompat/env', () => ({
  isTauri: vi.fn(),
}));

// Mock @/utils/tauriCompat，完全替换为 Mock 函数
vi.mock('@/utils/tauriCompat', () => ({
  // keyring 相关 - 使用 Mock 函数
  getPassword: vi.fn(),
  setPassword: vi.fn(),
  deletePassword: vi.fn(),
  isKeyringSupported: vi.fn(),
  // env 相关 - 使用 Mock 函数
  isTauri: vi.fn(),
  // 其他模块 - 使用 Mock 函数
  Command: {
    create: vi.fn(),
  },
  shell: {
    open: vi.fn(),
  },
  locale: vi.fn(),
  fetch: vi.fn(),
  getFetchFunc: vi.fn(),
  createLazyStore: vi.fn(),
}));

// Mock antd 相关模块（解决目录导入问题）
vi.mock('antd', () => ({
  default: {},
}));

vi.mock('@ant-design/x', () => ({
  Bubble: vi.fn(() => null),
  Think: vi.fn(() => null),
}));

// ========================================
// 全局 Mock 实例初始化
// ========================================

import { setupCustomAssertions } from './helpers/assertions/setup';

// 初始化全局 Mock 系统（临时禁用）
// setupGlobalMocks({ isTauri: true });

// 扩展自定义断言
setupCustomAssertions();

// ========================================
// 测试环境清理
// ========================================

// 在每个测试后清理所有 Mock 和状态
afterEach(() => {
  vi.clearAllMocks();
});

// ========================================
// 导出测试辅助工具
// ========================================

export * from './helpers';
