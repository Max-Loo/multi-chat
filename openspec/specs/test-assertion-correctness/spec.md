## ADDED Requirements

### Requirement: 停止按钮测试必须验证 abort 行为
测试 MUST 在点击停止按钮后验证 `AbortController.abort()` 被调用，而非仅检查按钮存在于 DOM 中。

#### Scenario: 点击停止按钮触发 abort
- **WHEN** 用户点击停止发送按钮
- **THEN** 测试 MUST 断言 `abort()` 方法被调用

#### Scenario: 停止按钮测试不依赖零信心断言
- **WHEN** 检查停止按钮测试的断言
- **THEN** 测试 MUST NOT 仅使用 `expect(element).toBeInTheDocument()` 作为唯一行为验证

### Requirement: compositionEnd 时间戳测试必须有意义
compositionEnd 时间戳测试 MUST 验证与时间戳相关的行为，或被删除。

#### Scenario: compositionEnd 事件测试验证行为
- **WHEN** compositionEnd 事件在 textarea 上触发
- **THEN** 测试 MUST 断言与时间戳或输入法交互相关的具体行为

#### Scenario: compositionEnd 测试不接受无意义断言
- **WHEN** 检查 compositionEnd 测试的断言
- **THEN** 测试 MUST NOT 仅使用 `expect(textarea).toBeInTheDocument()` 作为唯一行为验证

### Requirement: 测试配置必须暴露未处理的 Promise rejection
测试配置 MUST NOT 使用 `dangerouslyIgnoreUnhandledErrors` 全局隐藏未处理的 rejection。

#### Scenario: 移除 dangerouslyIgnoreUnhandledErrors 后 rejection 可见
- **WHEN** 测试中存在未处理的 Promise rejection
- **THEN** Vitest MUST 报告该 rejection，而非静默忽略

#### Scenario: 预期的 rejection 显式处理
- **WHEN** 某个测试有意触发 rejection
- **THEN** 该测试 MUST 使用 `expect(...).rejects` 或等效方式显式声明预期

### Requirement: 不允许重复的 vi.mock 定义
同一模块在同一个测试文件中 MUST NOT 被 `vi.mock()` 重复定义。

#### Scenario: 每个模块只被 mock 一次
- **WHEN** 检查测试文件中的 vi.mock 调用
- **THEN** 每个模块路径 MUST 只出现一次
