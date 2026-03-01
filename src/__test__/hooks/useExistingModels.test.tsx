import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useExistingModels } from '@/hooks/useExistingModels';
import modelReducer from '@/store/slices/modelSlice';
import type { RootState } from '@/store';
import type { Model } from '@/types/model';
import { ModelProviderKeyEnum } from '@/utils/enums';

const createMockModel = (id: string, isDeleted: boolean = false): Model => ({
  id,
  nickname: `Model ${id}`,
  providerKey: ModelProviderKeyEnum.DEEPSEEK,
  providerName: 'deepseek',
  modelName: `Model-${id}`,
  modelKey: `model-key-${id}`,
  apiAddress: 'https://api.openai.com',
  apiKey: `key-${id}`,
  isEnable: true,
  createdAt: '2024-01-01 00:00:00',
  updateAt: '2024-01-01 00:00:00',
  isDeleted,
});

const createTestStore = (state: Partial<RootState>) => {
  return configureStore({
    reducer: {
      models: modelReducer,
    } as any,
    preloadedState: state as any,
  });
};

const createWrapper = (store: ReturnType<typeof createTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => {
    return <Provider store={store as any}>{children}</Provider>;
  };
};

describe('useExistingModels', () => {

  describe('获取模型列表测试', () => {
    it('应返回完整的模型数组（无删除标记）', () => {
      const model1 = createMockModel('model-1', false);
      const model2 = createMockModel('model-2', false);
      const model3 = createMockModel('model-3', false);

      const store = createTestStore({
        models: {
          models: [model1, model2, model3],
          loading: false,
          error: null,
          initializationError: null,
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingModels(), { wrapper });

      expect(result.current).toHaveLength(3);
      expect(result.current).toEqual([model1, model2, model3]);
    });

    it('应过滤掉已删除的模型', () => {
      const model1 = createMockModel('model-1', false);
      const model2 = createMockModel('model-2', true);
      const model3 = createMockModel('model-3', false);
      const model4 = createMockModel('model-4', true);

      const store = createTestStore({
        models: {
          models: [model1, model2, model3, model4],
          loading: false,
          error: null,
          initializationError: null,
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingModels(), { wrapper });

      expect(result.current).toHaveLength(2);
      expect(result.current).toEqual([model1, model3]);
      expect(result.current.every((model) => !model.isDeleted)).toBe(true);
    });

    it('应保留模型顺序', () => {
      const model1 = createMockModel('model-1', false);
      const model2 = createMockModel('model-2', false);
      const model3 = createMockModel('model-3', false);

      const store = createTestStore({
        models: {
          models: [model1, model2, model3],
          loading: false,
          error: null,
          initializationError: null,
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingModels(), { wrapper });

      expect(result.current[0].id).toBe('model-1');
      expect(result.current[1].id).toBe('model-2');
      expect(result.current[2].id).toBe('model-3');
    });
  });

  describe('空列表测试', () => {
    it('应返回空数组', () => {
      const store = createTestStore({
        models: {
          models: [],
          loading: false,
          error: null,
          initializationError: null,
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingModels(), { wrapper });

      expect(result.current).toEqual([]);
      expect(result.current).toHaveLength(0);
    });

    it('当所有模型都已删除时应返回空数组', () => {
      const model1 = createMockModel('model-1', true);
      const model2 = createMockModel('model-2', true);
      const model3 = createMockModel('model-3', true);

      const store = createTestStore({
        models: {
          models: [model1, model2, model3],
          loading: false,
          error: null,
          initializationError: null,
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingModels(), { wrapper });

      expect(result.current).toEqual([]);
      expect(result.current).toHaveLength(0);
    });
  });

  describe('Memoization 测试', () => {
    it('应在 models 不变时返回相同的引用', () => {
      const model1 = createMockModel('model-1', false);

      const store = createTestStore({
        models: {
          models: [model1],
          loading: false,
          error: null,
          initializationError: null,
        },
      });

      const wrapper = createWrapper(store);
      const { result, rerender } = renderHook(() => useExistingModels(), { wrapper });

      const firstResult = result.current;

      rerender();

      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });
  });

  describe('使用 createMockModel 工厂测试', () => {
    it('应使用 createMockModel 创建测试数据', () => {
      const store = createTestStore({
        models: {
          models: [
            createMockModel('test-1', false),
            createMockModel('test-2', false),
          ],
          loading: false,
          error: null,
          initializationError: null,
        },
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingModels(), { wrapper });

      expect(result.current).toHaveLength(2);
      expect(result.current[0].id).toBe('test-1');
      expect(result.current[1].id).toBe('test-2');
    });
  });
});
