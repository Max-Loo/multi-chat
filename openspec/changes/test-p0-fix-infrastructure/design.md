## Context

测试基础设施存在 3 个严重 bug，导致测试结果不可靠：
- `testServer.ts` 中 DeepSeek 的 3 个 POST handler 注册冲突
- 2 个中间件测试文件共 51 处 `setTimeout(resolve, 0)` 时序不可靠
- `crypto-storage.integration.test.ts` 中 `isEncrypted` 测试实际未调用该函数

当前正确范例已存在于代码库中：`modelMiddleware.test.ts` 使用 `vi.waitFor`，其他 handler 文件无冲突。

## Goals / Non-Goals

**Goals:**
- 修复 testServer.ts handler 冲突，使流式和错误场景可被正确触发
- 消除中间件测试中的时序不可靠性
- 修复 isEncrypted 测试空洞

**Non-Goals:**
- 不重构整个 MSW handler 体系
- 不修改被测代码（仅修改测试代码）
- 不添加新的测试用例

## Decisions

### 决策 1：testServer.ts handler 合并策略

**选择**：合并 JSON + 流式 handler，删除 401 死代码

将第 30 行（无条件 JSON）和第 52 行（流式 SSE）合并为 1 个 handler，通过 `body.stream` 条件判断返回不同响应。删除第 115 行的无条件 401 handler。

- `body.stream === true` → 返回 SSE 流式响应
- 默认 → 返回 JSON 响应

第 115 行是设计失误：无条件 401 放在默认 handler 集中，若可达会使所有 DeepSeek 请求失败。错误场景已由 `setupErrorHandlers` 按需覆盖，无需在默认 handler 中添加错误分支。

**替代方案**：合并 3 个 handler 并添加错误条件分支（如 `body.error === true`）→ 被否决，因为会引入未使用的代码路径，且与 `setupErrorHandlers` 职责重叠。

**理由**：仅合并两个有意义的 handler，删除死代码，改动最小且职责清晰。

### 决策 2：setTimeout → vi.waitFor 迁移策略

**选择**：机械替换，保持测试逻辑不变

将所有 `await new Promise(resolve => setTimeout(resolve, N))` 后紧跟 `expect(...)` 的模式，替换为 `await vi.waitFor(() => { expect(...) })`。

**理由**：`modelMiddleware.test.ts` 已验证此模式可行。`vi.waitFor` 自动重试直到断言通过或超时，消除时序依赖。

### 决策 3：isEncrypted 测试修复策略

**选择**：导入 `isEncrypted` 并替换内联 `startsWith`

从 `@/utils/crypto` 导入 `isEncrypted`，将 `value.startsWith('enc:')` 替换为 `isEncrypted(value)`。

**理由**：使测试名与实际行为一致。如果 `isEncrypted` 增加额外逻辑（如格式验证），测试将捕获回归。

## Risks / Trade-offs

- [handler 合并可能遗漏边界条件] → 缓解：合并后逐一验证 success/streaming 两种场景；error 场景由 `setupErrorHandlers` 独立覆盖
- [vi.waitFor 超时时间需调整] → 缓解：使用默认超时（1 秒），远超当前 `setTimeout(resolve, 0)` 的实际等待时间
- [isEncrypted 导入可能不存在于 crypto 模块] → 缓解：实施前验证函数是否存在，如不存在则需创建
