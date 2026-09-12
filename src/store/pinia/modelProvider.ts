import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
  fetchRemoteData,
  saveCachedProviderData,
  loadCachedProviderData,
  RemoteDataError,
  type RemoteProviderData,
} from '@/services/modelRemote';
import { ALLOWED_REMOTE_MODEL_PROVIDERS } from '@/services/modelRemote/config';

/**
 * 模型供应商 Store（Pinia 版）
 *
 * 状态与动作与迁移前 Redux modelProvider slice 一致：
 * - 初始化（缓存优先，无缓存时远程请求）
 * - 后台静默刷新（失败静默，带并发锁）
 * - 手动刷新（供设置页调用）
 */
export const useModelProviderStore = defineStore('modelProvider', () => {
  // ==== State ====
  /** 过滤后的供应商数据数组 */
  const providers = ref<RemoteProviderData[]>([]);
  /** 加载状态 */
  const loading = ref(false);
  /** 错误信息 */
  const error = ref<string | null>(null);
  /** 最后更新时间（ISO 8601 格式） */
  const lastUpdate = ref<string | null>(null);
  /** 后台刷新进行中标志 */
  const backgroundRefreshing = ref(false);

  // ==== Actions ====

  /** 清除错误信息 */
  const clearError = () => {
    error.value = null;
  };

  /**
   * Provider 初始化
   * 应用启动时调用，优先使用缓存数据（快速路径），无缓存时才等待远程请求
   * @returns 过滤后的供应商数据，失败时为空数组（错误信息记录在 error 中）
   */
  const initializeModelProvider = async (): Promise<RemoteProviderData[]> => {
    loading.value = true;
    error.value = null;

    // 1️⃣ 快速路径：先尝试加载缓存
    try {
      const cachedData = await loadCachedProviderData(ALLOWED_REMOTE_MODEL_PROVIDERS);

      // 验证缓存数据完整性
      if (!Array.isArray(cachedData) || cachedData.length === 0) {
        throw new Error('Invalid cache data format');
      }

      // 缓存存在且有效，立即返回
      loading.value = false;
      providers.value = cachedData;
      lastUpdate.value = null;
      error.value = null;
      return providers.value;
    } catch (cacheError) {
      // 缓存不存在或无效，继续尝试远程请求
      void cacheError;
    }

    // 2️⃣ 无缓存，尝试远程请求
    try {
      const { fullApiResponse, filteredData } = await fetchRemoteData();

      // 保存完整响应到缓存
      await saveCachedProviderData(fullApiResponse);

      // 返回过滤后的数据用于存储
      loading.value = false;
      providers.value = filteredData;
      lastUpdate.value = new Date().toISOString();
      error.value = null;
      return providers.value;
    } catch (err) {
      // 3️⃣ 远程请求失败，无缓存可用
      void err;
      loading.value = false;
      error.value = '无法获取模型供应商数据，请检查网络连接';
      providers.value = [];
      lastUpdate.value = null;
      return providers.value;
    }
  };

  /**
   * 后台静默刷新
   * 在初始化完成后异步触发，失败时静默处理（不显示错误提示）
   */
  const silentRefreshModelProvider = async (): Promise<void> => {
    // 设置后台刷新锁，防止并发
    backgroundRefreshing.value = true;

    console.log('[silentRefreshModelProvider] 开始发起远程请求');
    try {
      const { fullApiResponse, filteredData } = await fetchRemoteData();
      console.log('[silentRefreshModelProvider] 远程请求成功', filteredData.length);
      await saveCachedProviderData(fullApiResponse);

      backgroundRefreshing.value = false;
      providers.value = filteredData;
      lastUpdate.value = new Date().toISOString();
      // 只有当前有错误时才清除（表示成功恢复了）
      if (error.value !== null) {
        error.value = null;
      }
    } catch (err) {
      // 静默失败，保持所有现有状态（包括 error、providers、lastUpdate）
      void err;
      console.log('[silentRefreshModelProvider] 远程请求失败', err);
      backgroundRefreshing.value = false;
    }
  };

  /**
   * 刷新 Provider
   * 用于设置页面的手动刷新
   */
  const refreshModelProvider = async (signal?: AbortSignal): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      // 1. 强制从远程获取最新数据
      const { fullApiResponse, filteredData } = await fetchRemoteData({
        forceRefresh: true,
        signal,
      });

      // 2. 更新缓存（保存完整响应）
      await saveCachedProviderData(fullApiResponse);

      // 3. 返回过滤后的数据用于存储
      loading.value = false;
      providers.value = filteredData;
      lastUpdate.value = new Date().toISOString();
      error.value = null;
    } catch (err) {
      loading.value = false;
      if (err instanceof RemoteDataError) {
        error.value = err.message;
      } else {
        error.value = '刷新失败，请稍后重试';
      }
    }
  };

  /**
   * 触发后台静默刷新（如果当前没有正在进行的刷新）
   * 用于在应用初始化后自动触发后台刷新，以保持数据新鲜度
   */
  const triggerSilentRefreshIfNeeded = (): void => {
    console.log('[triggerSilentRefreshIfNeeded] 准备触发后台静默刷新', {
      loading: loading.value,
      backgroundRefreshing: backgroundRefreshing.value,
      providersCount: providers.value.length,
      error: error.value,
    });

    // 在触发之前检查是否已有后台刷新在进行
    if (!backgroundRefreshing.value) {
      console.log('[triggerSilentRefreshIfNeeded] 触发后台静默刷新');
      void silentRefreshModelProvider();
    } else {
      console.log('[triggerSilentRefreshIfNeeded] 已有后台刷新在进行，跳过');
    }
  };

  return {
    // state
    providers,
    loading,
    error,
    lastUpdate,
    backgroundRefreshing,
    // actions
    clearError,
    initializeModelProvider,
    silentRefreshModelProvider,
    refreshModelProvider,
    triggerSilentRefreshIfNeeded,
  };
});
