import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { allHandlers } from '@/__test__/msw/handlers';
import 'fake-indexeddb/auto';

/**
 * 集成测试设置文件
 * 配置 MSW server 和全局测试钩子
 */

// 创建 MSW server，使用所有默认 handlers
export const server = setupServer(...allHandlers);

// 配置 server 忽略未处理的请求（解决 CORS preflight 问题）
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

afterEach(() => server.resetHandlers())

afterAll(() => server.close())
