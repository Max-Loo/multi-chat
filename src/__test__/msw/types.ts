/**
 * MSW 类型定义
 * 定义 MSW Handlers 的通用类型和配置
 */

import { HttpHandler } from 'msw';

/**
 * 流式响应选项
 */
export interface StreamOptions {
  /** 自定义响应流 */
  response?: ReadableStream;
  /** 响应延迟（毫秒） */
  delay?: number;
  /** 完成原因 */
  finishReason?: string;
  /** Token 使用统计 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

/**
 * API Handler 工厂类型
 */
export type ApiHandlerFactory = {
  /** 成功场景 handler */
  success: (options?: StreamOptions) => HttpHandler;
  /** 网络错误场景 handler */
  networkError: () => HttpHandler;
  /** 超时场景 handler */
  timeout: (options?: { delay: number }) => HttpHandler;
  /** 服务器错误场景 handler */
  serverError: (options?: { status: number; message: string }) => HttpHandler;
};
