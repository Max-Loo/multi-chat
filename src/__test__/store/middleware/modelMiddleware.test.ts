/**
 * modelMiddleware 单元测试
 *
 * 测试 Listener Middleware 的触发时机和数据持久化副作用
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { saveModelsMiddleware } from '@/store/middleware/modelMiddleware';
import { saveModelsToJson } from '@/store/storage';
import {
  createModel,
  deleteModel,
  editModel,
} from '@/store/slices/modelSlice';
import modelReducer from '@/store/slices/modelSlice';
import chatReducer from '@/store/slices/chatSlices';
import chatPageReducer from '@/store/slices/chatPageSlices';
import appConfigReducer from '@/store/slices/appConfigSlices';
import modelProviderReducer from '@/store/slices/modelProviderSlice';
import { ModelProviderKeyEnum } from '@/utils/enums';

// Mock 存储层
vi.mock('@/store/storage', () => ({
  saveModelsToJson: vi.fn().mockResolvedValue(undefined),
}));

const mockSaveModelsToJson = vi.mocked(saveModelsToJson);

describe('modelMiddleware', () => {
  let store: any;

  // 创建测试用的 Redux store（包含 middleware 和完整的 RootState）
  const createTestStore = () => {
    return configureStore({
      reducer: {
        models: modelReducer,
        chat: chatReducer,
        chatPage: chatPageReducer,
        appConfig: appConfigReducer,
        modelProvider: modelProviderReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(saveModelsMiddleware.middleware),
    });
  };

  // Mock 模型数据（符合 Model 接口）
  const mockModel = {
    id: 'model1',
    modelKey: 'deepseek-chat',
    modelName: 'DeepSeek Chat',
    providerKey: ModelProviderKeyEnum.DEEPSEEK,
    apiKey: 'encrypted-key',
    apiAddress: 'https://api.deepseek.com',
    nickname: 'DeepSeek',
    isEnable: true,
    createdAt: '2024-01-01 00:00:00',
    updateAt: '2024-01-01 00:00:00',
    providerName: 'DeepSeek',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore();
  });

  describe('模型操作触发保存', () => {
    it('应该在创建模型时触发保存', async () => {
      await store.dispatch(createModel({ model: mockModel }));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 saveModelsToJson 被调用
      expect(mockSaveModelsToJson).toHaveBeenCalledTimes(1);
      expect(mockSaveModelsToJson).toHaveBeenCalledWith(expect.any(Array));
    });

    it('应该在编辑模型时触发保存', async () => {
      const updatedModel = { ...mockModel, modelName: 'Updated Name' };
      await store.dispatch(editModel({ model: updatedModel }));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 saveModelsToJson 被调用
      expect(mockSaveModelsToJson).toHaveBeenCalledTimes(1);
    });

    it('应该在删除模型时触发保存', async () => {
      await store.dispatch(deleteModel({ model: mockModel }));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 saveModelsToJson 被调用
      expect(mockSaveModelsToJson).toHaveBeenCalledTimes(1);
    });
  });

  describe('不匹配的 action 不触发保存', () => {
    it('应该在非模型操作时不触发保存', async () => {
      // Dispatch 不相关的 action
      store.dispatch({ type: 'some/other/action' });

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证 saveModelsToJson 没有被调用
      expect(mockSaveModelsToJson).not.toHaveBeenCalled();
    });
  });

  describe('从 Store 获取最新状态', () => {
    it('应该传递最新的 models 给 saveModelsToJson', async () => {
      // 先创建一个模型
      await store.dispatch(createModel({ model: mockModel }));

      // 等待异步 effect 完成
      await new Promise(resolve => setTimeout(resolve, 0));

      // 验证传递了最新的 models 数组
      const savedModels = mockSaveModelsToJson.mock.calls[0][0];
      expect(savedModels).toContainEqual(mockModel);
    });
  });
});
