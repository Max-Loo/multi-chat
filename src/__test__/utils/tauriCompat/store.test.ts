/**
 * tauriCompat/store.ts 变异测试
 *
 * vi.unmock 绕过 setup/mocks.ts 的全局 mock，静态 import 获取真实模块
 * 测试覆盖真实的 WebStoreCompat（IndexedDB 实现）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';

// 绕过 setup/mocks.ts 对 store 模块的全局 mock
vi.unmock('@/utils/tauriCompat/store');

// 覆盖 env 模块的 mock，控制 isTauri 返回值
vi.mock('@/utils/tauriCompat/env', () => ({
  isTauri: vi.fn(() => false),
  isTestEnvironment: vi.fn(() => true),
  getPBKDF2Iterations: vi.fn(() => 1000),
  PBKDF2_ALGORITHM: 'SHA-256' as const,
  DERIVED_KEY_LENGTH: 256,
}));

// Mock @tauri-apps/plugin-store 防止 Tauri 路径导入失败
vi.mock('@tauri-apps/plugin-store', () => ({
  LazyStore: vi.fn().mockImplementation(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    keys: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { createLazyStore } from '@/utils/tauriCompat/store';
import type { StoreCompat } from '@/utils/tauriCompat/store';

describe('tauriCompat/store', () => {
  let store: StoreCompat;

  beforeEach(() => {
    vi.stubGlobal('indexedDB', new IDBFactory());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /**
   * 辅助函数：创建已初始化的 store 实例
   */
  async function createInitStore(filename = 'test-store.json') {
    const s = createLazyStore(filename);
    await s.init();
    return s;
  }

  describe('环境分发：createLazyStore', () => {
    it('Web 环境创建 WebStoreCompat 实例', async () => {
      store = await createInitStore('env-test.json');
      expect(store.isSupported()).toBe(true);
    });

    it('Web 环境实例支持完整 CRUD 操作', async () => {
      store = await createInitStore('crud-test.json');

      await store.set('k1', 'v1');
      expect(await store.get<string>('k1')).toBe('v1');

      await store.delete('k1');
      expect(await store.get<string>('k1')).toBeNull();

      const keys = await store.keys();
      expect(keys).toEqual([]);
    });
  });

  describe('WebStoreCompat.get', () => {
    it('set 后 get 返回精确值', async () => {
      store = await createInitStore('get-precise.json');
      await store.set('key', 'value');
      expect(await store.get<string>('key')).toBe('value');
    });

    it('键不存在时返回 null', async () => {
      store = await createInitStore('get-null.json');
      expect(await store.get<string>('non-existent-key')).toBeNull();
    });

    it('存储对象后 get 返回精确对象', async () => {
      store = await createInitStore('get-object.json');
      const testObject = { name: 'test', value: 123 };
      await store.set('obj-key', testObject);
      expect(await store.get<typeof testObject>('obj-key')).toEqual(testObject);
    });
  });

  describe('WebStoreCompat.set', () => {
    it('set 后 get 返回精确值', async () => {
      store = await createInitStore('set-roundtrip.json');
      await store.set('test-key', { name: 'test' });
      expect(await store.get<{ name: string }>('test-key')).toEqual({ name: 'test' });
    });

    it('set 覆盖已有值', async () => {
      store = await createInitStore('set-overwrite.json');
      await store.set('key', 'old-value');
      await store.set('key', 'new-value');
      expect(await store.get<string>('key')).toBe('new-value');
    });
  });

  describe('WebStoreCompat.delete', () => {
    it('delete 后 get 返回 null', async () => {
      store = await createInitStore('delete-test.json');
      await store.set('key', 'value');
      await store.delete('key');
      expect(await store.get<string>('key')).toBeNull();
    });

    it('删除不存在的键不报错', async () => {
      store = await createInitStore('delete-noop.json');
      await expect(store.delete('non-existent-key')).resolves.toBeUndefined();
    });
  });

  describe('WebStoreCompat.keys', () => {
    it('设置多个键后 keys 返回完整列表', async () => {
      store = await createInitStore('keys-multi.json');
      await store.set('a', 1);
      await store.set('b', 2);
      const keys = await store.keys();
      expect(keys).toContain('a');
      expect(keys).toContain('b');
      expect(keys).toHaveLength(2);
    });

    it('新创建的 store 返回空数组', async () => {
      store = await createInitStore('keys-empty.json');
      expect(await store.keys()).toEqual([]);
    });
  });

  describe('WebStoreCompat.close', () => {
    it('close 后 get 抛出错误', async () => {
      store = await createInitStore('close-test.json');
      store.close();
      try {
        await store.get('any-key');
        expect.unreachable('Expected get to throw after close');
      } catch (error) {
        expect((error as Error).message).toContain('Store 未初始化');
      }
    });

    it('close 后 set 抛出错误', async () => {
      store = await createInitStore('close-set-test.json');
      store.close();
      try {
        await store.set('key', 'value');
        expect.unreachable('Expected set to throw after close');
      } catch (error) {
        expect((error as Error).message).toContain('Store 未初始化');
      }
    });

    it('未初始化时 get 抛出错误', async () => {
      store = createLazyStore('no-init-test.json');
      try {
        await store.get('any-key');
        expect.unreachable('Expected get to throw when not initialized');
      } catch (error) {
        expect((error as Error).message).toContain('Store 未初始化');
      }
    });
  });

  describe('WebStoreCompat.isSupported', () => {
    it('fake-indexedDB 环境下返回 true', async () => {
      store = await createInitStore('supported-test.json');
      expect(store.isSupported()).toBe(true);
    });

    it('indexedDB 不可用时返回 false', () => {
      vi.stubGlobal('indexedDB', undefined);
      const s = createLazyStore('no-idb.json');
      expect(s.isSupported()).toBe(false);
    });
  });

  describe('WebStoreCompat.save', () => {
    it('save 为空操作，不抛异常', async () => {
      store = await createInitStore('save-test.json');
      await store.set('key', 'value');
      await expect(store.save()).resolves.toBeUndefined();
    });
  });
});
