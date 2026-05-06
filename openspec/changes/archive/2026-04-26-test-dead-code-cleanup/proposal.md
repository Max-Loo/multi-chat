## Why

测试辅助代码库中积累了约 577 行经确认无任何运行时消费者的死代码。这些代码分布在 8 个位置，包括 4 个可完整删除的文件/目录和多个未使用的导出函数。死代码增加了维护负担、混淆了新开发者的认知、还通过 barrel 导出链和 setup 注册逻辑产生了不必要的运行时开销（如自定义断言每次 afterEach 都会注册但从未被调用）。

## What Changes

- 删除 `src/__test__/helpers/isolation/performance.ts`（102 行，5 个导出，0 个消费者）
- 删除 `src/__test__/helpers/mocks/types.ts`（85 行，4 个接口，0 个消费者）
- 删除 `src/__test__/helpers/assertions/` 目录（~120 行，4 个文件，3 个自定义 matcher 从未被调用）
- 从 `src/__test__/fixtures/chat.ts` 中删除 8 个未使用的工厂函数（~150 行）：`createReasoningMessage`、`createSystemMessage`、`createMessageWithUsage`、`createMockMessages`、`createMarkdownMessage`、`createLongMessage`、`createCodeMessage`、`getTestMessages`
- 从 `src/__test__/fixtures/router.ts` 中删除 3 个未使用的工厂函数（~80 行）：`getRouteStructure`、`getInvalidRoutes`、`getNestedRoutes`
- 从 `src/__test__/helpers/mocks/matchMedia.ts` 中删除 `createMediaQueryListMock`
- 从 `src/__test__/helpers/mocks/panelLayout.tsx` 中删除 `createPanelLayoutWrapper`
- 从 `src/__test__/helpers/mocks/aiSdk.ts` 中删除 `AIError` 接口
- 同步清理所有 barrel 导出文件（`isolation/index.ts`、`mocks/index.ts`、`helpers/fixtures/index.ts`、`helpers/index.ts`）中的对应 re-export 行
- 从 `setup/cleanup.ts` 中删除 `setupCustomAssertions()` 调用及其 import
- 更新 `src/__test__/README.md` 中对已删除功能的文档引用

## Capabilities

### New Capabilities

无。本次变更为纯删除操作，不引入新能力。

### Modified Capabilities

- `test-helper-utilities`: 移除从未被消费的性能测试工具（`measurePerformance`、`measurePerformanceSync`、`expectDuration`、`benchmarkPerformance`）和自定义断言（`toBeEncrypted`、`toBeValidMasterKey`、`toHaveBeenCalledWithService`），精简 helpers 导出面
- `test-mock-factory-consolidation`: 移除未使用的类型接口（`TauriMockOptions`、`TauriMocks`、`CryptoMocks`、`StorageMocks`）和未使用的 mock 工厂函数（`createMediaQueryListMock`、`createPanelLayoutWrapper`、`AIError`）

## Impact

- **代码量**：净删除约 577 行，无新增代码
- **测试运行**：所有 1793 个测试用例保持通过，无行为变更
- **导入路径**：所有被删除的导出均为零消费者，不存在破坏性变更
- **Barrel 文件**：需同步清理 `isolation/index.ts`、`mocks/index.ts`、`helpers/index.ts` 中的 re-export 行
- **Setup 流程**：`cleanup.ts` 中移除 `setupCustomAssertions()` 调用，减少每次测试后的无用注册开销
- **文档**：`README.md` 需移除对 `measurePerformance`、`expectDuration` 和自定义断言的引用
