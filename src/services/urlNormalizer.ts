import { ModelProviderKeyEnum } from '@/utils/enums';

/**
 * URL 标准化策略接口
 * @description
 * 定义不同供应商的 URL 标准化行为。
 * 
 * 实现此接口的类应该：
 * 1. 实现 normalize() 方法：定义如何标准化 URL
 * 2. 实现 getDescription() 方法：提供表单中的提示文案
 */
interface UrlNormalizationStrategy {
  /**
   * 标准化 URL
   * @param url 原始 URL
   * @returns 标准化后的 URL
   */
  normalize(url: string): string;

  /**
   * 获取表单提示文案
   * @returns 表单中关于地址的提示说明
   */
  getDescription(): string;
}

/**
 * 默认标准化策略
 * @description
 * 大多数 OpenAI 兼容供应商使用默认策略。
 * 
 * 规则：
 * 1. 移除末尾的 /
 * 2. 移除末尾的 #
 */
class DefaultNormalizationStrategy implements UrlNormalizationStrategy {
  normalize(url: string): string {
    // 移除末尾的 / 或 #
    return url.replace(/[/#]$/, '');
  }

  getDescription(): string {
    return 'API 地址';
  }
}

/**
 * Kimi 标准化策略
 * @description
 * Kimi API 要求 URL 必须以 /v1 结尾。
 * 
 * 规则：
 * 1. 如果 URL 以 # 结尾，表示自定义 URL，不做处理
 * 2. 如果 URL 不以 /v1 结尾，自动添加 /v1
 * 3. 移除末尾的 / 后再判断
 */
class KimiNormalizationStrategy implements UrlNormalizationStrategy {
  normalize(url: string): string {
    // 如果以 # 结尾，表示自定义 URL，不做处理
    if (url.endsWith('#')) {
      return url.slice(0, url.length - 1);
    }

    // 移除末尾的 /
    if (url.endsWith('/')) {
      url = url.slice(0, url.length - 1);
    }

    // 如果不是以 /v1 结尾，则添加 /v1
    if (!url.endsWith('/v1')) {
      url = url + '/v1';
    }

    return url;
  }

  getDescription(): string {
    return '/ 结尾会忽略 v1，# 结尾表示自定义';
  }
}

/**
 * 获取 URL 标准化策略
 * @param providerKey 供应商标识符
 * @returns 标准化策略实例
 * @internal
 */
function getStrategy(providerKey: ModelProviderKeyEnum): UrlNormalizationStrategy {
  // Kimi 需要特殊的 /v1 路径处理
  if (providerKey === ModelProviderKeyEnum.KIMI) {
    return new KimiNormalizationStrategy();
  }

  // 其他供应商使用默认策略
  return new DefaultNormalizationStrategy();
}

/**
 * 标准化 URL
 * @param url 原始 URL
 * @param providerKey 供应商标识符
 * @returns 标准化后的 URL
 */
export function normalize(url: string, providerKey: ModelProviderKeyEnum): string {
  const strategy = getStrategy(providerKey);
  return strategy.normalize(url);
}

/**
 * 获取表单提示文案
 * @param providerKey 供应商标识符
 * @returns 表单提示文案
 */
export function getDescription(providerKey: ModelProviderKeyEnum): string {
  const strategy = getStrategy(providerKey);
  return strategy.getDescription();
}
