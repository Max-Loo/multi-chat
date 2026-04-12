# Keyring 公开 API 规范

本规范定义了 Keyring 兼容层的公开 API 接口和统一实例导出。

## Purpose

定义 `KeyringPublicAPI` 接口，将 Keyring 兼容层封装为统一的 `keyring` 实例导出，消除独立的浅模块转发函数。

## Requirements

### Requirement: Keyring 公开 API 实例导出
系统 SHALL 导出受 `KeyringPublicAPI` 接口约束的 `keyring` 实例作为统一入口，替代多个独立转发函数。

#### Scenario: 导出 keyring 实例
- **WHEN** 开发者从 `@/utils/tauriCompat/keyring` 导入
- **THEN** 系统 SHALL 导出名为 `keyring` 的对象
- **AND** 该对象 SHALL 实现 `KeyringPublicAPI` 接口
- **AND** 该接口 SHALL 包含 `setPassword`、`getPassword`、`deletePassword`、`isSupported`、`resetState` 方法

#### Scenario: Tauri 环境 keyring 实例行为
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 调用 `keyring.setPassword(service, user, password)`
- **THEN** 系统 SHALL 调用 `@tauri-plugin-keyring-api` 的原生实现

#### Scenario: Web 环境 keyring 实例行为
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用 `keyring.setPassword(service, user, password)`
- **THEN** 系统 SHALL 使用 IndexedDB + AES-256-GCM 加密存储

### Requirement: resetState 多态方法
系统 SHALL 通过 `KeyringPublicAPI.resetState()` 方法提供重置功能，内部通过多态分发实现，不暴露 `instanceof` 检查。

#### Scenario: Web 环境重置状态
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用 `keyring.resetState()`
- **THEN** 系统 SHALL 关闭 IndexedDB 连接并清除加密密钥缓存

#### Scenario: Tauri 环境重置状态
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 调用 `keyring.resetState()`
- **THEN** 操作 SHALL 为空操作（no-op），不抛出错误

#### Scenario: 迁移后调用 resetState
- **WHEN** `keyringMigration` 完成迁移后调用 `keyring.resetState()`
- **THEN** 系统 SHALL 强制下次访问时重新初始化内部状态
