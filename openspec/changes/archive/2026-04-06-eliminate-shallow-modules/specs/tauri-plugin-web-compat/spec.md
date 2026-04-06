## MODIFIED Requirements

### Requirement: Keyring 插件兼容层 barrel export
系统 SHALL 在 `tauriCompat/index.ts` 中导出 `keyring` 实例和 `KeyringPublicAPI` 类型，不再导出实现类和独立函数。

#### Scenario: Keyring 相关 barrel export
- **WHEN** 开发者从 `@/utils/tauriCompat` 导入 Keyring 相关 API
- **THEN** 系统 SHALL 导出 `keyring` 实例（`KeyringPublicAPI` 类型）
- **AND** 系统 SHALL 导出 `KeyringPublicAPI` 类型
- **AND** 系统 SHALL NOT 导出 `setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`、`resetWebKeyringState` 独立函数
- **AND** 系统 SHALL NOT 通过 barrel export 暴露 `WebKeyringCompat`、`TauriKeyringCompat` 实现类（测试文件直接从 `./keyring` 路径导入）

#### Scenario: 其他兼容层 barrel export 不变
- **WHEN** 开发者从 `@/utils/tauriCompat` 导入其他模块（isTauri、Command、shell、locale、fetch 等）
- **THEN** 导出行为 SHALL 保持不变
