import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState, AppDispatch } from "@/store";
import {
  fetchRemoteData,
  saveCachedProviderData,
  loadCachedProviderData,
  RemoteDataError,
  type RemoteProviderData,
} from "@/services/modelRemote";
import { ALLOWED_REMOTE_MODEL_PROVIDERS } from "@/services/modelRemote/config";

/**
 * Redux store 接口（仅包含需要的方法）
 */
interface StoreInterface {
  getState: () => RootState;
  dispatch: AppDispatch;
}

/**
 * Model Provider Slice 状态接口
 */
export interface ModelProviderSliceState {
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

/**
 * 初始状态
 */
const initialState: ModelProviderSliceState = {
  providers: [],
  loading: false,
  error: null,
  lastUpdate: null,
  backgroundRefreshing: false,
};

/**
 * Provider 初始化 Thunk
 * 应用启动时调用，优先使用缓存数据（快速路径），无缓存时才等待远程请求
 */
export const initializeModelProvider = createAsyncThunk(
  "modelProvider/initialize",
  async (_, { rejectWithValue }) => {
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
      return {
        providers: cachedData,
        lastUpdate: null,
      };
    } catch (cacheError) {
      // 缓存不存在或无效，继续尝试远程请求
      void cacheError;
    }

    // 2️⃣ 无缓存，尝试远程请求
    try {
      const { fullApiResponse, filteredData } = await fetchRemoteData();

      // 保存完整响应到缓存
      await saveCachedProviderData(fullApiResponse);

      // 返回过滤后的数据用于存储到 Redux store
      return {
        providers: filteredData,
        lastUpdate: new Date().toISOString(),
      };
    } catch (error) {
      // 3️⃣ 远程请求失败，无缓存可用
      // 忽略 error 未使用的警告
      void error;
      return rejectWithValue({
        providers: [],
        lastUpdate: null,
        error: "无法获取模型供应商数据，请检查网络连接",
      });
    }
  },
);

/**
 * 后台静默刷新 Provider Thunk
 * 在初始化完成后异步触发，失败时静默处理（不显示错误提示）
 */
export const silentRefreshModelProvider = createAsyncThunk(
  "modelProvider/silentRefresh",
  async (_, { rejectWithValue }) => {
    console.log("[silentRefreshModelProvider] 开始发起远程请求");
    try {
      const { fullApiResponse, filteredData } = await fetchRemoteData();
      console.log(
        "[silentRefreshModelProvider] 远程请求成功",
        filteredData.length,
      );
      await saveCachedProviderData(fullApiResponse);
      return {
        providers: filteredData,
        lastUpdate: new Date().toISOString(),
      };
    } catch (error) {
      // 静默失败，返回空对象，extraReducers 不处理
      // 忽略 error 未使用的警告
      void error;
      console.log("[silentRefreshModelProvider] 远程请求失败", error);
      return rejectWithValue({});
    }
  },
);

/**
 * 刷新 Provider Thunk
 * 用于设置页面的手动刷新
 */
export const refreshModelProvider = createAsyncThunk(
  "modelProvider/refresh",
  async (_, { signal, rejectWithValue }) => {
    try {
      // 1. 强制从远程获取最新数据
      const { fullApiResponse, filteredData } = await fetchRemoteData({
        forceRefresh: true,
        signal,
      });

      // 2. 更新缓存（保存完整响应）
      await saveCachedProviderData(fullApiResponse);

      // 3. 返回过滤后的数据用于存储到 Redux store
      return {
        providers: filteredData,
        lastUpdate: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof RemoteDataError) {
        return rejectWithValue({
          error: error.message,
        });
      }
      return rejectWithValue({
        error: "刷新失败，请稍后重试",
      });
    }
  },
);

/**
 * Model Provider Slice
 */
const modelProviderSlice = createSlice({
  name: "modelProvider",
  initialState,
  reducers: {
    /**
     * 清除错误信息
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // initializeModelProvider
    builder
      .addCase(initializeModelProvider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeModelProvider.fulfilled, (state, action) => {
        state.loading = false;
        state.providers = action.payload.providers;
        state.lastUpdate = action.payload.lastUpdate;
        state.error = null;
      })
      .addCase(initializeModelProvider.rejected, (state, action) => {
        state.loading = false;
        // 如果有 rejectWithValue 的错误，使用它；否则使用默认错误
        if (
          action.payload &&
          typeof action.payload === "object" &&
          "error" in action.payload
        ) {
          state.error = (action.payload as { error: string }).error;
          // 如果有缓存数据，也保存到 state
          if ("providers" in action.payload) {
            state.providers = (
              action.payload as { providers: RemoteProviderData[] }
            ).providers;
          }
        } else {
          state.error =
            action.error.message || "Failed to initialize model providers";
        }
      });

    // silentRefreshModelProvider
    builder
      .addCase(silentRefreshModelProvider.pending, (state) => {
        // 设置后台刷新锁，防止并发
        state.backgroundRefreshing = true;
      })
      .addCase(silentRefreshModelProvider.fulfilled, (state, action) => {
        state.backgroundRefreshing = false;
        state.providers = action.payload.providers;
        state.lastUpdate = action.payload.lastUpdate;
        // 只有当前有错误时才清除（表示成功恢复了）
        if (state.error !== null) {
          state.error = null;
        }
      })
      .addCase(silentRefreshModelProvider.rejected, (state) => {
        // 释放后台刷新锁
        state.backgroundRefreshing = false;
        // 静默失败，保持所有现有状态（包括 error、providers、lastUpdate）
        // 不做任何修改，让用户继续使用当前数据
      });

    // refreshModelProvider
    builder
      .addCase(refreshModelProvider.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshModelProvider.fulfilled, (state, action) => {
        state.loading = false;
        state.providers = action.payload.providers;
        state.lastUpdate = action.payload.lastUpdate;
        state.error = null;
      })
      .addCase(refreshModelProvider.rejected, (state, action) => {
        state.loading = false;
        // 如果有 rejectWithValue 的错误，使用它；否则使用默认错误
        if (
          action.payload &&
          typeof action.payload === "object" &&
          "error" in action.payload
        ) {
          state.error = (action.payload as { error: string }).error;
        } else {
          state.error =
            action.error.message || "Failed to refresh model providers";
        }
      });
  },
});

export const { clearError } = modelProviderSlice.actions;
export default modelProviderSlice.reducer;

/**
 * 触发后台静默刷新（如果当前没有正在进行的刷新）
 *
 * 此函数用于在应用初始化后自动触发后台刷新，以保持数据新鲜度。
 * 它会检查当前是否已有后台刷新在进行，避免并发刷新。
 *
 * @param store Redux store 实例
 */
export function triggerSilentRefreshIfNeeded(store: StoreInterface): void {
  const state = store.getState();
  const modelProviderState = state.modelProvider;

  console.log("[triggerSilentRefreshIfNeeded] 准备触发后台静默刷新", {
    loading: modelProviderState.loading,
    backgroundRefreshing: modelProviderState.backgroundRefreshing,
    providersCount: modelProviderState.providers.length,
    error: modelProviderState.error,
  });

  // 在 dispatch 之前检查是否已有后台刷新在进行
  if (!modelProviderState.backgroundRefreshing) {
    console.log("[triggerSilentRefreshIfNeeded] 触发后台静默刷新");
    store.dispatch(silentRefreshModelProvider());
  } else {
    console.log("[triggerSilentRefreshIfNeeded] 已有后台刷新在进行，跳过");
  }
}
