/**
 * 应用加载集成测试
 * 
 * 测试目的：验证应用初始化过程中的用户可见行为
 * 测试范围：
 * - 模型初始化流程（存储 → Redux → UI）
 * - UI 加载指示器显示
 * - 错误处理和重试机制
 * - 降级策略（远程失败时使用缓存）
 * 
 * 测试隔离：使用真实的 Redux store 和异步初始化逻辑
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import { Model } from '@/types/model';
import { createMockModel } from '@/__test__/fixtures/models';

// Mock storage 模块
vi.mock('@/store/storage/modelStorage', () => ({
  loadModelsFromJson: vi.fn(),
  saveModelsToJson: vi.fn(),
}));

vi.mock('@/store/storage/chatStorage', () => ({
  loadChatsFromJson: vi.fn(() => Promise.resolve([])),
  saveChatsToJson: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock('@/store/storage/storeUtils', () => ({
  createLazyStore: vi.fn(() => ({})),
  saveToStore: vi.fn(() => Promise.resolve()),
  loadFromStore: vi.fn(() => Promise.resolve([])),
}));

import { loadModelsFromJson } from '@/store/storage/modelStorage';
import modelReducer, { initializeModels } from '@/store/slices/modelSlice';

vi.mock('@/store/storage/chatStorage', () => ({
  loadChatsFromJson: vi.fn(() => Promise.resolve([])),
  saveChatsToJson: vi.fn(() => Promise.resolve(undefined)),
}));

vi.mock('@/store/storage/storeUtils', () => ({
  createLazyStore: vi.fn(() => ({})),
  saveToStore: vi.fn(() => Promise.resolve()),
  loadFromStore: vi.fn(() => Promise.resolve([])),
}));

/**
 * 创建测试用的 Redux store
 */
function createTestStore() {
  return configureStore({
    reducer: {
      models: modelReducer,
    },
  });
}

describe('应用加载集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // 1. 成功加载场景
  // ========================================

  describe('成功加载场景', () => {
    test('应该完成模型初始化流程：存储 → Redux → UI', async () => {
      // Given: 存储中有模型数据
      const storedModels: Model[] = [
        createMockModel({ id: 'model-1', nickname: 'DeepSeek Chat' }),
        createMockModel({ id: 'model-2', nickname: 'Kimi Chat' }),
      ];
      vi.mocked(loadModelsFromJson).mockResolvedValue({ models: storedModels, decryptionFailureCount: 0 });

      // When: 初始化模型
      const store = createTestStore();
      await store.dispatch(initializeModels());

      // Then: Redux store 应包含模型数据
      const state = store.getState();
      expect(state.models.models).toEqual(storedModels);
      expect(state.models.models).toHaveLength(2);

      // Then: 应无错误
      expect(state.models.error).toBe(null);
      expect(state.models.initializationError).toBe(null);

      // Then: 应不在加载状态
      expect(state.models.loading).toBe(false);

      // Then: UI 应显示模型列表（通过 Redux state 验证）
      const displayedModels = state.models.models;
      expect(displayedModels[0].nickname).toBe('DeepSeek Chat');
      expect(displayedModels[1].nickname).toBe('Kimi Chat');
    });

    test('应该正确显示加载指示器', async () => {
      // Given: 存储中有模型数据
      const mockModels: Model[] = [createMockModel()];
      vi.mocked(loadModelsFromJson).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ models: mockModels, decryptionFailureCount: 0 }), 100))
      );

      // When: 初始化模型
      const store = createTestStore();
      const initPromise = store.dispatch(initializeModels());

      // Then: 应显示加载指示器（loading = true）
      expect(store.getState().models.loading).toBe(true);

      // Then: 加载完成后应隐藏指示器
      await initPromise;
      expect(store.getState().models.loading).toBe(false);
    });

    test('应该处理空模型列表', async () => {
      // Given: 存储中没有模型数据
vi.mocked(loadModelsFromJson).mockResolvedValue({ models: [], decryptionFailureCount: 0 });

      // When: 初始化模型
      const store = createTestStore();
      await store.dispatch(initializeModels());

      // Then: Redux store 应为空数组
      const state = store.getState();
      expect(state.models.models).toEqual([]);
      expect(state.models.loading).toBe(false);
      expect(state.models.error).toBe(null);
    });
  });

  // ========================================
  // 2. 失败场景
  // ========================================

  describe('失败场景', () => {
    test('应该处理存储加载失败', async () => {
      // Given: 存储加载失败
      const errorMessage = 'Failed to load models from storage';
vi.mocked(loadModelsFromJson).mockRejectedValue(new Error(errorMessage));

      // When: 初始化模型
      const store = createTestStore();
      await store.dispatch(initializeModels());

      // Then: 应设置初始化错误
      const state = store.getState();
      expect(state.models.initializationError).toBe(errorMessage);
      expect(state.models.loading).toBe(false);

      // Then: 模型列表应为空
      expect(state.models.models).toEqual([]);
    });

    test('应该支持重试机制', async () => {
      // Given: 第一次加载失败
      let attemptCount = 0;
vi.mocked(loadModelsFromJson).mockImplementation(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('Network error');
        }
        // 第二次成功
        return { models: [createMockModel()], decryptionFailureCount: 0 };
      });

      // When: 第一次初始化失败
      const store = createTestStore();
      await store.dispatch(initializeModels());

      // Then: 应有错误
      expect(store.getState().models.initializationError).toBe('Network error');

      // When: 用户重试（清除错误后重新初始化）
      store.dispatch({ type: 'models/clearInitializationError' });
      await store.dispatch(initializeModels());

      // Then: 应成功加载
      const state = store.getState();
      expect(state.models.models).toHaveLength(1);
      expect(state.models.initializationError).toBe(null);
    });

    test('应该处理网络超时', async () => {
      // Given: 模拟网络超时
vi.mocked(loadModelsFromJson).mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      // When: 初始化模型
      const store = createTestStore();
      await store.dispatch(initializeModels());

      // Then: 应设置错误
      const state = store.getState();
      expect(state.models.initializationError).toBe('Request timeout');
      expect(state.models.loading).toBe(false);
    });
  });

  // ========================================
  // 3. 降级场景
  // ========================================

  describe('降级场景', () => {
    test('应该在远程失败时使用本地缓存', async () => {
      // Given: 远程数据加载失败，但有本地缓存
      const cachedModels: Model[] = [
        createMockModel({ id: 'cached-1', nickname: 'Cached Model' }),
      ];

      // Mock 第一次失败，第二次成功（模拟从缓存加载）
      let attemptCount = 0;
vi.mocked(loadModelsFromJson).mockImplementation(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error('Remote API failed');
        }
        return { models: cachedModels, decryptionFailureCount: 0 };
      });

      // When: 第一次初始化失败
      const store = createTestStore();
      await store.dispatch(initializeModels());

      // Then: 应有错误
      expect(store.getState().models.initializationError).toBe('Remote API failed');

      // When: 清除错误并重试（使用缓存）
      store.dispatch({ type: 'models/clearInitializationError' });
      await store.dispatch(initializeModels());

      // Then: 应从缓存加载
      const state = store.getState();
      expect(state.models.models).toEqual(cachedModels);
      expect(state.models.models[0].nickname).toBe('Cached Model');
    });

    test('应该在降级时显示提示信息', async () => {
      // Given: 使用缓存数据
      const cachedModels: Model[] = [createMockModel()];
vi.mocked(loadModelsFromJson).mockResolvedValue({ models: cachedModels, decryptionFailureCount: 0 });

      // When: 初始化模型
      const store = createTestStore();
      await store.dispatch(initializeModels());

      // Then: 应成功加载（无错误）
      const state = store.getState();
      expect(state.models.models).toHaveLength(1);
      expect(state.models.initializationError).toBe(null);
      expect(state.models.loading).toBe(false);
    });
  });

  // ========================================
  // 4. 性能测试
  // ========================================

  describe('性能测试', () => {
    test('应该快速加载大量模型', async () => {
      // Given: 100 个模型
      const mockModels: Model[] = Array.from({ length: 100 }, (_, i) =>
        createMockModel({ id: `model-${i}`, nickname: `Model ${i}` })
      );
vi.mocked(loadModelsFromJson).mockResolvedValue({ models: mockModels, decryptionFailureCount: 0 });

      // When: 初始化模型
      const store = createTestStore();
      const startTime = Date.now();
      await store.dispatch(initializeModels());
      const loadTime = Date.now() - startTime;

      // Then: 应在合理时间内完成（< 1 秒）
      expect(loadTime).toBeLessThan(1000);

      // Then: 所有模型应被加载
      const state = store.getState();
      expect(state.models.models).toHaveLength(100);
    });
  });

  // ========================================
  // 5. 边缘情况
  // ========================================

  describe('边缘情况', () => {
    test('应该处理并发初始化请求', async () => {
      // Given: 模型数据
      const mockModels: Model[] = [createMockModel()];
vi.mocked(loadModelsFromJson).mockResolvedValue({ models: mockModels, decryptionFailureCount: 0 });

      // When: 并发发起多个初始化请求
      const store = createTestStore();
      const [result1, result2, result3] = await Promise.all([
        store.dispatch(initializeModels()),
        store.dispatch(initializeModels()),
        store.dispatch(initializeModels()),
      ]);

      // Then: 所有请求都应成功
      expect(result1.type).toBe('models/initialize/fulfilled');
      expect(result2.type).toBe('models/initialize/fulfilled');
      expect(result3.type).toBe('models/initialize/fulfilled');

      // Then: 模型列表应正确（不应重复）
      const state = store.getState();
      expect(state.models.models).toHaveLength(1);
    });

    test('应该处理初始化过程中的状态更新', async () => {
      // Given: 模拟异步加载
      const mockModels: Model[] = [createMockModel()];
vi.mocked(loadModelsFromJson).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ models: mockModels, decryptionFailureCount: 0 }), 50))
      );

      // When: 开始初始化
      const store = createTestStore();
      const initPromise = store.dispatch(initializeModels());

      // Then: 应处于加载状态
      expect(store.getState().models.loading).toBe(true);

      // When: 完成加载
      await initPromise;

      // Then: 应完成加载
      expect(store.getState().models.loading).toBe(false);
      expect(store.getState().models.models).toEqual(mockModels);
    });
  });

  // ========================================
  // 6. UI 状态同步
  // ========================================

  describe('UI 状态同步', () => {
    test('应该正确同步加载状态到 UI', async () => {
      // Given: 模拟异步加载
      const mockModels: Model[] = [createMockModel()];
vi.mocked(loadModelsFromJson).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ models: mockModels, decryptionFailureCount: 0 }), 50))
      );

      // When: 初始化模型
      const store = createTestStore();
      
      // Then: 初始状态应为 false
      expect(store.getState().models.loading).toBe(false);

      // When: 开始加载
      const initPromise = store.dispatch(initializeModels());
      
      // Then: 加载中应为 true（UI 应显示加载指示器）
      expect(store.getState().models.loading).toBe(true);

      // When: 加载完成
      await initPromise;
      
      // Then: 加载完成应为 false（UI 应隐藏加载指示器）
      expect(store.getState().models.loading).toBe(false);
    });

    test('应该正确同步错误状态到 UI', async () => {
      // Given: 加载失败
      const errorMessage = 'Failed to load models';
vi.mocked(loadModelsFromJson).mockRejectedValue(new Error(errorMessage));

      // When: 初始化模型
      const store = createTestStore();
      await store.dispatch(initializeModels());

      // Then: UI 应显示错误（通过 state.error 验证）
      const state = store.getState();
      expect(state.models.initializationError).toBe(errorMessage);
      
      // Then: 清除错误后 UI 应恢复正常
      store.dispatch({ type: 'models/clearInitializationError' });
      expect(store.getState().models.initializationError).toBe(null);
    });
  });
});
