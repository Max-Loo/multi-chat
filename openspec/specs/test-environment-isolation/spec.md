# test-environment-isolation Spec

## Purpose

提供测试环境隔离机制，确保每个测试用例独立运行，提供统一的测试前后清理钩子、状态重置工具，防止测试间相互影响。

## Requirements

### Requirement: 测试状态重置函数

系统 SHALL 提供异步的 `resetTestState()` 函数，返回 `Promise<void>`，用于重置所有测试相关的全局状态，确保异步清理操作完成后再返回。

#### Scenario: 重置 localStorage

- **WHEN** 调用 `await resetTestState()`
- **THEN** 系统 `localStorage` 被清空

#### Scenario: 重置 Mock 调用记录

- **WHEN** 调用 `await resetTestState()`
- **THEN** 系统所有 `vi.fn()` Mock 的调用记录被清空

#### Scenario: 重置模块缓存

- **WHEN** 调用 `await resetTestState({ resetModules: true })`
- **THEN** 系统 Vitest 模块缓存被重置

#### Scenario: 重置 IndexedDB（默认启用）

- **WHEN** 调用 `await resetTestState()`（不传 resetIndexedDB 参数）
- **THEN** 系统 IndexedDB 中所有数据库被删除
- **AND** 清理操作在函数返回前已完成（非 fire-and-forget）

#### Scenario: 显式禁用 IndexedDB 清理

- **WHEN** 调用 `await resetTestState({ resetIndexedDB: false })`
- **THEN** 系统 IndexedDB 不被清理

#### Scenario: IndexedDB 清理的 fallback 策略

- **WHEN** 调用 `await resetTestState()` 且 `indexedDB.databases()` 不可用或抛出异常
- **THEN** 系统使用硬编码数据库名列表逐个删除：`['multi-chat-store', 'multi-chat-keyring']`（对应业务代码 `src/utils/tauriCompat/store.ts` 和 `src/utils/tauriCompat/keyring.ts` 中的定义）
- **AND** 不抛出异常

---

### Requirement: 隔离钩子函数

系统 SHALL 提供 `useIsolatedTest()` 函数，自动配置异步的 `beforeEach` 和 `afterEach` 清理钩子，确保异步重置完成后才进入测试。自定义回调 SHALL 支持 `() => void | Promise<void>` 类型。

#### Scenario: 自动配置清理钩子

- **WHEN** 调用 `useIsolatedTest()`
- **THEN** 系统自动在每个测试前后 `await` 执行状态重置

#### Scenario: 自定义清理逻辑

- **WHEN** 调用 `useIsolatedTest({ onAfterEach: customCleanup })`
- **THEN** 系统 `afterEach` 执行默认清理后 `await` 执行 `customCleanup`

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

系统 SHALL 提供异步的 `verifyIsolation()` 函数，返回 `Promise<boolean>`，用于验证测试是否正确隔离，覆盖 localStorage 和 IndexedDB 两个维度。

#### Scenario: 检测 localStorage 泄漏

- **WHEN** 调用 `await verifyIsolation()` 时 `localStorage.length > 0`
- **THEN** 系统返回 `false` 并输出警告

#### Scenario: 检测 IndexedDB 泄漏

- **WHEN** 调用 `await verifyIsolation()` 时 IndexedDB 中存在未清理的数据库
- **THEN** 系统返回 `false` 并输出警告

#### Scenario: IndexedDB 检查的 fallback 策略

- **WHEN** 调用 `await verifyIsolation()` 且 `indexedDB.databases()` 不可用或抛出异常
- **THEN** 系统跳过 IndexedDB 检查（仅检查 localStorage），不抛出异常

#### Scenario: 隔离验证通过

- **WHEN** 调用 `await verifyIsolation()` 时 localStorage 为空且 IndexedDB 为空
- **THEN** 系统返回 `true` 且无警告输出

---

### Requirement: 并发测试隔离

系统 SHALL 确保并发执行的测试互不影响。

#### Scenario: 并发测试独立性

- **WHEN** 多个测试并发执行并修改相同 Mock
- **THEN** 每个测试看到自己配置的 Mock 状态
- **AND** 测试结果不因执行顺序改变
