/**
 * Mock 工厂单元测试
 */

import { describe, it, expect } from 'vitest';
import { createTauriMocks } from './tauri';
import { createStorageMocks } from './storage';

describe('createTauriMocks', () => {
  it('应该创建包含所有 Tauri API 的 Mock 对象', () => {
    const mocks = createTauriMocks();

    expect(mocks.shell).toBeDefined();
    expect(mocks.shell.open).toBeTypeOf('function');
    expect(mocks.os).toBeDefined();
    expect(mocks.http).toBeDefined();
    expect(mocks.store).toBeDefined();
    expect(mocks.keyring).toBeDefined();
    expect(mocks.env).toBeDefined();
  });

  it('默认 isTauri 应该返回 true', () => {
    const mocks = createTauriMocks();

    expect(mocks.env.isTauri()).toBe(true);
  });

  it('设置 isTauri: false 时应该返回 false', () => {
    const mocks = createTauriMocks({ isTauri: false });

    expect(mocks.env.isTauri()).toBe(false);
  });

  it('resetAll 应该清空所有 Mock 调用记录', async () => {
    const mocks = createTauriMocks();

    await mocks.shell.open('https://example.com');
    expect(mocks.shell.open).toHaveBeenCalledTimes(1);

    mocks.resetAll();
    expect(mocks.shell.open).toHaveBeenCalledTimes(0);
  });

  it('configure 应该更新 Mock 配置', () => {
    const mocks = createTauriMocks({ isTauri: true });

    expect(mocks.env.isTauri()).toBe(true);

    mocks.configure({ isTauri: false });
    expect(mocks.env.isTauri()).toBe(false);
  });

  it('keyring Mock 应该可以设置返回值', async () => {
    const mocks = createTauriMocks();

    mocks.keyring.getPassword.mockResolvedValue('test-password');

    const result = await mocks.keyring.getPassword('com.test', 'key');
    expect(result).toBe('test-password');
  });
});

describe('createStorageMocks', () => {
  it('应该创建包含所有存储 API 的 Mock 对象', () => {
    const mocks = createStorageMocks();

    expect(mocks.createLazyStore).toBeDefined();
    expect(mocks.saveToStore).toBeDefined();
    expect(mocks.loadFromStore).toBeDefined();
  });

  it('loadFromStore 应该可以设置返回值', async () => {
    const mocks = createStorageMocks();

    mocks.loadFromStore.mockResolvedValue([{ id: '1', name: 'test' }]);

    const result = await mocks.loadFromStore('test-key');
    expect(result).toEqual([{ id: '1', name: 'test' }]);
  });

  it('createLazyStore 应该返回 Store 实例', () => {
    const mocks = createStorageMocks();

    const store = mocks.createLazyStore('test.json');

    expect(store.init).toBeDefined();
    expect(store.get).toBeDefined();
    expect(store.set).toBeDefined();
  });
});
