/**
 * 测试数据工厂单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMockModel, createMockModels, resetIdCounter, createDeepSeekModel, createKimiModel, createEncryptedModel } from './model';

describe('createMockModel', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('应该创建包含所有必需字段的 Model', () => {
    const model = createMockModel();

    expect(model.id).toBeDefined();
    expect(model.providerName).toBeDefined();
    expect(model.modelName).toBeDefined();
    expect(model.apiKey).toBeDefined();
    expect(model.isEnable).toBe(true);
  });

  it('应该支持覆盖单个字段', () => {
    const model = createMockModel({ apiKey: 'custom-key' });

    expect(model.apiKey).toBe('custom-key');
    expect(model.modelName).toBe('gpt-4');
  });

  it('应该支持覆盖多个字段', () => {
    const model = createMockModel({
      apiKey: 'new-key',
      modelName: 'gpt-3.5-turbo',
      isEnable: false,
    });

    expect(model.apiKey).toBe('new-key');
    expect(model.modelName).toBe('gpt-3.5-turbo');
    expect(model.isEnable).toBe(false);
  });

  it('每次调用应该生成不同的 ID', () => {
    const model1 = createMockModel();
    const model2 = createMockModel();

    expect(model1.id).not.toBe(model2.id);
  });
});

describe('createMockModels', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('应该创建指定数量的 Model', () => {
    const models = createMockModels(5);

    expect(models).toHaveLength(5);
  });

  it('所有 Model 应该有唯一的 ID', () => {
    const models = createMockModels(10);
    const ids = models.map((m) => m.id);

    expect(new Set(ids).size).toBe(10);
  });

  it('应该支持统一覆盖字段', () => {
    const models = createMockModels(3, { apiKey: 'shared-key' });

    models.forEach((model) => {
      expect(model.apiKey).toBe('shared-key');
    });
  });

  it('应该支持函数式覆盖', () => {
    const models = createMockModels(3, (index) => ({
      nickname: `Model ${index + 1}`,
    }));

    expect(models[0].nickname).toBe('Model 1');
    expect(models[1].nickname).toBe('Model 2');
    expect(models[2].nickname).toBe('Model 3');
  });
});

describe('createDeepSeekModel', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('应该创建 DeepSeek 模型', () => {
    const model = createDeepSeekModel();

    expect(model.providerName).toBe('DeepSeek');
    expect(model.modelName).toBe('deepseek-chat');
  });
});

describe('createKimiModel', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('应该创建 Kimi 模型', () => {
    const model = createKimiModel();

    expect(model.providerName).toBe('Kimi');
    expect(model.modelName).toBe('moonshot-v1-8k');
  });
});

describe('createEncryptedModel', () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it('应该创建带加密 API Key 的模型', () => {
    const model = createEncryptedModel();

    expect(model.apiKey).toMatch(/^enc:/);
  });
});
