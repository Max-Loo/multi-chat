# Proposal

## Why

测试套件经多轮变异测试补测与功能迭代累积，已达 178 个文件、约 48,000 行，其中存在大量可识别的冗余：同构 mock 样板在数十个文件中逐份复制、`chatSlices.test.ts` 单文件 3,189 行中约 40+ 个用例彼此重复、helpers 层存在约 320 行零引用死代码。冗余抬高维护成本、拖慢定位用例的速度，也让后续新增测试更容易复制旧样板。现在精简正当其时：基线全绿（单元 169 文件 2,391 用例通过），精简可在「测试全通过、覆盖率不降级」的硬约束下安全推进。

## What Changes

- **删除 helpers 层死代码**（约 320 行）：`helpers/mocks/matchMedia.ts` 整文件（0 引用）、`helpers/mocks/router.ts` 中零引用的 react-router mock 工厂（约 110 行）、`testState.ts` 的 `createRunningChatEntry`、仅被自测引用的导出、`helpers/integration/clearIndexedDB.ts` 壳文件等。
- **消除 AI SDK mock 本地重写**：先扩展 `helpers/mocks/aiSdk.ts`（新增 `createMockAISDKMetadata(overrides?)` 工厂——共享层当前无此导出，且两文件本地版本互不相同；为 `createMockStreamResult` 增加 metadata 注入参数），随后 `streamProcessor.integration.test.ts` 与 `index.integration.test.ts` 删除本地 `createMockStreamResult`/`createMockAISDKMetadata`，改用共享导出，各文件原默认值经 overrides 表达、流式断言不变。
- **统一本地 store 工厂**：16 处测试文件内联的 `createStore`/`createTestStore` 替换为共享 `createTypeSafeTestStore` + slice state 工厂组合。
- **mock 样板全局提升**：`react-i18next` 纯默认 mock（19 个文件）提升到 `setup/mocks.ts`；`useNavigateToPage`、`sonner` 等同构模板收敛为共享工厂；与全局 setup 重复的逐文件 `vi.clearAllMocks()` / `localStorage.clear()` 样板清理。
- **重构超大文件**：`chatSlices.test.ts` 按 thunk 归并 18 组分散的 sendMessage describe、删除三重覆盖的重复用例、提取 `seedChatWithModel` 等公共 setup helper、参数化 `createTestStore(appConfigOverrides)`。
- **同构用例参数化**：`resourceLoader.test.ts` 17 连发 `isNetworkError`、`crypto.test.ts` 12 个往返加密用例、`keyringMigration.test.ts` V1/V2 派生参数 6 用例等，改写为 `it.each`/`test.each`（估算 10 个大文件合计 -400~500 行）。
- **删除完全重复的用例**：`ChatButton.test.tsx` 3 组逐字重复 it、`chatSlices.test.ts` 同分支 2-4 重覆盖用例、`modelRemoteService.test.ts` 重复的 404/5xx 断言等。
- **fakeTimers 样板收敛**：`modelRemoteService.test.ts` 24 处手动 `vi.useFakeTimers()` 开关上提到 describe 级 beforeEach。
- 修复 `openspec/specs/test-parameterization/spec.md` 缺失 Purpose 段落的格式问题（`openspec show` 报错）。
- **修正被精简牵连的主 specs**：删除 `useIsolatedTest`/`setTestEnv`/`verifyIsolation`/`createRunningChatEntry`/`createMockMatchMedia`、移除 `__createI18nMockReturn` 注册、setup 三层扩为四层（新增 `setup/i18n.ts`）等改动，使 5 个既有 capability 的 requirements 与实现矛盾——补充 REMOVED/MODIFIED delta，归档 sync 时一并修正主 specs。

## Capabilities

### New Capabilities

- `test-suite-slimming`: 测试套件精简规范——死代码删除、mock 样板收敛、同构用例参数化、重复用例去重的执行约束，以及「测试全通过、覆盖率不降级」的验收底线。

### Modified Capabilities

- `test-environment-isolation`: REMOVED「隔离钩子函数」「环境变量隔离」「隔离验证工具」——对应导出零运行时消费者，已按死代码删除（任务 2.3）。
- `test-store-consolidation`: REMOVED「createRunningChatEntry 辅助函数」（零引用被删）与「RunningChatBubble 使用已有状态工厂」（约束目标文件在本变更前已不存在）。
- `unified-mock-helpers`: REMOVED「共享 mockMatchMedia 辅助函数」——`helpers/mocks/matchMedia.ts` 整文件零引用被删（任务 2.1）。
- `i18n-mock-unification`: MODIFIED 2 项 requirement——统一模式由 `globalThis.__createI18nMockReturn` 更新为「全局默认 mock + `globalThis.__mockI18n` 自定义键覆盖 + `vi.unmock` 例外」。
- `test-setup-layers`: MODIFIED 3 项 requirement——setup 由三层扩为四层（新增 `setup/i18n.ts`）、globalThis 工厂注册清单 9 → 12（移除 `__createI18nMockReturn`，新增 highlight/navigateToPage/sonner/virtua）。

（死代码删除与 mock 工厂统一本身仍是执行 `test-dead-code-removal`、`shared-mock-factories` 既有要求；上述 delta 仅消除本变更直接造成的 spec 与实现矛盾。）

## Impact

- **测试代码**（`src/__test__/` 全目录）：实施实测净精简 1,327 行（约 2.8%，72 个测试文件与 helpers/setup 层；调研期估算 2,500-3,200 行基于过时快照——部分冗余已在此前迭代清理，详见 design 风险条目）。
- **测试配置**：`src/__test__/setup/mocks.ts` 新增 `react-i18next` 全局 mock；`vite.config.ts` 覆盖率 reporter 数组追加 `"json-summary"`（当前仅有 `json`，只产出逐文件 `coverage-final.json` 明细，不含模块汇总；追加后才有 `coverage-summary.json` 供基线存档），覆盖率阈值不变（作为不降级的对照基线）。
- **文档**：`src/__test__/README.md` 更新 mock 工厂使用说明（matchMedia 删除、i18n 全局 mock、store 工厂统一）。
- **主 specs**：5 个既有 capability 的 REMOVED/MODIFIED delta（全部位于变更目录 `specs/` 下），归档 sync 时应用到 `openspec/specs/`，内容修正不在实施期间直改主 specs；例外：三份结构损坏的主 spec（test-store-consolidation、unified-mock-helpers、i18n-mock-unification，历史遗留 delta 头使 requirements 对解析器不可见）做了仅限结构的修复（补标题/Purpose/`## Requirements` 节头，内容零改动），否则 archive 拒绝应用 delta。
- **不涉及产品代码**（`src/` 除 `__test__` 外零改动）；集成测试配置与 Stryker 变异测试配置不动。
- **风险控制**：分批提交（死代码 → mock 收敛 → 参数化 → 大文件重构），每批跑 `pnpm test:run && pnpm test:integration:run` 验证；覆盖率以 `pnpm test:coverage` 对比基线，分模块阈值（见 `coverage-threshold-policy`）不放松。
