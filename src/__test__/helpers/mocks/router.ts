/**
 * React Router 测试 Mock 工厂
 *
 * 提供路由结构测试所需的类型定义和辅助函数
 */

import { vi } from 'vitest';
import { createBrowserRouter } from 'react-router-dom';

// 获取 createBrowserRouter 返回值的类型
type Router = ReturnType<typeof createBrowserRouter>;

/**
 * React Router Mock 接口
 */
export interface ReactRouterMocks {
  /** Mock useNavigate hook */
  useNavigate: ReturnType<typeof vi.fn>;
  /** Mock useLocation hook */
  useLocation: ReturnType<typeof vi.fn>;
  /** Mock useParams hook */
  useParams: ReturnType<typeof vi.fn>;
  /** Mock useSearchParams hook 返回值 */
  searchParams: URLSearchParams;
  /** Mock setSearchParams 函数 */
  setSearchParams: ReturnType<typeof vi.fn>;
}

/**
 * 创建 mock useSearchParams hook 返回值
 * @param searchParams 初始搜索参数
 * @param setSearchParams Mock setSearchParams 函数
 * @returns [searchParams, setSearchParams] 元组
 */
export const createMockSearchParams = (
  searchParams?: URLSearchParams | string,
  setSearchParams?: ReturnType<typeof vi.fn>,
) => {
  const mockParams = typeof searchParams === 'string'
    ? new URLSearchParams(searchParams)
    : searchParams || new URLSearchParams();
  const mockSetParams = setSearchParams || vi.fn();

  return [mockParams, mockSetParams] as const;
};

/**
 * 创建嵌套路由参数 Mock
 * @param params 嵌套路由参数对象
 * @returns Mock 的嵌套路由参数
 */
export const createNestedRouteParams = (params: Record<string, string>): Record<string, string> => {
  return { ...params };
};

/**
 * 创建包含查询参数的 Mock Location
 * @param pathname 路径名
 * @param queryParams 查询参数对象
 * @returns Mock 的 Location 对象
 */
export const createMockLocationWithQuery = (
  pathname: string,
  queryParams?: Record<string, string>
) => {
  const searchParams = new URLSearchParams();
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      searchParams.set(key, value);
    });
  }

  return {
    pathname,
    search: searchParams.toString(),
    hash: '',
    state: null,
    key: 'test',
  };
};

/**
 * 创建带有嵌套路由参数的 React Router Mock
 * @param config Mock 配置选项
 * @returns React Router Mock 对象
 */
export const createReactRouterMocksWithNestedParams = (config?: {
  pathname?: string;
  params?: Record<string, string>;
  queryParams?: Record<string, string>;
  hash?: string;
}): ReactRouterMocks => {
  const {
    pathname = '/',
    params = {},
    queryParams,
    hash = '',
  } = config || {};

  let mockSearchParams = new URLSearchParams();
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      mockSearchParams.set(key, value);
    });
  }

  const mockSetSearchParams = vi.fn();

  return {
    useNavigate: vi.fn(),
    useLocation: vi.fn(() => ({
      pathname,
      search: mockSearchParams.toString(),
      hash,
      state: null,
      key: 'test',
    })),
    useParams: vi.fn(() => params),
    searchParams: mockSearchParams,
    setSearchParams: mockSetSearchParams,
  };
};

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
