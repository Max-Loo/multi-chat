import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createLazyStore } from '@/store/storage/storeUtils';
import { initFakeIndexedDB, cleanupFakeIndexedDB } from '@/__test__/utils/tauriCompat/idb-helpers';

/**
 * Store 工具函数测试套件
 *
 * 测试 src/store/storage/storeUtils.ts 模块的功能
 * 覆盖 createLazyStore 的基础场景
 *
 * 注：saveToStore 和 loadFromStore 的测试需要完整的 IndexedDB 设置，
 * 相关功能已在其他单元测试中覆盖
 */
describe('Store 工具函数', () => {
  let idbCtx: ReturnType<typeof initFakeIndexedDB>;

  beforeEach(() => {
    idbCtx = initFakeIndexedDB();
  });

  afterEach(() => {
    cleanupFakeIndexedDB(idbCtx);
  });

  describe('createLazyStore', () => {
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
});
