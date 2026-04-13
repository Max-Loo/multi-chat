import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { useExistingModels } from '@/hooks/useExistingModels';
import type { Model } from '@/types/model';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { createTypeSafeTestStore } from '@/__test__/helpers/render/redux';
import { createModelSliceState } from '@/__test__/helpers/mocks/testState';

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

const createWrapper = (store: ReturnType<typeof createTypeSafeTestStore>) => {
  return ({ children }: { children: React.ReactNode }) => {
    return <Provider store={store}>{children}</Provider>;
  };
};

describe('useExistingModels', () => {

  describe('模型列表返回行为', () => {
    it('应该返回所有未删除的模型 当存储中有多个模型', () => {
      const model1 = createMockModel('model-1', false);
      const model2 = createMockModel('model-2', false);
      const model3 = createMockModel('model-3', false);

      const store = createTypeSafeTestStore({
        models: createModelSliceState({
          models: [model1, model2, model3],
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingModels(), { wrapper });

      expect(result.current).toEqual([model1, model2, model3]);
      expect(result.current).toHaveLength(3);
    });

    it('应该过滤掉已删除的模型 当存储中包含已删除模型', () => {
      const model1 = createMockModel('model-1', false);
      const model2 = createMockModel('model-2', true);
      const model3 = createMockModel('model-3', false);
      const model4 = createMockModel('model-4', true);

      const store = createTypeSafeTestStore({
        models: createModelSliceState({
          models: [model1, model2, model3, model4],
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingModels(), { wrapper });

      expect(result.current).toEqual([model1, model3]);
      expect(result.current).toHaveLength(2);
      expect(result.current.every((model) => !model.isDeleted)).toBe(true);
    });

    it('应该保持原始模型顺序 当过滤已删除模型后', () => {
      const model1 = createMockModel('model-1', false);
      const model2 = createMockModel('model-2', false);
      const model3 = createMockModel('model-3', false);

      const store = createTypeSafeTestStore({
        models: createModelSliceState({
          models: [model1, model2, model3],
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingModels(), { wrapper });

      expect(result.current[0].id).toBe('model-1');
      expect(result.current[1].id).toBe('model-2');
      expect(result.current[2].id).toBe('model-3');
    });
  });

  describe('空列表和特殊情况', () => {
    it('应该返回空数组 当存储中没有模型', () => {
      const store = createTypeSafeTestStore({
        models: createModelSliceState({
          models: [],
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingModels(), { wrapper });

      expect(result.current).toEqual([]);
      expect(result.current).toHaveLength(0);
    });

    it('应该返回空数组 当所有模型都已删除', () => {
      const model1 = createMockModel('model-1', true);
      const model2 = createMockModel('model-2', true);
      const model3 = createMockModel('model-3', true);

      const store = createTypeSafeTestStore({
        models: createModelSliceState({
          models: [model1, model2, model3],
        }),
      });

      const wrapper = createWrapper(store);
      const { result } = renderHook(() => useExistingModels(), { wrapper });

      expect(result.current).toEqual([]);
      expect(result.current).toHaveLength(0);
    });
  });

  describe('性能优化行为', () => {
    it('应该返回相同引用 当模型列表未变化时', () => {
      const model1 = createMockModel('model-1', false);

      const store = createTypeSafeTestStore({
        models: createModelSliceState({
          models: [model1],
        }),
      });

      const wrapper = createWrapper(store);
      const { result, rerender } = renderHook(() => useExistingModels(), { wrapper });

      const firstResult = result.current;

      rerender();

      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });
  });
});
