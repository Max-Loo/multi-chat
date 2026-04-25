## 1. 扩展 helpers/mocks/aiSdk.ts

- [x] 1.1 将 `createMockAIProvider(providerName)` 函数从 `setup/mocks.ts` 移动到 `helpers/mocks/aiSdk.ts`，添加 JSDoc 和导出
- [x] 1.2 将 `createDefaultMockStream` 空生成器逻辑确认已被 `createMockStreamResult()` 无参调用覆盖，无需额外迁移

## 2. 更新 helpers/mocks/index.ts 导出

- [x] 2.1 在 `helpers/mocks/index.ts` 中添加 `createMockAIProvider` 的再导出

## 3. 重构 setup/mocks.ts

- [x] 3.1 删除 `setup/mocks.ts` 中内联的 `createDefaultMockStream`、`createDefaultMockStreamResult`、`createMockAIProvider` 三个函数定义
- [x] 3.2 从 `helpers/mocks/aiSdk.ts` 导入 `createMockStreamResult` 和 `createMockAIProvider`
- [x] 3.3 更新 `vi.mock('ai')` 中 `streamText` 使用 `createMockStreamResult()`
- [x] 3.4 更新 `vi.mock('@ai-sdk/deepseek')`、`vi.mock('@ai-sdk/moonshotai')`、`vi.mock('zhipu-ai-provider')` 使用导入的 `createMockAIProvider`

## 4. 验证

- [x] 4.1 运行 `pnpm test:run` 确认全部 1788 个单元测试通过
- [x] 4.2 运行 `pnpm test:integration:run` 确认全部 95 个集成测试通过
- [x] 4.3 确认 `setup/mocks.ts` 中不再包含任何内联的 AI SDK mock 辅助函数
