# test-environment-isolation Spec

## Purpose

提供测试环境隔离机制，确保每个测试用例独立运行，提供统一的测试前后清理钩子、状态重置工具，防止测试间相互影响。

## ADDED Requirements

### Requirement: 测试状态重置函数

系统 SHALL 提供 `resetTestState()` 函数，用于重置所有测试相关的全局状态。

#### Scenario: 重置 localStorage

- **WHEN** 调用 `resetTestState()`
- **THEN** 系统 `localStorage` 被清空

#### Scenario: 重置 Mock 调用记录

- **WHEN** 调用 `resetTestState()`
- **THEN** 系统所有 `vi.fn()` Mock 的调用记录被清空

#### Scenario: 重置模块缓存

- **WHEN** 调用 `resetTestState({ resetModules: true })`
- **THEN** 系统 Vitest 模块缓存被重置

---

### Requirement: 隔离钩子函数

系统 SHALL 提供 `useIsolatedTest()` 函数，自动配置 `beforeEach` 和 `afterEach` 清理钩子。

#### Scenario: 自动配置清理钩子

- **WHEN** 调用 `useIsolatedTest()`
- **THEN** 系统自动在每个测试前后执行状态重置

#### Scenario: 自定义清理逻辑

- **WHEN** 调用 `useIsolatedTest({ onAfterEach: customCleanup })`
- **THEN** 系统 `afterEach` 执行默认清理后执行 `customCleanup`

---

### Requirement: IndexedDB 隔离

系统 SHALL 为每个测试提供独立的 IndexedDB 实例，防止数据污染。

#### Scenario: 创建独立 IndexedDB

- **WHEN** 测试需要使用 IndexedDB
- **THEN** 系统为该测试创建独立的 `fake-indexeddb` 实例

#### Scenario: 清理 IndexedDB

- **WHEN** 调用 `resetTestState()`
- **THEN** 系统 IndexedDB 数据被清空

---

### Requirement: 环境变量隔离

系统 SHALL 支持测试级环境变量隔离，防止环境变量污染。

#### Scenario: 设置测试环境变量

- **WHEN** 调用 `setTestEnv('API_KEY', 'test-key')`
- **THEN** 系统 `import.meta.env.API_KEY` 返回 `'test-key'`
- **AND** 其他测试不受影响

#### Scenario: 重置环境变量

- **WHEN** 测试结束
- **THEN** 系统环境变量恢复原值

---

### Requirement: 隔离验证工具

系统 SHALL 提供 `verifyIsolation()` 函数，用于验证测试是否正确隔离。

#### Scenario: 检测状态泄漏

- **WHEN** 调用 `verifyIsolation()` 检测到全局状态变化
- **THEN** 系统抛出警告，提示可能的状态泄漏

#### Scenario: 隔离验证通过

- **WHEN** 调用 `verifyIsolation()` 未检测到状态变化
- **THEN** 系统无警告输出

---

### Requirement: 并发测试隔离

系统 SHALL 确保并发执行的测试互不影响。

#### Scenario: 并发测试独立性

- **WHEN** 多个测试并发执行并修改相同 Mock
- **THEN** 每个测试看到自己配置的 Mock 状态
- **AND** 测试结果不因执行顺序改变
