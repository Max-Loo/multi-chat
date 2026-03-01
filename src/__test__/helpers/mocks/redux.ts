/**
 * Redux 测试 Mock 工厂
 *
 * 提供 Redux store 和相关功能的 Mock 创建函数
 */

import { vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import type { Model } from '@/types/model';
import type { ModelSliceState } from '@/store/slices/modelSlice';

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

/**
 * 创建 Model Slice 的预配置状态
 * @param overrides 要覆盖的状态字段
 * @returns Model slice 状态对象
 */
export const createModelSliceState = (overrides?: Partial<ModelSliceState>): ModelSliceState => {
  return {
    models: [],
    loading: false,
    error: null,
    initializationError: null,
    ...overrides,
  };
};

/**
 * 创建包含模型的 Redux 预配置状态
 * @param models 模型列表
 * @param overrides 其他要覆盖的状态字段
 * @returns Model slice 状态对象，包含指定的模型列表
 */
export const createModelSliceWithModels = (
  models: Model[],
  overrides?: Partial<ModelSliceState>
): ModelSliceState => {
  return createModelSliceState({
    models,
    ...overrides,
  });
};

/**
 * 创建加载中的 Model slice 状态
 * @param overrides 要覆盖的状态字段
 * @returns 加载状态的 Model slice
 */
export const createLoadingModelSliceState = (overrides?: Partial<ModelSliceState>): ModelSliceState => {
  return createModelSliceState({
    loading: true,
    initializationError: null,
    ...overrides,
  });
};

/**
 * 创建带错误的 Model slice 状态
 * @param errorMessage 错误消息
 * @param overrides 要覆盖的状态字段
 * @returns 带错误的 Model slice
 */
export const createErrorModelSliceState = (
  errorMessage: string,
  overrides?: Partial<ModelSliceState>
): ModelSliceState => {
  return createModelSliceState({
    loading: false,
    error: errorMessage,
    initializationError: null,
    ...overrides,
  });
};

/**
 * 创建带初始化错误的 Model slice 状态
 * @param errorMessage 初始化错误消息
 * @param overrides 要覆盖的状态字段
 * @returns 带初始化错误的 Model slice
 */
export const createInitErrorModelSliceState = (
  errorMessage: string,
  overrides?: Partial<ModelSliceState>
): ModelSliceState => {
  return createModelSliceState({
    loading: false,
    error: null,
    initializationError: errorMessage,
    ...overrides,
  });
};
