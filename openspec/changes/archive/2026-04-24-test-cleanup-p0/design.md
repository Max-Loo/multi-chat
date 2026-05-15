## Context

当前测试代码库包含 150 个测试文件、1785 个测试用例，全部通过。全局 setup 文件（`src/__test__/setup.ts:317`）已在 `afterEach` 中统一调用 `vi.clearAllMocks()` + `cleanup()`。然而，约 67 个测试文件仍在各自的 `beforeEach`/`afterEach` 中重复调用，产生不必要的代码噪声。

此外，fixtures 和 helpers 目录存在功能重叠和死代码，增加维护成本。

## Goals / Non-Goals

**Goals:**
- 删除所有冗余的 `vi.clearAllMocks()` 调用，使测试清理逻辑集中在全局 setup
- 合并两处 `modelProvider.ts` fixtures 为单一权威来源
- 删除已确认无消费方的 helper 函数和转发模块
- 保持全部 1785 个测试通过，零回归

**Non-Goals:**
- 不重构测试逻辑或断言方式
- 不统一 `test()` vs `it()` 命名（属于 P2 优先级）
- 不处理加密测试文件的重叠问题（属于 P1 优先级）
- 不新增测试覆盖

## Decisions

### 1. 冗余清理调用 — 直接删除

全局 `setup.ts` 的 `afterEach` 在 Vitest 的清理链中先于文件级 `afterEach` 执行，且 `vi.clearAllMocks()` 是幂等操作。因此文件级的重复调用可以安全删除，不会影响测试隔离性。

对 67 个文件逐一检查：若 `beforeEach`/`afterEach` 中仅有 `vi.clearAllMocks()` 一条语句，则整个钩子块一并删除；若包含其他逻辑（如 `vi.useFakeTimers()`），则仅移除 `vi.clearAllMocks()` 那一行。

### 2. Fixtures 合并策略 — 向 helpers/fixtures 收敛

将 `src/__test__/fixtures/modelProvider.ts` 中的 API 响应工厂（`createDeepSeekApiResponse`、`createKimiApiResponse`、`createOpenAIApiResponse`、`createMockApiResponse`）及其 Zod 校验逻辑迁移到 `src/__test__/helpers/fixtures/modelProvider.ts`。**不将 Zod 校验引入已有的 RemoteProviderData 工厂函数**（`createMockRemoteProvider`、`createDeepSeekProvider` 等），因为现有消费方 `ProviderCardDetails.test.tsx:201` 使用 `createMockRemoteProvider({ models: [] })` 测试空状态 UI，Zod 的 `.min(1)` 约束会导致该测试崩溃。

然后更新 2 个消费方（`modelRemoteService.test.ts`、`modelProviderSlice.test.ts`）的导入路径。完成后删除 `src/__test__/fixtures/modelProvider.ts`（该目录下仍有 `chat.ts`、`router.ts` 等活跃文件，不删除目录）。

### 3. 死代码删除 — 批量清理

按以下清单删除：
- `testing-utils.tsx` 中的 `createMockChatWithMessages` 函数（39-71 行）
- `assertions/mock.ts` 中的 `verifyMockCalls`（17-25 行）和 `verifyMockCalledWith`（26-44 行）
- `mocks/redux.ts` 整个文件，将 `mocks/index.ts` 中 `export * from './redux'` 改为直接从 `./testState` 重导出 `createModelSliceState`

## Risks / Trade-offs

- **低风险**：所有变更均为删除或导入路径更新，不涉及逻辑修改
- **回归验证**：每次变更批次后执行 `pnpm test` 确认全部通过
- **合并冲突**：大量文件同时修改可能与并行开发分支产生冲突，建议在独立分支上完成
