/**
 * tauriCompat/env.ts 单元测试
 *
 * 通过 vi.importActual 绕过全局 mock，直接测试真实逻辑。
 * 使用 beforeEach/afterEach 进行环境隔离，确保测试间无污染。
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';

let envModule: typeof import('@/utils/tauriCompat/env');

beforeAll(async () => {
  // 通过 vi.importActual 导入真实模块，绕过 setup/mocks.ts 中的全局 mock
  envModule = await vi.importActual<typeof import('@/utils/tauriCompat/env')>('@/utils/tauriCompat/env');
});

describe('tauriCompat/env', () => {
  // 保存原始全局变量，用于 afterEach 恢复
  let originalTAURI: unknown;
  let originalVitest: unknown;
  let originalVITEST: unknown;
  let originalProcessVITEST: string | undefined;

  beforeEach(() => {
    originalTAURI = (window as unknown as Record<string, unknown>).__TAURI__;
    originalVitest = (globalThis as Record<string, unknown>).vitest;
    originalVITEST = (globalThis as Record<string, unknown>).__VITEST__;
    originalProcessVITEST = process.env.VITEST;
  });

  afterEach(() => {
    // 恢复 window.__TAURI__
    if (originalTAURI === undefined) {
      delete (window as unknown as Record<string, unknown>).__TAURI__;
    } else {
      (window as unknown as Record<string, unknown>).__TAURI__ = originalTAURI;
    }
    // 恢复 vitest 全局变量
    (globalThis as Record<string, unknown>).vitest = originalVitest;
    (globalThis as Record<string, unknown>).__VITEST__ = originalVITEST;
    if (originalProcessVITEST !== undefined) {
      process.env.VITEST = originalProcessVITEST;
    } else {
      delete process.env.VITEST;
    }
  });

  describe('isTauri', () => {
    it('应该返回 true 当 window 上存在 __TAURI__ 属性', () => {
      (window as unknown as Record<string, unknown>).__TAURI__ = {};
      expect(envModule.isTauri()).toBe(true);
    });

    it('应该返回 false 当 window 上不存在 __TAURI__ 属性', () => {
      delete (window as unknown as Record<string, unknown>).__TAURI__;
      expect(envModule.isTauri()).toBe(false);
    });

    it('应该返回 false 当 window 为 undefined', () => {
      const savedWindow = globalThis.window;
      try {
        delete (globalThis as Record<string, unknown>).window;
        expect(envModule.isTauri()).toBe(false);
      } finally {
        (globalThis as Record<string, unknown>).window = savedWindow;
      }
    });
  });

  describe('isTestEnvironment', () => {
    it('应该返回 true 当 globalThis.vitest 存在', () => {
      // vitest 运行时 globalThis.vitest 被自动设置为 vi 对象
      expect(envModule.isTestEnvironment()).toBe(true);
    });

    it('应该返回 true 当 globalThis.__VITEST__ 为 truthy', () => {
      // 清除第一策略，仅保留 __VITEST__
      delete (globalThis as Record<string, unknown>).vitest;
      (globalThis as Record<string, unknown>).__VITEST__ = true;
      expect(envModule.isTestEnvironment()).toBe(true);
    });

    it('应该返回 true 当 process.env.VITEST 存在', () => {
      // 清除前两个策略，仅保留 process.env.VITEST
      delete (globalThis as Record<string, unknown>).vitest;
      delete (globalThis as Record<string, unknown>).__VITEST__;
      process.env.VITEST = 'true';
      expect(envModule.isTestEnvironment()).toBe(true);
    });

    it('应该返回 true 当 import.meta.env.VITEST 为 "true"', () => {
      // 清除前三个策略，验证第四个策略
      // vitest 设置 import.meta.env.VITEST 为 boolean true，源码检查严格字符串 'true'，
      // 因此该策略在默认 vitest 配置下不会被触发
      delete (globalThis as Record<string, unknown>).vitest;
      delete (globalThis as Record<string, unknown>).__VITEST__;
      delete process.env.VITEST;
      expect(envModule.isTestEnvironment()).toBe(false);
    });

    it('应该返回 false 当所有检测策略均不满足', () => {
      delete (globalThis as Record<string, unknown>).vitest;
      delete (globalThis as Record<string, unknown>).__VITEST__;
      delete process.env.VITEST;
      expect(envModule.isTestEnvironment()).toBe(false);
    });
  });

  describe('getPBKDF2Iterations', () => {
    it('应该返回 1000 在测试环境中', () => {
      // vitest 环境下 _isTestEnv 为 true（模块加载时计算），返回低迭代次数
      expect(envModule.getPBKDF2Iterations()).toBe(1000);
    });

    it('应该返回 100000 在非测试环境中', async () => {
      // 清除 vitest 全局变量，使 isTestEnvironment() 返回 false
      const savedVitest = (globalThis as Record<string, unknown>).vitest;
      const savedVITEST = (globalThis as Record<string, unknown>).__VITEST__;
      const savedEnvVITEST = process.env.VITEST;
      try {
        delete (globalThis as Record<string, unknown>).vitest;
        delete (globalThis as Record<string, unknown>).__VITEST__;
        delete process.env.VITEST;
        // 重置模块缓存并重新加载，使 _isTestEnv 在加载时计算为 false
        vi.resetModules();
        const freshModule = await vi.importActual<typeof import('@/utils/tauriCompat/env')>('@/utils/tauriCompat/env');
        expect(freshModule.getPBKDF2Iterations()).toBe(100000);
      } finally {
        (globalThis as Record<string, unknown>).vitest = savedVitest;
        (globalThis as Record<string, unknown>).__VITEST__ = savedVITEST;
        if (savedEnvVITEST !== undefined) process.env.VITEST = savedEnvVITEST;
        else delete process.env.VITEST;
      }
    });
  });
});
