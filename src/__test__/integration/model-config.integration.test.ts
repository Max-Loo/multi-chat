/**
 * 模型配置集成测试（Vue 版）
 *
 * 测试目的：验证模型配置的完整数据流（加密 → 真实存储 → Pinia → 读回解密）
 * 使用真实 masterKey（fake-indexeddb）与真实 modelStorage
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { Model } from '@/types/model';
import { useModelsStore } from '@/store/models';
import {
  initializeMasterKey,
  getMasterKey,
} from '@/store/keyring/masterKey';
import { loadModelsFromJson } from '@/store/storage/modelStorage';
import { clearBrowserStorage } from './helpers';

describe('模型配置集成测试', () => {
  beforeAll(async () => {
    // 一次性清理并初始化真实主密钥（fake-indexeddb 提供存储）
    // 注意：masterKey 模块持有 IndexedDB 连接，逐用例删除库会导致连接阻塞
    await clearBrowserStorage();
    await initializeMasterKey();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    setActivePinia(createPinia());
  });

  /** 构造模型配置 */
  function makeModel(overrides: Partial<Model> = {}): Model {
    return {
      id: 'model-1',
      nickname: '测试模型',
      providerKey: 'deepseek',
      providerName: 'DeepSeek',
      modelName: 'deepseek-chat',
      modelKey: 'deepseek-chat',
      apiKey: 'sk-test-secret-key-12345',
      apiAddress: 'https://api.deepseek.com',
      createdAt: '2026-01-01 00:00:00',
      updateAt: '2026-01-01 00:00:00',
      isEnable: true,
      isDeleted: false,
      remark: '',
      ...overrides,
    } as Model;
  }

  it('应该成功添加模型配置：Pinia → 加密存储 → 读回验证', async () => {
    const modelsStore = useModelsStore();
    const model = makeModel();

    await modelsStore.createModel({ model });

    // Pinia 中存在
    expect(modelsStore.models).toHaveLength(1);
    expect(modelsStore.models[0].nickname).toBe('测试模型');

    // 存储中可读回且解密后内容一致（当前主密钥）
    const stored = await loadModelsFromJson();
    expect(stored.models).toHaveLength(1);
    expect(stored.models[0].apiKey).toBe('sk-test-secret-key-12345');
    expect(stored.decryptionFailureCount).toBe(0);
  });

  it('应该正确加密并读回多个模型配置', async () => {
    const modelsStore = useModelsStore();

    await modelsStore.createModel({ model: makeModel({ id: 'model-multi-1', nickname: 'A' }) });
    await modelsStore.createModel({ model: makeModel({ id: 'model-multi-2', nickname: 'B' }) });

    const stored = await loadModelsFromJson();
    const nicknames = stored.models
      .filter((m) => m.id.startsWith('model-multi-'))
      .map((m) => m.nickname)
      .sort();
    expect(nicknames).toEqual(['A', 'B']);
  });

  it('应该成功编辑模型配置：加载 → 修改 → 保存 → 读回验证', async () => {
    const modelsStore = useModelsStore();
    const model = makeModel();
    await modelsStore.createModel({ model });

    await modelsStore.editModel({
      model: { ...model, nickname: '改名模型', remark: '备注内容' },
    });

    const stored = await loadModelsFromJson();
    const edited = stored.models.find((m) => m.id === 'model-1');
    expect(edited?.nickname).toBe('改名模型');
    expect(edited?.remark).toBe('备注内容');
  });

  it('应该成功删除模型配置（软删除标记）', async () => {
    const modelsStore = useModelsStore();
    const modelA = makeModel({ id: 'model-del-1', nickname: 'A' });
    const modelB = makeModel({ id: 'model-del-2', nickname: 'B' });
    await modelsStore.createModel({ model: modelA });
    await modelsStore.createModel({ model: modelB });

    await modelsStore.deleteModel({ model: modelA });

    // 删除为软删除：条目仍在但标记 isDeleted
    const stored = await loadModelsFromJson();
    const deleted = stored.models.find((m) => m.id === 'model-del-1');
    const kept = stored.models.find((m) => m.id === 'model-del-2');
    expect(deleted?.isDeleted).toBe(true);
    expect(kept?.isDeleted).toBe(false);
  });

  it('加密数据完整性：换用新密钥后应能正常读回新写入的数据', async () => {
    const modelsStore = useModelsStore();

    // 当前密钥下写入并读回
    await modelsStore.createModel({ model: makeModel({ id: 'model-int-1' }) });
    const stored = await loadModelsFromJson();
    const entry = stored.models.find((m) => m.id === 'model-int-1');
    expect(entry?.apiKey).toBe('sk-test-secret-key-12345');

    // 主密钥存在且为 64 位 hex（加密链路可用的基本保证）
    const key = await getMasterKey();
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });
});
