import { computed } from 'vue';
import { useModelStore } from '@/store/pinia/model';

/**
 * @description 获取不包含删除了的模型的模型列表（Vue 版 useExistingModels）
 */
export const useExistingModels = () => {
  const modelStore = useModelStore();

  const existingModels = computed(() =>
    modelStore.models.filter((model) => !model.isDeleted),
  );

  return existingModels;
};
