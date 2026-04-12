## Why

项目中 `keyring.ts` 和 `storeUtils.ts` 存在浅模块（Shallow Module）问题：接口与实现复杂度几乎相同，转发函数不提供任何附加价值。`keyring.ts` 尾部 5 个函数仅做 `return keyringCompat.xxx()`，`storeUtils.ts` 中的 `SettingStore` 类 6 个方法中有 5 个纯转发，且在生产代码中零调用。此外 `resetWebKeyringState()` 使用 `instanceof` 检查暴露了内部实现类型（信息泄漏）。这些浅模块增加了认知负荷、放大变更传播，但未提供任何保护。

## What Changes

- **BREAKING** 删除 `keyring.ts` 中的 5 个转发函数（`setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`、`resetWebKeyringState`），替换为受类型约束的 `keyring` 实例导出
- **BREAKING** 将 `resetWebKeyringState()` 的职责收入 `KeyringPublicAPI.resetState()`，通过多态分发消除 `instanceof` 检查
- **BREAKING** 删除 `storeUtils.ts` 中的 `SettingStore` 类和 `settingStore` 导出（生产代码零调用）
- 更新 `tauriCompat/index.ts` barrel export，收敛为 `keyring` 实例导出
- 更新所有调用方的 import 路径

## Capabilities

### New Capabilities

- `keyring-public-api`: 统一的 Keyring 公开 API 接口，受类型约束的实例导出，包含 `resetState()` 多态方法

### Modified Capabilities

- `web-keyring-compat`: 导出方式从独立函数改为受约束的实例导出
- `web-store-compat`: 删除未使用的 `SettingStore` 薄包装类
- `tauri-plugin-web-compat`: barrel export 收敛，不再暴露实现类

## Impact

- **API 变更**：`import { setPassword }` → `import { keyring }` 后调用 `keyring.setPassword()`
- **API 变更**：`resetWebKeyringState()` → `keyring.resetState()`
- **API 变更**：`isKeyringSupported()` → `keyring.isSupported()`
- **API 删除**：`settingStore` 导出被移除
- **受影响文件**：`src/utils/tauriCompat/keyring.ts`、`src/utils/tauriCompat/index.ts`、`src/store/storage/storeUtils.ts`、`src/store/keyring/masterKey.ts`、`src/utils/tauriCompat/keyringMigration.ts`、`src/__test__/setup.ts`、`src/__test__/utils/tauriCompat/keyring.test.ts`、`src/__test__/helpers/mocks/tauri.ts`、`src/__test__/helpers/mocks/types.ts`、`docs/design/cross-platform.md` 及相关测试文件
