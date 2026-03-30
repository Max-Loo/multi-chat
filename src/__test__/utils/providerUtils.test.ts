/**
 * providerUtils 单元测试
 *
 * 测试 getProviderLogoUrl 的 URL 拼接
 */

import { describe, it, expect } from 'vitest';
import { getProviderLogoUrl } from '@/utils/providerUtils';

describe('getProviderLogoUrl', () => {
  it('应该构建 openai logo URL', () => {
    expect(getProviderLogoUrl('openai')).toBe(
      'https://models.dev/logos/openai.svg',
    );
  });

  it('应该构建其他供应商 logo URL', () => {
    expect(getProviderLogoUrl('deepseek')).toBe(
      'https://models.dev/logos/deepseek.svg',
    );
  });

  it('应该拼接空字符串', () => {
    expect(getProviderLogoUrl('')).toBe('https://models.dev/logos/.svg');
  });
});
