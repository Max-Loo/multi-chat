/**
 * Vue Router 测试 Mock 工厂（对应原 React Router mock）
 *
 * 提供路由结构测试所需的类型定义和辅助函数
 */

import { vi } from 'vitest';
import type { Router, RouteRecordRaw } from 'vue-router';

/**
 * Vue Router Mock 接口
 */
export interface VueRouterMocks {
  /** Mock useRouter composable */
  useRouter: ReturnType<typeof vi.fn>;
  /** Mock useRoute composable */
  useRoute: ReturnType<typeof vi.fn>;
}

/**
 * 创建 mock route 对象
 * @param config 路由配置
 * @returns 与 vue-router useRoute() 返回结构兼容的 mock 对象
 */
export const createMockRoute = (config?: {
  path?: string;
  fullPath?: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
  hash?: string;
  name?: string;
}) => {
  const {
    path = '/',
    fullPath,
    params = {},
    query = {},
    hash = '',
    name,
  } = config || {};

  return {
    path,
    fullPath: fullPath ?? path,
    params,
    query,
    hash,
    name,
    matched: [],
    meta: {},
    redirectedFrom: undefined,
  };
};

/**
 * 创建带查询参数的 mock route 对象
 * @param pathname 路径名
 * @param queryParams 查询参数对象
 */
export const createMockRouteWithQuery = (
  pathname: string,
  queryParams?: Record<string, string>,
): ReturnType<typeof createMockRoute> =>
  createMockRoute({ path: pathname, query: queryParams });

/**
 * 创建 Vue Router Mock（useRouter / useRoute）
 *
 * 供 vi.mock('vue-router') 工厂使用：
 *
 * @example
 * vi.mock('vue-router', () => {
 *   const mocks = globalThis.__createVueRouterMocks?.({ path: '/chat' });
 *   return { useRouter: mocks.useRouter, useRoute: mocks.useRoute };
 * });
 */
export const createVueRouterMocks = (config?: Parameters<typeof createMockRoute>[0]): VueRouterMocks => {
  const route = createMockRoute(config);

  return {
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      go: vi.fn(),
      currentRoute: { value: route },
    })),
    useRoute: vi.fn(() => route),
  };
};

// ========================================
// 路由配置测试 Helper
// 用于访问 router.options.routes 内部结构的类型安全工具
// ========================================

/**
 * 测试用路由节点类型，包含测试所需的全部字段
 */
export interface TestRouteObject {
  path?: string;
  name?: string;
  component?: unknown;
  children?: TestRouteObject[];
  redirect?: unknown;
}

/**
 * 递归检查路由树是否包含指定属性
 * @param routes 路由列表
 * @param propName 属性名
 * @param predicate 属性值断言函数
 */
export const hasRouteProperty = (
  routes: TestRouteObject[],
  propName: keyof TestRouteObject,
  predicate?: (value: unknown) => boolean,
): boolean => {
  return routes.some((route) => {
    const value = route[propName];
    if (value !== undefined) {
      return predicate ? predicate(value) : true;
    }
    if (route.children) return hasRouteProperty(route.children, propName, predicate);
    return false;
  });
};

/**
 * 获取路由器的根路由配置
 * @param routerInstance createRouter 创建的路由器实例
 */
export function getRootRoute(routerInstance: Router): TestRouteObject {
  return (routerInstance.options.routes as TestRouteObject[])[0];
}

/**
 * 获取路由器根路由的子路由列表
 * @param routerInstance createRouter 创建的路由器实例
 */
export function getRootChildren(routerInstance: Router): TestRouteObject[] {
  return getRootRoute(routerInstance).children ?? [];
}

/**
 * 将路由表中懒加载的 component 转为可读名称（供断言）
 * @param route 路由节点
 */
export function getRouteComponentName(route: TestRouteObject): string | undefined {
  const component = route.component as
    | { name?: string }
    | (() => Promise<unknown>)
    | undefined;
  if (!component) return undefined;
  if (typeof component === 'function') return 'lazy';
  return component.name;
}

export type { RouteRecordRaw };
