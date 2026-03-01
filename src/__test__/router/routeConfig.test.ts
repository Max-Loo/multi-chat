/**
 * Router 配置测试
 * 
 * 测试路由结构的正确性、路由路径定义、组件导入等
 */

import { describe, it, expect } from 'vitest';
import router from '@/router/index';
import { getAllRoutes, getRedirectRules } from '@/__test__/fixtures/router';

describe('Router 配置结构测试', () => {
  describe('路由实例验证', () => {
    it('应该成功创建路由实例', () => {
      expect(router).toBeDefined();
      expect(router).toHaveProperty('routes');
    });

    it('应该有根路由', () => {
      const routes = router.routes;
      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0].path).toBe('/');
    });
  });

  describe('路由路径定义测试', () => {
    it('应该包含所有必要的页面路由', () => {
      const routes = getAllRoutes();
      const expectedRoutes = ['/', '/chat', '/model', '/model/table', '/model/add', '/setting', '/setting/common', '/404'];

      expectedRoutes.forEach((route) => {
        expect(routes).toContain(route);
      });
    });
  });

  describe('路由组件导入测试', () => {
    it('应该正确导入 Layout 组件作为根元素', () => {
      const rootRoute = (router.routes[0] as any) as any;
      expect(rootRoute.element).toBeDefined();
      expect(rootRoute.element.type.name).toBe('Layout');
    });

    it('应该为所有页面组件使用懒加载', () => {
      const rootRoute = (router.routes[0] as any) as any;
      const childRoutes = rootRoute.children || [];

      // 检查主要页面路由是否使用懒加载（chat, model, setting）
      const lazyRoutePaths = ['chat', 'model', 'setting'];
      lazyRoutePaths.forEach((path) => {
        const route = childRoutes.find((r: any) => r.path === path);
        expect(route).toBeDefined();
        // React.lazy 组件会有 _payload 或 _ctor 属性
        expect(route?.element?.type?._payload || route?.element?.type?._ctor).toBeDefined();
      });
    });
  });

  describe('嵌套路由结构测试', () => {
    it('应该为 /model 路由配置子路由', () => {
      const routes = (router.routes[0] as any).children || [];
      const modelRoute = routes.find((r: any) => r.path === 'model');

      expect(modelRoute).toBeDefined();
      expect(modelRoute?.children).toBeDefined();
      expect(modelRoute?.children?.length).toBeGreaterThan(0);
    });

    it('应该为 /setting 路由配置子路由', () => {
      const routes = (router.routes[0] as any).children || [];
      const settingRoute = routes.find((r: any) => r.path === 'setting');

      expect(settingRoute).toBeDefined();
      expect(settingRoute?.children).toBeDefined();
      expect(settingRoute?.children?.length).toBeGreaterThan(0);
    });

    it('应该正确配置 model 子路由', () => {
      const routes = (router.routes[0] as any).children || [];
      const modelRoute = routes.find((r: any) => r.path === 'model');

      expect(modelRoute).toBeDefined();
      expect(modelRoute?.children).toBeDefined();

      // 验证子路由路径
      const childPaths = modelRoute?.children?.map((r: any) => r.path) || [];
      expect(childPaths).toContain('table');
      expect(childPaths).toContain('add');
    });

    it('应该正确配置 setting 子路由', () => {
      const routes = (router.routes[0] as any).children || [];
      const settingRoute = routes.find((r: any) => r.path === 'setting');

      expect(settingRoute).toBeDefined();
      expect(settingRoute?.children).toBeDefined();

      // 验证子路由路径
      const childPaths = settingRoute?.children?.map((r: any) => r.path) || [];
      expect(childPaths).toContain('common');
    });
  });

  describe('重定向规则测试', () => {
    const redirectRules = getRedirectRules();

    it.each(Object.entries(redirectRules))(
      '应该配置重定向: %s -> %s',
      (from, _to) => {
        const routes = (router.routes[0] as any).children || [];

        // 查找源路由
        const sourceRoute = routes.find((r: any) => {
          if (from === '*') return r.path === '*';
          if (r.index === true && from === '/') return true;
          return r.path === from.replace(/^\//, '').split('/')[0];
        });

        expect(sourceRoute).toBeDefined();

        // 验证重定向
        if (from === '/') {
          // 根路由使用 index: true 和 Navigate
          expect(sourceRoute?.index).toBe(true);
          expect(sourceRoute?.element?.type?.name).toBe('Navigate');
        } else if (from === '*') {
          // 兜底路由
          expect(sourceRoute?.path).toBe('*');
        } else {
          // 其他重定向
          const parentPath = from.split('/')[1];
          const parentRoute = routes.find((r: any) => r.path === parentPath);
          const redirectRoute = parentRoute?.children?.find((r: any) => r.index === true);

          expect(redirectRoute).toBeDefined();
          expect(redirectRoute?.element?.type?.name).toBe('Navigate');
        }
      }
    );

    it('应该将根路由重定向到 /chat', () => {
      const routes = (router.routes[0] as any).children || [];
      const indexRoute = routes.find((r: any) => r.index === true);

      expect(indexRoute).toBeDefined();
      expect(indexRoute?.element?.type?.name).toBe('Navigate');
      expect(indexRoute?.element?.props.to).toBe('chat');
    });

    it('应该为 /model 的索引路由重定向到 /model/table', () => {
      const routes = (router.routes[0] as any).children || [];
      const modelRoute = routes.find((r: any) => r.path === 'model');

      expect(modelRoute).toBeDefined();

      const indexRoute = modelRoute?.children?.find((r: any) => r.index === true);
      expect(indexRoute).toBeDefined();
      expect(indexRoute?.element?.type?.name).toBe('Navigate');
      expect(indexRoute?.element?.props.to).toBe('table');
    });

    it('应该为 /setting 的索引路由重定向到 /setting/common', () => {
      const routes = (router.routes[0] as any).children || [];
      const settingRoute = routes.find((r: any) => r.path === 'setting');

      expect(settingRoute).toBeDefined();

      const indexRoute = settingRoute?.children?.find((r: any) => r.index === true);
      expect(indexRoute).toBeDefined();
      expect(indexRoute?.element?.type?.name).toBe('Navigate');
      expect(indexRoute?.element?.props.to).toBe('common');
    });
  });

  describe('404 错误处理测试', () => {
    it('应该配置兜底路由处理未匹配的路径', () => {
      const routes = (router.routes[0] as any).children || [];
      const catchAllRoute = routes.find((r: any) => r.path === '*');

      expect(catchAllRoute).toBeDefined();
      expect(catchAllRoute?.element?.type?.name).toBe('Navigate');
      expect(catchAllRoute?.element?.props.to).toBe('/404');
    });

    it('应该定义 404 页面路由', () => {
      const routes = (router.routes[0] as any).children || [];
      const notFoundRoute = routes.find((r: any) => r.path === '404');

      expect(notFoundRoute).toBeDefined();
      expect(notFoundRoute?.element).toBeDefined();
    });
  });

  describe('路由层级结构测试', () => {
    it('应该有正确的路由层级深度', () => {
      const rootRoute = (router.routes[0] as any);

      // 根路由
      expect(rootRoute.path).toBe('/');

      // 一级子路由（在 Layout 下）
      const children = rootRoute.children || [];
      expect(children.length).toBeGreaterThan(0);

      // 二级子路由（在 model 和 setting 下）
      const modelRoute = children.find((r: any) => r.path === 'model');
      expect(modelRoute?.children).toBeDefined();

      const settingRoute = children.find((r: any) => r.path === 'setting');
      expect(settingRoute?.children).toBeDefined();
    });

    it('应该保持路由层级的一致性', () => {
      const routes = (router.routes[0] as any).children || [];

      // 验证所有嵌套路由都有父路由
      const nestedRoutePaths = ['/model/table', '/model/add', '/setting/common'];

      nestedRoutePaths.forEach((path) => {
        const segments = path.split('/').filter(Boolean);
        const childPath = segments[1];

        const parentRoute = routes.find((r: any) => r.path === segments[0]);
        expect(parentRoute).toBeDefined();

        const childRoute = parentRoute?.children?.find((r: any) => r.path === childPath);
        expect(childRoute).toBeDefined();
      });
    });
  });
});
