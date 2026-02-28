/**
 * modelSlice 单元测试
 * 
 * 测试模型管理、初始化、增删改查、软删除等核心功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import modelReducer, {
  initializeModels,
  clearError,
  clearInitializationError,
  createModel,
  editModel,
  deleteModel,
} from '@/store/slices/modelSlice';
import { loadModelsFromJson } from '@/store/storage';
import { Model } from '@/types/model';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { createIdGenerator } from 'ai';

// Mock 依赖
vi.mock('@/store/storage', () => ({
  loadModelsFromJson: vi.fn(),
}));

const mockLoadModelsFromJson = vi.mocked(loadModelsFromJson);

// 生成测试模型 ID 的工具函数
const generateModelId = createIdGenerator({ prefix: 'test-model-' });

// 创建 Mock Model 对象
const createMockModel = (overrides?: Partial<Model>): Model => {
  const id = generateModelId();
  return {
    id,
    createdAt: '2024-01-01 00:00:00',
    updateAt: '2024-01-01 00:00:00',
    providerName: 'Test Provider',
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    nickname: 'Test Model',
    modelName: 'test-model',
    modelKey: 'test-model',
    apiKey: 'sk-test-123',
    apiAddress: 'https://api.test.com/v1',
    isEnable: true,
    isDeleted: false,
    ...overrides,
  };
};

describe('modelSlice', () => {
  let store: any;

  // 创建测试用的 Redux store
  const createTestStore = () => {
    return configureStore({
      reducer: {
        models: modelReducer,
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore();
  });

  describe('initialState', () => {
    it('应该返回正确的初始状态', () => {
      const state = store.getState().models;
      expect(state).toEqual({
        models: [],
        loading: false,
        error: null,
        initializationError: null,
      });
    });
  });

  describe('initializeModels', () => {
    it('应该在 pending 时设置 loading 为 true', async () => {
      // Mock loadModelsFromJson 返回永不解析的 Promise
      mockLoadModelsFromJson.mockReturnValue(new Promise(() => {}));

      // Dispatch Thunk（不等待）
      store.dispatch(initializeModels());

      // 立即验证 pending 状态
      const state = store.getState().models;
      expect(state.loading).toBe(true);
      expect(state.initializationError).toBe(null);
    });

    it('应该在 fulfilled 时更新模型列表', async () => {
      // Mock 数据
      const mockModels: Model[] = [
        createMockModel({ nickname: 'Model 1' }),
        createMockModel({ nickname: 'Model 2' }),
      ];
      mockLoadModelsFromJson.mockResolvedValue(mockModels);

      // Dispatch Thunk
      const result = await store.dispatch(initializeModels());

      // 验证 Thunk fulfilled
      expect(result.type).toBe('models/initialize/fulfilled');

      // 验证状态转换
      const state = store.getState().models;
      expect(state.loading).toBe(false);
      expect(state.models).toEqual(mockModels);
      expect(state.initializationError).toBe(null);

      // 验证服务层被调用
      expect(mockLoadModelsFromJson).toHaveBeenCalledTimes(1);
    });

    it('应该在 rejected 时设置错误信息', async () => {
      // Mock loadModelsFromJson 失败
      const errorMessage = 'Failed to load models';
      mockLoadModelsFromJson.mockRejectedValue(new Error(errorMessage));

      // Dispatch Thunk
      const result = await store.dispatch(initializeModels());

      // 验证 Thunk rejected
      expect(result.type).toBe('models/initialize/rejected');

      // 验证状态转换
      const state = store.getState().models;
      expect(state.loading).toBe(false);
      expect(state.initializationError).toBe(errorMessage);
    });
  });

  describe('模型管理 reducers', () => {
    it('应该创建新模型', () => {
      const newModel = createMockModel({ nickname: 'New Model' });

      store.dispatch(createModel({ model: newModel }));

      const state = store.getState().models;
      expect(state.models).toHaveLength(1);
      expect(state.models[0]).toEqual(newModel);
    });

    it('应该编辑模型', () => {
      const model = createMockModel({ nickname: 'Old Name' });
      store.dispatch(createModel({ model }));

      const updatedModel = { ...model, nickname: 'New Name' };
      store.dispatch(editModel({ model: updatedModel }));

      const state = store.getState().models;
      expect(state.models[0].nickname).toBe('New Name');
    });

    it('应该软删除模型（设置 isDeleted 标记）', () => {
      const model = createMockModel();
      store.dispatch(createModel({ model }));

      store.dispatch(deleteModel({ model }));

      const state = store.getState().models;
      expect(state.models).toHaveLength(1); // 数组长度不变
      expect(state.models[0].isDeleted).toBe(true); // 标记为已删除
    });

    it('应该在编辑不存在模型时不修改状态', () => {
      const model1 = createMockModel({ id: 'model-1', nickname: 'Model 1' });
      const model2 = createMockModel({ id: 'model-2', nickname: 'Model 2' });
      
      store.dispatch(createModel({ model: model1 }));
      
      // 尝试编辑不存在的模型
      store.dispatch(editModel({ model: model2 }));

      const state = store.getState().models;
      expect(state.models).toHaveLength(1);
      expect(state.models[0].nickname).toBe('Model 1'); // 保持不变
    });
  });

  describe('错误状态清理', () => {
    it('应该清除操作错误信息', () => {
      // 设置错误状态（通过 rejected action）
      store.dispatch({
        type: 'models/initialize/rejected',
        error: { message: 'Test error' },
      });

      // 清除错误
      store.dispatch(clearError());

      const state = store.getState().models;
      expect(state.error).toBe(null);
    });

    it('应该清除初始化错误信息', () => {
      // 先设置一个初始化错误
      store.dispatch({
        type: 'models/initialize/rejected',
        error: { message: 'Init error' },
      });

      // 清除错误
      store.dispatch(clearInitializationError());

      const state = store.getState().models;
      expect(state.initializationError).toBe(null);
    });
  });

  describe('模型列表过滤', () => {
    it('应该只返回未删除的模型列表', () => {
      const model1 = createMockModel({ id: 'model-1', isDeleted: false });
      const model2 = createMockModel({ id: 'model-2', isDeleted: true });
      const model3 = createMockModel({ id: 'model-3', isDeleted: false });

      store.dispatch(createModel({ model: model1 }));
      store.dispatch(createModel({ model: model2 }));
      store.dispatch(createModel({ model: model3 }));

      const state = store.getState().models;
      const activeModels = state.models.filter((m: Model) => !m.isDeleted);

      expect(activeModels).toHaveLength(2);
      expect(activeModels.map((m: Model) => m.id)).toEqual([model1.id, model3.id]);
    });
  });

  describe('模型查找', () => {
    it('应该通过 ID 查找存在的模型', () => {
      const model = createMockModel();
      store.dispatch(createModel({ model }));

      const state = store.getState().models;
      const found = state.models.find((m: Model) => m.id === model.id);
      
      expect(found).toBeDefined();
      expect(found?.id).toBe(model.id);
    });

    it('应该通过 ID 查找不存在的模型返回 undefined', () => {
      const model = createMockModel();
      store.dispatch(createModel({ model }));

      const state = store.getState().models;
      const found = state.models.find((m: Model) => m.id === 'non-existent');
      
      expect(found).toBeUndefined();
    });

    it('应该查找已删除的模型', () => {
      const model = createMockModel();
      store.dispatch(createModel({ model }));
      store.dispatch(deleteModel({ model }));

      const state = store.getState().models;
      const found = state.models.find((m: Model) => m.id === model.id);
      
      // 软删除的模型仍然可以被找到
      expect(found).toBeDefined();
      expect(found?.isDeleted).toBe(true);
    });
  });

  describe('状态转换序列', () => {
    it('应该按正确顺序转换 pending → fulfilled', async () => {
      const mockModels: Model[] = [createMockModel()];
      mockLoadModelsFromJson.mockResolvedValue(mockModels);

      // 初始状态
      expect(store.getState().models.loading).toBe(false);

      // Pending
      const pendingPromise = store.dispatch(initializeModels());
      expect(store.getState().models.loading).toBe(true);

      // Fulfilled
      await pendingPromise;
      expect(store.getState().models.loading).toBe(false);
      expect(store.getState().models.models).toEqual(mockModels);
    });
  });
});
