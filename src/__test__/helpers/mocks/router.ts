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
