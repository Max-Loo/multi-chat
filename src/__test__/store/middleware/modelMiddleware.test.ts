/**
 * modelMiddleware 单元测试
 *
 * 测试 Listener Middleware 的触发时机和数据持久化副作用
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { saveModelsMiddleware } from '@/store/middleware/modelMiddleware';
import { saveModelsToJson } from '@/store/storage';
import {
  createModel,
  deleteModel,
  editModel,
} from '@/store/slices/modelSlice';
import { ModelProviderKeyEnum } from '@/utils/enums';
import { createMiddlewareTestStore } from './createMiddlewareTestStore';
import { createMockModel } from '@/__test__/helpers/fixtures/model';

// Mock 存储层
vi.mock('@/store/storage', () => ({
  saveModelsToJson: vi.fn().mockResolvedValue(undefined),
}));

const mockSaveModelsToJson = vi.mocked(saveModelsToJson);

describe('modelMiddleware', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // Reason: Redux Toolkit 严格类型系统限制
  let store: any;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Mock 模型数据（使用工厂创建）
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
    vi.clearAllMocks();
    store = createMiddlewareTestStore(saveModelsMiddleware.middleware);
  });

  describe('模型操作触发保存', () => {
    it('应该在创建模型时触发保存', async () => {
      await store.dispatch(createModel({ model: mockModel }));

      // 等待 Listener Middleware 异步 effect 完成
      await vi.waitFor(() => {
        expect(mockSaveModelsToJson).toHaveBeenCalledWith(expect.any(Array));
      });
      expect(mockSaveModelsToJson).toHaveBeenCalledTimes(1);
    });

    it('应该在编辑模型时触发保存', async () => {
      const updatedModel = { ...mockModel, modelName: 'Updated Name' };
      await store.dispatch(editModel({ model: updatedModel }));

      await vi.waitFor(() => {
        expect(mockSaveModelsToJson).toHaveBeenCalled();
      });
      expect(mockSaveModelsToJson).toHaveBeenCalledTimes(1);
    });

    it('应该在删除模型时触发保存', async () => {
      await store.dispatch(deleteModel({ model: mockModel }));

      await vi.waitFor(() => {
        expect(mockSaveModelsToJson).toHaveBeenCalled();
      });
      expect(mockSaveModelsToJson).toHaveBeenCalledTimes(1);
    });
  });

  describe('不匹配的 action 不触发保存', () => {
    it('应该在非模型操作时不触发保存', async () => {
      // Dispatch 不相关的 action
      store.dispatch({ type: 'some/other/action' });

      // 等待一个微任务周期确保 effect 有机会执行
      await vi.advanceTimersByTimeAsync(0);

      // 验证 saveModelsToJson 没有被调用
      expect(mockSaveModelsToJson).not.toHaveBeenCalled();
    });
  });

  describe('从 Store 获取最新状态', () => {
    it('应该传递最新的 models 给 saveModelsToJson', async () => {
      await store.dispatch(createModel({ model: mockModel }));

      await vi.waitFor(() => {
        const savedModels = mockSaveModelsToJson.mock.calls[0]?.[0];
        expect(savedModels).toContainEqual(mockModel);
      });
    });

    it('应该在创建后从 store 读取到一致的数据', async () => {
      await store.dispatch(createModel({ model: mockModel }));

      // 验证 store 中的 models 状态已更新
      const state = store.getState();
      expect(state.models.models).toContainEqual(mockModel);
    });

    it('应该在编辑后从 store 读取到更新后的数据', async () => {
      await store.dispatch(createModel({ model: mockModel }));

      const updatedModel = { ...mockModel, modelName: 'Updated Name' };
      await store.dispatch(editModel({ model: updatedModel }));

      // 验证 store 中的数据已更新
      const state = store.getState();
      const savedModel = state.models.models.find((m: any) => m.id === mockModel.id);
      expect(savedModel.modelName).toBe('Updated Name');
    });

    it('应该在删除后标记数据为已删除', async () => {
      await store.dispatch(createModel({ model: mockModel }));
      await store.dispatch(deleteModel({ model: mockModel }));

      // 验证 store 中的数据已被标记为删除
      const state = store.getState();
      const deletedModel = state.models.models.find((m: any) => m.id === mockModel.id);
      expect(deletedModel.isDeleted).toBe(true);
    });
  });
});
