/**
 * Pinia model store 单元测试（Vue 版）
 *
 * 承接被删除的 Redux 版 modelSlice 测试的核心行为：
 * - 初始化加载（成功/失败）
 * - 模型增删改（持久化下沉）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

vi.mock('@/store/storage', () => ({
  loadModelsFromJson: vi.fn(),
  saveModelsToJson: vi.fn().mockResolvedValue(undefined),
}));

import { useModelStore } from '@/store/pinia/model';
import { loadModelsFromJson, saveModelsToJson } from '@/store/storage';
import { createMockModel } from '@/__test__/helpers/fixtures/model';

describe('Pinia model store', () => {
  let store: ReturnType<typeof useModelStore>;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useModelStore();
    vi.clearAllMocks();
  });

  describe('initializeModels', () => {
    it('加载成功应填充模型列表', async () => {
      const models = [createMockModel({ id: 'm1' }), createMockModel({ id: 'm2' })];
      vi.mocked(loadModelsFromJson).mockResolvedValueOnce({
        models,
        decryptionFailureCount: 0,
      } as never);

      const result = await store.initializeModels();

      expect(result?.models).toHaveLength(2);
      expect(store.models).toHaveLength(2);
      expect(store.loading).toBe(false);
      expect(store.initializationError).toBeNull();
    });

    it('加载失败应记录 initializationError 并返回 undefined', async () => {
      vi.mocked(loadModelsFromJson).mockRejectedValueOnce(new Error('解密失败'));

      const result = await store.initializeModels();

      expect(result).toBeUndefined();
      expect(store.initializationError).toBe('解密失败');
      expect(store.loading).toBe(false);
    });
  });

  describe('模型增删改（持久化下沉）', () => {
    it('createModel 应追加并持久化', async () => {
      const model = createMockModel({ id: 'm1' });

      await store.createModel({ model });

      expect(store.models).toHaveLength(1);
      expect(saveModelsToJson).toHaveBeenCalledWith(store.models);
    });

    it('editModel 应按 id 定位替换并持久化', async () => {
      store.models = [createMockModel({ id: 'm1', nickname: '旧' })];
      const edited = createMockModel({ id: 'm1', nickname: '新' });

      await store.editModel({ model: edited });

      expect(store.models[0].nickname).toBe('新');
      expect(saveModelsToJson).toHaveBeenCalled();
    });

    it('deleteModel 应标记删除而非移除', async () => {
      store.models = [createMockModel({ id: 'm1' })];

      await store.deleteModel({ model: store.models[0] });

      expect(store.models).toHaveLength(1);
      expect(store.models[0].isDeleted).toBe(true);
      expect(saveModelsToJson).toHaveBeenCalled();
    });
  });
});
