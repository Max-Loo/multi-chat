import { ref } from "vue";
import { defineStore } from "pinia";
import {
  fetchRemoteData,
  saveCachedProviderData,
  loadCachedProviderData,
  RemoteDataError,
  type RemoteProviderData,
} from "@/services/modelRemote";
import { ALLOWED_REMOTE_MODEL_PROVIDERS } from "@/services/modelRemote/config";

/**
 * Model Provider store（对应原 modelProviderSlice）
 */
export const useModelProviderStore = defineStore("modelProvider", () => {
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

  /** 清除错误信息 */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Provider 初始化（对应原 initializeModelProvider thunk）
   * 应用启动时调用，优先使用缓存数据（快速路径），无缓存时才等待远程请求
   * @returns 供应商数据与最后更新时间
   * @throws 无缓存且远程请求失败时抛出错误，错误消息写入 error 状态
   */
  async function initializeModelProvider(): Promise<{
    providers: RemoteProviderData[];
    lastUpdate: string | null;
  }> {
    loading.value = true;
    error.value = null;
    try {
      // 1️⃣ 快速路径：先尝试加载缓存
      try {
        const cachedData = await loadCachedProviderData(
          ALLOWED_REMOTE_MODEL_PROVIDERS,
        );

        // 验证缓存数据完整性
        if (!Array.isArray(cachedData) || cachedData.length === 0) {
          throw new Error("Invalid cache data format");
        }

        // 缓存存在且有效，立即返回
        providers.value = cachedData;
        lastUpdate.value = null;
        loading.value = false;
        return { providers: cachedData, lastUpdate: null };
      } catch (cacheError) {
        // 缓存不存在或无效，继续尝试远程请求
        void cacheError;
      }

      // 2️⃣ 无缓存，尝试远程请求
      const { fullApiResponse, filteredData } = await fetchRemoteData();
      await saveCachedProviderData(fullApiResponse);

      providers.value = filteredData;
      lastUpdate.value = new Date().toISOString();
      loading.value = false;
      error.value = null;
      return { providers: filteredData, lastUpdate: lastUpdate.value };
    } catch (err) {
      loading.value = false;
      // 3️⃣ 远程请求失败，无缓存可用
      const message = "无法获取模型供应商数据，请检查网络连接";
      error.value = message;
      throw new Error(message, { cause: err });
    }
  }

  /**
   * 后台静默刷新（对应原 silentRefreshModelProvider thunk）
   * 在初始化完成后异步触发，失败时静默处理（不显示错误提示）
   */
  async function silentRefreshModelProvider(): Promise<void> {
    backgroundRefreshing.value = true;
    console.log("[silentRefreshModelProvider] 开始发起远程请求");
    try {
      const { fullApiResponse, filteredData } = await fetchRemoteData();
      console.log(
        "[silentRefreshModelProvider] 远程请求成功",
        filteredData.length,
      );
      await saveCachedProviderData(fullApiResponse);

      backgroundRefreshing.value = false;
      providers.value = filteredData;
      lastUpdate.value = new Date().toISOString();
      // 只有当前有错误时才清除（表示成功恢复了）
      if (error.value !== null) {
        error.value = null;
      }
    } catch (err) {
      backgroundRefreshing.value = false;
      // 静默失败，保持所有现有状态（包括 error、providers、lastUpdate）
      void err;
      console.log("[silentRefreshModelProvider] 远程请求失败", err);
    }
  }

  /**
   * 刷新 Provider（对应原 refreshModelProvider thunk）
   * 用于设置页面的手动刷新
   * @throws 请求失败时抛出错误，错误消息写入 error 状态
   */
  async function refreshModelProvider(options?: {
    signal?: AbortSignal;
  }): Promise<{
    providers: RemoteProviderData[];
    lastUpdate: string;
  }> {
    loading.value = true;
    error.value = null;
    try {
      // 1. 强制从远程获取最新数据
      const { fullApiResponse, filteredData } = await fetchRemoteData({
        forceRefresh: true,
        signal: options?.signal,
      });

      // 2. 更新缓存（保存完整响应）
      await saveCachedProviderData(fullApiResponse);

      // 3. 更新状态
      const updateAt = new Date().toISOString();
      providers.value = filteredData;
      lastUpdate.value = updateAt;
      loading.value = false;
      error.value = null;
      return { providers: filteredData, lastUpdate: updateAt };
    } catch (err) {
      loading.value = false;
      if (err instanceof RemoteDataError) {
        error.value = err.message;
      } else {
        error.value = "刷新失败，请稍后重试";
      }
      throw err;
    }
  }

  /**
   * 触发后台静默刷新（如果当前没有正在进行的刷新）
   *
   * 此函数用于在应用初始化后自动触发后台刷新，以保持数据新鲜度。
   * 它会检查当前是否已有后台刷新在进行，避免并发刷新。
   */
  function triggerSilentRefreshIfNeeded(): void {
    console.log("[triggerSilentRefreshIfNeeded] 准备触发后台静默刷新", {
      loading: loading.value,
      backgroundRefreshing: backgroundRefreshing.value,
      providersCount: providers.value.length,
      error: error.value,
    });

    if (!backgroundRefreshing.value) {
      console.log("[triggerSilentRefreshIfNeeded] 触发后台静默刷新");
      void silentRefreshModelProvider();
    } else {
      console.log("[triggerSilentRefreshIfNeeded] 已有后台刷新在进行，跳过");
    }
  }

  return {
    providers,
    loading,
    error,
    lastUpdate,
    backgroundRefreshing,
    clearError,
    initializeModelProvider,
    silentRefreshModelProvider,
    refreshModelProvider,
    triggerSilentRefreshIfNeeded,
  };
});
