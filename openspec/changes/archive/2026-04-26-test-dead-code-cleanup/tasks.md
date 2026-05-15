## 1. 删除整体无消费者的文件

- [x] 1.1 删除 `src/__test__/helpers/isolation/performance.ts`（102 行，5 个导出全无消费者）
- [x] 1.2 删除 `src/__test__/helpers/mocks/types.ts`（85 行，4 个接口全无消费者）
- [x] 1.3 删除 `src/__test__/helpers/assertions/` 目录（4 个文件：`crypto.ts`、`mock.ts`、`setup.ts`、`index.ts`，3 个自定义 matcher 全无消费者）

## 2. 删除混合文件中的未使用导出

- [x] 2.1 从 `src/__test__/fixtures/chat.ts` 中删除 8 个未使用函数：`createReasoningMessage`、`createSystemMessage`、`createMessageWithUsage`、`createMockMessages`、`createMarkdownMessage`、`createLongMessage`、`createCodeMessage`、`getTestMessages`
- [x] 2.2 从 `src/__test__/fixtures/router.ts` 中删除 3 个未使用函数：`getRouteStructure`、`getInvalidRoutes`、`getNestedRoutes`
- [x] 2.3 从 `src/__test__/helpers/mocks/matchMedia.ts` 中删除 `createMediaQueryListMock` 导出
- [x] 2.4 从 `src/__test__/helpers/mocks/panelLayout.tsx` 中删除 `createPanelLayoutWrapper` 函数，并同步清理因此变为未使用的 `Provider`（react-redux）和 `React`（react）import（`tsconfig.json` 启用了 `noUnusedLocals: true`）
- [x] 2.5 从 `src/__test__/helpers/mocks/aiSdk.ts` 中删除 `AIError` 接口

## 3. 同步清理 barrel 导出和 setup 注册

- [x] 3.1 从 `src/__test__/helpers/isolation/index.ts` 中删除 `export * from './performance'`
- [x] 3.2 从 `src/__test__/helpers/mocks/index.ts` 中删除 `export * from './types'`
- [x] 3.3 从 `src/__test__/helpers/index.ts` 中删除对 `assertions` 的 re-export 行
- [x] 3.4 从 `src/__test__/setup/cleanup.ts` 中删除 `import { setupCustomAssertions }` 和 `setupCustomAssertions()` 调用

## 4. 更新文档

- [x] 4.1 从 `src/__test__/README.md` 中删除「性能测试工具」章节（`measurePerformance`、`expectDuration` 的使用示例）
- [x] 4.2 从 `src/__test__/README.md` 中删除「自定义断言」章节（`toBeEncrypted`、`toBeValidMasterKey` 的使用示例）
- [x] 4.3 从 `src/__test__/README.md` 的快速开始章节中删除对 `assertions` 导入的引用

## 5. 验证

- [x] 5.1 运行 `pnpm test:run` 确认所有 1793 个测试用例继续通过
- [x] 5.2 运行 `pnpm tsc` 确认无 TypeScript 编译错误
