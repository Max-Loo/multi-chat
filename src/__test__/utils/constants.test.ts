/**
 * constants 单元测试
 *
 * 测试语言配置查找、支持语言列表完整性、语言迁移映射
 */

import { describe, it, expect } from 'vitest';
import {
  getLanguageConfig,
  SUPPORTED_LANGUAGE_LIST,
  SUPPORTED_LANGUAGE_SET,
  LANGUAGE_MIGRATION_MAP,
  LANGUAGE_CONFIGS,
} from '@/utils/constants';

describe('getLanguageConfig', () => {
  it('应该返回对应配置 当查找存在的语言', () => {
    expect(getLanguageConfig('zh')).toEqual({
      code: 'zh',
      label: '中文',
      flag: '🇨🇳',
    });
  });

  it('应该返回 undefined 当查找不存在的语言', () => {
    expect(getLanguageConfig('xx')).toBeUndefined();
  });
});

describe('SUPPORTED_LANGUAGE_LIST', () => {
  it('应该包含所有配置的语言代码', () => {
    expect(SUPPORTED_LANGUAGE_LIST).toEqual(['zh', 'en', 'fr']);
  });

  it('应该与 LANGUAGE_CONFIGS 一致', () => {
    expect(SUPPORTED_LANGUAGE_LIST).toEqual(
      LANGUAGE_CONFIGS.map((c) => c.code),
    );
  });
});

describe('SUPPORTED_LANGUAGE_SET', () => {
  it('应该支持 O(1) 查找', () => {
    expect(SUPPORTED_LANGUAGE_SET.has('zh')).toBe(true);
    expect(SUPPORTED_LANGUAGE_SET.has('en')).toBe(true);
    expect(SUPPORTED_LANGUAGE_SET.has('fr')).toBe(true);
    expect(SUPPORTED_LANGUAGE_SET.has('xx')).toBe(false);
  });
});

describe('LANGUAGE_MIGRATION_MAP', () => {
  it('应该将 zh-CN 映射到 zh', () => {
    expect(LANGUAGE_MIGRATION_MAP['zh-CN']).toBe('zh');
  });
});
