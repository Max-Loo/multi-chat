# unified-mock-factory Spec

## Purpose

提供统一的 Mock 工厂函数系统，用于创建标准化的 Mock 实例，支持 Tauri API、加密、存储等常见模块的 Mock，确保测试代码的一致性和可维护性。

## ADDED Requirements

### Requirement: 创建 Tauri API Mock 工厂

系统 SHALL 提供 `createTauriMocks()` 函数，用于创建 Tauri 兼容层的标准化 Mock 实例。

#### Scenario: 创建默认 Tauri Mock

- **WHEN** 调用 `createTauriMocks()` 不传入参数
- **THEN** 系统返回包含 `shell`、`os`、`http`、`store`、`keyring` 的 Mock 对象
- **AND** 所有 Mock 函数初始状态为空的 `vi.fn()`

#### Scenario: 创建 Web 环境 Mock

- **WHEN** 调用 `createTauriMocks({ isTauri: false })`
- **THEN** 系统返回 `isTauri()` 返回 `false` 的 Mock 配置

#### Scenario: 创建 Tauri 环境 Mock

- **WHEN** 调用 `createTauriMocks({ isTauri: true })`
- **THEN** 系统返回 `isTauri()` 返回 `true` 的 Mock 配置

---

### Requirement: 创建加密模块 Mock 工厂

系统 SHALL 提供 `createCryptoMocks()` 函数，用于创建加密相关模块的 Mock 实例。

#### Scenario: 创建加密 Mock

- **WHEN** 调用 `createCryptoMocks()`
- **THEN** 系统返回包含 `encryptField`、`decryptField`、`isEncrypted` 的 Mock 对象

#### Scenario: Mock 加密返回指定值

- **WHEN** 设置 `encryptField.mockResolvedValue('enc:test')` 并调用加密函数
- **THEN** 系统返回 `'enc:test'`

---

### Requirement: 创建存储模块 Mock 工厂

系统 SHALL 提供 `createStorageMocks()` 函数，用于创建存储相关模块的 Mock 实例。

#### Scenario: 创建存储 Mock

- **WHEN** 调用 `createStorageMocks()`
- **THEN** 系统返回包含 `createLazyStore`、`saveToStore`、`loadFromStore` 的 Mock 对象

#### Scenario: Mock 存储读取

- **WHEN** 设置 `loadFromStore.mockResolvedValue([{ id: '1' }])` 并调用加载函数
- **THEN** 系统返回 `[{ id: '1' }]`

---

### Requirement: Mock 工厂支持重置

系统 SHALL 在每个 Mock 工厂返回对象中提供 `resetAll()` 方法，用于重置所有 Mock 状态。

#### Scenario: 重置所有 Mock

- **WHEN** 调用 `mocks.resetAll()`
- **THEN** 系统清空所有 Mock 的调用记录和返回值配置

---

### Requirement: Mock 工厂支持配置更新

系统 SHALL 在每个 Mock 工厂返回对象中提供 `configure()` 方法，用于运行时更新 Mock 配置。

#### Scenario: 更新 Mock 配置

- **WHEN** 调用 `mocks.configure({ isTauri: false })`
- **THEN** 系统 `isTauri()` Mock 返回 `false`

---

### Requirement: 模块化 Mock 导出

系统 SHALL 支持按模块导入单独的 Mock 工厂函数。

#### Scenario: 导入单个 Mock 工厂

- **WHEN** 从 `@/test-helpers/mocks` 导入 `createTauriMocks`
- **THEN** 系统仅导入 Tauri 相关 Mock 工厂

#### Scenario: 导入所有 Mock 工厂

- **WHEN** 从 `@/test-helpers/mocks` 导入 `*`
- **THEN** 系统导入所有可用的 Mock 工厂函数
