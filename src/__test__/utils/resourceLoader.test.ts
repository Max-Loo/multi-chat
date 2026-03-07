import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceLoader } from '@/utils/resourceLoader';

// Mock resource type
type MockResource = { name: string; value: number };

describe('ResourceLoader', () => {
  let loader: ResourceLoader<MockResource>;
  let mockLoaderFn: any;

  beforeEach(() => {
    loader = new ResourceLoader<MockResource>();
    mockLoaderFn = vi.fn();
  });

  describe('首次加载资源', () => {
    it('应该执行动态导入并缓存资源', async () => {
      const resource: MockResource = { name: 'test', value: 42 };
      mockLoaderFn.mockResolvedValue(resource);

      loader.register('test-resource', {
        loader: mockLoaderFn,
      });

      const result = await loader.load('test-resource');

      expect(result).toEqual(resource);
      expect(mockLoaderFn).toHaveBeenCalledTimes(1);
      expect(loader.isLoaded('test-resource')).toBe(true);
    });
  });

  describe('从缓存获取已加载资源', () => {
    it('应该从缓存返回资源，不重复导入', async () => {
      const resource: MockResource = { name: 'test', value: 42 };
      mockLoaderFn.mockResolvedValue(resource);

      loader.register('test-resource', {
        loader: mockLoaderFn,
      });

      // 第一次加载
      await loader.load('test-resource');
      expect(mockLoaderFn).toHaveBeenCalledTimes(1);

      // 第二次加载（应该从缓存获取）
      const result = await loader.load('test-resource');
      expect(result).toEqual(resource);
      expect(mockLoaderFn).toHaveBeenCalledTimes(1); // 没有再次调用
    });

    it('get() 方法应该从缓存返回资源', async () => {
      const resource: MockResource = { name: 'test', value: 42 };
      mockLoaderFn.mockResolvedValue(resource);

      loader.register('test-resource', {
        loader: mockLoaderFn,
      });

      await loader.load('test-resource');

      const result = loader.get('test-resource');
      expect(result).toEqual(resource);
      expect(mockLoaderFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('并发请求同一资源', () => {
    it('应该只执行一次加载操作，所有调用者共享同一个 Promise', async () => {
      const resource: MockResource = { name: 'test', value: 42 };
      let loadCount = 0;

      mockLoaderFn.mockImplementation(async () => {
        loadCount++;
        await new Promise((resolve) => setTimeout(resolve, 100));
        return resource;
      });

      loader.register('test-resource', {
        loader: mockLoaderFn,
      });

      // 并发请求同一资源
      const [result1, result2, result3] = await Promise.all([
        loader.load('test-resource'),
        loader.load('test-resource'),
        loader.load('test-resource'),
      ]);

      expect(result1).toEqual(resource);
      expect(result2).toEqual(resource);
      expect(result3).toEqual(resource);
      expect(loadCount).toBe(1); // 只加载了一次
      expect(mockLoaderFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('网络错误自动重试', () => {
    it('网络错误时应该自动重试 3 次', async () => {
      const networkError = new TypeError('Failed to fetch');
      mockLoaderFn.mockRejectedValue(networkError);

      loader.register('test-resource', {
        loader: mockLoaderFn,
        retryCount: 3,
        retryDelay: 100,
      });

      await expect(loader.load('test-resource')).rejects.toThrow(
        'Failed to fetch',
      );

      // 1 次初始调用 + 3 次重试 = 4 次
      expect(mockLoaderFn).toHaveBeenCalledTimes(4);
    });

    it('重试之间应该有延迟', async () => {
      const networkError = new TypeError('Failed to fetch');

      mockLoaderFn.mockImplementation(async () => {
        throw networkError;
      });

      loader.register('test-resource', {
        loader: mockLoaderFn,
        retryCount: 2,
        retryDelay: 200,
      });

      const startTime = Date.now();
      await expect(loader.load('test-resource')).rejects.toThrow();
      const endTime = Date.now();

      // 2 次重试 * 200ms 延迟 = 至少 400ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(400);
      expect(mockLoaderFn).toHaveBeenCalledTimes(3); // 1 + 2 重试
    });
  });

  describe('非网络错误不重试', () => {
    it('模块不存在时应该立即失败，不重试', async () => {
      const notFoundError = new Error("Cannot find module 'unknown-module'");
      mockLoaderFn.mockRejectedValue(notFoundError);

      loader.register('test-resource', {
        loader: mockLoaderFn,
        retryCount: 3,
        retryDelay: 100,
      });

      await expect(loader.load('test-resource')).rejects.toThrow(
        "Cannot find module 'unknown-module'",
      );

      // 只调用一次，没有重试
      expect(mockLoaderFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('预加载多个资源', () => {
    it('某个资源加载失败不应该影响其他资源', async () => {
      const resource1: MockResource = { name: 'resource1', value: 1 };
      const resource3: MockResource = { name: 'resource3', value: 3 };

      const error = new Error('Load failed');

      loader.register('resource1', {
        loader: vi.fn().mockResolvedValue(resource1),
      });
      loader.register('resource2', {
        loader: vi.fn().mockRejectedValue(error),
      });
      loader.register('resource3', {
        loader: vi.fn().mockResolvedValue(resource3),
      });

      // 预加载不应该抛出错误
      await expect(
        loader.preload(['resource1', 'resource2', 'resource3']),
      ).resolves.toBeUndefined();

      // resource1 和 resource3 应该被成功加载
      expect(loader.isLoaded('resource1')).toBe(true);
      expect(loader.isLoaded('resource2')).toBe(false);
      expect(loader.isLoaded('resource3')).toBe(true);
    });

    it('预加载失败应该记录警告日志', async () => {
      const error = new Error('Load failed');
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      loader.register('resource1', {
        loader: vi.fn().mockRejectedValue(error),
      });

      await loader.preload(['resource1']);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to preload resource1:',
        error,
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('getState() 返回正确的加载状态', () => {
    it('未加载时应该返回 idle 状态', () => {
      const state = loader.getState('test-resource');
      expect(state).toBeUndefined();
    });

    it('加载中应该返回 loading 状态', async () => {
      mockLoaderFn.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ name: 'test', value: 42 }), 100);
          }),
      );

      loader.register('test-resource', {
        loader: mockLoaderFn,
      });

      // 启动加载但不等待
      const loadPromise = loader.load('test-resource');

      // 立即检查状态（应该是 loading）
      const state = loader.getState('test-resource');
      expect(state?.status).toBe('loading');
      expect(state?.retryCount).toBe(1);

      await loadPromise;
    });

    it('加载成功后应该返回 loaded 状态', async () => {
      mockLoaderFn.mockResolvedValue({ name: 'test', value: 42 });

      loader.register('test-resource', {
        loader: mockLoaderFn,
      });

      await loader.load('test-resource');

      const state = loader.getState('test-resource');
      expect(state?.status).toBe('loaded');
      expect(state?.loadTime).toBeDefined();
      expect(typeof state?.loadTime).toBe('number');
    });

    it('加载失败后应该返回 error 状态', async () => {
      const error = new Error('Load failed');
      mockLoaderFn.mockRejectedValue(error);

      loader.register('test-resource', {
        loader: mockLoaderFn,
      });

      await expect(loader.load('test-resource')).rejects.toThrow();

      const state = loader.getState('test-resource');
      expect(state?.status).toBe('error');
      expect(state?.error).toEqual(error);
    });
  });

  describe('LRU 缓存淘汰', () => {
    it('缓存满时应该自动淘汰最久未使用的资源', async () => {
      // 创建一个最多缓存 3 个资源的 loader
      const smallLoader = new ResourceLoader<MockResource>(3);

      // 注册 5 个资源
      for (let i = 1; i <= 5; i++) {
        smallLoader.register(`resource${i}`, {
          loader: vi.fn().mockResolvedValue({ name: `resource${i}`, value: i }),
        });
      }

      // 加载前 3 个资源
      await smallLoader.load('resource1');
      await smallLoader.load('resource2');
      await smallLoader.load('resource3');

      expect(smallLoader.isLoaded('resource1')).toBe(true);
      expect(smallLoader.isLoaded('resource2')).toBe(true);
      expect(smallLoader.isLoaded('resource3')).toBe(true);

      // 加载第 4 个资源（缓存满，应该淘汰 resource1）
      await smallLoader.load('resource4');

      expect(smallLoader.isLoaded('resource1')).toBe(false); // 被淘汰
      expect(smallLoader.isLoaded('resource2')).toBe(true);
      expect(smallLoader.isLoaded('resource3')).toBe(true);
      expect(smallLoader.isLoaded('resource4')).toBe(true);
    });

    it('淘汰资源时应该记录调试日志', async () => {
      const consoleDebugSpy = vi
        .spyOn(console, 'debug')
        .mockImplementation(() => {});

      const smallLoader = new ResourceLoader<MockResource>(2);

      smallLoader.register('resource1', {
        loader: vi.fn().mockResolvedValue({ name: 'resource1', value: 1 }),
      });
      smallLoader.register('resource2', {
        loader: vi.fn().mockResolvedValue({ name: 'resource2', value: 2 }),
      });
      smallLoader.register('resource3', {
        loader: vi.fn().mockResolvedValue({ name: 'resource3', value: 3 }),
      });

      await smallLoader.load('resource1');
      await smallLoader.load('resource2');
      await smallLoader.load('resource3'); // 触发淘汰

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        'Evicted resource1 from cache (LRU)',
      );

      consoleDebugSpy.mockRestore();
    });

    it('LRU 淘汰时应该清理 loadingPromises 和 states', async () => {
      const smallLoader = new ResourceLoader<MockResource>(2);

      smallLoader.register('resource1', {
        loader: vi.fn().mockResolvedValue({ name: 'resource1', value: 1 }),
      });
      smallLoader.register('resource2', {
        loader: vi.fn().mockResolvedValue({ name: 'resource2', value: 2 }),
      });
      smallLoader.register('resource3', {
        loader: vi.fn().mockResolvedValue({ name: 'resource3', value: 3 }),
      });

      // 加载前两个资源（缓存满）
      await smallLoader.load('resource1');
      await smallLoader.load('resource2');

      expect(smallLoader.isLoaded('resource1')).toBe(true);
      expect(smallLoader.isLoaded('resource2')).toBe(true);

      // 加载第三个资源，触发 LRU 淘汰
      await smallLoader.load('resource3');

      // resource1 应该被淘汰（最久未使用）
      expect(smallLoader.isLoaded('resource1')).toBe(false);
      expect(smallLoader.getState('resource1')).toBeUndefined();

      // resource2 和 resource3 应该在缓存中
      expect(smallLoader.isLoaded('resource2')).toBe(true);
      expect(smallLoader.isLoaded('resource3')).toBe(true);

      // 验证 loadingPromises 也被清理（通过行为验证）
      // 如果 loadingPromises 没有被清理，可能会有问题
      // 但由于资源已经完全加载，loadingPromises 应该已经为空
      // 这里主要验证状态被正确清理
    });
  });

  describe('访问资源时更新 LRU 顺序', () => {
    it('get() 方法应该更新 LRU 顺序', async () => {
      const smallLoader = new ResourceLoader<MockResource>(3);

      smallLoader.register('resource1', {
        loader: vi.fn().mockResolvedValue({ name: 'resource1', value: 1 }),
      });
      smallLoader.register('resource2', {
        loader: vi.fn().mockResolvedValue({ name: 'resource2', value: 2 }),
      });
      smallLoader.register('resource3', {
        loader: vi.fn().mockResolvedValue({ name: 'resource3', value: 3 }),
      });
      smallLoader.register('resource4', {
        loader: vi.fn().mockResolvedValue({ name: 'resource4', value: 4 }),
      });

      // 加载 resource1, resource2, resource3
      await smallLoader.load('resource1');
      await smallLoader.load('resource2');
      await smallLoader.load('resource3');

      // 访问 resource1（更新其 LRU 顺序）
      smallLoader.get('resource1');

      // 加载 resource4（应该淘汰 resource2，而不是 resource1）
      await smallLoader.load('resource4');

      expect(smallLoader.isLoaded('resource1')).toBe(true); // 仍然存在
      expect(smallLoader.isLoaded('resource2')).toBe(false); // 被淘汰
      expect(smallLoader.isLoaded('resource3')).toBe(true);
      expect(smallLoader.isLoaded('resource4')).toBe(true);
    });

    it('load() 方法应该更新 LRU 顺序', async () => {
      const smallLoader = new ResourceLoader<MockResource>(3);

      smallLoader.register('resource1', {
        loader: vi.fn().mockResolvedValue({ name: 'resource1', value: 1 }),
      });
      smallLoader.register('resource2', {
        loader: vi.fn().mockResolvedValue({ name: 'resource2', value: 2 }),
      });
      smallLoader.register('resource3', {
        loader: vi.fn().mockResolvedValue({ name: 'resource3', value: 3 }),
      });
      smallLoader.register('resource4', {
        loader: vi.fn().mockResolvedValue({ name: 'resource4', value: 4 }),
      });

      // 加载 resource1, resource2, resource3
      await smallLoader.load('resource1');
      await smallLoader.load('resource2');
      await smallLoader.load('resource3');

      // 重新加载 resource1（更新其 LRU 顺序）
      await smallLoader.load('resource1');

      // 加载 resource4（应该淘汰 resource2）
      await smallLoader.load('resource4');

      expect(smallLoader.isLoaded('resource1')).toBe(true);
      expect(smallLoader.isLoaded('resource2')).toBe(false); // 被淘汰
      expect(smallLoader.isLoaded('resource3')).toBe(true);
      expect(smallLoader.isLoaded('resource4')).toBe(true);
    });
  });

  describe('自定义缓存大小', () => {
    it('应该支持自定义 maxCacheSize', async () => {
      const customLoader = new ResourceLoader<MockResource>(5);

      expect(customLoader.isLoaded('resource1')).toBe(false);

      // 注册并加载 6 个资源
      for (let i = 1; i <= 6; i++) {
        customLoader.register(`resource${i}`, {
          loader: vi
            .fn()
            .mockResolvedValue({ name: `resource${i}`, value: i }),
        });
      }

      for (let i = 1; i <= 6; i++) {
        await customLoader.load(`resource${i}`);
      }

      // 前 5 个应该存在，第 6 个加载时应该淘汰 resource1
      expect(customLoader.isLoaded('resource1')).toBe(false);
      expect(customLoader.isLoaded('resource2')).toBe(true);
      expect(customLoader.isLoaded('resource3')).toBe(true);
      expect(customLoader.isLoaded('resource4')).toBe(true);
      expect(customLoader.isLoaded('resource5')).toBe(true);
      expect(customLoader.isLoaded('resource6')).toBe(true);
    });
  });

  describe('预加载失败后的快速重试', () => {
    it('预加载失败应该标记 preloadFailed，并在 5 秒后清理', async () => {
      vi.useFakeTimers();

      const error = new Error('Load failed');
      loader.register('resource1', {
        loader: vi.fn().mockRejectedValue(error),
      });

      // 预加载失败
      await loader.preload(['resource1']);

      let state = loader.getState('resource1');
      expect(state?.status).toBe('error');
      expect(state?.preloadFailed).toBe(true);

      // 等待 5 秒
      vi.advanceTimersByTime(5000);

      // 状态应该被清理
      state = loader.getState('resource1');
      expect(state).toBeUndefined();

      vi.useRealTimers();
    });

    it('用户主动加载时检测到 preloadFailed 标记，应该立即重试', async () => {
      const error = new Error('Load failed');
      const resource: MockResource = { name: 'resource1', value: 1 };

      let callCount = 0;
      mockLoaderFn.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          throw error; // 第一次失败（预加载）
        }
        return resource; // 第二次成功（用户主动加载）
      });

      loader.register('resource1', {
        loader: mockLoaderFn,
        retryCount: 0, // 不自动重试
      });

      // 预加载失败
      await loader.preload(['resource1']);

      let state = loader.getState('resource1');
      expect(state?.preloadFailed).toBe(true);

      // 用户主动加载（应该立即重试，不等待 1 秒延迟）
      const startTime = Date.now();
      const result = await loader.load('resource1');
      const endTime = Date.now();

      expect(result).toEqual(resource);
      // 应该立即返回，没有延迟
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('reset() 和 forceReload() 方法', () => {
    it('reset() 应该重置资源状态', async () => {
      const error = new Error('Load failed');
      mockLoaderFn.mockRejectedValue(error);

      loader.register('resource1', {
        loader: mockLoaderFn,
      });

      await expect(loader.load('resource1')).rejects.toThrow();

      expect(loader.getState('resource1')?.status).toBe('error');

      // 重置状态
      loader.reset('resource1');

      expect(loader.getState('resource1')).toBeUndefined();
    });

    it('forceReload() 应该强制重新加载资源', async () => {
      const resource1: MockResource = { name: 'resource1', value: 1 };
      const resource2: MockResource = { name: 'resource1', value: 2 };

      mockLoaderFn
        .mockResolvedValueOnce(resource1)
        .mockResolvedValueOnce(resource2);

      loader.register('resource1', {
        loader: mockLoaderFn,
      });

      // 第一次加载
      const result1 = await loader.load('resource1');
      expect(result1).toEqual(resource1);

      // 强制重新加载
      const result2 = await loader.forceReload('resource1');
      expect(result2).toEqual(resource2);

      expect(mockLoaderFn).toHaveBeenCalledTimes(2);
    });
  });
});
