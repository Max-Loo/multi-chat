import { configureStore } from '@reduxjs/toolkit';
import modelReducer from '@/store/slices/modelSlice';

// 创建Redux store实例
export const store = configureStore({
  reducer: {
    models: modelReducer,  // 模型管理状态
  },
});

// 导出 RootState 类型
export type RootState = ReturnType<typeof store.getState>;

// 导出 AppDispatch 类型
export type AppDispatch = typeof store.dispatch;