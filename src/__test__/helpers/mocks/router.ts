/**
 * React Router 路由结构测试辅助
 *
 * 提供路由结构测试所需的类型定义和辅助函数
 */

import { createBrowserRouter } from 'react-router-dom';

// 获取 createBrowserRouter 返回值的类型
type Router = ReturnType<typeof createBrowserRouter>;

// ========================================
// 路由配置测试 Helper
// 用于访问 router.routes 内部结构的类型安全工具
// ========================================

/**
 * React 元素的类型信息（用于测试中访问组件名和 props）
 */
export interface ReactElementLike {
  type?: { name?: string; _payload?: unknown; _ctor?: unknown };
  props?: Record<string, unknown>;
}

/**
 * 测试用路由节点类型，包含测试所需的全部字段
 */
export interface TestRouteObject {
  path?: string;
  index?: boolean;
  element?: ReactElementLike;
  children?: TestRouteObject[];
  loader?: unknown;
  action?: unknown;
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
 * @param routerInstance createBrowserRouter 创建的路由器实例
 */
export function getRootRoute(routerInstance: Router): TestRouteObject {
  return routerInstance.routes[0] as unknown as TestRouteObject;
}

/**
 * 获取路由器根路由的子路由列表
 * @param routerInstance createBrowserRouter 创建的路由器实例
 */
export function getRootChildren(routerInstance: Router): TestRouteObject[] {
  return getRootRoute(routerInstance).children ?? [];
}
