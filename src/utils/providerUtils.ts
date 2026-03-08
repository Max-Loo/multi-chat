/**
 * 供应商工具函数
 * 提供供应商相关的工具方法，包括 logo URL 构建等
 */

/**
 * 获取供应商 logo URL
 * @param providerKey 供应商唯一标识（如 'openai'、'anthropic'）
 * @returns logo 图片 URL
 * @example
 * getProviderLogoUrl('openai')
 * // => 'https://models.dev/logos/openai.svg'
 */
export const getProviderLogoUrl = (providerKey: string): string => {
  return `https://models.dev/logos/${providerKey}.svg`;
};
