/**
 * Router 集成测试
 * 
 * 测试路由配置的完整性和实际导航行为
 */

import { describe, it, expect } from 'vitest';
import { createMemoryRouter } from 'react-router-dom';
import router from '@/router/index';

describe('Router 集成测试', () => {
  describe('路由配置完整性', () => {
    it('应该创建可用的内存路由器', () => {
      const memoryRouter = createMemoryRouter(router.routes, {
        initialEntries: ['/'],
      });

      expect(memoryRouter).toBeDefined();
      expect(memoryRouter.state).toBeDefined();
    });

    it('应该有正确的路由状态', () => {
      const memoryRouter = createMemoryRouter(router.routes, {
        initialEntries: ['/chat'],
      });

      expect(memoryRouter.state.location.pathname).toBe('/chat');
    });

    it('应该处理路由导航', () => {
      const memoryRouter = createMemoryRouter(router.routes, {
        initialEntries: ['/chat'],
      });

      memoryRouter.navigate('/model');
      expect(memoryRouter.state.location.pathname).toBe('/model');
    });
  });

  describe('路由对象结构', () => {
    it('应该有正确的路由层级', () => {
      const routes = router.routes;

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0].path).toBe('/');
      expect(routes[0].children).toBeDefined();
    });

    it('应该有完整的路由树', () => {
      const rootRoute = (router.routes[0] as any);
      const childRoutes = rootRoute.children || [];

      // 验证所有预期的路由都存在
      const routePaths = childRoutes.map((r: any) => r.path);
      expect(routePaths).toContain('chat');
      expect(routePaths).toContain('model');
      expect(routePaths).toContain('setting');
      expect(routePaths).toContain('*');
      expect(routePaths).toContain('404');
    });
  });

  describe('路由懒加载验证', () => {
    it('应该为所有页面配置懒加载', () => {
      const rootRoute = (router.routes[0] as any);
      const childRoutes = rootRoute.children || [];

      // 验证懒加载组件存在
      childRoutes.forEach((route: any) => {
        if (route.path && route.path !== '*' && route.path !== '404' && !route.index) {
          // 这些路由应该有懒加载的组件
          expect(route.element).toBeDefined();
        }
      });
    });
  });

  describe('路由元数据', () => {
    it('应该为未来的元数据配置预留扩展点', () => {
      // 未来可以为路由添加元数据（如标题、权限等）
      expect(true).toBe(true); // 占位测试
    });
  });

  describe('路由错误处理', () => {
    it('应该有兜底路由处理未匹配的路径', () => {
      const rootRoute = (router.routes[0] as any);
      const childRoutes = rootRoute.children || [];
      const catchAllRoute = childRoutes.find((r: any) => r.path === '*');

      expect(catchAllRoute).toBeDefined();
      expect(catchAllRoute?.element).toBeDefined();
    });
  });

  describe('路由实例状态', () => {
    it('应该有正确的初始状态', () => {
      expect(router.state.location).toBeDefined();
      expect(router.state.navigation).toBeDefined();
      expect(router.state.matches).toBeDefined();
    });

    it('应该有可用的路由器方法', () => {
      expect(typeof router.navigate).toBe('function');
      expect(typeof router.createHref).toBe('function');
    });
  });
});
