/**
 * 网络请求 Mock 工厂
 * 
 * 提供 fetch 相关的 Mock 创建函数
 */

import { vi } from 'vitest';

/**
 * 创建 Mock fetch 函数（模拟成功响应）
 * @param data 响应数据
 * @param status HTTP 状态码
 * @returns Mock fetch 函数
 */
export const createMockFetch = <T = any>(
  data: T,
  status = 200
) => {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers(),
    redirected: false,
    url: 'https://mock-url.com',
  });
};

/**
 * 创建 Mock fetch 函数（模拟失败响应）
 * @param error 错误对象
 * @returns Mock fetch 函数
 */
export const createMockFetchError = (error: Error | TypeError) => {
  return vi.fn().mockRejectedValue(error);
};

/**
 * 创建 Mock fetch 函数（模拟网络错误）
 * @returns Mock fetch 函数（抛出 TypeError）
 */
export const createMockNetworkError = () => {
  const networkError = new TypeError('Failed to fetch');
  return createMockFetchError(networkError);
};

/**
 * 创建 Mock fetch 函数（模拟超时）
 * @param timeout 超时时间（毫秒）
 * @returns Mock fetch 函数
 */
export const createMockFetchTimeout = (timeout = 5000) => {
  return vi.fn().mockImplementation(() => {
    return new Promise((_, reject) => {
      setTimeout(() => {
        const timeoutError = new Error('Request timeout');
        (timeoutError as any).name = 'AbortError';
        reject(timeoutError);
      }, timeout);
    });
  });
};

/**
 * 创建 Mock Response 对象
 * @param data 响应数据
 * @param status HTTP 状态码
 * @returns Mock Response 对象
 */
export const createMockResponse = <T = any>(
  data: T,
  status = 200
): Response => {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status >= 200 && status < 300 ? 'OK' : 'Error',
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers(),
    redirected: false,
    url: 'https://mock-url.com',
    body: null,
    bodyUsed: false,
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
    clone: vi.fn(),
  } as unknown as Response;
};

/**
 * 创建分阶段 Mock fetch（模拟重试场景）
 * @param responses 响应数组（按顺序返回）
 * @returns Mock fetch 函数
 */
export const createMockFetchSequence = (...responses: Array<Response | Error>) => {
  let callCount = 0;

  return vi.fn().mockImplementation(() => {
    const response = responses[callCount % responses.length];
    callCount++;

    if (response instanceof Error) {
      return Promise.reject(response);
    }

    return Promise.resolve(response);
  });
};
