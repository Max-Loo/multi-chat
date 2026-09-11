import { ref } from 'vue';
import { defineStore } from 'pinia';
import { Model } from '@/types/model';
import { loadModelsFromJson, saveModelsToJson } from '../storage';

/**
 * 模型管理 Store（Pinia 版）
 *
 * 状态与动作与迁移前 Redux models slice + modelMiddleware 一致：
 * 模型列表的增删改、初始化加载与错误状态，变更后自动持久化（middleware 逻辑下沉）。
 */
export const useModelStore = defineStore('models', () => {
  // ==== State ====
  /** 所有模型列表 */
  const models = ref<Model[]>([]);
  /** 加载状态 */
  const loading = ref(false);
  /** 操作错误信息 */
  const error = ref<string | null>(null);
  /** 初始化错误信息 */
  const initializationError = ref<string | null>(null);

  // ==== Actions ====

  /**
   * 初始化模型数据
   * @throws 当初始化失败时抛出错误
   */
  const initializeModels = async (): Promise<void> => {
    loading.value = true;
    initializationError.value = null;
    try {
      const result = await loadModelsFromJson();
      models.value = result.models;
      loading.value = false;
    } catch (err) {
      loading.value = false;
      initializationError.value = err instanceof Error ? err.message : 'Failed to initialize file';
    }
  };

  /** 清除操作错误信息 */
  const clearError = () => {
    error.value = null;
  };

  /** 清除初始化错误信息 */
  const clearInitializationError = () => {
    initializationError.value = null;
  };

  /** 新建模型（同时持久化，原 modelMiddleware 逻辑下沉） */
  const createModel = async (payload: { model: Model }) => {
    models.value.push(payload.model);
    await saveModelsToJson(models.value);
  };

  /** 编辑模型（同时持久化） */
  const editModel = async (payload: { model: Model }) => {
    const { model } = payload;
    const idx = models.value.findIndex((item) => item.id === model.id);
    if (idx !== -1) {
      models.value[idx] = { ...model };
    }
    await saveModelsToJson(models.value);
  };

  /** 删除模型（标记删除，同时持久化） */
  const deleteModel = async (payload: { model: Model }) => {
    const { model } = payload;
    // 不使用filter，而是定位删除，是尽可能避免遍历整个数组
    const idx = models.value.findIndex((item) => item.id === model.id);
    if (idx !== -1) {
      // 添加已删除标识，不执行真删除
      models.value[idx].isDeleted = true;
    }
    await saveModelsToJson(models.value);
  };

  return {
    // state
    models,
    loading,
    error,
    initializationError,
    // actions
    initializeModels,
    clearError,
    clearInitializationError,
    createModel,
    editModel,
    deleteModel,
  };
});
