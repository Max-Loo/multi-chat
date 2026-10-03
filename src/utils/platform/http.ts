/**
 * 平台层 HTTP 模块
 * 提供统一的 fetch API，所有环境（开发/生产）均使用原生 Web fetch
 *
 * CORS 处理策略：
 * - 开发环境：供应商 API 请求经 Vite 开发服务器 proxy 转发
 * - 生产环境：浏览器原生 fetch 直连供应商 API
 *
 * @example
 * ```typescript
 * // 直接使用 fetch
 * import { fetch } from '@/utils/platform';
 *
 * const response = await fetch('https://api.example.com/data');
 * const data = await response.json();
 * ```
 *
 * @example
 * ```typescript
 * // 获取 fetch 函数实例（用于封装或注入第三方库）
 * import { getFetchFunc } from '@/utils/platform';
 *
 * const fetchFunc = getFetchFunc();
 * const response = await fetchFunc('https://api.example.com/data');
 * ```
 */

/**
 * 原生 fetch 函数引用
 * 保存浏览器原生 fetch API 实现，并绑定 this 为 window
 * 避免 Illegal invocation 错误
 */
const originFetch = window.fetch.bind(window);

/**
 * RequestInfo 类型定义
 * 标准 fetch 的输入参数类型
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
 * 即浏览器原生 fetch（this 绑定为 window）
 *
 * @param input - 请求 URL（字符串、URL 对象或 Request 对象）
 * @param init - 请求配置选项（可选）
 * @returns {Promise<Response>} 响应对象
 *
 * @example
 * ```typescript
 * import { fetch } from '@/utils/platform';
 *
 * // GET 请求
 * const response = await fetch('https://api.example.com/data');
 * const data = await response.json();
 *
 * // POST 请求
 * const response = await fetch('https://api.example.com/submit', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ name: 'test' }),
 * });
 * ```
 */
export const fetch: FetchFunc = originFetch;

/**
 * 获取 fetch 函数实例
 * 用于第三方库 fetch 注入（如 AI SDK provider）或自定义请求方法封装
 *
 * @returns {FetchFunc} fetch 函数实例
 *
 * @example
 * ```typescript
 * import { getFetchFunc } from '@/utils/platform';
 *
 * // 封装自定义请求方法
 * class ApiClient {
 *   private fetch: FetchFunc;
 *
 *   constructor() {
 *     this.fetch = getFetchFunc();
 *   }
 *
 *   async request(url: string, options?: RequestInit) {
 *     const response = await this.fetch(url, options);
 *     if (!response.ok) {
 *       throw new Error(`HTTP ${response.status}: ${response.statusText}`);
 *     }
 *     return response.json();
 *   }
 * }
 * ```
 */
export const getFetchFunc = (): FetchFunc => {
  return originFetch;
};

/**
 * 原生类型说明
 *
 * 以下类型直接使用全局原生定义：
 * - RequestInit：请求配置选项类型
 * - Response：响应对象类型
 * - Headers：请求头/响应头类型
 * - Request：请求对象类型
 *
 * @example
 * ```typescript
 * import { fetch, type RequestInfo } from '@/utils/platform';
 *
 * const options: RequestInit = {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 * };
 *
 * const response: Response = await fetch('https://api.example.com/data', options);
 * const headers: Headers = response.headers;
 * ```
 */
