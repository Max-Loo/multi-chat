import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLazyStore } from '@/utils/tauriCompat';
import { initFakeIndexedDB, cleanupFakeIndexedDB } from '@/__test__/utils/tauriCompat/idb-helpers';
import type { StoreCompat } from '@/utils/tauriCompat';

/**
 * Store 工具函数测试套件
 *
 * 测试 src/store/storage/storeUtils.ts 模块的功能
 * 覆盖 createLazyStore、saveToStore、loadFromStore 的全路径
 *
 * setup.ts 全局 mock 了 storeUtils 模块，
 * 此处通过 vi.importActual 获取真实 saveToStore/loadFromStore 以测试函数逻辑
 */

/** 获取真实的 saveToStore 和 loadFromStore 实现（绕过 setup.ts 的全局 mock） */
const { saveToStore, loadFromStore } = await vi.importActual<
  typeof import('@/store/storage/storeUtils')
>('@/store/storage/storeUtils');

/**
 * 创建 mock StoreCompat 实例
 * @param overrides 覆盖指定的 store 方法
 */
function createMockStore(overrides?: Partial<StoreCompat>): StoreCompat {
  return {
    init: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    keys: vi.fn().mockResolvedValue([]),
    save: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
    isSupported: vi.fn().mockReturnValue(true),
    ...overrides,
  };
}

describe('Store 工具函数', () => {
  describe('createLazyStore', () => {
    let idbCtx: ReturnType<typeof initFakeIndexedDB>;

    beforeEach(() => {
      idbCtx = initFakeIndexedDB();
    });

    afterEach(() => {
      cleanupFakeIndexedDB(idbCtx);
    });

    it('get/set/delete/save 功能正常', async () => {
      const testStore = createLazyStore('test-setting.json');
      await testStore.init();

      await expect(testStore.set('test-key', 'test-value')).resolves.not.toThrow();
      const value = await testStore.get<string>('test-key');
      expect(value).toBeDefined();

      await expect(testStore.delete('test-key')).resolves.not.toThrow();
      await expect(testStore.save()).resolves.not.toThrow();
    });
  });

  describe('saveToStore', () => {
    it('应该成功保存数据并输出成功消息 当 successMessage 有值', async () => {
      const store = createMockStore();
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await saveToStore(store, 'test-key', { name: 'test' }, '保存配置');

      expect(store.init).toHaveBeenCalledOnce();
      expect(store.set).toHaveBeenCalledWith('test-key', { name: 'test' });
      expect(store.save).toHaveBeenCalledOnce();
      expect(logSpy).toHaveBeenCalledWith('成功保存配置到 test-key');

      logSpy.mockRestore();
    });

    it('应该成功保存数据但不输出日志 当 successMessage 为 undefined', async () => {
      const store = createMockStore();
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await saveToStore(store, 'test-key', { name: 'test' });

      expect(store.init).toHaveBeenCalledOnce();
      expect(store.set).toHaveBeenCalledWith('test-key', { name: 'test' });
      expect(store.save).toHaveBeenCalledOnce();
      expect(logSpy).not.toHaveBeenCalled();

      logSpy.mockRestore();
    });

    it('应该记录错误并重抛 当 store.set 抛出异常', async () => {
      const error = new Error('write failed');
      const store = createMockStore({
        set: vi.fn().mockRejectedValue(error),
      });
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(saveToStore(store, 'test-key', 'data')).rejects.toThrow('write failed');
      expect(errorSpy).toHaveBeenCalledWith('保存数据到 test-key 失败:', error);

      errorSpy.mockRestore();
    });
  });

  describe('loadFromStore', () => {
    it('应该返回已有数据 当 store.get 返回有效值', async () => {
      const testData = { name: 'existing' };
      const store = createMockStore({
        get: vi.fn().mockResolvedValue(testData),
      });

      const result = await loadFromStore(store, 'test-key', { name: 'default' });

      expect(result).toEqual(testData);
      expect(store.init).toHaveBeenCalledOnce();
    });

    it('应该返回默认值并记录日志 当数据不存在', async () => {
      const store = createMockStore({
        get: vi.fn().mockResolvedValue(null),
      });
      const defaultValue = { name: 'default' };
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await loadFromStore(store, 'test-key', defaultValue);

      expect(result).toEqual(defaultValue);
      expect(logSpy).toHaveBeenCalledWith('test-key 数据不存在，返回默认值');

      logSpy.mockRestore();
    });

    it('应该返回默认值并记录错误 当 store.get 抛出异常', async () => {
      const error = new Error('read failed');
      const store = createMockStore({
        get: vi.fn().mockRejectedValue(error),
      });
      const defaultValue = { name: 'default' };
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await loadFromStore(store, 'test-key', defaultValue);

      expect(result).toEqual(defaultValue);
      expect(errorSpy).toHaveBeenCalledWith('从 test-key 加载数据失败:', error);

      errorSpy.mockRestore();
    });
  });
});
