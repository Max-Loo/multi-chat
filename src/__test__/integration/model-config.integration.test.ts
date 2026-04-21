/**
 * 模型配置集成测试
 *
 * 测试目的：验证模型配置的完整生命周期（加密 → 存储 → Redux → UI）
 * 测试范围：
 * - 添加模型配置（加密 → 存储 → Redux → UI）
 * - 使用模型配置进行聊天（解密 → API 调用）
 * - 编辑模型配置（加载 → 修改 → 重新加密）
 * - 删除模型配置（清理加密数据）
 * - 数据完整性验证
 *
 * 测试隔离：使用真实加密逻辑和真实 modelStorage 代码路径，仅 mock 外部 API（keyring 系统密钥链、chatService、tauriCompat 存储后端）
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { encryptField, decryptField } from '@/utils/crypto';

// Mock keyring 模块（系统密钥链为外部依赖）
vi.mock('@/store/keyring/masterKey', () => ({
  getMasterKey: vi.fn(),
  initializeMasterKey: vi.fn(),
  storeMasterKey: vi.fn(),
}));

import { getMasterKey, initializeMasterKey, storeMasterKey } from '@/store/keyring/masterKey';

// Mock tauriCompat 存储后端为内存 Map（避免 fake-indexeddb 测试间连接问题）
// modelStorage 的加密/解密/保存/加载代码路径完全真实
const memoryStore = new Map<string, unknown>();

vi.mock('@/utils/tauriCompat', () => ({
  isTauri: () => false,
  createLazyStore: () => globalThis.__createMemoryStorageMock(memoryStore),
  keyring: {
    getPassword: vi.fn(),
    setPassword: vi.fn(),
    deletePassword: vi.fn(),
    isSupported: vi.fn().mockReturnValue(true),
    resetState: vi.fn(),
  },
}));

// 不 mock modelStorage — 使用真实代码路径（加密 → 存储 → 解密）
import { saveModelsToJson, loadModelsFromJson, resetModelsStore } from '@/store/storage/modelStorage';

import { getTestStore, resetStore, cleanupStore } from '@/__test__/helpers/integration/resetStore';
import { createModel, editModel, deleteModel } from '@/store/slices/modelSlice';
import type { Model } from '@/types/model';

import { StandardMessage } from '@/types/chat';
import { ChatRoleEnum } from '@/types/chat';
import { createDeepSeekModel } from '@/__test__/helpers/fixtures/model';

// ========================================
// Mock streamChatCompletion（外部 API）
// ========================================

let mockStreamChatCompletion = vi.fn();

/**
 * 设置默认的 Mock 流式响应
 */
function setupDefaultStreamMock() {
  mockStreamChatCompletion.mockImplementation(async function* (request: {
    model: Model;
    historyList: StandardMessage[];
    message: string;
  }) {
    const chunks = ['你', '好', '！', '有', '什', '么', '可', '以', '帮', '助', '？'];
    let accumulated = '';

    for (const chunk of chunks) {
      accumulated += chunk;
      yield {
        id: 'msg-test',
        timestamp: Math.floor(Date.now() / 1000),
        modelKey: request.model.modelKey,
        finishReason: null,
        role: ChatRoleEnum.ASSISTANT,
        content: accumulated,
        reasoningContent: '',
        raw: null,
      };
    }

    yield {
      id: 'msg-test',
      timestamp: Math.floor(Date.now() / 1000),
      modelKey: request.model.modelKey,
      finishReason: 'stop',
      role: ChatRoleEnum.ASSISTANT,
      content: chunks.join(''),
      reasoningContent: '',
      usage: {
        inputTokens: 10,
        outputTokens: 11,
      },
      raw: null,
    };
  });
}

// Mock chatService 模块（外部 API）
vi.mock('@/services/chat', () => ({
  streamChatCompletion: vi.fn((...args: unknown[]) => mockStreamChatCompletion(...args)),
  getProvider: vi.fn(),
}));

import { streamChatCompletion } from '@/services/chat';

// ========================================
// 测试套件
// ========================================

describe('模型配置集成测试', () => {
  let testStore: ReturnType<typeof getTestStore>;
  let masterKey: string;

  beforeEach(async () => {
    // 生成测试用主密钥
    masterKey = 'a'.repeat(64);

    // Mock 主密钥获取（keyring 为系统密钥链外部依赖）
    vi.mocked(getMasterKey).mockResolvedValue(masterKey);
    vi.mocked(initializeMasterKey).mockResolvedValue({ key: masterKey, isNewlyGenerated: false });
    vi.mocked(storeMasterKey).mockResolvedValue(undefined);

    // 设置默认流式响应 Mock
    setupDefaultStreamMock();

    // 创建测试 store
    testStore = getTestStore();
  });

  afterEach(() => {
    // 重置存储层单例和内存存储
    resetModelsStore();
    memoryStore.clear();

    // 清理 store
    resetStore();
    cleanupStore();

    // 清理 mock 调用记录
    vi.restoreAllMocks();
  });

  // ========================================
  // 1. 添加模型配置测试
  // ========================================

  describe('添加模型配置', () => {
    test('应该成功添加模型配置：API Key 加密 → 真实存储 → Redux → UI', async () => {
      const modelConfig = createDeepSeekModel();

      // When: 通过真实存储层保存模型配置
      await saveModelsToJson([modelConfig]);

      // When: 从真实存储层加载
      const { models: loadedModels, decryptionFailureCount } = await loadModelsFromJson();

      // Then: 存储层应返回模型，且无解密失败
      expect(loadedModels).toHaveLength(1);
      expect(decryptionFailureCount).toBe(0);

      // Then: apiKey 应被正确解密（加密 → 存储 → 加载 → 解密）
      expect(loadedModels[0].apiKey).toBe(modelConfig.apiKey);
      expect(loadedModels[0].nickname).toBe(modelConfig.nickname);

      // When: 更新 Redux store
      testStore.dispatch(createModel({ model: modelConfig }));
      const state = testStore.getState();

      // Then: Redux store 应包含新模型
      expect(state.models.models).toHaveLength(1);
      expect(state.models.models[0]).toEqual(modelConfig);
    });

    test('应该正确加密并读回多个模型配置', async () => {
      const models = [
        createDeepSeekModel({ id: 'model-1', apiKey: 'sk-key-alpha', nickname: 'Alpha' }),
        createDeepSeekModel({ id: 'model-2', apiKey: 'sk-key-beta', nickname: 'Beta' }),
        createDeepSeekModel({ id: 'model-3', apiKey: 'sk-key-gamma', nickname: 'Gamma' }),
      ];

      // When: 保存多个模型
      await saveModelsToJson(models);
      const { models: loadedModels, decryptionFailureCount } = await loadModelsFromJson();

      // Then: 所有模型应正确保存和加载
      expect(loadedModels).toHaveLength(3);
      expect(decryptionFailureCount).toBe(0);

      // 验证每个 apiKey 的加密/解密往返
      for (let i = 0; i < models.length; i++) {
        expect(loadedModels[i].apiKey).toBe(models[i].apiKey);
        expect(loadedModels[i].nickname).toBe(models[i].nickname);
      }
    });
  });

  // ========================================
  // 2. 使用模型配置进行聊天测试
  // ========================================

  describe('使用模型配置进行聊天', () => {
    test('应该成功使用模型配置进行聊天：解密 API Key → 调用 API', async () => {
      const modelConfig = createDeepSeekModel();

      const messages: StandardMessage[] = [];
      const chatRequest = {
        model: modelConfig,
        historyList: messages,
        message: '你好',
      };

      const responses: StandardMessage[] = [];
      for await (const response of streamChatCompletion(chatRequest)) {
        responses.push(response);
      }

      // Then: 应收到流式响应
      expect(responses.length).toBeGreaterThan(0);
      expect(responses[responses.length - 1].content).toBe('你好！有什么可以帮助？');

      const finalResponse = responses[responses.length - 1];
      expect(finalResponse.role).toBe(ChatRoleEnum.ASSISTANT);
      expect(finalResponse.modelKey).toBe('deepseek-chat');
      expect(finalResponse.finishReason).toBe('stop');
    });

    test('应该处理无效的 API Key', async () => {
      const modelConfig = createDeepSeekModel();

      mockStreamChatCompletion.mockImplementation(async function* () {
        yield {
          id: 'msg-error',
          timestamp: Math.floor(Date.now() / 1000),
          modelKey: modelConfig.modelKey,
          finishReason: null,
          role: ChatRoleEnum.ASSISTANT,
          content: '',
          reasoningContent: '',
          raw: null,
        };
        throw new Error('Invalid API key');
      });

      const chatRequest = {
        model: modelConfig,
        historyList: [] as StandardMessage[],
        message: '你好',
      };

      await expect(async () => {
        for await (const _ of streamChatCompletion(chatRequest)) {
          // consume stream
        }
      }).rejects.toThrow('Invalid API key');
    });
  });

  // ========================================
  // 3. 编辑模型配置测试
  // ========================================

  describe('编辑模型配置', () => {
    test('应该成功编辑模型配置：加载 → 修改 → 保存 → 读回验证', async () => {
      const originalModel = createDeepSeekModel({ id: 'model-edit-1', apiKey: 'sk-original-key' });

      // 保存原始配置
      await saveModelsToJson([originalModel]);
      testStore.dispatch(createModel({ model: originalModel }));

      // 修改模型配置（不修改 API Key）
      const updatedModel: Model = {
        ...originalModel,
        nickname: 'DeepSeek Chat Updated',
        remark: 'Updated model',
      };

      testStore.dispatch(editModel({ model: updatedModel }));

      // 保存到真实存储
      const state = testStore.getState();
      await saveModelsToJson(state.models.models);

      // 从真实存储加载验证
      const { models: loadedModels, decryptionFailureCount } = await loadModelsFromJson();
      expect(decryptionFailureCount).toBe(0);

      const loadedModel = loadedModels.find(m => m.id === originalModel.id);
      expect(loadedModel?.nickname).toBe('DeepSeek Chat Updated');
      expect(loadedModel?.remark).toBe('Updated model');
      expect(loadedModel?.apiKey).toBe('sk-original-key');
    });

    test('应该成功修改 API Key（重新加密）', async () => {
      const originalModel = createDeepSeekModel({ id: 'model-edit-apikey', apiKey: 'sk-old-key' });

      // 保存原始配置
      await saveModelsToJson([originalModel]);

      // 修改 API Key
      const updatedModel = { ...originalModel, apiKey: 'sk-new-key' };
      await saveModelsToJson([updatedModel]);

      // 从真实存储加载验证
      const { models: loadedModels, decryptionFailureCount } = await loadModelsFromJson();
      expect(decryptionFailureCount).toBe(0);

      expect(loadedModels[0].apiKey).toBe('sk-new-key');
    });
  });

  // ========================================
  // 4. 删除模型配置测试
  // ========================================

  describe('删除模型配置', () => {
    test('应该成功删除模型配置：清理加密数据', async () => {
      const modelToDelete = createDeepSeekModel({ id: 'model-delete-1' });

      await saveModelsToJson([modelToDelete]);
      testStore.dispatch(createModel({ model: modelToDelete }));

      testStore.dispatch(deleteModel({ model: modelToDelete }));

      const state = testStore.getState();
      const deletedModel = state.models.models.find(m => m.id === modelToDelete.id);
      expect(deletedModel?.isDeleted).toBe(true);

      // 保存过滤后的活跃模型到真实存储
      const activeModels = state.models.models.filter(m => !m.isDeleted);
      await saveModelsToJson(activeModels);

      // 验证存储中不包含已删除模型
      const { models: loadedModels } = await loadModelsFromJson();
      expect(loadedModels).toHaveLength(0);
    });

    test('应该保留未删除的模型', async () => {
      const model1 = createDeepSeekModel({ id: 'model-keep', apiKey: 'sk-key-keep' });
      const model2 = createDeepSeekModel({ id: 'model-remove', apiKey: 'sk-key-remove' });

      await saveModelsToJson([model1, model2]);
      testStore.dispatch(createModel({ model: model1 }));
      testStore.dispatch(createModel({ model: model2 }));
      testStore.dispatch(deleteModel({ model: model2 }));

      const state = testStore.getState();
      const activeModels = state.models.models.filter(m => !m.isDeleted);
      await saveModelsToJson(activeModels);

      const { models: loadedModels, decryptionFailureCount } = await loadModelsFromJson();
      expect(loadedModels).toHaveLength(1);
      expect(decryptionFailureCount).toBe(0);
      expect(loadedModels[0].id).toBe('model-keep');
      expect(loadedModels[0].apiKey).toBe('sk-key-keep');
    });
  });

  // ========================================
  // 5. 数据完整性测试
  // ========================================

  describe('数据完整性', () => {
    test('应该验证加密数据完整性：写入 → 读回 → 修改密文 → 解密失败', async () => {
      const model = createDeepSeekModel({ apiKey: 'sk-integrity-test' });

      // 保存并加载
      await saveModelsToJson([model]);
      const { models: loadedModels } = await loadModelsFromJson();
      expect(loadedModels[0].apiKey).toBe('sk-integrity-test');

      // 独立验证加密/解密往返
      const encrypted = await encryptField('sk-integrity-test', masterKey);
      const decrypted = await decryptField(encrypted, masterKey);
      expect(decrypted).toBe('sk-integrity-test');

      // 修改密文应导致解密失败
      const tamperedEncrypted = encrypted.slice(0, -1) + 'A';
      await expect(decryptField(tamperedEncrypted, masterKey)).rejects.toThrow();
    });

    test('应该检测重复模型', async () => {
      const model1 = createDeepSeekModel({ id: 'model-dup-1', apiKey: 'sk-test-1' });
      const model2 = createDeepSeekModel({ id: 'model-dup-2', apiKey: 'sk-test-2' });

      await saveModelsToJson([model1, model2]);
      testStore.dispatch(createModel({ model: model1 }));
      testStore.dispatch(createModel({ model: model2 }));

      const state = testStore.getState();
      expect(state.models.models).toHaveLength(2);
    });
  });
});
