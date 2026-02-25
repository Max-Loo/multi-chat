/**
 * Vitest 测试环境设置
 * 
 * 配置全局测试环境、自定义断言和 Mock 策略
 */

import { vi, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// 扩展 Vitest 的 expect 断言（@testing-library/jest-dom）
expect.extend(matchers);

// ========================================
// 全局 Mock 配置
// ========================================
// 注意：vi.mock() 必须在文件顶层静态调用（Vitest 限制）
// 这些 Mock 提供默认实现，测试中可通过 createTauriMocks() 覆盖

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

// keyring 模块默认不自动 Mock（需真实实现或按需 Mock）

// ========================================
// 全局 Mock 实例初始化
// ========================================

import { setupGlobalMocks } from './helpers/mocks/setup';
import { setupCustomAssertions } from './helpers/assertions/setup';

// 初始化全局 Mock 系统
setupGlobalMocks({ isTauri: true });

// 扩展自定义断言
setupCustomAssertions();

// ========================================
// 导出测试辅助工具
// ========================================

export * from './helpers';
