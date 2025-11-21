import { configureStore } from '@reduxjs/toolkit';
import modelReducer, { ModelSliceState } from '@/store/slices/modelSlice';
import modelPageReducer, { ModelPageSliceState } from '@/store/slices/modelPageSlice'
import chatReducer, { ChatSliceState } from '@/store/slices/chatSlices'
import chatPageReducer, { ChatPageSliceState } from '@/store/slices/chatPageSlices'
import { saveChatListMiddleware } from './middleware/chatMiddleware';

// 创建Redux store实例
export const store = configureStore({
  reducer: {
    // 模型管理状态
    models: modelReducer,
    // 模型页面状态管理（列表页/新增页）
    modelPage: modelPageReducer,
    chat: chatReducer,
    chatPage: chatPageReducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().prepend(saveChatListMiddleware.middleware)
  },
});

// 导出 RootState 类型
// export type RootState = ReturnType<typeof store.getState>;
export type RootState = {
  models: ModelSliceState;
  modelPage: ModelPageSliceState;
  chat: ChatSliceState;
  chatPage: ChatPageSliceState
};

// 导出 AppDispatch 类型
export type AppDispatch = typeof store.dispatch;