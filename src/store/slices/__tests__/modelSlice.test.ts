import { describe, it, expect, vi, beforeEach } from 'vitest';
import modelReducer, {
  clearError,
  clearInitializationError,
  createModel,
  editModel,
  deleteModel,
  initializeModels,
  ModelSliceState,
} from '@/store/slices/modelSlice';
import { createMockModel } from '@/__tests__/fixtures/models';

// Mock the loadModels function
vi.mock('@/store/vaults/modelVault', () => ({
  loadModels: vi.fn(),
}));

describe('modelSlice', () => {
  const initialState: ModelSliceState = {
    models: [],
    loading: false,
    error: null,
    initializationError: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初始状态', () => {
    it('应该返回正确的初始状态', () => {
      const result = modelReducer(undefined, { type: 'unknown' });
      expect(result).toEqual(initialState);
    });
  });

  describe('clearError', () => {
    it('应该清除操作错误信息', () => {
      const stateWithError = {
        ...initialState,
        error: 'Some error occurred',
      };
      const result = modelReducer(stateWithError, clearError());
      expect(result.error).toBeNull();
    });
  });

  describe('clearInitializationError', () => {
    it('应该清除初始化错误信息', () => {
      const stateWithError = {
        ...initialState,
        initializationError: 'Initialization failed',
      };
      const result = modelReducer(stateWithError, clearInitializationError());
      expect(result.initializationError).toBeNull();
    });
  });

  describe('createModel', () => {
    it('应该添加新模型到列表', () => {
      const model = createMockModel();
      const result = modelReducer(initialState, createModel({ model }));

      expect(result.models).toHaveLength(1);
      expect(result.models[0]).toEqual(model);
    });

    it('应该保持状态不可变性', () => {
      const model = createMockModel();
      const state = { ...initialState };
      const result = modelReducer(state, createModel({ model }));

      expect(result).not.toBe(state);
      expect(state.models).toHaveLength(0);
      expect(result.models).toHaveLength(1);
    });
  });

  describe('editModel', () => {
    it('应该编辑现有模型', () => {
      const originalModel = createMockModel({ id: 'model-1', nickname: 'Original Name' });
      const updatedModel = createMockModel({ id: 'model-1', nickname: 'Updated Name' });

      const stateWithModel = {
        ...initialState,
        models: [originalModel],
      };

      const result = modelReducer(stateWithModel, editModel({ model: updatedModel }));

      expect(result.models).toHaveLength(1);
      expect(result.models[0].nickname).toBe('Updated Name');
    });

    it('应该处理不存在的模型ID', () => {
      const originalModel = createMockModel({ id: 'model-1' });
      const nonExistentModel = createMockModel({ id: 'model-999' });

      const stateWithModel = {
        ...initialState,
        models: [originalModel],
      };

      const result = modelReducer(stateWithModel, editModel({ model: nonExistentModel }));

      expect(result.models).toHaveLength(1);
      expect(result.models[0]).toEqual(originalModel);
    });
  });

  describe('deleteModel', () => {
    it('应该标记模型为已删除而不是真删除', () => {
      const model = createMockModel({ id: 'model-1', isDeleted: false });

      const stateWithModel = {
        ...initialState,
        models: [model],
      };

      const result = modelReducer(stateWithModel, deleteModel({ model }));

      expect(result.models).toHaveLength(1);
      expect(result.models[0].isDeleted).toBe(true);
    });

    it('应该处理不存在的模型ID', () => {
      const model = createMockModel({ id: 'model-1' });
      const nonExistentModel = createMockModel({ id: 'model-999' });

      const stateWithModel = {
        ...initialState,
        models: [model],
      };

      const result = modelReducer(stateWithModel, deleteModel({ model: nonExistentModel }));

      expect(result.models).toHaveLength(1);
      expect(result.models[0].isDeleted).toBe(false);
    });
  });

  describe('initializeModels', () => {
    it('应该处理初始化模型成功', async () => {
      const { loadModels } = await import('@/store/vaults/modelVault');
      const mockModels = [createMockModel(), createMockModel({ id: 'model-2' })];
      vi.mocked(loadModels).mockResolvedValue(mockModels);

      const pendingAction = { type: initializeModels.pending.type };
      const fulfilledAction = {
        type: initializeModels.fulfilled.type,
        payload: mockModels,
      };

      // 测试pending状态
      let result = modelReducer(initialState, pendingAction);
      expect(result.loading).toBe(true);
      expect(result.initializationError).toBeNull();

      // 测试fulfilled状态
      result = modelReducer(result, fulfilledAction);
      expect(result.loading).toBe(false);
      expect(result.models).toEqual(mockModels);
    });

    it('应该处理初始化模型失败', async () => {
      const { loadModels } = await import('@/store/vaults/modelVault');
      vi.mocked(loadModels).mockRejectedValue(new Error('Failed to load models'));

      const pendingAction = { type: initializeModels.pending.type };
      const rejectedAction = {
        type: initializeModels.rejected.type,
        error: { message: 'Failed to load models' },
      };

      // 测试pending状态
      let result = modelReducer(initialState, pendingAction);
      expect(result.loading).toBe(true);
      expect(result.initializationError).toBeNull();

      // 测试rejected状态
      result = modelReducer(result, rejectedAction);
      expect(result.loading).toBe(false);
      expect(result.initializationError).toBe('Failed to load models');
    });

    it('应该处理没有错误消息的初始化失败', async () => {
      const { loadModels } = await import('@/store/vaults/modelVault');
      vi.mocked(loadModels).mockRejectedValue(new Error());

      const rejectedAction = {
        type: initializeModels.rejected.type,
        error: { message: undefined },
      };

      const result = modelReducer(initialState, rejectedAction);
      expect(result.loading).toBe(false);
      expect(result.initializationError).toBe('Failed to initialize file');
    });
  });

  describe('状态不可变性', () => {
    it('应该保持状态不可变性', () => {
      const model = createMockModel();
      const state = {
        ...initialState,
        models: [model],
        error: 'Some error message', // 添加错误状态以确保有变化
      };

      const newState = modelReducer(state, clearError());

      expect(newState).not.toBe(state);
      expect(state.models).toEqual(newState.models);
      expect(newState.error).toBeNull();
    });
  });

  describe('边界情况', () => {
    it('应该处理未知action类型', () => {
      const state = {
        ...initialState,
        models: [createMockModel()],
      };
      const result = modelReducer(state, { type: 'UNKNOWN_ACTION' });
      expect(result).toBe(state);
    });

    it('应该处理空模型列表', () => {
      const model = createMockModel();
      const state = { ...initialState, models: [model] };
      const action = { type: 'models/clearModels' } as { type: string };
      const result = modelReducer(state, action);
      // 对于未知action，应该返回原状态
      expect(result).toBe(state);
      expect(result.models).toEqual([model]);
    });
  });

  describe('错误场景测试', () => {
    it('应该处理initializeModels的错误场景', () => {
      const state = { ...initialState, loading: true };
      const errorMessage = 'Failed to load models';
      const rejectedAction = {
        type: initializeModels.rejected.type,
        error: { message: errorMessage },
      };

      const result = modelReducer(state, rejectedAction);

      expect(result.loading).toBe(false);
      expect(result.initializationError).toBe(errorMessage);
    });

    it('应该处理initializeModels错误时没有错误消息的情况', () => {
      const state = { ...initialState, loading: true };
      const rejectedAction = {
        type: initializeModels.rejected.type,
        error: {},
      };

      const result = modelReducer(state, rejectedAction);

      expect(result.loading).toBe(false);
      expect(result.initializationError).toBe('Failed to initialize file');
    });

    it('应该正确清除错误状态', () => {
      const state = {
        ...initialState,
        error: 'Some error message',
        initializationError: 'Initialization error',
      };

      const result = modelReducer(state, clearError());

      expect(result.error).toBeNull();
      // clearError只清除error字段，不清除initializationError
      expect(result.initializationError).toBe('Initialization error');
    });

    it('应该正确清除初始化错误状态', () => {
      const state = {
        ...initialState,
        error: 'Some error message',
        initializationError: 'Initialization error',
      };

      const result = modelReducer(state, clearInitializationError());

      expect(result.error).toBe('Some error message');
      expect(result.initializationError).toBeNull();
    });
  });
});