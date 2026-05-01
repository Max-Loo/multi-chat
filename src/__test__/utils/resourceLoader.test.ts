import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

    it('加载未注册的资源应该抛出错误', async () => {
      await expect(loader.load('unregistered')).rejects.toThrow(
        'Resource "unregistered" is not registered.',
      );
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

    it('get() 对不存在的资源返回 undefined 且不更新 LRU', () => {
      expect(loader.get('nonexistent')).toBeUndefined();
    });

    it('get() 对不存在的资源不影响缓存淘汰', async () => {
      const smallLoader = new ResourceLoader<MockResource>(2);

      // 先调用 get 不存在的资源
      expect(smallLoader.get('phantom')).toBeUndefined();

      // 注册并加载 3 个资源
      for (let i = 1; i <= 3; i++) {
        smallLoader.register(`resource${i}`, {
          loader: vi.fn().mockResolvedValue({ name: `resource${i}`, value: i }),
        });
      }

      await smallLoader.load('resource1');
      await smallLoader.load('resource2');
      await smallLoader.load('resource3'); // 应该淘汰 resource1

      // 正确淘汰了 resource1，缓存大小为 2
      expect(smallLoader.isLoaded('resource1')).toBe(false);
      expect(smallLoader.isLoaded('resource2')).toBe(true);
      expect(smallLoader.isLoaded('resource3')).toBe(true);
    });
  });

  describe('并发请求同一资源', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

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
      const allPromise = Promise.all([
        loader.load('test-resource'),
        loader.load('test-resource'),
        loader.load('test-resource'),
      ]);
      await vi.advanceTimersByTimeAsync(100);
      const [result1, result2, result3] = await allPromise;

      expect(result1).toEqual(resource);
      expect(result2).toEqual(resource);
      expect(result3).toEqual(resource);
      expect(loadCount).toBe(1); // 只加载了一次
      expect(mockLoaderFn).toHaveBeenCalledTimes(1);
    });

    it('两个并发调用应该共享加载结果且 loader 仅执行一次', async () => {
      const resource: MockResource = { name: 'test', value: 42 };

      mockLoaderFn.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return resource;
      });

      loader.register('test-resource', {
        loader: mockLoaderFn,
      });

      const promise1 = loader.load('test-resource');
      const promise2 = loader.load('test-resource');

      // 两个 Promise 都应该 resolve 为同一个资源对象
      const allPromise = Promise.all([promise1, promise2]);
      await vi.advanceTimersByTimeAsync(100);
      const [result1, result2] = await allPromise;

      expect(result1).toBe(result2);
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

    it('达到 maxRetry 后抛出原始错误（同一引用）', async () => {
      const networkError = new TypeError('Failed to fetch');
      mockLoaderFn.mockRejectedValue(networkError);

      loader.register('test-resource', {
        loader: mockLoaderFn,
        retryCount: 1,
        retryDelay: 10,
      });

      try {
        await loader.load('test-resource');
        expect.unreachable('Should have thrown');
      } catch (error) {
        // 验证抛出的是同一个 error 引用
        expect(error).toBe(networkError);
      }

      // 达到 maxRetry 后状态应为 error
      expect(loader.getState('test-resource')).toEqual({
        status: 'error',
        error: networkError,
      });

      // 1 次初始 + 1 次重试 = 2 次
      expect(mockLoaderFn).toHaveBeenCalledTimes(2);
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

    it('使用默认重试延迟 1000ms', async () => {
      const networkError = new TypeError('Failed to fetch');
      mockLoaderFn.mockRejectedValue(networkError);

      // 不指定 retryDelay，使用默认值 1000
      loader.register('test-resource', {
        loader: mockLoaderFn,
        retryCount: 1,
      });

      const startTime = Date.now();
      await expect(loader.load('test-resource')).rejects.toThrow();
      const endTime = Date.now();

      // 1 次重试 * 默认 1000ms = 至少 1000ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
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

    it('不可重试错误抛出原始错误（同一引用）', async () => {
      const notFoundError = new Error("Cannot find module 'unknown-module'");
      mockLoaderFn.mockRejectedValue(notFoundError);

      loader.register('test-resource', {
        loader: mockLoaderFn,
        retryCount: 3,
        retryDelay: 10,
      });

      try {
        await loader.load('test-resource');
        expect.unreachable('Should have thrown');
      } catch (error) {
        expect(error).toBe(notFoundError);
      }
    });
  });

  describe('自定义 isRetryable 回调', () => {
    it('自定义 isRetryable 返回 true 时应该触发重试', async () => {
      const customError = new Error('custom retryable error');
      mockLoaderFn.mockRejectedValue(customError);

      const isRetryable = vi.fn().mockReturnValue(true);

      loader.register('test-resource', {
        loader: mockLoaderFn,
        retryCount: 2,
        retryDelay: 10,
        isRetryable,
      });

      await expect(loader.load('test-resource')).rejects.toThrow(
        'custom retryable error',
      );

      // 1 次初始 + 2 次重试 = 3 次
      expect(mockLoaderFn).toHaveBeenCalledTimes(3);
      expect(isRetryable).toHaveBeenCalledWith(customError);
    });

    it('自定义 isRetryable 返回 false 时不重试', async () => {
      const networkError = new TypeError('Failed to fetch');
      mockLoaderFn.mockRejectedValue(networkError);

      const isRetryable = vi.fn().mockReturnValue(false);

      loader.register('test-resource', {
        loader: mockLoaderFn,
        retryCount: 3,
        retryDelay: 10,
        isRetryable,
      });

      await expect(loader.load('test-resource')).rejects.toThrow(
        'Failed to fetch',
      );

      // 只调用一次，自定义 isRetryable 覆盖了默认行为
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
      vi.useFakeTimers();
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
      expect(state).toEqual({ status: 'loading', retryCount: 1 });

      await vi.advanceTimersByTimeAsync(100);
      await loadPromise;
      vi.useRealTimers();
    });

    it('加载成功后应该返回 loaded 状态', async () => {
      mockLoaderFn.mockResolvedValue({ name: 'test', value: 42 });

      loader.register('test-resource', {
        loader: mockLoaderFn,
      });

      await loader.load('test-resource');

      const state = loader.getState('test-resource');
      expect(state).toEqual({ status: 'loaded', loadTime: expect.any(Number) });
    });

    it('加载失败后应该返回 error 状态', async () => {
      const error = new Error('Load failed');
      mockLoaderFn.mockRejectedValue(error);

      loader.register('test-resource', {
        loader: mockLoaderFn,
      });

      await expect(loader.load('test-resource')).rejects.toThrow();

      const state = loader.getState('test-resource');
      expect(state).toEqual({ status: 'error', error });
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

      expect(smallLoader.get('resource1')).toBeUndefined(); // 被淘汰，get 返回 undefined
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

    it('缓存满但 key 已存在时不触发淘汰', async () => {
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

      await smallLoader.load('resource1');
      await smallLoader.load('resource2');

      // 缓存已满（2/2），重新加载已存在的 resource1
      await smallLoader.load('resource1');

      // 不应该有淘汰日志
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(smallLoader.isLoaded('resource1')).toBe(true);
      expect(smallLoader.isLoaded('resource2')).toBe(true);

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

      // resource1 有 loaded 状态
      expect(smallLoader.getState('resource1')?.status).toBe('loaded');

      // 加载第三个资源，触发 LRU 淘汰
      await smallLoader.load('resource3');

      // resource1 应该被淘汰：cache、states、loadingPromises 全部清理
      expect(smallLoader.get('resource1')).toBeUndefined();
      expect(smallLoader.getState('resource1')).toBeUndefined();
      expect(smallLoader.isLoaded('resource1')).toBe(false);

      // resource2 和 resource3 应该在缓存中
      expect(smallLoader.isLoaded('resource2')).toBe(true);
      expect(smallLoader.isLoaded('resource3')).toBe(true);
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
      expect(state).toEqual({
        status: 'error',
        error,
        preloadFailed: true,
      });

      // 4 秒后状态仍存在
      vi.advanceTimersByTime(4000);
      expect(loader.getState('resource1')).toBeDefined();

      // 再过 1 秒（总计 5 秒）状态被清理
      vi.advanceTimersByTime(1000);
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

      const state = loader.getState('resource1');
      expect(state).toEqual({
        status: 'error',
        error,
        preloadFailed: true,
      });

      // 用户主动加载（应该立即重试，不等待 1 秒延迟）
      const startTime = Date.now();
      const result = await loader.load('resource1');
      const endTime = Date.now();

      expect(result).toEqual(resource);
      // 应该立即返回，没有延迟
      expect(endTime - startTime).toBeLessThan(100);

      // 加载成功后状态应为 loaded
      expect(loader.getState('resource1')).toEqual({
        status: 'loaded',
        loadTime: expect.any(Number),
      });
    });

    it('预加载失败时保留错误状态和 preloadFailed 标记', async () => {
      const error = new TypeError('Failed to fetch');
      mockLoaderFn.mockImplementation(async () => {
        throw error;
      });

      loader.register('resource1', {
        loader: mockLoaderFn,
        retryCount: 2,
        retryDelay: 10,
      });

      await loader.preload(['resource1']);

      const state = loader.getState('resource1');
      expect(state?.preloadFailed).toBe(true);
      expect(state?.status).toBe('error');
      expect(state?.error).toBe(error);
    });

    it('setTimeout 仅清理 preloadFailed 标记的状态', async () => {
      vi.useFakeTimers();

      // 设置一个非 preloadFailed 的 error 状态
      const error = new Error('Load failed');
      mockLoaderFn.mockRejectedValue(error);
      loader.register('resource1', {
        loader: mockLoaderFn,
        retryCount: 0,
      });

      // 直接 load 失败（非 preload）产生 error 状态
      await expect(loader.load('resource1')).rejects.toThrow();

      // 状态存在且没有 preloadFailed 标记
      expect(loader.getState('resource1')).toEqual({
        status: 'error',
        error,
      });

      // 5 秒后，非 preloadFailed 的状态不会被清理
      vi.advanceTimersByTime(5000);
      expect(loader.getState('resource1')).toEqual({
        status: 'error',
        error,
      });

      vi.useRealTimers();
    });

    it('用户加载成功后 setTimeout 不应清除 loaded 状态', async () => {
      vi.useFakeTimers();

      const error = new Error('Load failed');
      const resource: MockResource = { name: 'resource1', value: 1 };
      let callCount = 0;
      mockLoaderFn.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) throw error;
        return resource;
      });

      loader.register('resource1', {
        loader: mockLoaderFn,
        retryCount: 0,
      });

      // 预加载失败 → 设置 preloadFailed=true 并启动 5 秒 setTimeout
      await loader.preload(['resource1']);
      expect(loader.getState('resource1')?.preloadFailed).toBe(true);

      // 用户主动加载成功 → 状态变为 loaded（无 preloadFailed）
      await loader.load('resource1');
      expect(loader.getState('resource1')).toEqual({
        status: 'loaded',
        loadTime: expect.any(Number),
      });

      // 5 秒后 setTimeout 触发，因为状态已不是 preloadFailed，不应被清理
      vi.advanceTimersByTime(5000);
      expect(loader.getState('resource1')).toEqual({
        status: 'loaded',
        loadTime: expect.any(Number),
      });

      vi.useRealTimers();
    });
  });

  describe('clearAll() 方法', () => {
    it('应该清理 registry、cache、states、loadingPromises 和 lruList', async () => {
      const resource: MockResource = { name: 'test', value: 42 };
      mockLoaderFn.mockResolvedValue(resource);

      loader.register('test-resource', { loader: mockLoaderFn });
      await loader.load('test-resource');

      expect(loader.isLoaded('test-resource')).toBe(true);

      loader.clearAll();

      expect(loader.isLoaded('test-resource')).toBe(false);
      expect(loader.getState('test-resource')).toBeUndefined();
    });

    it('清理后应能重新注册并加载', async () => {
      const resource: MockResource = { name: 'test', value: 42 };
      mockLoaderFn.mockResolvedValue(resource);

      loader.register('test-resource', { loader: mockLoaderFn });
      await loader.load('test-resource');
      loader.clearAll();

      mockLoaderFn.mockResolvedValue({ name: 'new', value: 99 });
      loader.register('test-resource', { loader: mockLoaderFn });
      const result = await loader.load('test-resource');

      expect(result).toEqual({ name: 'new', value: 99 });
      expect(mockLoaderFn).toHaveBeenCalledTimes(2);
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

  /**
   * 测试子类，暴露 protected isNetworkError 方法
   */
  class TestableResourceLoader extends ResourceLoader<any> {
    public testIsNetworkError(error: Error): boolean {
      return this.isNetworkError(error);
    }
  }

  describe('isNetworkError 四层 fallback 检测', () => {
    let testableLoader: TestableResourceLoader;

    beforeEach(() => {
      testableLoader = new TestableResourceLoader();
    });

    it('L1: TypeError 实例返回 true（即使 message 不含网络关键词）', () => {
      // message 不含任何网络关键词，仅通过 instanceof 判断
      const error = new TypeError('x is not a function');
      expect(testableLoader.testIsNetworkError(error)).toBe(true);
    });

    it('L2: error.code 匹配 ERR_NETWORK 返回 true', () => {
      const error = new Error('test');
      (error as any).code = 'ERR_NETWORK';
      expect(testableLoader.testIsNetworkError(error)).toBe(true);
    });

    it('L2: error.code 匹配 ECONNREFUSED 返回 true', () => {
      const error = new Error('test');
      (error as any).code = 'ECONNREFUSED';
      expect(testableLoader.testIsNetworkError(error)).toBe(true);
    });

    it('L2: error.code 匹配 ETIMEDOUT 返回 true', () => {
      const error = new Error('test');
      (error as any).code = 'ETIMEDOUT';
      expect(testableLoader.testIsNetworkError(error)).toBe(true);
    });

    it('L2: error.code 匹配 ENOTFOUND 返回 true', () => {
      const error = new Error('test');
      (error as any).code = 'ENOTFOUND';
      expect(testableLoader.testIsNetworkError(error)).toBe(true);
    });

    it('L2: error.code 匹配 ECONNRESET 返回 true', () => {
      const error = new Error('test');
      (error as any).code = 'ECONNRESET';
      expect(testableLoader.testIsNetworkError(error)).toBe(true);
    });

    it('L2: error.code 匹配 EAI_AGAIN 返回 true', () => {
      const error = new Error('test');
      (error as any).code = 'EAI_AGAIN';
      expect(testableLoader.testIsNetworkError(error)).toBe(true);
    });

    it('L2: error.code 不匹配已知码（ENOENT）返回 false', () => {
      const error = new Error('test');
      (error as any).code = 'ENOENT';
      expect(testableLoader.testIsNetworkError(error)).toBe(false);
    });

    it('L2: error.code 不匹配已知码（RANDOM_ERROR）返回 false', () => {
      const error = new Error('test');
      (error as any).code = 'RANDOM_ERROR';
      expect(testableLoader.testIsNetworkError(error)).toBe(false);
    });

    it('L3: ChunkLoadError（无 code 属性）返回 true', () => {
      const error = new Error('Loading chunk 3 failed');
      error.name = 'ChunkLoadError';
      expect(testableLoader.testIsNetworkError(error)).toBe(true);
    });

    it('L4: message 包含 "fetch" 返回 true', () => {
      const error = new Error('Failed to fetch data');
      expect(testableLoader.testIsNetworkError(error)).toBe(true);
    });

    it('L4: message 包含 "network" 返回 true', () => {
      const error = new Error('network error occurred');
      expect(testableLoader.testIsNetworkError(error)).toBe(true);
    });

    it('L4: message 包含 "timeout" 返回 true', () => {
      const error = new Error('Request timeout');
      expect(testableLoader.testIsNetworkError(error)).toBe(true);
    });

    it('L4: message 包含 "connection" 返回 true', () => {
      const error = new Error('connection refused');
      expect(testableLoader.testIsNetworkError(error)).toBe(true);
    });

    it('L4: message 包含 "econnrefused" 返回 true', () => {
      const error = new Error('econnrefused error');
      expect(testableLoader.testIsNetworkError(error)).toBe(true);
    });

    it('L4: message 包含 "etimedout" 返回 true', () => {
      const error = new Error('etimedout error');
      expect(testableLoader.testIsNetworkError(error)).toBe(true);
    });

    it('L4: message 包含 "enotfound" 返回 true', () => {
      const error = new Error('enotfound error');
      expect(testableLoader.testIsNetworkError(error)).toBe(true);
    });

    it('非网络错误返回 false', () => {
      const error = new Error('Something completely unrelated');
      expect(testableLoader.testIsNetworkError(error)).toBe(false);
    });
  });
});
