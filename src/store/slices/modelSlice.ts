import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Model } from '@/types/model';
import { loadModels, saveModels } from '../vaults/modelVault';

// 模型管理状态接口定义
export interface ModelSliceState {
  models: Model[]; // 所有模型列表
  loading: boolean; // 加载状态
  error: string | null; // 操作错误信息
  initializationError: string | null; // 初始化错误信息
}

// 模型管理的初始状态
const initialState: ModelSliceState = {
  models: [], // 所有模型列表
  loading: false, // 加载状态
  error: null, // 操作错误信息
  initializationError: null, // 初始化错误信息
};

// 异步action：初始化模型数据
export const initializeModels = createAsyncThunk(
  'models/initialize',
  async () => {
    try {
      return await loadModels();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '初始化模型数据失败');
    }
  },
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
    // 新建模型
    createModel: (state, action: PayloadAction<{ model: Model }>) => {
      const updatedModels: Model[] = [...state.models, action.payload.model]

      // 保存
      state.models = updatedModels
      saveModels(updatedModels)
    },
    // 编辑模型
    editModel: (state, action: PayloadAction<{ model: Model }>) => {
      const {
        model,
      } = action.payload
      const updatedModels: Model[] = [...state.models]

      const idx = updatedModels.findIndex(item => item.id === model.id)
      if (idx !== -1) {
        updatedModels[idx] = { ...model }
      }

      // 保存
      state.models = updatedModels
      saveModels(updatedModels)
    },
    // 删除模型
    deleteModel: (state, action: PayloadAction<{ model: Model }>) => {
      const {
        model,
      } = action.payload

      // 不使用filter，而是定位删除，是尽可能避免遍历整个数组
      const updatedModels: Model[] = [...state.models]
      const idx = updatedModels.findIndex(item => {
        return item.id === model.id
      })
      if (idx !== -1) {
        updatedModels.splice(idx, 1)
      }

      // 保存
      state.models = updatedModels
      saveModels(updatedModels)
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
  },
});

// 导出actions
export const {
  clearError,
  clearInitializationError,
  createModel,
  editModel,
  deleteModel,
} = modelSlice.actions;

// 导出reducer
export default modelSlice.reducer;