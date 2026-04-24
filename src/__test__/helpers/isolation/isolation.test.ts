/**
 * 环境隔离工具单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetTestState, useIsolatedTest, setTestEnv, verifyIsolation, clearIndexedDB } from './reset';

/**
 * 临时替换 indexedDB.databases 方法
 * 自动在回调结束后恢复原始值，避免测试异常导致状态泄漏
 */
function withMockedDatabases(
  impl: typeof indexedDB.databases | undefined,
  fn: () => Promise<void>,
): Promise<void> {
  const original = indexedDB.databases;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (indexedDB as any).databases = impl;
  return fn().finally(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (indexedDB as any).databases = original;
  });
}

describe('resetTestState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('应该清空 localStorage', async () => {
    localStorage.setItem('test-key', 'test-value');

    await resetTestState({ resetLocalStorage: true, resetMocks: false, resetIndexedDB: false });

    expect(localStorage.getItem('test-key')).toBeNull();
  });

  it('应该清空 Mock 调用记录', async () => {
    const mockFn = vi.fn();
    mockFn('test');

    await resetTestState({ resetLocalStorage: false, resetMocks: true, resetIndexedDB: false });

    expect(mockFn).toHaveBeenCalledTimes(0);
  });

  it('resetModules: true 时应该重置模块缓存', async () => {
    const resetModulesSpy = vi.spyOn(vi, 'resetModules');

    await resetTestState({ resetModules: true, resetLocalStorage: false, resetMocks: false, resetIndexedDB: false });

    expect(resetModulesSpy).toHaveBeenCalled();
    resetModulesSpy.mockRestore();
  });

  it('默认选项应该清空 localStorage 和 Mock', async () => {
    localStorage.setItem('key', 'value');
    const mockFn = vi.fn();
    mockFn();

    await resetTestState();

    expect(localStorage.getItem('key')).toBeNull();
    expect(mockFn).toHaveBeenCalledTimes(0);
  });
});

describe('useIsolatedTest', () => {
  it('应该不抛错地配置 beforeEach 和 afterEach 钩子', () => {
    const beforeSpy = vi.fn();
    const afterSpy = vi.fn();

    expect(() => useIsolatedTest({
      onBeforeEach: beforeSpy,
      onAfterEach: afterSpy,
    })).not.toThrow();
  });
});

describe('setTestEnv', () => {
  it('应该设置环境变量', () => {
    setTestEnv('TEST_VAR', 'test-value');

    expect(import.meta.env.TEST_VAR).toBe('test-value');
  });
});

describe('verifyIsolation', () => {
  it('localStorage 为空时应该返回 true', async () => {
    localStorage.clear();

    const result = await verifyIsolation();

    expect(result).toBe(true);
  });

  it('localStorage 不为空时应该返回 false', async () => {
    localStorage.setItem('leak', 'data');

    const result = await verifyIsolation();

    expect(result).toBe(false);
    localStorage.clear();
  });
});

describe('clearIndexedDB', () => {
  it('应该不抛错', async () => {
    await expect(clearIndexedDB()).resolves.not.toThrow();
  });

  it('indexedDB.databases() 不可用时应使用 fallback 策略', async () => {
    await withMockedDatabases(undefined, async () => {
      await expect(clearIndexedDB()).resolves.not.toThrow();
    });
  });

  it('indexedDB.databases() 抛出异常时应使用 fallback 策略', async () => {
    await withMockedDatabases(
      () => { throw new Error('not supported'); },
      async () => {
        await expect(clearIndexedDB()).resolves.not.toThrow();
      },
    );
  });
});

describe('verifyIsolation IndexedDB 检查', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('IndexedDB 为空时应该返回 true', async () => {
    // 先清理 IndexedDB 确保干净状态
    await clearIndexedDB();

    const result = await verifyIsolation();

    expect(result).toBe(true);
  });

  it('indexedDB.databases() 不可用时应跳过 IndexedDB 检查', async () => {
    await withMockedDatabases(undefined, async () => {
      const result = await verifyIsolation();
      expect(result).toBe(true);
    });
  });
});
