import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchRemoteData,
  saveCachedProviderData,
  loadCachedProviderData,
  RemoteDataError,
  type RemoteProviderData,
} from '@/services/modelRemoteService';
import { ALLOWED_MODEL_PROVIDERS } from '@/utils/constants';

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
}

/**
 * 初始状态
 */
const initialState: ModelProviderSliceState = {
  providers: [],
  loading: false,
  error: null,
  lastUpdate: null,
};

/**
 * Provider 初始化 Thunk
 * 应用启动时调用，从远程获取数据或降级到缓存
 */
export const initializeModelProvider = createAsyncThunk(
  'modelProvider/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // 1. 尝试从远程获取最新数据
      const { fullApiResponse, filteredData } = await fetchRemoteData();
      
      // 2. 保存完整响应到缓存
      await saveCachedProviderData(fullApiResponse);

      // 3. 返回过滤后的数据用于存储到 Redux store
      return {
        providers: filteredData,
        lastUpdate: new Date().toISOString(),
      };
    } catch (error) {
      // 5. 降级到缓存（加载时过滤）
      try {
        const cachedData = await loadCachedProviderData(ALLOWED_MODEL_PROVIDERS);

        // 返回错误信息和缓存数据以便在 UI 中显示（但应用仍可用）
        return rejectWithValue({
          providers: cachedData,
          lastUpdate: null,
          error: error instanceof RemoteDataError ? error.message : '远程数据获取失败，已使用缓存',
        });
      } catch (cacheError) {
        // 缓存也不存在，应用无法使用
        // 忽略 cacheError 未使用的警告
        void cacheError;
        return rejectWithValue({
          providers: [],
          lastUpdate: null,
          error: '无法获取模型供应商数据，请检查网络连接',
        });
      }
    }
  }
);

/**
 * 刷新 Provider Thunk
 * 用于设置页面的手动刷新
 */
export const refreshModelProvider = createAsyncThunk(
  'modelProvider/refresh',
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
        error: '刷新失败，请稍后重试',
      });
    }
  }
);

/**
 * Model Provider Slice
 */
const modelProviderSlice = createSlice({
  name: 'modelProvider',
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
        if (action.payload && typeof action.payload === 'object' && 'error' in action.payload) {
          state.error = (action.payload as { error: string }).error;
          // 如果有缓存数据，也保存到 state
          if ('providers' in action.payload) {
            state.providers = (action.payload as { providers: RemoteProviderData[] }).providers;
          }
        } else {
          state.error = action.error.message || 'Failed to initialize model providers';
        }
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
        if (action.payload && typeof action.payload === 'object' && 'error' in action.payload) {
          state.error = (action.payload as { error: string }).error;
        } else {
          state.error = action.error.message || 'Failed to refresh model providers';
        }
      });
  },
});

export const { clearError } = modelProviderSlice.actions;
export default modelProviderSlice.reducer;
