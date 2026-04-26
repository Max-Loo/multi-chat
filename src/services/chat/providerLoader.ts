/**
 * 供应商 SDK 加载器
 * 负责按需加载供应商 SDK，支持动态导入、缓存、并发控制、错误重试
 */

import { ResourceLoader } from '@/utils/resourceLoader';
import { ModelProviderKeyEnum } from '@/utils/enums';
import type { LanguageModel } from 'ai';

/**
 * Provider 配置接口
 */
export interface ProviderConfig {
  /** API 密钥 */
  apiKey: string;
  /** API 基础地址 */
  baseURL: string;
  /** 自定义 fetch 函数（可选） */
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

/**
 * Provider 工厂函数类型
 * 接收 ProviderConfig，返回语言模型工厂函数
 * 使用更灵活的类型定义以兼容不同供应商的 SDK
 */
export type ProviderFactory = (config: ProviderConfig) => (modelId: string) => LanguageModel;

/**
 * 供应商 SDK 加载器类（单例）
 */
class ProviderSDKLoaderClass {
  private loader: ResourceLoader<ProviderFactory>;
  private allProviderKeys: ModelProviderKeyEnum[];
  private abortController: AbortController;

  constructor() {
    // 创建 ResourceLoader 实例，最多缓存 10 个供应商 SDK
    this.loader = new ResourceLoader<ProviderFactory>(10);
    this.abortController = new AbortController();
    this.allProviderKeys = this.registerProviders();

    // 监听网络恢复事件，自动重试失败的加载
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.handleNetworkRecover();
      }, { signal: this.abortController.signal });
    }
  }

  /**
   * 注册所有供应商 SDK
   * @returns 所有供应商 key 数组
   * @private
   */
  private registerProviders(): ModelProviderKeyEnum[] {
    // 注册 deepseek 供应商
    this.loader.register(ModelProviderKeyEnum.DEEPSEEK, {
      loader: () =>
        import('@ai-sdk/deepseek').then((m) => m.createDeepSeek),
    });

    // 注册 moonshotai 供应商
    this.loader.register(ModelProviderKeyEnum.MOONSHOTAI, {
      loader: () =>
        import('@ai-sdk/moonshotai').then((m) => m.createMoonshotAI),
    });

    // 注册 zhipuai 供应商
    this.loader.register(ModelProviderKeyEnum.ZHIPUAI, {
      loader: () => import('zhipu-ai-provider').then((m) => m.createZhipu),
    });

    // 注册 zhipuai-coding-plan 供应商（使用相同的 SDK）
    this.loader.register(ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN, {
      loader: () => import('zhipu-ai-provider').then((m) => m.createZhipu),
    });

    return [
      ModelProviderKeyEnum.DEEPSEEK,
      ModelProviderKeyEnum.MOONSHOTAI,
      ModelProviderKeyEnum.ZHIPUAI,
      ModelProviderKeyEnum.ZHIPUAI_CODING_PLAN,
    ];
  }

  /**
   * 获取底层 ResourceLoader 实例（用于测试）
   * @returns ResourceLoader 实例
   */
  getLoader(): ResourceLoader<ProviderFactory> {
    return this.loader;
  }

  /**
   * 加载供应商 SDK
   * @param key 供应商标识符
   * @returns Provider 工厂函数
   */
  async loadProvider(key: ModelProviderKeyEnum): Promise<ProviderFactory> {
    return this.loader.load(key);
  }

  /**
   * 检查供应商 SDK 是否已加载
   * @param key 供应商标识符
   * @returns 是否已加载
   */
  isProviderLoaded(key: ModelProviderKeyEnum): boolean {
    return this.loader.isLoaded(key);
  }

  /**
   * 获取供应商 SDK 加载状态
   * @param key 供应商标识符
   * @returns 资源状态信息
   */
  getProviderState(key: ModelProviderKeyEnum) {
    return this.loader.getState(key);
  }

  /**
   * 预加载多个供应商 SDK
   * @param keys 供应商标识符数组
   * @returns Promise
   */
  async preloadProviders(keys: ModelProviderKeyEnum[]): Promise<void> {
    await this.loader.preload(keys);
  }

  /**
   * 网络恢复后的自动重试逻辑
   * @private
   */
  private handleNetworkRecover(): void {
    // 简单策略：重试所有供应商 SDK
    // 更精确的策略需要 ResourceLoader 暴露遍历状态的方法
    console.log('Network recovered, retrying to load all provider SDKs...');
    this.preloadProviders(this.allProviderKeys);
  }

  /**
   * 重置全部内部状态（仅用于测试）
   * 清理 ResourceLoader 缓存 + 移除事件监听器
   */
  resetForTest(): void {
    this.loader.clearAll();
    this.abortController.abort();
    this.abortController = new AbortController();
    this.allProviderKeys = this.registerProviders();
  }
}

/**
 * 单例实例
 */
const providerSDKLoader = new ProviderSDKLoaderClass();

/**
 * 获取 ProviderSDKLoader 单例实例
 * @returns ProviderSDKLoader 实例
 */
export function getProviderSDKLoader(): ProviderSDKLoaderClass {
  return providerSDKLoader;
}

/**
 * 导出单例实例
 */
export { providerSDKLoader };
