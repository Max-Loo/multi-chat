## Why

当前项目变异测试仅覆盖 18/155 个源文件（11.6%），Hooks 模块全部 16 个文件均未纳入变异测试。其中 6 个 P0 级 Hook（`useConfirm`、`useBasicModelTable`、`useResetDataDialog`、`useAdaptiveScrollbar`、`useAutoResizeTextarea`、`useMediaQuery`）逻辑密度高、边界条件多、已有单元测试基础，是变异测试 ROI 最高的候选。验证这些 Hook 的测试质量，可以在不增加运行时负担的前提下发现潜在缺陷。

## What Changes

- 将 6 个 P0 级 Hook 源文件添加到 `stryker.config.json` 的 `mutate` 列表
- 对现有测试进行变异测试，根据 Stryker 报告补充测试用例以提升变异存活率（mutation score）
- 确保所有 6 个 Hook 的变异测试得分达到项目阈值（high: 80%）

## Capabilities

### New Capabilities

- `hooks-mutation-coverage`: P0 级 Hook（useConfirm、useBasicModelTable、useResetDataDialog、useAdaptiveScrollbar、useAutoResizeTextarea、useMediaQuery）的变异测试覆盖要求

### Modified Capabilities

无。本次变更仅涉及测试代码，不修改任何源代码行为。

## Impact

- **测试文件**: 6 个对应的测试文件可能需要补充测试用例
- **配置文件**: `stryker.config.json` 的 `mutate` 列表将扩展
- **CI/CD**: 变异测试运行时间将增加，但不影响常规单元测试流程
- **无运行时影响**: 不涉及任何生产代码变更
