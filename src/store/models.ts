import { ref } from 'vue';
import { defineStore } from 'pinia';
import { Model } from '@/types/model';
import { loadModelsFromJson, saveModelsToJson } from './storage';

/**
 * 模型管理状态接口
 */
export interface ModelSliceState {
  models: Model[]; // 所有模型列表
  loading: boolean; // 加载状态
  error: string | null; // 操作错误信息
  initializationError: string | null; // 初始化错误信息
}

/**
 * 模型管理 store
 * 转写自 Redux modelSlice + modelMiddleware（模型保存副作用并入本 store）
 */
export const useModelsStore = defineStore('models', () => {
  // 所有模型列表
  const models = ref<Model[]>([]);
  // 加载状态
  const loading = ref(false);
  // 操作错误信息
  const error = ref<string | null>(null);
  // 初始化错误信息
  const initializationError = ref<string | null>(null);

  /**
   * 初始化模型数据
   * 对应原 initializeModels thunk
   * @returns 模型列表与解密失败计数
   */
  async function initializeModels(): Promise<{ models: Model[]; decryptionFailureCount: number }> {
    // pending
    loading.value = true;
    initializationError.value = null;

    try {
      const payload = await loadModelsFromJson();
      // fulfilled
      loading.value = false;
      models.value = payload.models;
      return payload;
    } catch (err) {
      // rejected
      loading.value = false;
      initializationError.value =
        err instanceof Error ? err.message : 'Failed to initialize file';
      throw err;
    }
  }

  /**
   * 清除操作错误信息
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * 清除初始化错误信息
   */
  function clearInitializationError(): void {
    initializationError.value = null;
  }

  /**
   * 新建模型（并持久化，原 modelMiddleware 监听 createModel）
   * @param payload 含新模型的载荷
   */
  async function createModel(payload: { model: Model }): Promise<void> {
    models.value.push(payload.model);
    await saveModelsToJson(models.value);
  }

  /**
   * 编辑模型（并持久化，原 modelMiddleware 监听 editModel）
   * @param payload 含编辑后模型的载荷
   */
  async function editModel(payload: { model: Model }): Promise<void> {
    const { model } = payload;
    const idx = models.value.findIndex((item) => item.id === model.id);
    if (idx !== -1) {
      models.value[idx] = { ...model };
    }
    await saveModelsToJson(models.value);
  }

  /**
   * 删除模型（软删除，标记 isDeleted；并持久化，原 modelMiddleware 监听 deleteModel）
   * @param payload 含待删除模型的载荷
   */
  async function deleteModel(payload: { model: Model }): Promise<void> {
    const { model } = payload;

    // 不使用filter，而是定位删除，是尽可能避免遍历整个数组
    const idx = models.value.findIndex((item) => item.id === model.id);

    if (idx !== -1) {
      // 添加已删除标识，不执行真删除
      models.value[idx].isDeleted = true;
    }
    await saveModelsToJson(models.value);
  }

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
