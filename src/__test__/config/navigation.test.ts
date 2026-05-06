/**
 * navigation.tsx 配置完整性测试
 *
 * 验证 NAVIGATION_ITEMS 和 NAVIGATION_ITEM_MAP 的数据结构一致性：
 * - 字段完整性（id、i18nKey、path、icon、IconComponent、theme）
 * - ID 唯一性
 * - MAP 与数组一致性
 * - 路径格式（以 / 开头）
 * - i18nKey 格式（符合 navigation.<id>）
 */

import { describe, it, expect } from 'vitest';
import {
  NAVIGATION_ITEMS,
  NAVIGATION_ITEM_MAP,
  type NavigationItem,
} from '@/config/navigation';

const REQUIRED_FIELDS: (keyof NavigationItem)[] = [
  'id',
  'i18nKey',
  'path',
  'icon',
  'IconComponent',
  'theme',
];

const REQUIRED_THEME_FIELDS = ['base', 'active', 'inactive'] as const;

describe('navigation 配置', () => {
  describe('字段完整性校验', () => {
    it('每个导航项应包含所有必需字段', () => {
      for (const item of NAVIGATION_ITEMS) {
        for (const field of REQUIRED_FIELDS) {
          expect(item[field]).toBeDefined();
        }
      }
    });

    it('每个导航项的 theme 应包含 base、active、inactive 子字段', () => {
      for (const item of NAVIGATION_ITEMS) {
        for (const themeField of REQUIRED_THEME_FIELDS) {
          expect(item.theme[themeField]).toBeDefined();
          expect(typeof item.theme[themeField]).toBe('string');
        }
      }
    });
  });

  describe('ID 唯一性校验', () => {
    it('所有导航项的 ID 应互不相同', () => {
      const ids = NAVIGATION_ITEMS.map((item) => item.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('NAVIGATION_ITEM_MAP 与 NAVIGATION_ITEMS 一致性', () => {
    it('MAP 大小应等于数组长度', () => {
      expect(NAVIGATION_ITEM_MAP.size).toBe(NAVIGATION_ITEMS.length);
    });

    it('每个导航项应能通过 ID 从 MAP 中正确查找', () => {
      for (const item of NAVIGATION_ITEMS) {
        const found = NAVIGATION_ITEM_MAP.get(item.id);
        expect(found).toBe(item);
      }
    });
  });

  describe('路径格式校验', () => {
    it('每个路径应以 / 开头', () => {
      for (const item of NAVIGATION_ITEMS) {
        expect(item.path).toMatch(/^\//);
      }
    });
  });

  describe('i18nKey 格式校验', () => {
    it('每个 i18nKey 应符合 navigation.<id> 格式', () => {
      for (const item of NAVIGATION_ITEMS) {
        expect(item.i18nKey).toBe(`navigation.${item.id}`);
      }
    });
  });
});
