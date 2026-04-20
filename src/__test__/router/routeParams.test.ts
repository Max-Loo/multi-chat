/**
 * Router 参数解析测试
 *
 * 验证当前路由配置的静态路由结构
 */

import { describe, it, expect } from 'vitest';
import router from '@/router/index';
import { hasRouteProperty, getRootChildren } from '@/__test__/helpers/mocks/router';

describe('Router 参数解析测试', () => {
  describe('当前实现状态', () => {
    it('应该确认当前路由不包含动态参数', () => {
      const routes = getRootChildren(router);

      // 当前路由都是静态路径
      expect(hasRouteProperty(routes, 'path', (v) => typeof v === 'string' && v.includes(':'))).toBe(false);
    });

    it('应该列出所有静态路由路径', () => {
      const routes = getRootChildren(router);
      const staticPaths = routes.map((r) => r.path).filter(Boolean);

      // 所有路由都是静态路径
      expect(staticPaths).toContain('chat');
      expect(staticPaths).toContain('model');
      expect(staticPaths).toContain('setting');
      expect(staticPaths).toContain('404');
      expect(staticPaths).toContain('*');
    });
  });
});
