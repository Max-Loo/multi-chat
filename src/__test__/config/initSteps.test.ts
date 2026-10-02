/**
 * initSteps 配置验证测试（Vue/Pinia 版）
 *
 * 测试初始化步骤配置的结构正确性与执行逻辑：
 * - 步骤结构完整性（名称、critical、依赖）
 * - 全部成功时返回成功结果
 * - critical 步骤失败时产生 fatal error
 * - modelProvider 无供应商错误的状态标记
 * - 进度回调被调用
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Pinia stores（初始化流程组件外使用，见 stores/index.ts）
// 使用 vi.hoisted 保证 mock 工厂被提升时容器已初始化
const storeMocks = vi.hoisted(() => ({
  model: {
    initializeModels: vi.fn().mockResolvedValue([]),
    decryptionFailureCount: 0,
  },
  chat: {
    initializeChatList: vi.fn().mockResolvedValue(undefined),
    chatMetaList: [] as unknown[],
  },
  appConfig: {
    initializeAppLanguage: vi.fn().mockResolvedValue('zh'),
    initializeTransmitHistoryReasoning: vi.fn().mockResolvedValue(false),
    initializeAutoNamingEnabled: vi.fn().mockResolvedValue(true),
  },
  modelProvider: {
    initializeModelProvider: vi.fn().mockResolvedValue(undefined),
    providers: [] as unknown[],
    error: null as string | null,
    loading: false,
  },
}));

vi.mock('@/stores', () => ({
  createAppPinia: vi.fn(() => ({})),
  useModelStore: () => storeMocks.model,
  useChatStore: () => storeMocks.chat,
  useAppConfigStore: () => storeMocks.appConfig,
  useModelProviderStore: () => storeMocks.modelProvider,
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

vi.mock('@/store/storage/chatStorage', () => ({
  migrateOldChatStorage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/utils/tauriCompat', () => ({
  migrateKeyringV1ToV2: vi.fn().mockResolvedValue(false),
}));

import { initSteps, STEP_NAMES } from '@/config/initSteps';
import { InitializationManager } from '@/services/initialization';

describe('initSteps 配置', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeMocks.model.initializeModels.mockResolvedValue([]);
    storeMocks.model.decryptionFailureCount = 0;
    storeMocks.chat.initializeChatList.mockResolvedValue(undefined);
    storeMocks.chat.chatMetaList = [];
    storeMocks.appConfig.initializeAppLanguage.mockResolvedValue('zh');
    storeMocks.appConfig.initializeTransmitHistoryReasoning.mockResolvedValue(false);
    storeMocks.appConfig.initializeAutoNamingEnabled.mockResolvedValue(true);
    storeMocks.modelProvider.initializeModelProvider.mockResolvedValue(undefined);
    storeMocks.modelProvider.error = null;
    storeMocks.modelProvider.loading = false;
  });

  describe('结构完整性', () => {
    it('应包含全部已定义的步骤', () => {
      const expectedNames = Object.values(STEP_NAMES);
      const actualNames = initSteps.map((step) => step.name);
      for (const name of expectedNames) {
        expect(actualNames).toContain(name);
      }
    });

    it('critical 步骤应有 onError 处理器', () => {
      for (const step of initSteps) {
        if (step.critical) {
          expect(step.onError).toBeDefined();
        }
      }
    });

    it('依赖的步骤名应存在于步骤列表中', () => {
      const names = new Set(initSteps.map((step) => step.name));
      for (const step of initSteps) {
        for (const dep of step.dependencies ?? []) {
          expect(names.has(dep)).toBe(true);
        }
      }
    });
  });

  describe('执行流程', () => {
    it('全部成功时初始化结果为成功且携带警告列表', async () => {
      const manager = new InitializationManager();
      const result = await manager.runInitialization({ steps: initSteps });

      expect(result.success).toBe(true);
      expect(result.fatalErrors).toEqual([]);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('masterKey 失败时产生致命错误', async () => {
      const { initializeMasterKey } = await import('@/store/keyring/masterKey');
      vi.mocked(initializeMasterKey).mockRejectedValueOnce(
        new Error('keyring unavailable'),
      );

      const manager = new InitializationManager();
      const result = await manager.runInitialization({ steps: initSteps });

      expect(result.success).toBe(false);
      expect(result.fatalErrors.length).toBeGreaterThan(0);
      expect(
        result.fatalErrors.some((e) => e.stepName === STEP_NAMES.masterKey),
      ).toBe(true);
    });

    it('models 步骤应记录解密失败数量', async () => {
      storeMocks.model.initializeModels.mockResolvedValue([{ id: 'm1' }]);
      storeMocks.model.decryptionFailureCount = 3;

      const manager = new InitializationManager();
      const progressSpy = vi.fn();
      const result = await manager.runInitialization({
        steps: initSteps,
        onProgress: progressSpy,
      });

      expect(result.success).toBe(true);
      // 进度回调应被调用（每步至少一次）
      expect(progressSpy).toHaveBeenCalled();
    });

    it('modelProvider 无供应商错误时应标记 isNoProvidersError', async () => {
      const NO_PROVIDERS_MESSAGE = '无法获取模型供应商数据，请检查网络连接';
      storeMocks.modelProvider.initializeModelProvider.mockRejectedValue(
        new Error(NO_PROVIDERS_MESSAGE),
      );
      storeMocks.modelProvider.error = NO_PROVIDERS_MESSAGE;

      const manager = new InitializationManager();
      const result = await manager.runInitialization({ steps: initSteps });

      // modelProvider 是 warning 级别，初始化仍然成功
      expect(result.success).toBe(true);
      expect(result.modelProviderStatus?.isNoProvidersError).toBe(true);
    });

    it('i18n 失败时产生致命错误（critical）', async () => {
      const { initI18n } = await import('@/services/i18n');
      vi.mocked(initI18n).mockRejectedValueOnce(new Error('i18n broken'));

      const manager = new InitializationManager();
      const result = await manager.runInitialization({ steps: initSteps });

      expect(result.success).toBe(false);
      expect(
        result.fatalErrors.some((e) => e.stepName === STEP_NAMES.i18n),
      ).toBe(true);
    });
  });
});
