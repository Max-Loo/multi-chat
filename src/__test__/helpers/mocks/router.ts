/**
 * React Router 测试 Mock 工厂
 *
 * 提供 React Router hooks 和相关功能的 Mock 创建函数
 */

import { vi } from 'vitest';

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
 * 创建 React Router Mock 工厂
 * @param config Mock 配置选项
 * @returns React Router Mock 对象
 */
export const createReactRouterMocks = (config?: {
  /** 当前路径名，默认为 '/' */
  pathname?: string;
  /** 路由参数，默认为空对象 */
  params?: Record<string, string>;
  /** 搜索参数，默认为空字符串 */
  search?: string;
  /** hash 值，默认为空字符串 */
  hash?: string;
}): ReactRouterMocks => {
  const {
    pathname = '/',
    params = {},
    search = '',
    hash = '',
  } = config || {};

  let mockSearchParams = new URLSearchParams(search);
  const mockSetSearchParams = vi.fn();

  return {
    useNavigate: vi.fn(),
    useLocation: vi.fn(() => ({
      pathname,
      search,
      hash,
      state: null,
      key: 'test',
    })),
    useParams: vi.fn(() => params),
    searchParams: mockSearchParams,
    setSearchParams: mockSetSearchParams,
  };
};

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
 *
 * @example
 * // 创建嵌套路由参数：/chat/:chatId/model/:modelId
 * const nestedParams = createNestedRouteParams({
 *   chatId: 'chat-123',
 *   modelId: 'model-456',
 * });
 */
export const createNestedRouteParams = (params: Record<string, string>): Record<string, string> => {
  return { ...params };
};

/**
 * 创建包含查询参数的 Mock Location
 * @param pathname 路径名
 * @param queryParams 查询参数对象
 * @returns Mock 的 Location 对象
 *
 * @example
 * // 创建包含查询参数的 location：/chat?chatId=123&modelId=456
 * const location = createMockLocationWithQuery('/chat', {
 *   chatId: '123',
 *   modelId: '456',
 * });
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
 * @param config Mock 配置选项（支持嵌套路由参数）
 * @returns React Router Mock 对象
 *
 * @example
 * // 为 /chat/:chatId/model/:modelId 创建 Mock
 * const mocks = createReactRouterMocksWithNestedParams({
 *   pathname: '/chat/chat-123/model/model-456',
 *   params: {
 *     chatId: 'chat-123',
 *     modelId: 'model-456',
 *   },
 * });
 */
export const createReactRouterMocksWithNestedParams = (config?: {
  /** 当前路径名 */
  pathname?: string;
  /** 嵌套路由参数 */
  params?: Record<string, string>;
  /** 查询参数 */
  queryParams?: Record<string, string>;
  /** hash 值 */
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

