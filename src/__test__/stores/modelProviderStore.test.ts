/**
 * modelProviderStore 单元测试
 *
 * 覆盖：缓存快速路径、远程回退、静默刷新保持现状、手动刷新错误、并发刷新锁。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RemoteProviderData } from '@/services/modelRemote';

const mockFetchRemoteData = vi.fn();
const mockSaveCachedProviderData = vi.fn();
const mockLoadCachedProviderData = vi.fn();

vi.mock('@/services/modelRemote', () => ({
  fetchRemoteData: (...args: unknown[]) => mockFetchRemoteData(...args),
  saveCachedProviderData: (...args: unknown[]) => mockSaveCachedProviderData(...args),
  loadCachedProviderData: (...args: unknown[]) => mockLoadCachedProviderData(...args),
  RemoteDataError: class extends Error {},
}));

vi.mock('@/services/modelRemote/config', () => ({
  ALLOWED_REMOTE_MODEL_PROVIDERS: ['deepseek', 'kimi', 'zhipu'],
}));

import { useModelProviderStore } from '@/stores/modelProviderStore';
import { setupPinia } from './setupPinia';

/** 构造供应商测试数据 */
const makeProviders = (): RemoteProviderData[] =>
  [
    { providerKey: 'deepseek', providerName: 'DeepSeek', api: 'https://api.deepseek.com', models: {} },
  ] as unknown as RemoteProviderData[];

describe('modelProviderStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupPinia();
  });

  describe('initializeModelProvider', () => {
    it('缓存有效时应走快速路径，不发起远程请求', async () => {
      mockLoadCachedProviderData.mockResolvedValue(makeProviders());

      const store = useModelProviderStore();
      await store.initializeModelProvider();

      expect(store.providers).toHaveLength(1);
      expect(store.lastUpdate).toBeNull();
      expect(mockFetchRemoteData).not.toHaveBeenCalled();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('无缓存时应走远程路径并更新缓存与 lastUpdate', async () => {
      mockLoadCachedProviderData.mockRejectedValue(new Error('no cache'));
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: { raw: true },
        filteredData: makeProviders(),
      });

      const store = useModelProviderStore();
      await store.initializeModelProvider();

      expect(mockFetchRemoteData).toHaveBeenCalledTimes(1);
      expect(mockSaveCachedProviderData).toHaveBeenCalledWith({ raw: true });
      expect(store.providers).toHaveLength(1);
      expect(store.lastUpdate).not.toBeNull();
      expect(store.loading).toBe(false);
    });

    it('缓存无效且远程失败时应记录错误', async () => {
      mockLoadCachedProviderData.mockRejectedValue(new Error('no cache'));
      mockFetchRemoteData.mockRejectedValue(new Error('network down'));

      const store = useModelProviderStore();
      await store.initializeModelProvider();

      expect(store.loading).toBe(false);
      expect(store.error).toBe('无法获取模型供应商数据，请检查网络连接');
    });

    it('缓存返回空数组应视为无效并走远程路径', async () => {
      mockLoadCachedProviderData.mockResolvedValue([]);
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: { raw: true },
        filteredData: makeProviders(),
      });

      const store = useModelProviderStore();
      await store.initializeModelProvider();

      expect(mockFetchRemoteData).toHaveBeenCalledTimes(1);
      expect(store.providers).toHaveLength(1);
    });
  });

  describe('silentRefreshModelProvider', () => {
    it('成功后更新数据并清除错误；失败时保持现状', async () => {
      // 场景 1：成功
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: { raw: 1 },
        filteredData: makeProviders(),
      });

      let store = useModelProviderStore();
      store.$patch({ error: '旧错误' });
      await store.silentRefreshModelProvider();

      expect(store.backgroundRefreshing).toBe(false);
      expect(store.error).toBeNull();
      expect(store.providers).toHaveLength(1);

      // 场景 2：失败时静默保持现有数据与错误
      vi.clearAllMocks();
      mockFetchRemoteData.mockRejectedValue(new Error('refresh failed'));
      store = useModelProviderStore();
      store.$patch({ error: '保留我', lastUpdate: '2026-01-01T00:00:00.000Z' });

      await store.silentRefreshModelProvider();

      expect(store.backgroundRefreshing).toBe(false);
      expect(store.error).toBe('保留我');
      expect(store.lastUpdate).toBe('2026-01-01T00:00:00.000Z');
    });
  });

  describe('refreshModelProvider', () => {
    it('应强制刷新并更新状态', async () => {
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: { raw: 2 },
        filteredData: makeProviders(),
      });

      const store = useModelProviderStore();
      await store.refreshModelProvider();

      expect(mockFetchRemoteData).toHaveBeenCalledWith(expect.objectContaining({ forceRefresh: true }));
      expect(store.providers).toHaveLength(1);
      expect(store.loading).toBe(false);
    });

    it('刷新失败时应记录错误并复位 loading', async () => {
      mockFetchRemoteData.mockRejectedValue(new Error('boom'));

      const store = useModelProviderStore();
      await store.refreshModelProvider();

      expect(store.loading).toBe(false);
      expect(store.error).toBe('刷新失败，请稍后重试');
    });
  });

  describe('triggerSilentRefreshIfNeeded', () => {
    it('无进行中刷新时应触发静默刷新', async () => {
      mockFetchRemoteData.mockResolvedValue({
        fullApiResponse: { raw: 3 },
        filteredData: makeProviders(),
      });

      const store = useModelProviderStore();
      store.triggerSilentRefreshIfNeeded();

      // 触发为异步执行，让微任务跑完
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockFetchRemoteData).toHaveBeenCalledTimes(1);
    });

    it('已有后台刷新进行时应跳过', () => {
      const store = useModelProviderStore();
      store.$patch({ backgroundRefreshing: true });

      store.triggerSilentRefreshIfNeeded();

      expect(mockFetchRemoteData).not.toHaveBeenCalled();
    });
  });
});
