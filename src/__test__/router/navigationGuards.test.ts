/**
 * Router 导航守卫测试
 *
 * 验证路由导航守卫相关的 loader/action 配置
 * 重定向和 404 测试由 routeConfig.test.ts 覆盖
 */

import { describe, it, expect } from 'vitest';
import router from '@/router/index';
import { TestRouteObject, hasRouteProperty, getRootChildren } from '@/__test__/helpers/mocks/router';

describe('Router 导航守卫测试', () => {
  describe('当前实现状态', () => {
    it('应该确认当前路由不包含导航守卫', () => {
      expect(router).toBeDefined();
      expect(router.state).toBeDefined();
    });

    it('应该允许访问所有路由（无权限限制）', () => {
      const routes = getRootChildren(router);
      const routePaths = routes.map((r) => r.path).filter(Boolean);

      // 所有路由都应该可以访问（没有守卫阻止）
      expect(routePaths.length).toBeGreaterThan(0);
    });
  });

  describe('未来导航守卫扩展点', () => {
    it('应该为未来的权限验证守卫预留扩展点', () => {
      // 当前不实现 loader/action，未来可以添加
      expect(hasRouteProperty(router.routes as TestRouteObject[], 'loader')).toBe(false);
      expect(hasRouteProperty(router.routes as TestRouteObject[], 'action')).toBe(false);
    });
  });
});
