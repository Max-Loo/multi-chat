import { configureStore } from '@reduxjs/toolkit';
import modelReducer, { ModelSliceState } from '@/store/slices/modelSlice';
import modelPageReducer, { ModelPageSliceState } from '@/store/slices/modelPageSlice'
import chatReducer, { ChatSliceState } from '@/store/slices/chatSlices'
import chatPageReducer, { ChatPageSliceState } from '@/store/slices/chatPageSlices'
import appConfigReducer, { AppConfigSliceState } from '@/store/slices/appConfigSlices'
import { saveChatListMiddleware } from './middleware/chatMiddleware';
import { saveModelsMiddleware } from './middleware/modelMiddleware';
import { saveDefaultAppLanguage } from './middleware/appConfigMiddleware';

// 创建Redux store实例
export const store = configureStore({
  reducer: {
    // 模型管理状态
    models: modelReducer,
    // 模型页面状态管理（列表页/新增页）
    modelPage: modelPageReducer,
    chat: chatReducer,
    chatPage: chatPageReducer,
    appConfig: appConfigReducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware()
      .prepend(saveChatListMiddleware.middleware)
      .prepend(saveModelsMiddleware.middleware)
      .prepend(saveDefaultAppLanguage.middleware)
  },
});

// 导出 RootState 类型，不直接使用 ReturnType 是为了避免在使用中间件的时候的循环定义的问题
// export type RootState = ReturnType<typeof store.getState>;\
export type RootState = {
  models: ModelSliceState;
  modelPage: ModelPageSliceState;
  chat: ChatSliceState;
  chatPage: ChatPageSliceState;
  appConfig: AppConfigSliceState;
};

// 导出 AppDispatch 类型
export type AppDispatch = typeof store.dispatch;