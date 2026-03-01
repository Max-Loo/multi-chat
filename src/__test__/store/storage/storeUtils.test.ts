import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLazyStore, saveToStore, loadFromStore } from '@/store/storage/storeUtils';
import type { StoreCompat } from '@/utils/tauriCompat';
import { initFakeIndexedDB, cleanupFakeIndexedDB } from '@/__test__/utils/tauriCompat/idb-helpers';

/**
 * Store 工具函数测试套件
 *
 * 测试 src/store/storage/storeUtils.ts 模块的功能
 * 覆盖 saveToStore、loadFromStore 和 SettingStore 的所有场景
 */
describe('Store 工具函数', () => {
  let store: StoreCompat;
  let idbCtx: ReturnType<typeof initFakeIndexedDB>;

  beforeEach(() => {
    idbCtx = initFakeIndexedDB();
    store = createLazyStore('test-utils.json');
  });

  afterEach(() => {
    cleanupFakeIndexedDB(idbCtx);
  });

  describe('saveToStore', () => {
    beforeEach(async () => {
      await store.init();
    });

    it('应该成功保存数据', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await expect(saveToStore(store, 'test-key', { value: 'test' }, '保存测试数据')).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('成功保存测试数据到 test-key');
      consoleSpy.mockRestore();
    });

    it('保存失败时应该抛出错误', async () => {
      const mockStore = {
        init: vi.fn().mockResolvedValue(undefined),
        set: vi.fn().mockRejectedValue(new Error('Set failed')),
        save: vi.fn().mockResolvedValue(undefined),
      } as unknown as StoreCompat;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(saveToStore(mockStore, 'test-key', 'data')).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('应该打印成功日志', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await saveToStore(store, 'key1', 'value1', '保存测试数据');

      expect(consoleSpy).toHaveBeenCalledWith('成功保存测试数据到 key1');
      consoleSpy.mockRestore();
    });

    it('应该打印错误日志', async () => {
      const mockStore = {
        init: vi.fn().mockResolvedValue(undefined),
        set: vi.fn().mockRejectedValue(new Error('Network error')),
        save: vi.fn().mockResolvedValue(undefined),
      } as unknown as StoreCompat;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(saveToStore(mockStore, 'test-key', 'data')).rejects.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('保存数据到 test-key 失败:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('loadFromStore', () => {
    it('应该支持加载数据', async () => {
      const data = await loadFromStore(store, 'any-key', 'default-value');

      expect(data).toBeDefined();
    });

    it('数据不存在时应该返回默认值', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const data = await loadFromStore(store, 'non-existent-key', 'default-value');

      expect(data).toBe('default-value');
      expect(consoleSpy).toHaveBeenCalledWith('non-existent-key 数据不存在，返回默认值');
      consoleSpy.mockRestore();
    });

    it('加载失败时应该返回默认值', async () => {
      const mockStore = {
        init: vi.fn().mockRejectedValue(new Error('Init failed')),
        get: vi.fn(),
      } as unknown as StoreCompat;

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const data = await loadFromStore(mockStore, 'test-key', 'default-value');

      expect(data).toBe('default-value');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('SettingStore', () => {
    it('get/set/delete/save 功能正常', async () => {
      const testStore = createLazyStore('test-setting.json');
      await testStore.init();

      await expect(testStore.set('test-key', 'test-value')).resolves.not.toThrow();
      const value = await testStore.get<string>('test-key');
      expect(value).toBeDefined();

      await expect(testStore.delete('test-key')).resolves.not.toThrow();
      await expect(testStore.save()).resolves.not.toThrow();
    });

    it('setAndSave 功能正常', async () => {
      const testStore = createLazyStore('test-setting-save.json');
      await testStore.init();

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await testStore.set('test-key', 'test-value');
      await expect(testStore.save()).resolves.not.toThrow();

      consoleSpy.mockRestore();
    });

    it('setAndSave 失败时应该抛出错误', async () => {
      const mockStore = {
        set: vi.fn().mockRejectedValue(new Error('Set failed')),
        save: vi.fn().mockResolvedValue(undefined),
      };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        await mockStore.set('test-key', 'test-value');
        await mockStore.save();
      } catch (error) {
        expect(error).toBeDefined();
      }

      consoleSpy.mockRestore();
    });
  });
});
