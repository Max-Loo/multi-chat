## MODIFIED Requirements

### Requirement: 清理层内容

`setup/cleanup.ts` SHALL 包含以下内容：

- `setupCustomAssertions()` 调用
- `afterEach` 钩子：执行 `cleanup()`、`vi.clearAllMocks()` 和 `vi.restoreAllMocks()`
- unhandled rejection 抑制逻辑（window 和 process 两个环境共用同一 `EXPECTED_ERROR_PATTERNS` 常量）

`EXPECTED_ERROR_PATTERNS` SHALL 定义为模块顶层常量，包含以下错误模式字符串数组：
- `'Network error'`
- `'Request timeout'`
- `'API Error'`
- `'Invalid JSON response'`
- `'Connection refused'`
- `'Failed to fetch'`

#### Scenario: afterEach 自动清理 Mock 和 DOM

- **WHEN** 任意测试用例执行完毕
- **THEN** `cleanup()` SHALL 被调用以清理 @testing-library 渲染的 DOM
- **THEN** `vi.clearAllMocks()` SHALL 被调用以清除所有 mock 的调用历史
- **THEN** `vi.restoreAllMocks()` SHALL 被调用以重置所有 mock 实现并恢复原始实现

#### Scenario: restoreAllMocks 隔离测试间 mock 实现

- **WHEN** 测试 A 通过 `mockReturnValue()` 修改了某 mock 的实现
- **WHEN** 测试 A 执行完毕触发 afterEach
- **THEN** 该 mock 的实现 SHALL 被恢复到 `afterEach` 之前的状态
- **THEN** 后续测试 B SHALL NOT 继承测试 A 设置的 mock 实现

#### Scenario: 错误模式常量消除重复

- **WHEN** `cleanup.ts` 被加载
- **THEN** `EXPECTED_ERROR_PATTERNS` SHALL 只定义一次
- **THEN** window 和 process 两个环境的抑制逻辑 SHALL 引用同一常量

#### Scenario: 集成测试获得自动清理能力

- **WHEN** 集成测试环境加载 cleanup.ts
- **THEN** 渲染 React 组件的集成测试 SHALL 在每个用例后自动清理 DOM
- **THEN** 所有 mock 状态 SHALL 在测试间自动恢复到原始实现
