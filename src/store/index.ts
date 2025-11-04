import { configureStore } from '@reduxjs/toolkit';
import modelReducer from '@/store/slices/modelSlice';
import modelPageReducer from '@/store/slices/modelPageSlice'
import chatReducer from '@/store/slices/chatSlices'

// 创建Redux store实例
export const store = configureStore({
  reducer: {
    // 模型管理状态
    models: modelReducer,
    // 模型页面状态管理（列表页/新增页）
    modelPage: modelPageReducer,
    chat: chatReducer,
  },
});

// 导出 RootState 类型
export type RootState = ReturnType<typeof store.getState>;

// 导出 AppDispatch 类型
export type AppDispatch = typeof store.dispatch;