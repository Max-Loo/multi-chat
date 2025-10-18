import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Model, ModelState } from '@/types/model';
import { loadModels, saveModels } from '@/store/storage/modelStorage';

// 模型管理的初始状态
const initialState: ModelState = {
  models: [],                      // 所有模型列表
  loading: false,                  // 加载状态
  error: null,                     // 操作错误信息
  initializationError: null,       // 初始化错误信息
};

// 异步action：初始化模型数据
export const initializeModels = createAsyncThunk(
  'models/initialize',
  async () => {
    try {
      return await loadModels();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to initialize models');
    }
  }
);

interface DeleteModelParams {
  modelId: string,
  models: Model[]
}

// 异步action：删除指定模型
export const deleteModel = createAsyncThunk(
  'models/delete',
  async (
    {
      modelId,
      models
    } : DeleteModelParams,
    { rejectWithValue }
  ) => {
    try {
      const updatedModels = models.filter((model: Model) => model.id !== modelId);
      saveModels(updatedModels)
      return updatedModels;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete model');
    }
  }
);

// 模型管理的Redux slice
const modelSlice = createSlice({
  name: 'models',
  initialState,
  reducers: {
    // 清除操作错误信息
    clearError: (state) => {
      state.error = null;
    },
    // 清除初始化错误信息
    clearInitializationError: (state) => {
      state.initializationError = null;
    },
  },
  // 处理异步action的状态变化
  extraReducers: (builder) => {
    builder
      // 初始化模型数据开始
      .addCase(initializeModels.pending, (state) => {
        state.loading = true;
        state.initializationError = null;
      })
      // 初始化模型数据成功
      .addCase(initializeModels.fulfilled, (state, action) => {
        state.loading = false;
        state.models = action.payload;
      })
      // 初始化模型数据失败
      .addCase(initializeModels.rejected, (state, action) => {
        state.loading = false;
        state.initializationError = action.error.message || '初始化文件失败';
      })
      // 删除模型开始
      .addCase(deleteModel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 删除模型成功
      .addCase(deleteModel.fulfilled, (state, action) => {
        state.loading = false;
        state.models = action.payload;
      })
      // 删除模型失败
      .addCase(deleteModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || '删除文件失败';
      });
  },
});

// 导出actions
export const { clearError, clearInitializationError } = modelSlice.actions;

// 导出reducer
export default modelSlice.reducer;