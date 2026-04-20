## Why

测试基础设施存在 3 个会导致间歇性失败或提供虚假安全感的严重 bug：MSW handler 注册冲突导致流式和错误场景永远无法被测试触发；中间件测试中 51 处 `setTimeout(resolve, 0)` 在 CI 环境下时序不可靠；加密集成测试声称验证 `isEncrypted` 函数但实际从未调用它。这些问题导致测试结果不可信，且可能在 CI 中产生 flaky test。

## What Changes

- **修复** `src/__test__/helpers/integration/testServer.ts` —— 将第 30 行（无条件 JSON）和第 52 行（流式 SSE）两个 handler 合并为 1 个带 `body.stream` 条件分支的 handler，删除第 115 行的无条件 401 死代码（错误场景由已有的 `setupErrorHandlers` 覆盖）
- **替换** `src/__test__/store/middleware/appConfigMiddleware.test.ts`（30 处）和 `chatMiddleware.test.ts`（21 处）中的 `new Promise(resolve => setTimeout(resolve, 0))` 为 `vi.waitFor` —— 与同目录下 `modelMiddleware.test.ts` 已使用的正确模式对齐
- **修复** `src/__test__/integration/crypto-storage.integration.test.ts` 第 1015-1055 行和第 1188-1223 行 —— 导入 `isEncrypted` 函数并替换内联的 `value.startsWith('enc:')` 逻辑，使测试名与实际断言一致

## Capabilities

### New Capabilities

（无新增能力）

### Modified Capabilities

- `chat-service-testing`: 修复 testServer.ts handler 冲突，确保流式场景可被正确触发；删除无条件 401 死代码，错误场景由 `setupErrorHandlers` 覆盖
- `app-config-middleware-tests`: 替换 setTimeout 为 vi.waitFor，消除时序不可靠性
- `crypto-integration-tests`: 修复 isEncrypted 测试空洞，确保实际调用被测函数

## Impact

- **修改文件**：4 个（`testServer.ts`、`appConfigMiddleware.test.ts`、`chatMiddleware.test.ts`、`crypto-storage.integration.test.ts`）
- **CI 影响**：消除潜在的 flaky test，提高测试结果可信度
- **Breaking**: 无，仅修改测试代码
