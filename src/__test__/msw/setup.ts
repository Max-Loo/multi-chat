/**
 * MSW Server 配置
 * 初始化 MSW server 用于集成测试
 */

import { setupServer } from 'msw/node';
import { allHandlers } from './handlers';

/**
 * MSW server 实例
 * 用于集成测试中模拟 API 请求
 */
export const server = setupServer(...allHandlers);

/**
 * 初始化 MSW server
 * 在 vitest.integration.config.ts 的 setupFiles 中调用
 */
export function setupMSW() {
  // 配置 server 忽略未处理的请求（解决 CORS preflight 问题）
  server.listen({
    onUnhandledRequest: 'bypass',
  });
}

/**
 * 关闭 MSW server
 * 在所有测试完成后调用
 */
export function teardownMSW() {
  server.close();
}

/**
 * 重置 handlers
 * 在每个测试之间调用
 */
export function resetHandlers() {
  server.resetHandlers();
}
