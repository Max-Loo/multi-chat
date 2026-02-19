# mock-strategy-configuration Spec

## Purpose

提供 Mock 配置管理系统，定义全局默认 Mock 策略、按测试套件覆盖策略、Mock 生命周期管理（创建、重置、清理），确保 Mock 配置的集中管理和一致性。

## ADDED Requirements

### Requirement: 全局 Mock 配置入口

系统 SHALL 提供 `setupGlobalMocks()` 函数，在 `setup.ts` 中调用，用于初始化全局默认 Mock 配置。

#### Scenario: 初始化全局 Mock

- **WHEN** 在 `setup.ts` 中调用 `setupGlobalMocks()`
- **THEN** 系统自动配置默认的 Tauri API Mock
- **AND** 系统不阻塞后续测试执行

#### Scenario: 全局 Mock 配置持久化

- **WHEN** 多个测试文件执行
- **THEN** 系统保持全局 Mock 配置的一致性

---

### Requirement: 默认 Mock 策略定义

系统 SHALL 定义明确的默认 Mock 策略，指定哪些模块默认 Mock，哪些按需 Mock。

#### Scenario: 默认 Mock 策略

- **WHEN** 测试未显式配置 Mock
- **THEN** 系统对 `shell`、`os`、`http`、`store` 模块使用默认 Mock
- **AND** 系统对 `keyring` 模块保持真实实现（除非显式 Mock）

---

### Requirement: 测试套件级别覆盖

系统 SHALL 支持在 `describe` 块级别覆盖全局 Mock 配置。

#### Scenario: 覆盖全局 Mock

- **WHEN** 在 `beforeEach` 中调用 `createTauriMocks({ isTauri: false })`
- **THEN** 该测试套件内使用覆盖后的配置
- **AND** 不影响其他测试套件

---

### Requirement: 单个测试级别覆盖

系统 SHALL 支持在单个 `it` 块级别覆盖 Mock 配置。

#### Scenario: 单测试覆盖

- **WHEN** 在单个测试中调用 `mockGetPassword.mockResolvedValue('custom')`
- **THEN** 仅该测试使用覆盖后的返回值
- **AND** 后续测试恢复默认配置

---

### Requirement: Mock 配置优先级

系统 SHALL 按以下优先级应用 Mock 配置：单测试覆盖 > 测试套件覆盖 > 全局默认。

#### Scenario: 配置优先级验证

- **WHEN** 全局配置 `isTauri: true`，测试套件配置 `isTauri: false`，单测试配置 `isTauri: true`
- **THEN** 系统在单测试中使用 `isTauri: true`
- **AND** 系统在测试套件其他测试中使用 `isTauri: false`

---

### Requirement: Mock 生命周期钩子

系统 SHALL 提供标准的生命周期钩子函数，用于在测试前后执行 Mock 操作。

#### Scenario: beforeEach 钩子

- **WHEN** 在 `beforeEach` 中配置 Mock
- **THEN** 系统在每个测试执行前重置 Mock 状态

#### Scenario: afterEach 钩子

- **WHEN** 在 `afterEach` 中调用 `resetAllMocks()`
- **THEN** 系统在每个测试执行后清理 Mock 调用记录

---

### Requirement: 配置文档和类型提示

系统 SHALL 为所有 Mock 配置选项提供 TypeScript 类型定义和 JSDoc 文档。

#### Scenario: TypeScript 类型支持

- **WHEN** 开发者在 IDE 中使用 Mock 工厂函数
- **THEN** 系统提供完整的类型提示和参数说明

#### Scenario: 配置错误提示

- **WHEN** 开发者传入无效的配置选项
- **THEN** 系统 TypeScript 编译时报错
