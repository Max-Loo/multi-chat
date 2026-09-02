import { ref, watch } from "vue";
import { defineStore } from "pinia";
import { Model } from "@/types/model";
import { loadModelsFromJson, saveModelsToJson } from "../storage";

/**
 * 模型管理 store（对应原 modelSlice + modelMiddleware）
 */
export const useModelsStore = defineStore("models", () => {
  // 所有模型列表
  const models = ref<Model[]>([]);
  // 加载状态
  const loading = ref(false);
  // 操作错误信息
  const error = ref<string | null>(null);
  // 初始化错误信息
  const initializationError = ref<string | null>(null);

  // 初始化进行中标志：初始化加载的数据无需回写存储（与原中间件只监听增删改一致）
  let isInitializing = false;

  // 持久化订阅：模型列表发生任何变更时自动写回存储层（对应 saveModelsMiddleware）
  watch(
    models,
    async (value) => {
      if (isInitializing) return;
      await saveModelsToJson(value);
    },
    { deep: true },
  );

  /**
   * 初始化模型数据（对应原 initializeModels thunk）
   * @returns 模型列表与解密失败数量
   * @throws 加载失败时抛出错误（由初始化流程捕获）
   */
  async function initializeModels(): Promise<{
    models: Model[];
    decryptionFailureCount: number;
  }> {
    loading.value = true;
    initializationError.value = null;
    isInitializing = true;
    try {
      const result = await loadModelsFromJson();
      models.value = result.models;
      loading.value = false;
      return result;
    } catch (err) {
      loading.value = false;
      initializationError.value =
        err instanceof Error ? err.message : "Failed to initialize file";
      throw new Error(
        err instanceof Error
          ? err.message
          : "Failed to initialize model data",
        { cause: err },
      );
    } finally {
      isInitializing = false;
    }
  }

  /** 清除操作错误信息 */
  function clearError(): void {
    error.value = null;
  }

  /** 清除初始化错误信息 */
  function clearInitializationError(): void {
    initializationError.value = null;
  }

  /** 新建模型（持久化由 watch 订阅自动触发） */
  function createModel(payload: { model: Model }): void {
    models.value.push(payload.model);
  }

  /** 编辑模型 */
  function editModel(payload: { model: Model }): void {
    const { model } = payload;
    const idx = models.value.findIndex((item) => item.id === model.id);
    if (idx !== -1) {
      models.value[idx] = { ...model };
    }
  }

  /** 删除模型（软删除：仅标记 isDeleted） */
  function deleteModel(payload: { model: Model }): void {
    const { model } = payload;
    // 不使用filter，而是定位删除，是尽可能避免遍历整个数组
    const idx = models.value.findIndex((item) => item.id === model.id);
    if (idx !== -1) {
      // 添加已删除标识，不执行真删除
      models.value[idx].isDeleted = true;
    }
  }

  return {
    models,
    loading,
    error,
    initializationError,
    initializeModels,
    clearError,
    clearInitializationError,
    createModel,
    editModel,
    deleteModel,
  };
});
