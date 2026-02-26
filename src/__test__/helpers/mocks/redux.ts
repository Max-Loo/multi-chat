/**
 * Redux 测试 Mock 工厂
 * 
 * 提供 Redux store 和相关功能的 Mock 创建函数
 */

import { vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

/**
 * 创建 Mock Redux Store
 * @param reducers Reducer 对象
 * @param middleware 额外的 middleware
 * @returns 配置好的 Redux store
 */
export const createMockStore = ({
  reducers = {},
  middleware = [],
}: {
  reducers?: Record<string, any>;
  middleware?: any[];
} = {}) => {
  return configureStore({
    reducer: {
      ...reducers,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: true,
      }).concat(...middleware),
  });
};

/**
 * 创建 Mock AbortController
 * @returns AbortController 的 Mock 实现
 */
export const createMockAbortController = () => {
  const mockController = {
    abort: vi.fn(),
    signal: new AbortSignal(),
  };

  return mockController;
};

/**
 * 创建 Mock AbortSignal
 * @param aborted 是否已中止
 * @returns AbortSignal 的 Mock 实现
 */
export const createMockAbortSignal = (aborted = false) => {
  const mockSignal = {
    aborted,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as AbortSignal;

  return mockSignal;
};
