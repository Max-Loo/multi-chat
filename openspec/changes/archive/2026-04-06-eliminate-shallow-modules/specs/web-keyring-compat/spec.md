## MODIFIED Requirements

### Requirement: Keyring 插件兼容层
系统 SHALL 为 `@tauri-plugin-keyring-api` 提供统一的兼容层 API，以受约束的 `keyring` 实例形式导出，在 Tauri 和 Web 环境中均可用。

#### Scenario: Tauri 环境使用原生实现
- **GIVEN** 应用运行在 Tauri 桌面环境
- **WHEN** 调用 `keyring.setPassword()`、`keyring.getPassword()`、`keyring.deletePassword()`
- **THEN** 系统调用 `@tauri-plugin-keyring-api` 的原生实现
- **AND** 密钥存储到系统级安全存储（macOS Keychain、Windows DPAPI、Linux Secret Service）

#### Scenario: Web 环境使用 IndexedDB 实现
- **GIVEN** 应用运行在 Web 浏览器环境
- **WHEN** 调用 `keyring.setPassword()`、`keyring.getPassword()`、`keyring.deletePassword()`
- **THEN** 系统使用 IndexedDB 实现加密存储
- **AND** 不抛出运行时错误
- **AND** 返回类型与 Tauri 环境保持一致

#### Scenario: API 一致性
- **WHEN** 使用 `keyring` 实例的 Keyring API
- **THEN** 函数签名和行为与 `@tauri-plugin-keyring-api` 的原生 API 保持一致
- **AND** 调用者无需修改代码即可在不同环境中运行

#### Scenario: 通过 barrel export 访问
- **WHEN** 开发者使用 `import { keyring } from '@/utils/tauriCompat'`
- **THEN** 系统 SHALL 提供 `KeyringPublicAPI` 类型的 `keyring` 实例
- **AND** 不再导出独立的 `setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`、`resetWebKeyringState` 函数

## REMOVED Requirements

### Requirement: 独立转发函数导出
**Reason**: 这些函数（`setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`）仅转发到内部 `keyringCompat` 实例，不增加任何价值。统一为 `keyring` 实例导出后，消除了浅模块层。
**Migration**: 将 `import { setPassword } from '@/utils/tauriCompat'` 改为 `import { keyring } from '@/utils/tauriCompat/keyring'`，然后调用 `keyring.setPassword(...)`

### Requirement: resetWebKeyringState 函数
**Reason**: 使用 `instanceof WebKeyringCompat` 检查暴露了内部实现类型（信息泄漏）。职责已收入 `keyring.resetState()` 多态方法。
**Migration**: 将 `import { resetWebKeyringState } from './keyring'` 改为 `import { keyring } from './keyring'`，然后调用 `keyring.resetState()`
