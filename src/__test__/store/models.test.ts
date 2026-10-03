/**
 * models store 单元测试
 *
 * 测试模型管理、初始化、增删改查、软删除等核心功能
 *
 * 转写自 Redux modelSlice 测试，行为断言保持一致
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { Model } from '@/types/model';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { createMockModel } from '@/__test__/helpers/fixtures/model';

// Mock 依赖 - 必须在导入 store 之前执行
// 使用 vi.hoisted 确保变量在 vi.mock 之前被定义
const { mockLoadModelsFromJson, mockSaveModelsToJson } = vi.hoisted(() => ({
  mockLoadModelsFromJson: vi.fn<() => Promise<{ models: Model[]; decryptionFailureCount: number }>>(() =>
    Promise.resolve({ models: [], decryptionFailureCount: 0 })),
  mockSaveModelsToJson: vi.fn<(models: Model[]) => Promise<void>>(() => Promise.resolve(undefined)),
}));

// Mock modelStorage 模块
vi.mock('@/store/storage/modelStorage', () => ({
  loadModelsFromJson: mockLoadModelsFromJson,
  saveModelsToJson: mockSaveModelsToJson,
}));

// Mock chatStorage 模块
vi.mock('@/store/storage/chatStorage', () => ({
  loadChatsFromJson: vi.fn(() => Promise.resolve([])),
  saveChatsToJson: vi.fn(() => Promise.resolve(undefined)),
}));

import { useModelsStore } from '@/store/models';

describe('models store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockLoadModelsFromJson.mockResolvedValue({ models: [], decryptionFailureCount: 0 });
    mockSaveModelsToJson.mockClear();
  });

  describe('初始状态', () => {
    it('应该返回正确的初始状态', () => {
      const store = useModelsStore();
      expect(store.models).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBe(null);
      expect(store.initializationError).toBe(null);
    });
  });

  describe('initializeModels rejected', () => {
    it('应该在加载抛出异常时恢复 loading 并设置 initializationError', async () => {
      const store = useModelsStore();

      // 先添加模型验证回滚
      await store.createModel({ model: createMockModel({ id: 'existing-model' }) });
      expect(store.models).toHaveLength(1);

      // 设置 mock 使加载抛出异常
      mockLoadModelsFromJson.mockRejectedValue(new Error('Network timeout'));

      // 执行初始化
      await expect(store.initializeModels()).rejects.toThrow('Network timeout');

      expect(store.loading).toBe(false);
      expect(store.initializationError).toBe('Network timeout');
      // 现有模型列表不变
      expect(store.models).toHaveLength(1);
    });

    it('应该在加载抛出非 Error 类型时使用默认错误消息', async () => {
      const store = useModelsStore();

      // 设置 mock 使加载抛出非 Error 类型
      mockLoadModelsFromJson.mockRejectedValue('string error');

      await expect(store.initializeModels()).rejects.toThrow();

      expect(store.loading).toBe(false);
      expect(store.initializationError).toBe('Failed to initialize file');
    });

    it('应该在初始化成功时更新模型列表', async () => {
      const model = createMockModel({ id: 'loaded-model' });
      mockLoadModelsFromJson.mockResolvedValue({ models: [model], decryptionFailureCount: 0 });

      const store = useModelsStore();
      const result = await store.initializeModels();

      expect(store.loading).toBe(false);
      expect(store.models).toHaveLength(1);
      expect(result.models).toHaveLength(1);
    });
  });

  describe('CRUD 操作与持久化', () => {
    it('创建模型后应该触发持久化', async () => {
      const store = useModelsStore();
      await store.createModel({ model: createMockModel({ id: 'model-1' }) });

      expect(store.models).toHaveLength(1);
      expect(mockSaveModelsToJson).toHaveBeenCalledTimes(1);
    });

    it('应该在编辑不存在模型时不修改状态', async () => {
      const store = useModelsStore();
      const model1 = createMockModel({ id: 'model-1', nickname: 'Model 1' });
      const model2 = createMockModel({ id: 'model-2', nickname: 'Model 2' });

      await store.createModel({ model: model1 });

      // 尝试编辑不存在的模型
      await store.editModel({ model: model2 });

      expect(store.models).toHaveLength(1);
      expect(store.models[0].nickname).toBe('Model 1'); // 保持不变
    });

    it('软删除的模型仍然可以被找到', async () => {
      const store = useModelsStore();
      const model = createMockModel();
      await store.createModel({ model });
      await store.deleteModel({ model });

      const found = store.models.find((m: Model) => m.id === model.id);

      // 软删除的模型仍然可以被找到
      expect(found).toBeDefined();
      expect(found?.isDeleted).toBe(true);
    });
  });

  describe('错误状态清理', () => {
    it('应该清除初始化错误信息', async () => {
      const store = useModelsStore();

      // 先设置一个初始化错误
      mockLoadModelsFromJson.mockRejectedValue(new Error('Init error'));
      await expect(store.initializeModels()).rejects.toThrow();
      expect(store.initializationError).toBe('Init error');

      // 清除错误
      store.clearInitializationError();

      expect(store.initializationError).toBe(null);
    });

    it('应该清除操作错误信息', () => {
      const store = useModelsStore();

      store.clearError();

      expect(store.error).toBe(null);
    });
  });
});

/**
 * 持久化副作用测试（转写自 Redux modelMiddleware 测试）
 *
 * 原 Listener Middleware 监听 createModel/editModel/deleteModel 后调用 saveModelsToJson，
 * Pinia 版本中该副作用已并入 useModelsStore 的对应 action 内，行为断言保持一致：
 * - 原 "dispatch X action 后 middleware 应该保存" → "调用 store.x() 方法后应调用 mock 的保存函数"
 * - 原监听 matcher 条件（不匹配的 action 不触发保存）→ 非持久化方法不触发保存
 */
describe('models store 持久化副作用', () => {
  // Mock 模型数据（与原 modelMiddleware 测试一致，使用工厂创建）
  const mockModel = createMockModel({
    id: 'model1',
    modelKey: 'deepseek-chat',
    modelName: 'DeepSeek Chat',
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    nickname: 'DeepSeek',
    providerName: 'DeepSeek',
    apiAddress: 'https://api.deepseek.com',
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    mockSaveModelsToJson.mockClear();
  });

  describe('模型操作触发保存', () => {
    it('应该在创建模型时触发保存', async () => {
      const store = useModelsStore();

      await store.createModel({ model: mockModel });

      // 等待异步副作用完成
      await vi.waitFor(() => {
        expect(mockSaveModelsToJson).toHaveBeenCalledWith(expect.any(Array));
      });
      expect(mockSaveModelsToJson).toHaveBeenCalledTimes(1);
    });

    it('应该在编辑模型时触发保存', async () => {
      const store = useModelsStore();
      const updatedModel = { ...mockModel, modelName: 'Updated Name' };

      await store.editModel({ model: updatedModel });

      await vi.waitFor(() => {
        expect(mockSaveModelsToJson).toHaveBeenCalled();
      });
      expect(mockSaveModelsToJson).toHaveBeenCalledTimes(1);
    });

    it('应该在删除模型时触发保存', async () => {
      const store = useModelsStore();

      await store.deleteModel({ model: mockModel });

      await vi.waitFor(() => {
        expect(mockSaveModelsToJson).toHaveBeenCalled();
      });
      expect(mockSaveModelsToJson).toHaveBeenCalledTimes(1);
    });
  });

  describe('非模型操作不触发保存', () => {
    it('应该在非模型操作时不触发保存', () => {
      const store = useModelsStore();

      // 调用不触发持久化的方法（等价于原 "dispatch 不相关的 action"）
      store.clearError();

      expect(mockSaveModelsToJson).not.toHaveBeenCalled();
    });
  });

  describe('从 Store 获取最新状态', () => {
    it('应该传递最新的 models 给 saveModelsToJson', async () => {
      const store = useModelsStore();

      await store.createModel({ model: mockModel });

      await vi.waitFor(() => {
        const savedModels = mockSaveModelsToJson.mock.calls[0]?.[0];
        expect(savedModels).toContainEqual(mockModel);
      });
    });

    it('应该在创建后从 store 读取到一致的数据', async () => {
      const store = useModelsStore();

      await store.createModel({ model: mockModel });

      // 验证 store 中的 models 状态已更新
      expect(store.models).toContainEqual(mockModel);
    });

    it('应该在编辑后从 store 读取到更新后的数据', async () => {
      const store = useModelsStore();

      await store.createModel({ model: mockModel });

      const updatedModel = { ...mockModel, modelName: 'Updated Name' };
      await store.editModel({ model: updatedModel });

      // 验证 store 中的数据已更新
      const savedModel = store.models.find((m: Model) => m.id === mockModel.id);
      expect(savedModel?.modelName).toBe('Updated Name');
    });

    it('应该在删除后标记数据为已删除', async () => {
      const store = useModelsStore();

      await store.createModel({ model: mockModel });
      await store.deleteModel({ model: mockModel });

      // 验证 store 中的数据已被标记为删除
      const deletedModel = store.models.find((m: Model) => m.id === mockModel.id);
      expect(deletedModel?.isDeleted).toBe(true);
    });
  });
});
