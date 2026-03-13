import { beforeAll, afterEach, afterAll, expect } from 'vitest';
import { setupServer } from 'msw/node';
import { allHandlers } from '@/__test__/msw/handlers';
import * as matchers from '@testing-library/jest-dom/matchers';
import 'fake-indexeddb/auto';

/**
 * 集成测试设置文件
 * 配置 MSW server 和全局测试钩子
 */

// 扩展 Vitest 的 expect 断言（@testing-library/jest-dom）
expect.extend(matchers);

// 创建 MSW server，使用所有默认 handlers
export const server = setupServer(...allHandlers);

// 配置 server 忽略未处理的请求（解决 CORS preflight 问题）
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));

afterEach(() => server.resetHandlers())

afterAll(() => server.close())
