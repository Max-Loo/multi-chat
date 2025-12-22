import { configureStore } from '@reduxjs/toolkit';
import { vi, expect } from 'vitest';
import modelReducer from '@/store/slices/modelSlice';
import chatReducer from '@/store/slices/chatSlices';
import chatPageReducer from '@/store/slices/chatPageSlices';
import appConfigReducer from '@/store/slices/appConfigSlices';
import { RootState } from '@/store';

/**
 * 创建测试用的Redux store
 * @param preloadedState 预加载状态
 * @returns 配置好的store实例
 */
export const createTestStore = (preloadedState?: RootState) => {
  return configureStore({
    reducer: {
      models: modelReducer,
      chat: chatReducer,
      chatPage: chatPageReducer,
      appConfig: appConfigReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }),
  });
};

/**
 * 创建模拟的异步thunk
 * @param payload 返回的数据
 * @param shouldReject 是否应该拒绝
 * @returns 模拟的thunk函数
 */
export const createMockAsyncThunk = <T>(
  payload: T,
  shouldReject = false,
  errorMessage = 'Async thunk error',
) => {
  return vi.fn().mockImplementation(async () => {
    if (shouldReject) {
      throw new Error(errorMessage);
    }
    return payload;
  });
};

/**
 * 等待指定时间
 * @param ms 毫秒数
 * @returns Promise
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 创建模拟的store dispatch
 * @returns 模拟的dispatch函数
 */
export const createMockDispatch = () => vi.fn();

/**
 * 验证dispatch是否被调用特定的action
 * @param dispatch 模拟的dispatch函数
 * @param expectedAction 期望的action
 */
export const expectDispatchCalledWith = (dispatch: ReturnType<typeof vi.fn>, expectedAction: unknown) => {
  expect(dispatch).toHaveBeenCalledWith(expectedAction);
};

/**
 * 验证dispatch是否被调用特定的异步action
 * @param dispatch 模拟的dispatch函数
 * @param actionType 期望的action类型
 */
export const expectDispatchCalledWithAsyncAction = (dispatch: ReturnType<typeof vi.fn>, actionType: string) => {
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: expect.stringContaining(actionType),
    }),
  );
};