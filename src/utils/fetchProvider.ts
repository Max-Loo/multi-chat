/**
 * 统一 fetch 提供者模块
 * 全部环境使用浏览器原生 fetch，为第三方库（如 AI SDK）提供可注入的 fetch 函数引用
 *
 * @example
 * ```typescript
 * // 直接使用 fetch
 * import { fetch } from '@/utils/fetchProvider';
 *
 * const response = await fetch('https://api.example.com/data');
 * const data = await response.json();
 * ```
 *
 * @example
 * ```typescript
 * // 获取 fetch 函数实例（用于封装或注入第三方库）
 * import { getFetchFunc } from '@/utils/fetchProvider';
 *
 * const fetchFunc = getFetchFunc();
 * const response = await fetchFunc('https://api.example.com/data');
 * ```
 */

/**
 * 原生 fetch 函数引用
 * 绑定 this 为 window，避免 Illegal invocation 错误
 */
const originFetch = window.fetch.bind(window);

/**
 * RequestInfo 类型定义
 * 兼容标准 Fetch API 的输入参数类型
 *
 * @example
 * ```typescript
 * // 字符串 URL
 * fetch('https://api.example.com/data');
 *
 * // URL 对象
 * fetch(new URL('https://api.example.com/data'));
 *
 * // Request 对象
 * fetch(new Request('https://api.example.com/data'));
 * ```
 */
export type RequestInfo = string | URL | Request;

/**
 * FetchFunc 类型定义
 * 统一的 fetch 函数类型，兼容标准 Fetch API
 *
 * @param input - 请求 URL 或 Request 对象
 * @param init - 请求配置选项（可选）
 * @returns Promise<Response> 响应对象
 */
export type FetchFunc = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

/**
 * 统一的 fetch 函数
 * 全部环境使用浏览器原生 fetch
 *
 * @param input - 请求 URL（字符串、URL 对象或 Request 对象）
 * @param init - 请求配置选项（可选）
 * @returns {Promise<Response>} 响应对象
 */
export const fetch: FetchFunc = originFetch;

/**
 * 获取 fetch 函数实例
 * 用于第三方库 fetch 注入（如 AI SDK）或自定义请求方法封装
 *
 * @returns {FetchFunc} fetch 函数实例
 *
 * @example
 * ```typescript
 * import { getFetchFunc } from '@/utils/fetchProvider';
 *
 * // 注入第三方库（如 AI SDK provider）
 * const provider = createOpenAICompatible({
 *   fetch: getFetchFunc(),
 * });
 * ```
 */
export const getFetchFunc = (): FetchFunc => {
  return originFetch;
};
