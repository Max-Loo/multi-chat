/**
 * 可用模型列表组合式函数（对应旧版 hooks/useExistingModels.ts）
 */
import { computed, type ComputedRef } from 'vue';
import { storeToRefs } from 'pinia';
import { useModelStore } from '@/stores';
import type { Model } from '@/types/model';

/**
 * 获取未删除的模型列表
 */
export const useExistingModels = (): ComputedRef<Model[]> => {
  const modelStore = useModelStore();
  const { models } = storeToRefs(modelStore);

  return computed(() => models.value.filter((model) => !model.isDeleted));
};
