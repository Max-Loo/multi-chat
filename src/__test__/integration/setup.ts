import { beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'

/**
 * 集成测试设置文件
 * 配置 MSW server 和全局测试钩子
 */

// 创建 MSW server
export const server = setupServer(

)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

afterEach(() => server.resetHandlers())

afterAll(() => server.close())
