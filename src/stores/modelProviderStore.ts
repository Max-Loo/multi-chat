/**
 * 模型供应商状态（Pinia）
 *
 * 对应既有 Redux slice：src/store/slices/modelProviderSlice.ts
 * - initializeModelProvider：快速路径（缓存优先）+ 远程回退
 * - silentRefreshModelProvider：后台静默刷新，失败保持现状
 * - refreshModelProvider：手动强制刷新
 */
import { defineStore } from 'pinia';
import {
  fetchRemoteData,
  saveCachedProviderData,
  loadCachedProviderData,
  RemoteDataError,
  type RemoteProviderData,
} from '@/services/modelRemote';
import { ALLOWED_REMOTE_MODEL_PROVIDERS } from '@/services/modelRemote/config';

/** 模型供应商状态接口（复用既有 slice 状态形状） */
export interface ModelProviderStoreState {
  /** 过滤后的供应商数据数组 */
  providers: RemoteProviderData[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: string | null;
  /** 最后更新时间（ISO 8601 格式） */
  lastUpdate: string | null;
  /** 后台刷新进行中标志 */
  backgroundRefreshing: boolean;
}

export const useModelProviderStore = defineStore('modelProvider', {
  state: (): ModelProviderStoreState => ({
    providers: [],
    loading: false,
    error: null,
    lastUpdate: null,
    backgroundRefreshing: false,
  }),
  actions: {
    /** 清除错误信息 */
    clearError() {
      this.error = null;
    },

    /**
     * Provider 初始化（对应 initializeModelProvider thunk）
     * 应用启动时调用，优先使用缓存数据（快速路径），无缓存时才等待远程请求
     */
    async initializeModelProvider(): Promise<void> {
      this.loading = true;
      this.error = null;

      // 1️⃣ 快速路径：先尝试加载缓存
      try {
        const cachedData = await loadCachedProviderData(ALLOWED_REMOTE_MODEL_PROVIDERS);

        // 验证缓存数据完整性
        if (!Array.isArray(cachedData) || cachedData.length === 0) {
          throw new Error('Invalid cache data format');
        }

        // 缓存存在且有效，立即返回
        this.providers = cachedData;
        this.lastUpdate = null;
        this.loading = false;
        return;
      } catch {
        // 缓存不存在或无效，继续尝试远程请求
      }

      // 2️⃣ 无缓存，尝试远程请求
      try {
        const { fullApiResponse, filteredData } = await fetchRemoteData();

        // 保存完整响应到缓存
        await saveCachedProviderData(fullApiResponse);

        this.providers = filteredData;
        this.lastUpdate = new Date().toISOString();
        this.error = null;
        this.loading = false;
      } catch {
        // 3️⃣ 远程请求失败，无缓存可用
        this.loading = false;
        this.error = '无法获取模型供应商数据，请检查网络连接';
      }
    },

    /**
     * 后台静默刷新 Provider（对应 silentRefreshModelProvider thunk）
     * 在初始化完成后异步触发，失败时静默处理（不显示错误提示、保持现有状态）
     */
    async silentRefreshModelProvider(): Promise<void> {
      // 设置后台刷新锁，防止并发
      this.backgroundRefreshing = true;

      console.log('[silentRefreshModelProvider] 开始发起远程请求');
      try {
        const { fullApiResponse, filteredData } = await fetchRemoteData();
        console.log('[silentRefreshModelProvider] 远程请求成功', filteredData.length);
        await saveCachedProviderData(fullApiResponse);

        this.backgroundRefreshing = false;
        this.providers = filteredData;
        this.lastUpdate = new Date().toISOString();
        // 只有当前有错误时才清除（表示成功恢复了）
        if (this.error !== null) {
          this.error = null;
        }
      } catch (error) {
        console.log('[silentRefreshModelProvider] 远程请求失败', error);
        // 静默失败：释放锁并保持所有现有状态（包括 error、providers、lastUpdate）
        this.backgroundRefreshing = false;
      }
    },

    /**
     * 刷新 Provider（对应 refreshModelProvider thunk）
     * 用于设置页面的手动刷新
     */
    async refreshModelProvider(): Promise<void> {
      this.loading = true;
      this.error = null;

      try {
        // 1. 强制从远程获取最新数据
        const { fullApiResponse, filteredData } = await fetchRemoteData({
          forceRefresh: true,
        });

        // 2. 更新缓存（保存完整响应）
        await saveCachedProviderData(fullApiResponse);

        // 3. 更新状态
        this.providers = filteredData;
        this.lastUpdate = new Date().toISOString();
        this.error = null;
        this.loading = false;
      } catch (error) {
        this.loading = false;
        if (error instanceof RemoteDataError) {
          this.error = error.message;
        } else {
          this.error = '刷新失败，请稍后重试';
        }
      }
    },

    /**
     * 触发后台静默刷新（如果当前没有正在进行的刷新）
     * 用于在应用初始化后自动触发后台刷新，以保持数据新鲜度
     */
    triggerSilentRefreshIfNeeded(): void {
      console.log('[triggerSilentRefreshIfNeeded] 准备触发后台静默刷新', {
        loading: this.loading,
        backgroundRefreshing: this.backgroundRefreshing,
        providersCount: this.providers.length,
        error: this.error,
      });

      if (!this.backgroundRefreshing) {
        console.log('[triggerSilentRefreshIfNeeded] 触发后台静默刷新');
        void this.silentRefreshModelProvider();
      } else {
        console.log('[triggerSilentRefreshIfNeeded] 已有后台刷新在进行，跳过');
      }
    },
  },
});
