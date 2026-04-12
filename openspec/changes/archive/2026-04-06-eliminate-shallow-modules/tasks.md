## 1. Keyring 公开 API 重构

- [x] 1.1 在 `src/utils/tauriCompat/keyring.ts` 中定义 `KeyringPublicAPI` 接口（含 `setPassword`、`getPassword`、`deletePassword`、`isSupported`、`resetState`）
- [x] 1.2 实现 `createKeyringAPI` 工厂函数，通过 duck typing 分发 `resetState`（Web 环境调用 `resetState()`，Tauri 环境为空操作）
- [x] 1.3 创建并导出 `keyring` 实例，删除尾部 5 个转发函数（`setPassword`、`getPassword`、`deletePassword`、`isKeyringSupported`、`resetWebKeyringState`）及对应 JSDoc

## 2. 调用方迁移

- [x] 2.1 修改 `src/store/keyring/masterKey.ts`：将 `import { getPassword, setPassword }` 改为 `import { keyring }`，更新所有调用为 `keyring.getPassword()` / `keyring.setPassword()`
- [x] 2.2 修改 `src/utils/tauriCompat/keyringMigration.ts`：将 `import { resetWebKeyringState }` 改为 `import { keyring }`，更新调用为 `keyring.resetState()`

## 3. Barrel export 收敛

- [x] 3.1 修改 `src/utils/tauriCompat/index.ts`：Keyring 导出从独立函数改为 `{ keyring, type KeyringPublicAPI }`，保留 `type { KeyringCompat }`，更新 JSDoc 示例（`isKeyringSupported` → `keyring.isSupported`）

## 4. 删除 SettingStore 薄包装类

- [x] 4.1 删除 `src/store/storage/storeUtils.ts` 中的 `SettingStore` 类（第 11-73 行）和 `settingStore` 导出（第 139 行），保留 `createLazyStore`、`saveToStore`、`loadFromStore`

## 5. 测试同步

- [x] 5.1 修改 `src/__test__/store/keyring/masterKey.test.ts`：将 `import { keyringCompat }` 改为 `import { keyring }`，更新所有 spy 为 `vi.spyOn(keyring, ...)`
- [x] 5.2 修改 `src/__test__/utils/tauriCompat/keyring.test.ts`：将 `isKeyringSupported` 测试改为 `keyring.isSupported` 测试，删除对独立转发函数的测试，新增对 `keyring` 实例导出和 `KeyringPublicAPI` 接口的测试
- [x] 5.3 修改 `src/__test__/setup.ts`：删除 mock 中 `settingStore` 的 shape 定义，更新 `keyring` 相关 mock（如有）
- [x] 5.4 修改 `src/__test__/helpers/mocks/tauri.ts`：将 `isKeyringSupported` 改为 `isSupported`
- [x] 5.5 修改 `src/__test__/helpers/mocks/types.ts`：将 `isKeyringSupported: Mock` 改为 `isSupported: Mock`
- [x] 5.6 清理测试 mock 中残留的 `settingStore: {}` 引用（`modelSlice.test.ts`、`chatSlices.test.ts`、`app-loading.integration.test.ts`）
- [x] 5.7 运行全量测试确认无回归：`pnpm test`

## 6. 文档同步

- [x] 6.1 更新 `docs/design/cross-platform.md`：将 `isKeyringSupported` 引用改为 `keyring.isSupported`，更新 import 示例
