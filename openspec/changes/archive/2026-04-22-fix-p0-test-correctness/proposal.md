## Why

测试系统中存在 3 个 P0 级正确性问题：两个测试始终通过但未验证任何行为（提供零信心），全局配置 `dangerouslyIgnoreUnhandledErrors` 静默吞掉所有未处理的 Promise rejection（掩盖真实 bug），以及集成测试中存在重复的 mock 定义（死代码）。这些问题导致测试套件无法有效捕获回归，必须立即修复。

## What Changes

- 修复 `ChatPanelSender.test.tsx` 中 2 个误判通过的测试：停止按钮测试需验证 abort 行为，compositionEnd 时间戳测试需验证时间戳记录或删除
- 移除 `vite.config.ts` 中的 `dangerouslyIgnoreUnhandledErrors: true`，改为在具体测试中显式处理预期的 rejection
- 删除 `app-loading.integration.test.ts` 中重复的 `vi.mock()` 块（行 39-48）

## Capabilities

### New Capabilities
- `test-assertion-correctness`: 修复误判通过的测试断言，确保测试验证实际行为而非组件存在性

### Modified Capabilities

（无现有 spec 需要修改——均为测试代码层面的修复）

## Impact

- **测试文件**: `ChatPanelSender.test.tsx`（2 个测试用例重写或删除）
- **测试配置**: `vite.config.ts`（移除 1 行配置，可能需处理暴露的 unhandled rejection）
- **集成测试**: `app-loading.integration.test.ts`（删除 10 行重复代码）
- **风险**: 移除 `dangerouslyIgnoreUnhandledErrors` 后可能暴露已有但被掩盖的测试失败，需逐一排查
