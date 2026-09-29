/**
 * HTTP 运行时模块
 * 提供浏览器原生 fetch 的统一薄封装，作为应用内所有 HTTP 请求的统一入口
 *
 * 说明：
 * - 所有环境（开发/生产）统一使用浏览器原生 fetch
 * - 请求受浏览器 CORS 策略约束，跨域失败时以 TypeError reject，
 *   由调用方按现有错误处理流程提示用户
 *
 * @example
 * ```typescript
 * // 直接使用 fetch
 * import { fetch } from '@/utils/webRuntime';
 *
 * const response = await fetch('https://api.example.com/data');
 * const data = await response.json();
 * ```
 *
 * @example
 * ```typescript
 * // 获取 fetch 函数实例（用于封装或注入第三方库）
 * import { getFetchFunc } from '@/utils/webRuntime';
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
 * 统一 fetch 的输入参数类型
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
 * 浏览器原生 fetch 的薄封装，转发全部参数与返回值
 *
 * @param input - 请求 URL（字符串、URL 对象或 Request 对象）
 * @param init - 请求配置选项（可选）
 * @returns {Promise<Response>} 响应对象
 *
 * @example
 * ```typescript
 * import { fetch } from '@/utils/webRuntime';
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
export const fetch: FetchFunc = (input, init) => originFetch(input, init);

/**
 * 获取 fetch 函数实例
 * 用于第三方库 fetch 注入（如 Axios）或自定义请求方法封装
 *
 * @returns {FetchFunc} 与模块导出的 fetch 相同的函数实例
 *
 * @example
 * ```typescript
 * import { getFetchFunc } from '@/utils/webRuntime';
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
export const getFetchFunc = (): FetchFunc => fetch;

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
 * import { fetch, type RequestInfo } from '@/utils/webRuntime';
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
