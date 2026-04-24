## Why

测试代码库中存在大量冗余代码和重复模块，增加了维护成本和认知负担。全局 `setup.ts:317` 已在 `afterEach` 中调用 `vi.clearAllMocks()`，但 67 个测试文件仍在重复调用；两处 `modelProvider.ts` fixtures 定义了同名工厂函数但能力不同，导致维护分裂；多个 helper 函数和转发模块从未被使用。

## What Changes

- **删除 67 处冗余的 `vi.clearAllMocks()` 调用**：涵盖 60+ 个测试文件中的 `beforeEach`/`afterEach` 重复清理逻辑，全局 `setup.ts:317` 已保证每次测试后自动清理
- **合并双重 `modelProvider.ts` fixtures**：将 `src/__test__/fixtures/modelProvider.ts`（含 Zod 校验和 API 响应工厂）的能力整合到 `src/__test__/helpers/fixtures/modelProvider.ts`，更新所有 5 个消费方的导入路径，删除顶层 fixtures 文件
- **删除零消费者的未使用 helper 函数**：`createMockChatWithMessages`（testing-utils.tsx:39）、`verifyMockCalls`（assertions/mock.ts:17）、`verifyMockCalledWith`（assertions/mock.ts:26）均无任何消费方
- **删除无附加值的 `mocks/redux.ts` 转发文件**：该文件仅转发 `testState.ts` 的 `createModelSliceState`，无直接消费方，通过 barrel `mocks/index.ts` 导出的同样内容可改为直接从 `testState.ts` 重导出

## Capabilities

### New Capabilities
- `test-dead-code-removal`: 定义测试代码中死代码的识别和清理规范，确保删除操作不影响测试覆盖率

### Modified Capabilities

## Impact

- **受影响文件**：约 70 个测试文件（删除冗余清理调用）和 5 个 helper 文件（合并/删除）
- **风险**：低。所有变更都是纯删除或导入路径更新，不改变任何测试逻辑
- **验证方式**：执行 `pnpm test` 确认 1785 个测试全部通过，无回归
