# Proposal

## Why

测试套件经多轮变异测试补测与功能迭代累积，已达 178 个文件、约 48,000 行，其中存在大量可识别的冗余：同构 mock 样板在数十个文件中逐份复制、`chatSlices.test.ts` 单文件 3,189 行中约 40+ 个用例彼此重复、helpers 层存在约 320 行零引用死代码。冗余抬高维护成本、拖慢定位用例的速度，也让后续新增测试更容易复制旧样板。现在精简正当其时：基线全绿（单元 169 文件 2,391 用例通过），精简可在「测试全通过、覆盖率不降级」的硬约束下安全推进。

## What Changes

- **删除 helpers 层死代码**（约 320 行）：`helpers/mocks/matchMedia.ts` 整文件（0 引用）、`helpers/mocks/router.ts` 中零引用的 react-router mock 工厂（约 110 行）、`testState.ts` 的 `createRunningChatEntry`、仅被自测引用的导出、`helpers/integration/clearIndexedDB.ts` 壳文件等。
- **消除 AI SDK mock 本地重写**：`streamProcessor.integration.test.ts` 与 `index.integration.test.ts` 删除本地 `createMockStreamResult`/`createMockAISDKMetadata`，改用 `helpers/mocks/aiSdk.ts` 既有导出。
- **统一本地 store 工厂**：16 处测试文件内联的 `createStore`/`createTestStore` 替换为共享 `createTypeSafeTestStore` + slice state 工厂组合。
- **mock 样板全局提升**：`react-i18next` 纯默认 mock（19 个文件）提升到 `setup/mocks.ts`；`useNavigateToPage`、`sonner` 等同构模板收敛为共享工厂；与全局 setup 重复的逐文件 `vi.clearAllMocks()` / `localStorage.clear()` 样板清理。
- **重构超大文件**：`chatSlices.test.ts` 按 thunk 归并 18 组分散的 sendMessage describe、删除三重覆盖的重复用例、提取 `seedChatWithModel` 等公共 setup helper、参数化 `createTestStore(appConfigOverrides)`。
- **同构用例参数化**：`resourceLoader.test.ts` 17 连发 `isNetworkError`、`crypto.test.ts` 12 个往返加密用例、`keyringMigration.test.ts` V1/V2 派生参数 6 用例等，改写为 `it.each`/`test.each`（估算 10 个大文件合计 -400~500 行）。
- **删除完全重复的用例**：`ChatButton.test.tsx` 3 组逐字重复 it、`chatSlices.test.ts` 同分支 2-4 重覆盖用例、`modelRemoteService.test.ts` 重复的 404/5xx 断言等。
- **fakeTimers 样板收敛**：`modelRemoteService.test.ts` 24 处手动 `vi.useFakeTimers()` 开关上提到 describe 级 beforeEach。
- 修复 `openspec/specs/test-parameterization/spec.md` 缺失 Purpose 段落的格式问题（`openspec show` 报错）。

## Capabilities

### New Capabilities

- `test-suite-slimming`: 测试套件精简规范——死代码删除、mock 样板收敛、同构用例参数化、重复用例去重的执行约束，以及「测试全通过、覆盖率不降级」的验收底线。

### Modified Capabilities

（无。本次变更不修改任何既有 capability 的 requirements：死代码删除是执行 `test-dead-code-removal` 既有要求，mock 工厂统一是执行 `shared-mock-factories` 既有要求，本提案仅新增精简过程中产生的新约束。）

## Impact

- **测试代码**（`src/__test__/` 全目录）：预计净精简 2,500-3,200 行（约 5-6.5%），涉及约 80 个测试文件与 helpers/setup 层。
- **测试配置**：`src/__test__/setup/mocks.ts` 新增 `react-i18next` 全局 mock；`vite.config.ts` 覆盖率阈值不变（作为不降级的对照基线）。
- **文档**：`src/__test__/README.md` 更新 mock 工厂使用说明（matchMedia 删除、i18n 全局 mock、store 工厂统一）。
- **不涉及产品代码**（`src/` 除 `__test__` 外零改动）；集成测试配置与 Stryker 变异测试配置不动。
- **风险控制**：分批提交（死代码 → mock 收敛 → 参数化 → 大文件重构），每批跑 `pnpm test:run && pnpm test:integration:run` 验证；覆盖率以 `pnpm test:coverage` 对比基线，分模块阈值（见 `coverage-threshold-policy`）不放松。
