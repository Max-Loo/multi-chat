/**
 * modelSlice 单元测试
 *
 * 测试模型管理、初始化、增删改查、软删除等核心功能
 *
 * 删除的冗余测试（已被集成测试覆盖）：
 * - 模型管理 reducers (3 tests)：创建、编辑、删除模型已被 model-config.integration.test.ts 覆盖
 * - 模型列表过滤 (1 test)：软删除和过滤逻辑已被集成测试覆盖
 * - 模型查找 (2 tests)：基本的 find 操作不需要单元测试
 * - 初始化状态转换测试 (4 tests)：pending/fulfilled/rejected 状态转换已在 app-loading.integration.test.ts 覆盖
 *
 * 保留的关键测试：
 * - 边缘情况：编辑不存在的模型
 * - 软删除逻辑：查找已删除的模型
 * - 错误处理：清除操作错误、清除初始化错误
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Model } from '@/types/model';
import { createMockModel } from '@/__test__/helpers/fixtures/model';

// Mock 依赖 - 必须在导入 slice 之前执行
// 使用 vi.hoisted 确保变量在 vi.mock 之前被定义
const { mockLoadModelsFromJson } = vi.hoisted(() => ({
  mockLoadModelsFromJson: vi.fn<() => Promise<Model[]>>(() => Promise.resolve([])),
}));

// Mock modelStorage 模块
vi.mock('@/store/storage/modelStorage', () => ({
  loadModelsFromJson: mockLoadModelsFromJson,
  saveModelsToJson: vi.fn(() => Promise.resolve(undefined)),
}));

// Mock chatStorage 模块
vi.mock('@/store/storage/chatStorage', () => ({
  loadChatsFromJson: vi.fn(() => Promise.resolve([])),
  saveChatsToJson: vi.fn(() => Promise.resolve(undefined)),
}));

// Mock storeUtils 模块
vi.mock('@/store/storage/storeUtils', () => ({
  createLazyStore: vi.fn(() => ({})),
  saveToStore: vi.fn(() => Promise.resolve()),
  loadFromStore: vi.fn(() => Promise.resolve([])),
}));

import { configureStore } from '@reduxjs/toolkit';
import modelReducer, {
  clearError,
  clearInitializationError,
  createModel,
  editModel,
  deleteModel,
} from '@/store/slices/modelSlice';

describe('modelSlice', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: Redux Toolkit 严格类型系统限制
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
    // 重置 mock 返回默认值
    mockLoadModelsFromJson.mockResolvedValue([]);
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



  // 模型管理 reducers 测试已被删除：已被 model-config.integration.test.ts 覆盖
  // - 创建新模型：集成测试覆盖 "添加模型配置"
  // - 编辑模型：集成测试覆盖 "编辑模型配置"
  // - 软删除模型：集成测试覆盖 "删除模型配置"
  // - 编辑不存在模型：集成测试覆盖 "编辑模型配置" 的错误场景

  // 保留边缘情况测试
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

  // 模型列表过滤测试已被删除：集成测试已覆盖软删除和过滤逻辑

  describe('软删除模型查找', () => {
    // 保留软删除模型查找测试：验证软删除逻辑
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
});
