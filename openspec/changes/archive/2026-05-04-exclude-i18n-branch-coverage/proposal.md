## Why

覆盖率分支数据被 React Compiler 的 JSX 变换系统性拖低。`babel-plugin-react-compiler` 在 Babel 转换阶段将 JSX 展开为带条件判断的 memoization 代码，产生约 1855 个额外分支（占总量 57%）。这些分支是编译产物，不属于应用逻辑，但两个覆盖率提供者（V8 和 Istanbul）均报告相同的分支数。

## What Changes

- 将 Vitest 覆盖率提供者从 V8 切换为 Istanbul（Statement 覆盖率更准确）
- 移除 `@vitest/coverage-v8` 依赖
- 基于实际数据调整覆盖率阈值

## Capabilities

### Modified Capabilities
- `i18n-branch-exclusion`: 采用 Istanbul 覆盖率提供者，提供更准确的 Statement 覆盖率
- `coverage-threshold-policy`: 阈值基于 Istanbul 实际数据调整

## Impact

- 影响文件：`vite.config.ts`（覆盖率配置）、`package.json`（依赖）
- 影响范围：`pnpm test:coverage` 命令使用 Istanbul provider
- CI 影响：覆盖率阈值检查将基于更准确的基线
- 不影响任何运行时行为或测试逻辑
