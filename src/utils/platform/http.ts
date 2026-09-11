/**
 * 统一 HTTP 模块
 * 提供原生 Web fetch 的统一封装，供应用与第三方库注入使用
 *
 * 说明：
 * - 所有环境统一使用原生 window.fetch
 * - 不包含任何平台探测或运行环境分支
 */

/**
 * 原生 fetch 函数引用
 * 保存浏览器原生 fetch API 实现，并绑定 this 为 window
 * 避免 Illegal invocation 错误
 */
const originFetch = window.fetch.bind(window);

/**
 * FetchFunc 类型定义
 * 统一的 fetch 函数类型，与标准 Fetch API 一致（input 同时接受 URL 对象）
 *
 * @param input - 请求 URL 或 Request 对象
 * @param init - 请求配置选项（可选）
 * @returns Promise<Response> 响应对象
 */
export type FetchFunc = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/**
 * 统一的 fetch 函数
 * 直接使用原生 Web fetch 实现
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
export const fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  return originFetch(input, init);
};

/**
 * 获取 fetch 函数实例
 * 用于第三方库 fetch 注入（如 Axios）或自定义请求方法封装
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
 *
 * @example
 * ```typescript
 * // 注入第三方库（如 Axios）
 * import { getFetchFunc } from '@/utils/platform';
 * import axios from 'axios';
 *
 * const api = axios.create({
 *   adapter: getFetchFunc(),
 * });
 *
 * const response = await api.get('https://api.example.com/data');
 * ```
 */
export const getFetchFunc = (): FetchFunc => {
  return originFetch;
};

/**
 * 原生类型说明
 *
 * RequestInfo、RequestInit、Response、Headers 等类型直接使用 DOM 原生定义，
 * 不在本模块中重复声明。
 */
