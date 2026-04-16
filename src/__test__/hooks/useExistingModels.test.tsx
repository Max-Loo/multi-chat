import { describe, it, expect } from 'vitest';
import { useExistingModels } from '@/hooks/useExistingModels';
import { renderHookWithProviders } from '@/__test__/helpers/render/redux';
import { createModelSliceState } from '@/__test__/helpers/mocks/testState';
import { createMockModel } from '@/__test__/helpers/fixtures/model';

describe('useExistingModels', () => {

  describe('模型列表返回行为', () => {
    it('应该返回所有未删除的模型 当存储中有多个模型', () => {
      const model1 = createMockModel({ id: 'model-1' });
      const model2 = createMockModel({ id: 'model-2' });
      const model3 = createMockModel({ id: 'model-3' });

      const { result } = renderHookWithProviders(() => useExistingModels(), {
        preloadedState: {
          models: createModelSliceState({
            models: [model1, model2, model3],
          }),
        },
      });

      expect(result.current).toEqual([model1, model2, model3]);
      expect(result.current).toHaveLength(3);
    });

    it('应该过滤掉已删除的模型 当存储中包含已删除模型', () => {
      const model1 = createMockModel({ id: 'model-1' });
      const model2 = createMockModel({ id: 'model-2', isDeleted: true });
      const model3 = createMockModel({ id: 'model-3' });
      const model4 = createMockModel({ id: 'model-4', isDeleted: true });

      const { result } = renderHookWithProviders(() => useExistingModels(), {
        preloadedState: {
          models: createModelSliceState({
            models: [model1, model2, model3, model4],
          }),
        },
      });

      expect(result.current).toEqual([model1, model3]);
      expect(result.current).toHaveLength(2);
      expect(result.current.every((model) => !model.isDeleted)).toBe(true);
    });

    it('应该保持原始模型顺序 当过滤已删除模型后', () => {
      const model1 = createMockModel({ id: 'model-1' });
      const model2 = createMockModel({ id: 'model-2' });
      const model3 = createMockModel({ id: 'model-3' });

      const { result } = renderHookWithProviders(() => useExistingModels(), {
        preloadedState: {
          models: createModelSliceState({
            models: [model1, model2, model3],
          }),
        },
      });

      expect(result.current[0].id).toBe('model-1');
      expect(result.current[1].id).toBe('model-2');
      expect(result.current[2].id).toBe('model-3');
    });
  });

  describe('空列表和特殊情况', () => {
    it('应该返回空数组 当存储中没有模型', () => {
      const { result } = renderHookWithProviders(() => useExistingModels(), {
        preloadedState: {
          models: createModelSliceState({
            models: [],
          }),
        },
      });

      expect(result.current).toEqual([]);
      expect(result.current).toHaveLength(0);
    });

    it('应该返回空数组 当所有模型都已删除', () => {
      const model1 = createMockModel({ id: 'model-1', isDeleted: true });
      const model2 = createMockModel({ id: 'model-2', isDeleted: true });
      const model3 = createMockModel({ id: 'model-3', isDeleted: true });

      const { result } = renderHookWithProviders(() => useExistingModels(), {
        preloadedState: {
          models: createModelSliceState({
            models: [model1, model2, model3],
          }),
        },
      });

      expect(result.current).toEqual([]);
      expect(result.current).toHaveLength(0);
    });
  });

  describe('性能优化行为', () => {
    it('应该返回相同引用 当模型列表未变化时', () => {
      const model1 = createMockModel({ id: 'model-1' });

      const { result, rerender } = renderHookWithProviders(() => useExistingModels(), {
        preloadedState: {
          models: createModelSliceState({
            models: [model1],
          }),
        },
      });

      const firstResult = result.current;

      rerender();

      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });
  });
});
