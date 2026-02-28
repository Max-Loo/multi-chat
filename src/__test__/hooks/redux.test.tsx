import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import modelReducer from '@/store/slices/modelSlice';
import chatReducer from '@/store/slices/chatSlices';
import chatPageReducer from '@/store/slices/chatPageSlices';
import appConfigReducer from '@/store/slices/appConfigSlices';
import modelProviderReducer from '@/store/slices/modelProviderSlice';
import type { RootState, AppDispatch } from '@/store';

const createTestStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({
    reducer: {
      models: modelReducer,
      chat: chatReducer,
      chatPage: chatPageReducer,
      appConfig: appConfigReducer,
      modelProvider: modelProviderReducer,
    } as any,
    preloadedState: preloadedState as any,
  });
};

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => {
    return <Provider store={store as any}>{children}</Provider>;
  };
};

describe('Redux Hooks', () => {

  describe('useAppDispatch 类型安全测试', () => {
    it('应返回类型安全的 dispatch 函数', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAppDispatch(), { wrapper });

      expect(result.current).toBeInstanceOf(Function);
      expect(result.current).toEqual(store.dispatch);

      const dispatch: AppDispatch = result.current;
      expect(dispatch).toBeDefined();
    });

    it('应能够 dispatch action', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAppDispatch(), { wrapper });

      const dispatch = result.current;

      dispatch({ type: 'test/test-action' });
      dispatch({ type: 'models/clearError' });
    });
  });

  describe('useAppSelector 类型安全测试', () => {
    it('应正确推断 RootState 类型', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(() => useAppSelector((state) => state), {
        wrapper,
      });

      const state = result.current;
      expect(state).toBeDefined();

      const stateTypeTest: RootState = state;
      expect(stateTypeTest).toBeDefined();
    });

    it('应正确选择 models slice state', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(
        () => useAppSelector((state) => state.models),
        { wrapper }
      );

      expect(result.current).toBeDefined();
      expect(result.current.models).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('应正确选择 chat slice state', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(
        () => useAppSelector((state) => state.chat),
        { wrapper }
      );

      expect(result.current).toBeDefined();
      expect(result.current.chatList).toEqual([]);
      expect(result.current.selectedChatId).toBeNull();
    });

    it('应正确选择 chatPage slice state', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(
        () => useAppSelector((state) => state.chatPage),
        { wrapper }
      );

      expect(result.current).toBeDefined();
      expect(result.current.isSidebarCollapsed).toBe(false);
      expect(result.current.isShowChatPage).toBe(false);
    });

    it('应正确选择 appConfig slice state', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(
        () => useAppSelector((state) => state.appConfig),
        { wrapper }
      );

      expect(result.current).toBeDefined();
      expect(result.current.language).toBe('');
      expect(result.current.includeReasoningContent).toBe(false);
    });

    it('应支持复杂的选择器逻辑', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      const { result } = renderHook(
        () =>
          useAppSelector((state) => ({
            modelCount: state.models.models.length,
            selectedChatId: state.chat.selectedChatId,
            isSidebarCollapsed: state.chatPage.isSidebarCollapsed,
            language: state.appConfig.language,
          })),
        { wrapper }
      );

      expect(result.current).toEqual({
        modelCount: 0,
        selectedChatId: null,
        isSidebarCollapsed: false,
        language: '',
      });
    });
  });
});
