## Why

在完成 P0 级 Hook 变异测试（hooks-mutation-tier1）后，继续提升 Hooks 模块的变异测试覆盖率。P1 级 3 个 Hook（`useCreateChat`、`useDebounce`、`useScrollContainer`）逻辑复杂度中等，但包含定时器管理、多步 dispatch 顺序保证、事件绑定/解绑等变异敏感点，值得通过变异测试验证测试质量。

## What Changes

- 将 3 个 P1 级 Hook 源文件添加到 `stryker.config.json` 的 `mutate` 列表
- 根据变异存活报告补充测试用例
- 确保所有 3 个 Hook 的变异测试得分达到项目阈值（high: 80%）

## Capabilities

### New Capabilities

- `hooks-mutation-tier2-coverage`: P1 级 Hook（useCreateChat、useDebounce、useScrollContainer）的变异测试覆盖要求

### Modified Capabilities

无。本次变更仅涉及测试代码，不修改任何源代码行为。

## Impact

- **测试文件**: 3 个对应的测试文件可能需要补充测试用例
- **配置文件**: `stryker.config.json` 的 `mutate` 列表将扩展
- **无运行时影响**: 不涉及任何生产代码变更
