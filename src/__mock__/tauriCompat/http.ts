/**
 * HTTP 插件 Mock 实现
 * 用于测试环境，提供与真实 API 一致的接口
 */

import { vi } from 'vitest';

/**
 * RequestInfo 类型定义
 * 兼容 Web 和 Tauri fetch 的输入参数类型
 */
export type RequestInfo = string | URL | Request;

/**
 * FetchFunc 类型定义
 * 统一的 fetch 函数类型
 */
export type FetchFunc = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

/**
 * Mock fetch 函数
 * 默认返回空 Response
 */
export const fetch = vi.fn().mockImplementation(
  async (_input: RequestInfo, _init?: RequestInit): Promise<Response> => {
    return new Response(JSON.stringify({}), {
      status: 200,
      statusText: 'OK',
      headers: {},
    });
  }
);

/**
 * Mock getFetchFunc 函数
 * 返回 fetch 函数实例
 */
export const getFetchFunc = vi.fn((): FetchFunc => fetch);
