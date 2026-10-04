/**
 * 应用加载集成测试（Vue 版）
 *
 * 测试目的：验证模型初始化过程中的完整数据流（存储 → Pinia → UI 状态）
 * 场景转写自 React 版 app-loading.integration.test
 */

import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import type { Model } from '@/types/model';
import { createMockModel } from '@/__test__/helpers/fixtures/model';

// Mock 模型存储模块
vi.mock('@/store/storage/modelStorage', () => ({
  loadModelsFromJson: vi.fn(),
  saveModelsToJson: vi.fn(),
}));

import { loadModelsFromJson } from '@/store/storage/modelStorage';
import { useModelsStore } from '@/store/models';

describe('应用加载集成测试', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('成功加载场景', () => {
    it('应该完成模型初始化流程：存储 → Pinia → UI 状态', async () => {
      // Given: 存储中有模型数据
      const storedModels: Model[] = [
        createMockModel({ id: 'model-1', nickname: 'DeepSeek Chat' }),
        createMockModel({ id: 'model-2', nickname: 'Kimi Chat' }),
      ];
      vi.mocked(loadModelsFromJson).mockResolvedValue({
        models: storedModels,
        decryptionFailureCount: 0,
      });

      // When: 初始化模型
      const modelsStore = useModelsStore();
      await modelsStore.initializeModels();

      // Then: Pinia store 应包含模型数据
      expect(modelsStore.models).toEqual(storedModels);
      expect(modelsStore.models).toHaveLength(2);

      // Then: 应无错误且不在加载状态
      expect(modelsStore.error).toBe(null);
      expect(modelsStore.initializationError).toBe(null);
      expect(modelsStore.loading).toBe(false);

      // Then: UI 应显示模型列表（通过 store 状态验证）
      expect(modelsStore.models[0].nickname).toBe('DeepSeek Chat');
      expect(modelsStore.models[1].nickname).toBe('Kimi Chat');
    });

    it('应该正确同步加载指示器状态', async () => {
      vi.useFakeTimers();

      // Given: 存储延迟返回
      const mockModels: Model[] = [createMockModel()];
      vi.mocked(loadModelsFromJson).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ models: mockModels, decryptionFailureCount: 0 }),
              100,
            ),
          ),
      );

      // When: 初始化模型
      const modelsStore = useModelsStore();
      const initPromise = modelsStore.initializeModels();

      // Then: 加载中应为 true
      expect(modelsStore.loading).toBe(true);

      await vi.runAllTimersAsync();
      await initPromise;

      // Then: 加载完成后应隐藏指示器
      expect(modelsStore.loading).toBe(false);

      vi.useRealTimers();
    });

    it('应该处理空模型列表', async () => {
      vi.mocked(loadModelsFromJson).mockResolvedValue({
        models: [],
        decryptionFailureCount: 0,
      });

      const modelsStore = useModelsStore();
      await modelsStore.initializeModels();

      expect(modelsStore.models).toEqual([]);
      expect(modelsStore.loading).toBe(false);
      expect(modelsStore.error).toBe(null);
    });
  });

  describe('失败场景', () => {
    it('应该处理存储加载失败', async () => {
      const errorMessage = 'Failed to load models from storage';
      vi.mocked(loadModelsFromJson).mockRejectedValue(new Error(errorMessage));

      const modelsStore = useModelsStore();
      await modelsStore.initializeModels().catch(() => {});

      expect(modelsStore.initializationError).toBe(errorMessage);
      expect(modelsStore.loading).toBe(false);
      expect(modelsStore.models).toEqual([]);
    });

    it('应该支持重试机制', async () => {
      let attemptCount = 0;
      vi.mocked(loadModelsFromJson).mockImplementation(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('Network error');
        }
        return { models: [createMockModel()], decryptionFailureCount: 0 };
      });

      const modelsStore = useModelsStore();
      await modelsStore.initializeModels().catch(() => {});
      expect(modelsStore.initializationError).toBe('Network error');

      // 用户重试：清除错误后重新初始化
      modelsStore.clearInitializationError();
      await modelsStore.initializeModels();

      expect(modelsStore.models).toHaveLength(1);
      expect(modelsStore.initializationError).toBe(null);
    });
  });

  describe('性能测试', () => {
    it('应该快速加载大量模型', async () => {
      const mockModels: Model[] = Array.from({ length: 100 }, (_, i) =>
        createMockModel({ id: `model-${i}`, nickname: `Model ${i}` }),
      );
      vi.mocked(loadModelsFromJson).mockResolvedValue({
        models: mockModels,
        decryptionFailureCount: 0,
      });

      const modelsStore = useModelsStore();
      const startTime = Date.now();
      await modelsStore.initializeModels();
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(1000);
      expect(modelsStore.models).toHaveLength(100);
    });
  });

  describe('边缘情况', () => {
    it('应该处理并发初始化请求且不产生重复数据', async () => {
      const mockModels: Model[] = [createMockModel()];
      vi.mocked(loadModelsFromJson).mockResolvedValue({
        models: mockModels,
        decryptionFailureCount: 0,
      });

      const modelsStore = useModelsStore();
      await Promise.all([
        modelsStore.initializeModels(),
        modelsStore.initializeModels(),
        modelsStore.initializeModels(),
      ]);

      expect(modelsStore.models).toHaveLength(1);
    });
  });
});
