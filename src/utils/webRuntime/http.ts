/**
 * Tauri HTTP 插件兼容层
 * 提供跨平台兼容的 fetch API，根据运行环境自动选择合适的实现
 *
 * 环境判断逻辑：
 * - 开发环境（import.meta.env.DEV === true）：使用原生 Web fetch，便于调试
 * - 生产环境 + Tauri 平台（window.__TAURI__ 存在）：使用 @tauri-apps/plugin-http 的 fetch
 * - 生产环境 + Web 平台：使用原生 Web fetch
 *
 * @example
 * ```typescript
 * // 直接使用 fetch
 * import { fetch } from '@/utils/tauriCompat';
 *
 * const response = await fetch('https://api.example.com/data');
 * const data = await response.json();
 * ```
 *
 * @example
 * ```typescript
 * // 获取 fetch 函数实例（用于封装或注入第三方库）
 * import { getFetchFunc } from '@/utils/tauriCompat';
 *
 * const fetchFunc = getFetchFunc();
 * const response = await fetchFunc('https://api.example.com/data');
 * ```
 *
 * @example
 * ```typescript
 * // 注入第三方库（如 Axios）
 * import { getFetchFunc } from '@/utils/tauriCompat';
 * import axios from 'axios';
 *
 * const api = axios.create({
 *   adapter: getFetchFunc(),
 * });
 * ```
 */

import { isTauri } from './env';

/**
 * 原生 fetch 函数引用
 * 保存浏览器原生 fetch API 实现，并绑定 this 为 window
 * 避免 Illegal invocation 错误
 */
const originFetch = window.fetch.bind(window);

/**
 * RequestInfo 类型定义
 * 兼容 Web 和 Tauri fetch 的输入参数类型
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
 * 创建并返回适合当前环境的 fetch 函数（异步版本）
 *
 * 环境判断逻辑：
 * 1. 开发环境 → 原生 Web fetch（便于调试）
 * 2. 生产环境 + Tauri → 动态导入 Tauri fetch（系统代理、证书管理）
 * 3. 生产环境 + Web → 原生 Web fetch
 *
 * @returns {Promise<FetchFunc>} fetch 函数实例的 Promise
 *
 * @internal
 */
const createFetch = async (): Promise<FetchFunc> => {
  // 开发环境：使用原生 Web fetch
  if (import.meta.env.DEV) {
    return originFetch;
  }

  // 生产环境：检测平台
  if (isTauri()) {
    // Tauri 环境：动态导入 Tauri fetch
    try {
      // 使用标准 ES 模块动态导入
      const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
      return tauriFetch;
    } catch (error) {
      // 导入失败降级到 Web fetch
      console.warn('Failed to load Tauri fetch, falling back to Web fetch:', error);
      return originFetch;
    }
  }

  // Web 环境：使用原生 Web fetch
  return originFetch;
};

/**
 * 使用顶层 await 初始化的 fetch 实例
 * 模块加载时会等待 createFetch() 完成后再导出
 *
 * 初始化时机：
 * - 开发/生产 Web 环境：立即完成（0ms 延迟）
 * - 生产 Tauri 环境：等待动态导入完成（约 10-50ms）
 */
const _fetchInstance: FetchFunc = await createFetch();

/**
 * 统一的 fetch 函数
 * 根据运行环境自动选择合适的实现（Web fetch 或 Tauri fetch）
 *
 * @param input - 请求 URL（字符串、URL 对象或 Request 对象）
 * @param init - 请求配置选项（可选）
 * @returns {Promise<Response>} 响应对象
 *
 * @example
 * ```typescript
 * import { fetch } from '@/utils/tauriCompat';
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
export const fetch = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
  return _fetchInstance(input, init);
};

/**
 * 获取 fetch 函数实例
 * 用于第三方库 fetch 注入（如 Axios）或自定义请求方法封装
 *
 * 注意：返回的是使用顶层 await 初始化完成的 fetch 实例
 *
 * @returns {FetchFunc} fetch 函数实例
 *
 * @example
 * ```typescript
 * import { getFetchFunc } from '@/utils/tauriCompat';
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
 * import { getFetchFunc } from '@/utils/tauriCompat';
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
  return _fetchInstance;
};

/**
 * 原生类型说明
 *
 * 以下类型在 Web 和 Tauri 环境中完全兼容，可直接使用全局原生定义：
 * - RequestInit：请求配置选项类型
 * - Response：响应对象类型
 * - Headers：请求头/响应头类型
 * - Request：请求对象类型
 *
 * @example
 * ```typescript
 * import { fetch, type RequestInfo } from '@/utils/tauriCompat';
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
