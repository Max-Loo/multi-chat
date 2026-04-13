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
import modelProviderReducer from '@/store/slices/modelProviderSlice';
import settingPageReducer from '@/store/slices/settingPageSlices';
import modelPageReducer from '@/store/slices/modelPageSlices';
import { createTestRootState } from '../mocks/testState';

/**
 * 创建类型安全的测试 Redux store
 *
 * 包含完整 7 个 reducer 映射，支持 preloadedState 和 reducerOverrides 参数。
 * preloadedState 和 reducerOverrides 的 key 类型由 TypeScript 编译期检查，
 * 拼写错误或类型不匹配会报错。
 *
 * @param preloadedState 预加载状态（可选，默认使用各 slice 工厂函数的默认值）
 * @param options 配置选项
 * @param options.reducerOverrides 自定义 reducer 替换（可选，用于 stub 掉特定 reducer）
 */
export const createTypeSafeTestStore = (
  preloadedState?: Partial<RootState>,
  options?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reducerOverrides?: { [K in keyof RootState]?: (state: any, action: any) => RootState[K] };
  }
): EnhancedStore<RootState> => {
  // configureStore 的 ReducersMapObject 内部类型签名与 slice reducer 存在 PreloadedState 兼容差异，
  // 在此边界处使用类型断言确保调用方获得完整的类型安全，而非在各测试文件中使用 as any
  const reducerMap = {
    models: modelsReducer,
    chat: chatReducer,
    chatPage: chatPageReducer,
    appConfig: appConfigReducer,
    modelProvider: modelProviderReducer,
    settingPage: settingPageReducer,
    modelPage: modelPageReducer,
    ...options?.reducerOverrides,
  };
  return configureStore({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reducer: reducerMap as any,
    preloadedState: preloadedState ?? createTestRootState(),
  }) as EnhancedStore<RootState>;
};

/**
 * @deprecated 使用 createTypeSafeTestStore 替代
 */
export const createTestStore = createTypeSafeTestStore;

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
