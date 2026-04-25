/**
 * initSteps 配置验证测试
 *
 * 测试初始化步骤配置的结构正确性、有效性和 execute 函数逻辑
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ExecutionContext } from '@/services/initialization';

/**
 * 创建 mock ExecutionContext
 * @param existingResults 预设的结果
 */
function createMockContext(existingResults?: Record<string, unknown>): ExecutionContext {
  const results = new Map<string, unknown>(Object.entries(existingResults ?? {}));
  return {
    getResult: <T,>(name: string): T | undefined => results.get(name) as T | undefined,
    setResult: (name: string, value: unknown): void => { results.set(name, value); },
    isSuccess: (name: string): boolean => results.has(name),
  };
}

// Mock 外部依赖以隔离 execute 函数测试
const mockDispatch = vi.fn();
const mockGetState = vi.fn();

vi.mock('@/store', () => ({
  store: {
    dispatch: (...args: unknown[]) => mockDispatch(...args),
    getState: () => mockGetState(),
  },
}));

vi.mock('@/services/i18n', () => ({
  initI18n: vi.fn().mockResolvedValue(undefined),
  tSafely: (_key: string, fallback: string) => fallback,
}));

vi.mock('@/store/keyring/masterKey', () => ({
  initializeMasterKey: vi.fn().mockResolvedValue({
    isNewlyGenerated: false,
    key: 'test-master-key',
  }),
}));

vi.mock('@/store/slices/modelSlice', () => ({
  initializeModels: vi.fn(() => ({
    unwrap: () => Promise.resolve({ models: [], decryptionFailureCount: 0 }),
  })),
}));

vi.mock('@/store/slices/chatSlices', () => ({
  initializeChatList: vi.fn(() => ({
    unwrap: () => Promise.resolve([]),
  })),
  setSelectedChatIdWithPreload: vi.fn(),
}));

vi.mock('@/store/slices/appConfigSlices', () => ({
  initializeAppLanguage: vi.fn(() => ({
    unwrap: () => Promise.resolve('zh'),
  })),
  initializeTransmitHistoryReasoning: vi.fn(() => ({
    unwrap: () => Promise.resolve(false),
  })),
  initializeAutoNamingEnabled: vi.fn(() => ({
    unwrap: () => Promise.resolve(true),
  })),
}));

vi.mock('@/store/slices/modelProviderSlice', () => ({
  initializeModelProvider: vi.fn(() => ({
    unwrap: () => Promise.resolve([]),
  })),
}));

vi.mock('@/utils/tauriCompat', () => ({
  migrateKeyringV1ToV2: vi.fn().mockResolvedValue(false),
}));

// 必须在 mock 之后导入
import { initSteps } from '@/config/initSteps';

describe('initSteps 配置验证', () => {
  describe('步骤名称唯一性', () => {
    it('应该所有步骤名称唯一', () => {
      const names = initSteps.map((step) => step.name);
      const uniqueNames = new Set(names);

      expect(names.length).toBe(uniqueNames.size);
      expect(names.length).toBe(9); // 9 个步骤
    });

    it('应该检测重复的步骤名称', () => {
      const names = initSteps.map((step) => step.name);
      const nameCount = names.reduce((acc, name) => {
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const duplicates = Object.entries(nameCount).filter(([_, count]) => count > 1);
      expect(duplicates).toHaveLength(0);
    });
  });

  describe('依赖存在性验证', () => {
    it('应该所有依赖的步骤存在', () => {
      const stepNames = new Set<string>(initSteps.map((step) => step.name));

      for (const step of initSteps) {
        if (step.dependencies) {
          for (const dep of step.dependencies) {
            expect(stepNames.has(dep)).toBe(true);
          }
        }
      }
    });

    it('应该检测依赖不存在的步骤', () => {
      const stepNames = new Set<string>(initSteps.map((step) => step.name));

      for (const step of initSteps) {
        if (step.dependencies) {
          for (const dep of step.dependencies) {
            expect(
              stepNames.has(dep),
              `步骤 "${step.name}" 依赖的步骤 "${dep}" 不存在`
            ).toBe(true);
          }
        }
      }
    });
  });

  describe('必要字段完整性', () => {
    it('应该每个步骤包含 name、critical、execute、onError 字段', () => {
      for (const step of initSteps) {
        expect(step.name).toBeDefined();
        expect(typeof step.name).toBe('string');
        expect(step.name.length).toBeGreaterThan(0);

        expect(step.critical).toBeDefined();
        expect(typeof step.critical).toBe('boolean');

        expect(step.execute).toBeDefined();
        expect(typeof step.execute).toBe('function');

        expect(step.onError).toBeDefined();
        expect(typeof step.onError).toBe('function');
      }
    });

    it('应该验证字段类型正确', () => {
      for (const step of initSteps) {
        expect(typeof step.name).toBe('string');
        expect(typeof step.critical).toBe('boolean');
        expect(typeof step.execute).toBe('function');
        expect(typeof step.onError).toBe('function');
      }
    });
  });

  describe('错误严重程度有效性', () => {
    it('应该调用每个步骤的 onError 并验证 severity 有效', async () => {
      const validSeverities = ['fatal', 'warning', 'ignorable'] as const;

      for (const step of initSteps) {
        const error = new Error('Test error');
        const result = step.onError(error);

        expect(result).toBeDefined();
        expect(validSeverities).toContain(result.severity);
        expect(result.message).toBeDefined();
        expect(typeof result.message).toBe('string');
      }
    });

    it('应该验证 severity 为 fatal、warning 或 ignorable', () => {
      const validSeverities = ['fatal', 'warning', 'ignorable'] as const;

      for (const step of initSteps) {
        const error = new Error('Test error');
        const result = step.onError(error);

        expect(
          validSeverities.includes(result.severity),
          `步骤 "${step.name}" 的 onError 返回了无效的 severity: ${result.severity}`
        ).toBe(true);
      }
    });
  });

  describe('initSteps 导出测试', () => {
    it('应该 initSteps 可以正常导入', () => {
      expect(initSteps).toBeDefined();
      expect(Array.isArray(initSteps)).toBe(true);
    });

    it('应该 initSteps 为数组类型', () => {
      expect(Array.isArray(initSteps)).toBe(true);
    });

    it('应该数组长度为 9', () => {
      // keyringMigration、i18n、masterKey、models、chatList、appLanguage、transmitHistoryReasoning、autoNamingEnabled、modelProvider
      expect(initSteps.length).toBe(9);
    });

    it('应该包含所有预期的步骤名称', () => {
      const expectedSteps = [
        'keyringMigration',
        'i18n',
        'masterKey',
        'models',
        'chatList',
        'appLanguage',
        'transmitHistoryReasoning',
        'autoNamingEnabled',
        'modelProvider',
      ];

      const actualSteps = initSteps.map((step) => step.name);

      for (const expected of expectedSteps) {
        expect(actualSteps).toContain(expected);
      }
    });
  });

  describe('依赖关系验证', () => {
    it('应该 masterKey 在 models 之前执行', () => {
      const models = initSteps.find((step) => step.name === 'models');
      expect(models?.dependencies).toContain('masterKey');
    });

    it('应该 i18n 在 appLanguage 之前执行', () => {
      const appLanguage = initSteps.find((step) => step.name === 'appLanguage');
      expect(appLanguage?.dependencies).toContain('i18n');
    });

    it('应该无依赖步骤在第一批次并行执行', () => {
      // i18n、masterKey、chatList、transmitHistoryReasoning、modelProvider 没有依赖
      const noDepSteps = initSteps.filter(
        (step) => !step.dependencies || step.dependencies.length === 0
      );

      expect(noDepSteps.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('关键步骤标记', () => {
    it('应该只有 i18n 和 masterKey 是关键步骤', () => {
      const criticalSteps = initSteps.filter((step) => step.critical);

      expect(criticalSteps.length).toBe(2);
      // eslint-disable-next-line unicorn/no-array-sort
      expect(criticalSteps.map((s) => s.name).sort()).toEqual(['i18n', 'masterKey']);
    });
  });
});

describe('initSteps execute 函数', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDispatch.mockImplementation((...args: unknown[]) => args[0]);
  });

  describe('keyringMigration', () => {
    it('应该调用 migrateKeyringV1ToV2 并设置结果', async () => {
      const step = initSteps.find((s) => s.name === 'keyringMigration')!;
      const context = createMockContext();

      const result = await step.execute(context);

      expect(result).toBe(false);
      expect(context.getResult('keyringMigration')).toBe(false);
    });
  });

  describe('i18n', () => {
    it('应该调用 initI18n', async () => {
      const step = initSteps.find((s) => s.name === 'i18n')!;
      const context = createMockContext();

      await step.execute(context);

      const { initI18n } = await import('@/services/i18n');
      expect(initI18n).toHaveBeenCalledOnce();
    });
  });

  describe('masterKey', () => {
    it('应该调用 initializeMasterKey 并传递 isNewlyGenerated 结果', async () => {
      const step = initSteps.find((s) => s.name === 'masterKey')!;
      const context = createMockContext();

      const result = await step.execute(context);

      expect(result).toBe('test-master-key');
      expect(context.getResult('masterKeyRegenerated')).toBe(false);
    });

    it('应该设置 masterKeyRegenerated 为 true 当密钥新生成', async () => {
      const { initializeMasterKey } = await import('@/store/keyring/masterKey');
      vi.mocked(initializeMasterKey).mockResolvedValueOnce({
        isNewlyGenerated: true,
        key: 'new-key',
      });

      const step = initSteps.find((s) => s.name === 'masterKey')!;
      const context = createMockContext();

      const result = await step.execute(context);

      expect(result).toBe('new-key');
      expect(context.getResult('masterKeyRegenerated')).toBe(true);
    });
  });

  describe('models', () => {
    it('应该 dispatch initializeModels 并传递 decryptionFailureCount', async () => {
      const { initializeModels } = await import('@/store/slices/modelSlice');
      vi.mocked(initializeModels).mockReturnValueOnce({
        unwrap: () => Promise.resolve({ models: [{ id: 'm1' }], decryptionFailureCount: 3 }),
      } as unknown as ReturnType<typeof initializeModels>);

      const step = initSteps.find((s) => s.name === 'models')!;
      const context = createMockContext();

      const result = await step.execute(context);

      expect(result).toEqual([{ id: 'm1' }]);
      expect(context.getResult('models')).toEqual([{ id: 'm1' }]);
      expect(context.getResult('decryptionFailureCount')).toBe(3);
    });
  });

  describe('chatList', () => {
    it('应该 dispatch initializeChatList 并设置结果', async () => {
      const step = initSteps.find((s) => s.name === 'chatList')!;
      const context = createMockContext();

      const result = await step.execute(context);

      expect(result).toEqual([]);
      expect(context.getResult('chatList')).toEqual([]);
    });
  });

  describe('appLanguage', () => {
    it('应该 dispatch initializeAppLanguage 并设置结果', async () => {
      const step = initSteps.find((s) => s.name === 'appLanguage')!;
      const context = createMockContext();

      const result = await step.execute(context);

      expect(result).toBe('zh');
      expect(context.getResult('appLanguage')).toBe('zh');
    });
  });

  describe('transmitHistoryReasoning', () => {
    it('应该 dispatch initializeTransmitHistoryReasoning 并设置结果', async () => {
      const step = initSteps.find((s) => s.name === 'transmitHistoryReasoning')!;
      const context = createMockContext();

      const result = await step.execute(context);

      expect(result).toBe(false);
      expect(context.getResult('transmitHistoryReasoning')).toBe(false);
    });
  });

  describe('autoNamingEnabled', () => {
    it('应该 dispatch initializeAutoNamingEnabled 并设置结果', async () => {
      const step = initSteps.find((s) => s.name === 'autoNamingEnabled')!;
      const context = createMockContext();

      const result = await step.execute(context);

      expect(result).toBe(true);
      expect(context.getResult('autoNamingEnabled')).toBe(true);
    });
  });

  describe('modelProvider', () => {
    it('应该 dispatch initializeModelProvider 成功并设置成功状态', async () => {
      const step = initSteps.find((s) => s.name === 'modelProvider')!;
      const context = createMockContext();

      const result = await step.execute(context);

      expect(result).toEqual([]);
      const status = context.getResult<{ hasError: boolean; isNoProvidersError: boolean }>('modelProviderStatus');
      expect(status).toEqual({ hasError: false, isNoProvidersError: false });
    });

    it('应该设置普通错误状态 当 dispatch 失败且有 error', async () => {
      const { initializeModelProvider } = await import('@/store/slices/modelProviderSlice');
      vi.mocked(initializeModelProvider).mockReturnValueOnce({
        unwrap: () => Promise.reject(new Error('Network error')),
      } as unknown as ReturnType<typeof initializeModelProvider>);

      mockGetState.mockReturnValue({
        modelProvider: { loading: false, error: 'Network error' },
      });

      const step = initSteps.find((s) => s.name === 'modelProvider')!;
      const context = createMockContext();

      await expect(step.execute(context)).rejects.toThrow('Network error');

      const status = context.getResult<{ hasError: boolean; isNoProvidersError: boolean }>('modelProviderStatus');
      expect(status).toEqual({ hasError: true, isNoProvidersError: false });
    });

    it('应该设置无供应商错误状态 当 error 为 NO_PROVIDERS_ERROR_MESSAGE', async () => {
      const { initializeModelProvider } = await import('@/store/slices/modelProviderSlice');
      vi.mocked(initializeModelProvider).mockReturnValueOnce({
        unwrap: () => Promise.reject(new Error('no providers')),
      } as unknown as ReturnType<typeof initializeModelProvider>);

      mockGetState.mockReturnValue({
        modelProvider: {
          loading: false,
          error: '无法获取模型供应商数据，请检查网络连接',
        },
      });

      const step = initSteps.find((s) => s.name === 'modelProvider')!;
      const context = createMockContext();

      await expect(step.execute(context)).rejects.toThrow('no providers');

      const status = context.getResult<{ hasError: boolean; isNoProvidersError: boolean }>('modelProviderStatus');
      expect(status).toEqual({ hasError: true, isNoProvidersError: true });
    });
  });
});
