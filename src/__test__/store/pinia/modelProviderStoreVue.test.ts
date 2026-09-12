/**
 * Pinia modelProvider store 单元测试（Vue 版）
 *
 * 承接被删除的 Redux 版 modelProviderSlice 测试的核心行为：
 * - 初始化：缓存优先（快速路径）→ 无缓存走远程 → 失败设置错误
 * - 后台静默刷新：成功更新、失败静默保持现状、并发锁
 * - 手动刷新：强制远程、错误分类
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

const mockLoadCachedProviderData = vi.fn();
const mockSaveCachedProviderData = vi.fn();
const mockFetchRemoteData = vi.fn();

vi.mock('@/services/modelRemote', () => ({
  loadCachedProviderData: (...args: unknown[]) => mockLoadCachedProviderData(...args),
  saveCachedProviderData: (...args: unknown[]) => mockSaveCachedProviderData(...args),
  fetchRemoteData: (...args: unknown[]) => mockFetchRemoteData(...args),
  RemoteDataError: class RemoteDataError extends Error {},
  ALLOWED_REMOTE_MODEL_PROVIDERS: [],
}));

vi.mock('@/services/modelRemote/config', () => ({
  ALLOWED_REMOTE_MODEL_PROVIDERS: [],
}));

import { useModelProviderStore } from '@/store/pinia/modelProvider';

/** 构造远程响应 mock 参数 */
const remoteResult = (count = 2) => ({
  fullApiResponse: { data: Array.from({ length: count }, (_, i) => ({ id: `p${i}` })) },
  filteredData: Array.from({ length: count }, (_, i) => ({ id: `p${i}` })),
});

describe('Pinia modelProvider store', () => {
  let store: ReturnType<typeof useModelProviderStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useModelProviderStore();
    vi.clearAllMocks();
  });

  describe('initializeModelProvider', () => {
    it('缓存有效时走快速路径，不发远程请求', async () => {
      mockLoadCachedProviderData.mockResolvedValueOnce([{ id: 'cached' }]);

      const result = await store.initializeModelProvider();

      expect(result).toEqual([{ id: 'cached' }]);
      expect(store.providers).toEqual([{ id: 'cached' }]);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(mockFetchRemoteData).not.toHaveBeenCalled();
    });

    it('缓存无效时应远程请求并写入缓存', async () => {
      mockLoadCachedProviderData.mockRejectedValueOnce(new Error('无缓存'));
      mockFetchRemoteData.mockResolvedValueOnce(remoteResult(3));

      const result = await store.initializeModelProvider();

      expect(result).toHaveLength(3);
      expect(mockSaveCachedProviderData).toHaveBeenCalled();
      expect(store.lastUpdate).not.toBeNull();
    });

    it('远程请求失败且无缓存时应设置无供应商错误', async () => {
      mockLoadCachedProviderData.mockRejectedValueOnce(new Error('无缓存'));
      mockFetchRemoteData.mockRejectedValueOnce(new Error('网络失败'));

      const result = await store.initializeModelProvider();

      expect(result).toEqual([]);
      expect(store.error).toBe('无法获取模型供应商数据，请检查网络连接');
      expect(store.loading).toBe(false);
    });
  });

  describe('silentRefreshModelProvider', () => {
    it('成功时更新 providers 并清除错误', async () => {
      store.error = '之前的错误';
      mockFetchRemoteData.mockResolvedValueOnce(remoteResult(5));

      await store.silentRefreshModelProvider();

      expect(store.providers).toHaveLength(5);
      expect(store.error).toBeNull();
      expect(store.backgroundRefreshing).toBe(false);
    });

    it('失败时静默保持现有状态', async () => {
      store.error = '既有错误';
      store.providers = [{ id: 'keep' } as never];
      mockFetchRemoteData.mockRejectedValueOnce(new Error('刷新失败'));

      await store.silentRefreshModelProvider();

      expect(store.error).toBe('既有错误');
      expect(store.providers).toEqual([{ id: 'keep' }]);
      expect(store.backgroundRefreshing).toBe(false);
    });
  });

  describe('refreshModelProvider', () => {
    it('强制远程刷新并更新缓存', async () => {
      mockFetchRemoteData.mockResolvedValueOnce(remoteResult(4));

      await store.refreshModelProvider();

      expect(mockFetchRemoteData).toHaveBeenCalledWith(expect.objectContaining({ forceRefresh: true }));
      expect(store.providers).toHaveLength(4);
      expect(store.error).toBeNull();
    });

    it('失败时区分 RemoteDataError 与通用错误', async () => {
      const { RemoteDataError } = await import('@/services/modelRemote');
      const remoteError = new (RemoteDataError as unknown as { new (message: string): Error })('远程服务不可用');
      mockFetchRemoteData.mockRejectedValueOnce(remoteError);

      await store.refreshModelProvider();

      expect(store.error).toBe('远程服务不可用');

      mockFetchRemoteData.mockRejectedValueOnce(new Error('其他错误'));
      await store.refreshModelProvider();
      expect(store.error).toBe('刷新失败，请稍后重试');
    });
  });

  describe('triggerSilentRefreshIfNeeded', () => {
    it('已有后台刷新进行中时应跳过', async () => {
      store.backgroundRefreshing = true;

      store.triggerSilentRefreshIfNeeded();
      await new Promise((r) => setTimeout(r, 5));

      expect(mockFetchRemoteData).not.toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('应清除错误信息', () => {
      store.error = 'x';
      store.clearError();
      expect(store.error).toBeNull();
    });
  });
});
