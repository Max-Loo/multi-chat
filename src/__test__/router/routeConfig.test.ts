/**
 * vue-router 路由配置测试（转写自 React router/ 目录 4 个测试）
 *
 * 验证路由树结构、懒加载、重定向、兜底路由与导航行为
 */

import { describe, it, expect } from 'vitest';
import type { RouteRecordRaw } from 'vue-router';
import { createAppRouter, default as appRouter } from '@/router';
import { Layout } from '@/components/Layout';

/** 原始路由树（createRouter 保留的未扁平化定义） */
function rawRoutes(): RouteRecordRaw[] {
  return appRouter.options.routes as RouteRecordRaw[];
}

describe('Router 配置结构测试', () => {
  it('应该成功创建路由实例', () => {
    expect(appRouter).toBeDefined();
    expect(typeof appRouter.push).toBe('function');
  });

  it('应该有根路由且根组件为 Layout', () => {
    const root = rawRoutes().find((route) => route.path === '/');

    expect(root).toBeDefined();
    expect(root!.component).toBe(Layout);
  });

  it('应该包含所有必要的页面路由', () => {
    const root = rawRoutes().find((route) => route.path === '/')!;
    const childPaths = root.children!.map((child) => child.path);

    expect(childPaths).toEqual(
      expect.arrayContaining([
        '',
        'chat',
        'model',
        'setting',
        '/:pathMatch(.*)*',
        '404',
      ]),
    );
  });

  it('应该为所有页面组件使用懒加载（组件为动态导入函数）', () => {
    const root = rawRoutes().find((route) => route.path === '/')!;

    for (const child of root.children!) {
      if ('redirect' in child || child.path === '404') continue;
      const component =
        'component' in child ? child.component : undefined;
      expect(typeof component).toBe('function');
    }
  });

  it('应该正确配置 model 子路由', () => {
    const root = rawRoutes().find((route) => route.path === '/')!;
    const model = root.children!.find((child) => child.path === 'model');

    expect(model?.children?.map((child) => child.path)).toEqual([
      '',
      'table',
      'add',
    ]);
  });

  it('应该正确配置 setting 子路由', () => {
    const root = rawRoutes().find((route) => route.path === '/')!;
    const setting = root.children!.find((child) => child.path === 'setting');

    const paths = setting?.children?.map((child) => child.path) ?? [];
    expect(paths).toEqual(expect.arrayContaining(['', 'common', 'key-management']));
  });

  it('index 子路由应该重定向到默认子页面', () => {
    const root = rawRoutes().find((route) => route.path === '/')!;

    const modelIndex = root
      .children!.find((child) => child.path === 'model')!
      .children!.find((child) => child.path === '');
    const settingIndex = root
      .children!.find((child) => child.path === 'setting')!
      .children!.find((child) => child.path === '');

    expect(modelIndex?.redirect).toBe('/model/table');
    expect(settingIndex?.redirect).toBe('/setting/common');
  });

  it('开发环境应该包含 toast-test 路由', () => {
    const root = rawRoutes().find((route) => route.path === '/')!;
    const setting = root.children!.find((child) => child.path === 'setting');

    // 单元测试在 DEV 模式下运行
    expect(
      setting?.children?.some((child) => child.path === 'toast-test'),
    ).toBe(import.meta.env.DEV);
  });

  it('不应该包含逐路由导航守卫（无权限限制）', () => {
    const visit = (routes: RouteRecordRaw[]): void => {
      for (const route of routes) {
        expect(route.beforeEnter).toBeUndefined();
        if (route.children) visit(route.children);
      }
    };
    visit(rawRoutes());
  });

  it('除兜底路由外不应该包含动态参数路由', () => {
    const dynamicRoutes: string[] = [];
    const visit = (routes: RouteRecordRaw[]): void => {
      for (const route of routes) {
        if (route.path.includes(':') && route.path !== '/:pathMatch(.*)*') {
          dynamicRoutes.push(route.path);
        }
        if (route.children) visit(route.children);
      }
    };
    visit(rawRoutes());

    expect(dynamicRoutes).toHaveLength(0);
  });
});

describe('Router 集成测试（memory history）', () => {
  it('应该导航到 /chat 并解析对应页面', async () => {
    const router = createAppRouter();
    await router.push('/chat');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/chat');
  });

  it('根路径应该重定向到 /chat', async () => {
    const router = createAppRouter();
    await router.push('/');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/chat');
  });

  it('/model 应该重定向到 /model/table', async () => {
    const router = createAppRouter();
    await router.push('/model');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/model/table');
  });

  it('/setting 应该重定向到 /setting/common', async () => {
    const router = createAppRouter();
    await router.push('/setting');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/setting/common');
  });

  it('未知路径应该重定向到 /404', async () => {
    const router = createAppRouter();
    await router.push('/no-such-page');
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/404');
  });
});
