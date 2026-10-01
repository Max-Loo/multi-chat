/**
 * modelStore 单元测试
 *
 * 覆盖：CRUD 语义（软删除）、初始化、持久化插件。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockModel } from '@/__test__/helpers/fixtures/model';

const mockSaveModelsToJson = vi.fn();
const mockLoadModelsFromJson = vi.fn();

vi.mock('@/store/storage', () => ({
  loadModelsFromJson: (...args: unknown[]) => mockLoadModelsFromJson(...args),
  saveModelsToJson: (...args: unknown[]) => mockSaveModelsToJson(...args),
  loadChatIndex: vi.fn(() => Promise.resolve([])),
  loadChatById: vi.fn(() => Promise.resolve(undefined)),
  saveChatAndIndex: vi.fn(() => Promise.resolve(undefined)),
  deleteChatFromStorage: vi.fn(() => Promise.resolve(undefined)),
}));

import { useModelStore } from '@/stores/modelStore';
import { setupPinia } from './setupPinia';

describe('modelStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setupPinia();
  });

  it('createModel 应追加模型并触发持久化', async () => {
    const store = useModelStore();
    const model = createMockModel({ id: 'm1' });

    store.createModel(model);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(store.models).toHaveLength(1);
    expect(mockSaveModelsToJson).toHaveBeenCalledWith([model]);
  });

  it('editModel 应按 id 定位替换', () => {
    const store = useModelStore();
    store.createModel(createMockModel({ id: 'm1', modelName: 'old' }));

    store.editModel(createMockModel({ id: 'm1', modelName: 'new' }));

    expect(store.models).toHaveLength(1);
    expect(store.models[0].modelName).toBe('new');
    expect(store.models[0].id).toBe('m1');
  });

  it('editModel 对不存在的 id 应静默跳过', () => {
    const store = useModelStore();

    store.editModel(createMockModel({ id: 'ghost' }));

    expect(store.models).toHaveLength(0);
  });

  it('deleteModel 应软删除（标记 isDeleted，不真删除）', () => {
    const store = useModelStore();
    store.createModel(createMockModel({ id: 'm1' }));

    store.deleteModel(createMockModel({ id: 'm1' }));

    expect(store.models).toHaveLength(1);
    expect(store.models[0].isDeleted).toBe(true);
  });

  it('initializeModels 成功时应更新 models 并清除 loading', async () => {
    const models = [createMockModel({ id: 'a' }), createMockModel({ id: 'b' })];
    mockLoadModelsFromJson.mockResolvedValue({ models });

    const store = useModelStore();
    const result = await store.initializeModels();

    expect(result).toHaveLength(2);
    expect(store.models).toHaveLength(2);
    expect(store.loading).toBe(false);
    expect(store.initializationError).toBeNull();
  });

  it('initializeModels 失败时应记录初始化错误并抛出', async () => {
    mockLoadModelsFromJson.mockRejectedValue(new Error('storage broken'));

    const store = useModelStore();
    await expect(store.initializeModels()).rejects.toThrow('storage broken');

    expect(store.loading).toBe(false);
    expect(store.initializationError).toBe('storage broken');
  });

  it('clearError / clearInitializationError 应清除对应错误', () => {
    const store = useModelStore();

    // 直接注入内部状态验证清理语义
    store.$patch({ error: 'x', initializationError: 'y' });
    store.clearError();
    expect(store.error).toBeNull();
    store.clearInitializationError();
    expect(store.initializationError).toBeNull();
  });
});
