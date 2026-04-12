/**
 * 中间件测试共享辅助函数
 *
 * 提供统一的 Redux store 创建逻辑，消除中间件测试间的重复代码
 */

import { configureStore } from '@reduxjs/toolkit';
import type { Middleware } from '@reduxjs/toolkit';
import chatReducer from '@/store/slices/chatSlices';
import chatPageReducer from '@/store/slices/chatPageSlices';
import modelReducer from '@/store/slices/modelSlice';
import appConfigReducer from '@/store/slices/appConfigSlices';
import modelProviderReducer from '@/store/slices/modelProviderSlice';
import settingPageReducer from '@/store/slices/settingPageSlices';
import modelPageReducer from '@/store/slices/modelPageSlices';

/**
 * 创建带中间件的测试 Redux store
 * @param middleware 要注入的 Listener Middleware
 * @returns 配置好的 Redux store
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Reason: Redux Toolkit 严格类型系统限制
export const createMiddlewareTestStore = (middleware: Middleware<any>) => {
  return configureStore({
    reducer: {
      models: modelReducer,
      chat: chatReducer,
      chatPage: chatPageReducer,
      appConfig: appConfigReducer,
      modelProvider: modelProviderReducer,
      settingPage: settingPageReducer,
      modelPage: modelPageReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(middleware),
  });
};
