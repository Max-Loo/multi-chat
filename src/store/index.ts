import { configureStore } from '@reduxjs/toolkit';
import modelReducer, { ModelSliceState } from '@/store/slices/modelSlice';
import chatReducer, { ChatSliceState } from '@/store/slices/chatSlices'
import chatPageReducer, { ChatPageSliceState } from '@/store/slices/chatPageSlices'
import appConfigReducer, { AppConfigSliceState } from '@/store/slices/appConfigSlices'
import modelProviderReducer, { ModelProviderSliceState } from '@/store/slices/modelProviderSlice';
import { saveChatListMiddleware } from './middleware/chatMiddleware';
import { saveModelsMiddleware } from './middleware/modelMiddleware';
import { saveDefaultAppLanguage } from './middleware/appConfigMiddleware';

// 创建Redux store实例
export const store = configureStore({
  reducer: {
    // 模型管理状态
    models: modelReducer,
    chat: chatReducer,
    chatPage: chatPageReducer,
    appConfig: appConfigReducer,
    // 模型供应商状态
    modelProvider: modelProviderReducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware()
      .prepend(saveChatListMiddleware.middleware)
      .prepend(saveModelsMiddleware.middleware)
      .prepend(saveDefaultAppLanguage.middleware)
  },
});

// 导出 RootState 类型，不直接使用 ReturnType 是为了避免在使用中间件的时候的循环定义的问题
// export type RootState = ReturnType<typeof store.getState>;
export type RootState = {
  models: ModelSliceState;
  chat: ChatSliceState;
  chatPage: ChatPageSliceState;
  appConfig: AppConfigSliceState;
  modelProvider: ModelProviderSliceState;
};

// 导出 AppDispatch 类型
export type AppDispatch = typeof store.dispatch;