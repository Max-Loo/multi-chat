# Spec: 测试隔离和 Mock 策略指南

## Purpose

定义测试隔离和 Mock 的最佳实践，确保测试关注系统边界而非内部实现，提高测试的可靠性和真实性。

## Requirements

### Requirement: 仅 Mock 系统边界

系统 SHALL 仅在测试系统边界时使用 Mock，禁止 Mock 内部实现。

**系统边界定义**：
- 网络 API 调用（fetch、axios、XMLHttpRequest）
- 文件系统 I/O（fs、IndexedDB、localStorage）
- 第三方服务（Stripe、OpenAI API、支付网关）
- 时间相关（Date、setTimeout、setInterval）- 仅在必要时
- 随机数生成（Math.random）
- 浏览器 API（Geolocation、MediaDevices）

**内部实现（禁止 Mock）**：
- React 组件（子组件、Hooks）
- Redux store/selectors/actions
- 工具函数和辅助函数
- 内部模块和依赖

#### Scenario: 组件测试不 Mock 子组件
- **WHEN** 编写组件测试时
- **THEN** 测试 SHALL NOT Mock 子组件
- **AND** 测试 SHALL 渲染完整组件树
- **示例**: `ChatPage` 测试 SHALL NOT Mock `ChatButton`、`ChatBubble` 等

#### Scenario: 服务层测试 Mock API 调用
- **WHEN** 编写服务层测试时
- **THEN** 测试 SHALL Mock 网络 API 调用
- **AND** 测试 SHALL NOT Mock 内部工具函数
- **示例**: `chatService` 测试 SHALL Mock `streamText`，但 NOT Mock 消息转换函数

#### Scenario: Hooks 测试不 Mock 内部函数
- **WHEN** 编写 Hooks 测试时
- **THEN** 测试 SHALL NOT 测试内部函数调用
- **AND** 测试 SHALL 验证 Hook 行为结果
- **示例**: `useDebounce` 测试 SHALL NOT 验证 `clearTimeout` 调用次数

### Requirement: 使用真实实现进行集成测试

系统 SHALL 优先使用真实实现进行集成测试，仅在必要时 Mock 外部依赖。

**集成测试原则**：
- 保持内部模块真实（Redux、存储层、组件）
- 仅 Mock 外部服务（API、第三方依赖）
- 测试完整用户流程

#### Scenario: 集成测试使用真实 Redux store
- **WHEN** 编写集成测试时
- **THEN** 测试 SHALL 使用真实 Redux store
- **AND** 测试 SHALL NOT Mock Redux actions/reducers

#### Scenario: 集成测试使用真实存储层
- **WHEN** 编写集成测试时
- **THEN** 测试 SHALL 使用真实存储层（IndexedDB）
- **AND** 测试 SHALL 仅 Mock 远程 API 调用

#### Scenario: 集成测试使用 MSW Mock API
- **WHEN** 集成测试需要 Mock API 时
- **THEN** 测试 SHALL 使用 MSW（Mock Service Worker）
- **AND** 测试 SHALL NOT 直接 Mock fetch 函数

### Requirement: 第三方组件库 Mock 策略

系统 SHALL 对第三方组件库采用谨慎的 Mock 策略，优先测试真实行为。

**Mock 条件**（满足任一即可 Mock）：
- 组件渲染耗时（如复杂的可视化组件）
- 组件需要特殊环境（如 WebAssembly）
- 组件行为不稳定（如 beta 版本）

**默认策略**：
- 优先测试完整行为（不 Mock）
- 使用 `data-testid` 标记关键元素

#### Scenario: 第三方组件优先不 Mock
- **WHEN** 使用第三方组件库时
- **THEN** 测试 SHALL 优先渲染真实组件
- **AND** 测试 SHALL 通过 `data-testid` 验证关键元素

#### Scenario: 第三方组件 Mock 仅在必要时
- **WHEN** 第三方组件满足 Mock 条件时
- **THEN** 测试 CAN Mock 组件
- **AND** 测试 SHALL 在注释中说明 Mock 原因
- **示例**: `// Mock Chart.js due to performance issues in test environment`

### Requirement: Mock 实现必须与真实接口一致

系统 SHALL 确保 Mock 实现（如使用）与真实接口保持一致，避免测试通过但生产失败。

**一致性检查**：
- Mock 函数签名与真实函数一致
- Mock 返回值结构与真实返回值一致
- Mock 错误行为与真实错误行为一致

#### Scenario: Mock 函数签名一致
- **WHEN** 创建 Mock 函数时
- **THEN** Mock 函数签名 SHALL 与真实函数一致
- **AND** 测试 SHALL 使用 TypeScript 类型检查确保一致性

#### Scenario: Mock 返回值结构一致
- **WHEN** Mock API 响应时
- **THEN** Mock 返回值结构 SHALL 与真实 API 响应一致
- **AND** 测试 SHALL 验证关键字段存在

### Requirement: 时间相关 Mock 策略

系统 SHALL 对时间相关功能采用谨慎的 Mock 策略，优先使用 Vitest 的 Fake Timers。

**Mock 原则**：
- 优先使用 `vi.useFakeTimers()` 和 `vi.advanceTimersByTime()`
- 避免直接 Mock `Date.now()` 或 `setTimeout`
- 测试后恢复真实定时器

#### Scenario: 使用 Fake Timers 测试定时器
- **WHEN** 测试定时器相关功能时
- **THEN** 测试 SHALL 使用 `vi.useFakeTimers()`
- **AND** 测试 SHALL 使用 `vi.advanceTimersByTime()` 推进时间
- **AND** 测试 SHALL 在 afterEach 中恢复 `vi.restoreAllMocks()`

#### Scenario: 避免直接 Mock 时间函数
- **WHEN** 测试需要控制时间时
- **THEN** 测试 SHALL NOT 直接 Mock `Date.now()`
- **AND** 测试 SHALL 使用 Vitest 的 Fake Timers API

### Requirement: Mock 必须有清晰的理由

系统 SHALL 要求所有 Mock 在代码注释中说明理由，便于审查和维护。

**注释格式**：
```typescript
// Mock <what> because <reason>
vi.mock('...', () => ({ ... }));
```

#### Scenario: Mock 必须有注释说明
- **WHEN** 使用 Mock 时
- **THEN** 代码 SHALL 包含注释说明 Mock 理由
- **示例**: `// Mock fetch because network requests are not allowed in tests`

#### Scenario: Mock 理由必须充分
- **WHEN** 审查 Mock 时
- **THEN** Mock 理由 SHALL 符合系统边界定义
- **AND** Mock 理由 SHALL NOT 是"测试更容易"
