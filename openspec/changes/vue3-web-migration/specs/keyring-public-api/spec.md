# Spec Delta

## ADDED Requirements

### Requirement: Keyring 公开 API 统一实例导出

系统 SHALL 导出受 `KeyringPublicAPI` 接口约束的 `keyring` 实例作为统一入口，替代多个独立转发函数。

#### Scenario: 导出 keyring 实例

- **WHEN** 开发者从 `@/utils/webRuntime/keyring` 导入
- **THEN** 系统 SHALL 导出名为 `keyring` 的对象
- **AND** 该对象 SHALL 实现 `KeyringPublicAPI` 接口
- **AND** 该接口 SHALL 包含 `setPassword`、`getPassword`、`deletePassword`、`isSupported`、`resetState` 方法

#### Scenario: keyring 实例行为

- **WHEN** 调用 `keyring.setPassword(service, user, password)`
- **THEN** 系统 SHALL 使用 IndexedDB + AES-256-GCM 加密存储

### Requirement: resetState 状态重置方法

系统 SHALL 通过 `KeyringPublicAPI.resetState()` 方法提供重置功能。

#### Scenario: 重置状态

- **WHEN** 调用 `keyring.resetState()`
- **THEN** 系统 SHALL 关闭 IndexedDB 连接并清除加密密钥缓存

#### Scenario: 迁移后调用 resetState

- **WHEN** `keyringMigration` 完成迁移后调用 `keyring.resetState()`
- **THEN** 系统 SHALL 强制下次访问时重新初始化内部状态

## REMOVED Requirements

### Requirement: Keyring 公开 API 实例导出
**Reason**: 原含"Tauri 环境 keyring 实例行为"与"Web 环境 keyring 实例行为"双环境场景；Tauri 桌面端移除后仅存在 Web 实现，场景合并为单一行为，故以更新后的同名 requirement 整体替换。
**Migration**: 上方 ADDED 的同名 requirement 保持 `KeyringPublicAPI` 接口形状不变，调用方无需修改。

### Requirement: resetState 多态方法
**Reason**: 原含"Tauri 环境重置状态"（no-op）场景；Tauri 移除后 resetState 仅保留真实重置行为，不再需要多态分发，故以更新后的同名 requirement 整体替换。
**Migration**: 上方 ADDED 的同名 requirement 保持方法签名与调用时机不变。
