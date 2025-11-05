import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Model } from '@/types/model';
import { loadModels, saveModels } from '../vaults/modelVault';

// 模型管理状态接口定义
interface ModelState {
  models: Model[]; // 所有模型列表
  loading: boolean; // 加载状态
  error: string | null; // 操作错误信息
  initializationError: string | null; // 初始化错误信息
}

// 模型管理的初始状态
const initialState: ModelState = {
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


interface BasicModelParams {
  // 当前新增/编辑/删除的模型
  model: Model;
  // 当前已有的模型列表
  models: Model[]
}

// 异步action：删除指定模型
export const deleteModel = createAsyncThunk(
  'models/delete',
  async ({
    model,
    models,
  } : BasicModelParams,
  { rejectWithValue },
  ) => {
    try {
      // 不使用filter，而是定位删除，是尽可能避免遍历整个数组
      const updatedModels: Model[] = [...models]
      const idx = updatedModels.findIndex(item => {
        return item.id === model.id
      })
      if (idx !== -1) {
        updatedModels.splice(idx, 1)
      }

      saveModels(updatedModels)
      return updatedModels;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '删除模型失败');
    }
  },
);



// 异步action: 新增一个模型
export const createModel = createAsyncThunk(
  'model/add',
  async ({
    model,
    models,
  } : BasicModelParams, { rejectWithValue }) => {
    try {
      const updatedModels: Model[] = [...models, model]
      saveModels(updatedModels)
      return updatedModels
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '新增模型失败');
    }
  },
)

// 异步action: 编辑模型
export const editModel = createAsyncThunk(
  'model/edit',
  async ({
    model,
    models,
  } : BasicModelParams, { rejectWithValue }) => {
    try {
      const updatedModels: Model[] = [...models]

      const idx = updatedModels.findIndex(item => item.id === model.id)
      if (idx !== -1) {
        updatedModels[idx] = { ...model }
      }

      saveModels(updatedModels)
      return updatedModels
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '编辑模型失败');
    }
  },
)

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
      })
      // 添加模型开始
      .addCase(createModel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 添加模型成功
      .addCase(createModel.fulfilled, (state, action) => {
        state.loading = false;
        state.models = action.payload;
      })
      // 添加模型失败
      .addCase(createModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || '添加模型失败';
      })
      // 编辑模型开始
      .addCase(editModel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 编辑模型成功
      .addCase(editModel.fulfilled, (state, action) => {
        state.loading = false;
        state.models = action.payload;
      })
      // 编辑模型失败
      .addCase(editModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || '编辑模型失败';
      })
  },
});

// 导出actions
export const { clearError, clearInitializationError } = modelSlice.actions;

// 导出reducer
export default modelSlice.reducer;