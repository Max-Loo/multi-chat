## 1. 创建分层模块

- [x] 1.1 创建 `src/__test__/setup/base.ts`：包含 fake-indexeddb 导入、ResizeObserver polyfill、jest-dom 扩展、__VITEST__ 标识、9 个 globalThis mock 工厂注册
- [x] 1.2 创建 `src/__test__/setup/mocks.ts`：包含 createDefaultMockStream/createDefaultMockStreamResult/createMockAIProvider 辅助函数，以及 12 个全局 vi.mock() 调用（从 setup.ts 迁移）
- [x] 1.3 创建 `src/__test__/setup/cleanup.ts`：包含 setupCustomAssertions() 调用、afterEach(cleanup + clearAllMocks)、unhandledrejection 抑制逻辑

## 2. 重构入口文件

- [x] 2.1 重写 `src/__test__/setup.ts` 为瘦入口（仅 import base、mocks、cleanup 三行）
- [x] 2.2 重写 `src/__test__/integration/setup.ts` 为瘦入口（仅 import base、cleanup 两行），移除重复的 globalThis 注册

## 3. 配置统一

- [x] 3.1 在 `vite.config.ts` 的 test 配置中添加 `globals: true`
- [x] 3.2 确认 `vitest.integration.config.ts` 的 `globals: true` 已存在，补充 `deps.optimizer` 配置（从 vite.config.ts 同步预构建列表）

## 4. 清理过时代码

- [x] 4.1 修正 setup 层中 "jsdom" → "happy-dom" 的过时注释
- [x] 4.2 删除被注释掉的 `setupGlobalMocks` 调用

## 5. 验证

- [x] 5.1 运行 `pnpm test:run` 确认全部单元测试通过（1788 tests）
- [x] 5.2 运行 `pnpm test:integration:run` 确认全部集成测试通过
- [x] 5.3 运行 `pnpm test:all` 确认全部测试通过
