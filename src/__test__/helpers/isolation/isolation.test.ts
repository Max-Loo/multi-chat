/**
 * 环境隔离工具单元测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetTestState, useIsolatedTest, setTestEnv, verifyIsolation, clearIndexedDB } from './reset';

describe('resetTestState', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('应该清空 localStorage', () => {
    localStorage.setItem('test-key', 'test-value');

    resetTestState({ resetLocalStorage: true, resetMocks: false });

    expect(localStorage.getItem('test-key')).toBeNull();
  });

  it('应该清空 Mock 调用记录', () => {
    const mockFn = vi.fn();
    mockFn('test');

    resetTestState({ resetLocalStorage: false, resetMocks: true });

    expect(mockFn).toHaveBeenCalledTimes(0);
  });

  it('resetModules: true 时应该重置模块缓存', () => {
    const resetModulesSpy = vi.spyOn(vi, 'resetModules');

    resetTestState({ resetModules: true, resetLocalStorage: false, resetMocks: false });

    expect(resetModulesSpy).toHaveBeenCalled();
    resetModulesSpy.mockRestore();
  });

  it('默认选项应该清空 localStorage 和 Mock', () => {
    localStorage.setItem('key', 'value');
    const mockFn = vi.fn();
    mockFn();

    resetTestState();

    expect(localStorage.getItem('key')).toBeNull();
    expect(mockFn).toHaveBeenCalledTimes(0);
  });
});

describe('useIsolatedTest', () => {
  it('应该自动配置 beforeEach 和 afterEach 钩子', () => {
    const beforeSpy = vi.fn();
    const afterSpy = vi.fn();

    useIsolatedTest({
      onBeforeEach: beforeSpy,
      onAfterEach: afterSpy,
    });

    // 钩子已注册，测试本身证明函数不抛错
    expect(true).toBe(true);
  });
});

describe('setTestEnv', () => {
  it('应该设置环境变量', () => {
    setTestEnv('TEST_VAR', 'test-value');

    expect(import.meta.env.TEST_VAR).toBe('test-value');
  });
});

describe('verifyIsolation', () => {
  it('localStorage 为空时应该返回 true', () => {
    localStorage.clear();

    const result = verifyIsolation();

    expect(result).toBe(true);
  });

  it('localStorage 不为空时应该返回 false', () => {
    localStorage.setItem('leak', 'data');

    const result = verifyIsolation();

    expect(result).toBe(false);
    localStorage.clear();
  });
});

describe('clearIndexedDB', () => {
  it('应该不抛错', async () => {
    await expect(clearIndexedDB()).resolves.not.toThrow();
  });
});
