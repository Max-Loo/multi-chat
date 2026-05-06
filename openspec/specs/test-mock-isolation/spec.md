## Purpose

确保集成测试中 mock 状态在每个测试用例之间完全隔离，避免测试间状态泄漏。

## Requirements

### Requirement: afterEach 必须恢复所有 mock

集成测试的 `afterEach` 钩子 MUST 同时调用 `vi.clearAllMocks()` 和 `vi.restoreAllMocks()`，确保 mock 实现和调用记录在每个测试后被完全重置。

#### Scenario: restoreAllMocks 恢复被误删

- **WHEN** `model-config.integration.test.ts` 的 `afterEach` 执行
- **THEN** MUST 调用 `vi.restoreAllMocks()`，恢复所有被 `vi.spyOn` 或 `vi.fn` 覆盖的实现

### Requirement: ToastQueue 必须提供测试用 reset 方法

`ToastQueue` 类 MUST 提供 `reset()` 公开方法，清空内部队列状态（待处理 toast 列表、计数器等），供测试在 `beforeEach` 或 `afterEach` 中调用。

#### Scenario: reset 清空单例状态

- **WHEN** 在测试中调用 `toastQueue.reset()`
- **THEN** ToastQueue 的内部状态 MUST 恢复到初始空状态，后续测试不受前一个测试的 toast 队列影响

### Requirement: 测试末尾不得出现冗余的 mock 重置

测试用例体内 MUST NOT 包含与 `beforeEach` 重复的 mock 设置调用。

#### Scenario: 删除测试末尾多余的 setupDefaultStreamMock

- **WHEN** `model-config.integration.test.ts` 中"应该处理无效的 API Key"测试执行
- **THEN** 测试末尾 MUST NOT 调用 `setupDefaultStreamMock()`，该调用已由 `beforeEach` 覆盖
