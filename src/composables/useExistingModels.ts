/**
 * 获取未删除模型列表组合式函数（转写自 React hooks/useExistingModels）
 */
import { computed, type ComputedRef } from 'vue';
import type { Model } from '@/types/model';
import { useModelsStore } from '@/store/models';

/**
 * 获取不包含已删除模型的模型列表
 */
export function useExistingModels(): ComputedRef<Model[]> {
  const modelsStore = useModelsStore();

  return computed(() => modelsStore.models.filter((model) => !model.isDeleted));
}
