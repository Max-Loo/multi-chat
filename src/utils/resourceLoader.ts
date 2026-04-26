/**
 * 通用资源加载器
 * 支持按需动态加载任意类型的资源（SDK、模块、数据等）
 * 提供缓存、并发控制、错误重试、LRU 淘汰等功能
 */

/**
 * 资源加载函数类型
 * @template T 资源类型
 * @returns 返回资源的 Promise
 */
export type LoaderFn<T> = () => Promise<T>;

/**
 * 资源配置接口
 * @template T 资源类型
 */
export interface ResourceConfig<T> {
  /** 资源加载函数 */
  loader: LoaderFn<T>;
  /** 最大重试次数，默认 3 */
  retryCount?: number;
  /** 重试延迟（毫秒），默认 1000 */
  retryDelay?: number;
  /** 判断错误是否可重试，默认检测网络错误 */
  isRetryable?: (error: Error) => boolean;
}

/**
 * 资源加载状态
 */
export type LoadState =
  | 'idle' /** 未加载 */
  | 'loading' /** 加载中 */
  | 'loaded' /** 已加载 */
  | 'error'; /** 加载失败 */

/**
 * 资源状态信息
 */
export interface ResourceStateInfo {
  /** 加载状态 */
  status: LoadState;
  /** 当前重试次数（仅在 loading 状态时有效） */
  retryCount?: number;
  /** 加载完成时间戳（仅在 loaded 状态时有效） */
  loadTime?: number;
  /** 错误信息（仅在 error 状态时有效） */
  error?: Error;
  /** 预加载失败标记（用于快速重试） */
  preloadFailed?: boolean;
}

/**
 * 通用资源加载器类
 * @template T 资源类型
 *
 * @example
 * ```typescript
 * const loader = new ResourceLoader<ProviderFactory>();
 * loader.register('deepseek', {
 *   loader: () => import('@ai-sdk/deepseek').then(m => m.createDeepSeek),
 * });
 * const createDeepSeek = await loader.load('deepseek');
 * ```
 */
export class ResourceLoader<T> {
  /** 资源注册表 */
  private registry = new Map<string, ResourceConfig<T>>();
  /** 资源缓存 */
  private cache = new Map<string, T>();
  /** 资源状态 */
  private states = new Map<string, ResourceStateInfo>();
  /** 正在进行的加载 Promise（用于并发控制） */
  private loadingPromises = new Map<string, Promise<T>>();
  /** LRU 缓存列表，最近使用的在末尾 */
  private lruList: string[] = [];
  /** 最大缓存大小 */
  private maxCacheSize: number;

  /**
   * 构造函数
   * @param maxCacheSize 最大缓存大小，默认 10
   */
  constructor(maxCacheSize: number = 10) {
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * 注册资源加载器
   * @param key 资源标识符
   * @param config 资源配置
   */
  register(key: string, config: ResourceConfig<T>): void {
    this.registry.set(key, config);
  }

  /**
   * 加载资源
   * @param key 资源标识符
   * @returns 资源的 Promise
   */
  async load(key: string): Promise<T> {
    // 如果已缓存，直接返回
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    // 如果正在加载，返回同一个 Promise（并发控制）
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    // 检查是否注册
    const config = this.registry.get(key);
    if (!config) {
      throw new Error(`Resource "${key}" is not registered.`);
    }

    // 创建加载 Promise
    const loadPromise = this.loadWithRetry(key, config, 1);

    // 缓存 Promise（用于并发控制）
    this.loadingPromises.set(key, loadPromise);

    try {
      const resource = await loadPromise;

      // 更新状态为已加载
      this.states.set(key, {
        status: 'loaded',
        loadTime: Date.now(),
      });

      return resource;
    } finally {
      // 清理 Promise 缓存
      this.loadingPromises.delete(key);
    }
  }

  /**
   * 带重试的加载（私有方法）
   * @param key 资源标识符
   * @param config 资源配置
   * @param attempt 当前尝试次数
   * @returns 资源的 Promise
   */
  private async loadWithRetry(
    key: string,
    config: ResourceConfig<T>,
    attempt: number,
  ): Promise<T> {
    const maxRetry = config.retryCount ?? 3;
    const retryDelay = config.retryDelay ?? 1000;

    // 更新状态为加载中
    this.states.set(key, {
      status: 'loading',
      retryCount: attempt,
    });

    try {
      const resource = await config.loader();

      // 缓存资源
      this.setCache(key, resource);

      return resource;
    } catch (error) {
      const err = error as Error;

      // 判断是否可重试
      const isRetryable =
        config.isRetryable?.(err) ?? this.isNetworkError(err);

      // 如果已达到最大重试次数，抛出错误
      if (attempt > maxRetry) {
        this.states.set(key, {
          status: 'error',
          error: err,
        });
        throw err;
      }

      // 如果可重试，等待后重试
      if (isRetryable) {
        await this.delay(retryDelay);
        return this.loadWithRetry(key, config, attempt + 1);
      }

      // 不可重试，立即抛出错误
      this.states.set(key, {
        status: 'error',
        error: err,
      });
      throw err;
    }
  }

  /**
   * 判断是否为网络错误
   * @param error 错误对象
   * @returns 是否为网络错误
   */
  protected isNetworkError(error: Error): boolean {
    // 1. 检查错误类型（动态导入失败通常是 TypeError）
    if (error instanceof TypeError) {
      return true;
    }

    // 2. 检查错误代码（如果有）
    if ('code' in error) {
      const errorCode = (error as any).code;
      return [
        'ERR_NETWORK',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ECONNRESET',
        'EAI_AGAIN',
      ].includes(errorCode);
    }

    // 3. 检查错误名称（ChunkLoadError 等）
    if (error.name === 'ChunkLoadError') {
      return true;
    }

    // 4. 检查错误消息（作为最后的 fallback）
    const msg = error.message.toLowerCase();
    const networkKeywords = [
      'fetch',
      'network',
      'timeout',
      'connection',
      'econnrefused',
      'etimedout',
      'enotfound',
    ];
    return networkKeywords.some((keyword) => msg.includes(keyword));
  }

  /**
   * 延迟执行（私有方法）
   * @param ms 延迟毫秒数
   * @returns Promise
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 设置缓存（私有方法，支持 LRU 淘汰）
   * @param key 资源标识符
   * @param resource 资源
   */
  private setCache(key: string, resource: T): void {
    // 如果缓存已满，删除最久未使用的资源
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(key)) {
      const lruKey = this.lruList.shift()!;
      this.cache.delete(lruKey);
      this.states.delete(lruKey);
      this.loadingPromises.delete(lruKey);
      console.debug(`Evicted ${lruKey} from cache (LRU)`);
    }

    this.cache.set(key, resource);
    this.updateLRU(key);
  }

  /**
   * 更新 LRU 顺序（私有方法）
   * @param key 资源标识符
   */
  private updateLRU(key: string): void {
    // 从 LRU 列表中移除（如果存在）
    const index = this.lruList.indexOf(key);
    if (index !== -1) {
      this.lruList.splice(index, 1);
    }
    // 添加到末尾（最近使用）
    this.lruList.push(key);
  }

  /**
   * 从缓存获取资源
   * @param key 资源标识符
   * @returns 资源或 undefined
   */
  get(key: string): T | undefined {
    const resource = this.cache.get(key);
    if (resource) {
      // 更新 LRU 顺序
      this.updateLRU(key);
    }
    return resource;
  }

  /**
   * 检查资源是否已加载
   * @param key 资源标识符
   * @returns 是否已加载
   */
  isLoaded(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * 获取资源加载状态
   * @param key 资源标识符
   * @returns 资源状态信息
   */
  getState(key: string): ResourceStateInfo | undefined {
    return this.states.get(key);
  }

  /**
   * 预加载多个资源
   * @param keys 资源标识符数组
   * @returns Promise
   */
  async preload(keys: string[]): Promise<void> {
    await Promise.all(
      keys.map((key) =>
        this.load(key).catch((error) => {
          // 标记为预加载失败，延迟清理状态（5 秒）
          const currentState = this.states.get(key);
          this.states.set(key, {
            status: 'error',
            error,
            preloadFailed: true,
            retryCount: currentState?.retryCount,
          });

          // 延迟清理，允许用户立即重试
          setTimeout(() => {
            const state = this.states.get(key);
            if (state?.preloadFailed) {
              this.states.delete(key);
            }
          }, 5000);

          console.warn(`Failed to preload ${key}:`, error);
        }),
      ),
    );
  }

  /**
   * 重置资源状态，清除失败的记录
   * @param key 资源标识符
   */
  reset(key: string): void {
    this.states.delete(key);
  }

  /**
   * 强制重新加载资源（忽略缓存）
   * @param key 资源标识符
   * @returns 资源的 Promise
   */
  async forceReload(key: string): Promise<T> {
    this.cache.delete(key);
    this.states.delete(key);
    return this.load(key);
  }

  /**
   * 清理全部内部状态（仅用于测试）
   */
  clearAll(): void {
    this.registry.clear();
    this.cache.clear();
    this.states.clear();
    this.loadingPromises.clear();
    this.lruList.length = 0;
  }
}
