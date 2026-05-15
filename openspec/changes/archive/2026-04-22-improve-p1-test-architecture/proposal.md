## Why

测试架构存在 3 个高优先级问题：`resetStore.ts` 中的无效 RESET action（无任何 reducer 处理）、11 个 Redux 纯逻辑测试被错误地放在集成测试中（其中 7 个与已有 slice 单元测试重复，仅 4 个需要迁移）、以及单元测试被限制为单线程执行（113 个文件串行运行，浪费多核性能）。这些问题影响测试正确性和执行效率。

## What Changes

- 移除 `src/__test__/helpers/integration/resetStore.ts` 中无效的 `dispatch({ type: 'RESET' })` 调用
- 从 `drawer-state.integration.test.tsx` 中删除 11 个 TODO 标记的 Redux 纯逻辑测试（其中 7 个是已有 slice 测试的重复，直接删除；4 个 chatPage 新测试迁移到 `chatPageSlices.test.ts`）
- 将 `vite.config.ts` 中的 `maxThreads` 从 1 增加到 2，验证多线程测试稳定性

## Capabilities

### New Capabilities

（无新能力——架构改进）

### Modified Capabilities

（无现有 spec 需要修改）

## Impact

- **修改文件**: `resetStore.ts`（移除 1 行）、`drawer-state.integration.test.tsx`（删除 11 个测试）、`chatPageSlices.test.ts`（新增 4 个测试）、`vite.config.ts`（修改 1 个配置值）
- **风险**: 中——多线程配置可能暴露并发 mock 问题；Redux 测试迁移需确认 slice 文件结构
