/**
 * 模型管理状态（Pinia）
 *
 * 对应既有 Redux slice：src/store/slices/modelSlice.ts
 * 持久化副作用由 plugins/modelPlugin.ts 承载（对应 saveModelsMiddleware）。
 */
import { defineStore } from 'pinia';
import type { Model } from '@/types/model';
import { loadModelsFromJson } from '@/store/storage';

/** 模型管理状态接口（复用既有 slice 状态形状） */
export interface ModelStoreState {
  /** 所有模型列表 */
  models: Model[];
  /** 加载状态 */
  loading: boolean;
  /** 操作错误信息 */
  error: string | null;
  /** 初始化错误信息 */
  initializationError: string | null;
}

export const useModelStore = defineStore('models', {
  state: (): ModelStoreState => ({
    models: [],
    loading: false,
    error: null,
    initializationError: null,
  }),
  actions: {
    /** 清除操作错误信息 */
    clearError() {
      this.error = null;
    },
    /** 清除初始化错误信息 */
    clearInitializationError() {
      this.initializationError = null;
    },
    /** 新建模型 */
    createModel(model: Model) {
      this.models.push(model);
    },
    /** 编辑模型 */
    editModel(model: Model) {
      const idx = this.models.findIndex((item) => item.id === model.id);
      if (idx !== -1) {
        this.models[idx] = { ...model };
      }
    },
    /**
     * 删除模型
     * 不使用 filter，而是定位删除（添加已删除标识，不执行真删除），尽可能避免遍历整个数组
     */
    deleteModel(model: Model) {
      const idx = this.models.findIndex((item) => item.id === model.id);
      if (idx !== -1) {
        this.models[idx].isDeleted = true;
      }
    },
    /**
     * 初始化模型数据（对应 initializeModels thunk）
     * @returns 加载的模型列表
     */
    async initializeModels(): Promise<Model[]> {
      this.loading = true;
      this.initializationError = null;
      try {
        const result = await loadModelsFromJson();
        this.models = result.models;
        return this.models;
      } catch (error) {
        this.initializationError =
          error instanceof Error ? error.message : 'Failed to initialize file';
        throw new Error(
          error instanceof Error ? error.message : 'Failed to initialize model data',
          { cause: error },
        );
      } finally {
        this.loading = false;
      }
    },
  },
});
