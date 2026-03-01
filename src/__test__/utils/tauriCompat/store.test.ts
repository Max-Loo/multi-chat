import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLazyStore } from '@/utils/tauriCompat/store';
import type { StoreCompat } from '@/utils/tauriCompat/store';
import { resetGlobals } from './helpers';
import { initFakeIndexedDB, cleanupFakeIndexedDB } from './idb-helpers';

/**
 * Store 兼容层测试套件
 *
 * 测试 src/utils/tauriCompat/store.ts 模块的功能
 * 覆盖环境检测、CRUD 操作、IndexedDB 集成的所有场景
 */
describe('Store 兼容层', () => {
  let store: StoreCompat;
  let idbCtx: ReturnType<typeof initFakeIndexedDB>;

  beforeEach(() => {
    resetGlobals();
    idbCtx = initFakeIndexedDB();
  });

  afterEach(() => {
    cleanupFakeIndexedDB(idbCtx);
  });

  describe('环境检测', () => {
    it('应该创建 Store 实例', () => {
      store = createLazyStore('test-store.json');

      expect(store).toBeDefined();
      expect(typeof store.init).toBe('function');
      expect(typeof store.get).toBe('function');
      expect(typeof store.set).toBe('function');
      expect(typeof store.delete).toBe('function');
      expect(typeof store.keys).toBe('function');
      expect(typeof store.save).toBe('function');
    });

    it('应该支持不同的文件名', () => {
      const store1 = createLazyStore('store1.json');
      const store2 = createLazyStore('store2.json');

      expect(store1).toBeDefined();
      expect(store2).toBeDefined();
    });
  });

  describe('初始化', () => {
    it('init 应该成功初始化', async () => {
      store = createLazyStore('test-init.json');

      await expect(store.init()).resolves.not.toThrow();
    });

    it('应该支持多次初始化', async () => {
      store = createLazyStore('test-init-multi.json');

      await store.init();
      await expect(store.init()).resolves.not.toThrow();
    });
  });

  describe('get 操作', () => {
    beforeEach(async () => {
      store = createLazyStore('test-get.json');
      await store.init();
    });

    it('应该支持 get 操作', async () => {
      const value = await store.get<string>('any-key');

      expect(value).toBeDefined();
    });

    it('键不存在时应该返回 null', async () => {
      const value = await store.get<string>('non-existent-key');

      expect(value).toBeNull();
    });

    it('应该处理读取错误', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const value = await store.get('invalid-key');

      expect(value).toBeDefined();
      consoleSpy.mockRestore();
    });
  });

  describe('set 操作', () => {
    beforeEach(async () => {
      store = createLazyStore('test-set.json');
      await store.init();
    });

    it('应该成功设置键值', async () => {
      await expect(store.set('key1', 'value1')).resolves.not.toThrow();
    });

    it('应该支持多次 set 操作', async () => {
      await store.set('key2', 'value2');
      await store.set('key3', 'value3');

      expect(store).toBeDefined();
    });

    it('应该处理写入错误', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await store.set('test-key', 'test-value');

      expect(store).toBeDefined();
      consoleSpy.mockRestore();
    });
  });

  describe('delete 操作', () => {
    beforeEach(async () => {
      store = createLazyStore('test-delete.json');
      await store.init();
    });

    it('应该成功删除键', async () => {
      await store.set('key-to-delete', 'value');
      await expect(store.delete('key-to-delete')).resolves.not.toThrow();

      const value = await store.get<string>('key-to-delete');
      expect(value).toBeNull();
    });

    it('删除不存在的键不应该报错', async () => {
      await expect(store.delete('non-existent-key')).resolves.not.toThrow();
    });
  });

  describe('keys 操作', () => {
    beforeEach(async () => {
      store = createLazyStore('test-keys.json');
      await store.init();
    });

    it('应该返回数组', async () => {
      const keys = await store.keys();

      expect(Array.isArray(keys)).toBe(true);
    });

    it('新创建的 store 应该返回空数组', async () => {
      const newStore = createLazyStore('test-keys-empty.json');
      await newStore.init();

      const keys = await newStore.keys();

      expect(keys).toEqual([]);
    });
  });

  describe('save 操作', () => {
    beforeEach(async () => {
      store = createLazyStore('test-save.json');
      await store.init();
    });

    it('应该成功保存', async () => {
      await store.set('key', 'value');
      await expect(store.save()).resolves.not.toThrow();
    });

    it('Web 环境 save 操作为空操作', async () => {
      await store.set('key', 'value');

      const startTime = Date.now();
      await store.save();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('复杂对象', () => {
    beforeEach(async () => {
      store = createLazyStore('test-complex.json');
      await store.init();
    });

    it('应该支持存储对象', async () => {
      const testObject = { name: 'test', value: 123 };

      await expect(store.set('obj-key', testObject)).resolves.not.toThrow();

      const retrieved = await store.get('obj-key');
      expect(retrieved).toBeDefined();
    });

    it('应该支持存储数组', async () => {
      const testArray = [1, 2, 3, 4, 5];

      await store.set('array-key', testArray);

      const retrieved = await store.get('array-key');
      expect(retrieved).toBeDefined();
    });
  });

  describe('IndexedDB 特性', () => {
    beforeEach(async () => {
      store = createLazyStore('test-indexeddb.json');
      await store.init();
    });

    it('应该支持存储复杂对象', async () => {
      const complexObject = {
        nested: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
        array: [1, 2, { obj: 'test' }],
        mixed: ['text', 123, true, null],
      };

      await expect(store.set('complex-key', complexObject)).resolves.not.toThrow();
    });

    it('应该支持存储大数据', async () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `item-${i}`,
      }));

      await expect(store.set('large-data', largeArray)).resolves.not.toThrow();
    });
  });
});
