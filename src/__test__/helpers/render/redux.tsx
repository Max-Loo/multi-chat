/**
 * Redux 测试渲染辅助工具
 *
 * 提供带有 Redux store、Router、i18n 和 ConfirmProvider 的组件渲染函数
 */

import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { ConfirmProvider } from '@/hooks/useConfirm';
import type { RootState } from '@/store';
import chatReducer from '@/store/slices/chatSlices';
import chatPageReducer from '@/store/slices/chatPageSlices';
import modelsReducer from '@/store/slices/modelSlice';
import appConfigReducer from '@/store/slices/appConfigSlices';

/**
 * 创建测试用的 Redux store
 * @param preloadedState 预加载的状态
 * @returns 配置好的 Redux store
 */
export const createTestStore = (preloadedState?: Partial<RootState>): EnhancedStore<RootState> => {
  return configureStore({
    reducer: {
      chat: chatReducer,
      chatPage: chatPageReducer,
      models: modelsReducer,
      appConfig: appConfigReducer,
      modelProvider: (state = { providers: [], loading: false, error: null, lastUpdate: null }) => state,
    } as any,
    preloadedState: preloadedState as any,
  }) as EnhancedStore<RootState>;
};

/**
 * 渲染选项
 */
interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: EnhancedStore<RootState>;
  preloadedState?: Partial<RootState>;
  route?: string;
}

/**
 * 带有 Redux Provider、Router 和 ConfirmProvider 的渲染函数
 * @param ui 要渲染的 React 组件
 * @param options 渲染选项
 * @returns 渲染结果
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderWithProvidersOptions = {}
) => {
  const {
    store = createTestStore(options.preloadedState),
    route = '/',
    ...renderOptions
  } = options;

  // 设置路由
  window.history.pushState({}, 'Test page', route);

  // 创建包装器组件
  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </BrowserRouter>
      </Provider>
    );
  };

  return {
    store,
    ...render(ui, { wrapper: AllTheProviders, ...renderOptions }),
  };
};
